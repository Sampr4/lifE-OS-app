/**
 * LifeOS UI-only utilities: visual helpers only.
 */
'use strict';

const $ = id => document.getElementById(id);

function todayStr(){
  return new Date().toLocaleDateString(window.LOCALE?.lang || 'pt-BR', {
    weekday:'long', day:'numeric', month:'long'
  });
}

function animNum(el, to, dur = 300, fmt = v => v){
  if(el) el.textContent = fmt(Number(to || 0));
}

function animateBars(){
  document.querySelectorAll('[data-bar]').forEach(el => {
    el.style.width = `${Number(el.dataset.bar || 0)}%`;
  });
  document.querySelectorAll('[data-ring]').forEach(el => {
    el.style.strokeDashoffset = el.dataset.ring || '339';
  });
}

function showToast(msg){
  const t=$('toast');
  if(!t) return;
  t.textContent=String(msg || 'Aguardando conexão');
  t.classList.add('show');
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.remove('show'),2400);
}

function download(){ showToast('Sem dados para exportar.'); }
function exportCSV(){ showToast('Sem dados para exportar.'); }
function exportJSON(){ showToast('Sem dados para exportar.'); }
function svgBar(){ return '<div class="chart-empty">Sem dados</div>'; }
function svgCheck(){ return '<span>✓</span>'; }

function initCursorGlow(){
  const glow=$('cursor-glow');
  if(!glow || window.matchMedia('(pointer:coarse)').matches) return;
  let mx=0,my=0,cx=0,cy=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;glow.style.opacity='1'});
  document.addEventListener('mouseleave',()=>{glow.style.opacity='0'});
  const lerp=(a,b,t)=>a+(b-a)*t;
  (function tick(){
    cx=lerp(cx,mx,.07); cy=lerp(cy,my,.07);
    glow.style.left=cx+'px'; glow.style.top=cy+'px';
    requestAnimationFrame(tick);
  })();
}
