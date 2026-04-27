/* ═══════════════════════════════════════════════════
   LifeOS v5 — config.js
═══════════════════════════════════════════════════ */

(function(){
  const stored = (() => {
    try { return localStorage.getItem('lifeos_api_url') || ''; } catch(e) { return ''; }
  })();

  const host = (location && location.hostname) ? location.hostname : '127.0.0.1';
  const candidates = [
    stored,
    `http://${host}:5000`,
    'http://127.0.0.1:5000',
    'http://localhost:5000'
  ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);

  window.__LIFEOS_API_CANDIDATES__ = candidates.slice();

  window.CONFIG = {
    API_URL: stored || `http://${host}:5000`,
    REQUEST_TIMEOUT: 15000,
    FIREBASE: {
      apiKey:            'AIzaSyDVLxErQoU3lxN4knk7CjFIGDoD50v4w64',
      authDomain:        'lifeos-cc13f.firebaseapp.com',
      projectId:         'lifeos-cc13f',
      storageBucket:     'lifeos-cc13f.firebasestorage.app',
      messagingSenderId: '788875605190',
      appId:             '1:788875605190:web:3da53a87be9b8cd706d3c7',
    },
  };

  window.LOCALE = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    lang:     navigator.language || 'pt-BR',
    currency: 'BRL',
  };

  window.resolveLifeOSApi = async function resolveLifeOSApi(forceRetry = false) {
    if (!forceRetry && window.__LIFEOS_RESOLVED_API__) {
      CONFIG.API_URL = window.__LIFEOS_RESOLVED_API__;
      return window.__LIFEOS_RESOLVED_API__;
    }

    const list = Array.isArray(window.__LIFEOS_API_CANDIDATES__)
      ? window.__LIFEOS_API_CANDIDATES__
      : candidates;

    for (const base of list) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch(`${base}/health`, { method: 'GET', cache: 'no-store', signal: ctrl.signal });
        clearTimeout(tid);
        if (res.ok) {
          window.__LIFEOS_RESOLVED_API__ = base;
          CONFIG.API_URL = base;
          try { localStorage.setItem('lifeos_api_url', base); } catch(e) {}
          return base;
        }
      } catch(e) {}
    }

    const fallback = list[0] || `http://${host}:5000`;
    CONFIG.API_URL = fallback;
    return fallback;
  };
})();
