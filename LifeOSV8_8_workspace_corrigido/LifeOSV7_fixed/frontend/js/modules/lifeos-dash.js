/* ============================================================
   LIFEOS — MÓDULO: LIFEOS ANALYTICS
============================================================ */
'use strict';

(function injectLifeOSStyles(){
  if(document.getElementById('lifeos-dash-css')) return;
  const s = document.createElement('style');
  s.id = 'lifeos-dash-css';
  s.textContent = `
/* KPI CARDS */
.los-kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%,140px), 1fr));
  gap: .65rem;
}
.los-kc {
  border-radius: 12px;
  padding: 14px 16px;
  color: #fff;
  position: relative;
  overflow: hidden;
  cursor: default;
  opacity: 0;
  transform: translateY(10px);
  transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .2s;
  animation: losKcIn .5s cubic-bezier(.22,1,.36,1) both;
}
.los-kc:hover { transform: translateY(-3px) !important; box-shadow: 0 10px 28px rgba(0,0,0,.22); }
.los-kc::after { content:''; position:absolute; top:-28px; right:-28px; width:80px; height:80px; background:rgba(255,255,255,.1); border-radius:50%; pointer-events:none; }
@keyframes losKcIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
.los-kc-v { font-size: 1.5rem; font-weight: 800; letter-spacing: -.04em; line-height: 1; }
.los-kc-l { font-size: .62rem; font-weight: 600; opacity: .85; margin-top: 4px; letter-spacing: .02em; line-height: 1.3; text-transform: uppercase; }
.los-kc-d { font-size: .65rem; font-weight: 700; margin-top: 6px; opacity: .9; }
.los-c1{background:linear-gradient(135deg,#a855f7,#7c3aed)}
.los-c2{background:linear-gradient(135deg,#10b981,#059669)}
.los-c3{background:linear-gradient(135deg,#3b82f6,#1d4ed8)}
.los-c4{background:linear-gradient(135deg,#f59e0b,#d97706)}
.los-c5{background:linear-gradient(135deg,#ef4444,#b91c1c)}
.los-c6{background:linear-gradient(135deg,#8b5cf6,#6d28d9)}

/* CHART ROW */
.los-charts-row {
  display: grid;
  grid-template-columns: 180px 1fr 1fr;
  gap: .65rem;
}
@media(max-width:700px){ .los-charts-row { grid-template-columns: 1fr; } }
@media(max-width:1000px) and (min-width:701px) { .los-charts-row { grid-template-columns: 1fr 1fr; } .los-charts-row>.los-cc:first-child{grid-column:1/-1} }

.los-cc {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 1rem 1.1rem;
  transition: border-color .2s, box-shadow .2s, transform .25s var(--expo);
}
.los-cc:hover { border-color: var(--border-mid); box-shadow: 0 6px 20px rgba(168,85,247,.07); transform: translateY(-1px); }
.los-cc-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: .75rem; gap:.4rem; flex-wrap:wrap; }
.los-cc-title { font-size: .62rem; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; color: var(--t3); }
.los-leg { display: flex; gap: .5rem; flex-wrap: wrap; }
.los-leg-i { display:flex; align-items:center; gap:3px; font-size:.6rem; color:var(--t3); font-weight:600; }
.los-leg-d { width:7px; height:7px; border-radius:50%; flex-shrink:0; }

/* TABLE */
.los-tbl-shell {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.los-tbl-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: .75rem 1.1rem;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap; gap: .5rem;
}
.los-tbl-title { font-size: .62rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--t3); }
.los-tbl-acts  { display: flex; gap: .4rem; flex-wrap: wrap; }
.los-tbl-btn {
  height: 26px; padding: 0 .7rem;
  border: 1px solid var(--border); border-radius: var(--r-sm);
  font-size: .65rem; font-weight: 700; color: var(--t2);
  background: var(--bg-s); cursor: pointer;
  transition: all .15s; font-family: var(--font-sans);
  text-transform: uppercase; letter-spacing: .04em;
}
.los-tbl-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--acc-bg); }
.los-tbl-srch {
  height: 26px; padding: 0 .6rem 0 1.6rem;
  border: 1px solid var(--border); border-radius: var(--r-sm);
  font-size: .7rem; color: var(--text); background: var(--bg-s);
  font-family: var(--font-sans); outline: none; width: 130px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2.5'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: .5rem center;
  transition: border-color .2s, width .25s;
}
.los-tbl-srch:focus { border-color: var(--accent); width: 160px; }

.los-table { width: 100%; border-collapse: collapse; }
.los-table thead th {
  padding: 7px 12px;
  text-align: left; font-size: .58rem; font-weight: 800;
  letter-spacing: .07em; text-transform: uppercase;
  color: var(--t3); background: var(--bg-s);
  border-bottom: 1px solid var(--border);
  white-space: nowrap; cursor: pointer; user-select: none;
  transition: color .15s;
}
.los-table thead th:hover { color: var(--accent); }
.los-table tbody tr {
  border-bottom: 1px solid var(--border);
  opacity: 0; transform: translateY(4px);
  transition: background .12s, opacity .3s, transform .3s;
}
.los-table tbody tr:last-child { border-bottom: none; }
.los-table tbody tr:hover { background: var(--bg-s); }
.los-table td { padding: 9px 12px; font-size: .78rem; vertical-align: middle; }

.los-area-cell { display:flex; align-items:center; gap:8px; }
.los-area-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.los-a-name    { font-weight: 700; font-size: .8rem; }
.los-a-sub     { font-size: .62rem; color: var(--t3); margin-top:1px; }

.los-bar-wrap  { display:flex; align-items:center; gap:7px; min-width:80px; }
.los-bar-bg    { flex:1; height:3px; background:var(--bg-m); border-radius:999px; overflow:hidden; }
.los-bar-f     { height:100%; border-radius:999px; width:0%; transition:width 1.2s cubic-bezier(.22,1,.36,1); }
.los-bar-pct   { font-size:.68rem; font-weight:800; min-width:26px; text-align:right; color:var(--t2); }

.los-badge {
  display:inline-flex; align-items:center; gap:4px;
  padding:2px 7px; border-radius:999px;
  font-size:.6rem; font-weight:800;
  white-space:nowrap; text-transform:uppercase; letter-spacing:.04em;
}
.los-badge::before { content:''; width:5px; height:5px; border-radius:50%; flex-shrink:0; }
.lb-green  { background:rgba(16,185,129,.1);  color:#059669; } .lb-green::before  { background:#10b981; }
.lb-blue   { background:rgba(59,130,246,.1);  color:#1d4ed8; } .lb-blue::before   { background:#3b82f6; }
.lb-purple { background:rgba(168,85,247,.1);  color:#7c3aed; } .lb-purple::before { background:#a855f7; }
.lb-amber  { background:rgba(245,158,11,.1);  color:#b45309; } .lb-amber::before  { background:#f59e0b; }
.lb-red    { background:rgba(239,68,68,.1);   color:#991b1b; } .lb-red::before    { background:#ef4444; }

.los-tbl-footer {
  display:flex; align-items:center; justify-content:space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  background: var(--bg-s);
}
.los-tbl-info { font-size:.62rem; color:var(--t3); font-weight:600; }
.los-pagination { display:flex; gap:3px; }
.los-pg-btn {
  width:24px; height:24px; display:grid; place-items:center;
  border:1px solid var(--border); border-radius:var(--r-sm);
  background:var(--bg); color:var(--t2); font-size:.65rem;
  cursor:pointer; font-family:var(--font-sans); transition:all .15s;
}
.los-pg-btn.on { background:var(--accent); border-color:var(--accent); color:#fff; }
.los-pg-btn:not(.on):hover { border-color:var(--accent); color:var(--accent); }
  `;
  document.head.appendChild(s);
})();

