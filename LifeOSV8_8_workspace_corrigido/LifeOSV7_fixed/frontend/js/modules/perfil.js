/**
 * ============================================================
 * LIFEOS — PERFIL.JS
 * Arquivo: js/modules/perfil.js
 * Função: Módulos de Perfil, Configurações, Feedback e Suporte.
 *         Acessíveis pelo hamburger menu (☰) no header.
 *         NÃO aparecem no carousel de navegação.
 * ============================================================
 */

'use strict';

// ── PERFIL ───────────────────────────────────────────────────

/**
 * Renderiza a página de perfil do usuário.
 * Mostra: avatar, nome, bio, stats (streak, XP, nível), barra XP.
 * Design profissional com cover gradient + avatar sobreposto.
 * @param {HTMLElement} s - container do module-stage
 */
function renderPerfil(s) {
  const level    = USER.level    || 1;
  const xp       = USER.totalXP  || 0;
  const streak   = USER.streak   || 0;
  const progress = USER.progress || 0;
  const xpNext   = (level * 1000); // próximo nível = nível atual × 1000 XP
  const xpPct    = Math.min(Math.round((xp / xpNext) * 100), 100);

  s.innerHTML = `
  <style>
    /* ── Perfil: estilos escopados ── */
    .pf-shell { max-width:680px; margin:0 auto; display:flex; flex-direction:column; gap:1.25rem; width:100%; }
    .pf-hero  { background:var(--bg); border:1px solid var(--border); border-radius:var(--r-lg); overflow:hidden; }
    .pf-cover { height:100px; background:linear-gradient(135deg,#a855f7 0%,#6d28d9 60%,#312e81 100%); position:relative; }
    .pf-cover-dots { position:absolute;inset:0;opacity:.12;background-image:radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px),radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px);background-size:40px 40px; }
    .pf-avatar-row { display:flex; align-items:flex-end; justify-content:space-between; padding:0 1.5rem 1.25rem; margin-top:-36px; flex-wrap:wrap; gap:.75rem; }
    .pf-avatar-big { width:72px; height:72px; border-radius:50%; background:var(--text); border:3px solid var(--bg); display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:800; color:var(--bg); letter-spacing:.02em; flex-shrink:0; box-shadow:0 4px 16px rgba(168,85,247,.25); }
    .pf-plan-badge { display:inline-flex; align-items:center; gap:.35rem; padding:.3rem .8rem; background:linear-gradient(135deg,#a855f7,#6d28d9); color:#fff; border-radius:999px; font-size:.65rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }
    .pf-info  { padding:0 1.5rem 1.5rem; }
    .pf-name  { font-size:1.35rem; font-weight:800; letter-spacing:-.04em; margin-bottom:.15rem; }
    .pf-handle{ font-size:.78rem; color:var(--t3); font-weight:500; margin-bottom:.6rem; }
    .pf-bio   { font-size:.85rem; color:var(--t2); line-height:1.6; max-width:480px; }
    .pf-divider { height:1px; background:var(--border); margin:1rem 0; }
    .pf-stat-row { display:flex; gap:2rem; flex-wrap:wrap; }
    .pf-stat   { display:flex; flex-direction:column; gap:.15rem; }
    .pf-stat-val { font-size:1.2rem; font-weight:800; letter-spacing:-.03em; }
    .pf-stat-lbl { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--t3); }
    .pf-section { background:var(--bg); border:1px solid var(--border); border-radius:var(--r-lg); padding:1.25rem 1.5rem; }
    .pf-sec-title { font-size:.62rem; font-weight:800; text-transform:uppercase; letter-spacing:.09em; color:var(--t3); margin-bottom:1rem; }
    .pf-row { display:flex; align-items:center; justify-content:space-between; padding:.6rem 0; border-bottom:1px solid var(--border); gap:.75rem; }
    .pf-row:last-child { border-bottom:none; }
    .pf-row-lbl { font-size:.82rem; color:var(--t2); font-weight:500; }
    .pf-row-val { font-size:.82rem; font-weight:700; text-align:right; }
    .pf-xp-wrap  { margin-top:.75rem; }
    .pf-xp-label { display:flex; justify-content:space-between; font-size:.72rem; font-weight:700; color:var(--t3); margin-bottom:.4rem; }
    .pf-xp-track { height:6px; background:var(--bg-m); border-radius:999px; overflow:hidden; }
    .pf-xp-fill  { height:100%; background:linear-gradient(90deg,#a855f7,#6d28d9); border-radius:999px; width:${xpPct}%; transition:width 1.1s cubic-bezier(.34,1.4,.64,1); }
    .pf-chips    { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.5rem; }
    .pf-chip     { padding:.25rem .75rem; border-radius:999px; font-size:.65rem; font-weight:700; background:var(--bg-m); color:var(--t2); border:1px solid var(--border); }
  </style>

  <div class="pf-shell">

    <!-- Hero com cover gradient -->
    <div class="pf-hero">
      <div class="pf-cover">
        <div class="pf-cover-dots"></div>
      </div>
      <div class="pf-avatar-row">
        <div class="pf-avatar-big">${USER.initials || '?'}</div>
        <span class="pf-plan-badge">✦ Plano ${USER.plan || 'Free'}</span>
      </div>
      <div class="pf-info">
        <div class="pf-name">${USER.name || 'Usuário'}</div>
        <div class="pf-handle">${USER.profession || 'Profissão não informada'} · Membro desde ${USER.memberSince || '—'}</div>
        <div class="pf-bio">${USER.bio || 'Sem bio cadastrada.'}</div>
        <div class="pf-divider"></div>
        <!-- Stats rápidas -->
        <div class="pf-stat-row">
          <div class="pf-stat">
            <span class="pf-stat-val">${streak}</span>
            <span class="pf-stat-lbl">Dias seguidos</span>
          </div>
          <div class="pf-stat">
            <span class="pf-stat-val">${progress}%</span>
            <span class="pf-stat-lbl">Progresso geral</span>
          </div>
          <div class="pf-stat">
            <span class="pf-stat-val">Nv ${level}</span>
            <span class="pf-stat-lbl">Nível atual</span>
          </div>
          <div class="pf-stat">
            <span class="pf-stat-val">${(xp / 1000).toFixed(1)}k</span>
            <span class="pf-stat-lbl">XP total</span>
          </div>
        </div>
        <!-- Barra de XP para próximo nível -->
        <div class="pf-xp-wrap">
          <div class="pf-xp-label">
            <span>XP: ${xp.toLocaleString()}</span>
            <span>Próx. nível: ${xpNext.toLocaleString()}</span>
          </div>
          <div class="pf-xp-track"><div class="pf-xp-fill"></div></div>
        </div>
      </div>
    </div>

    <!-- Objetivo principal -->
    <div class="pf-section">
      <p class="pf-sec-title">🎯 Objetivo Principal</p>
      <div style="background:var(--acc-bg);border:1px solid rgba(168,85,247,.2);border-radius:var(--r);padding:.9rem 1rem;">
        <div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin-bottom:.25rem">Foco atual</div>
        <div style="font-size:.9rem;font-weight:700;color:var(--text)">
          ${GOALS[0]?.title || 'Configure suas metas no módulo Metas'}
        </div>
      </div>
      <div class="pf-chips" style="margin-top:1rem">
        <span class="pf-chip">⚡ Produtividade</span>
        <span class="pf-chip">📚 Aprendizado</span>
        <span class="pf-chip">💰 Finanças</span>
        <span class="pf-chip">🏃 Saúde</span>
      </div>
    </div>

    <!-- Dados da conta -->
    <div class="pf-section">
      <p class="pf-sec-title">Identidade na Plataforma</p>
      <div class="pf-row"><span class="pf-row-lbl">E-mail</span><span class="pf-row-val">${USER.email || '—'}</span></div>
      <div class="pf-row"><span class="pf-row-lbl">Membro desde</span><span class="pf-row-val">${USER.memberSince || '—'}</span></div>
      <div class="pf-row"><span class="pf-row-lbl">Score de foco</span><span class="pf-row-val">${USER.focusScore || 0} pts</span></div>
      <div class="pf-row"><span class="pf-row-lbl">Nível de energia</span><span class="pf-row-val">${USER.energyLevel || 5}/10</span></div>
      <div class="pf-row">
        <span class="pf-row-lbl">Região detectada</span>
        <span class="pf-row-val" style="font-size:.75rem;color:var(--t3)">${typeof LOCALE !== 'undefined' ? LOCALE.timezone : '—'} · ${typeof LOCALE !== 'undefined' ? LOCALE.currency : '—'}</span>
      </div>
    </div>

    <!-- Editar dados da conta -->
    <div class="pf-section">
      <p class="pf-sec-title">✏️ Editar Perfil</p>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div>
          <label style="font-size:.72rem;font-weight:700;color:var(--t3);display:block;margin-bottom:.3rem">Nome de exibição</label>
          <input id="pf-edit-name" class="cfg-input" style="width:100%" value="${USER.name || ''}" placeholder="Seu nome completo"/>
        </div>
        <div>
          <label style="font-size:.72rem;font-weight:700;color:var(--t3);display:block;margin-bottom:.3rem">Profissão</label>
          <input id="pf-edit-prof" class="cfg-input" style="width:100%" value="${USER.profession || ''}" placeholder="Ex: Desenvolvedor, Professor, Médico"/>
        </div>
        <div>
          <label style="font-size:.72rem;font-weight:700;color:var(--t3);display:block;margin-bottom:.3rem">Bio curta</label>
          <input id="pf-edit-bio" class="cfg-input" style="width:100%" value="${USER.bio || ''}" placeholder="Uma frase sobre você"/>
        </div>
        <button class="btn btn-primary" style="align-self:flex-start;padding:0 1.5rem" onclick="
          const n = document.getElementById('pf-edit-name').value.trim();
          const p = document.getElementById('pf-edit-prof').value.trim();
          const b = document.getElementById('pf-edit-bio').value.trim();
          if(n) { USER.name = n; USER.initials = n.split(' ').slice(0,2).map(w=>w[0].toUpperCase()).join(''); }
          if(p) USER.profession = p;
          if(b) USER.bio = b;
          if(typeof renderHeader === 'function') renderHeader();
          showToast('Perfil atualizado ✓');
          setTimeout(() => switchModule('perfil'), 800);
        ">Salvar alterações</button>
      </div>
    </div>

    <!-- CONTA — Trocar / Sair -->
    <div class="pf-section" style="border-color:rgba(239,68,68,.2)">
      <p class="pf-sec-title" style="color:#ef4444">⚠️ Conta</p>
      <div style="display:flex;flex-direction:column;gap:.75rem">

        <!-- Trocar de conta: faz logout E reabre o seletor do Google -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem">
          <div>
            <div style="font-size:.85rem;font-weight:700">Trocar de conta</div>
            <div style="font-size:.72rem;color:var(--t3);margin-top:.15rem">Sai da conta atual e abre o seletor do Google</div>
          </div>
          <button class="btn btn-outline" style="font-size:.82rem;border-color:#ef4444;color:#ef4444" onclick="
            firebase.auth().signOut().then(() => {
              localStorage.removeItem('lifeos_token');
              localStorage.removeItem('lifeos_onboarding_progress');
              window.location.href = 'login.html';
            }).catch(() => { window.location.href = 'login.html'; });
          ">🔄 Trocar conta</button>
        </div>

        <!-- Sair da conta -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;padding-top:.75rem;border-top:1px solid var(--border)">
          <div>
            <div style="font-size:.85rem;font-weight:700">Sair da plataforma</div>
            <div style="font-size:.72rem;color:var(--t3);margin-top:.15rem">Encerra sua sessão neste dispositivo</div>
          </div>
          <button class="btn btn-outline" style="font-size:.82rem;border-color:#ef4444;color:#ef4444" onclick="doLogout()">
            🚪 Sair
          </button>
        </div>

      </div>
    </div>

  </div>`;
}

