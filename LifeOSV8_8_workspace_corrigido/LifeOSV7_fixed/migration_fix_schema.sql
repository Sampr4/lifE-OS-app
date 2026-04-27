-- ============================================================
-- LifeOS — Migration: Fix Schema Mismatches
-- Aplique este arquivo no Supabase SQL Editor.
-- Todas as colunas/tabelas usam IF NOT EXISTS / DO NOTHING
-- para ser seguro rodar mais de uma vez.
-- ============================================================

-- ------------------------------------------------------------
-- 1. user_profiles — colunas novas
-- ------------------------------------------------------------
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS profession            text,
  ADD COLUMN IF NOT EXISTS profession_raw        text,
  ADD COLUMN IF NOT EXISTS profession_type       text DEFAULT 'gen',
  ADD COLUMN IF NOT EXISTS profession_attributes jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS progress_pct          integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS focus_score           integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS energy_level          integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS current_streak        integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_xp              integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level                 integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS member_since          date DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS timezone              text DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS lang                  text DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS currency              text DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS week_status           text,
  ADD COLUMN IF NOT EXISTS vision                text,
  ADD COLUMN IF NOT EXISTS bio                   text,
  ADD COLUMN IF NOT EXISTS energy_pattern        text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS consolidated_context  jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_generation_at    timestamptz;

-- ------------------------------------------------------------
-- 2. plans — colunas novas
-- (o backend já salva context e generated_at dentro de content JSON,
--  mas algumas versões antigas tentam acessar como colunas diretas)
-- ------------------------------------------------------------
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS context       jsonb,
  ADD COLUMN IF NOT EXISTS generated_at  timestamptz DEFAULT now();

-- ------------------------------------------------------------
-- 3. ai_generations — coluna prompt_used
-- ------------------------------------------------------------
ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS prompt_used   text,
  ADD COLUMN IF NOT EXISTS model_used    text,
  ADD COLUMN IF NOT EXISTS tokens_input  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_output integer DEFAULT 0;

-- ------------------------------------------------------------
-- 4. habit_logs — garantir coluna done (pode se chamar 'completed')
-- Se a tabela tem 'completed' mas não 'done', cria done como alias.
-- Se já tem 'done', não faz nada.
-- ------------------------------------------------------------
ALTER TABLE habit_logs
  ADD COLUMN IF NOT EXISTS done boolean DEFAULT false;

-- Se existia 'completed' mas não 'done', migra os dados
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habit_logs' AND column_name = 'completed'
  ) THEN
    UPDATE habit_logs SET done = completed WHERE done IS DISTINCT FROM completed;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 5. daily_reminders — coluna reminder_time
-- ------------------------------------------------------------
ALTER TABLE daily_reminders
  ADD COLUMN IF NOT EXISTS reminder_time time;

-- ------------------------------------------------------------
-- 6. finance_entries — coluna source
-- ------------------------------------------------------------
ALTER TABLE finance_entries
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- ------------------------------------------------------------
-- 7. weekly_metrics — constraint por day_of_week
-- O banco antigo só tem (user_id, week_start).
-- Precisamos suportar (user_id, week_start, day_of_week).
-- Adiciona coluna day_of_week se não existir, depois recria constraint.
-- ------------------------------------------------------------
ALTER TABLE weekly_metrics
  ADD COLUMN IF NOT EXISTS day_of_week integer DEFAULT 0;

-- Remove constraint antiga se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'weekly_metrics_user_id_week_start_key'
  ) THEN
    ALTER TABLE weekly_metrics DROP CONSTRAINT weekly_metrics_user_id_week_start_key;
  END IF;
END $$;

-- Cria constraint nova (user_id + week_start + day_of_week)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'weekly_metrics_user_id_week_start_day_key'
  ) THEN
    ALTER TABLE weekly_metrics
      ADD CONSTRAINT weekly_metrics_user_id_week_start_day_key
      UNIQUE (user_id, week_start, day_of_week);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 8. user_signals — criar tabela se não existir
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_signals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_type text        NOT NULL,
  signal_data jsonb       DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_signals_user_id ON user_signals (user_id);