/* ── DATA ──────────────────────────────────────────────────── */
const LOS_ROWS = [
  {area:'Rotina',    color:'#a855f7', icon:'🌅', goal:'Acordar às 5h',       total:31,sessions:870, focused:'2.1h',tasks:128,progress:68,status:'evolving', badge:'lb-purple',lbl:'Evoluindo'},
  {area:'Hábitos',  color:'#10b981', icon:'💪', goal:'Treinar todo dia',     total:31,sessions:800, focused:'1.8h',tasks:125,progress:52,status:'growing',   badge:'lb-green', lbl:'Crescendo'},
  {area:'Estudo',   color:'#3b82f6', icon:'📚', goal:'Programação diária',   total:31,sessions:960, focused:'3.4h',tasks:216,progress:74,status:'excellent', badge:'lb-green', lbl:'Excelente'},
  {area:'Finanças', color:'#f59e0b', icon:'💰', goal:'Guardar dinheiro',     total:31,sessions:690, focused:'0.9h',tasks:89, progress:30,status:'starting',  badge:'lb-amber', lbl:'Começando'},
  {area:'Saúde',    color:'#10b981', icon:'🥗', goal:'Alimentação limpa',    total:31,sessions:820, focused:'1.5h',tasks:160,progress:61,status:'growing',   badge:'lb-green', lbl:'Crescendo'},
  {area:'Meditação',color:'#8b5cf6', icon:'🧘', goal:'10min por dia',        total:31,sessions:620, focused:'0.7h',tasks:74, progress:45,status:'starting',  badge:'lb-amber', lbl:'Começando'},
  {area:'Social',   color:'#ef4444', icon:'🤝', goal:'Networking semanal',   total:31,sessions:580, focused:'0.5h',tasks:63, progress:38,status:'warning',   badge:'lb-red',   lbl:'Atenção'},
  {area:'Projeto',  color:'#a855f7', icon:'🚀', goal:'LifeOS MVP',           total:31,sessions:900, focused:'4.2h',tasks:224,progress:82,status:'excellent', badge:'lb-green', lbl:'Excelente'},
];
let losActive=[...LOS_ROWS], losSortKey='progress', losSortDir=-1;
let losCharts={};

