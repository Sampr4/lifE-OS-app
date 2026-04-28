/* ============================================================
   LIFEOS v8.7 — MÓDULO: ROTINA
   FIX: Removed hardcoded NR_TASK_DEFS array.
        Now reads from ROUTINE global (populated by /api/routine/current)
        with fresh fetch fallback. Profession-specific tasks visible immediately.
============================================================ */
'use strict';

/* ── CSS (injetado uma única vez) ── */
(function injectRotinaCSS(){
  if(document.getElementById('nr-style')) return;
  const s=document.createElement('style');
  s.id='nr-style';
  s.textContent=`
.nr-wrap{display:flex;flex-direction:column;gap:20px;max-width:1160px;margin:0 auto}
.nr-hero{display:grid;grid-template-columns:1fr 200px;gap:0;align-items:stretch;background:var(--bg);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:var(--shadow)}
.nr-hero-left{padding:32px 36px}
.nr-hero-right{display:flex;align-items:center;justify-content:center;border-left:1px solid var(--border);padding:28px 24px}
.nr-eye{font-size:.6rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:10px;display:flex;align-items:center;gap:8px}
.nr-eye::before{content:'';width:14px;height:1px;background:var(--accent)}
.nr-title{font-size:2.4rem;font-weight:800;letter-spacing:-.05em;line-height:1.02;color:var(--text)}
.nr-title em{font-style:normal;color:var(--accent)}
.nr-mot{font-size:.82rem;font-weight:400;color:var(--t2);margin-top:8px;line-height:1.65;max-width:380px;transition:color .5s}
.nr-prog-row{display:flex;justify-content:space-between;margin-bottom:9px;align-items:center;margin-top:24px}
.nr-prog-lbl{font-size:.68rem;font-weight:700;color:var(--t3);letter-spacing:.06em;text-transform:uppercase}
.nr-prog-val{font-size:.7rem;font-family:var(--font-mono);color:var(--accent);font-weight:500}
.nr-track{width:100%;height:3px;background:var(--bg-m);border-radius:100px;position:relative}
.nr-fill{height:100%;border-radius:100px;width:0%;background:linear-gradient(90deg,var(--acc2),var(--accent),var(--purple));transition:width 1s cubic-bezier(.4,0,.2,1);position:relative;box-shadow:0 0 12px rgba(168,85,247,.3)}
.nr-fill::after{content:'';position:absolute;right:-5px;top:50%;transform:translateY(-50%);width:10px;height:10px;border-radius:50%;background:var(--purple);box-shadow:0 0 10px var(--accent);opacity:0;transition:opacity .4s .5s}
.nr-fill.on::after{opacity:1}
.nr-ring{position:relative;width:120px;height:120px}
.nr-ring svg{width:100%;height:100%}
.nr-ring-bg{fill:none;stroke:var(--bg-m);stroke-width:8}
.nr-ring-fg{fill:none;stroke:url(#nrGrad);stroke-width:8;stroke-linecap:round;stroke-dasharray:345;stroke-dashoffset:345;transform:rotate(-90deg);transform-origin:65px 65px;transition:stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)}
.nr-ring-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.nr-ring-pct{font-family:var(--font-mono);font-size:1.5rem;font-weight:600;letter-spacing:-.04em;color:var(--accent);transition:color .5s}
.nr-ring-pct.done{color:var(--ok)}
.nr-ring-sub{font-size:.52rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--t3)}
.nr-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.nr-stat{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;transition:transform .3s cubic-bezier(.34,1.56,.64,1),border-color .3s;cursor:default}
.nr-stat:hover{transform:translateY(-3px);border-color:var(--border-mid)}
.nr-stat-icon{font-size:1rem;margin-bottom:10px;display:block}
.nr-stat-num{font-family:var(--font-mono);font-size:2rem;font-weight:300;letter-spacing:-.05em;color:var(--text);transition:color .4s;line-height:1}
.nr-stat-num.lit{color:var(--accent)}
.nr-stat-num.glit{color:var(--ok)}
.nr-stat-lbl{font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);margin-top:5px}
.nr-sbar{height:2px;background:var(--bg-m);border-radius:100px;margin-top:12px;overflow:hidden}
.nr-sbar-fill{height:100%;border-radius:100px;width:0%;transition:width .9s cubic-bezier(.4,0,.2,1)}
.nr-sbar-fill.p{background:linear-gradient(90deg,var(--acc2),var(--purple))}
.nr-sbar-fill.g{background:linear-gradient(90deg,#059669,var(--ok))}
.nr-grid{display:grid;grid-template-columns:1.15fr 1fr;gap:18px;align-items:start}
.nr-card{background:var(--bg);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:border-color .3s,box-shadow .2s}
.nr-card:hover{border-color:var(--border-mid);box-shadow:var(--shadow)}
.nr-ch{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.nr-ch-t{font-size:.66rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--t2)}
.nr-pill{font-family:var(--font-mono);font-size:.6rem;padding:3px 10px;border-radius:100px;background:var(--acc-bg);color:var(--accent);border:1px solid rgba(168,85,247,.2);transition:all .3s}
.nr-pill.done{background:rgba(16,185,129,.08);color:var(--ok);border-color:rgba(16,185,129,.2)}
.nr-tlist{padding:4px 0}
.nr-task{display:flex;align-items:center;gap:14px;padding:13px 24px;cursor:pointer;border-bottom:1px solid var(--border);position:relative;overflow:hidden;transition:background .2s;user-select:none}
.nr-task:last-child{border-bottom:none}
.nr-task:hover{background:var(--acc-bg)}
.nr-task.nr-done .nr-tn{color:var(--t3);text-decoration:line-through;text-decoration-color:rgba(168,85,247,.35)}
.nr-task.nr-done .nr-ts{color:var(--t3)}
.nr-task.nr-done{background:rgba(168,85,247,.02)}
.nr-task.nr-pop{animation:nrPop .4s cubic-bezier(.34,1.4,.64,1)}
@keyframes nrPop{0%{transform:scale(1)}50%{transform:scale(1.015)}100%{transform:scale(1)}}
.nr-cb{width:20px;height:20px;border-radius:7px;border:1.5px solid var(--border-mid);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .28s cubic-bezier(.34,1.2,.64,1)}
.nr-task:hover .nr-cb{border-color:var(--accent)}
.nr-task.nr-done .nr-cb{background:var(--accent);border-color:var(--accent);box-shadow:0 0 12px rgba(168,85,247,.3)}
.nr-csym{width:10px;height:10px;stroke:#fff;stroke-width:2.5;fill:none;stroke-dasharray:14;stroke-dashoffset:14;transition:stroke-dashoffset .28s cubic-bezier(.4,0,.2,1) .04s}
.nr-task.nr-done .nr-csym{stroke-dashoffset:0}
.nr-ti{flex:1;min-width:0}
.nr-tn{font-size:.88rem;font-weight:600;color:var(--text);transition:color .3s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nr-ts{font-size:.68rem;color:var(--t2);margin-top:1px;font-weight:400}
.nr-ttag{font-family:var(--font-mono);font-size:.56rem;padding:2px 8px;border-radius:100px;background:var(--bg-m);color:var(--t3);border:1px solid var(--border);flex-shrink:0;transition:all .3s}
.nr-task.nr-done .nr-ttag{background:var(--acc-bg);color:var(--accent);border-color:rgba(168,85,247,.25)}
.nr-nodata{padding:52px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px}
.nr-nodata-icon{font-size:2.2rem;opacity:.3}
.nr-nodata-title{font-size:.88rem;font-weight:700;color:var(--t2)}
.nr-nodata-sub{font-size:.74rem;color:var(--t3);line-height:1.7;max-width:280px}
.nr-rside{display:flex;flex-direction:column;gap:18px}
.nr-live-row{display:flex;align-items:center;gap:7px;font-size:.6rem;color:var(--t2)}
.nr-live-dot{width:6px;height:6px;border-radius:50%;background:var(--ok);flex-shrink:0;animation:nrDot 1.8s ease-in-out infinite;box-shadow:0 0 6px var(--ok)}
@keyframes nrDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.8)}}
.nr-blist{padding:16px 20px;display:flex;flex-direction:column;gap:11px}
.nr-brow{display:flex;align-items:center;gap:10px}
.nr-blbl{font-size:.64rem;font-weight:600;color:var(--t2);width:80px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nr-btrk{flex:1;height:4px;background:var(--bg-m);border-radius:100px;overflow:hidden}
.nr-bfill{height:100%;border-radius:100px;width:0%;background:linear-gradient(90deg,var(--acc2),var(--purple));transition:width .9s cubic-bezier(.4,0,.2,1)}
.nr-bfill.gn{background:linear-gradient(90deg,#059669,var(--ok))}
.nr-bpct{font-family:var(--font-mono);font-size:.56rem;color:var(--t3);width:24px;text-align:right;flex-shrink:0}
.nr-bpct.gn{color:var(--ok)}
.nr-reward{padding:16px 22px;background:linear-gradient(100deg,var(--acc-bg),rgba(16,185,129,.06));border:1px solid rgba(168,85,247,.2);border-radius:12px;display:flex;align-items:center;gap:16px;transform:translateY(10px);opacity:0;transition:transform .5s cubic-bezier(.34,1.4,.64,1),opacity .4s;pointer-events:none}
.nr-reward.show{transform:translateY(0);opacity:1;pointer-events:auto}
.nr-reward-icon{font-size:1.6rem;line-height:1;flex-shrink:0;animation:nrIcon 1.2s ease-in-out infinite}
@keyframes nrIcon{0%,100%{transform:rotate(-5deg) scale(1)}50%{transform:rotate(5deg) scale(1.12)}}
.nr-reward-body{flex:1}
.nr-reward-title{font-size:.88rem;font-weight:800;color:var(--text)}
.nr-reward-sub{font-size:.7rem;font-weight:400;color:var(--t2);margin-top:2px}
.nr-reward-mult{font-family:var(--font-mono);font-size:1.5rem;font-weight:700;color:var(--warn);flex-shrink:0}
.nr-weekly-goal{padding:14px 20px;background:var(--acc-bg);border:1px solid rgba(168,85,247,.2);border-radius:8px;font-size:.77rem;color:var(--t2);margin-bottom:4px}
.nr-weekly-goal strong{color:var(--accent)}
.nr-top-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.nr-top-date{font-family:var(--font-mono);font-size:.66rem;color:var(--t3);letter-spacing:.04em}
#nr-pcv{position:fixed;inset:0;pointer-events:none;z-index:400}
@media(max-width:900px){.nr-grid{grid-template-columns:1fr}.nr-stats{grid-template-columns:repeat(2,1fr)}.nr-hero{grid-template-columns:1fr}.nr-hero-right{display:none}.nr-wrap{padding:0}}
  `;
  document.head.appendChild(s);
})();

