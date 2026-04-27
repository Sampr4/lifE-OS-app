/* ============================================================
   LIFEOS — MÓDULO: PLANO IA
============================================================ */
'use strict';

function renderPlano(s){
  /* ── inject scoped CSS once ── */
  if(!document.getElementById('plano-mod-css')){
    const st=document.createElement('style');
    st.id='plano-mod-css';
    st.textContent=`
/* ════════════════════════════════════════
   PLANO INTELIGENTE — scoped under .plano-mod
   Dark mode: body.dark-theme .plano-mod
════════════════════════════════════════ */
.plano-mod{
  --bg:#fafafa;--bg-s:#f3f3f7;--bg-m:#ebebf2;--card:#ffffff;
  --border:#e4e4ec;--border-m:#c8c8da;
  --text:#0c0c14;--t2:#4a4a6a;--t3:#9898b8;--t4:#c0c0d4;
  --accent:#7c3aed;--acc2:#6d28d9;
  --acc-bg:rgba(124,58,237,.06);--acc-glow:rgba(124,58,237,.20);
  --shadow-sm:0 1px 4px rgba(12,12,20,.04),0 2px 12px rgba(12,12,20,.04);
  --shadow:0 2px 8px rgba(12,12,20,.06),0 8px 32px rgba(12,12,20,.06);
  --shadow-md:0 4px 16px rgba(12,12,20,.08),0 16px 48px rgba(12,12,20,.08);
  --font-disp:'Bricolage Grotesque',sans-serif;
  --font-body:'Plus Jakarta Sans',sans-serif;
  --r:10px;--r-lg:16px;--r-xl:20px;
  --tr:180ms cubic-bezier(.4,0,.2,1);
  --expo:cubic-bezier(0.16,1,0.3,1);
  font-family:var(--font-body);font-size:.9375rem;color:var(--text);
  line-height:1.6;-webkit-font-smoothing:antialiased;
}
body.dark-theme .plano-mod{
  --bg:#0b0b0f;--bg-s:#13131c;--bg-m:#1c1c28;--card:#111118;
  --border:#1e1e2e;--border-m:#2a2a3e;
  --text:#ededf5;--t2:#9090b0;--t3:#50506e;--t4:#30303e;
  --acc-bg:rgba(124,58,237,.10);--acc-glow:rgba(139,92,246,.28);
  --shadow-sm:0 1px 4px rgba(0,0,0,.3),0 2px 12px rgba(0,0,0,.3);
  --shadow:0 2px 8px rgba(0,0,0,.4),0 8px 32px rgba(0,0,0,.4);
  --shadow-md:0 4px 16px rgba(0,0,0,.5),0 16px 48px rgba(0,0,0,.5);
}
.plano-mod button{font-family:var(--font-body);cursor:pointer;border:none;background:none;}
.plano-mod .plano-page{max-width:860px;margin:0 auto;padding:0 .25rem 4rem;}
/* topbar */
.plano-mod .p-topbar{display:flex;align-items:center;justify-content:space-between;padding:.75rem 0;gap:1rem;border-bottom:1px solid var(--border);margin-bottom:2.25rem;flex-wrap:wrap;}
.plano-mod .p-brand{font-family:var(--font-disp);font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);display:flex;align-items:center;gap:.45rem;}
.plano-mod .p-brand-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;}
.plano-mod .p-topbar-right{display:flex;align-items:center;gap:.65rem;}
.plano-mod .p-btn-gen{font-family:var(--font-body);font-size:.8rem;font-weight:600;padding:.58rem 1.2rem;border-radius:100px;border:none;background:var(--accent);color:#fff;cursor:pointer;display:flex;align-items:center;gap:.4rem;transition:all 220ms var(--expo);position:relative;overflow:hidden;white-space:nowrap;box-shadow:0 2px 12px var(--acc-glow);}
.plano-mod .p-btn-gen::before{content:'';position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,.14) 0%,transparent 55%);opacity:0;transition:opacity var(--tr);}
.plano-mod .p-btn-gen:hover{background:var(--acc2);transform:translateY(-1px);box-shadow:0 8px 28px var(--acc-glow);}
.plano-mod .p-btn-gen:hover::before{opacity:1;}
.plano-mod .p-btn-gen:active{transform:translateY(0);}
/* hero */
.plano-mod .p-hero{margin-bottom:2.5rem;opacity:0;animation:plano-rise .7s var(--expo) .08s forwards;}
.plano-mod .p-eyebrow{font-family:var(--font-disp);font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:.65rem;display:flex;align-items:center;gap:.5rem;}
.plano-mod .p-eyebrow::before{content:'';display:inline-block;width:18px;height:1.5px;background:var(--accent);border-radius:2px;}
.plano-mod .p-hero-title{font-family:var(--font-disp);font-size:clamp(1.8rem,5vw,3rem);font-weight:800;letter-spacing:-.05em;line-height:1.06;margin-bottom:.7rem;}
.plano-mod .p-hero-title em{font-style:normal;color:var(--accent);}
.plano-mod .p-hero-sub{font-size:.875rem;color:var(--t2);font-weight:400;max-width:500px;}
.plano-mod .p-ai-badge{display:inline-flex;align-items:center;gap:.45rem;font-size:.7rem;font-weight:600;color:var(--accent);background:var(--acc-bg);border:1px solid rgba(124,58,237,.18);padding:.28rem .7rem .28rem .52rem;border-radius:100px;margin-top:1.1rem;}
.plano-mod .p-ai-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:plano-pulse 2s ease-in-out infinite;}
@keyframes plano-pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.7);}}
/* section head */
.plano-mod .p-sec-head{display:flex;align-items:baseline;gap:1rem;margin-bottom:1.2rem;padding-bottom:.7rem;border-bottom:1px solid var(--border);}
.plano-mod .p-sec-num{font-family:var(--font-disp);font-size:2.8rem;font-weight:800;line-height:1;color:var(--border);letter-spacing:-.06em;flex-shrink:0;transition:color var(--tr);user-select:none;}
.plano-mod .p-sec-label{font-family:var(--font-disp);font-size:.64rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--t3);margin-bottom:.15rem;}
.plano-mod .p-sec-title{font-family:var(--font-disp);font-size:1.05rem;font-weight:700;letter-spacing:-.025em;line-height:1.2;}
/* objective card */
.plano-mod .p-obj-card{position:relative;border-radius:var(--r-xl);border:1px solid var(--border);background:var(--card);padding:2.25rem;overflow:hidden;margin-bottom:2.75rem;box-shadow:var(--shadow);opacity:0;animation:plano-rise .65s var(--expo) .18s forwards;}
.plano-mod .p-obj-card::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 95% 10%,rgba(124,58,237,.07) 0%,transparent 60%);pointer-events:none;}
body.dark-theme .plano-mod .p-obj-card::before{background:radial-gradient(ellipse 80% 60% at 95% 10%,rgba(124,58,237,.10) 0%,transparent 60%);}
.plano-mod .p-obj-dots{position:absolute;top:0;right:0;width:200px;height:160px;opacity:.06;pointer-events:none;background-image:radial-gradient(circle,var(--accent) 1px,transparent 1px);background-size:16px 16px;}
body.dark-theme .plano-mod .p-obj-dots{opacity:.1;}
.plano-mod .p-obj-tag{font-size:.66rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);background:var(--acc-bg);border:1px solid rgba(124,58,237,.15);padding:.22rem .65rem;border-radius:100px;display:inline-block;margin-bottom:.9rem;}
.plano-mod .p-obj-text{font-family:var(--font-disp);font-size:clamp(1.4rem,3.5vw,2.1rem);font-weight:800;letter-spacing:-.045em;line-height:1.15;margin-bottom:.8rem;}
.plano-mod .p-obj-est{font-size:.8rem;color:var(--t2);font-weight:400;display:flex;align-items:center;gap:.5rem;}
.plano-mod .p-obj-est strong{color:var(--text);font-weight:600;}
.plano-mod .p-obj-est::before{content:'~';font-family:var(--font-disp);font-size:1.05rem;color:var(--accent);font-weight:700;}
.plano-mod .p-obj-meta{display:flex;gap:1.75rem;margin-top:1.5rem;padding-top:1.4rem;border-top:1px solid var(--border);flex-wrap:wrap;}
.plano-mod .p-obj-mi{display:flex;flex-direction:column;gap:.18rem;}
.plano-mod .p-obj-ml{font-size:.64rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);}
.plano-mod .p-obj-mv{font-family:var(--font-disp);font-size:.9rem;font-weight:700;color:var(--text);}
.plano-mod .p-obj-mv .pac{color:var(--accent);}
/* plan section */
.plano-mod .p-section{margin-bottom:2.75rem;opacity:0;transform:translateY(26px);}
.plano-mod .p-section.visible{opacity:1;transform:translateY(0);transition:opacity .6s var(--expo),transform .6s var(--expo);}
.plano-mod .p-section:hover .p-sec-num{color:var(--accent);}
/* plan card */
.plano-mod .p-plan-card{border-radius:var(--r-lg);border:1px solid var(--border);background:var(--card);overflow:hidden;box-shadow:var(--shadow-sm);transition:border-color var(--tr),box-shadow var(--tr);}
.plano-mod .p-plan-card:hover{border-color:var(--border-m);box-shadow:var(--shadow);}
.plano-mod .p-pct{padding:1.4rem 1.65rem 1.15rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:1rem;background:var(--bg-s);}
body.dark-theme .plano-mod .p-pct{background:rgba(255,255,255,.02);}
.plano-mod .p-pct-period{font-family:var(--font-disp);font-size:.64rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:.18rem;}
.plano-mod .p-pct-title{font-family:var(--font-disp);font-size:1rem;font-weight:700;letter-spacing:-.02em;line-height:1.22;}
.plano-mod .p-pct-badge{font-size:.66rem;font-weight:600;padding:.22rem .6rem;border-radius:100px;border:1px solid var(--border-m);color:var(--t2);white-space:nowrap;flex-shrink:0;}
.plano-mod .p-pcb{padding:1.4rem 1.65rem;}
.plano-mod .p-focus{font-size:.78rem;color:var(--t2);font-style:italic;padding:.6rem .9rem;border-left:2.5px solid var(--accent);background:var(--acc-bg);border-radius:0 var(--r) var(--r) 0;margin-bottom:1.15rem;line-height:1.6;}
.plano-mod .p-items{display:flex;flex-direction:column;}
.plano-mod .p-item{display:flex;align-items:flex-start;gap:.9rem;padding:.7rem 0;border-bottom:1px solid var(--border);}
.plano-mod .p-item:last-child{border-bottom:none;padding-bottom:0;}
.plano-mod .p-item:first-child{padding-top:0;}
.plano-mod .p-item-n{font-family:var(--font-disp);font-size:.62rem;font-weight:800;color:var(--t4);flex-shrink:0;width:18px;margin-top:.16rem;letter-spacing:.04em;}
.plano-mod .p-item-t{font-size:.875rem;color:var(--t2);line-height:1.6;}
.plano-mod .p-item-t strong{color:var(--text);font-weight:600;}
/* annual card */
.plano-mod .p-annual{border-radius:var(--r-xl);border:1px solid var(--border);background:var(--card);overflow:hidden;box-shadow:var(--shadow);}
.plano-mod .p-annual-hdr{padding:1.65rem 1.9rem 1.4rem;background:var(--bg-s);border-bottom:1px solid var(--border);position:relative;overflow:hidden;}
body.dark-theme .plano-mod .p-annual-hdr{background:rgba(255,255,255,.025);}
.plano-mod .p-annual-hdr::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent) 0%,#a78bfa 50%,var(--accent) 100%);background-size:200%;animation:plano-grad 4s linear infinite;}
@keyframes plano-grad{0%{background-position:0%;}100%{background-position:200%;}}
.plano-mod .p-annual-period{font-family:var(--font-disp);font-size:.64rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:.28rem;}
.plano-mod .p-annual-title{font-family:var(--font-disp);font-size:1.15rem;font-weight:800;letter-spacing:-.03em;}
.plano-mod .p-prog-wrap{margin-top:1.15rem;display:flex;flex-direction:column;gap:.4rem;}
.plano-mod .p-prog-labels{display:flex;justify-content:space-between;font-size:.68rem;font-weight:600;color:var(--t3);}
.plano-mod .p-prog-bar{height:6px;background:var(--border);border-radius:100px;overflow:hidden;}
.plano-mod .p-prog-fill{height:100%;background:linear-gradient(90deg,var(--accent),#a78bfa);border-radius:100px;width:0;transition:width 1.2s var(--expo);}
.plano-mod .p-annual-body{padding:1.65rem 1.9rem;display:grid;grid-template-columns:1fr 1fr;gap:0 2.25rem;}
.plano-mod .p-acol-title{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);margin-bottom:.9rem;padding-bottom:.45rem;border-bottom:1px solid var(--border);}
.plano-mod .p-aitems{display:flex;flex-direction:column;gap:.65rem;}
.plano-mod .p-aitem{display:flex;gap:.7rem;align-items:flex-start;font-size:.875rem;color:var(--t2);line-height:1.55;}
.plano-mod .p-aitem-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:.46rem;}
/* how card */
.plano-mod .p-how{border-radius:var(--r-lg);border:1px solid var(--border);background:var(--card);padding:1.65rem 1.9rem;box-shadow:var(--shadow-sm);}
.plano-mod .p-how-title{font-family:var(--font-disp);font-size:.98rem;font-weight:700;letter-spacing:-.02em;margin-bottom:.9rem;}
.plano-mod .p-how-text{font-size:.875rem;color:var(--t2);line-height:1.75;margin-bottom:1.1rem;}
.plano-mod .p-how-chips{display:flex;flex-wrap:wrap;gap:.45rem;}
.plano-mod .p-chip{font-size:.73rem;font-weight:500;padding:.32rem .85rem;border-radius:100px;border:1px solid var(--border-m);background:var(--bg-s);color:var(--t2);line-height:1;}
.plano-mod .p-chip.pac{background:var(--acc-bg);border-color:rgba(124,58,237,.18);color:var(--accent);}
/* footer */
.plano-mod .p-footer{margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.65rem;}
.plano-mod .p-footer-copy{font-size:.73rem;color:var(--t3);}
.plano-mod .p-footer-copy strong{color:var(--accent);font-weight:600;}
.plano-mod .p-footer-tag{font-size:.68rem;font-weight:600;color:var(--t3);border:1px solid var(--border);padding:.22rem .6rem;border-radius:100px;}
/* modal */
.plano-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem;opacity:0;pointer-events:none;transition:opacity .25s;}
.plano-modal-overlay.open{opacity:1;pointer-events:all;}
.plano-modal-box{background:#fff;border:1px solid #d4d4de;border-radius:20px;padding:2.5rem 2.25rem;max-width:420px;width:100%;text-align:center;box-shadow:0 16px 64px rgba(0,0,0,.12);transform:translateY(20px) scale(.97);transition:transform .3s cubic-bezier(0.16,1,0.3,1);}
body.dark-theme .plano-modal-box{background:#111118;border-color:#2a2a3e;box-shadow:0 16px 64px rgba(0,0,0,.5);}
.plano-modal-overlay.open .plano-modal-box{transform:translateY(0) scale(1);}
.plano-modal-icon{font-size:2.4rem;margin-bottom:.9rem;display:block;}
.plano-modal-title{font-family:'Bricolage Grotesque',sans-serif;font-size:1.18rem;font-weight:800;letter-spacing:-.03em;margin-bottom:.7rem;color:#0c0c14;}
body.dark-theme .plano-modal-title{color:#ededf5;}
.plano-modal-text{font-size:.875rem;color:#4a4a6a;line-height:1.7;margin-bottom:1.4rem;}
body.dark-theme .plano-modal-text{color:#9090b0;}
.plano-modal-time{font-family:'Bricolage Grotesque',sans-serif;font-size:1.8rem;font-weight:800;color:#7c3aed;letter-spacing:-.04em;display:block;margin-bottom:.28rem;}
.plano-modal-time-sub{font-size:.76rem;color:#9898b8;display:block;margin-bottom:1.6rem;}
body.dark-theme .plano-modal-time-sub{color:#50506e;}
.plano-modal-close-btn{font-family:'Plus Jakarta Sans',sans-serif;font-size:.875rem;font-weight:600;padding:.78rem 2rem;border-radius:100px;background:#7c3aed;color:#fff;border:none;cursor:pointer;width:100%;transition:all 200ms cubic-bezier(0.16,1,0.3,1);}
.plano-modal-close-btn:hover{background:#6d28d9;box-shadow:0 6px 24px rgba(124,58,237,.28);transform:translateY(-1px);}
@keyframes plano-rise{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
@media(max-width:560px){
  .plano-mod .p-annual-body{grid-template-columns:1fr;gap:1.6rem 0;}
  .plano-mod .p-obj-card{padding:1.4rem;}
  .plano-mod .p-pct,.plano-mod .p-pcb{padding:1.15rem;}
  .plano-mod .p-annual-hdr,.plano-mod .p-annual-body,.plano-mod .p-how{padding:1.4rem;}
  .plano-mod .p-sec-num{font-size:2.2rem;}
}
`;
    document.head.appendChild(st);
  }

  /* ── remove any stale modal from previous visit ── */
  const old=document.getElementById('plano-modal-el');
  if(old) old.remove();

  /* ── inject modal into body (outside overflow-hidden stage) ── */
  const modalWrap=document.createElement('div');
  modalWrap.id='plano-modal-el';
  modalWrap.innerHTML=`
<div class="plano-modal-overlay" id="plano-modal">
  <div class="plano-modal-box">
    <span class="plano-modal-icon">✦</span>
    <div class="plano-modal-title">Novo plano em processamento</div>
    <p class="plano-modal-text">Sua solicitação foi recebida com sucesso.<br>A IA está analisando seu perfil e irá gerar um plano personalizado atualizado.</p>
    <span class="plano-modal-time" id="plano-modal-time">04:00</span>
    <span class="plano-modal-time-sub">de amanhã — seu novo plano estará pronto</span>
    <button class="plano-modal-close-btn" onclick="planoCloseModal()">Entendido, obrigado</button>
  </div>
</div>`;
  document.body.appendChild(modalWrap);
  /* close on overlay click */
  const ov=document.getElementById('plano-modal');
  if(ov) ov.addEventListener('click',function(e){ if(e.target===this) planoCloseModal(); });

  /* modal time */
  (function(){
    const d=new Date(); d.setDate(d.getDate()+1); d.setHours(4,0,0,0);
    const el=document.getElementById('plano-modal-time');
    if(el) el.textContent=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  })();

  /* ── module HTML ── */
  s.innerHTML=`
<div class="plano-mod">
  <div class="plano-page">

    <!-- topbar -->
    <div class="p-topbar">
      <div class="p-brand">
        <span class="p-brand-dot"></span>
        Plano Inteligente
      </div>
      <div class="p-topbar-right">
        <button class="p-btn-gen" onclick="planoOpenModal()">
          <span>✦</span>
          <span>Gerar novo plano com IA</span>
        </button>
      </div>
    </div>

    <!-- hero -->
    <div class="p-hero">
      <div class="p-eyebrow">LifeOS · Plano de Vida</div>
      <h2 class="p-hero-title">Plano criado<br><em>automaticamente</em></h2>
      <p class="p-hero-sub">Gerado com base nas respostas do seu onboarding. Atualizado pela IA toda semana para refletir sua evolução.</p>
      <div class="p-ai-badge">
        <span class="p-ai-dot"></span>
        Gerado em 23 Jan 2025 · Revisado há 2 dias
      </div>
    </div>

    <!-- objetivo -->
    <div class="p-obj-card">
      <div class="p-obj-dots" aria-hidden="true"></div>
      <div class="p-obj-tag">Seu grande objetivo</div>
      <div class="p-obj-text">Quero me tornar engenheiro de software</div>
      <div class="p-obj-est"><strong>Plano estimado entre 3 e 5 anos</strong>&nbsp;com dedicação consistente</div>
      <div class="p-obj-meta">
        <div class="p-obj-mi"><span class="p-obj-ml">Foco principal</span><span class="p-obj-mv"><span class="pac">Carreira</span> &amp; Estudo</span></div>
        <div class="p-obj-mi"><span class="p-obj-ml">Dedicação diária</span><span class="p-obj-mv">2 a 3 horas</span></div>
        <div class="p-obj-mi"><span class="p-obj-ml">Esforço estimado</span><span class="p-obj-mv">Alto</span></div>
        <div class="p-obj-mi"><span class="p-obj-ml">Próxima revisão</span><span class="p-obj-mv">30 Jan 2025</span></div>
      </div>
    </div>

    <!-- 01 semanal -->
    <div class="p-section" id="ps1">
      <div class="p-sec-head">
        <div class="p-sec-num">01</div>
        <div><div class="p-sec-label">Curto prazo</div><div class="p-sec-title">Plano da próxima semana</div></div>
      </div>
      <div class="p-plan-card">
        <div class="p-pct">
          <div><div class="p-pct-period">Semanal</div><div class="p-pct-title">Construindo a base da disciplina</div></div>
          <div class="p-pct-badge">27 Jan — 2 Fev 2025</div>
        </div>
        <div class="p-pcb">
          <div class="p-focus">Foco desta semana: criar ritmo de estudo diário e eliminar distrações que bloqueiam o progresso.</div>
          <div class="p-items">
            <div class="p-item"><span class="p-item-n">01</span><span class="p-item-t"><strong>Estudar matemática básica todos os dias</strong> — ao menos 45 minutos, no mesmo horário fixo</span></div>
            <div class="p-item"><span class="p-item-n">02</span><span class="p-item-t"><strong>Criar e fixar uma rotina de estudo real</strong> — defina o horário certo para sua energia e mantenha sem exceção</span></div>
            <div class="p-item"><span class="p-item-n">03</span><span class="p-item-t"><strong>Iniciar disciplina diária inegociável</strong> — pequenas ações consistentes valem mais que sessões longas e irregulares</span></div>
            <div class="p-item"><span class="p-item-n">04</span><span class="p-item-t"><strong>Estudar pelo menos 1 hora por dia</strong> — sem negociação, sem adiamento, sem compensar amanhã</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 02 mensal -->
    <div class="p-section" id="ps2">
      <div class="p-sec-head">
        <div class="p-sec-num">02</div>
        <div><div class="p-sec-label">Médio prazo</div><div class="p-sec-title">Plano do próximo mês</div></div>
      </div>
      <div class="p-plan-card">
        <div class="p-pct">
          <div><div class="p-pct-period">Mensal</div><div class="p-pct-title">Consolidando hábito e consistência</div></div>
          <div class="p-pct-badge">Fevereiro 2025</div>
        </div>
        <div class="p-pcb">
          <div class="p-focus">Foco deste mês: transformar o esforço dos primeiros dias em um hábito sólido e duradouro.</div>
          <div class="p-items">
            <div class="p-item"><span class="p-item-n">01</span><span class="p-item-t"><strong>Criar consistência inabalável de estudo</strong> — o objetivo é não quebrar a sequência, independente do dia</span></div>
            <div class="p-item"><span class="p-item-n">02</span><span class="p-item-t"><strong>Melhorar raciocínio lógico e matemático</strong> — avance nos fundamentos que sustentam toda a engenharia</span></div>
            <div class="p-item"><span class="p-item-n">03</span><span class="p-item-t"><strong>Estudar matemática com frequência crescente</strong> — aumente o tempo gradualmente conforme o hábito se consolida</span></div>
            <div class="p-item"><span class="p-item-n">04</span><span class="p-item-t"><strong>Construir disciplina como identidade</strong> — não como esforço pontual, mas como parte de quem você é</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 03 anual -->
    <div class="p-section" id="ps3">
      <div class="p-sec-head">
        <div class="p-sec-num">03</div>
        <div><div class="p-sec-label">Visão completa</div><div class="p-sec-title">Plano para este ano</div></div>
      </div>
      <div class="p-annual">
        <div class="p-annual-hdr">
          <div class="p-annual-period">Anual · ${new Date().getFullYear()}</div>
          <div class="p-annual-title">O ano em que você muda de nível</div>
          <div class="p-prog-wrap">
            <div class="p-prog-labels"><span>Jan ${new Date().getFullYear()}</span><span id="plano-prog-label">calculando…</span><span>Dez ${new Date().getFullYear()}</span></div>
            <div class="p-prog-bar"><div class="p-prog-fill" id="plano-prog-fill"></div></div>
          </div>
        </div>
        <div class="p-annual-body">
          <div>
            <div class="p-acol-title">Resultados esperados</div>
            <div class="p-aitems">
              <div class="p-aitem"><span class="p-aitem-dot"></span><span>Ter disciplina forte e consistente no estudo diário</span></div>
              <div class="p-aitem"><span class="p-aitem-dot"></span><span>Estar estudando todos os dias sem depender de motivação</span></div>
              <div class="p-aitem"><span class="p-aitem-dot"></span><span>Evoluir de forma expressiva em matemática e lógica</span></div>
              <div class="p-aitem"><span class="p-aitem-dot"></span><span>Ter uma rotina organizada que sustenta o crescimento</span></div>
            </div>
          </div>
          <div>
            <div class="p-acol-title">Comportamentos e atitudes</div>
            <div class="p-aitems">
              <div class="p-aitem"><span class="p-aitem-dot"></span><span>Estar muito mais próximo de se tornar engenheiro</span></div>
              <div class="p-aitem"><span class="p-aitem-dot"></span><span>Ter foco real — não apenas quando está inspirado</span></div>
              <div class="p-aitem"><span class="p-aitem-dot"></span><span>Ter eliminado os maiores obstáculos que te travavam</span></div>
              <div class="p-aitem"><span class="p-aitem-dot"></span><span>Ser reconhecível como alguém em evolução genuína</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 04 como foi criado -->
    <div class="p-section" id="ps4">
      <div class="p-sec-head">
        <div class="p-sec-num">04</div>
        <div><div class="p-sec-label">Transparência</div><div class="p-sec-title">Como esse plano foi criado?</div></div>
      </div>
      <div class="p-how">
        <div class="p-how-title">Gerado automaticamente pela IA do LifeOS</div>
        <p class="p-how-text">Esse plano foi criado com base nas respostas do seu onboarding. A inteligência artificial analisou seu objetivo principal, seus maiores obstáculos, seu nível de energia disponível e sua rotina atual — e gerou um plano semanal, mensal e anual personalizado para te levar mais rápido ao seu objetivo.</p>
        <p class="p-how-text" style="margin-bottom:.8rem">Respostas do onboarding utilizadas na geração:</p>
        <div class="p-how-chips">
          <span class="p-chip pac">🎯 Objetivo: Engenheiro de software</span>
          <span class="p-chip">💼 Foco: Carreira e crescimento</span>
          <span class="p-chip">⚡ Obstáculo: Falta de disciplina</span>
          <span class="p-chip">⏰ Disponibilidade: 2–3h por dia</span>
          <span class="p-chip">📚 Área: Estudo e desenvolvimento</span>
        </div>
      </div>
    </div>

    <!-- footer -->
    <div class="p-footer">
      <span class="p-footer-copy">Plano gerado por <strong>LifeOS IA</strong> · Atualizado automaticamente</span>
      <span class="p-footer-tag">Próxima atualização em 7 dias</span>
    </div>

  </div><!-- /plano-page -->
</div><!-- /plano-mod -->`;

  /* ── init: year progress + scroll reveal ── */
  (function initPlano(){
    /* year progress */
    const now=new Date();
    const pct=Math.round(((now-new Date(now.getFullYear(),0,1))/(new Date(now.getFullYear()+1,0,1)-new Date(now.getFullYear(),0,1)))*100);
    setTimeout(()=>{
      const fill=document.getElementById('plano-prog-fill');
      const lbl=document.getElementById('plano-prog-label');
      if(fill) fill.style.width=pct+'%';
      if(lbl)  lbl.textContent=pct+'% concluído';
    },220);

    /* intersection observer for section reveals */
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        e.target.classList.add('visible');
        io.unobserve(e.target);
      });
    },{threshold:0.08});
    s.querySelectorAll('.p-section').forEach((sec,i)=>{
      sec.style.transitionDelay=(i*70)+'ms';
      io.observe(sec);
    });
  })();
}

