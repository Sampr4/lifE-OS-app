/* ============================================================
   LIFEOS — MÓDULO: ENERGIA MENTAL
============================================================ */
'use strict';

  // Inject the full Energia Mental module HTML into the section
  if(!s) return;
  s.innerHTML = `
  <div class="mod mod-narrow" id="em-root" style="padding:0;background:transparent;border:none;box-shadow:none;">
    <style>
    /* ── Energia Mental scoped styles ── */
    #em-root *,#em-root *::before,#em-root *::after{box-sizing:border-box;}
    #em-root{font-family:'DM Sans',-apple-system,sans-serif;color:var(--text);font-size:13px;}
    .em-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;}
    .em-title{font-size:18px;font-weight:800;letter-spacing:-.02em;color:var(--text);}
    .em-sub{font-size:11px;color:var(--t3);margin-top:2px;}
    .em-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:linear-gradient(135deg,#5b6cf9,#7c3aed);color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;transition:opacity .2s,transform .15s;box-shadow:0 2px 8px rgba(91,108,249,.35);}
    .em-btn:hover{opacity:.88;transform:translateY(-1px);}
    .em-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}
    /* TABS */
    .em-tabs{display:flex;border-bottom:2px solid var(--border);margin-bottom:16px;}
    .em-tab{padding:10px 18px;font-size:12px;font-weight:700;color:var(--t3);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s,border-color .15s;display:flex;align-items:center;gap:5px;}
    .em-tab:hover{color:var(--accent);}
    .em-tab.active{color:var(--accent);border-bottom-color:var(--accent);}
    /* PAGES */
    .em-page{display:none;flex-direction:column;gap:14px;}
    .em-page.active{display:flex;}
    /* CARD */
    .em-card{background:var(--bg);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm);}
    .em-card-title{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text);margin-bottom:12px;}
    /* KPI GRID */
    .em-kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
    @media(min-width:600px){.em-kpi-grid{grid-template-columns:repeat(3,1fr);}}
    @media(min-width:900px){.em-kpi-grid{grid-template-columns:repeat(5,1fr);}}
    .em-kpi{background:var(--bg);border:1px solid var(--border);border-radius:var(--r-lg);padding:12px 14px;display:flex;align-items:center;gap:10px;}
    .em-kpi-ico{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;}
    .em-kpi-label{font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);margin-bottom:2px;}
    .em-kpi-val{font-size:17px;font-weight:800;letter-spacing:-.02em;color:var(--text);transition:color .3s;}
    .em-kpi-val.flash{color:var(--accent);}
    /* SONO */
    .em-sono-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
    .em-field label{display:block;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin-bottom:5px;}
    .em-field input,.em-field select{width:100%;padding:9px 11px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;color:var(--text);background:var(--bg);outline:none;transition:border-color .15s;-webkit-appearance:none;appearance:none;}
    .em-field input:focus,.em-field select:focus{border-color:var(--accent);}
    .em-sono-prev{background:var(--bg-s);border-radius:8px;padding:11px 13px;border-left:3px solid var(--accent);}
    .em-sono-prev p{font-size:12px;color:var(--t2);line-height:1.7;word-break:break-word;}
    .em-sono-prev strong{color:var(--accent);font-weight:700;}
    /* BAR CHART */
    .em-bar-wrap{height:130px;display:flex;align-items:flex-end;gap:5px;padding-bottom:20px;position:relative;}
    .em-bar-wrap::after{content:'';position:absolute;bottom:20px;left:0;right:0;height:1px;background:var(--border);}
    .em-bar-g{flex:1;display:flex;flex-direction:column;align-items:center;position:relative;}
    .em-bar-stack{width:100%;max-width:22px;display:flex;flex-direction:column-reverse;gap:1px;}
    .em-bar-s{width:100%;height:0;transition:height .8s cubic-bezier(.16,1,.3,1);}
    .em-bar-s:last-child{border-radius:3px 3px 0 0;}
    .em-bs-e{background:linear-gradient(180deg,#6b7ff9,#8a96fc);}
    .em-bs-f{background:linear-gradient(180deg,#a855f7,#bf7dfa);}
    .em-bs-s{background:linear-gradient(180deg,#ec4899,#f472b6);}
    .em-bar-lbl{position:absolute;bottom:-17px;font-size:9px;color:var(--t3);font-weight:700;}
    .em-legend{display:flex;gap:12px;margin-bottom:10px;flex-wrap:wrap;}
    .em-leg-item{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--t3);font-weight:600;}
    .em-leg-dot{width:7px;height:7px;border-radius:50%;}
    /* DONUT */
    .em-donut-row{display:flex;align-items:center;gap:16px;}
    .em-donut-chart{position:relative;width:110px;height:110px;flex-shrink:0;}
    .em-donut-chart svg{transform:rotate(-90deg);width:110px;height:110px;}
    .em-donut-seg{fill:none;stroke-width:13;transition:stroke-dasharray 1s cubic-bezier(.16,1,.3,1);}
    .em-donut-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;}
    .em-dval{display:block;font-size:20px;font-weight:800;color:var(--text);letter-spacing:-.03em;line-height:1;}
    .em-dlbl{display:block;font-size:8px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:3px;}
    .em-donut-leg{flex:1;display:flex;flex-direction:column;gap:7px;}
    .em-dl-item{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--t2);font-weight:600;}
    .em-dl-dot{width:9px;height:9px;border-radius:3px;flex-shrink:0;}
    /* TABLE */
    .em-tbl-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;}
    .em-tbl-scroll table{width:100%;border-collapse:collapse;font-size:12px;min-width:440px;}
    .em-tbl-scroll thead th{padding:6px 8px;text-align:left;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);border-bottom:2px solid var(--border);white-space:nowrap;}
    .em-tbl-scroll tbody tr{border-bottom:1px solid var(--border);transition:background .12s;}
    .em-tbl-scroll tbody tr:last-child{border-bottom:none;}
    .em-tbl-scroll tbody tr:hover{background:var(--bg-s);}
    .em-tbl-scroll tbody tr.em-today{background:var(--acc-bg);}
    .em-tbl-scroll tbody td{padding:8px;color:var(--t2);vertical-align:middle;}
    .em-tbl-scroll tbody td:first-child{font-weight:700;color:var(--text);white-space:nowrap;}
    .em-today-tag{background:var(--acc-bg);color:var(--accent);font-size:8px;padding:1px 5px;border-radius:3px;font-weight:800;margin-left:4px;vertical-align:middle;}
    .em-badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:50px;font-size:10px;font-weight:700;}
    .em-ba{background:#edfaf3;color:#10b981;}.em-bm{background:#fff8ec;color:#f59e0b;}.em-bb{background:#fff0f0;color:#ef4444;}
    .em-td-time{width:100%;background:transparent;border:none;font-family:inherit;font-size:12px;color:var(--t2);outline:none;cursor:pointer;min-width:68px;}
    .em-td-time:focus{background:var(--acc-bg);border-radius:4px;padding:2px 4px;}
    .em-td-sel{width:100%;background:transparent;border:none;font-family:inherit;font-size:11px;color:var(--t2);outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;}
    .em-td-num{width:40px;background:transparent;border:none;font-family:inherit;font-size:11px;color:var(--accent);font-weight:700;outline:none;cursor:pointer;}
    .em-td-num:focus{background:var(--acc-bg);border-radius:4px;padding:2px 4px;}
    /* TIME GRID */
    .em-time-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;}
    .em-time-slot{display:flex;flex-direction:column;align-items:center;gap:4px;}
    .em-time-block{width:100%;height:44px;border-radius:6px;background:var(--bg-m);position:relative;overflow:hidden;}
    .em-time-fill{position:absolute;bottom:0;left:0;right:0;border-radius:6px;height:0;transition:height 1s cubic-bezier(.16,1,.3,1);}
    .em-time-lbl{font-size:9px;color:var(--t3);font-weight:700;}
    .em-suggestion{background:var(--acc-bg);border-radius:8px;padding:12px 14px;border-left:3px solid var(--accent);margin-top:12px;}
    .em-suggestion p{font-size:12px;color:var(--t2);line-height:1.75;word-break:break-word;}
    .em-suggestion strong{color:var(--accent);font-weight:700;}
    /* TWO COL DESKTOP */
    .em-mid-col{display:flex;flex-direction:column;gap:14px;}
    .em-bot-col{display:flex;flex-direction:column;gap:14px;}
    @media(min-width:860px){
      .em-mid-col{display:grid;grid-template-columns:1fr 280px;gap:14px;align-items:start;}
      .em-bot-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;}
    }
    /* FOCO */
    .em-foco-col{display:flex;flex-direction:column;gap:14px;}
    @media(min-width:700px){.em-foco-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;}}
    .em-step{display:none;flex-direction:column;gap:12px;}
    .em-step.active{display:flex;}
    .em-task-label{display:block;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin-bottom:7px;}
    .em-task-inp{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;color:var(--text);background:var(--bg);outline:none;transition:border-color .15s;}
    .em-task-inp:focus{border-color:var(--accent);}
    .em-task-inp::placeholder{color:var(--t3);font-weight:400;}
    .em-dur-pills{display:flex;gap:7px;flex-wrap:wrap;}
    .em-dur-pill{padding:7px 14px;border-radius:50px;font-size:12px;font-weight:700;border:1.5px solid var(--border);background:var(--bg);color:var(--t2);cursor:pointer;transition:all .15s;}
    .em-dur-pill:hover{border-color:var(--accent);color:var(--accent);}
    .em-dur-pill.sel{background:linear-gradient(135deg,#5b6cf9,#7c3aed);color:#fff;border-color:transparent;box-shadow:0 2px 8px rgba(91,108,249,.3);}
    .em-btn-confirm{width:100%;padding:13px;background:linear-gradient(135deg,#5b6cf9,#7c3aed);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;transition:opacity .2s,transform .15s;box-shadow:0 3px 12px rgba(91,108,249,.35);}
    .em-btn-confirm:hover{opacity:.88;transform:translateY(-1px);}
    .em-timer-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
    .em-task-name{font-size:14px;font-weight:800;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .em-tdot{width:8px;height:8px;border-radius:50%;background:var(--border);flex-shrink:0;}
    .em-tdot.run{background:#10b981;animation:empdot 1.5s ease infinite;}
    .em-tdot.done{background:var(--accent);}
    .em-dur-badge{font-size:10px;font-weight:700;color:var(--t3);margin-bottom:14px;}
    .em-ring-wrap{position:relative;width:180px;height:180px;margin:0 auto 20px;}
    .em-ring-wrap svg{transform:rotate(-90deg);width:180px;height:180px;}
    .em-ring-track{fill:none;stroke:var(--bg-m);stroke-width:10;}
    .em-ring-prog{fill:none;stroke:url(#emtg);stroke-width:10;stroke-linecap:round;stroke-dasharray:480;stroke-dashoffset:0;transition:stroke-dashoffset .5s linear;}
    .em-ring-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;}
    .em-ring-time{display:block;font-size:36px;font-weight:800;color:var(--text);letter-spacing:-.04em;font-variant-numeric:tabular-nums;line-height:1;}
    .em-ring-sub{display:block;font-size:10px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:4px;}
    .em-timer-btns{display:flex;gap:10px;}
    .em-tbtn{flex:1;padding:11px;border-radius:10px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;border:none;}
    .em-tbtn-start{background:linear-gradient(135deg,#5b6cf9,#7c3aed);color:#fff;box-shadow:0 3px 10px rgba(91,108,249,.35);}
    .em-tbtn-start:hover{opacity:.88;transform:translateY(-1px);}
    .em-tbtn-pause{background:#fff8ec;color:#f59e0b;border:1.5px solid #fde68a;}
    .em-tbtn-reset{background:var(--bg-s);color:var(--t2);border:1.5px solid var(--border);}
    .em-tbtn-reset:hover{background:var(--acc-bg);color:var(--accent);border-color:var(--accent);}
    .em-btn-new{width:100%;padding:11px;background:var(--bg-s);color:var(--accent);border:1.5px solid var(--border);border-radius:10px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;margin-top:4px;}
    .em-btn-new:hover{background:var(--acc-bg);}
    .em-done-box{display:none;flex-direction:column;align-items:center;gap:6px;padding:14px;background:#edfaf3;border-radius:10px;border:1.5px solid #bbf7d0;}
    .em-done-box.vis{display:flex;}
    .em-done-box p{font-size:13px;color:#065f46;font-weight:700;text-align:center;}
    .em-sess-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}
    .em-ss{background:var(--bg-s);border-radius:8px;padding:10px;text-align:center;}
    .em-ss-val{font-size:18px;font-weight:800;color:var(--text);letter-spacing:-.02em;}
    .em-ss-lbl{font-size:9px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-top:2px;}
    .em-sess-list{display:flex;flex-direction:column;}
    .em-sess-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);}
    .em-sess-item:last-child{border-bottom:none;}
    .em-sess-ico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;}
    .em-si-ok{background:#edfaf3;color:#10b981;}.em-si-int{background:#fff0f0;color:#ef4444;}
    .em-sess-meta{flex:1;min-width:0;}
    .em-sess-task{font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .em-sess-time{font-size:10px;color:var(--t3);margin-top:1px;}
    .em-sess-dur{font-size:11px;font-weight:700;color:var(--accent);background:var(--acc-bg);padding:2px 8px;border-radius:50px;white-space:nowrap;}
    .em-empty{padding:20px 0;text-align:center;color:var(--t3);font-size:12px;line-height:1.7;}
    @keyframes empdot{0%,100%{opacity:1;}50%{opacity:.3;}}
    @keyframes emfadeup{to{opacity:1;transform:translateY(0);}}
    @keyframes emspinning{to{transform:rotate(360deg);}}
    .em-spinning{animation:emspinning .7s linear infinite;}
    <\/style>

    <!-- TOPBAR -->
    <div class="em-topbar">
      <div>
        <div class="em-title">Energia Mental</div>
        <div class="em-sub">Energia · Foco · Sono em um só lugar</div>
      </div>
      <button class="em-btn" id="em-btnRef">
        <svg id="em-rIcon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
        Atualizar
      </button>
    </div>

    <!-- TABS -->
    <div class="em-tabs">
      <div class="em-tab active" id="em-tab-energia" onclick="emGoTab('energia')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        Energia &amp; Sono
      </div>
      <div class="em-tab" id="em-tab-foco" onclick="emGoTab('foco')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        Foco
      </div>
    </div>

    <!-- PAGE ENERGIA -->
    <div class="em-page active" id="em-page-energia">
      <div class="em-kpi-grid" id="em-kpis">
        <div class="em-kpi"><div class="em-kpi-ico" style="background:#eef1ff;color:#5b6cf9">⚡</div><div><div class="em-kpi-label">Energia Média</div><div class="em-kpi-val" id="em-kpiE">—</div></div></div>
        <div class="em-kpi"><div class="em-kpi-ico" style="background:#edfaf3;color:#10b981">🎯</div><div><div class="em-kpi-label">Foco Médio</div><div class="em-kpi-val" id="em-kpiF">—</div></div></div>
        <div class="em-kpi"><div class="em-kpi-ico" style="background:#f5f0ff;color:#a855f7">🌙</div><div><div class="em-kpi-label">Sono Médio</div><div class="em-kpi-val" id="em-kpiS">—</div></div></div>
        <div class="em-kpi"><div class="em-kpi-ico" style="background:#fff4ec;color:#f97316">📅</div><div><div class="em-kpi-label">Dias Reg.</div><div class="em-kpi-val" id="em-kpiD">—</div></div></div>
        <div class="em-kpi"><div class="em-kpi-ico" style="background:#fff0f6;color:#ec4899">💤</div><div><div class="em-kpi-label">Sono Ontem</div><div class="em-kpi-val" id="em-kpiO">—</div></div></div>
      </div>

      <!-- Sono de Ontem -->
      <div class="em-card">
        <div class="em-card-title">🌙 Sono de Ontem</div>
        <div class="em-sono-grid">
          <div class="em-field"><label>Dormiu às</label><input type="time" id="em-hDormiu" value="23:00"></div>
          <div class="em-field"><label>Acordou às</label><input type="time" id="em-hAcordou" value="06:30"></div>
          <div class="em-field"><label>Qualidade</label>
            <select id="em-qualSono">
              <option value="ótima">😴 Ótima</option>
              <option value="boa" selected>😊 Boa</option>
              <option value="regular">😐 Regular</option>
              <option value="ruim">😔 Ruim</option>
            </select>
          </div>
          <div class="em-field"><label>Energia ao acordar</label>
            <select id="em-energAcor">
              <option value="5">⚡ Cheio de energia</option>
              <option value="4" selected>✅ Bem disposto</option>
              <option value="3">😐 Normal</option>
              <option value="2">😴 Cansado</option>
              <option value="1">💤 Muito cansado</option>
            </select>
          </div>
        </div>
        <div class="em-sono-prev" id="em-sonoPrev"><p>Calculando...</p></div>
      </div>

      <!-- Charts row -->
      <div class="em-mid-col">
        <div class="em-card">
          <div class="em-card-title">Performance Semanal</div>
          <div class="em-legend">
            <div class="em-leg-item"><div class="em-leg-dot" style="background:#6b7ff9"></div>Energia</div>
            <div class="em-leg-item"><div class="em-leg-dot" style="background:#a855f7"></div>Foco</div>
            <div class="em-leg-item"><div class="em-leg-dot" style="background:#ec4899"></div>Sono</div>
          </div>
          <div class="em-bar-wrap" id="em-barChart"></div>
        </div>
        <div class="em-card">
          <div class="em-card-title">Por Categoria</div>
          <div class="em-donut-row">
            <div class="em-donut-chart">
              <svg viewBox="0 0 100 100">
                <defs><linearGradient id="emtg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5b6cf9"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs>
                <circle cx="50" cy="50" r="38" fill="none" stroke-width="13" style="stroke:var(--bg-m)"/>
                <circle class="em-donut-seg" id="em-d1" cx="50" cy="50" r="38" stroke="#6b7ff9" stroke-dasharray="0 239" stroke-dashoffset="0"/>
                <circle class="em-donut-seg" id="em-d2" cx="50" cy="50" r="38" stroke="#a855f7" stroke-dasharray="0 239" stroke-dashoffset="0"/>
                <circle class="em-donut-seg" id="em-d3" cx="50" cy="50" r="38" stroke="#ec4899" stroke-dasharray="0 239" stroke-dashoffset="0"/>
              </svg>
              <div class="em-donut-center"><span class="em-dval" id="em-donutV">—</span><span class="em-dlbl">Score</span></div>
            </div>
            <div class="em-donut-leg">
              <div class="em-dl-item"><div class="em-dl-dot" style="background:#6b7ff9"></div><span id="em-dl1">Energia</span></div>
              <div class="em-dl-item"><div class="em-dl-dot" style="background:#a855f7"></div><span id="em-dl2">Foco</span></div>
              <div class="em-dl-item"><div class="em-dl-dot" style="background:#ec4899"></div><span id="em-dl3">Sono</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table + Horário -->
      <div class="em-bot-col">
        <div class="em-card">
          <div class="em-card-title" style="margin-bottom:10px">Registro Semanal</div>
          <div class="em-tbl-scroll">
            <table><thead><tr><th>Dia</th><th>Dormiu</th><th>Acordou</th><th>Sono</th><th>Foco</th><th>Energia</th></tr></thead>
            <tbody id="em-weekTbody"></tbody></table>
          </div>
        </div>
        <div class="em-card">
          <div class="em-card-title">Energia por Horário</div>
          <div class="em-time-grid" id="em-timeGrid"></div>
          <div class="em-suggestion" id="em-suggestion"><p>Preencha os dados da semana para ver sua sugestão.</p></div>
        </div>
      </div>
    </div>

    <!-- PAGE FOCO -->
    <div class="em-page" id="em-page-foco">
      <div class="em-foco-col">
        <!-- Timer card -->
        <div class="em-card">
          <div class="em-step active" id="em-step1">
            <div class="em-card-title">⚡ Nova Sessão de Foco</div>
            <div><label class="em-task-label">Em que você vai focar?</label>
              <input class="em-task-inp" id="em-taskInp" type="text" placeholder="Ex: Estudar, projeto, leitura...">
            </div>
            <div>
              <label class="em-task-label">Duração</label>
              <div class="em-dur-pills">
                <div class="em-dur-pill" onclick="emSetDur(15,this)">15 min</div>
                <div class="em-dur-pill sel" onclick="emSetDur(30,this)">30 min</div>
                <div class="em-dur-pill" onclick="emSetDur(45,this)">45 min</div>
                <div class="em-dur-pill" onclick="emSetDur(60,this)">60 min</div>
                <div class="em-dur-pill" onclick="emSetDur(90,this)">90 min</div>
              </div>
            </div>
            <button class="em-btn-confirm" onclick="emConfirmTask()">✓ Confirmar e Iniciar Sessão</button>
          </div>
          <div class="em-step" id="em-step2">
            <div class="em-timer-hdr">
              <span class="em-task-name" id="em-taskName">—</span>
              <div class="em-tdot" id="em-tdot"></div>
            </div>
            <div class="em-dur-badge" id="em-durBadge"></div>
            <div class="em-ring-wrap" id="em-ringWrap">
              <svg viewBox="0 0 180 180">
                <defs><linearGradient id="emtg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5b6cf9"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs>
                <circle class="em-ring-track" cx="90" cy="90" r="76"/>
                <circle class="em-ring-prog" id="em-ringProg" cx="90" cy="90" r="76"/>
              </svg>
              <div class="em-ring-center">
                <span class="em-ring-time" id="em-ringTime">30:00</span>
                <span class="em-ring-sub" id="em-ringSub">pronto</span>
              </div>
            </div>
            <div class="em-timer-btns">
              <button class="em-tbtn em-tbtn-start" id="em-btnTimer" onclick="emToggleTimer()">▶ Iniciar</button>
              <button class="em-tbtn em-tbtn-reset" onclick="emResetTimer()">↺ Reset</button>
            </div>
            <div class="em-done-box" id="em-doneBox"><div style="font-size:26px">🎉</div><p>Sessão concluída! Ótimo trabalho.</p></div>
            <button class="em-btn-new" onclick="emNewSession()">+ Nova sessão</button>
          </div>
        </div>

        <!-- Sessions card -->
        <div class="em-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div class="em-card-title" style="margin-bottom:0">Histórico</div>
            <span style="font-size:10px;color:var(--t3);font-weight:600" id="em-sessCount">0 sessões</span>
          </div>
          <div class="em-sess-stats">
            <div class="em-ss"><div class="em-ss-val" id="em-stTotal">0</div><div class="em-ss-lbl">Sessões</div></div>
            <div class="em-ss"><div class="em-ss-val" id="em-stMin">0</div><div class="em-ss-lbl">Minutos</div></div>
            <div class="em-ss"><div class="em-ss-val" id="em-stStreak">0</div><div class="em-ss-lbl">Streak</div></div>
          </div>
          <div class="em-sess-list" id="em-sessList">
            <div class="em-empty">Nenhuma sessão ainda.<br>Inicie seu primeiro foco! 🚀</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // Init after render
  setTimeout(emInit, 60);
}

/* ── Energia Mental JS ─────────────────────────────────── */
const EM_DIAS   = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const EM_CURTOS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const EM_FOCO_L = ['','Muito Baixo','Baixo','Regular','Bom','Ótimo'];

let emWeekData = [
  {dormiu:'23:30',acordou:'06:30',foco:3,energia:60},
  {dormiu:'00:00',acordou:'07:00',foco:3,energia:55},
  {dormiu:'23:00',acordou:'06:30',foco:4,energia:65},
  {dormiu:'22:30',acordou:'06:00',foco:4,energia:70},
  {dormiu:'23:00',acordou:'06:30',foco:5,energia:82},
  {dormiu:'00:30',acordou:'08:00',foco:3,energia:60},
  {dormiu:'01:00',acordou:'09:00',foco:2,energia:50},
];

let emDur=30*60, emRem=30*60, emRunning=false, emIvl=null;
let emSessions=[], emTotalMin=0, emStreak=0;
const EM_CIRC = 2 * Math.PI * 76; // ~477.5

function emSonoH(d,a){
  const [dh,dm]=d.split(':').map(Number);
  const [ah,am]=a.split(':').map(Number);
  let diff=(ah*60+am)-(dh*60+dm);
  if(diff<0)diff+=1440;
  return Math.round(diff/6)/10;
}

function emFlash(id,val){
  const el=document.getElementById(id);
  if(!el)return;
  el.textContent=val;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
  setTimeout(()=>el.classList.remove('flash'),1000);
}

function emGoTab(t){
  document.querySelectorAll('.em-page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.em-tab').forEach(x=>x.classList.remove('active'));
  const pg=document.getElementById('em-page-'+t);
  const tb=document.getElementById('em-tab-'+t);
  if(pg)pg.classList.add('active');
  if(tb)tb.classList.add('active');
}

function emBuildTable(){
  const tb=document.getElementById('em-weekTbody');
  if(!tb)return;
  tb.innerHTML='';
  emWeekData.forEach((d,i)=>{
    const h=emSonoH(d.dormiu,d.acordou);
    const bc=d.energia>=70?'em-ba':d.energia>=50?'em-bm':'em-bb';
    const tr=document.createElement('tr');
    if(i===4)tr.classList.add('em-today');
    tr.innerHTML=`
      <td>${EM_DIAS[i]}${i===4?'<span class="em-today-tag">HOJE</span>':''}</td>
      <td><input class="em-td-time" type="time" value="${d.dormiu}" onchange="emUpdCell(${i},'dormiu',this.value)"></td>
      <td><input class="em-td-time" type="time" value="${d.acordou}" onchange="emUpdCell(${i},'acordou',this.value)"></td>
      <td>${h.toFixed(1)}h</td>
      <td><select class="em-td-sel" onchange="emUpdCell(${i},'foco',+this.value)">${[1,2,3,4,5].map(v=>`<option value="${v}"${d.foco===v?' selected':''}>${EM_FOCO_L[v]}</option>`).join('')}</select></td>
      <td><span class="em-badge ${bc}">${d.energia}%</span><input class="em-td-num" type="number" min="0" max="100" value="${d.energia}" onchange="emUpdCell(${i},'energia',+this.value)"></td>`;
    tb.appendChild(tr);
  });
}

function emUpdCell(i,k,v){emWeekData[i][k]=v;emBuildTable();}

function emCalcular(){
  const avgE=Math.round(emWeekData.reduce((a,d)=>a+d.energia,0)/7);
  const avgF=emWeekData.reduce((a,d)=>a+d.foco,0)/7;
  const avgS=emWeekData.reduce((a,d)=>a+emSonoH(d.dormiu,d.acordou),0)/7;
  emFlash('em-kpiE',avgE+'%');
  emFlash('em-kpiF',EM_FOCO_L[Math.round(avgF)]);
  emFlash('em-kpiS',avgS.toFixed(1)+'h');
  emFlash('em-kpiD',emWeekData.filter(d=>d.energia>0).length+'/7');
  emUpdateSonoOntem();
  // Donut
  const C=238.8;
  const pe=avgE/100,pf=avgF/5*0.6,ps=avgS/9*0.4,tot=pe+pf+ps;
  const pp=[pe/tot,pf/tot,ps/tot];
  const offs=[0,-(pp[0]*C),-((pp[0]+pp[1])*C)];
  ['em-d1','em-d2','em-d3'].forEach((id,i)=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.style.strokeDashoffset=offs[i];
    el.setAttribute('stroke-dasharray',`${pp[i]*C} ${C}`);
  });
  const score=Math.min(Math.round(avgE*0.5+avgF/5*100*0.3+avgS/9*100*0.2),100);
  const dv=document.getElementById('em-donutV');if(dv)dv.textContent=score;
  const d1=document.getElementById('em-dl1');if(d1)d1.textContent=`Energia ${Math.round(pp[0]*100)}%`;
  const d2=document.getElementById('em-dl2');if(d2)d2.textContent=`Foco ${Math.round(pp[1]*100)}%`;
  const d3=document.getElementById('em-dl3');if(d3)d3.textContent=`Sono ${Math.round(pp[2]*100)}%`;
  // Bar
  emBuildBar();
  // Suggestion
  const sb=document.getElementById('em-suggestion');
  if(sb){
    let msg='';
    if(avgE>=70&&avgS>=7) msg=`Semana <strong>sólida</strong>! Energia média de <strong>${avgE}%</strong> e sono de <strong>${avgS.toFixed(1)}h</strong>. Pico tende a ocorrer entre <strong>19h–22h</strong>.`;
    else if(avgE>=55) msg=`Energia moderada em <strong>${avgE}%</strong>. Com <strong>${avgS.toFixed(1)}h</strong> de sono médio, pequenos ajustes na rotina noturna podem elevar sua performance.`;
    else msg=`Energia abaixo do ideal em <strong>${avgE}%</strong>. Priorize <strong>dormir antes das 23h</strong> para recuperar sua performance.`;
    sb.innerHTML=`<p>${msg}</p>`;
  }
}

function emUpdateSonoOntem(){
  const d=document.getElementById('em-hDormiu');
  const a=document.getElementById('em-hAcordou');
  const q=document.getElementById('em-qualSono');
  const e=document.getElementById('em-energAcor');
  if(!d||!a||!q||!e)return;
  const h=emSonoH(d.value,a.value);
  emFlash('em-kpiO',h.toFixed(1)+'h');
  const em=['','Muito cansado','Cansado','Normal','Bem disposto','Cheio de energia'];
  const qm={ótima:'excelente',boa:'boa',regular:'regular',ruim:'ruim'};
  let msg='';
  if(h>=7.5) msg=`Dormiu <strong>${h.toFixed(1)}h</strong> com qualidade <strong>${qm[q.value]}</strong>. ${em[+e.value]}. Ótima base para performance hoje!`;
  else if(h>=6) msg=`Dormiu <strong>${h.toFixed(1)}h</strong> — abaixo do ideal. ${em[+e.value]}. Considere uma pausa de 20 min no dia.`;
  else msg=`Dormiu apenas <strong>${h.toFixed(1)}h</strong>. ${em[+e.value]}. Priorize tarefas leves hoje.`;
  const sp=document.getElementById('em-sonoPrev');
  if(sp)sp.innerHTML=`<p>${msg}</p>`;
}

function emBuildBar(){
  const area=document.getElementById('em-barChart');
  if(!area)return;
  area.innerHTML='';
  emWeekData.forEach((d,i)=>{
    const sn=Math.min(emSonoH(d.dormiu,d.acordou)/9,1)*100;
    const fn=(d.foco/5)*100;
    const g=document.createElement('div');g.className='em-bar-g';
    const st=document.createElement('div');st.className='em-bar-stack';
    [{cls:'em-bs-s',v:sn},{cls:'em-bs-f',v:fn},{cls:'em-bs-e',v:d.energia}].forEach(s=>{
      const el=document.createElement('div');el.className='em-bar-s '+s.cls;
      const h=Math.round((s.v/100)*100*0.32);
      st.appendChild(el);
      setTimeout(()=>{el.style.transitionDelay=(i*50)+'ms';el.style.height=h+'px';},100);
    });
    const lb=document.createElement('div');lb.className='em-bar-lbl';lb.textContent=EM_CURTOS[i];
    g.appendChild(st);g.appendChild(lb);area.appendChild(g);
  });
}

function emBuildTimeGrid(){
  const grid=document.getElementById('em-timeGrid');
  if(!grid)return;
  grid.innerHTML='';
  const slots=[
    {l:'6h',v:30,c:'#e2e5f0'},{l:'10h',v:55,c:'#c7d0fd'},
    {l:'14h',v:42,c:'#dce0fd'},{l:'17h',v:62,c:'#b3bcfc'},
    {l:'19h',v:90,c:'linear-gradient(180deg,#5b6cf9,#7c3aed)'},
    {l:'22h',v:72,c:'linear-gradient(180deg,#818cf8,#a78bfa)'},
  ];
  slots.forEach((s,i)=>{
    const slot=document.createElement('div');slot.className='em-time-slot';
    const block=document.createElement('div');block.className='em-time-block';
    const fill=document.createElement('div');fill.className='em-time-fill';
    fill.style.background=s.c;fill.style.transitionDelay=(i*80)+'ms';
    if(s.v>70)fill.style.boxShadow='0 -2px 8px rgba(91,108,249,.3)';
    block.appendChild(fill);
    const lb=document.createElement('div');lb.className='em-time-lbl';lb.textContent=s.l;
    slot.appendChild(block);slot.appendChild(lb);grid.appendChild(slot);
    setTimeout(()=>{fill.style.height=s.v+'%';},400+i*80);
  });
}

function emSetDur(m,el){
  if(emRunning)return;
  document.querySelectorAll('.em-dur-pill').forEach(p=>p.classList.remove('sel'));
  el.classList.add('sel');
  emDur=m*60;emRem=m*60;
}

function emConfirmTask(){
  const task=document.getElementById('em-taskInp');
  if(!task)return;
  if(!task.value.trim()){
    task.style.borderColor='#ef4444';
    task.focus();
    setTimeout(()=>task.style.borderColor='',1000);
    return;
  }
  const tn=document.getElementById('em-taskName');if(tn)tn.textContent=task.value.trim();
  const sel=document.querySelector('.em-dur-pill.sel');
  const db=document.getElementById('em-durBadge');if(db)db.textContent='Sessão de '+(sel?sel.textContent:emDur/60+' min');
  document.getElementById('em-step1').classList.remove('active');
  document.getElementById('em-step2').classList.add('active');
  emRem=emDur;emUpdateRing();
}

function emToggleTimer(){if(emRunning)emPauseTimer();else emStartTimer();}

function emStartTimer(){
  emRunning=true;
  const btn=document.getElementById('em-btnTimer');if(btn){btn.textContent='⏸ Pausar';btn.className='em-tbtn em-tbtn-pause';}
  const dot=document.getElementById('em-tdot');if(dot)dot.className='em-tdot run';
  const sub=document.getElementById('em-ringSub');if(sub)sub.textContent='focando';
  emIvl=setInterval(()=>{emRem--;emUpdateRing();if(emRem<=0)emFinishTimer();},1000);
}

function emPauseTimer(){
  emRunning=false;clearInterval(emIvl);
  const btn=document.getElementById('em-btnTimer');if(btn){btn.textContent='▶ Continuar';btn.className='em-tbtn em-tbtn-start';}
  const dot=document.getElementById('em-tdot');if(dot)dot.className='em-tdot';
  const sub=document.getElementById('em-ringSub');if(sub)sub.textContent='pausado';
}

function emResetTimer(){
  if(emRunning&&emRem<emDur)emSaveSession(false);
  emRunning=false;clearInterval(emIvl);emRem=emDur;
  const btn=document.getElementById('em-btnTimer');if(btn){btn.textContent='▶ Iniciar';btn.className='em-tbtn em-tbtn-start';}
  const dot=document.getElementById('em-tdot');if(dot)dot.className='em-tdot';
  const sub=document.getElementById('em-ringSub');if(sub)sub.textContent='pronto';
  const db=document.getElementById('em-doneBox');if(db)db.classList.remove('vis');
  emUpdateRing();
}

function emFinishTimer(){
  emRunning=false;clearInterval(emIvl);emRem=0;
  const btn=document.getElementById('em-btnTimer');if(btn){btn.textContent='✓ Concluído';btn.className='em-tbtn em-tbtn-start';}
  const dot=document.getElementById('em-tdot');if(dot)dot.className='em-tdot done';
  const sub=document.getElementById('em-ringSub');if(sub)sub.textContent='concluído!';
  const db=document.getElementById('em-doneBox');if(db)db.classList.add('vis');
  emSaveSession(true);emUpdateRing();
}

function emNewSession(){
  emRunning=false;clearInterval(emIvl);emRem=emDur;
  const btn=document.getElementById('em-btnTimer');if(btn){btn.textContent='▶ Iniciar';btn.className='em-tbtn em-tbtn-start';}
  const dot=document.getElementById('em-tdot');if(dot)dot.className='em-tdot';
  const sub=document.getElementById('em-ringSub');if(sub)sub.textContent='pronto';
  const db=document.getElementById('em-doneBox');if(db)db.classList.remove('vis');
  const ti=document.getElementById('em-taskInp');if(ti)ti.value='';
  document.getElementById('em-step2').classList.remove('active');
  document.getElementById('em-step1').classList.add('active');
  emUpdateRing();
}

function emSaveSession(completed){
  const tn=document.getElementById('em-taskName');
  const task=(tn?tn.textContent:null)||'Sessão';
  const spent=Math.max(1,Math.round((emDur-emRem)/60));
  const now=new Date();
  emSessions.unshift({task,dur:spent,time:now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),ok:completed});
  emTotalMin+=spent;if(completed)emStreak++;
  emRenderSessions();
}

function emRenderSessions(){
  const n=emSessions.length;
  const sc=document.getElementById('em-sessCount');if(sc)sc.textContent=n+' sessão'+(n!==1?'ões':'');
  const st=document.getElementById('em-stTotal');if(st)st.textContent=n;
  const sm=document.getElementById('em-stMin');if(sm)sm.textContent=emTotalMin;
  const ss=document.getElementById('em-stStreak');if(ss)ss.textContent=emStreak;
  const list=document.getElementById('em-sessList');
  if(!list)return;
  if(!n){list.innerHTML='<div class="em-empty">Nenhuma sessão ainda.<br>Inicie seu primeiro foco! 🚀</div>';return;}
  list.innerHTML=emSessions.map(s=>`
    <div class="em-sess-item">
      <div class="em-sess-ico ${s.ok?'em-si-ok':'em-si-int'}">${s.ok?'✓':'–'}</div>
      <div class="em-sess-meta"><div class="em-sess-task">${s.task}</div><div class="em-sess-time">${s.time} · ${s.ok?'concluída':'interrompida'}</div></div>
      <div class="em-sess-dur">${s.dur}min</div>
    </div>`).join('');
}

function emUpdateRing(){
  const prog=document.getElementById('em-ringProg');
  if(prog)prog.style.strokeDashoffset=EM_CIRC*(1-emRem/emDur);
  const rt=document.getElementById('em-ringTime');
  if(rt){const m=Math.floor(emRem/60),s=emRem%60;rt.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
}

function emInit(){
  emBuildTable();
  emBuildTimeGrid();
  emCalcular();
  emUpdateRing();
  ['em-hDormiu','em-hAcordou','em-qualSono','em-energAcor'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.addEventListener('change',emUpdateSonoOntem);
  });
  const ref=document.getElementById('em-btnRef');
  if(ref)ref.addEventListener('click',()=>{
    const ic=document.getElementById('em-rIcon');
    if(ic)ic.classList.add('em-spinning');
    ref.disabled=true;
    emBuildTable();emCalcular();
    setTimeout(()=>{if(ic)ic.classList.remove('em-spinning');ref.disabled=false;},900);
  });
}

/* ─── 13 · NOTAS ─────────────────────────────── */
/* ─── AGENDA (substitui Notas + Calendário) ─────────────────── */
let _agendaDate = new Date().toISOString().slice(0,10);
let _agendaShowForm = false;
let _agendaEditId = null;

function _agendaFmt(dateStr){
  const d = new Date(dateStr+'T12:00:00');
  return d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
}
function _agendaNav(offset){
  const d = new Date(_agendaDate+'T12:00:00');
  d.setDate(d.getDate()+offset);
  _agendaDate = d.toISOString().slice(0,10);
  _agendaShowForm = false;
  _agendaEditId = null;
  renderModule('notas');
}
function _agendaToday(){
  _agendaDate = new Date().toISOString().slice(0,10);
  _agendaShowForm = false;
  _agendaEditId = null;
  renderModule('notas');
}
function _agendaToggleForm(editId){
  if(editId!=null){ _agendaEditId=editId; _agendaShowForm=true; }
  else { _agendaEditId=null; _agendaShowForm=!_agendaShowForm; }
  renderModule('notas');
}
function _agendaSaveEvent(){
  const title = document.getElementById('ag-title').value.trim();
  const time  = document.getElementById('ag-time').value;
  const dur   = parseInt(document.getElementById('ag-dur').value)||30;
  const cat   = document.getElementById('ag-cat').value;
  const note  = document.getElementById('ag-note').value.trim();
  if(!title||!time){ showToast('Preencha título e horário ⚠️'); return; }
  if(_agendaEditId!=null){
    const ev = AGENDA_EVENTS.find(e=>e.id===_agendaEditId);
    if(ev){ ev.title=title; ev.time=time; ev.dur=dur; ev.cat=cat; ev.note=note; }
  } else {
    const newId = (AGENDA_EVENTS.reduce((m,e)=>Math.max(m,e.id),0))+1;
    AGENDA_EVENTS.push({id:newId,date:_agendaDate,time,dur,title,cat,note});
  }
  _agendaShowForm=false; _agendaEditId=null;
  showToast(_agendaEditId!=null?'Evento atualizado ✅':'Evento adicionado ✅');
  renderModule('notas');
}
function _agendaDeleteEvent(id){
  const idx = AGENDA_EVENTS.findIndex(e=>e.id===id);
  if(idx>-1){ AGENDA_EVENTS.splice(idx,1); showToast('Evento removido 🗑️'); renderModule('notas'); }
}

const AG_CAT_COLOR = {trabalho:'#a855f7',estudo:'#c084fc',saúde:'#10b981',pessoal:'#f59e0b'};
const AG_CAT_TAG   = {trabalho:'tag-blue',estudo:'tag-purple',saúde:'tag-green',pessoal:'tag-orange'};

function renderNotas(s){