/* ── STATE ─────────────────────────────────────────────────────
   v8.7: NR_TASKS is now populated from API, NOT hardcoded.
   ROUTINE global (from data.js + api.js loadDashboard) is the
   primary source. Falls back to /api/routine/current.
────────────────────────────────────────────────────────────── */
let NR_TASKS    = [];   // Populated from API
let NR_STREAK   = 0;
let NR_SOURCE   = 'loading';
let NR_WEEKLY_GOAL = '';

const NR_MOTS=[
  'Sua rotina hoje é feita para a sua profissão. Comece. ✦',
  'Bom início ✦ — o momentum é real.',
  'Dois feitos. O ritmo é seu.',
  'Metade do caminho — e você está apenas aquecendo.',
  'Quase lá. Isso é disciplina de alto nível.',
  'Falta uma. O dia perfeito está a um check de distância.',
  '✦ Dia 100% concluído. Você é diferente da média.',
];
const NR_REWARDS=[null,null,
  {icon:'⚡',title:'Sequência iniciada!',sub:'2 seguidas — o ritmo é seu',mult:'×2'},
  {icon:'🔥',title:'Em chamas!',sub:'3 consecutivas. Não pare agora.',mult:'×3'},
  {icon:'🚀',title:'Modo imparável!',sub:'4 seguidas. Isso é elite.',mult:'×4'},
  {icon:'👑',title:'Quase lendário!',sub:'5 de fila. Mais um.',mult:'×5'},
  {icon:'🏆',title:'DIA PERFEITO!',sub:'6/6. Você fez história hoje.',mult:'100%'},
];