// ── CONFIGURAÇÕES ─────────────────────────────────────────────

/**
 * Renderiza a página de configurações.
 * Inclui: conta, objetivo, preferências (toggles reais), plano, dados.
 * @param {HTMLElement} s - container do module-stage
 */
function renderConfiguracoes(s) {
  const isDark = document.body.classList.contains('dark-theme');

  s.innerHTML = `
  <style>
    /* ── Configurações: estilos escopados ── */
    .cfg-shell    { max-width:680px; margin:0 auto; display:flex; flex-direction:column; gap:1.25rem; width:100%; }
    .cfg-section  { background:var(--bg); border:1px solid var(--border); border-radius:var(--r-lg); overflow:hidden; }
    .cfg-sec-hdr  { padding:.9rem 1.5rem; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:.6rem; }
    .cfg-sec-icon { font-size:1rem; }
    .cfg-sec-title{ font-size:.8rem; font-weight:800; letter-spacing:.01em; }
    .cfg-row      { display:flex; align-items:center; justify-content:space-between; padding:.85rem 1.5rem; border-bottom:1px solid var(--border); gap:1rem; flex-wrap:wrap; }
    .cfg-row:last-child { border-bottom:none; }
    .cfg-row-left { flex:1; min-width:0; }
    .cfg-row-label{ font-size:.85rem; font-weight:600; color:var(--text); display:block; }
    .cfg-row-desc { font-size:.72rem; color:var(--t3); margin-top:.1rem; display:block; }
    .cfg-input    { height:34px; padding:0 .85rem; border:1px solid var(--border); border-radius:var(--r-sm); font-family:inherit; font-size:.82rem; color:var(--text); background:var(--bg-s); outline:none; width:200px; max-width:100%; transition:border-color .15s; }
    .cfg-input:focus { border-color:var(--accent); }
    .cfg-select   { height:34px; padding:0 .75rem; border:1px solid var(--border); border-radius:var(--r-sm); font-family:inherit; font-size:.82rem; color:var(--text); background:var(--bg-s); outline:none; cursor:pointer; transition:border-color .15s; }
    .cfg-select:focus { border-color:var(--accent); }
    /* Toggle real (input checkbox escondido) */
    .cfg-toggle-wrap { position:relative; width:40px; height:22px; flex-shrink:0; }
    .cfg-toggle-wrap input { opacity:0; width:0; height:0; position:absolute; }
    .cfg-toggle-slider { position:absolute; inset:0; background:var(--border); border-radius:999px; cursor:pointer; transition:background .2s; }
    .cfg-toggle-slider::after { content:''; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .2s; }
    .cfg-toggle-wrap input:checked + .cfg-toggle-slider { background:var(--accent); }
    .cfg-toggle-wrap input:checked + .cfg-toggle-slider::after { transform:translateX(18px); }
    /* Plano box */
    .cfg-plan-box  { margin:1.5rem; padding:1.25rem; background:linear-gradient(135deg,rgba(168,85,247,.08),rgba(109,40,217,.05)); border:1px solid rgba(168,85,247,.2); border-radius:var(--r); }
    .cfg-plan-top  { display:flex; align-items:center; justify-content:space-between; margin-bottom:.75rem; flex-wrap:wrap; gap:.5rem; }
    .cfg-plan-name { font-size:1rem; font-weight:800; letter-spacing:-.02em; }
    .cfg-plan-badge{ padding:.25rem .75rem; background:linear-gradient(135deg,#a855f7,#6d28d9); color:#fff; border-radius:999px; font-size:.62rem; font-weight:800; letter-spacing:.05em; text-transform:uppercase; }
    .cfg-plan-item { display:flex; align-items:center; gap:.5rem; font-size:.78rem; color:var(--t2); margin-bottom:.35rem; }
    .cfg-plan-item::before { content:'✓'; color:var(--accent); font-weight:800; flex-shrink:0; }
    .cfg-save-btn  { margin:1.5rem; }
  </style>

  <div class="cfg-shell">

    <!-- Conta -->
    <div class="cfg-section">
      <div class="cfg-sec-hdr"><span class="cfg-sec-icon">👤</span><span class="cfg-sec-title">Conta</span></div>
      <div class="cfg-row">
        <div class="cfg-row-left">
          <span class="cfg-row-label">Nome de exibição</span>
          <span class="cfg-row-desc">Seu nome na plataforma</span>
        </div>
        <input class="cfg-input" id="cfg-name" value="${USER.name || ''}" placeholder="Seu nome"/>
      </div>
      <div class="cfg-row">
        <div class="cfg-row-left">
          <span class="cfg-row-label">Profissão</span>
          <span class="cfg-row-desc">Contexto para o check-in adaptativo com IA</span>
        </div>
        <input class="cfg-input" id="cfg-prof" value="${USER.profession || ''}" placeholder="Ex: Desenvolvedor"/>
      </div>
      <div class="cfg-save-btn">
        <button class="btn btn-primary" onclick="
          if($('cfg-name').value)  USER.name       = $('cfg-name').value;
          if($('cfg-prof').value)  USER.profession = $('cfg-prof').value;
          renderHeader();
          showToast('Conta atualizada ✓');
        ">Salvar alterações</button>
      </div>
    </div>

    <!-- Preferências -->
    <div class="cfg-section">
      <div class="cfg-sec-hdr"><span class="cfg-sec-icon">⚡</span><span class="cfg-sec-title">Preferências</span></div>

      <div class="cfg-row">
        <div class="cfg-row-left">
          <span class="cfg-row-label">Modo escuro</span>
          <span class="cfg-row-desc">Alterna entre tema claro e escuro</span>
        </div>
        <label class="cfg-toggle-wrap">
          <input type="checkbox" id="cfg-dark-chk" ${isDark ? 'checked' : ''}
            onchange="$('theme-toggle').click()"/>
          <span class="cfg-toggle-slider"></span>
        </label>
      </div>

      <div class="cfg-row">
        <div class="cfg-row-left">
          <span class="cfg-row-label">Alerta de check-in</span>
          <span class="cfg-row-desc">Lembrete após as 19h se não fizer check-in</span>
        </div>
        <label class="cfg-toggle-wrap">
          <input type="checkbox" id="cfg-alert-chk" checked
            onchange="showToast(this.checked ? 'Alerta ativado' : 'Alerta desativado')"/>
          <span class="cfg-toggle-slider"></span>
        </label>
      </div>

      <div class="cfg-row">
        <div class="cfg-row-left">
          <span class="cfg-row-label">Idioma e região</span>
          <span class="cfg-row-desc">Detectado automaticamente: ${LOCALE?.lang || 'pt-BR'} · ${LOCALE?.timezone || '—'}</span>
        </div>
        <select class="cfg-select">
          <option selected>🌍 Automático (${LOCALE?.lang || 'pt-BR'})</option>
          <option>🇧🇷 Português (BR)</option>
          <option>🇺🇸 English (US)</option>
          <option>🇪🇸 Español</option>
        </select>
      </div>

      <div class="cfg-row">
        <div class="cfg-row-left">
          <span class="cfg-row-label">Moeda</span>
          <span class="cfg-row-desc">Usada no módulo Finanças</span>
        </div>
        <select class="cfg-select">
          <option selected>${LOCALE?.currency || 'BRL'} (${LOCALE?.symbol || 'R$'})</option>
          <option>USD ($)</option>
          <option>EUR (€)</option>
          <option>GBP (£)</option>
        </select>
      </div>
    </div>

    <!-- Plano -->
    <div class="cfg-section">
      <div class="cfg-sec-hdr"><span class="cfg-sec-icon">💎</span><span class="cfg-sec-title">Plano & Assinatura</span></div>
      <div class="cfg-plan-box">
        <div class="cfg-plan-top">
          <span class="cfg-plan-name">LifeOS ${USER.plan || 'Free'}</span>
          <span class="cfg-plan-badge">Ativo</span>
        </div>
        <div class="cfg-plan-item">Check-in adaptativo com IA</div>
        <div class="cfg-plan-item">Plano IA personalizado</div>
        <div class="cfg-plan-item">Analytics avançado</div>
        <div class="cfg-plan-item">Exportação de dados</div>
        <div class="cfg-plan-item">Suporte prioritário</div>
        <div style="margin-top:1rem;padding-top:.75rem;border-top:1px solid rgba(168,85,247,.2);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem">
          <span style="font-size:.75rem;color:var(--t3)">Próxima renovação: <strong style="color:var(--text)">15 de Mai, 2025</strong></span>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button class="btn btn-outline" style="font-size:.72rem;height:28px" onclick="showToast('Gerenciamento de plano em breve!')">Gerenciar</button>
            <button class="btn btn-ghost" style="font-size:.72rem;height:28px;color:#ef4444;border-color:#ef4444" onclick="
              if(confirm('Tem certeza que quer cancelar a assinatura? Você continua com acesso até o fim do período pago.')) {
                showToast('Cancelamento registrado. Acesso mantido até 15/05/2025.');
              }
            ">Cancelar assinatura</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dados & Privacidade -->
    <div class="cfg-section">
      <div class="cfg-sec-hdr"><span class="cfg-sec-icon">🗄</span><span class="cfg-sec-title">Dados & Privacidade</span></div>
      <div class="cfg-row">
        <div class="cfg-row-left">
          <span class="cfg-row-label">Limpar cache local</span>
          <span class="cfg-row-desc">Remove dados temporários do navegador</span>
        </div>
        <button class="btn btn-ghost" style="color:var(--danger)" onclick="
          localStorage.removeItem('lifeos-theme');
          showToast('Cache limpo ✓');
        ">Limpar</button>
      </div>
      <div class="cfg-row">
        <div class="cfg-row-left">
          <span class="cfg-row-label">Exportar todos os dados</span>
          <span class="cfg-row-desc">Baixe um backup completo em JSON</span>
        </div>
        <button class="btn btn-outline" onclick="switchModule('exportar')">Exportar</button>
      </div>
    </div>

  </div>`;
}