/* ── plano modal helpers (global scope) ── */
function planoOpenModal(){
  const m=document.getElementById('plano-modal');
  if(m){ m.classList.add('open'); document.body.style.overflow='hidden'; }
}
function planoCloseModal(){
  const m=document.getElementById('plano-modal');
  if(m){ m.classList.remove('open'); document.body.style.overflow=''; }
}
document.addEventListener('keydown',function(e){
  if(e.key==='Escape') planoCloseModal();
});

/* ════════════════════════════════════════════════
   ✦ METAS INTELIGENTES — Módulo completo integrado
════════════════════════════════════════════════ */

/* ── CSS injetado uma única vez ── */
(function injectMetasCSS(){
  if(document.getElementById('mt6-style'))return;
  const s=document.createElement('style');s.id='mt6-style';
  s.textContent=`
.mt6{--g:#2EB67D;--g2:#22915F;--am:#F5A623;--ro:#E84C6A;--bl:#3B82F6;--pu:#8B5CF6;
  --mbg:#F4F5FA;--mwh:#FFF;--mb1:#E6E9F2;--mb2:#CDD2E2;--mtx:#191D2E;--mt2:#5A6380;--mt3:#9299B8;--mt4:#BFC5D8;
  --msh:0 1px 4px rgba(0,0,0,.06),0 2px 14px rgba(0,0,0,.05);
  --msh2:0 4px 22px rgba(0,0,0,.09);--mr:10px;--mr2:7px;--mr3:5px;--mtr:.2s cubic-bezier(.4,0,.2,1);
  font-family:'DM Sans',-apple-system,sans-serif;font-size:14px;box-sizing:border-box}
.mt6 *,.mt6 *::before,.mt6 *::after{box-sizing:border-box}
.mt6 button{font-family:inherit;cursor:pointer;border:none;background:none}
.mt6 input,.mt6 select{font-family:inherit}
/* layout */
.mt6-wrap{display:flex;flex-direction:column;gap:14px;width:100%;min-width:0;padding-bottom:24px}
/* KPI */
.mt6-kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:0;background:var(--mwh);border:1px solid var(--mb1);border-radius:var(--mr);box-shadow:var(--msh);overflow:hidden}
.mt6-kpi{padding:13px 15px;border-right:1px solid var(--mb1);min-width:0}
.mt6-kpi:last-child{border-right:none}
.mt6-kpi-lbl{font-size:.56rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--mt3);margin-bottom:2px}
.mt6-kpi-val{font-family:'DM Mono','Courier New',monospace;font-size:1.25rem;font-weight:500;letter-spacing:-.04em;color:var(--mtx);line-height:1}
.mt6-kpi-val.g{color:var(--g)}.mt6-kpi-val.a{color:var(--am)}.mt6-kpi-val.b{color:var(--bl)}
.mt6-kpi-d{font-size:.58rem;color:var(--mt3);margin-top:2px}.mt6-kpi-d.up{color:var(--g)}
.mt6-kpi-sp{margin-top:7px;height:18px}.mt6-kpi-sp svg{width:100%;height:18px;overflow:visible}
/* cards */
.mt6-card{background:var(--mwh);border:1px solid var(--mb1);border-radius:var(--mr);box-shadow:var(--msh);overflow:hidden;min-width:0}
.mt6-ch{padding:11px 15px 9px;border-bottom:1px solid var(--mb1);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.mt6-ch-t{font-size:.63rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mtx)}
.mt6-ch-s{font-size:.56rem;color:var(--mt3);margin-top:2px}
.mt6-ch-r{display:flex;align-items:center;gap:5px;flex-shrink:0}
.mt6-pill{font-family:'DM Mono','Courier New',monospace;font-size:.55rem;font-weight:500;padding:2px 7px;border-radius:100px;background:rgba(46,182,125,.08);color:var(--g);border:1px solid rgba(46,182,125,.18);white-space:nowrap}
.mt6-pill.a{background:rgba(245,166,35,.08);color:var(--am);border-color:rgba(245,166,35,.2)}
.mt6-seg-row{display:flex;gap:2px}
.mt6-seg{font-size:.57rem;font-weight:700;padding:2px 8px;border-radius:100px;cursor:pointer;border:1px solid var(--mb1);color:var(--mt3);background:none;transition:all var(--mtr)}
.mt6-seg:hover{border-color:var(--mb2);color:var(--mtx)}
.mt6-seg.on{background:var(--mtx);color:var(--mwh);border-color:var(--mtx)}
.mt6-cb-body{padding:11px 13px 8px}
/* grids */
.mt6-g-main{display:grid;grid-template-columns:2fr 1fr;gap:14px}
.mt6-g-mid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.mt6-g-bot{display:grid;grid-template-columns:1fr 1fr;gap:14px}
/* chart legend */
.mt6-leg{display:flex;gap:11px;padding:0 13px 9px;flex-wrap:wrap}
.mt6-leg-i{display:flex;align-items:center;gap:4px;font-size:.58rem;color:var(--mt2)}
.mt6-leg-d{width:7px;height:7px;border-radius:2px;flex-shrink:0}
/* hbars */
.mt6-hbar-wrap{padding:4px 13px 10px}.mt6-hb-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.mt6-hb-lbl{font-size:.58rem;font-weight:700;color:var(--mt2);width:48px;flex-shrink:0;text-align:right}
.mt6-hb-track{flex:1;height:7px;background:var(--mbg);border:1px solid var(--mb1);border-radius:100px;overflow:hidden;position:relative}
.mt6-hb-fill{height:100%;border-radius:100px;width:0%;transition:width .9s cubic-bezier(.4,0,.2,1)}
.mt6-hb-done{height:100%;border-radius:100px;position:absolute;left:0;top:0;opacity:.3}
.mt6-hb-val{font-family:'DM Mono','Courier New',monospace;font-size:.57rem;color:var(--mt2);min-width:34px;white-space:nowrap}
.mt6-mini-tbl{width:calc(100% - 26px);border-collapse:collapse;margin:0 13px 10px}
.mt6-mini-tbl td,.mt6-mini-tbl th{padding:4px 7px;font-size:.62rem}
.mt6-mini-tbl thead th{color:var(--mt3);font-weight:700;letter-spacing:.05em;text-transform:uppercase;font-size:.52rem;border-bottom:1px solid var(--mb1);text-align:left}
.mt6-mini-tbl thead th:last-child,.mt6-mini-tbl td:last-child{text-align:right}
.mt6-mini-tbl td:nth-child(2){text-align:right;font-family:'DM Mono','Courier New',monospace}
.mt6-mini-tbl tbody tr{border-bottom:1px solid var(--mb1)}
.mt6-mini-tbl tbody tr:last-child{border-bottom:none;font-weight:700}
/* period bars */
.mt6-per-rows{padding:9px 13px;display:flex;flex-direction:column;gap:7px}
.mt6-per-row{display:flex;align-items:center;gap:8px}
.mt6-per-lbl{font-size:.58rem;font-weight:600;color:var(--mt2);width:66px;flex-shrink:0;white-space:nowrap}
.mt6-per-track{flex:1;height:5px;background:var(--mbg);border:1px solid var(--mb1);border-radius:100px;overflow:hidden}
.mt6-per-fill{height:100%;border-radius:100px;width:0%;transition:width 1s cubic-bezier(.4,0,.2,1)}
.mt6-per-fill.g{background:var(--g)}.mt6-per-fill.a{background:var(--am)}.mt6-per-fill.b{background:var(--bl)}.mt6-per-fill.p{background:var(--pu)}
.mt6-per-val{font-family:'DM Mono','Courier New',monospace;font-size:.56rem;color:var(--mt3);width:16px;text-align:right}
/* donut */
.mt6-dnt-body{padding:11px 13px;display:flex;align-items:center;gap:13px}
.mt6-dnt-svgw{position:relative;width:94px;height:94px;flex-shrink:0}
.mt6-dnt-svgw svg{width:100%;height:100%}
.mt6-dnt-ctr{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.mt6-dnt-num{font-family:'DM Mono','Courier New',monospace;font-size:.9rem;font-weight:500;color:var(--mtx);line-height:1}
.mt6-dnt-lbl{font-size:.48rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--mt3);margin-top:1px}
.mt6-dnt-leg{display:flex;flex-direction:column;gap:5px;flex:1;min-width:0}
.mt6-dl{display:flex;align-items:center;justify-content:space-between;gap:4px}
.mt6-dl-l{display:flex;align-items:center;gap:4px;min-width:0}
.mt6-dl-dot{width:5px;height:5px;border-radius:2px;flex-shrink:0}
.mt6-dl-n{font-size:.6rem;color:var(--mt2);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt6-dl-v{font-family:'DM Mono','Courier New',monospace;font-size:.58rem;color:var(--mtx);font-weight:600;flex-shrink:0}
/* live feed */
.mt6-feed-item{display:flex;align-items:center;gap:8px;padding:7px 13px;border-bottom:1px solid var(--mb1);animation:mt6fi .4s cubic-bezier(.34,1.2,.64,1)}
.mt6-feed-item:last-child{border-bottom:none}
@keyframes mt6fi{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.mt6-fd{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.mt6-ft{flex:1;font-size:.66rem;color:var(--mt2);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mt6-ft strong{color:var(--mtx);font-weight:700}
.mt6-fx{font-family:'DM Mono','Courier New',monospace;font-size:.56rem;font-weight:600;padding:1px 5px;border-radius:100px;flex-shrink:0}
.mt6-fx.easy{background:rgba(59,130,246,.1);color:var(--bl)}.mt6-fx.mid{background:rgba(245,166,35,.1);color:var(--am)}.mt6-fx.hard{background:rgba(232,76,106,.1);color:var(--ro)}
.mt6-ftm{font-family:'DM Mono','Courier New',monospace;font-size:.54rem;color:var(--mt4);flex-shrink:0}
.mt6-live-ind{display:flex;align-items:center;gap:4px;font-size:.57rem;font-weight:700;color:var(--g)}
.mt6-live-ind::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--g);box-shadow:0 0 5px rgba(46,182,125,.5);animation:mt6lb 1.8s ease-in-out infinite}
@keyframes mt6lb{0%,100%{opacity:1}50%{opacity:.25}}
/* goals table */
.mt6-gf-row{display:flex;gap:3px;flex-wrap:wrap}
.mt6-gf{font-size:.58rem;font-weight:700;padding:2px 8px;border-radius:100px;cursor:pointer;border:1px solid var(--mb1);color:var(--mt3);background:none;transition:all var(--mtr)}
.mt6-gf:hover{border-color:var(--mb2);color:var(--mtx)}.mt6-gf.on{background:var(--g);color:#fff;border-color:var(--g)}
.mt6-tbl-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.mt6-gtbl{width:100%;border-collapse:collapse;min-width:320px}
.mt6-gtbl thead th{padding:6px 12px;text-align:left;font-size:.52rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--mt3);background:var(--mbg);border-bottom:1px solid var(--mb1);white-space:nowrap}
.mt6-gtbl tbody tr{border-bottom:1px solid var(--mb1);transition:background var(--mtr)}
.mt6-gtbl tbody tr:last-child{border-bottom:none}
.mt6-gtbl tbody tr:hover{background:var(--mbg)}
.mt6-gtbl td{padding:8px 12px;font-size:.7rem;color:var(--mtx);vertical-align:middle}
.mt6-td-chk{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none}
.mt6-td-cb{width:16px;height:16px;border-radius:5px;border:1.5px solid var(--mb2);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .22s cubic-bezier(.34,1.2,.64,1)}
.mt6-td-chk:hover .mt6-td-cb{border-color:var(--g)}
.mt6-td-cb.chk{background:var(--g);border-color:var(--g);box-shadow:0 0 7px rgba(46,182,125,.28)}
.mt6-td-ck{width:7px;height:7px;stroke:#fff;stroke-width:2.5;fill:none;stroke-dasharray:13;stroke-dashoffset:13;transition:stroke-dashoffset .22s cubic-bezier(.4,0,.2,1) .04s}
.mt6-td-ck.chk{stroke-dashoffset:0}
.mt6-td-nm{font-size:.73rem;font-weight:600;color:var(--mtx);transition:color .2s}
.mt6-td-nm.chk{text-decoration:line-through;text-decoration-color:var(--mt4);color:var(--mt3)}
.mt6-lv{font-size:.52rem;font-weight:800;padding:2px 7px;border-radius:100px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
.mt6-lv-e{background:rgba(59,130,246,.1);color:var(--bl)}.mt6-lv-m{background:rgba(245,166,35,.1);color:var(--am)}.mt6-lv-h{background:rgba(232,76,106,.1);color:var(--ro)}
.mt6-td-prog{display:flex;align-items:center;gap:6px}
.mt6-td-pt{flex:1;height:3px;background:var(--mb1);border-radius:100px;overflow:hidden;min-width:36px}
.mt6-td-pf{height:100%;border-radius:100px;transition:width .9s cubic-bezier(.4,0,.2,1)}
.mt6-td-pct{font-family:'DM Mono','Courier New',monospace;font-size:.56rem;color:var(--mt3);white-space:nowrap}
.mt6-tbl-ft{padding:6px 12px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--mb1);background:var(--mbg)}
.mt6-tbl-info{font-size:.58rem;color:var(--mt3);font-weight:600}
.mt6-tbl-add{display:flex;align-items:center;gap:4px;font-size:.64rem;font-weight:700;color:var(--g);padding:3px 8px;border-radius:var(--mr2);border:1px solid rgba(46,182,125,.25);background:rgba(46,182,125,.05);cursor:pointer;transition:all var(--mtr);font-family:inherit}
.mt6-tbl-add:hover{background:rgba(46,182,125,.12);border-color:var(--g)}
/* done row */
.mt6-done-row td{opacity:.52}.mt6-done-row:hover td{opacity:.68}
/* calendar */
.mt6-cal-body{padding:11px 12px}
.mt6-cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
.mt6-cal-m{font-size:.74rem;font-weight:800;letter-spacing:-.02em}
.mt6-cal-btns{display:flex;gap:2px}
.mt6-cal-nb{width:20px;height:20px;border-radius:var(--mr2);background:var(--mbg);border:1px solid var(--mb1);color:var(--mt2);font-size:.76rem;display:flex;align-items:center;justify-content:center;transition:all var(--mtr);cursor:pointer}
.mt6-cal-nb:hover{background:var(--mb1);color:var(--mtx)}
.mt6-cal-dw{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:2px}
.mt6-cal-dow{font-family:'DM Mono','Courier New',monospace;font-size:.44rem;color:var(--mt3);text-align:center;letter-spacing:.04em}
.mt6-cal-days{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.mt6-cal-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:var(--mr3);font-family:'DM Mono','Courier New',monospace;font-size:.56rem;color:var(--mt3);cursor:pointer;position:relative;transition:all .18s}
.mt6-cal-day:not(.empty):hover{background:var(--mbg);color:var(--mtx)}
.mt6-cal-day.today{color:var(--g);font-weight:700;background:rgba(46,182,125,.07)}
.mt6-cal-day.has::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:3px;height:3px;border-radius:50%;background:var(--g)}
.mt6-cal-day.sel{background:var(--g)!important;color:#fff!important;box-shadow:0 0 7px rgba(46,182,125,.3)}
.mt6-cal-day.empty,.mt6-cal-day.fut{pointer-events:none;opacity:.14}
.mt6-cal-det{margin-top:7px;padding:7px 9px;background:var(--mbg);border-radius:var(--mr2);border:1px solid var(--mb1);display:none;animation:mt6fd .18s ease}
.mt6-cal-det.show{display:block}
@keyframes mt6fd{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
.mt6-cd-t{font-size:.58rem;font-weight:800;color:var(--mtx);margin-bottom:4px}
.mt6-cd-i{font-size:.58rem;color:var(--mt2);display:flex;align-items:center;gap:4px;margin-top:2px}
.mt6-cd-d{width:4px;height:4px;border-radius:50%;flex-shrink:0}
/* add button in table footer */
.mt6-add-big{width:100%;padding:10px;border-radius:var(--mr2);background:rgba(46,182,125,.06);border:1px solid rgba(46,182,125,.22);color:var(--g);font-size:.76rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;font-family:inherit;transition:all var(--mtr)}
.mt6-add-big:hover{background:rgba(46,182,125,.14);border-color:var(--g)}
/* modal */
.mt6-ov{position:fixed;inset:0;z-index:600;background:rgba(25,29,46,.45);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:14px;opacity:0;pointer-events:none;transition:opacity .22s}
.mt6-ov.open{opacity:1;pointer-events:all}
.mt6-modal{width:min(450px,100%);max-height:88vh;overflow-y:auto;background:var(--mwh);border:1px solid var(--mb2);border-radius:13px;box-shadow:0 20px 50px rgba(0,0,0,.14);transform:translateY(14px) scale(.97);opacity:0;transition:transform .32s cubic-bezier(.34,1.2,.64,1),opacity .25s}
.mt6-ov.open .mt6-modal{transform:translateY(0) scale(1);opacity:1}
.mt6-m-hd{padding:13px 17px;border-bottom:1px solid var(--mb1);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--mwh);z-index:1}
.mt6-m-hd-l{display:flex;align-items:center;gap:8px}
.mt6-m-ico{width:26px;height:26px;border-radius:7px;background:var(--g);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.76rem;flex-shrink:0}
.mt6-m-tt{font-size:.82rem;font-weight:800;color:var(--mtx)}
.mt6-m-st{font-size:.58rem;color:var(--mt3);margin-top:1px}
.mt6-m-cl{width:22px;height:22px;border-radius:6px;background:var(--mbg);border:1px solid var(--mb1);color:var(--mt3);font-size:.72rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all var(--mtr)}
.mt6-m-cl:hover{background:rgba(232,76,106,.08);border-color:rgba(232,76,106,.2);color:var(--ro)}
.mt6-m-bd{padding:15px 17px}
.mt6-fg{display:flex;flex-direction:column;gap:3px;margin-bottom:10px}
.mt6-fg label{font-size:.58rem;font-weight:700;color:var(--mt2);letter-spacing:.04em}
.mt6-fg input,.mt6-fg select{padding:7px 9px;background:var(--mbg);border:1.5px solid var(--mb1);border-radius:var(--mr2);color:var(--mtx);font-size:.76rem;outline:none;font-family:inherit;transition:all var(--mtr)}
.mt6-fg input:focus,.mt6-fg select:focus{border-color:var(--g);background:var(--mwh);box-shadow:0 0 0 3px rgba(46,182,125,.09)}
.mt6-fg select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='%239299B8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;padding-right:24px}
.mt6-fg-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.mt6-fg-hint{font-size:.54rem;color:var(--mt3)}
.mt6-lp{display:flex;gap:5px}
.mt6-lp-b{flex:1;padding:7px 4px;border-radius:var(--mr2);border:1.5px solid var(--mb1);background:var(--mbg);font-size:.62rem;font-weight:700;color:var(--mt3);cursor:pointer;font-family:inherit;transition:all var(--mtr);text-align:center}
.mt6-lp-b.e{background:rgba(59,130,246,.08);border-color:var(--bl);color:var(--bl)}
.mt6-lp-b.m{background:rgba(245,166,35,.08);border-color:var(--am);color:var(--am)}
.mt6-lp-b.h{background:rgba(232,76,106,.08);border-color:var(--ro);color:var(--ro)}
.mt6-m-ft{padding:9px 17px;border-top:1px solid var(--mb1);display:flex;justify-content:flex-end;gap:5px;position:sticky;bottom:0;background:var(--mwh)}
.mt6-btn-c{padding:6px 11px;border-radius:var(--mr2);background:var(--mbg);border:1px solid var(--mb1);color:var(--mt2);font-size:.7rem;font-weight:700;font-family:inherit;transition:all var(--mtr)}
.mt6-btn-c:hover{background:var(--mb1);color:var(--mtx)}
.mt6-btn-s{padding:6px 14px;border-radius:var(--mr2);background:var(--g);color:#fff;font-size:.7rem;font-weight:800;font-family:inherit;box-shadow:0 2px 8px rgba(46,182,125,.22);transition:all var(--mtr)}
.mt6-btn-s:hover{background:var(--g2);transform:translateY(-1px)}
.mt6-btn-s:active{transform:scale(.97)}
/* toast */
.mt6-toast{position:fixed;bottom:18px;right:18px;z-index:700;background:#191D2E;color:#fff;font-size:.7rem;font-weight:700;padding:8px 13px;border-radius:100px;box-shadow:0 8px 28px rgba(0,0,0,.2);opacity:0;transform:translateY(6px);pointer-events:none;transition:all .26s cubic-bezier(.34,1.2,.64,1);white-space:nowrap;max-width:calc(100vw - 36px);font-family:inherit}
.mt6-toast.show{opacity:1;transform:translateY(0)}
/* responsive */
@media(max-width:900px){
  .mt6-kpi-row{grid-template-columns:1fr 1fr}
  .mt6-kpi:nth-child(2){border-right:none}
  .mt6-kpi:nth-child(3){border-top:1px solid var(--mb1)}
  .mt6-kpi:nth-child(4){border-top:1px solid var(--mb1);border-right:none}
  .mt6-kpi-sp{display:none}
  .mt6-g-main,.mt6-g-mid,.mt6-g-bot{grid-template-columns:1fr!important}
  .mt6-gtbl thead th:nth-child(3),.mt6-gtbl tbody td:nth-child(3),.mt6-gtbl thead th:nth-child(4),.mt6-gtbl tbody td:nth-child(4){display:none}
}
@media(max-width:480px){
  .mt6-gtbl thead th:nth-child(5),.mt6-gtbl tbody td:nth-child(5){display:none}
  .mt6-fg-row{grid-template-columns:1fr}
  .mt6-ov{align-items:flex-end;padding:0}
  .mt6-modal{border-radius:13px 13px 0 0;max-height:92vh;width:100%}
}`;
  document.head.appendChild(s);
})();

