export type DashboardPayload = {
  user?: Record<string, unknown>;
  metrics?: unknown[];
  tasks?: unknown[];
  plan?: unknown;
};

export async function fetchDashboard(): Promise<DashboardPayload> {
  return {};
}
