/* ═══════════════════════════════════════════════════════════════
   MÓDULO: EXPORTAR
   Exportação de dados em CSV, JSON e Relatório Visual HTML.
═══════════════════════════════════════════════════════════════ */
'use strict';

function renderExportar(s) {
  s.innerHTML = `
  <div class="mod mod-narrow">
    <div class="sec-header">
      <div><h2 class="mod-title">Exportar Dados</h2><p class="mod-sub">Baixe seus dados em diferentes formatos</p></div>
    </div>

    <div class="card">
      <p class="card-title">Exportações Disponíveis</p>
      <div class="export-grid">

        <div class="export-row">
          <span class="exp-icon">📋</span>
          <div class="exp-info">
            <p class="exp-title">Tarefas (CSV)</p>
            <p class="exp-desc">Todas as suas tarefas com status, prioridade e categorias</p>
          </div>
          <button class="btn btn-outline" onclick="exportCSV(TASKS,'lifeos-tarefas.csv')">Baixar CSV</button>
        </div>

        <div class="export-row">
          <span class="exp-icon">🎯</span>
          <div class="exp-info">
            <p class="exp-title">Metas (CSV)</p>
            <p class="exp-desc">Progresso de todas as suas metas pessoais</p>
          </div>
          <button class="btn btn-outline" onclick="exportCSV(GOALS,'lifeos-metas.csv')">Baixar CSV</button>
        </div>

        <div class="export-row">
          <span class="exp-icon">💰</span>
          <div class="exp-info">
            <p class="exp-title">Finanças (CSV)</p>
            <p class="exp-desc">Gastos, orçamentos e categorias financeiras</p>
          </div>
          <button class="btn btn-outline" onclick="exportCSV(FINANCES,'lifeos-financas.csv')">Baixar CSV</button>
        </div>

        <div class="export-row">
          <span class="exp-icon">⚡</span>
          <div class="exp-info">
            <p class="exp-title">Hábitos (CSV)</p>
            <p class="exp-desc">Seu histórico de hábitos e sequências</p>
          </div>
          <button class="btn btn-outline" onclick="exportCSV(HABITS,'lifeos-habitos.csv')">Baixar CSV</button>
        </div>

        <div class="export-row">
          <span class="exp-icon">📊</span>
          <div class="exp-info">
            <p class="exp-title">Dados Completos (JSON)</p>
            <p class="exp-desc">Backup completo de todos os seus dados em formato JSON</p>
          </div>
          <button class="btn btn-primary" onclick="exportAllJSON()">Baixar JSON</button>
        </div>

        <div class="export-row">
          <span class="exp-icon">📄</span>
          <div class="exp-info">
            <p class="exp-title">Relatório Visual (PDF/HTML)</p>
            <p class="exp-desc">Relatório formatado para impressão ou exportação em PDF</p>
          </div>
          <button class="btn btn-primary" onclick="exportVisualReport()">Gerar Relatório</button>
        </div>

      </div>
    </div>

    <div class="card">
      <p class="card-title">Resumo dos Dados</p>
      <div class="summary-list">
        <div class="sum-row"><span class="sum-lbl">Tarefas</span><span class="sum-val">${TASKS.length} itens</span></div>
        <div class="sum-row"><span class="sum-lbl">Hábitos ativos</span><span class="sum-val">${HABITS.length} hábitos</span></div>
        <div class="sum-row"><span class="sum-lbl">Metas</span><span class="sum-val">${GOALS.length} metas</span></div>
        <div class="sum-row"><span class="sum-lbl">Categorias financeiras</span><span class="sum-val">${FINANCES.length} categorias</span></div>
        <div class="sum-row"><span class="sum-lbl">Eventos na agenda</span><span class="sum-val">${AGENDA_EVENTS.length} eventos</span></div>
      </div>
    </div>
  </div>`;
}

/* ─── EXPORTAR TUDO EM JSON ──────────────────────────────── */
function exportAllJSON() {
  const payload = {
    exportedAt: new Date().toISOString(),
    user:       USER,
    tasks:      TASKS,
    habits:     HABITS,
    routine:    ROUTINE,
    goals:      GOALS,
    weekly:     WEEKLY,
    metrics:    METRICS,
    finances:   FINANCES,
    health:     HEALTH,
    sleep:      SLEEP,
    nutrition:  NUTRITION,
    agenda:     AGENDA_EVENTS,
  };
  exportJSON(payload, 'lifeos-backup.json');
}

/* ─── RELATÓRIO VISUAL HTML ──────────────────────────────── */
window.exportVisualReport = function () {
  const win = window.open('', '_blank');
  const html = `
  <html>
  <head>
    <title>LifeOS — Relatório Visual</title>
    <style>
      body { font-family: sans-serif; padding: 40px; background: #fff; color: #000; }
      .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .card { border: 1px solid #eee; padding: 20px; border-radius: 8px; }
      h1 { margin: 0; font-size: 24px; letter-spacing: -1px; }
      h2 { font-size: 14px; text-transform: uppercase; color: #888; margin-bottom: 20px; }
      .metric { font-size: 32px; font-weight: 800; }
      .bar { height: 10px; background: #eee; border-radius: 5px; overflow: hidden; margin-top: 10px; }
      .fill { height: 100%; background: #a855f7; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { text-align: left; font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 1px solid #eee; padding: 10px 0; }
      td { padding: 12px 0; border-bottom: 1px solid #f9f9f9; font-size: 14px; }
      @media print { .no-print { display: none; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1>LifeOS Report</h1>
        <p>Usuário: ${USER.name} | Data: ${new Date().toLocaleDateString()}</p>
      </div>
      <button class="no-print" onclick="window.print()" style="padding:10px 20px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer">Imprimir / PDF</button>
    </div>
    <div class="grid">
      <div class="card">
        <h2>Produtividade Geral</h2>
        <div class="metric">${USER.progress}%</div>
        <div class="bar"><div class="fill" style="width:${USER.progress}%"></div></div>
      </div>
      <div class="card">
        <h2>Consistência Semanal</h2>
        <div style="display:flex; gap:10px; align-items:flex-end; height:60px">
          ${WEEKLY.map(w => `<div style="flex:1; background:#a855f7; height:${w.pct}%"></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:20px">
      <h2>Tarefas Atuais</h2>
      <table>
        <thead><tr><th>Tarefa</th><th>Categoria</th><th>Prioridade</th><th>Status</th></tr></thead>
        <tbody>
          ${TASKS.map(t => `<tr><td>${t.title}</td><td>${t.tag}</td><td>${t.priority}</td><td>${t.done ? '✅ Feito' : '⏳ Pendente'}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="card" style="margin-top:20px">
      <h2>Gestão Financeira</h2>
      <table>
        <thead><tr><th>Categoria</th><th>Gasto</th><th>Orçamento</th><th>%</th></tr></thead>
        <tbody>
          ${FINANCES.map(f => `<tr><td>${f.cat}</td><td>R$ ${f.spent}</td><td>R$ ${f.budget}</td><td>${Math.round(f.spent/f.budget*100)}%</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </body>
  </html>`;
  win.document.write(html);
  win.document.close();
};