/* ── RENDER ────────────────────────────────────────────────── */
function renderLifeosDash(s){
  s.innerHTML=`
  <div class="mod">
    <div class="sec-header">
      <div>
        <h2 class="mod-title">LifeOS <span class="accent">Analytics</span></h2>
        <p class="mod-sub">Dashboard de evolução pessoal · dados simulados</p>
      </div>
      <button class="btn btn-primary" onclick="showToast('Exportando relatório… 📊')">Exportar Relatório</button>
    </div>

    <!-- KPI CARDS -->
    <div class="los-kpi-row">
      <div class="los-kc los-c1" style="animation-delay:0ms">
        <div class="los-kc-v">74%</div>
        <div class="los-kc-l">Progresso Geral</div>
        <div class="los-kc-d">↑ +11% esta semana</div>
      </div>
      <div class="los-kc los-c2" style="animation-delay:60ms">
        <div class="los-kc-v">8</div>
        <div class="los-kc-l">Hábitos Ativos</div>
        <div class="los-kc-d">↑ 3 em alta</div>
      </div>
      <div class="los-kc los-c3" style="animation-delay:120ms">
        <div class="los-kc-v">6d</div>
        <div class="los-kc-l">Melhor Sequência</div>
        <div class="los-kc-d">↑ Estudo</div>
      </div>
      <div class="los-kc los-c4" style="animation-delay:180ms">
        <div class="los-kc-v">02:24</div>
        <div class="los-kc-l">Foco Médio</div>
        <div class="los-kc-d">↑ +18min vs ant.</div>
      </div>
      <div class="los-kc los-c5" style="animation-delay:240ms">
        <div class="los-kc-v">47</div>
        <div class="los-kc-l">Tarefas Feitas</div>
        <div class="los-kc-d">↑ esta semana</div>
      </div>
      <div class="los-kc los-c6" style="animation-delay:300ms">
        <div class="los-kc-v">4.2K</div>
        <div class="los-kc-l">Pontos XP</div>
        <div class="los-kc-d">↑ +380 hoje</div>
      </div>
    </div>

    <!-- CHARTS -->
    <div class="los-charts-row">

      <div class="los-cc">
        <div class="los-cc-hdr"><span class="los-cc-title">Por Área</span></div>
        <div style="position:relative;height:140px"><canvas id="losDoughnut"></canvas></div>
        <div style="margin-top:.65rem;display:flex;flex-direction:column;gap:3px">
          <div class="los-leg-i"><span class="los-leg-d" style="background:#a855f7"></span>Projeto 27%</div>
          <div class="los-leg-i"><span class="los-leg-d" style="background:#3b82f6"></span>Estudo 24%</div>
          <div class="los-leg-i"><span class="los-leg-d" style="background:#10b981"></span>Saúde 20%</div>
          <div class="los-leg-i"><span class="los-leg-d" style="background:#f59e0b"></span>Rotina 18%</div>
          <div class="los-leg-i"><span class="los-leg-d" style="background:#8b5cf6"></span>Outros 11%</div>
        </div>
      </div>

      <div class="los-cc">
        <div class="los-cc-hdr">
          <span class="los-cc-title">Progresso Mensal</span>
          <div class="los-leg">
            <div class="los-leg-i"><span class="los-leg-d" style="background:#a855f7"></span>Rotina</div>
            <div class="los-leg-i"><span class="los-leg-d" style="background:#3b82f6"></span>Estudo</div>
            <div class="los-leg-i"><span class="los-leg-d" style="background:#10b981"></span>Projeto</div>
          </div>
        </div>
        <div style="position:relative;height:160px"><canvas id="losBar"></canvas></div>
      </div>

      <div class="los-cc">
        <div class="los-cc-hdr">
          <span class="los-cc-title">Score Diário</span>
          <div class="los-leg">
            <div class="los-leg-i"><span class="los-leg-d" style="background:#a855f7"></span>Score</div>
            <div class="los-leg-i"><span class="los-leg-d" style="background:#ef4444;opacity:.6"></span>Meta</div>
          </div>
        </div>
        <div style="position:relative;height:160px"><canvas id="losLine"></canvas></div>
      </div>
    </div>

    <!-- TABLE -->
    <div class="los-tbl-shell">
      <div class="los-tbl-hdr">
        <span class="los-tbl-title">Evolução por Área</span>
        <div class="los-tbl-acts">
          <input class="los-tbl-srch" id="losSrch" placeholder="Buscar…" oninput="losFilter()"/>
          <button class="los-tbl-btn" onclick="losSort('progress')">⇅ Progresso</button>
          <button class="los-tbl-btn" onclick="losSort('sessions')">⇅ Check-ins</button>
          <button class="los-tbl-btn" onclick="losExport()">↓ CSV</button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="los-table">
          <thead>
            <tr>
              <th onclick="losSort('area')">Área ↕</th>
              <th onclick="losSort('total')">Dias ↕</th>
              <th onclick="losSort('sessions')">Check-ins ↕</th>
              <th onclick="losSort('focused')">Foco ↕</th>
              <th onclick="losSort('tasks')">Tarefas ↕</th>
              <th onclick="losSort('progress')">Progresso ↕</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="losTbody"></tbody>
        </table>
      </div>
      <div class="los-tbl-footer">
        <span class="los-tbl-info" id="losCount">— áreas</span>
        <div class="los-pagination">
          <button class="los-pg-btn on">1</button>
          <button class="los-pg-btn">2</button>
          <button class="los-pg-btn">›</button>
        </div>
      </div>
    </div>
  </div>`;

  // Destroy previous charts if they exist
  ['losDoughnut','losBar','losLine'].forEach(id=>{
    if(losCharts[id]){losCharts[id].destroy();delete losCharts[id];}
  });

  losRenderTable();

  // Wait for next frame so canvases are in DOM
  requestAnimationFrame(()=>{
    losInitCharts();
    animateBars();
  });
}

