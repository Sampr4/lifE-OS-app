# LifeOS V8.7 — Correção final aplicada

## Correções críticas no backend

1. `backend/routes/onboarding.py`
   - Corrigido `NameError: fetch_list is not defined`.
   - O finalize agora consegue verificar dados existentes e chamar a geração inicial sem quebrar por import ausente.

2. `backend/services/context.py`
   - Corrigidas queries Supabase que usavam `.eq()` direto no `table()` sem `.select()`.
   - Corrigido uso de `checkins` para `checkin_sessions`, alinhando com o restante do backend.
   - Melhorada leitura de `parsed_data` das respostas do onboarding.

3. `backend/services/ai.py`
   - Corrigido erro grave com `r.usage`, onde a variável `r` não existia em `generate_life_plan`.
   - Corrigido cálculo de sucesso no log de IA.

4. `backend/services/data_generation.py`
   - Adicionado `_ensure_plan_minimums()` para impedir persistência de plano fraco/vazio.
   - Adicionado `_safe_time()` para evitar inserir textos como horário.
   - A geração inicial agora cria também plano estruturado em:
     - `annual_plans`
     - `weekly_plans`
     - `plan_tasks`
     - `plan_habits`
   - Mantido fallback para tabelas antigas (`goals`, `tasks`, `habits`, `routine_templates`).

5. `backend/main.py`
   - Registradas rotas que existiam, mas não entravam no app:
     - `feedback_routes`
     - `feedback_support_routes`
     - `adaptive_routes`

6. `backend/routes/checkin.py`
   - Adicionados endpoints:
     - `GET /api/reminder/today`
     - `PATCH /api/reminder/today`
   - O frontend agora consegue salvar lembretes recorrentes do dashboard.

7. `backend/services/user.py`
   - Corrigida leitura de lembrete diário para funcionar com schema novo e antigo.

## Correções no frontend

1. `frontend/index.html`
   - Formulário de Feedback agora chama backend real.
   - Formulário de Suporte agora chama backend real.
   - Adicionados métodos:
     - `LifeOSAPI.saveFeedback()`
     - `LifeOSAPI.saveSupport()`
   - Removido texto indicando “dados fictícios” no dashboard analítico.

## Correções no banco

A migration `migration_fix_schema.sql` foi ampliada com:

- `daily_reminders.reminder_date`
- constraint única de lembrete por usuário/dia
- `feedback_entries`
- `support_tickets`
- `annual_plans`
- `weekly_plans`
- `plan_tasks`
- `plan_habits`
- garantia de `finance_entries`

## Segurança

- O arquivo `backend/.env` foi removido do ZIP.
- Foi criado `backend/.env.example`.
- Use suas variáveis reais localmente, mas não compartilhe `.env` em ZIP público.

## Como aplicar

1. Copie os arquivos deste ZIP por cima do projeto atual.
2. No Supabase, rode:
   - `db_migrations/lifeos_core_rebuild.sql`
   - `migration_fix_schema.sql`
3. Crie seu `backend/.env` baseado em `backend/.env.example`.
4. Rode o backend.
5. Faça um novo onboarding com usuário novo ou use `/api/ai/plan` para gerar novamente.


## Hotfix SQL — 2026-04-26

Corrigido erro do Supabase:

```txt
ERROR: 42703: column "annual_plan_id" does not exist
```

Causa: se a tabela `weekly_plans` já existia no banco antigo, o comando `CREATE TABLE IF NOT EXISTS weekly_plans (...)` era ignorado e não adicionava a coluna nova `annual_plan_id`. Depois, o índice `idx_weekly_plans_annual_week` tentava usar essa coluna inexistente.

Correção aplicada em `migration_fix_schema.sql`:

- `annual_plans` agora faz `CREATE TABLE IF NOT EXISTS` e depois `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- `weekly_plans` agora adiciona `annual_plan_id`, `week_start`, `week_number`, `focus_theme`, `weekly_goal` e `created_at` mesmo quando a tabela já existia.
- `plan_tasks` agora adiciona `weekly_plan_id`, `title`, `description`, `category`, `priority`, `time_of_day` e `created_at` mesmo quando a tabela já existia.
- `plan_habits` agora adiciona `weekly_plan_id`, `name`, `icon`, `goal_value`, `goal_unit`, `frequency_days`, `category` e `created_at` mesmo quando a tabela já existia.