// ── FEEDBACK ──────────────────────────────────────────────────

// Global array to store feedback feed
let FEEDBACK_FEED = [];

/**
 * Loads feedback from the API (real data).
 */
async function loadFeedbackFeed() {
  try {
    const feedbacks = await LifeOSAPI.loadFeedbacks('recent');
    FEEDBACK_FEED.splice(0, FEEDBACK_FEED.length, ...(feedbacks || []));
    return FEEDBACK_FEED;
  } catch (e) {
    console.error("[FEEDBACK] Load failed:", e);
    return [];
  }
}

/**
 * Renders a single feedback card.
 */
function renderFeedbackCard(fb) {
  const date = fb.created_at ? new Date(fb.created_at).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }) : '';
  
  const stars = '★'.repeat(fb.rating || 0) + '☆'.repeat(5 - (fb.rating || 0));
  
  return `
    <div style="background:var(--bg-s);border:1px solid var(--border);border-radius:var(--r);padding:.9rem;margin-bottom:.75rem">
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
        <span style="font-weight:700;color:var(--accent)">${fb.author_name || 'Usuário'}</span>
        <span style="color:var(--t3);font-size:.72rem">${date}</span>
        ${fb.mine ? '<span class="badge" style="background:var(--accent);color:#fff;font-size:.6rem">Você</span>' : ''}
      </div>
      <p style="font-size:.85rem;margin-bottom:.5rem">${fb.content || ''}</p>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="color:var(--accent)">${stars}</span>
        <span class="badge" style="background:var(--bg-m)">${fb.category || 'geral'}</span>
      </div>
    </div>
  `;
}

