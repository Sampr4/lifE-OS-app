/**
 * LifeOS UI-only app bootstrap. No auth, no backend, no redirects.
 */
'use strict';

function _emptyState(title='Sem dados', desc='Conteúdo será carregado futuramente.'){
  return `<div style="padding:1.25rem;border:1px dashed var(--border);border-radius:var(--r);text-align:center;color:var(--t3)">
    <p style="font-weight:800;color:var(--text)">${title}</p>
    <p style="font-size:.82rem">${desc}</p>
  </div>`;
}

function initTheme(){
  const t=$('theme-toggle');
  if(!t) return;
  t.addEventListener('click',()=>{
    document.body.classList.toggle('dark-theme');
    showToast('Tema alternado');
    renderModule(activeModule);
  });
}

function renderHeader(){
  if($('dd-name')) $('dd-name').textContent='LifeOS Shell';
  if($('dd-email')) $('dd-email').textContent='Aguardando conexão';
  if($('notif-dot')) $('notif-dot').style.display='none';
}

function renderNotifList(){
  const l=$('notif-list');
  if(l) l.innerHTML='<div class="notif-empty">Sem notificações.</div>';
}

function renderCarousel(){
  const track=$('carousel-track');
  if(!track) return;
  track.innerHTML='';
  MODULES.forEach((m,i)=>{
    const b=document.createElement('button');
    b.className='carousel-item'+(m.id===activeModule?' active':'');
    b.id='ci-'+m.id;
    b.dataset.module=m.id;
    b.style.animationDelay=(i*20)+'ms';
    b.innerHTML=`<span class="ci-icon">${m.icon}</span><span class="ci-label">${m.label}</span>`;
    b.onclick=()=>switchModule(m.id);
    track.appendChild(b);
  });
}

function switchModule(id){
  activeModule=id;
  document.querySelectorAll('.carousel-item').forEach(b=>b.classList.toggle('active',b.dataset.module===id));
  const all=[...MODULES,{id:'perfil',label:'Perfil',icon:'👤',color:'#a855f7'},{id:'configuracoes',label:'Configurações',icon:'⚙️',color:'#8b5cf6'}];
  const m=all.find(x=>x.id===id)||all[0];
  if($('mod-title-text')) $('mod-title-text').textContent=m.label;
  if($('mod-title-icon')) {$('mod-title-icon').textContent=m.icon; $('mod-title-icon').style.color=m.color;}
  renderModule(id);
}

function renderModule(id){
  const s=$('module-stage');
  if(!s) return;
  s.innerHTML='';
  const map={
    dashboard:renderDashboard, rotina:renderNovaRotina, habitos:renderHabitos, plano:renderPlano,
    metas:renderMetasInteligentes, exportar:renderExportar, financas:renderFinancasInteligentes,
    'energia-mental':renderEnergiaMental, notas:renderNotas, feedback:renderFeedback, suporte:renderSuporte,
    perfil:renderPerfil, configuracoes:renderConfiguracoes, checkin:renderCheckin, 'lifeos-dash':renderLifeosDash
  };
  (map[id]||renderDashboard)(s);
  animateBars();
}

function _hideLoader(){
  const l=$('app-loader');
  if(l){l.style.opacity='0'; setTimeout(()=>l.style.display='none',300);}
}

function checkCheckinAlert(){ const a=$('checkin-alert'); if(a) a.style.display='none'; }

function init(){
  initTheme();
  initCursorGlow();
  renderHeader();
  renderCarousel();
  document.addEventListener('click',()=>{
    $('hamburger-dropdown')?.classList.remove('open');
    $('notif-dropdown')?.classList.remove('open');
  });
  $('hamburger-btn')?.addEventListener('click',e=>{
    e.stopPropagation(); $('hamburger-dropdown')?.classList.toggle('open');
  });
  $('notif-btn')?.addEventListener('click',e=>{
    e.stopPropagation(); $('notif-dropdown')?.classList.toggle('open'); renderNotifList();
  });
  switchModule('dashboard');
  checkCheckinAlert();
  _hideLoader();
}

function doLogout(){ showToast('Auth desativado no shell visual.'); }
document.addEventListener('DOMContentLoaded', init);