/* ── Map API routine item → UI task format ─────────────────── */
function _mapRoutineItem(r, idx) {
  return {
    id:     r.id || idx,
    apiId:  r.id,
    name:   r.text || r.activity || 'Tarefa',
    sub:    r.time ? `${r.time} · ${r.cat || 'trabalho'}` : (r.cat || 'trabalho'),
    tag:    r.cat || r.category || 'trabalho',
    done:   r.done || false,
    desc:   r.desc || r.description || '',
    source: r.source || 'unknown',
  };
}

/* ── Load routine from best available source ──────────────── */
async function _loadRoutine() {
  // v8.7 Step 1: Try /api/routine/current (structured plan first)
  try {
    if (typeof LifeOSAPI !== 'undefined') {
      const r = await LifeOSAPI._fetch('/routine/current');
      if (r?.data && r.data.length > 0) {
        console.info('[ROUTINE] Loaded from /api/routine/current count=%d', r.data.length);
        const weeklyGoal = r.data[0]?.weekly_goal || '';
        return { routine: r.data, source: r.data[0]?.source || 'plan_tasks', weeklyGoal };
      }
    }
  } catch(e) {
    console.warn('[ROUTINE] /api/routine/current failed:', e.message);
  }

  // Step 2: Use ROUTINE global (already populated by loadDashboard)
  if (typeof ROUTINE !== 'undefined' && ROUTINE.length > 0) {
    console.info('[ROUTINE] Using ROUTINE global count=%d', ROUTINE.length);
    return { routine: ROUTINE, source: 'routine_flat', weeklyGoal: '' };
  }

  // Step 3: Try standard /api/routine endpoint
  try {
    if (typeof LifeOSAPI !== 'undefined') {
      const r = await LifeOSAPI.loadRoutine();
      if (r?.data && r.data.length > 0) {
        console.info('[ROUTINE] Loaded from /api/routine count=%d', r.data.length);
        return { routine: r.data, source: 'routine_flat', weeklyGoal: '' };
      }
    }
  } catch(e) {
    console.warn('[ROUTINE] /api/routine failed:', e.message);
  }

  console.warn('[ROUTINE] No routine data found - showing empty state');
  return { routine: [], source: 'empty', weeklyGoal: '' };
}