/* ── STATE (prefixed mt6_) ── */
let mt6_goals, mt6_hist, mt6_nextId, mt6_sbFilter='all', mt6_sbCat='all', mt6_lvFilter='all';
let mt6_chartMode='line', mt6_selLvl='', mt6_calY, mt6_calM, mt6_selCalDay=null;
let mt6_feedItems=[], mt6_simTimer=null, mt6_initialized=false;

const mt6_XP={easy:10,mid:25,hard:50};
const mt6_MBR=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const mt6_SMB=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const mt6_CAT_COL={financeiro:'#2EB67D',pessoal:'#F5A623',carreira:'#3B82F6',saude:'#E84C6A',estudo:'#8B5CF6',outro:'#9299B8'};
const mt6_CAT_LBL={financeiro:'Financeiro',pessoal:'Pessoal',carreira:'Carreira',saude:'Saúde',estudo:'Estudo',outro:'Outro'};
const mt6_LV_C={easy:'#3B82F6',mid:'#F5A623',hard:'#E84C6A'};
const mt6_LV_L={easy:'Fácil',mid:'Média',hard:'Difícil'};

function mt6_sub(d){const dt=new Date();dt.setDate(dt.getDate()-d);return dt.toISOString()}

const mt6_DEF=[
  {id:1, name:'Acumular R$ 1 milhão',              level:'hard',months:60,cat:'financeiro',done:false,doneAt:null,   createdAt:mt6_sub(365)},
  {id:2, name:'Renda passiva de R$ 10k/mês',        level:'hard',months:48,cat:'financeiro',done:false,doneAt:null,   createdAt:mt6_sub(300)},
  {id:3, name:'Investir 30% do salário todo mês',   level:'mid', months:6, cat:'financeiro',done:true, doneAt:mt6_sub(60), createdAt:mt6_sub(180)},
  {id:4, name:'Quitar todas as dívidas',             level:'mid', months:12,cat:'financeiro',done:true, doneAt:mt6_sub(90), createdAt:mt6_sub(240)},
  {id:5, name:'Criar minha própria empresa',         level:'hard',months:24,cat:'carreira',  done:false,doneAt:null,   createdAt:mt6_sub(200)},
  {id:6, name:'Juntar R$ 100k de reserva',           level:'hard',months:24,cat:'financeiro',done:true, doneAt:mt6_sub(30), createdAt:mt6_sub(400)},
  {id:7, name:'Comprar casa própria',                level:'hard',months:48,cat:'pessoal',   done:false,doneAt:null,   createdAt:mt6_sub(500)},
  {id:8, name:'Juntar R$ 50k entrada da casa',       level:'hard',months:30,cat:'financeiro',done:true, doneAt:mt6_sub(45), createdAt:mt6_sub(450)},
  {id:9, name:'Pesquisar financiamento imobiliário', level:'easy',months:1, cat:'pessoal',   done:true, doneAt:mt6_sub(20), createdAt:mt6_sub(60)},
  {id:10,name:'Visitar 10 imóveis antes de comprar',level:'easy',months:2, cat:'pessoal',   done:true, doneAt:mt6_sub(8),  createdAt:mt6_sub(90)},
  {id:11,name:'Comprar carro zero km à vista',       level:'hard',months:24,cat:'pessoal',   done:false,doneAt:null,   createdAt:mt6_sub(300)},
  {id:12,name:'Juntar R$ 30k entrada do carro',      level:'mid', months:18,cat:'financeiro',done:true, doneAt:mt6_sub(55), createdAt:mt6_sub(360)},
  {id:13,name:'Tirar carteira de motorista',         level:'easy',months:3, cat:'pessoal',   done:true, doneAt:mt6_sub(180),createdAt:mt6_sub(240)},
  {id:14,name:'Criar fundo exclusivo para o carro',  level:'mid', months:6, cat:'financeiro',done:true, doneAt:mt6_sub(100),createdAt:mt6_sub(200)},
  {id:15,name:'Comprar apartamento na planta',       level:'hard',months:36,cat:'pessoal',   done:false,doneAt:null,   createdAt:mt6_sub(400)},
  {id:16,name:'Juntar R$ 80k entrada do apto',       level:'hard',months:30,cat:'financeiro',done:false,doneAt:null,   createdAt:mt6_sub(350)},
  {id:17,name:'Estudar os melhores bairros',         level:'easy',months:2, cat:'pessoal',   done:true, doneAt:mt6_sub(40), createdAt:mt6_sub(100)},
  {id:18,name:'Consultar advogado imobiliário',      level:'easy',months:1, cat:'pessoal',   done:true, doneAt:mt6_sub(15), createdAt:mt6_sub(60)},
  {id:19,name:'Comprar ações todo mês por 1 ano',    level:'mid', months:12,cat:'financeiro',done:true, doneAt:mt6_sub(10), createdAt:mt6_sub(380)},
  {id:20,name:'Comparar 3 construtoras',             level:'mid', months:2, cat:'pessoal',   done:false,doneAt:null,   createdAt:mt6_sub(20)},
  {id:21,name:'Perder 12kg com saúde',               level:'mid', months:6, cat:'saude',     done:true, doneAt:mt6_sub(45), createdAt:mt6_sub(200)},
  {id:22,name:'Meditar 10min todo dia',              level:'easy',months:1, cat:'saude',     done:true, doneAt:mt6_sub(10), createdAt:mt6_sub(60)},
];