/**
 * Renderiza o formulário de feedback + FEED REAL.
 * FIX:v2.0 - Agora usa API real para enviar e listar feedback.
 * @param {HTMLElement} s - container do module-stage
 */
async function renderFeedback(s) {
  s.innerHTML = `
  <style>
    .fb-loading { text-align:center; padding:2rem; color:var(--t3); }
    .fb-empty { text-align:center; padding:2rem; background:var(--bg-m); border-radius:var(--r); color:var(--t3); }
    .fb-form-row { margin-bottom:.75rem; }
    .fb-form-label { display:block; font-size:.72rem; font-weight:700; color:var(--t3); margin-bottom:.3rem; }
    .fb-textarea { width:100%; min-height:100px; padding:.75rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg-s); color:var(--text); font-family:inherit; font-size:.85rem; resize:vertical; }
    .fb-textarea:focus { outline:none; border-color:var(--accent); }
    .fb-select { width:100%; padding:.6rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg-s); color:var(--text); font-family:inherit; font-size:.82rem; }
    .fb-stars { display:flex; gap:.4rem; }
    .fb-star { flex:1; padding:.6rem; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg-s); cursor:pointer; transition:all .15s; }
    .fb-star:hover, .fb-star.active { background:var(--acc-bg); border-color:var(--accent); }
    .fb-feed-header { display:flex; align-items:center; justify-content:space-between; padding:.75rem 0; border-bottom:1px solid var(--border); margin-bottom:1rem; }
    .fb-feed-title { font-size:.9rem; font-weight:800; }
    .fb-tab { padding:.4rem .75rem; font-size:.72rem; border:1px solid var(--border); border-radius:var(--r-sm); cursor:pointer; background:var(--bg-s); }
    .fb-tab.active { background:var(--accent); color:#fff; border-color:var(--accent); }
  </style>

  <div class="mod mod-narrow">
    <div class="sec-header">
      <div>
        <h2 class="mod-title">Feedback</h2>
        <p class="mod-sub">Ajude-nos a melhorar o LifeOS</p>
      </div>
    </div>

    <!-- Feedback Form (REAL API) -->
    <div class="card" style="margin-bottom:1.5rem">
      <form id="fb-form">
        <div class="fb-form-row">
          <label class="fb-form-label">Sua mensagem</label>
          <textarea id="fb-content" class="fb-textarea" placeholder="O que você achou ou o que podemos melhorar?" required></textarea>
        </div>
        <div class="fb-form-row">
          <label class="fb-form-label">Categoria</label>
          <select id="fb-category" class="fb-select">
            <option value="sugestao">Sugestão de funcionalidade</option>
            <option value="bug">Relato de bug</option>
            <option value="elogio">Elogio</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div class="fb-form-row">
          <label class="fb-form-label">Avaliação</label>
          <div class="fb-stars" id="fb-star-container">
            ${[1,2,3,4,5].map(n => 
              `<button type="button" class="fb-star" data-rating="${n}" onclick="setFeedbackRating(${n})">${n} ★</button>`
            ).join('')}
          </div>
        </div>
        <input type="hidden" id="fb-rating" value="5">
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:1rem">
          Enviar Feedback
        </button>
      </form>
    </div>

    <!-- Feed Header -->
    <div class="fb-feed-header">
      <span class="fb-feed-title">Feed de Feedback</span>
      <button class="fb-tab" onclick="refreshFeedbackFeed()" style="background:none;border:none;color:var(--accent);font-weight:700;font-size:.72rem;cursor:pointer">
        🔄 Atualizar
      </button>
    </div>

    <!-- Feedback Feed (REAL) -->
    <div id="fb-feed-container">
      <div class="fb-loading">Carregando feedback...</div>
    </div>
  </div>`;

  // Attach form handler
  setTimeout(() => {
    const form = document.getElementById('fb-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = document.getElementById('fb-content')?.value?.trim();
        const category = document.getElementById('fb-category')?.value || 'sugestao';
        const rating = parseInt(document.getElementById('fb-rating')?.value || '5', 10);
        
        if (!content || content.length < 3) {
          showToast('Mensagem muito curta');
          return;
        }
        
        try {
          showToast('Enviando...');
          await LifeOSAPI.createFeedback({ content, category, rating });
          showToast('Feedback enviado! Obrigado 💜');
          
          // Clear form
          document.getElementById('fb-content').value = '';
          setFeedbackRating(5);
          
          // Refresh feed
          refreshFeedbackFeed();
        } catch (err) {
          showToast('Erro ao enviar. Tente novamente.');
          console.error("[FEEDBACK] Send error:", err);
        }
      });
    }
    
    // Load initial feed
    refreshFeedbackFeed();
  }, 100);
}