-- ------------------------------------------------------------
-- 9. ai_requests / ai_outputs — criar tabelas se não existirem
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_requests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES users(id) ON DELETE CASCADE,
  request_type    text        NOT NULL,
  request_payload jsonb       DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON ai_requests (user_id);

CREATE TABLE IF NOT EXISTS ai_outputs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid        REFERENCES ai_requests(id) ON DELETE CASCADE,
  user_id         uuid        REFERENCES users(id) ON DELETE CASCADE,
  output_type     text        NOT NULL,
  output_data     jsonb       DEFAULT '{}',
  tokens_used     integer     DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_user_id ON ai_outputs (user_id);

-- ------------------------------------------------------------
-- 10. generation_runs / daily_generation_runs — criar tabelas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generation_runs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_type     text        NOT NULL DEFAULT 'initial',
  status       text        NOT NULL DEFAULT 'success',
  run_data     jsonb       DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_generation_runs_user_id ON generation_runs (user_id);

CREATE TABLE IF NOT EXISTS daily_generation_runs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_date     date        NOT NULL DEFAULT current_date,
  status       text        NOT NULL DEFAULT 'success',
  run_data     jsonb       DEFAULT '{}',
  created_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, run_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_gen_runs_user_id ON daily_generation_runs (user_id);

-- ------------------------------------------------------------
-- 11. history_events — garantir que existe (usada pelo scheduler)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS history_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  text        NOT NULL,
  event_data  jsonb       DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_history_events_user_id_type ON history_events (user_id, event_type);

-- ------------------------------------------------------------
-- 11b. user_events — tabela usada pelos logs internos de IA/eventos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES users(id) ON DELETE CASCADE,
  event_type  text        NOT NULL,
  event_data  jsonb       DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_events_user_type_created
  ON user_events(user_id, event_type, created_at DESC);


-- ============================================================
-- Fim da migration
-- ============================================================


