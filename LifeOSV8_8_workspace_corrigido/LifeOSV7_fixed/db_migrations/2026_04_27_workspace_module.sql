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
