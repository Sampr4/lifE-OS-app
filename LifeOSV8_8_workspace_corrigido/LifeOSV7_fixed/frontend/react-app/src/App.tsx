import { useMemo, useState } from 'react';
import { DashboardPreview } from './pages/DashboardPreview';

/**
 * Shell React para desenvolvimento e testes de API.
 * A experiência completa (login, onboarding, todos os módulos) continua em ../index.html.
 * Cole o token Firebase (localStorage lifeos_token) ou use o fluxo completo no HTML estático.
 */
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('lifeos_token') ?? '');
  const canQuery = useMemo(() => token.trim().length > 20, [token]);

  return (
    <div className="los-shell">
      <div className="los-brand">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
          <rect width="26" height="26" rx="7" fill="#a855f7" />
          <path
            d="M6 13L11 18L20 8"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        LifeOS React shell
      </div>
      <p className="los-muted" style={{ marginBottom: '1rem' }}>
        Para testar a dashboard sem travar: use o app principal em <code>index.html</code> após o login.
        Aqui você pode colar o token (campo abaixo) para validar <code>GET /api/dashboard</code> isoladamente.
      </p>
      <label className="los-muted" htmlFor="tok">
        Token (Bearer)
      </label>
      <textarea
        id="tok"
        value={token}
        onChange={(e) => {
          setToken(e.target.value);
          localStorage.setItem('lifeos_token', e.target.value);
        }}
        rows={3}
        style={{
          width: '100%',
          marginTop: 6,
          fontFamily: 'monospace',
          fontSize: 12,
          borderRadius: 8,
          border: '1px solid var(--border)',
          padding: 8,
        }}
      />
      {canQuery ? (
        <DashboardPreview token={token.trim()} />
      ) : (
        <p className="los-err" style={{ marginTop: 12 }}>
          Token vazio ou curto — faça login no app HTML e copie <code>lifeos_token</code> do DevTools → Application.
        </p>
      )}
    </div>
  );
}
