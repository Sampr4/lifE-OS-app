/**
 * LifeOS UI-only data store.
 * Empty structures only; empty UI-only data structures.
 */
'use strict';

const USER = {
  id:'', name:'', initials:'', email:'', plan:'Free', avatar_url:'',
  progress:0, weekStatus:'Aguardando conexão', memberSince:'', bio:'',
  profession:'', focusScore:0, energyLevel:0, level:0, totalXP:0, streak:0,
  onboarding_done:false, theme:'light', aiPersonality:'', timezone:'', lang:'pt-BR', currency:'BRL'
};

let CHECKIN_TODAY = {
  done:false, answers:{}, openAnswers:{}, adaptiveAnswers:{},
  timestamp:null, questions:[], openQuestions:[], adaptiveQuestions:[]
};
let DAILY_REMINDER = { text:'', time:'', active:false };
let PENDENCIES = [];

const NOTIFICATIONS = [];
const TASKS = [];
const HABITS = [];
const ROUTINE = [];
const GOALS = [];
const WEEKLY = [];
const METRICS = [];
const FINANCES = [];
const NOTES = [];
const AGENDA_EVENTS = [];
const CAL_EVENTS = AGENDA_EVENTS;

const HEALTH = { steps:0, stepGoal:0, heartRate:0, hrMin:0, hrMax:0, water:0, waterGoal:0, calories:0, calGoal:0 };
const SLEEP = { avg:0, goal:0, week:[], tips:[] };
const NUTRITION = {
  calories:{current:0,goal:0}, protein:{current:0,goal:0,u:'g'},
  carbs:{current:0,goal:0,u:'g'}, fat:{current:0,goal:0,u:'g'}, meals:[]
};

const MODULES = [
  { id:'dashboard', label:'Dashboard', icon:'⊞', color:'#a855f7' },
  { id:'lifeos-dash', label:'Analytics', icon:'📊', color:'#a855f7' },
  { id:'checkin', label:'Check-in', icon:'🌙', color:'#c084fc' },
  { id:'rotina', label:'Rotina', icon:'✦', color:'#a855f7' },
  { id:'habitos', label:'Hábitos', icon:'⚡', color:'#7eb8a4' },
  { id:'plano', label:'Plano IA', icon:'📋', color:'#a855f7' },
  { id:'metas', label:'Metas', icon:'🎯', color:'#2EB67D' },
  { id:'financas', label:'Finanças', icon:'💰', color:'#4361EE' },
  { id:'energia-mental', label:'Energia', icon:'⚡', color:'#a855f7' },
  { id:'notas', label:'Agenda', icon:'📅', color:'#f59e0b' },
  { id:'exportar', label:'Exportar', icon:'↓', color:'#a855f7' },
  { id:'feedback', label:'Feedback', icon:'💬', color:'#f59e0b' },
  { id:'suporte', label:'Suporte', icon:'🆘', color:'#8b5cf6' },
];

let activeModule = 'dashboard';
const TAG = {};
const CAT_C = {};
