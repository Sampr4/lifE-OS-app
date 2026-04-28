/**
 * LifeOS v5 — api.js
 * All HTTP communication with the Flask backend lives here.
 * Modules never call fetch() directly.
 *
 * FIX: Added _checkBackendHealth() — on any network failure,
 *      shows a clear "server offline" message instead of silent failure.
 */
'use strict';

const LifeOSAPI = {

  // ─── Internal fetch ──────────────────────────────────────
  async _fetch(endpoint, options = {}) {
    const token = window.__LIFEOS_TOKEN__ || localStorage.getItem('lifeos_token') || '';
    const url   = `${((typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'https://life-os-app-wg4o.onrender.com')}/api${endpoint}`;
    const ctrl  = new AbortController();
    const tid   = setTimeout(() => ctrl.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          'Content-Type':  'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Timezone':    LOCALE?.timezone || CONFIG.DEFAULT_TZ,
          'X-Language':    LOCALE?.lang     || 'pt-BR',
          'X-Currency':    LOCALE?.currency || 'BRL',
          ...options.headers,
        },
        ...options,
      });
      clearTimeout(tid);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg  = body.message || `HTTP ${res.status}`;
        // Session expired or user deleted — force re-login
        if (res.status === 401 && body.error === 'USER_NOT_FOUND') {
          window.location.href = 'login.html';
          return;
        }
        // DB temporarily unavailable — throw so caller can retry/show error
        if (res.status === 503 && body.error === 'DB_UNAVAILABLE') {
          throw new Error('DB_UNAVAILABLE');
        }
        throw new Error(msg);
      }
      return res.json();
    } catch (e) {
      clearTimeout(tid);
      if (e.name === 'AbortError') throw new Error('TIMEOUT');
      throw e;
    }
  },

  // ─── Backend health check ─────────────────────────────────
  async checkHealth() {
    try {
      const res = await fetch(`${((typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'https://life-os-app-wg4o.onrender.com')}/health`, { method: 'GET', cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ─── loadAll: called by app.js init ──────────────────────
  async loadAll() {
    return this.loadDashboard();
  },

  // ─── Load all dashboard data in parallel ─────────────────
  async loadDashboard() {
    const r = await this._fetch('/dashboard');
    if (!r?.data) return;
    const d = r.data;

    if (d.user) {
      const u = d.user;
      Object.assign(USER, {
        id: u.id ?? USER.id,
        name: u.name ?? USER.name,
        initials: u.initials ?? USER.initials,
        email: u.email ?? USER.email,
        plan: u.plan ?? USER.plan,
        avatar_url: u.avatar_url ?? USER.avatar_url,
        progress: u.progress ?? USER.progress,
        weekStatus: u.week_status || u.weekStatus || USER.weekStatus,
        focusScore: u.focus_score ?? u.focusScore ?? USER.focusScore,
        energyLevel: u.energy_level ?? u.energyLevel ?? USER.energyLevel,
        level: u.level ?? USER.level,
        totalXP: u.total_xp ?? u.totalXP ?? USER.totalXP,
        streak: u.current_streak ?? u.streak ?? USER.streak,
        memberSince: u.member_since || u.memberSince || USER.memberSince,
        profession: u.profession || USER.profession,
        profession_type: u.profession_type || USER.profession_type,
        onboarding_done: u.onboarding_done ?? USER.onboarding_done,
        bio: u.bio ?? USER.bio,
        vision: u.vision ?? USER.vision,
        theme: u.theme ?? USER.theme,
        aiPersonality: u.ai_personality || u.aiPersonality || USER.aiPersonality,
        timezone: u.timezone ?? USER.timezone,
        lang: u.lang ?? USER.lang,
        currency: u.currency ?? USER.currency,
      });
    }
    if (d.tasks)         TASKS.splice(0, TASKS.length, ...d.tasks);
    if (d.habits)        HABITS.splice(0, HABITS.length, ...d.habits);
    if (d.goals)         GOALS.splice(0, GOALS.length, ...d.goals);
    if (d.routine)       ROUTINE.splice(0, ROUTINE.length, ...d.routine);
    if (d.finances)      FINANCES.splice(0, FINANCES.length, ...d.finances);
    if (d.calendar)      AGENDA_EVENTS.splice(0, AGENDA_EVENTS.length, ...d.calendar);
    if (d.notifications) NOTIFICATIONS.splice(0, NOTIFICATIONS.length, ...d.notifications);
    if (d.metrics)       METRICS.splice(0, METRICS.length, ...d.metrics);
    if (d.checkin)       Object.assign(CHECKIN_TODAY, d.checkin);
    if (d.reminder)      Object.assign(DAILY_REMINDER, d.reminder);
    if (d.plan != null)  window.__PLAN__ = d.plan;
    if (d.weekly)        WEEKLY.splice(0, WEEKLY.length, ...d.weekly);

    return d;
  },

  // ─── Individual loaders (used by modules for refresh) ─────
  async loadUser() {
    const r = await this._fetch('/user');
    if (r?.data) Object.assign(USER, r.data);
    return r;
  },

  async loadTasks() {
    const r = await this._fetch('/tasks');
    if (r?.data) TASKS.splice(0, TASKS.length, ...r.data);
    return r;
  },

  async loadHabits() {
    const r = await this._fetch('/habits');
    if (r?.data) HABITS.splice(0, HABITS.length, ...r.data);
    return r;
  },

  async loadGoals() {
    const r = await this._fetch('/goals');
    if (r?.data) GOALS.splice(0, GOALS.length, ...r.data);
    return r;
  },

  async loadRoutine() {
    const r = await this._fetch('/routine');
    if (r?.data) ROUTINE.splice(0, ROUTINE.length, ...r.data);
    return r;
  },

  // v8.7: Current-week endpoints (structured plan first, flat fallback)
  async loadHabitsCurrent() {
    const r = await this._fetch('/habits/current');
    if (r?.data) HABITS.splice(0, HABITS.length, ...r.data);
    return r;
  },

  async loadRoutineCurrent() {
    const r = await this._fetch('/routine/current');
    if (r?.data) ROUTINE.splice(0, ROUTINE.length, ...r.data);
    return r;
  },

  async loadFinances() {
    const r = await this._fetch('/finances');
    if (r?.data) FINANCES.splice(0, FINANCES.length, ...r.data);
    return r;
  },

  async loadCalendar() {
    const r = await this._fetch('/calendar');
    if (r?.data) AGENDA_EVENTS.splice(0, AGENDA_EVENTS.length, ...r.data);
    return r;
  },

  async loadNotifications() {
    const r = await this._fetch('/notifications');
    if (r?.data) NOTIFICATIONS.splice(0, NOTIFICATIONS.length, ...r.data);
    return r;
  },

  async loadCheckin() {
    const r = await this._fetch('/checkin/today');
    if (r?.data) Object.assign(CHECKIN_TODAY, r.data);
    return r;
  },

  async loadReminder() {
    const r = await this._fetch('/reminder');
    if (r?.data) Object.assign(DAILY_REMINDER, r.data);
    return r;
  },

  async loadPlan() {
    const r = await this._fetch('/ai/plan/latest');
    if (r?.data) window.__PLAN__ = r.data;
    return r;
  },

  async loadWeekly() {
    const r = await this._fetch('/weekly');
    if (r?.data) WEEKLY.splice(0, WEEKLY.length, ...r.data);
    return r;
  },

  // ─── Task actions ─────────────────────────────────────────
  async createTask(data)       { return this._fetch('/tasks', { method: 'POST', body: JSON.stringify(data) }); },
  async updateTask(id, data)   { return this._fetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },
  async deleteTask(id)         { return this._fetch(`/tasks/${id}`, { method: 'DELETE' }); },

  // ─── Goal actions ─────────────────────────────────────────
  async createGoal(data)       { return this._fetch('/goals', { method: 'POST', body: JSON.stringify(data) }); },
  async updateGoal(id, data)   { return this._fetch(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },
  async deleteGoal(id)         { return this._fetch(`/goals/${id}`, { method: 'DELETE' }); },

  // ─── Habit actions ────────────────────────────────────────
  async createHabit(data)      { return this._fetch('/habits', { method: 'POST', body: JSON.stringify(data) }); },
  async logHabit(id, data)     { return this._fetch(`/habits/${id}/log`, { method: 'POST', body: JSON.stringify(data) }); },
  async deleteHabit(id)        { return this._fetch(`/habits/${id}`, { method: 'DELETE' }); },

  // ─── Routine actions ──────────────────────────────────────
  async createRoutineItem(data){ return this._fetch('/routine', { method: 'POST', body: JSON.stringify(data) }); },
  async toggleRoutine(id)      { return this._fetch(`/routine/${id}/toggle`, { method: 'POST' }); },
  async deleteRoutineItem(id)  { return this._fetch(`/routine/${id}`, { method: 'DELETE' }); },

  // ─── Finance actions ──────────────────────────────────────
  async createFinance(data)    { return this._fetch('/finances', { method: 'POST', body: JSON.stringify(data) }); },
  async updateFinance(id, data){ return this._fetch(`/finances/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },

  // ─── Calendar actions ─────────────────────────────────────
  async createEvent(data)      { return this._fetch('/calendar', { method: 'POST', body: JSON.stringify(data) }); },
  async updateEvent(id, data)  { return this._fetch(`/calendar/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },
  async deleteEvent(id)        { return this._fetch(`/calendar/${id}`, { method: 'DELETE' }); },

  // ─── Notes actions ────────────────────────────────────────
  async createNote(data)       { return this._fetch('/notes', { method: 'POST', body: JSON.stringify(data) }); },
  async updateNote(id, data)   { return this._fetch(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },
  async deleteNote(id)         { return this._fetch(`/notes/${id}`, { method: 'DELETE' }); },

  // ─── Checkin actions ──────────────────────────────────────
  async saveCheckin(data)      { return this._fetch('/checkin', { method: 'POST', body: JSON.stringify(data) }); },

  // ─── AI actions ───────────────────────────────────────────
  async getMotivational()      { return this._fetch('/ai/motivational', { method: 'POST' }); },
  async analyzeGoals()         { return this._fetch('/ai/goals/analyze', { method: 'POST' }); },
  async regeneratePlan()       { return this._fetch('/ai/plan', { method: 'POST' }); },

  // ─── User actions ─────────────────────────────────────────
  async updateUser(data)       { return this._fetch('/user', { method: 'PATCH', body: JSON.stringify(data) }); },
  async saveLocale()           { return this._fetch('/user/locale', { method: 'PATCH' }); },

  // ─── Notification actions ─────────────────────────────────
  async markNotificationRead(id) { return this._fetch(`/notifications/${id}/read`, { method: 'POST' }); },

  // ─── Reminder actions ─────────────────────────────────────
  async saveReminder(text, time) { return this._fetch('/reminder', { method: 'POST', body: JSON.stringify({ text, time }) }); },

  // ─── Checkin answer actions ───────────────────────────────
  async saveCheckinAnswer(data) { return this._fetch('/checkin/answer', { method: 'POST', body: JSON.stringify(data) }); },

  // ─── Feedback actions (REAL) ───────────────────────────────
  async loadFeedbacks(order = 'recent') {
    const r = await this._fetch(`/feedbacks?order=${order}`);
    if (r?.data) return r.data;
    return r;
  },
  async createFeedback(data) {
    return this._fetch('/feedbacks', { method: 'POST', body: JSON.stringify(data) });
  },

  // ─── Webhook actions ──────────────────────────────────────
  async getWebhooks()          { return this._fetch('/webhooks'); },
  async createWebhook(data)    { return this._fetch('/webhooks', { method: 'POST', body: JSON.stringify(data) }); },
  async updateWebhook(id, data){ return this._fetch(`/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },
  async deleteWebhook(id)      { return this._fetch(`/webhooks/${id}`, { method: 'DELETE' }); },
};

window.LifeOSAPI = LifeOSAPI;
