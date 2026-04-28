/**
 * ============================================================
 * LIFEOS — DATA.JS
 * Arquivo: js/core/data.js
 * Função: Stores globais de dados. Apenas estruturas vazias.
 *         Os dados reais chegam pelo backend (api.js).
 *         Os dados mock chegam pelo app.js (modo offline).
 *         NUNCA coloque lógica aqui — só declarações.
 * ============================================================
 */

'use strict';

// ── USUÁRIO AUTENTICADO ──────────────────────────────────────
// Preenchido pelo auth guard do index.html via /api/user
const USER = {
  id:              '',
  name:            '',
  initials:        '',
  email:           '',
  plan:            'free',
  avatar_url:      null,
  progress:        0,
  weekStatus:      '',
  memberSince:     '',
  bio:             '',
  profession:      '',
  focusScore:      0,
  energyLevel:     5,
  level:           1,
  totalXP:         0,
  streak:          0,
  onboarding_done: false,
  theme:           'light',
  aiPersonality:   'coach_motivacional',
  // Localização — preenchida pelo LOCALE (config.js)
  timezone:        '',
  lang:            '',
  currency:        'BRL',
};

// ── CHECK-IN DO DIA ──────────────────────────────────────────
// Estrutura completa com 3 tipos de perguntas:
// 1. Fechadas (sim/não/parcial)
// 2. Abertas (reflexão textual)
// 3. Adaptativas (geradas pela IA com base na profissão)
let CHECKIN_TODAY = {
  done:    false,
  answers: {},          // { q_dash: 'sim', q_hab: 'nao', ... }
  openAnswers: {},      // { oq_aproximou: 'Texto livre...', ... }
  adaptiveAnswers: {},  // { aq_horas: '2', aq_codigo: 'sim', ... }
  timestamp: null,

  // ── Perguntas fechadas (fixas — não mudam) ────────────────
  questions: [
    { id:'q_dash',   mod:'Dashboard',     text:'Você completou suas tarefas principais hoje?' },
    { id:'q_hab',    mod:'Hábitos',       text:'Você manteve seus hábitos hoje?' },
    { id:'q_ener',   mod:'Energia',       text:'Você descansou adequadamente hoje?' },
    { id:'q_proj',   mod:'Projetos',      text:'Você avançou em algum projeto hoje?' },
    { id:'q_aprend', mod:'Aprendizado',   text:'Você aprendeu algo novo hoje?' },
    { id:'q_fin',    mod:'Finanças',      text:'Você registrou ou controlou seus gastos hoje?' },
    { id:'q_prod',   mod:'Produtividade', text:'Você manteve foco nas tarefas importantes?' },
  ],

  // ── Perguntas abertas (reflexão diária) ───────────────────
  openQuestions: [
    { id:'oq_aproximou',   text:'O que você fez hoje que te aproximou dos seus objetivos?',   placeholder:'Ex: Estudei 2h de React...' },
    { id:'oq_dificuldade', text:'Qual foi o maior desafio do dia?',                            placeholder:'Ex: Tive dificuldade em me concentrar...' },
    { id:'oq_diferente',   text:'O que você faria diferente se pudesse repetir o dia?',        placeholder:'Ex: Evitaria redes sociais pela manhã...' },
    { id:'oq_produtivo',   text:'Em qual momento você foi mais produtivo?',                    placeholder:'Ex: Das 10h às 12h, no bloco de foco...' },
    { id:'oq_atrapalhou',  text:'O que mais atrapalhou seu foco hoje?',                        placeholder:'Ex: Notificações e reuniões desnecessárias...' },
    { id:'oq_amanha',      text:'O que você vai fazer diferente amanhã?',                      placeholder:'Ex: Acordar mais cedo e planejar melhor...' },
  ],

  // ── Perguntas adaptativas (geradas pela IA) ───────────────
  // Estas mudam de acordo com a profissão do usuário
  adaptiveQuestions: [
    { id:'aq_horas',  mod:'Adaptativo 🤖', text:'Quantas horas você dedicou à sua atividade principal hoje?', type:'number', unit:'horas', placeholder:'0' },
    { id:'aq_codigo', mod:'Adaptativo 🤖', text:'Você conseguiu avançar no seu projeto principal hoje?',      type:'yesno'  },
    { id:'aq_skill',  mod:'Adaptativo 🤖', text:'Você evoluiu em alguma habilidade hoje?',                    type:'yesno'  },
  ],
};