/**
 * Sets the selected rating and updates UI.
 */
window.setFeedbackRating = function(rating) {
  const container = document.getElementById('fb-star-container');
  const input = document.getElementById('fb-rating');
  if (container && input) {
    container.querySelectorAll('.fb-star').forEach((btn, idx) => {
      btn.classList.toggle('active', idx + 1 <= rating);
    });
    input.value = rating;
  }
};

/**
 * Refreshes the feedback feed from API.
 */
async function refreshFeedbackFeed() {
  const container = document.getElementById('fb-feed-container');
  if (!container) return;
  
  container.innerHTML = '<div class="fb-loading">Carregando...</div>';
  
  await loadFeedbackFeed();
  
  if (FEEDBACK_FEED.length === 0) {
    container.innerHTML = '<div class="fb-empty">Nenhum feedback ainda. Seja o primeiro! 🎉</div>';
    return;
  }
  
  container.innerHTML = FEEDBACK_FEED.map(renderFeedbackCard).join('');
}

// ── SUPORTE ───────────────────────────────────────────────────

/**
 * Renderiza o formulário de suporte.
 * @param {HTMLElement} s - container do module-stage
 */
function renderSuporte(s) {
  s.innerHTML = `
  <div class="mod mod-narrow">
    <div class="sec-header">
      <div>
        <h2 class="mod-title">Suporte LifeOS</h2>
        <p class="mod-sub">Estamos aqui para ajudar você</p>
      </div>
    </div>
    <div class="card" style="margin-bottom:1.5rem;border-left:4px solid var(--accent)">
      <p style="font-size:.85rem;color:var(--t2)">
        Envie sua dúvida ou problema. Nossa equipe responderá no seu e-mail
        em até <strong>24 horas úteis</strong>.
      </p>
    </div>
    <div class="card">
      <form onsubmit="event.preventDefault(); showToast('Mensagem enviada! 🆘')">
        <div class="form-group">
          <label class="form-label">Assunto</label>
          <input type="text" class="form-input" placeholder="Ex: Problema com as metas"/>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição detalhada</label>
          <textarea class="form-textarea" placeholder="Descreva o que está acontecendo..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">
          Enviar Mensagem de Suporte
        </button>
      </form>
    </div>
  </div>`;
}
