/* ═══════════════════════════════════════════════════════════════
   MÓDULO: CHECK-IN DO DIA
   Perguntas diárias de check-in, pendências e progresso.
═══════════════════════════════════════════════════════════════ */
'use strict';

function renderCheckin(s) {
  const answeredCount = Object.keys(CHECKIN_TODAY.answers).length;
  const progressPct   = Math.round((answeredCount / CHECKIN_TODAY.questions.length) * 100);

  s.innerHTML = `
  <div class="mod mod-narrow">
    <div class="sec-header">
      <div>
        <h2 class="mod-title">Check-in do Dia</h2>
        <p class="mod-sub">Balanço do dia e evolução</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:.65rem; font-weight:800; color:var(--t3); text-transform:uppercase; margin-bottom:.3rem">Progresso</p>
        <p style="font-size:1.1rem; font-weight:800">${answeredCount} / ${CHECKIN_TODAY.questions.length}</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="bar-track" style="height:8px">
        <div class="bar-fill" data-bar="${progressPct}"></div>
      </div>
    </div>

    ${CHECKIN_TODAY.done ? `
      <div class="card" style="text-align:center; padding:3rem 1rem">
        <span style="font-size:3rem">✨</span>
        <h3 style="font-size:1.4rem; font-weight:800; margin-top:1rem">Dia Registrado!</h3>
        <p style="color:var(--t3); margin-top:.5rem">Obrigado por manter sua disciplina. Seus indicadores foram atualizados.</p>
        <button class="btn btn-outline" style="margin-top:2rem" onclick="CHECKIN_TODAY.done=false; renderModule('checkin')">Refazer Check-in</button>
      </div>
    ` : `
      <div id="checkin-questions-list">
        ${CHECKIN_TODAY.questions.map(q => `
          <div class="card checkin-q-card">
            <p class="tag tag-purple" style="margin-bottom:.5rem">${q.mod}</p>
            <p class="q-title">${q.text}</p>
            <div class="q-options">
              <button class="q-btn ${CHECKIN_TODAY.answers[q.id] === 'sim'     ? 'active' : ''}" onclick="answerCheckin('${q.id}','sim')">Sim</button>
              <button class="q-btn ${CHECKIN_TODAY.answers[q.id] === 'parcial' ? 'active' : ''}" onclick="answerCheckin('${q.id}','parcial')">Parcialmente</button>
              <button class="q-btn ${CHECKIN_TODAY.answers[q.id] === 'nao'     ? 'active' : ''}" onclick="answerCheckin('${q.id}','nao')">Não</button>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary" style="width:100%; height:48px; font-size:1rem" onclick="finishCheckin()">Finalizar Registro do Dia</button>
    `}

    <div class="card" style="margin-top:2rem">
      <p class="card-title">Pendências Acumuladas</p>
      ${PENDENCIES.length === 0
        ? '<p style="font-size:.8rem; color:var(--t3)">Nenhuma pendência. Parabéns!</p>'
        : PENDENCIES.map(p => `
          <div class="sum-row">
            <span class="sum-lbl">${p.date}</span>
            <span class="tag tag-orange">${p.status}</span>
          </div>`).join('')
      }
    </div>
  </div>`;
}

/* ─── RESPONDER PERGUNTA ─────────────────────────────────── */
window.answerCheckin = function (id, val) {
  CHECKIN_TODAY.answers[id] = val;
  LifeOSAPI.saveCheckinAnswer(id, val).catch(() => {});
  renderModule('checkin');
};

/* ─── FINALIZAR CHECK-IN ─────────────────────────────────── */
window.finishCheckin = function () {
  const answeredCount = Object.keys(CHECKIN_TODAY.answers).length;
  if (answeredCount < CHECKIN_TODAY.questions.length) {
    showToast('Por favor, responda todas as perguntas.');
    return;
  }
  CHECKIN_TODAY.done      = true;
  CHECKIN_TODAY.timestamp = new Date();
  if (PENDENCIES.length > 0) PENDENCIES.shift();
  LifeOSAPI.saveCheckin(CHECKIN_TODAY.answers).catch(() => {});
  showToast('Check-in concluído! 💜');
  renderModule('checkin');
  checkCheckinAlert();
};