function mt6_buildHist(){
  let xp=0;const pts=[0];
  (mt6_goals||mt6_DEF).filter(g=>g.done&&g.doneAt).sort((a,b)=>new Date(a.doneAt)-new Date(b.doneAt))
    .forEach(g=>{xp+=mt6_XP[g.level];pts.push(xp)});
  return pts;
}
function mt6_save(){
  localStorage.setItem('mt6:g',JSON.stringify(mt6_goals));
  localStorage.setItem('mt6:h',JSON.stringify(mt6_hist));
  try{if(window.storage)window.storage.set('mt6:data',JSON.stringify({goals:mt6_goals,hist:mt6_hist}))}catch(e){}
}
function mt6_totalXP(){return(mt6_goals||[]).filter(g=>g.done).reduce((s,g)=>s+mt6_XP[g.level],0)}
function mt6_doneG(){return(mt6_goals||[]).filter(g=>g.done)}
function mt6_visGoals(){
  let g=mt6_goals||[];
  if(mt6_sbFilter==='pending')g=g.filter(x=>!x.done);
  else if(mt6_sbFilter==='done')g=g.filter(x=>x.done);
  if(mt6_sbCat!=='all')g=g.filter(x=>x.cat===mt6_sbCat);
  return g;
}
function mt6_estProg(g){
  if(!g.createdAt||!g.months)return 10;
  return Math.min(Math.round((Date.now()-new Date(g.createdAt))/(1000*60*60*24*30)/g.months*100),90);
}
function mt6_calcStreak(){
  const today=new Date();today.setHours(0,0,0,0);let s=0,d=new Date(today);
  while(true){if(!mt6_doneG().some(g=>g.doneAt&&new Date(g.doneAt).toDateString()===d.toDateString()))break;s++;d.setDate(d.getDate()-1)}
  return s;
}
const mt6_$=id=>document.getElementById(id);
let mt6_toastT;
function mt6_toast(m,dur=2500){
  const el=mt6_$('mt6-toast');if(!el)return;
  el.textContent=m;el.classList.add('show');
  clearTimeout(mt6_toastT);mt6_toastT=setTimeout(()=>el.classList.remove('show'),dur);
}

