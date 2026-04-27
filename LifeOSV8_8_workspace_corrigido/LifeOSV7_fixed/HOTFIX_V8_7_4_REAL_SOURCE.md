# LifeOS V8.7.4 — correção real de origem dos dados

Esta versão corrige o motivo de a tela parecer "igual": ainda existiam fontes antigas e registros mockados/legados alimentando a UI.

Correções:

- `frontend/index.html`
  - Removeu a lista fixa da rotina: Acordar cedo, Beber água, Treinar, Estudar, Trabalhar no projeto, Ler.
  - A rotina agora só renderiza dados vindos de `ROUTINE`, que vem do backend.
  - A aba de hábitos filtra nomes demonstrativos antigos caso eles ainda estejam no banco.

- `backend/services/user.py`
  - `get_habits()` agora prioriza `plan_habits` do plano estruturado.
  - `get_routine()` agora prioriza `plan_tasks` do plano estruturado.
  - Se precisar cair no legado, filtra os hábitos demonstrativos antigos.

- `backend/services/data_generation.py`
  - Corrigiu persistência de `weekly_plans` em bancos antigos que ainda tinham `monthly_plan_id`.
  - `plan_tasks` e `plan_habits` agora tentam salvar `user_id` quando a coluna existir.

- `migration_fix_schema.sql`
  - Corrige `weekly_plans.monthly_plan_id NOT NULL` em bases antigas.
  - Garante colunas compatíveis em `weekly_plans`, `plan_tasks` e `plan_habits`.
  - Desativa registros mockados antigos em `habits` e `routine_templates`.

Depois de substituir os arquivos, rode `migration_fix_schema.sql`, reinicie o backend e use Ctrl+F5.
