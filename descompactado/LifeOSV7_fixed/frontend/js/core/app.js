/**
 * LIFEOS — APP.JS (FIXED)
 * MUDANÇAS: removidos TODOS os dados fictícios.
 * Backend offline = tela de erro. Nunca dados falsos.
 */
'use strict';

function initTheme() {
  const toggle = $('theme-toggle');
  if (!toggle) return;
  const saved = localStorage.getItem('lifeos-theme') || 'light';
  if (saved === 'dark') { document.body.classList.add('dark-theme'); updateThemeUI(true); }
  toggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('lifeos-theme', isDark ? 'dark' : 'light');
    updateThemeUI(isDark);
    showToast(`Modo ${isDark ? 'Escuro 🌙' : 'Claro ☀️'} ativado`);
    renderModule(activeModule);
  });
}

function updateThemeUI(isDark) {
  const toggle = $('theme-toggle');
  if (!toggle) return;
  if (isDark) {
    toggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    toggle.title = 'Ativar Modo Claro';
  } else {
    toggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    toggle.title = 'Ativar Modo Escuro';
  }
}

function renderHeader() {
  const avatar = $('avatar-btn');
  if (avatar) avatar.textContent = USER.initials || '?';
  if ($('dd-name'))  $('dd-name').textContent  = USER.name  || '';
  if ($('dd-email')) $('dd-email').textContent = USER.email || '';
  updateNotifBadge();
}

function updateNotifBadge() {
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;
  const dot = $('notif-dot');
  if (dot) dot.style.display = unreadCount > 0 ? 'block' : 'none';
}

