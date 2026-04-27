/* LifeOS UI-only shell config: no backend discovery, no Firebase config, no fetch. */
(function(){
  window.CONFIG = { UI_ONLY: true, REQUEST_TIMEOUT: 0 };
  window.LOCALE = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    lang: navigator.language || 'pt-BR',
    currency: 'BRL'
  };
})();