/* ── Particles ─────────────────────────────────────────────── */
let nrParts=[];
function nrEnsureCanvas(){
  if(document.getElementById('nr-pcv'))return;
  const c=document.createElement('canvas');c.id='nr-pcv';
  document.body.appendChild(c);
  c.width=innerWidth;c.height=innerHeight;
  window.addEventListener('resize',()=>{c.width=innerWidth;c.height=innerHeight});
  (function loop(){
    const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
    nrParts=nrParts.filter(p=>p.life>0);
    for(const p of nrParts){p.x+=p.vx;p.y+=p.vy;p.vy+=.18;p.life-=p.decay;p.rot+=p.rv;
      ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;
      ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      if(p.sq)ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r);
      else{ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill()}
      ctx.restore()}
    ctx.globalAlpha=1;requestAnimationFrame(loop);
  })();
}
function nrBurst(x,y){
  nrEnsureCanvas();
  const cols=['#a855f7','#c084fc','#9333ea','#10b981','#fbbf24','#fff'];
  for(let i=0;i<44;i++){const a=Math.random()*Math.PI*2,s=2+Math.random()*6.5;
    nrParts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-3.5,life:1,
      decay:.017+Math.random()*.022,r:1.5+Math.random()*4,
      col:cols[~~(Math.random()*cols.length)],
      rot:Math.random()*Math.PI*2,rv:(Math.random()-.5)*.3,sq:Math.random()>.65})
  }
}

