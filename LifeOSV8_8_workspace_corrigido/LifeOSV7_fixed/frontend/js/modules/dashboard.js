/* ═══════════════════════════════════════════════════════════════
   MÓDULO: DASHBOARD
   Tela principal com hero ring, métricas, atalhos e consistência.
═══════════════════════════════════════════════════════════════ */
'use strict';

function renderDashboard(s) {
  const checkinPenalty  = PENDENCIES.length * 5;
  const displayProgress = Math.max((USER.progress || 0) - (CHECKIN_TODAY.done ? 0 : checkinPenalty), 0);
  const circ   = 2 * Math.PI * 44;
  const offset = circ * (1 - displayProgress / 100);
  const isDark     = document.body.classList.contains('dark-theme');
  const ringColor  = isDark ? '#a855f7' : '#000000';
  const ringFilter = isDark ? 'drop-shadow(0 0 10px rgba(168,85,247,0.6))' : 'none';

  s.innerHTML = `
  <div class="mod">

    <!-- LEMBRETE DE HOJE -->
    <div class="reminder-widget">
      <div class="reminder-header">
        <span class="reminder-title">Lembrete de Hoje ⚡</span>
        <span class="badge" style="background:var(--accent); color:#fff; border:none">${DAILY_REMINDER.time}</span>
      </div>
      <p style="font-size:.85rem; font-weight:600; color:var(--text)">${DAILY_REMINDER.text || 'Nenhum lembrete para hoje.'}</p>
      <button onclick="editReminder()" style="position:absolute; right:1rem; bottom:.8rem; font-size:.65rem; color:var(--t3); font-weight:700; background:none; border:none; cursor:pointer;">EDITAR</button>
    </div>

    <!-- HERO ROW -->
    <div class="hero-row">
      <div class="hero-text">
        <p class="hero-greet">Olá, ${(USER.name || '').split(' ')[0] || 'bem-vindo'} 👋</p>
        <h2 class="hero-headline">Você está em <span class="accent">${displayProgress}% do seu ritmo</span></h2>
        <p class="hero-sub">${USER.weekStatus} ${!CHECKIN_TODAY.done ? `<span style="color:var(--danger)">(-${checkinPenalty}% pendência)</span>` : ''}</p>
        <div class="hero-btns">
          <button class="btn btn-primary" onclick="showToast('IA gerando plano ajustado… 🤖')">Ajustar Plano com IA</button>
          <button class="btn btn-ghost" onclick="switchModule('lifeos-dash')">Ver evolução →</button>
        </div>
      </div>
      <div class="ring-wrap">
        <svg width="110" height="110" viewBox="0 0 110 110" style="transform:rotate(-90deg)">
          <circle cx="55" cy="55" r="44" fill="none" stroke="var(--bg-m)" stroke-width="7"/>
          <circle cx="55" cy="55" r="44" fill="none" stroke="${ringColor}" stroke-width="7"
            stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${circ.toFixed(1)}" data-ring="${offset.toFixed(1)}"
            style="transition:stroke-dashoffset 1.1s cubic-bezier(0.34,1.2,0.64,1);filter:${ringFilter}"/>
        </svg>
        <div class="ring-label">
          <span class="ring-num" id="ring-num">0%</span>
          <span class="ring-sub">semana</span>
        </div>
      </div>
    </div>

    <!-- MÉTRICAS -->
    <div class="metrics-row">
      ${METRICS.map(m => `
      <div class="metric-card">
        <p class="metric-lbl">${m.label}</p>
        <p class="metric-val">${m.value}<span class="metric-u"> ${m.unit}</span></p>
        <p class="metric-d ${m.up ? 'up' : 'down'}">${m.up ? '↑' : '↓'} ${m.delta}</p>
        <div class="bar-track"><div class="bar-fill" data-bar="${m.pct}" style="width:0%"></div></div>
      </div>`).join('')}
    </div>

    <!-- ATALHOS RÁPIDOS -->
    <div class="quick-row">
      ${[['rotina','⏰','Rotina'],['lifeos-dash','📈','Evolução'],['habitos','🔥','Hábitos'],['metas','🎯','Metas']].map(([id,ic,lb]) => `
      <button class="quick-card" onclick="switchModule('${id}')">
        <span style="font-size:1.3rem">${ic}</span>
        <span class="quick-lbl">${lb}</span>
        <span class="quick-arr">→</span>
      </button>`).join('')}
    </div>

    <!-- CONSISTÊNCIA DA SEMANA -->
    <div class="card">
      <p class="card-title">Consistência da Semana</p>
      ${svgBar(WEEKLY)}
    </div>

  </div>`;

  setTimeout(() => animNum($('ring-num'), displayProgress, 1100, v => `${v}%`), 200);
}

/* ─── EDITAR LEMBRETE ────────────────────────────────────── */
window.editReminder = function () {
  const text = prompt('O que você quer lembrar hoje?', DAILY_REMINDER.text);
  const time = prompt('Qual o horário?', DAILY_REMINDER.time);
  if (text !== null) DAILY_REMINDER.text = text;
  if (time !== null) DAILY_REMINDER.time = time;
  LifeOSAPI.saveReminder(DAILY_REMINDER.text, DAILY_REMINDER.time).catch(() => {});
  renderModule('dashboard');
  showToast('Lembrete atualizado ⚡');
};
