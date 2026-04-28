/**
 * Cliente mínimo para o mesmo backend Flask.
 * Em dev, o Vite faz proxy de /api → localhost:5000 (vite.config.ts).
 * Em produção, defina VITE_API_URL (ex.: https://api.seudominio.com).
 */
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export type DashboardPayload = {
  user?: Record<string, unknown>;
  metrics?: unknown[];
  tasks?: unknown[];
  plan?: unknown;
};

export async function fetchDashboard(token: string): Promise<DashboardPayload> {
  const url = `${API_BASE}/api/dashboard`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/Sao_Paulo',
      'X-Language': navigator.language || 'pt-BR',
      'X-Currency': 'BRL',
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { data?: DashboardPayload };
  return json.data ?? {};
}