/* ── TABLE ──────────────────────────────────────────────── */
function losRenderTable(){
  const sorted=[...losActive].sort((a,b)=>{
    const va=typeof a[losSortKey]==='number'?a[losSortKey]:String(a[losSortKey]);
    const vb=typeof b[losSortKey]==='number'?b[losSortKey]:String(b[losSortKey]);
    return (va>vb?1:-1)*losSortDir;
  });
  const tbody=document.getElementById('losTbody');
  const cnt=document.getElementById('losCount');
  if(!tbody) return;
  if(cnt) cnt.textContent=`${sorted.length} área${sorted.length!==1?'s':''}`;

  tbody.innerHTML=sorted.map((r,i)=>`
    <tr style="transition-delay:${i*35}ms">
      <td>
        <div class="los-area-cell">
          <span class="los-area-dot" style="background:${r.color}"></span>
          <div>
            <div class="los-a-name">${r.icon} ${r.area}</div>
            <div class="los-a-sub">${r.goal}</div>
          </div>
        </div>
      </td>
      <td style="font-weight:700">${r.total}</td>
      <td style="font-weight:700">${r.sessions.toLocaleString()}</td>
      <td style="color:var(--t2)">${r.focused}</td>
      <td style="font-weight:700">${r.tasks}</td>
      <td>
        <div class="los-bar-wrap">
          <div class="los-bar-bg">
            <div class="los-bar-f" data-bar="${r.progress}" style="background:${r.color}"></div>
          </div>
          <span class="los-bar-pct">${r.progress}%</span>
        </div>
      </td>
      <td><span class="los-badge ${r.badge}">${r.lbl}</span></td>
    </tr>
  `).join('');

  requestAnimationFrame(()=>{
    tbody.querySelectorAll('tr').forEach((tr,i)=>
      setTimeout(()=>{ tr.style.opacity='1'; tr.style.transform='translateY(0)'; }, i*35)
    );
    tbody.querySelectorAll('.los-bar-f').forEach(b=>
      setTimeout(()=>{ b.style.width=b.dataset.bar+'%'; }, 180)
    );
  });
}

function losFilter(){
  const q=(document.getElementById('losSrch')||{}).value?.toLowerCase()||'';
  losActive=LOS_ROWS.filter(r=>r.area.toLowerCase().includes(q)||r.goal.toLowerCase().includes(q));
  losRenderTable();
}