// ── LEMBRETE DO DIA ──────────────────────────────────────────
let DAILY_REMINDER = { text: '', time: '', active: false };

// ── PENDÊNCIAS DE CHECK-IN ────────────────────────────────────
// Dias em que o check-in não foi feito (últimos 7 dias)
let PENDENCIES = [];

// ── LISTAS DE DADOS ──────────────────────────────────────────
// Todas começam vazias. São preenchidas por:
//   1. LifeOSAPI.loadAll() quando backend está disponível
//   2. Dados mock em app.js quando offline
const NOTIFICATIONS = [];  // { id, title, message, unread, time }
const TASKS         = [];  // { id, title, tag, priority, due, done }
const HABITS        = [];  // { id, name, icon, goal, unit, streak, days[] }
const ROUTINE       = [];  // { id, time, text, cat, done }
const GOALS         = [];  // { id, title, cat, current, total, unit, pct }
const WEEKLY        = [];  // { day, pct }
const METRICS       = [];  // { label, value, unit, up, pct, delta }
const FINANCES      = [];  // { cat, icon, budget, spent }
const NOTES         = [];  // { id, title, text, tags, date }
const AGENDA_EVENTS = [];  // { id, date, time, dur, title, cat, note }
const CAL_EVENTS    = [];  // legado — usar AGENDA_EVENTS

// ── SAÚDE / SONO / NUTRIÇÃO ──────────────────────────────────
const HEALTH = {
  steps: 0, stepGoal: 10000,
  heartRate: 0, hrMin: 0, hrMax: 0,
  water: 0, waterGoal: 2.0,
  calories: 0, calGoal: 2200,
};

const SLEEP = {
  avg: 0, goal: 8, week: [],
  tips: [
    'Evite telas 1h antes de dormir',
    'Mantenha horário fixo de acordar',
    'Quarto escuro e fresco (18–20°C)',
    'Evite cafeína após 14h',
  ],
};

const NUTRITION = {
  calories: { current: 0, goal: 2000 },
  protein:  { current: 0, goal: 120, u: 'g' },
  carbs:    { current: 0, goal: 250, u: 'g' },
  fat:      { current: 0, goal: 70,  u: 'g' },
  meals:    [],
};

// ── MÓDULOS DO CAROUSEL ──────────────────────────────────────
// Perfil e Configurações REMOVIDOS do carousel (ficam no hamburger ☰)
const MODULES = [
  { id:'dashboard',      label:'Dashboard',          icon:'⊞',  color:'#a855f7' },
  { id:'lifeos-dash',    label:'Analytics',          icon:'📊', color:'#a855f7' },
  { id:'checkin',        label:'Check-in',           icon:'🌙', color:'#c084fc' },
  { id:'rotina',         label:'Rotina',             icon:'✦',  color:'#a855f7' },
  { id:'habitos',        label:'Hábitos',            icon:'⚡', color:'#7eb8a4' },
  { id:'plano',          label:'Plano IA',           icon:'📋', color:'#a855f7' },
  { id:'metas',          label:'Metas',              icon:'🎯', color:'#2EB67D' },
  { id:'financas',       label:'Finanças',           icon:'💰', color:'#4361EE' },
  { id:'energia-mental', label:'Energia',            icon:'⚡', color:'#a855f7' },
  { id:'notas',          label:'Agenda',             icon:'📅', color:'#f59e0b' },
  { id:'exportar',       label:'Exportar',           icon:'↓',  color:'#a855f7' },
  { id:'feedback',       label:'Feedback',           icon:'💬', color:'#f59e0b' },
  { id:'suporte',        label:'Suporte',            icon:'🆘', color:'#8b5cf6' },
];

// ── ESTADO DE NAVEGAÇÃO ──────────────────────────────────────
let activeModule = 'dashboard';

// ── MAPA DE TAGS ─────────────────────────────────────────────
const TAG = {
  trabalho: 'tag-blue',  estudo:  'tag-purple',
  saúde:    'tag-green', pessoal: 'tag-gray',
  finanças: 'tag-purple', ideias: 'tag-blue',
  reflexão: 'tag-gray',  livro:  'tag-orange',
};
const CAT_C = {
  trabalho: '#a855f7', estudo:  '#c084fc',
  saúde:    '#10b981', pessoal: '#f59e0b',
};