/* ── SPARKLINE ── */
function mt6_drawSparkline(gId,vals,color){
  const g=mt6_$(gId);if(!g)return;
  const n=vals.length;if(n<2){g.innerHTML='';return}
  const W=80,H=16;const mx=Math.max(...vals,1);
  const xs=vals.map((_,i)=>i/(n-1)*W);
  const ys=vals.map(v=>H-2-(v/mx)*(H-4));
  let d=`M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for(let i=1;i<n;i++){const cx=(xs[i-1]+xs[i])/2;d+=` C${cx.toFixed(1)},${ys[i-1].toFixed(1)} ${cx.toFixed(1)},${ys[i].toFixed(1)} ${xs[i].toFixed(1)},${ys[i].toFixed(1)}`}
  g.innerHTML=`<path d="${d} L${W},${H} L0,${H} Z" fill="${color}" opacity=".12"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="${xs[n-1].toFixed(1)}" cy="${ys[n-1].toFixed(1)}" r="2" fill="${color}"/>`;
}
function mt6_drawSparklines(){
  const now=new Date();
  const monthly=[];let xpCum=0;const xpVals=[];
  for(let m=11;m>=0;m--){
    const s=new Date(now.getFullYear(),now.getMonth()-m,1);
    const e=new Date(now.getFullYear(),now.getMonth()-m+1,0);
    const g2=mt6_goals.filter(g=>g.doneAt&&new Date(g.doneAt)>=s&&new Date(g.doneAt)<=e);
    monthly.push(g2.length);
    xpCum+=g2.reduce((s2,g)=>s2+mt6_XP[g.level],0);xpVals.push(xpCum);
  }
  let cum=0;const cumV=monthly.map(v=>{cum+=v;return cum});
  mt6_drawSparkline('mt6-spg-tot',[...Array(12)].map((_,i)=>Math.max(mt6_goals.length-12+i+1,1)),'#5A6380');
  mt6_drawSparkline('mt6-spg-done',cumV,'#2EB67D');
  mt6_drawSparkline('mt6-spg-xp',xpVals,'#F5A623');
  mt6_drawSparkline('mt6-spg-str',[0,1,1,2,2,3,3,4,4,4,5,mt6_calcStreak()],'#3B82F6');
}

/* ── KPI ── */
function mt6_updateKPI(){
  const vg=mt6_visGoals();const tot=vg.length,done=vg.filter(g=>g.done).length;
  const pct=tot?Math.round(done/tot*100):0;const xp=mt6_totalXP();const str=mt6_calcStreak();
  const _s=(id,v)=>{const el=mt6_$(id);if(el)el.textContent=v};
  _s('mt6-kv-tot',tot);_s('mt6-kd-tot','metas');
  _s('mt6-kv-done',done);_s('mt6-kd-done',pct+'% taxa');
  _s('mt6-kv-xp',xp+' XP');_s('mt6-kv-str',str+'d');
  const tb=mt6_$('mt6-tbsub');if(tb)tb.textContent=`${done} de ${tot} concluídas · ${xp} XP`;
  const mp=mt6_$('mt6-mainpill');if(mp)mp.textContent=xp+' pts';
  mt6_drawSparklines();
}

/* ── MAIN CHART ── */
function mt6_smth(xs,ys){
  if(xs.length<2)return`M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  let d=`M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for(let i=1;i<xs.length;i++){const cx=(xs[i-1]+xs[i])/2;d+=` C${cx.toFixed(1)},${ys[i-1].toFixed(1)} ${cx.toFixed(1)},${ys[i].toFixed(1)} ${xs[i].toFixed(1)},${ys[i].toFixed(1)}`}
  return d;
}
function mt6_drawMain(){
  const svg=mt6_$('mt6-mainsvg');if(!svg)return;
  const W=svg.getBoundingClientRect().width||560;
  const H=Math.max(110,Math.min(160,W*0.28));
  const PL=32,PR=9,PT=11,PB=19,cW=W-PL-PR,cH=H-PT-PB;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.style.height=H+'px';
  const pts=mt6_hist,n=pts.length;
  const mg=mt6_$('mt6-mgrid'),mc=mt6_$('mt6-mchart'),md=mt6_$('mt6-mdots');
  if(!mg||!mc||!md)return;
  if(n<2){mg.innerHTML=`<text x="${W/2}" y="${H/2}" font-family="DM Sans,sans-serif" font-size="11" fill="#9299B8" text-anchor="middle">Marque metas para ver a evolução</text>`;mc.innerHTML='';md.innerHTML='';return}
  const maxV=Math.max(...pts,1);
  const xs=pts.map((_,i)=>PL+i/Math.max(n-1,1)*cW);
  const ys=pts.map(v=>PT+cH-(v/maxV)*cH);
  const gridFs=W<380?[0,.5,1]:[0,.25,.5,.75,1];
  let grid='';
  gridFs.forEach(f=>{
    const yy=(PT+cH-f*cH).toFixed(1);const v=Math.round(maxV*f);
    grid+=`<line x1="${PL}" y1="${yy}" x2="${W-PR}" y2="${yy}" stroke="#E6E9F2" stroke-width="1"/>`;
    grid+=`<text x="${PL-3}" y="${(+yy+3).toFixed(1)}" font-family="DM Mono,monospace" font-size="7" fill="#9299B8" text-anchor="end">${v>=1000?Math.round(v/1000)+'k':v}</text>`;
  });
  const maxLbls=Math.max(2,Math.floor(W/65));const stepX=Math.max(1,Math.ceil(n/maxLbls));
  pts.forEach((_,i)=>{if(i===0||i===n-1||i%stepX===0)grid+=`<text x="${xs[i].toFixed(1)}" y="${H-3}" font-family="DM Mono,monospace" font-size="7" fill="#9299B8" text-anchor="middle">${i===0?'início':'T'+i}</text>`});
  mg.innerHTML=grid;
  if(mt6_chartMode==='line'){
    const line=mt6_smth(xs,ys);
    const area=line+` L${xs[n-1].toFixed(1)},${(PT+cH).toFixed(1)} L${xs[0].toFixed(1)},${(PT+cH).toFixed(1)} Z`;
    mc.innerHTML=`<path d="${area}" fill="url(#mt6aG)"/><path d="${line}" fill="none" stroke="url(#mt6lG)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#mt6glow)"/>`;
    md.innerHTML='';const showDots=n<=15;
    xs.forEach((x,i)=>{const last=i===n-1;if(!showDots&&!last)return;const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',x.toFixed(1));c.setAttribute('cy',ys[i].toFixed(1));c.setAttribute('r',last?'4':'2.5');c.setAttribute('fill',last?'#2EB67D':'#22915F');c.setAttribute('opacity',last?'1':'.5');if(last)c.setAttribute('filter','url(#mt6glow)');md.appendChild(c)});
    try{const lp=mc.querySelector('path:last-child');const len=lp.getTotalLength()||300;lp.style.strokeDasharray=len;lp.style.strokeDashoffset=len;lp.style.transition='none';void lp.getBoundingClientRect();lp.style.transition='stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)';lp.style.strokeDashoffset=0}catch(e){}
  }else{
    const bW=Math.max(2,Math.min(14,cW/n*0.5));const maxB=Math.max(maxV,1);
    let bars='';xs.forEach((x,i)=>{const h=Math.max(2,pts[i]/maxB*cH);bars+=`<rect x="${(x-bW/2).toFixed(1)}" y="${(PT+cH-h).toFixed(1)}" width="${bW.toFixed(1)}" height="${h.toFixed(1)}" fill="url(#mt6bG)" rx="2" class="mt6mbar" data-y="${(PT+cH-h).toFixed(1)}" data-h="${h.toFixed(1)}" style="transition:y .8s cubic-bezier(.34,1.4,.64,1) ${i*18}ms,height .8s cubic-bezier(.34,1.4,.64,1) ${i*18}ms"/>`});
    mc.innerHTML=bars;md.innerHTML='';
    requestAnimationFrame(()=>document.querySelectorAll('.mt6mbar').forEach(r=>{r.setAttribute('y',r.dataset.y);r.setAttribute('height',r.dataset.h)}));
  }
  const ms=mt6_$('mt6-mainsub');if(ms)ms.textContent=mt6_chartMode==='line'?`${n-1} marco${n-1!==1?'s':''} · ${mt6_totalXP()} XP`:`${n-1} ponto${n-1!==1?'s':''}`;
}
function mt6_setMode(m,btn){mt6_chartMode=m;document.querySelectorAll('.mt6-seg').forEach(b=>b.classList.remove('on'));btn.classList.add('on');mt6_drawMain()}

/* ── HBARS ── */
function mt6_drawHBars(){
  const levels=[{l:'Difícil',k:'hard',c:'#E84C6A'},{l:'Média',k:'mid',c:'#F5A623'},{l:'Fácil',k:'easy',c:'#3B82F6'}];
  const wrap=mt6_$('mt6-hbarwrap');const tbd=mt6_$('mt6-minitbl');
  if(!wrap||!tbd)return;
  const total=mt6_goals.length;const counts=levels.map(lv=>mt6_goals.filter(g=>g.level===lv.k).length);
  const dones=levels.map(lv=>mt6_goals.filter(g=>g.level===lv.k&&g.done).length);
  const maxV=Math.max(...counts,1);
  wrap.innerHTML='';
  levels.forEach((lv,i)=>{
    const cnt=counts[i],done=dones[i];if(!cnt)return;
    const pct=Math.round(cnt/maxV*100),donePct=Math.round(done/cnt*100);
    const row=document.createElement('div');row.className='mt6-hb-row';
    row.innerHTML=`<div class="mt6-hb-lbl">${lv.l}</div>
      <div class="mt6-hb-track"><div class="mt6-hb-fill" style="background:${lv.c};width:0%" data-w="${pct}"></div><div class="mt6-hb-done" style="background:${lv.c};width:${donePct}%"></div></div>
      <div class="mt6-hb-val" style="color:${lv.c}">${cnt}<span style="color:var(--mt4)"> (${done}✓)</span></div>`;
    wrap.appendChild(row);
  });
  setTimeout(()=>wrap.querySelectorAll('.mt6-hb-fill').forEach(f=>f.style.width=f.dataset.w+'%'),80);
  const hp=mt6_$('mt6-hbpill');if(hp)hp.textContent=mt6_goals.filter(g=>g.level==='hard'&&g.done).length+' difíceis ✓';
  const xpTot=mt6_totalXP();
  tbd.innerHTML=levels.map(lv=>{
    const cnt=mt6_goals.filter(g=>g.level===lv.k).length;if(!cnt)return'';
    const xp=mt6_goals.filter(g=>g.level===lv.k&&g.done).reduce((s,g)=>s+mt6_XP[g.level],0);
    return`<tr><td><span style="display:inline-flex;align-items:center;gap:4px"><span style="width:5px;height:5px;border-radius:50%;background:${lv.c};display:inline-block"></span>${lv.l}</span></td><td>${cnt}</td><td style="color:${lv.c};font-family:'DM Mono',monospace;font-weight:700">${xp}</td></tr>`;
  }).join('')+`<tr style="font-weight:800;border-top:1px solid var(--mb1)"><td>Total</td><td>${total}</td><td style="color:var(--g);font-family:'DM Mono',monospace;font-weight:800">${xpTot}</td></tr>`;
}

/* ── DONUT ── */
function mt6_drawDonut(){
  const cats=Object.keys(mt6_CAT_COL);const counts=cats.map(c=>mt6_goals.filter(g=>g.cat===c).length);
  const total=counts.reduce((s,v)=>s+v,0)||1;
  const CX=50,CY=50,R=34,SW=13;const circ=2*Math.PI*R;let off=0,paths='';
  cats.forEach((c,i)=>{
    if(!counts[i])return;const a=counts[i]/total;
    const dash=(circ*a).toFixed(2);const rest=(circ*(1-a)).toFixed(2);
    paths+=`<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${mt6_CAT_COL[c]}" stroke-width="${SW}" stroke-dasharray="${dash} ${rest}" stroke-dashoffset="${(-off+circ/4).toFixed(2)}" transform="rotate(-90 ${CX} ${CY})" style="transition:stroke-dasharray .9s cubic-bezier(.4,0,.2,1)"/>`;
    off+=circ*a;
  });
  const dg=mt6_$('mt6-dnutg');if(dg)dg.innerHTML=paths;
  const dn=mt6_$('mt6-dnutn');if(dn)dn.textContent=mt6_goals.length;
  const dp=mt6_$('mt6-dnutpill');if(dp)dp.textContent=mt6_doneG().length+' concluídas';
  const leg=mt6_$('mt6-dnutleg');if(!leg)return;
  leg.innerHTML='';
  cats.forEach((c,i)=>{
    if(!counts[i])return;const pct=Math.round(counts[i]/total*100);
    const row=document.createElement('div');row.className='mt6-dl';
    row.innerHTML=`<div class="mt6-dl-l"><div class="mt6-dl-dot" style="background:${mt6_CAT_COL[c]}"></div><span class="mt6-dl-n">${mt6_CAT_LBL[c]}</span></div><span class="mt6-dl-v">${counts[i]}<span style="color:var(--mt3);font-weight:400"> ${pct}%</span></span>`;
    leg.appendChild(row);
  });
}