/* ── Helpers ───────────────────────────────────────────────── */
function nrCalcPct(){return NR_TASKS.length>0?Math.round(NR_TASKS.filter(t=>t.done).length/NR_TASKS.length*100):0}
function nrDoneCount(){return NR_TASKS.filter(t=>t.done).length}
function nrGetEl(id){return document.getElementById('nr-'+id)}

/* ── Task render ───────────────────────────────────────────── */
function nrRenderTasks(){
  const ul=nrGetEl('tlist');if(!ul)return;ul.innerHTML='';
  if(NR_TASKS.length===0){
    ul.innerHTML=`<div class="nr-nodata">
      <div class="nr-nodata-icon">📋</div>
      <div class="nr-nodata-title">Nenhuma tarefa encontrada</div>
      <div class="nr-nodata-sub">Complete o onboarding para gerar sua rotina personalizada para sua profissão.</div>
    </div>`;
    return;
  }
  NR_TASKS.forEach(t=>{
    const el=document.createElement('div');
    el.className='nr-task'+(t.done?' nr-done':'');
    el.dataset.nrid=t.id;
    el.innerHTML=`<div class="nr-cb"><svg class="nr-csym" viewBox="0 0 10 8"><polyline points="1,4 4,7 9,1"/></svg></div>
      <div class="nr-ti"><div class="nr-tn">${t.name}</div><div class="nr-ts">${t.sub}</div></div>
      <span class="nr-ttag">${t.tag}</span>`;
    el.addEventListener('click',ev=>nrToggle(t.id,ev));
    ul.appendChild(el);
  });
}

/* ── Toggle ────────────────────────────────────────────────── */
async function nrToggle(id, ev){
  const t=NR_TASKS.find(x=>x.id===id);if(!t)return;
  t.done=!t.done;
  if(t.done)NR_STREAK++;else NR_STREAK=Math.max(0,NR_STREAK-1);
  const el=document.querySelector(`.nr-task[data-nrid="${id}"]`);
  if(el){
    el.classList.toggle('nr-done',t.done);el.classList.add('nr-pop');
    el.addEventListener('animationend',()=>el.classList.remove('nr-pop'),{once:true});
    if(t.done&&ev)nrBurst(ev.clientX,ev.clientY);
  }
  nrRefreshAll(nrCalcPct());

  // Persist to backend
  if(t.apiId && typeof LifeOSAPI !== 'undefined'){
    try {
      await LifeOSAPI.toggleRoutine(t.apiId);
    } catch(e){
      console.warn('[ROUTINE] Toggle API call failed:', e.message);
    }
  }
  if(typeof showToast !== 'undefined') showToast(t.done?`✦ ${t.name} concluída`:`↩ ${t.name} reaberta`);
}

/* ── Refresh All ───────────────────────────────────────────── */
function nrRefreshAll(pct){
  const done=nrDoneCount(),total=NR_TASKS.length;
  const fill=nrGetEl('fill');
  if(fill){fill.style.width=pct+'%';fill.className='nr-fill'+(pct>0?' on':'')}
  const pvEl=nrGetEl('pv');if(pvEl)pvEl.textContent=`${done} de ${total}`;
  const badgeEl=nrGetEl('badge');if(badgeEl){badgeEl.textContent=`${done} / ${total}`;badgeEl.className='nr-pill'+(done===total?' done':'')}
  const motEl=nrGetEl('mot');if(motEl)motEl.textContent=NR_MOTS[Math.min(done,NR_MOTS.length-1)];
  const rfg=nrGetEl('rfg');if(rfg)rfg.style.strokeDashoffset=345-345*pct/100;
  const rpct=nrGetEl('rpct');if(rpct){rpct.textContent=pct+'%';rpct.className='nr-ring-pct'+(pct===100?' done':'')}

  const sn0=nrGetEl('sn0');if(sn0){sn0.textContent=done;sn0.className='nr-stat-num'+(done>0?' lit':'')}
  const sb0=nrGetEl('sb0');if(sb0)sb0.style.width=total>0?(done/total*100)+'%':'0%';
  const sn1=nrGetEl('sn1');if(sn1)sn1.textContent=total-done;
  const sb1=nrGetEl('sb1');if(sb1)sb1.style.width=total>0?((total-done)/total*100)+'%':'0%';
  const sn2=nrGetEl('sn2');if(sn2){sn2.textContent=pct+'%';sn2.className='nr-stat-num'+(pct>0?' lit':'')}
  const sb2=nrGetEl('sb2');if(sb2)sb2.style.width=pct+'%';
  const sn3=nrGetEl('sn3');if(sn3){sn3.textContent=NR_STREAK;sn3.className='nr-stat-num'+(NR_STREAK>=2?' glit':'')}
  const sb3=nrGetEl('sb3');if(sb3)sb3.style.width=total>0?(NR_STREAK/total*100)+'%':'0%';

  nrRenderBars(NR_TASKS);
  nrShowReward(done);
}

