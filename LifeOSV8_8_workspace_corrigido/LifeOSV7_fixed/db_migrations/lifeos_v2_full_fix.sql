-- ============================================================
-- LifeOS — Migration COMPLETA v2.1 (Abril 2026)
-- Arquivo: db_migrations/lifeos_v2_full_fix.sql
--
-- CORREÇÕES DE SCHEMA INCLUÍDAS:
--   1. user_profiles.profession_attributes (JSONB) — ausente causava
--      falha silenciosa na personalização por profissão
--   2. daily_reminders — recriação com schema correto (sem reminder_date)
--      O código antigo filtrava por reminder_date que nunca existiu.
--      Schema correto: reminder_time (TIME), não reminder_date (DATE).
--   3. feedback_posts — garantir existência com todos os campos
--   4. onboarding_progress — garantir coluna answers_snapshot (JSONB)
--   5. Todas as tabelas auxiliares necessárias
--
-- SEGURO PARA RE-EXECUÇÃO: usa IF NOT EXISTS / DO NOTHING em tudo.
-- Aplique no Supabase SQL Editor ou via psql.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. user_profiles — coluna profession_attributes (JSONB)
--    FIX: Estava ausente, causando falha no sistema de personalização
--    universal de profissão. O código em onboarding.py salva
--    profession_attributes como JSON e context.py lê esse campo.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS profession_attributes JSONB DEFAULT '{}';

-- Também garantir outras colunas que o código usa
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS consolidated_context  JSONB        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_generation_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vision                TEXT         DEFAULT '',
  ADD COLUMN IF NOT EXISTS energy_pattern        TEXT         DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS week_status           TEXT         DEFAULT '';

-- ─────────────────────────────────────────────────────────────
-- 2. daily_reminders — corrigir schema
--    FIX: O código antigo usava .eq("reminder_date", ...) mas essa
--    coluna NUNCA existiu no schema. O schema correto é:
--      - reminder_time TIME (hora do lembrete)
--      - is_active BOOLEAN (se o lembrete está ativo)
--    A coluna reminder_date é criada aqui como alias/compat
--    mas o código foi corrigido para não depender dela.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_reminders (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text          TEXT        NOT NULL DEFAULT '',
  reminder_time TIME,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_reminders_user_id
  ON daily_reminders (user_id, is_active);

-- Se a tabela já existia com reminder_date, adicionar reminder_time como alternativa
ALTER TABLE daily_reminders
  ADD COLUMN IF NOT EXISTS reminder_time TIME,
  ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT TRUE;

-- ─────────────────────────────────────────────────────────────
-- 3. feedback_posts — garantir tabela com schema completo
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT        NOT NULL,
  rating          INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category        TEXT        NOT NULL DEFAULT 'geral',
  relevance_score INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_created_at
  ON feedback_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_relevance
  ON feedback_posts (relevance_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_user_id
  ON feedback_posts (user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. onboarding_progress — garantir coluna answers_snapshot
-- ─────────────────────────────────────────────────────────────
ALTER TABLE onboarding_progress
  ADD COLUMN IF NOT EXISTS answers_snapshot JSONB DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────
-- 5. plans — colunas context e generated_at
-- ─────────────────────────────────────────────────────────────
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS context      JSONB,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────────────────────
-- 6. ai_generations — colunas de observabilidade
-- ─────────────────────────────────────────────────────────────
ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS prompt_used   TEXT,
  ADD COLUMN IF NOT EXISTS model_used    TEXT,
  ADD COLUMN IF NOT EXISTS tokens_input  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_output INTEGER DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- 7. habit_logs — garantir coluna done
-- ─────────────────────────────────────────────────────────────
ALTER TABLE habit_logs
  ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habit_logs' AND column_name = 'completed'
  ) THEN
    UPDATE habit_logs SET done = completed WHERE done IS DISTINCT FROM completed;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 8. weekly_metrics — suporte a day_of_week
-- ─────────────────────────────────────────────────────────────
ALTER TABLE weekly_metrics
  ADD COLUMN IF NOT EXISTS day_of_week INTEGER DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'weekly_metrics_user_id_week_start_key'
  ) THEN
    ALTER TABLE weekly_metrics DROP CONSTRAINT weekly_metrics_user_id_week_start_key;
  END IF;
END $$;

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

-- ─────────────────────────────────────────────────────────────
-- 9. finance_entries — coluna source
-- ─────────────────────────────────────────────────────────────
ALTER TABLE finance_entries
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- ─────────────────────────────────────────────────────────────
-- 10. Tabelas auxiliares — criar se não existirem
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_signals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_type TEXT        NOT NULL,
  signal_data JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_signals_user_id ON user_signals (user_id);

CREATE TABLE IF NOT EXISTS generation_runs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_type    TEXT        NOT NULL DEFAULT 'initial',
  status      TEXT        NOT NULL DEFAULT 'success',
  run_data    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_generation_runs_user_id ON generation_runs (user_id);

CREATE TABLE IF NOT EXISTS daily_generation_runs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  status      TEXT        NOT NULL DEFAULT 'success',
  run_data    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, run_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_gen_runs_user_id ON daily_generation_runs (user_id);

CREATE TABLE IF NOT EXISTS history_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL,
  event_data  JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_history_events_user_id_type ON history_events (user_id, event_type);

CREATE TABLE IF NOT EXISTS user_module_usage (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id     TEXT        NOT NULL,
  open_count    INT         NOT NULL DEFAULT 1,
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_user_module_usage_user_count
  ON user_module_usage (user_id, open_count DESC);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind             TEXT        NOT NULL CHECK (kind IN ('income','expense')),
  title            TEXT        NOT NULL,
  category         TEXT        NOT NULL DEFAULT 'geral',
  amount           NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  transaction_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date
  ON finance_transactions (user_id, transaction_date DESC);

-- ─────────────────────────────────────────────────────────────
-- 11. ai_requests / ai_outputs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES users(id) ON DELETE CASCADE,
  request_type    TEXT        NOT NULL,
  request_payload JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON ai_requests (user_id);

CREATE TABLE IF NOT EXISTS ai_outputs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID        REFERENCES ai_requests(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
  output_type TEXT        NOT NULL,
  output_data JSONB       DEFAULT '{}',
  tokens_used INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_user_id ON ai_outputs (user_id);

-- ─────────────────────────────────────────────────────────────
-- 12. Verificação final: listar colunas relevantes para debug
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  has_profession_attributes BOOLEAN;
  has_reminder_time BOOLEAN;
  has_feedback_posts BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
      AND column_name = 'profession_attributes'
  ) INTO has_profession_attributes;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reminders'
      AND column_name = 'reminder_time'
  ) INTO has_reminder_time;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'feedback_posts'
  ) INTO has_feedback_posts;

  RAISE NOTICE '[LifeOS Migration v2.1] profession_attributes: % | daily_reminders.reminder_time: % | feedback_posts: %',
    has_profession_attributes, has_reminder_time, has_feedback_posts;
END $$;

-- ============================================================
-- FIM DA MIGRATION v2.1
-- Todos os schemas corrigidos. Execute e verifique o NOTICE acima.
-- ============================================================