/* ── TREND ── */
function mt6_drawTrend(){
  const tsvg=mt6_$('mt6-trendsvg');if(!tsvg)return;
  const W=tsvg.getBoundingClientRect().width||220;
  const H=Math.max(75,Math.min(105,W*0.38));
  const PL=20,PR=5,PT=9,PB=17,cW=W-PL-PR,cH=H-PT-PB;
  tsvg.setAttribute('viewBox',`0 0 ${W} ${H}`);tsvg.style.height=H+'px';
  const now=new Date();const months=[],vals=[];
  for(let m=5;m>=0;m--){
    const d=new Date(now.getFullYear(),now.getMonth()-m,1);months.push(mt6_SMB[d.getMonth()]);
    const s2=new Date(d.getFullYear(),d.getMonth(),1),e2=new Date(d.getFullYear(),d.getMonth()+1,0);
    vals.push(mt6_goals.filter(g=>g.doneAt&&new Date(g.doneAt)>=s2&&new Date(g.doneAt)<=e2).length);
  }
  const n=6,maxV=Math.max(...vals,1);
  const xs=vals.map((_,i)=>PL+i/(n-1)*cW),ys=vals.map(v=>PT+cH-(v/maxV)*cH);
  let grid='';[0,.5,1].forEach(f=>{const yy=(PT+cH-f*cH).toFixed(1);const v=Math.round(maxV*f);grid+=`<line x1="${PL}" y1="${yy}" x2="${W-PR}" y2="${yy}" stroke="#E6E9F2" stroke-width="1"/>`;grid+=`<text x="${PL-2}" y="${(+yy+3).toFixed(1)}" font-family="DM Mono,monospace" font-size="7" fill="#9299B8" text-anchor="end">${v}</text>`});
  const tg=mt6_$('mt6-tgrid');if(tg)tg.innerHTML=grid;
  const line=mt6_smth(xs,ys);const area=line+` L${xs[n-1].toFixed(1)},${(PT+cH).toFixed(1)} L${xs[0].toFixed(1)},${(PT+cH).toFixed(1)} Z`;
  const ta=mt6_$('mt6-tarea');if(ta)ta.setAttribute('d',area);
  const tl=mt6_$('mt6-tline');if(tl){tl.setAttribute('d',line);try{const len=tl.getTotalLength()||200;tl.style.strokeDasharray=len;tl.style.strokeDashoffset=len;tl.style.transition='none';void tl.getBoundingClientRect();tl.style.transition='stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)';tl.style.strokeDashoffset=0}catch(e){}}
  const tdg=mt6_$('mt6-tdots');if(tdg){tdg.innerHTML='';xs.forEach((x,i)=>{const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',x.toFixed(1));c.setAttribute('cy',ys[i].toFixed(1));c.setAttribute('r',i===n-1?'4':'2.8');c.setAttribute('fill',i===n-1?'#2EB67D':'#22915F');c.setAttribute('opacity',i===n-1?'1':'.5');tdg.appendChild(c);if(vals[i]>0){const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',x.toFixed(1));t.setAttribute('y',(ys[i]-6).toFixed(1));t.setAttribute('text-anchor','middle');t.setAttribute('font-family','DM Mono,monospace');t.setAttribute('font-size','8');t.setAttribute('fill','#2EB67D');t.setAttribute('font-weight','600');t.textContent=vals[i];tdg.appendChild(t)}})}
  const tp=mt6_$('mt6-trendpill');if(tp)tp.textContent=vals.reduce((s,v)=>s+v,0)+' no semestre';
  const tlbl=mt6_$('mt6-tlabels');if(tlbl)tlbl.innerHTML=months.map(m=>`<span style="font-family:'DM Mono',monospace;font-size:.5rem;color:var(--mt3);flex:1;text-align:center">${m}</span>`).join('');
}

/* ── PERIOD BARS ── */
function mt6_drawPeriods(){
  const now=new Date();const y=now.getFullYear(),mo=now.getMonth();
  const fills=['g','a','b','p'];const periods=[];
  for(let off=0;off<4;off++){
    const eM=mo-off*6,sM=eM-5;
    const start=new Date(y,sM,1),end=new Date(y,eM+1,0);
    const lbl=mt6_SMB[((sM%12)+12)%12]+' — '+mt6_SMB[((eM%12)+12)%12];
    const done=mt6_doneG().filter(g=>g.doneAt&&new Date(g.doneAt)>=start&&new Date(g.doneAt)<=end).length;
    periods.push({lbl,done,fi:fills[off]});
  }
  const maxD=Math.max(...periods.map(p=>p.done),1);
  const el=mt6_$('mt6-perrows');if(!el)return;el.innerHTML='';
  periods.forEach(p=>{
    const pct=Math.round(p.done/maxD*100);
    const row=document.createElement('div');row.className='mt6-per-row';
    row.innerHTML=`<div class="mt6-per-lbl">${p.lbl}</div><div class="mt6-per-track"><div class="mt6-per-fill ${p.fi}" style="width:0%" data-w="${pct}"></div></div><div class="mt6-per-val">${p.done}</div>`;
    el.appendChild(row);
  });
  const best=periods.reduce((a,b)=>b.done>a.done?b:a,periods[0]);
  const pp=mt6_$('mt6-perpill');if(pp)pp.textContent='Melhor: '+best.lbl;
  setTimeout(()=>el.querySelectorAll('.mt6-per-fill').forEach(f=>f.style.width=f.dataset.w+'%'),80);
}

/* ── GOALS TABLE ── */
function mt6_renderTable(){
  let list=mt6_visGoals();
  if(mt6_lvFilter!=='all')list=list.filter(g=>g.level===mt6_lvFilter);
  const w={hard:3,mid:2,easy:1};
  list=[...list.filter(g=>!g.done).sort((a,b)=>w[b.level]-w[a.level]),...list.filter(g=>g.done)];
  const tb=mt6_$('mt6-gtbody');if(!tb)return;
  if(!list.length){tb.innerHTML=`<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--mt3);font-size:.72rem">Nenhuma meta encontrada</td></tr>`;return}
  tb.innerHTML=list.map(g=>{
    const pct=g.done?100:mt6_estProg(g);const fc=mt6_LV_C[g.level];const catCol=mt6_CAT_COL[g.cat]||'#9299B8';
    return`<tr class="${g.done?'mt6-done-row':''}" id="mt6-gr-${g.id}">
      <td><div class="mt6-td-chk" onclick="mt6_toggleGoal(${g.id},event)"><div class="mt6-td-cb ${g.done?'chk':''}" id="mt6-cb-${g.id}"><svg class="mt6-td-ck ${g.done?'chk':''}" id="mt6-ck-${g.id}" viewBox="0 0 9 7"><polyline points="1,3.5 3.5,6 8,1"/></svg></div><span class="mt6-td-nm ${g.done?'chk':''}" id="mt6-nm-${g.id}">${g.name}</span></div></td>
      <td><span class="mt6-lv mt6-lv-${g.level[0]}">${mt6_LV_L[g.level]}</span></td>
      <td><div class="mt6-td-prog"><div class="mt6-td-pt"><div class="mt6-td-pf" id="mt6-pf-${g.id}" style="width:${pct}%;background:${fc}"></div></div><span class="mt6-td-pct" id="mt6-pc-${g.id}">${pct}%</span></div></td>
      <td><span style="font-size:.58rem;color:${catCol};font-weight:700;padding:2px 5px;background:${catCol}20;border-radius:100px">${g.cat}</span></td>
      <td style="font-family:'DM Mono',monospace;font-size:.65rem;color:${g.done?'var(--g)':'var(--mt3)'};font-weight:${g.done?'700':'400'}" id="mt6-xp-${g.id}">${g.done?'+'+mt6_XP[g.level]+' XP':'—'}</td>
    </tr>`;
  }).join('');
  const done2=list.filter(g=>g.done).length;
  const ls=mt6_$('mt6-listsub');if(ls)ls.textContent=`${list.length-done2} pendentes · ${done2} concluídas`;
  const ti=mt6_$('mt6-tblinfo');if(ti)ti.textContent=`${list.length} registro${list.length!==1?'s':''}`;
}

function mt6_toggleGoal(id,ev){
  ev.stopPropagation();
  const g=mt6_goals.find(x=>x.id===id);if(!g)return;
  g.done=!g.done;g.doneAt=g.done?new Date().toISOString():null;
  const _c=id2=>{const el=mt6_$(id2);return el};
  const row=_c(`mt6-gr-${id}`),cb=_c(`mt6-cb-${id}`),ck=_c(`mt6-ck-${id}`);
  const nm=_c(`mt6-nm-${id}`),pf=_c(`mt6-pf-${id}`),pc=_c(`mt6-pc-${id}`),xp=_c(`mt6-xp-${id}`);
  if(row){row.classList.toggle('mt6-done-row',g.done);row.style.transition='transform .22s cubic-bezier(.34,1.4,.64,1)';row.style.transform='scale(1.01)';setTimeout(()=>{if(row)row.style.transform=''},200)}
  if(cb)cb.classList.toggle('chk',g.done);if(ck)ck.classList.toggle('chk',g.done);if(nm)nm.classList.toggle('chk',g.done);
  const pct=g.done?100:mt6_estProg(g);
  if(pf)pf.style.width=pct+'%';if(pc)pc.textContent=pct+'%';
  if(xp){xp.textContent=g.done?'+'+mt6_XP[g.level]+' XP':'—';xp.style.color=g.done?'var(--g)':'var(--mt3)';xp.style.fontWeight=g.done?'700':'400'}
  if(g.done){const last=mt6_hist[mt6_hist.length-1]||0;mt6_hist.push(last+mt6_XP[g.level]);mt6_pushFeed(g)}
  else if(mt6_hist.length>1)mt6_hist.pop();
  mt6_save();mt6_toast(g.done?`✦ "${g.name}" concluída! +${mt6_XP[g.level]} XP`:`↩ "${g.name}" reaberta`);
  mt6_updateKPI();mt6_drawMain();mt6_drawHBars();mt6_drawDonut();mt6_drawTrend();mt6_drawPeriods();mt6_renderCal();
  const d2=mt6_goals.filter(x=>x.done).length,t2=mt6_visGoals().length;
  const ls=mt6_$('mt6-listsub');if(ls)ls.textContent=`${t2-d2} pendentes · ${d2} concluídas`;
}

function mt6_setFilter(f,btn){mt6_lvFilter=f;document.querySelectorAll('.mt6-gf').forEach(b=>b.classList.remove('on'));btn.classList.add('on');mt6_renderTable()}
function mt6_setSbF(f,el){mt6_sbFilter=f;mt6_renderTable();mt6_updateKPI()}
function mt6_onCatChg(){const s=mt6_$('mt6-sbcat');mt6_sbCat=s?s.value:'all';mt6_renderTable();mt6_updateKPI()}

/* ── LIVE FEED ── */
function mt6_initFeed(){
  mt6_feedItems=mt6_doneG().sort((a,b)=>new Date(b.doneAt)-new Date(a.doneAt)).slice(0,5)
    .map((g,i)=>({g,ago:['agora mesmo','há 2min','há 5min','há 12min','há 25min'][i]||'antes'}));
  mt6_renderFeed();
}
function mt6_pushFeed(g){
  mt6_feedItems.unshift({g,ago:'agora mesmo'});
  const times=['agora mesmo','há 1min','há 4min','há 8min','há 18min'];
  mt6_feedItems=mt6_feedItems.slice(0,5).map((it,i)=>({...it,ago:times[i]||'antes'}));
  mt6_renderFeed();
}
function mt6_renderFeed(){
  const el=mt6_$('mt6-feed');if(!el)return;
  const msgs=[g=>`concluiu <strong>${g.name}</strong>`,g=>`+${mt6_XP[g.level]} XP em <strong>${g.name}</strong>`,g=>`meta feita: <strong>${g.name}</strong>`];
  el.innerHTML=mt6_feedItems.map(it=>{
    const g=it.g;const col=mt6_LV_C[g.level];const msg=msgs[Math.floor(Math.random()*msgs.length)](g);
    return`<div class="mt6-feed-item"><div class="mt6-fd" style="background:${col}"></div><div class="mt6-ft">${msg}</div><span class="mt6-fx ${g.level}">+${mt6_XP[g.level]}xp</span><span class="mt6-ftm">${it.ago}</span></div>`;
  }).join('');
}

/* ── SIMULATION ── */
function mt6_startSim(){
  if(mt6_simTimer)return;
  function tick(){
    const pending=mt6_goals.filter(g=>!g.done);
    if(!pending.length){clearInterval(mt6_simTimer);mt6_simTimer=null;return}
    if(Math.random()<0.28){
      const g=pending[Math.floor(Math.random()*pending.length)];
      g.done=true;g.doneAt=new Date().toISOString();
      const last=mt6_hist[mt6_hist.length-1]||0;mt6_hist.push(last+mt6_XP[g.level]);
      mt6_save();mt6_pushFeed(g);
      const cb=mt6_$(`mt6-cb-${g.id}`),ck=mt6_$(`mt6-ck-${g.id}`),nm=mt6_$(`mt6-nm-${g.id}`);
      const pf=mt6_$(`mt6-pf-${g.id}`),pc=mt6_$(`mt6-pc-${g.id}`),xp=mt6_$(`mt6-xp-${g.id}`);
      const row=mt6_$(`mt6-gr-${g.id}`);
      if(row)row.classList.add('mt6-done-row');if(cb)cb.classList.add('chk');if(ck)ck.classList.add('chk');
      if(nm)nm.classList.add('chk');if(pf)pf.style.width='100%';if(pc)pc.textContent='100%';
      if(xp){xp.textContent='+'+mt6_XP[g.level]+' XP';xp.style.color='var(--g)';xp.style.fontWeight='700'}
      mt6_updateKPI();mt6_drawMain();mt6_drawHBars();mt6_drawDonut();mt6_drawTrend();mt6_drawPeriods();mt6_renderCal();
      mt6_toast(`🤖 "${g.name}" +${mt6_XP[g.level]} XP`);
    }
  }
  mt6_simTimer=setInterval(tick,9000+Math.random()*5000);
}

/* ── CALENDAR ── */
function mt6_renderCal(){
  const el=mt6_$('mt6-caldays');if(!el)return;
  const ml=mt6_$('mt6-calm');if(ml)ml.textContent=mt6_MBR[mt6_calM]+' '+mt6_calY;
  el.innerHTML='';
  const first=new Date(mt6_calY,mt6_calM,1).getDay();const total=new Date(mt6_calY,mt6_calM+1,0).getDate();
  const now=new Date();const todayS=now.toDateString();
  for(let i=0;i<first;i++){const e=document.createElement('div');e.className='mt6-cal-day empty';el.appendChild(e)}
  for(let d=1;d<=total;d++){
    const dt=new Date(mt6_calY,mt6_calM,d);const ds=dt.toDateString();const fut=dt>now&&ds!==todayS;
    const dG=mt6_goals.filter(g=>g.doneAt&&new Date(g.doneAt).toDateString()===ds);
    const div=document.createElement('div');
    div.className='mt6-cal-day'+(ds===todayS?' today':'')+(dG.length?' has':'')+(fut?' fut':'');
    if(mt6_selCalDay&&new Date(mt6_selCalDay).toDateString()===ds)div.classList.add('sel');
    div.textContent=d;
    if(!fut)div.addEventListener('click',()=>{mt6_selCalDay=dt.toISOString();mt6_renderCal();mt6_showCalDet(dt,dG)});
    el.appendChild(div);
  }
}
function mt6_showCalDet(dt,dG){
  const el=mt6_$('mt6-caldet'),ti=mt6_$('mt6-cdt'),it=mt6_$('mt6-cdi');
  if(!el||!ti||!it)return;
  ti.textContent=dt.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
  it.innerHTML=dG.length?dG.map(g=>`<div class="mt6-cd-i"><div class="mt6-cd-d" style="background:${mt6_LV_C[g.level]}"></div>${g.name}</div>`).join(''):`<div class="mt6-cd-i" style="color:var(--mt3)">Nenhuma meta neste dia.</div>`;
  el.classList.add('show');
}

/* ── MODAL ── */
function mt6_openModal(){
  mt6_selLvl='';const nm=mt6_$('mt6-m-nm'),mo=mt6_$('mt6-m-mo'),cat=mt6_$('mt6-m-cat');
  if(nm)nm.value='';if(mo)mo.value='';if(cat)cat.value='pessoal';
  document.querySelectorAll('.mt6-lp-b').forEach(b=>{b.className='mt6-lp-b'});
  const ov=mt6_$('mt6-ov');if(ov)ov.classList.add('open');
  setTimeout(()=>{const f=mt6_$('mt6-m-nm');if(f)f.focus()},120);
}
function mt6_closeModal(){const ov=mt6_$('mt6-ov');if(ov)ov.classList.remove('open')}
function mt6_pickLvl(v,btn){mt6_selLvl=v;document.querySelectorAll('.mt6-lp-b').forEach(b=>{b.className='mt6-lp-b'});btn.className='mt6-lp-b '+v[0]}
function mt6_saveGoal(){
  const nm=mt6_$('mt6-m-nm');const name=nm?nm.value.trim():'';
  if(!name){mt6_toast('Informe o nome da meta');return}
  if(!mt6_selLvl){mt6_toast('Selecione o nível');return}
  const mo=mt6_$('mt6-m-mo'),cat=mt6_$('mt6-m-cat');
  const g={id:mt6_nextId++,name,level:mt6_selLvl,months:parseInt(mo?mo.value:0)||0,cat:cat?cat.value:'pessoal',done:false,doneAt:null,createdAt:new Date().toISOString()};
  mt6_goals.unshift(g);mt6_save();mt6_renderAll();mt6_closeModal();mt6_toast(`✦ "${name}" adicionada!`);
}

/* ── RENDER ALL ── */
function mt6_renderAll(){
  mt6_updateKPI();mt6_drawMain();mt6_drawHBars();mt6_drawDonut();mt6_drawTrend();mt6_drawPeriods();mt6_renderTable();mt6_renderCal();
}

/* ── MAIN RENDER FUNCTION (called by LifeOS dispatcher) ── */
