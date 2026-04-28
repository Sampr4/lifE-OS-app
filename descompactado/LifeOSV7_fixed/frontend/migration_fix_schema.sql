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
  ADD COLUMN IF NOT EXISTS consolidated_context  jsonb    DEFAULT '{}',
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

-- ============================================================
-- Fim da migration
-- ============================================================
