import { useEffect, useState } from 'react';
import { fetchDashboard } from '../services/api';

type Props = { token: string };

export function DashboardPreview({ token }: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [vision, setVision] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const d = await fetchDashboard(token);
        const u = d.user as Record<string, string | undefined> | undefined;
        if (!cancelled && u) {
          setName(String(u.name ?? ''));
          setProfession(String(u.profession ?? ''));
          setVision(String(u.vision ?? ''));
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="los-card" style={{ marginTop: 16 }}>
        <p className="los-muted">Carregando /api/dashboard…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="los-card" style={{ marginTop: 16 }}>
        <p className="los-err">Erro: {err}</p>
        <p className="los-muted">
          Confirme que o Flask está em <code>http://127.0.0.1:5000</code> e que o token ainda é válido.
        </p>
      </div>
    );
  }

  return (
    <div className="los-card" style={{ marginTop: 16 }}>
      <h1 className="los-title">Prévia dos dados</h1>
      <p className="los-muted">
        <strong>Nome:</strong> {name || '—'}
      </p>
      <p className="los-muted">
        <strong>Profissão:</strong> {profession || '—'}
      </p>
      {vision ? (
        <p className="los-muted">
          <strong>Visão / foco:</strong> {vision}
        </p>
      ) : null}
      <p className="los-muted" style={{ marginTop: 12 }}>
        Se estes campos aparecem aqui e o <code>index.html</code> abre sem ficar em &quot;Iniciando dashboard&quot;, o fluxo
        onboarding → banco → API está correto.
      </p>
    </div>
  );
}
