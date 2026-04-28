/* ============================================================
   LIFEOS v8.7 — MÓDULO: HÁBITOS
   FIX: Removed hardcoded _HI_HABITS array.
        Now reads from HABITS global (populated by /api/habits/current via dashboard)
        with fresh fetch fallback. Profession-specific habits visible immediately.
============================================================ */
'use strict';

/* CSS injetado uma única vez */
(function injectHabitosCSS(){
  if(document.getElementById('hab-intel-css')) return;
  const s=document.createElement('style');
  s.id='hab-intel-css';
  s.textContent=`
.hi-wrap{display:flex;flex-direction:column;gap:28px;width:100%;min-width:0;padding-bottom:32px;font-family:'DM Sans',-apple-system,sans-serif}
.hi-hero{display:grid;grid-template-columns:1fr 160px;gap:40px;align-items:center;padding:28px 28px 24px;background:var(--bg);border:1px solid var(--border);border-radius:12px}
@media(max-width:600px){.hi-hero{grid-template-columns:1fr;gap:20px}}
.hi-kicker{display:flex;align-items:center;gap:10px;font-family:'DM Mono','Courier New',monospace;font-size:.62rem;letter-spacing:.16em;color:var(--warn);text-transform:uppercase;margin-bottom:14px}
.hi-kicker::before{content:'';display:block;width:20px;height:1px;background:var(--warn);opacity:.6}
.hi-h{font-size:clamp(24px,4vw,38px);font-weight:800;line-height:1.1;letter-spacing:-.03em;margin-bottom:10px;color:var(--text)}
.hi-h .hi-em{color:var(--accent);font-style:italic}
.hi-cap{font-size:.82rem;color:var(--t2);line-height:1.7;margin-bottom:22px;max-width:400px}
.hi-dm-row{display:flex;justify-content:space-between;margin-bottom:6px}
.hi-dm-key{font-family:'DM Mono','Courier New',monospace;font-size:.58rem;letter-spacing:.1em;color:var(--t3);text-transform:uppercase}
.hi-dm-val{font-family:'DM Mono','Courier New',monospace;font-size:.58rem;color:var(--accent);transition:all .4s}
.hi-dm-track{height:2px;background:var(--bg-m);border-radius:99px;overflow:visible;position:relative;margin-bottom:18px}
.hi-dm-fill{height:100%;border-radius:99px;background:var(--accent);transition:width 1.3s cubic-bezier(.16,1,.3,1);position:relative}
.hi-dm-fill::after{content:'';position:absolute;right:-4px;top:50%;transform:translateY(-50%);width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px rgba(168,85,247,.6)}
.hi-hstats{display:flex;gap:28px;margin-top:4px}
.hi-hs-n{font-size:1.6rem;font-weight:800;letter-spacing:-.04em;color:var(--text);line-height:1}
.hi-hs-l{font-size:.62rem;color:var(--t3);margin-top:3px;letter-spacing:.02em}
.hi-ring-wrap{position:relative;width:150px;height:150px}
@media(max-width:600px){.hi-ring-wrap{margin:0 auto}}
.hi-ring-svg{transform:rotate(-90deg);display:block;overflow:visible}
.hi-ring-bg{fill:none;stroke:var(--bg-m);stroke-width:1.5}
.hi-ring-fg{fill:none;stroke:var(--accent);stroke-width:1.5;stroke-linecap:round;stroke-dasharray:408;stroke-dashoffset:408;transition:stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1);filter:drop-shadow(0 0 6px rgba(168,85,247,.4))}
.hi-ring-ctr{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}
.hi-ring-n{font-size:26px;font-weight:800;letter-spacing:-.04em;color:var(--text);display:block;line-height:1}
.hi-ring-l{font-family:'DM Mono','Courier New',monospace;font-size:.5rem;letter-spacing:.12em;color:var(--t3);text-transform:uppercase;display:block;margin-top:4px}
.hi-tbar{display:flex;align-items:center;gap:16px;padding:14px 20px;border:1px solid var(--border);border-radius:8px;background:var(--bg)}
.hi-tb-l{font-size:.7rem;color:var(--t3);white-space:nowrap;font-weight:600;min-width:44px}
.hi-tb-track{flex:1;height:1px;background:var(--bg-m);border-radius:99px;overflow:visible;position:relative}
.hi-tb-fill{height:100%;border-radius:99px;background:var(--accent);transition:width .9s cubic-bezier(.16,1,.3,1);position:relative}
.hi-tb-fill.lit::after{content:'';position:absolute;right:-3px;top:50%;transform:translateY(-50%);width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px rgba(168,85,247,.7)}
.hi-tb-n{font-family:'DM Mono','Courier New',monospace;font-size:.65rem;color:var(--t3);white-space:nowrap}
.hi-tb-msg{font-size:.72rem;color:var(--accent);white-space:nowrap;font-weight:600}
.hi-eye{font-family:'DM Mono','Courier New',monospace;font-size:.55rem;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:6px;font-weight:400}
.hi-sec-title{font-size:1.05rem;font-weight:800;letter-spacing:-.03em;margin-bottom:4px;color:var(--text)}
.hi-sec-sub{font-size:.75rem;color:var(--t2);margin-bottom:18px;line-height:1.55}
.hi-list{display:flex;flex-direction:column;gap:1px}
.hi-row{display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--bg);border:1px solid var(--border);cursor:pointer;transition:background .2s;position:relative;overflow:hidden}
.hi-row:first-child{border-radius:8px 8px 0 0}
.hi-row:last-child{border-radius:0 0 8px 8px}
.hi-row::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--accent);transform:scaleY(0);transform-origin:center;transition:transform .4s cubic-bezier(.16,1,.3,1)}
.hi-row:hover{background:var(--bg-s)}
.hi-row:hover::before{transform:scaleY(.35)}
.hi-row.hi-done::before{transform:scaleY(1)}
.hi-row.hi-done{background:var(--acc-bg)}
.hi-box{width:18px;height:18px;flex-shrink:0;border:1px solid var(--border-mid);border-radius:5px;display:grid;place-items:center;transition:all .25s}
.hi-row.hi-done .hi-box{background:var(--accent);border-color:var(--accent)}
.hi-box svg{opacity:0;transform:scale(.3);transition:all .25s .05s}
.hi-row.hi-done .hi-box svg{opacity:1;transform:scale(1)}
.hi-ico{font-size:17px;flex-shrink:0;width:24px;text-align:center}
.hi-body{flex:1;min-width:0}
.hi-name{font-size:.85rem;font-weight:600;color:var(--text);transition:color .3s}
.hi-row.hi-done .hi-name{color:var(--t3);text-decoration:line-through;text-decoration-color:var(--t3)}
.hi-meta{font-size:.65rem;color:var(--t3);margin-top:1px}
.hi-right{display:flex;align-items:center;gap:12px;flex-shrink:0}
.hi-streak{font-family:'DM Mono','Courier New',monospace;font-size:.65rem;color:var(--warn)}
.hi-bw{width:68px;height:1px;background:var(--bg-m);border-radius:99px;overflow:hidden}
.hi-b{height:100%;border-radius:99px;background:var(--accent);transition:width .8s cubic-bezier(.16,1,.3,1)}
@media(max-width:500px){.hi-bw{display:none}}
.hi-loading{padding:52px 24px;text-align:center;color:var(--t3);font-size:.85rem}
.hi-source-badge{font-family:'DM Mono','Courier New',monospace;font-size:.48rem;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;border-radius:4px;background:var(--acc-bg);color:var(--accent);margin-left:8px;opacity:.7}
.hi-focus-banner{padding:10px 20px;background:var(--acc-bg);border:1px solid rgba(168,85,247,.2);border-radius:8px;font-size:.74rem;color:var(--t2)}
.hi-focus-banner strong{color:var(--accent)}
.hi-sp{position:fixed;border-radius:50%;pointer-events:none;z-index:9999;animation:hiSpk .8s ease forwards}
@keyframes hiSpk{0%{transform:scale(1) translate(0,0);opacity:1}100%{transform:scale(0) translate(var(--htx),var(--hty));opacity:0}}
  `;
  document.head.appendChild(s);
})();

