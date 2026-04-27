import { DashboardPreview } from './pages/DashboardPreview';

export default function App() {
  return (
    <div className="los-shell">
      <div className="los-brand">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
          <rect width="26" height="26" rx="7" fill="#a855f7" />
          <path d="M6 13L11 18L20 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        LifeOS React shell
      </div>
      <p className="los-muted" style={{ marginBottom: '1rem' }}>
        Shell visual limpo: sem token, sem fetch, sem autenticação e sem dados de exemplo.
      </p>
      <DashboardPreview />
    </div>
  );
}
