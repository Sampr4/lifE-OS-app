/**
 * LifeOS UI-only API facade.
 * Every method is a safe no-op so visual components never call a backend.
 */
'use strict';
const LifeOSAPI = new Proxy({}, {
  get() { return async () => ({ data: null, uiOnly: true }); }
});
window.LifeOSAPI = LifeOSAPI;