/* ── STATE ─────────────────────────────────────────────────────
   v8.7: _HI_HABITS is now populated from API, not hardcoded.
   HABITS global (from data.js + api.js loadDashboard) is the
   primary source. We adapt it to the UI format here.
────────────────────────────────────────────────────────────── */
let _HI_DONE    = new Set();
let _HI_HABITS  = [];   // Populated from API, NOT hardcoded
let _HI_TOTAL   = 0;
let _HI_SOURCE  = 'loading';  // 'plan_habits' | 'habits_flat' | 'demo'

/* ── Map API habit → UI format ─────────────────────────────── */
function _mapHabit(h, idx) {
  const today = new Date().toISOString().split('T')[0];
  const doneDays = Array.isArray(h.days) ? h.days : [];
  const streak = h.streak || 0;
  // bar = streak-based progress capped at 100%
  const bar = Math.min(100, Math.round((streak / Math.max(streak, 14)) * 100)) || 20;
  return {
    id:     h.id || idx,
    icon:   h.icon || '⭐',
    name:   h.name || 'Hábito',
    meta:   `${h.goal || 1} ${h.unit || 'vez'} ${h.focus ? '· ' + h.focus : ''}`.trim(),
    streak: streak,
    bar:    bar,
    done:   doneDays.includes(today),
    source: h.source || 'unknown',
    apiId:  h.id,   // Keep original ID for API calls
  };
}