-- ------------------------------------------------------------
-- 12. daily_reminders — data, texto e chave única por dia
-- ------------------------------------------------------------
ALTER TABLE daily_reminders
  ADD COLUMN IF NOT EXISTS reminder_date date DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS text text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'daily_reminders_user_date_key'
  ) THEN
    ALTER TABLE daily_reminders
      ADD CONSTRAINT daily_reminders_user_date_key UNIQUE (user_id, reminder_date);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 13. feedback/support — tabelas usadas pelos formulários do dashboard
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     text NOT NULL,
  category    text DEFAULT 'Outro',
  rating      integer,
  source      text DEFAULT 'dashboard',
  status      text DEFAULT 'new',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_user_created ON feedback_entries(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text DEFAULT 'open',
  source      text DEFAULT 'dashboard',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created ON support_tickets(user_id, created_at DESC);

-- ------------------------------------------------------------
-- 14. Plano estruturado — tabelas esperadas por /api/routine/current e /api/habits/current
-- Correção: algumas bases já tinham weekly_plans/plan_tasks/plan_habits
-- sem as colunas novas. CREATE TABLE IF NOT EXISTS não adiciona colunas
-- em tabelas existentes, então fazemos CREATE + ALTER COLUMN IF NOT EXISTS.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS annual_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES users(id) ON DELETE CASCADE,
  title            text DEFAULT 'Plano anual LifeOS',
  plan_start_date  date DEFAULT current_date,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE annual_plans
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title text DEFAULT 'Plano anual LifeOS',
  ADD COLUMN IF NOT EXISTS main_goal text DEFAULT 'Organizar rotina LifeOS',
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS plan_start_date date DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE annual_plans
SET main_goal = COALESCE(NULLIF(main_goal, ''), 'Organizar rotina LifeOS')
WHERE main_goal IS NULL OR main_goal = '';

DO $$
BEGIN
  ALTER TABLE annual_plans ALTER COLUMN main_goal SET DEFAULT 'Organizar rotina LifeOS';
  ALTER TABLE annual_plans ALTER COLUMN main_goal DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_annual_plans_user_active
  ON annual_plans(user_id, is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annual_plan_id  uuid REFERENCES annual_plans(id) ON DELETE CASCADE,
  week_start      date DEFAULT current_date,
  week_number     integer DEFAULT 1,
  focus_theme     text,
  weekly_goal     text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE weekly_plans
  ADD COLUMN IF NOT EXISTS annual_plan_id uuid REFERENCES annual_plans(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS week_start date DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS week_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS focus_theme text,
  ADD COLUMN IF NOT EXISTS weekly_goal text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Compatibilidade com bases antigas: algumas versões tinham monthly_plan_id/user_id NOT NULL.
ALTER TABLE weekly_plans
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weekly_plans' AND column_name='monthly_plan_id') THEN
    ALTER TABLE weekly_plans ALTER COLUMN monthly_plan_id DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weekly_plans' AND column_name='user_id') THEN
    ALTER TABLE weekly_plans ALTER COLUMN user_id DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weekly_plans' AND column_name='title') THEN
    ALTER TABLE weekly_plans ALTER COLUMN title SET DEFAULT '';
    ALTER TABLE weekly_plans ALTER COLUMN title DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_weekly_plans_annual_week
  ON weekly_plans(annual_plan_id, week_start DESC);

CREATE TABLE IF NOT EXISTS plan_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_plan_id  uuid REFERENCES weekly_plans(id) ON DELETE CASCADE,
  title           text,
  description     text,
  category        text DEFAULT 'trabalho',
  priority        text DEFAULT 'medium',
  time_of_day     time,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE plan_tasks
  ADD COLUMN IF NOT EXISTS weekly_plan_id uuid REFERENCES weekly_plans(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'trabalho',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS time_of_day time,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE plan_tasks
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS done boolean DEFAULT false;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plan_tasks' AND column_name='user_id') THEN
    ALTER TABLE plan_tasks ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plan_tasks_week
  ON plan_tasks(weekly_plan_id, time_of_day);

CREATE TABLE IF NOT EXISTS plan_habits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_plan_id  uuid REFERENCES weekly_plans(id) ON DELETE CASCADE,
  name            text,
  icon            text DEFAULT '⭐',
  goal_value      numeric DEFAULT 1,
  goal_unit       text DEFAULT 'vez',
  frequency_days  text DEFAULT 'all',
  category        text DEFAULT 'geral',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE plan_habits
  ADD COLUMN IF NOT EXISTS weekly_plan_id uuid REFERENCES weekly_plans(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS icon text DEFAULT '⭐',
  ADD COLUMN IF NOT EXISTS goal_value numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS goal_unit text DEFAULT 'vez',
  ADD COLUMN IF NOT EXISTS frequency_days text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE plan_habits
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plan_habits' AND column_name='user_id') THEN
    ALTER TABLE plan_habits ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plan_habits_week
  ON plan_habits(weekly_plan_id, created_at);

-- ------------------------------------------------------------
-- 15. finance_entries — garantir tabela/colunas esperadas pelo backend ativo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_name    text NOT NULL,
  icon             text DEFAULT '💰',
  budget           numeric DEFAULT 0,
  spent            numeric DEFAULT 0,
  pct_used         numeric DEFAULT 0,
  reference_month  date DEFAULT date_trunc('month', current_date)::date,
  source           text DEFAULT 'manual',
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_finance_entries_user_month ON finance_entries(user_id, reference_month);

-- ------------------------------------------------------------
-- 16. Limpeza de dados demonstrativos antigos
-- Estes itens foram usados como mock/fallback em versões anteriores e não
-- devem aparecer como personalização real do LifeOS.
-- ------------------------------------------------------------
UPDATE habits
SET is_active = false
WHERE lower(name) IN (
  'beber 2l de água', 'beber 2l de agua', 'beber água', 'beber agua',
  'estudar 1 hora', 'treinar', 'acordar antes das 7h', 'trabalhar no projeto',
  'ler 10 minutos', 'exercício físico', 'exercicio fisico', 'rotina matinal'
)
OR lower(name) LIKE '%2l de água%'
OR lower(name) LIKE '%2l de agua%'
OR lower(name) LIKE '%acordar antes das 7%'
OR lower(name) LIKE '%ler 10 minutos%';

UPDATE routine_templates
SET is_active = false
WHERE lower(activity) IN (
  'acordar cedo', 'beber água', 'beber agua', 'treinar', 'estudar',
  'trabalhar no projeto', 'ler'
)
OR lower(activity) LIKE '%2 litros%'
OR lower(activity) LIKE '%45 min de movimento%'
OR lower(activity) LIKE '%10 minutos sem tela%';

-- ------------------------------------------------------------
-- 17. Life Table — módulo estilo Notion antes do dashboard
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS life_table_rows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT 'Nova linha',
  icon         text DEFAULT '▦',
  status       text DEFAULT 'a_fazer',
  priority     text DEFAULT 'media',
  area         text DEFAULT 'Geral',
  due_date     date,
  notes        text DEFAULT '',
  properties   jsonb DEFAULT '{}'::jsonb,
  position     integer DEFAULT 0,
  is_archived  boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE life_table_rows
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title text DEFAULT 'Nova linha',
  ADD COLUMN IF NOT EXISTS icon text DEFAULT '▦',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'a_fazer',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS area text DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS properties jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_life_table_rows_user_active
  ON life_table_rows(user_id, is_archived, position, created_at);
CREATE INDEX IF NOT EXISTS idx_life_table_rows_status
  ON life_table_rows(user_id, status);


-- ============================================================================
-- WORKSPACE MODULE
-- ============================================================================
-- LifeOS v8.8 — Workspace inteligente estilo Notion
-- Execute este arquivo no Supabase SQL Editor antes de usar o módulo Workspace.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  category    text DEFAULT 'pessoal',
  priority    text DEFAULT 'medium',
  due_date    date,
  done        boolean DEFAULT false,
  source      text DEFAULT 'manual',
  done_at     timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'pessoal',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS done_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_tasks_user_done ON tasks(user_id, done, due_date);

CREATE TABLE IF NOT EXISTS workspace_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'note' CHECK (type IN ('note','task','project','study','reminder','idea')),
  title       text NOT NULL,
  content     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','archived')),
  priority    text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date    date,
  parent_id   uuid REFERENCES workspace_items(id) ON DELETE SET NULL,
  tags        text[] DEFAULT '{}',
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT 'Nova página',
  icon         text DEFAULT '📝',
  cover_image  text,
  parent_id    uuid REFERENCES workspace_pages(id) ON DELETE SET NULL,
  is_archived  boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id     uuid NOT NULL REFERENCES workspace_pages(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'text' CHECK (type IN ('text','heading','todo','checklist','quote','code','image','link','divider')),
  content     text DEFAULT '',
  position    integer DEFAULT 0,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
  progress    integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  page_id     uuid REFERENCES workspace_pages(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_tasks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','archived')),
  priority       text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date       date,
  project_id     uuid REFERENCES workspace_projects(id) ON DELETE SET NULL,
  page_id        uuid REFERENCES workspace_pages(id) ON DELETE SET NULL,
  source_item_id uuid REFERENCES workspace_items(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_items_user_status ON workspace_items(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_items_user_type ON workspace_items(user_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_pages_user_active ON workspace_pages(user_id, is_archived, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_blocks_page_order ON workspace_blocks(page_id, position);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_now ON workspace_tasks(user_id, status, due_date, priority);
CREATE INDEX IF NOT EXISTS idx_workspace_projects_user_status ON workspace_projects(user_id, status, updated_at DESC);