function losSort(k){
  if(losSortKey===k) losSortDir*=-1; else{losSortKey=k;losSortDir=-1;}
  losRenderTable();
}

function losExport(){
  const h=['Area','Objetivo','Dias','Check-ins','Foco','Tarefas','Progresso','Status'];
  const rows=losActive.map(r=>[r.area,r.goal,r.total,r.sessions,r.focused,r.tasks,r.progress+'%',r.lbl].join(','));
  const a=Object.assign(document.createElement('a'),{
    href:URL.createObjectURL(new Blob([[h.join(','),...rows].join('\n')],{type:'text/csv'})),
    download:'lifeos-analytics.csv'
  });
  a.click();
  showToast('CSV exportado ✅');
}

/* ── CHARTS ─────────────────────────────────────────────── */
function losInitCharts(){
  const isDark=document.body.classList.contains('dark-theme');
  const gridColor = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)';
  const tickColor = isDark ? '#555' : '#bbb';

  // Doughnut
  const dCtx=document.getElementById('losDoughnut');
  if(dCtx){
    losCharts.losDoughnut=new Chart(dCtx.getContext('2d'),{
      type:'doughnut',
      data:{
        labels:['Projeto','Estudo','Saúde','Rotina','Outros'],
        datasets:[{
          data:[27,24,20,18,11],
          backgroundColor:['#a855f7','#3b82f6','#10b981','#f59e0b','#8b5cf6'],
          borderWidth:isDark?1:2,
          borderColor:isDark?'#111':'#fff',
          hoverOffset:5,
        }]
      },
      options:{
        cutout:'70%',responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.label}: ${c.parsed}%`}}},
        animation:{animateRotate:true,duration:1100,easing:'easeInOutQuart'}
      }
    });
  }

  // Bar
  const bCtx=document.getElementById('losBar');
  if(bCtx){
    losCharts.losBar=new Chart(bCtx.getContext('2d'),{
      type:'bar',
      data:{
        labels:['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago'],
        datasets:[
          {label:'Rotina', data:[55,58,60,63,62,66,68,70],backgroundColor:'rgba(168,85,247,.7)', borderRadius:4,barPercentage:.55},
          {label:'Estudo', data:[40,45,50,55,60,65,70,74],backgroundColor:'rgba(59,130,246,.7)',  borderRadius:4,barPercentage:.55},
          {label:'Projeto',data:[50,55,60,62,65,70,77,82],backgroundColor:'rgba(16,185,129,.7)',  borderRadius:4,barPercentage:.55},
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{
          x:{grid:{display:false},ticks:{font:{size:9},color:tickColor}},
          y:{grid:{color:gridColor},ticks:{font:{size:9},color:tickColor},max:100}
        },
        animation:{duration:1200,easing:'easeOutQuart'}
      }
    });
  }

  // Line
  const lCtx=document.getElementById('losLine');
  if(lCtx){
    const ctx2=lCtx.getContext('2d');
    const grad=ctx2.createLinearGradient(0,0,0,150);
    grad.addColorStop(0,'rgba(168,85,247,.18)');
    grad.addColorStop(1,'rgba(168,85,247,0)');
    const days=Array.from({length:30},(_,i)=>`${i+1}/3`);
    const score=[3.1,3.2,3.0,3.3,3.4,3.2,3.5,3.6,3.4,3.7,3.5,3.8,3.6,3.9,3.8,4.0,3.9,4.1,4.0,4.2,4.1,4.3,4.2,4.4,4.3,4.5,4.3,4.6,4.5,4.7];
    losCharts.losLine=new Chart(ctx2,{
      type:'line',
      data:{
        labels:days,
        datasets:[
          {label:'Score',data:score,borderColor:'#a855f7',borderWidth:2,backgroundColor:grad,fill:true,tension:.4,pointRadius:0,pointHoverRadius:4},
          {label:'Meta', data:Array(30).fill(4.0),borderColor:'rgba(239,68,68,.5)',borderWidth:1.5,borderDash:[5,4],backgroundColor:'transparent',fill:false,tension:0,pointRadius:0},
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{
          x:{grid:{display:false},ticks:{maxTicksLimit:6,font:{size:9},color:tickColor}},
          y:{grid:{color:gridColor},ticks:{font:{size:9},color:tickColor},min:2.5,max:5.5}
        },
        animation:{duration:1400,easing:'easeOutQuart'}
      }
    });
  }
}

/* ─── SVG BAR ────────────────────────────────── */