/* ── Load habits from best available source ────────────────── */
async function _loadHabits() {
  // v8.7 Step 1: Try /api/habits/current (structured plan first)
  try {
    if (typeof LifeOSAPI !== 'undefined') {
      const r = await LifeOSAPI._fetch('/habits/current');
      if (r?.data && r.data.length > 0) {
        console.info('[HABITS] Loaded from /api/habits/current count=%d', r.data.length);
        return { habits: r.data, source: r.data[0]?.source || 'plan_habits' };
      }
    }
  } catch(e) {
    console.warn('[HABITS] /api/habits/current failed:', e.message);
  }

  // Step 2: Use HABITS global (already populated by loadDashboard)
  if (typeof HABITS !== 'undefined' && HABITS.length > 0) {
    console.info('[HABITS] Using HABITS global count=%d', HABITS.length);
    return { habits: HABITS, source: 'habits_flat' };
  }

  // Step 3: Try standard /api/habits endpoint
  try {
    if (typeof LifeOSAPI !== 'undefined') {
      const r = await LifeOSAPI.loadHabits();
      if (r?.data && r.data.length > 0) {
        console.info('[HABITS] Loaded from /api/habits count=%d', r.data.length);
        return { habits: r.data, source: 'habits_flat' };
      }
    }
  } catch(e) {
    console.warn('[HABITS] /api/habits failed:', e.message);
  }

  // Step 4: No real data available
  console.warn('[HABITS] No habit data found - showing empty state');
  return { habits: [], source: 'empty' };
}

/* ── Sparkles ─────────────────────────────────────────────── */
function _hiSparkles(el){
  const r=el.getBoundingClientRect();
  for(let i=0;i<8;i++){
    const sp=document.createElement('div');sp.className='hi-sp';
    const sz=3+Math.random()*6;
    sp.style.cssText=`left:${r.left+Math.random()*r.width}px;top:${r.top+r.height*.5}px;
      width:${sz}px;height:${sz}px;background:var(--accent);
      --htx:${(Math.random()-.5)*70}px;--hty:${-(20+Math.random()*55)}px;
      animation-delay:${Math.random()*.2}s;`;
    document.body.appendChild(sp);
    setTimeout(()=>sp.remove(),1000);
  }
}