function renderNotifList() {
  const list = $('notif-list');
  if (!list) return;
  if (!NOTIFICATIONS.length) {
    list.innerHTML = '<div class="notif-empty">Nenhuma notificação por aqui.</div>';
    return;
  }
  list.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markNotifRead(${n.id})">
      <span class="notif-t">${n.title}</span>
      <span class="notif-m">${n.message}</span>
      <span class="notif-time">${n.time || ''}</span>
    </div>`).join('');
}

function markNotifRead(id) {
  const n = NOTIFICATIONS.find(x => x.id === id);
  if (n) n.unread = false;
  LifeOSAPI.markNotificationRead(id).catch(() => {});
  updateNotifBadge();
  renderNotifList();
}

function renderCarousel() {
  const track = $('carousel-track');
  if (!track) return;
  track.innerHTML = '';
  MODULES.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.className      = 'carousel-item';
    btn.id             = 'ci-' + m.id;
    btn.dataset.module = m.id;
    btn.setAttribute('aria-label', m.label);
    btn.setAttribute('role', 'tab');
    btn.style.animationDelay = (idx * 20) + 'ms';
    btn.innerHTML = '<span class="ci-icon">' + m.icon + '</span><span class="ci-label">' + m.label + '</span>';
    if (m.id === activeModule) btn.classList.add('active');
    btn.addEventListener('click', () => switchModule(m.id));
    track.appendChild(btn);
  });
}

function switchModule(id) {
  activeModule = id;
  if (id !== 'plano') {
    if (typeof planoCloseModal === 'function') planoCloseModal();
    const pm = document.getElementById('plano-modal-el');
    if (pm) pm.remove();
  }
  document.querySelectorAll('.carousel-item').forEach(b =>
    b.classList.toggle('active', b.dataset.module === id)
  );
  const btn = $('ci-' + id);
  if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  const allModules = [
    ...MODULES,
    { id:'perfil',        label:'Perfil',       icon:'👤', color:'#a855f7' },
    { id:'configuracoes', label:'Configurações', icon:'⚙',  color:'#8b5cf6' },
  ];
  const mod = allModules.find(m => m.id === id) || { label: id, icon: '⊞', color: '#a855f7' };
  if ($('mod-title-text')) $('mod-title-text').textContent = mod.label;
  if ($('mod-title-icon')) { $('mod-title-icon').textContent = mod.icon; $('mod-title-icon').style.color = mod.color; }
  ['avatar-dropdown','notif-dropdown','hamburger-dropdown'].forEach(dId => { const d=$(dId); if(d) d.classList.remove('open'); });
  renderModule(id);
}

function renderModule(id) {
  const stage = $('module-stage');
  if (!stage) return;
  stage.style.opacity = '0';
  stage.style.transform = 'translateY(16px)';
  stage.style.filter = 'blur(4px)';
  setTimeout(() => {
    stage.innerHTML = '';
    const renderers = {
      dashboard:        typeof renderDashboard            === 'function' ? renderDashboard            : null,
      rotina:           typeof renderNovaRotina           === 'function' ? renderNovaRotina           : null,
      habitos:          typeof renderHabitos              === 'function' ? renderHabitos              : null,
      plano:            typeof renderPlano                === 'function' ? renderPlano                : null,
      metas:            typeof renderMetasInteligentes    === 'function' ? renderMetasInteligentes    : null,
      exportar:         typeof renderExportar             === 'function' ? renderExportar             : null,
      financas:         typeof renderFinancasInteligentes === 'function' ? renderFinancasInteligentes : null,
      'energia-mental': typeof renderEnergiaMental        === 'function' ? renderEnergiaMental        : null,
      notas:            typeof renderNotas                === 'function' ? renderNotas                : null,
      feedback:         typeof renderFeedback             === 'function' ? renderFeedback             : null,
      suporte:          typeof renderSuporte              === 'function' ? renderSuporte              : null,
      perfil:           typeof renderPerfil               === 'function' ? renderPerfil               : null,
      configuracoes:    typeof renderConfiguracoes        === 'function' ? renderConfiguracoes        : null,
      checkin:          typeof renderCheckin              === 'function' ? renderCheckin              : null,
      'lifeos-dash':    typeof renderLifeosDash           === 'function' ? renderLifeosDash           : null,
      agenda:           typeof renderAgenda               === 'function' ? renderAgenda               : null,
    };
    if (renderers[id]) {
      renderers[id](stage);
    } else {
      stage.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--t3)"><p style="font-size:2rem;margin-bottom:1rem">🔧</p><p style="font-weight:700">Módulo "' + id + '" não encontrado.</p></div>';
    }
    requestAnimationFrame(() => { stage.style.opacity='1'; stage.style.transform='translateY(0)'; stage.style.filter='blur(0)'; });
    requestAnimationFrame(() => setTimeout(animateBars, 80));
  }, 150);
}

function checkCheckinAlert() {
  const alertBox = $('checkin-alert');
  if (!alertBox) return;
  const now = new Date();
  alertBox.style.display = (now.getHours() >= 19 && !CHECKIN_TODAY.done) ? 'block' : 'none';
}

function _setLoaderStatus(msg) {
  const el = $('loader-status');
  if (el) el.textContent = msg;
}

function _hideLoader() {
  const l = $('app-loader');
  if (!l) return;
  l.style.opacity = '0';
  setTimeout(() => { l.style.display = 'none'; }, 420);
}

// ── INIT ───────────────────────────────────────────────────────
async function init() {
  const NETWORK_ERRORS = ['DB_UNAVAILABLE', 'TIMEOUT', 'Failed to fetch', 'NetworkError', 'Load failed'];
  const isNetworkError = (msg) => NETWORK_ERRORS.some(k => msg.includes(k));

  for (let attempt = 1; attempt <= 4; attempt++) {
    _setLoaderStatus(attempt === 1 ? 'Carregando seus dados…' : `Conectando… (${attempt}/4)`);
    try {
      await LifeOSAPI.loadUser();
      await LifeOSAPI.loadAll();
      break; // ✅ success
    } catch (e) {
      console.warn('[LifeOS] init attempt', attempt, 'failed:', e.message);
      if (isNetworkError(e.message) && attempt < 4) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      _showInitError(e.message);
      return;
    }
  }

  _setLoaderStatus('Pronto!');
  _hideLoader();
  initTheme();
  initCursorGlow();
  renderHeader();
  renderCarousel();
  _registerUIEvents();
  switchModule('dashboard');
  // Save locale after dashboard loads — non-critical, fire-and-forget
  setTimeout(() => LifeOSAPI.saveLocale().catch(() => {}), 2000);
  checkCheckinAlert();
  setInterval(checkCheckinAlert, 10_000);
}

function _showInitError(msg) {
  const loader = $('app-loader');
  if (!loader) return;
  loader.style.opacity = '1';
  loader.style.display = 'flex';
  loader.innerHTML =
    '<div style="text-align:center;max-width:400px;padding:2rem">' +
      '<div style="font-size:3rem;margin-bottom:1.5rem">⚠️</div>' +
      '<h2 style="font-size:1.3rem;font-weight:800;letter-spacing:-.03em;margin-bottom:.75rem;font-family:\'DM Sans\',sans-serif">Erro ao carregar dados</h2>' +
      '<p style="font-size:.82rem;color:#666;line-height:1.6;margin-bottom:1.5rem;font-family:\'DM Sans\',sans-serif">' +
        'Não foi possível carregar seus dados.<br>Verifique se o Flask está rodando e tente novamente.' +
      '</p>' +
      '<button onclick="window.location.reload()" style="width:100%;height:46px;border:none;border-radius:10px;background:#000;color:#fff;font-family:\'DM Sans\',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;margin-bottom:.75rem">🔄 Tentar novamente</button>' +
      '<button onclick="doLogout()" style="width:100%;height:40px;border:1.5px solid #e8e8e8;border-radius:10px;background:#fff;font-family:\'DM Sans\',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;color:#555">Sair da conta</button>' +
    '</div>';
}

function _registerUIEvents() {
  const avatarBtn = $('avatar-btn');
  if (avatarBtn) {
    avatarBtn.addEventListener('click', e => {
      e.stopPropagation();
      $('notif-dropdown')?.classList.remove('open');
      $('hamburger-dropdown')?.classList.remove('open');
      const d = $('avatar-dropdown');
      if (d) { d.classList.toggle('open'); avatarBtn.setAttribute('aria-expanded', d.classList.contains('open')); }
    });
  }
  const notifBtn = $('notif-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', e => {
      e.stopPropagation();
      $('avatar-dropdown')?.classList.remove('open');
      $('hamburger-dropdown')?.classList.remove('open');
      const d = $('notif-dropdown');
      if (d) { d.classList.toggle('open'); if (d.classList.contains('open')) renderNotifList(); }
    });
  }
  const hamburgerBtn = $('hamburger-btn');
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', e => {
      e.stopPropagation();
      $('avatar-dropdown')?.classList.remove('open');
      $('notif-dropdown')?.classList.remove('open');
      const d = $('hamburger-dropdown');
      if (d) { d.classList.toggle('open'); hamburgerBtn.setAttribute('aria-expanded', d.classList.contains('open')); }
    });
  }
  document.addEventListener('click', () => {
    ['avatar-dropdown','notif-dropdown','hamburger-dropdown'].forEach(id => { $(id)?.classList.remove('open'); });
  });
}