function nrRenderBars(tasks){
  const wrap=nrGetEl('blist');if(!wrap)return;wrap.innerHTML='';
  tasks.forEach(t=>{
    const row=document.createElement('div');row.className='nr-brow';
    const label=t.name.length>12?t.name.substring(0,12)+'…':t.name;
    row.innerHTML=`<div class="nr-blbl" title="${t.name}">${label}</div>
      <div class="nr-btrk"><div class="nr-bfill${t.done?' gn':''}" style="width:${t.done?100:0}%"></div></div>
      <div class="nr-bpct${t.done?' gn':''}">${t.done?'✓':'—'}</div>`;
    wrap.appendChild(row);
  });
}

function nrShowReward(done){
  const el=nrGetEl('reward');if(!el)return;const r=NR_REWARDS[done];
  if(r){
    const ic=nrGetEl('ricon'),rt=nrGetEl('rtitle'),rs=nrGetEl('rsub'),rm=nrGetEl('rmult');
    if(ic)ic.textContent=r.icon;if(rt)rt.textContent=r.title;if(rs)rs.textContent=r.sub;if(rm)rm.textContent=r.mult;
    el.classList.add('show');
  }else el.classList.remove('show');
}

/* ── MAIN RENDER FUNCTION ──────────────────────────────────── */
async function renderNovaRotina(s){
  NR_STREAK=0;
  NR_TASKS=[];

  // Show skeleton
  s.innerHTML=`<div class="nr-wrap"><div style="padding:52px 24px;text-align:center;color:var(--t3)">⏳ Carregando sua rotina personalizada...</div></div>`;

  // Load data
  const { routine: rawRoutine, source, weeklyGoal } = await _loadRoutine();
  NR_SOURCE     = source;
  NR_WEEKLY_GOAL = weeklyGoal;
  NR_TASKS      = rawRoutine.map(_mapRoutineItem);

  // Initial done state
  NR_TASKS.forEach(t=>{ if(t.done) NR_STREAK++; });

  const pct     = nrCalcPct();
  const total   = NR_TASKS.length;
  const prof    = (typeof USER !== 'undefined' && USER.profession) ? USER.profession : '';
  const focusTh = rawRoutine[0]?.focus || '';
  const now     = new Date();
  const dateLabel = now.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'short'});

  s.innerHTML=`
  <div class="nr-wrap">

    <!-- TOP ROW -->
    <div class="nr-top-row">
      <span class="nr-top-date">${dateLabel}</span>
      <span style="font-family:var(--font-mono);font-size:.56rem;color:var(--t3)">
        ${source==='plan_tasks'?'✦ plano semanal':'rotina pessoal'}
        ${prof?' · '+prof:''}
      </span>
    </div>

    <!-- WEEKLY GOAL BANNER -->
    ${NR_WEEKLY_GOAL?`<div class="nr-weekly-goal">🎯 Meta da semana: <strong>${NR_WEEKLY_GOAL}</strong></div>`:''}
    ${focusTh && !NR_WEEKLY_GOAL?`<div class="nr-weekly-goal">🎯 Foco da semana: <strong>${focusTh}</strong></div>`:''}

    <!-- HERO -->
    <div class="nr-hero">
      <div class="nr-hero-left">
        <div class="nr-eye">Produtividade Diária</div>
        <h2 class="nr-title"><em>${prof?prof:'Rotina'}</em><br><span>de Hoje</span></h2>
        <p class="nr-mot" id="nr-mot">${NR_MOTS[nrDoneCount()]}</p>
        <div style="margin-top:24px">
          <div class="nr-prog-row">
            <span class="nr-prog-lbl">Progresso</span>
            <span class="nr-prog-val" id="nr-pv">0 de ${total}</span>
          </div>
          <div class="nr-track"><div class="nr-fill" id="nr-fill"></div></div>
        </div>
      </div>
      <div class="nr-hero-right">
        <div class="nr-ring">
          <svg viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="nrGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#9333ea"/>
                <stop offset="100%" stop-color="#c084fc"/>
              </linearGradient>
            </defs>
            <circle class="nr-ring-bg" cx="65" cy="65" r="55"/>
            <circle class="nr-ring-fg" id="nr-rfg" cx="65" cy="65" r="55"/>
          </svg>
          <div class="nr-ring-inner">
            <div class="nr-ring-pct" id="nr-rpct">0%</div>
            <div class="nr-ring-sub">Completo</div>
          </div>
        </div>
      </div>
    </div>

    <!-- STATS -->
    <div class="nr-stats">
      <div class="nr-stat"><span class="nr-stat-icon">✦</span><div class="nr-stat-num" id="nr-sn0">0</div><div class="nr-stat-lbl">Concluídas</div><div class="nr-sbar"><div class="nr-sbar-fill p" id="nr-sb0"></div></div></div>
      <div class="nr-stat"><span class="nr-stat-icon">◌</span><div class="nr-stat-num" id="nr-sn1">${total}</div><div class="nr-stat-lbl">Restantes</div><div class="nr-sbar"><div class="nr-sbar-fill p" id="nr-sb1" style="width:100%"></div></div></div>
      <div class="nr-stat"><span class="nr-stat-icon">↗</span><div class="nr-stat-num" id="nr-sn2">0%</div><div class="nr-stat-lbl">Eficiência</div><div class="nr-sbar"><div class="nr-sbar-fill p" id="nr-sb2"></div></div></div>
      <div class="nr-stat"><span class="nr-stat-icon">🔥</span><div class="nr-stat-num" id="nr-sn3">0</div><div class="nr-stat-lbl">Sequência</div><div class="nr-sbar"><div class="nr-sbar-fill g" id="nr-sb3"></div></div></div>
    </div>

    <!-- REWARD -->
    <div class="nr-reward" id="nr-reward">
      <span class="nr-reward-icon" id="nr-ricon">⚡</span>
      <div class="nr-reward-body"><div class="nr-reward-title" id="nr-rtitle"></div><div class="nr-reward-sub" id="nr-rsub"></div></div>
      <div class="nr-reward-mult" id="nr-rmult"></div>
    </div>

    <!-- GRID -->
    <div class="nr-grid">
      <div class="nr-card">
        <div class="nr-ch">
          <span class="nr-ch-t">Tarefas do dia${prof?' · '+prof:''}</span>
          <span class="nr-pill" id="nr-badge">0 / ${total}</span>
        </div>
        <div class="nr-tlist" id="nr-tlist"></div>
      </div>
      <div class="nr-rside">
        <div class="nr-card">
          <div class="nr-ch">
            <span class="nr-ch-t">Por Tarefa</span>
            <div class="nr-live-row"><span class="nr-live-dot"></span><span>Ao vivo</span></div>
          </div>
          <div class="nr-blist" id="nr-blist"></div>
        </div>
      </div>
    </div>
  </div>`;

  nrRenderTasks();
  nrRefreshAll(pct);

  if(typeof showToast !== 'undefined') setTimeout(()=>showToast('✦ Sua Rotina está pronta!'),600);

  console.info('[ROUTINE/UI] Rendered source=%s count=%d prof=%s', NR_SOURCE, total, prof);
}