/* ── Toggle (also calls API to log) ───────────────────────── */
async function _hiToggle(localId){
  const el=document.getElementById(`hi-hr${localId}`);
  if(!el)return;
  const h = _HI_HABITS.find(x=>x.id===localId);
  if(!h) return;

  _HI_DONE.has(localId)?_HI_DONE.delete(localId):_HI_DONE.add(localId);
  el.classList.toggle('hi-done',_HI_DONE.has(localId));

  const bar=document.getElementById(`hi-b${localId}`);
  if(bar)bar.style.width=_HI_DONE.has(localId)?'100%':h.bar+'%';
  if(_HI_DONE.has(localId))_hiSparkles(el);
  _hiUpdate();

  // Persist to backend if we have a real API ID
  if(h.apiId && typeof LifeOSAPI !== 'undefined'){
    try {
      await LifeOSAPI.logHabit(h.apiId, { done: _HI_DONE.has(localId) });
    } catch(e){
      console.warn('[HABITS] Log API call failed:', e.message);
    }
  }
}

function _hiUpdate(){
  const n=_HI_DONE.size;
  const pct=_HI_TOTAL > 0 ? Math.round((n/_HI_TOTAL)*100) : 0;
  const tf=document.getElementById('hi-tbfill');
  if(tf){tf.style.width=pct+'%';tf.classList.toggle('lit',n>0)}
  const tn=document.getElementById('hi-tbn');if(tn)tn.textContent=`${n} / ${_HI_TOTAL}`;
  const msgs=['Comece seu dia ✦','Bom início ✦','Na metade ✦','Quase lá ✦','Dia perfeito ✦'];
  const tm=document.getElementById('hi-tbmsg');if(tm)tm.textContent=msgs[Math.min(n,4)];
  const hs=document.getElementById('hi-hsdone');if(hs)hs.textContent=n;
  const base=64,total=Math.min(100,base+(n/Math.max(_HI_TOTAL,1))*36);
  const C=2*Math.PI*65;
  const fg=document.getElementById('hi-rfg');if(fg)fg.style.strokeDashoffset=C-(total/100)*C;
  const rn=document.getElementById('hi-rn');if(rn)rn.textContent=Math.round(total)+'%';
  const df=document.getElementById('hi-dmfill');if(df)df.style.width=total+'%';
  const dv=document.getElementById('hi-dmval');if(dv)dv.textContent=Math.round(total)+'%';
}

/* ── Render habit rows ─────────────────────────────────────── */
function _renderHabitRows() {
  const list=document.getElementById('hi-list');
  if(!list) return;
  list.innerHTML = '';

  if(_HI_HABITS.length === 0){
    list.innerHTML = `<div class="hi-loading">
      Nenhum hábito encontrado. Complete o onboarding para gerar seu plano personalizado.
    </div>`;
    return;
  }

  _HI_HABITS.forEach(h=>{
    if(h.done) _HI_DONE.add(h.id);
    const el=document.createElement('div');
    el.className='hi-row'+(h.done?' hi-done':'');
    el.id=`hi-hr${h.id}`;
    el.innerHTML=`
      <div class="hi-box">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l2.5 2.5 4.5-5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="hi-ico">${h.icon}</div>
      <div class="hi-body">
        <div class="hi-name">${h.name}</div>
        <div class="hi-meta">${h.meta}</div>
      </div>
      <div class="hi-right">
        <div class="hi-streak">🔥 ${h.streak}d</div>
        <div class="hi-bw"><div class="hi-b" id="hi-b${h.id}" style="width:${h.done?100:h.bar}%"></div></div>
      </div>`;
    el.addEventListener('click',()=>_hiToggle(h.id));
    list.appendChild(el);
  });
}

/* ── Main render function ─────────────────────────────────── */
async function renderHabitos(s){
  _HI_DONE = new Set();
  _HI_HABITS = [];

  // Show skeleton immediately
  s.innerHTML = `<div class="hi-wrap">
    <div class="hi-loading">⏳ Carregando seus hábitos personalizados...</div>
  </div>`;

  // Load data
  const { habits: rawHabits, source } = await _loadHabits();
  _HI_SOURCE = source;
  _HI_HABITS = rawHabits.map(_mapHabit);
  _HI_TOTAL  = _HI_HABITS.length;

  // Build profession context label
  const prof = (typeof USER !== 'undefined' && USER.profession) ? USER.profession : '';
  const focusTheme = rawHabits[0]?.focus || '';
  const sourceLabel = source === 'plan_habits' ? 'plano semanal' : 'seus hábitos';

  // Render full UI
  s.innerHTML=`<div class="hi-wrap">

  <!-- HERO -->
  <div class="hi-hero">
    <div>
      <div class="hi-kicker">${prof ? prof : 'Seus hábitos'} — Plano Ativo</div>
      <h2 class="hi-h">Hábitos de<br><em class="hi-em">hoje</em></h2>
      <p class="hi-cap">Cada pequena ação, feita com consistência, constrói quem você está se tornando.</p>
      <div style="max-width:360px">
        <div class="hi-dm-row">
          <span class="hi-dm-key">DISCIPLINA</span>
          <span class="hi-dm-val" id="hi-dmval">64%</span>
        </div>
        <div class="hi-dm-track"><div class="hi-dm-fill" id="hi-dmfill" style="width:64%"></div></div>
      </div>
      <div class="hi-hstats">
        <div><div class="hi-hs-n">${rawHabits[0]?.streak||0}</div><div class="hi-hs-l">dias seguidos</div></div>
        <div><div class="hi-hs-n" id="hi-hsdone">0</div><div class="hi-hs-l">concluídos hoje</div></div>
        <div><div class="hi-hs-n">${_HI_TOTAL}</div><div class="hi-hs-l">hábitos ativos</div></div>
      </div>
    </div>
    <div class="hi-ring-wrap">
      <svg class="hi-ring-svg" viewBox="0 0 160 160" width="150" height="150">
        <circle class="hi-ring-bg" cx="80" cy="80" r="65"/>
        <circle class="hi-ring-fg" id="hi-rfg" cx="80" cy="80" r="65"/>
      </svg>
      <div class="hi-ring-ctr">
        <span class="hi-ring-n" id="hi-rn">0%</span>
        <span class="hi-ring-l">geral</span>
      </div>
    </div>
  </div>

  <!-- FOCUS BANNER (shows week focus theme if plan_habits) -->
  ${focusTheme ? `<div class="hi-focus-banner">🎯 Foco desta semana: <strong>${focusTheme}</strong></div>` : ''}

  <!-- TODAY BAR -->
  <div class="hi-tbar">
    <span class="hi-tb-l">Hoje</span>
    <div class="hi-tb-track"><div class="hi-tb-fill" id="hi-tbfill" style="width:0%"></div></div>
    <span class="hi-tb-n" id="hi-tbn">0 / ${_HI_TOTAL}</span>
    <span class="hi-tb-msg" id="hi-tbmsg">Comece seu dia ✦</span>
  </div>

  <!-- HABITS LIST -->
  <div>
    <div class="hi-eye">do seu ${sourceLabel}</div>
    <h3 class="hi-sec-title">Lista de hábitos${prof ? ` · ${prof}` : ''}</h3>
    <p class="hi-sec-sub">Clique para marcar como concluído. Seu progresso atualiza em tempo real.</p>
    <div class="hi-list" id="hi-list"></div>
  </div>

  </div>`;

  // Render rows with real data
  _renderHabitRows();

  // Animate ring
  const C=2*Math.PI*65;
  setTimeout(()=>{const fg=document.getElementById('hi-rfg');if(fg)fg.style.strokeDashoffset=C-(64/100)*C;},250);

  _hiUpdate();

  console.info('[HABITS/UI] Rendered source=%s count=%d prof=%s', _HI_SOURCE, _HI_TOTAL, prof);
}
