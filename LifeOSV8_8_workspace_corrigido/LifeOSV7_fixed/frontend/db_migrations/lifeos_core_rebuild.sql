create table if not exists finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('income','expense')),
  title text not null,
  category text not null default 'geral',
  amount numeric(12,2) not null check (amount >= 0),
  transaction_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_finance_transactions_user_date on finance_transactions(user_id, transaction_date desc);

create table if not exists feedback_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  rating int not null check (rating between 1 and 5),
  category text not null default 'geral',
  relevance_score int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_feedback_posts_created_at on feedback_posts(created_at desc);
create index if not exists idx_feedback_posts_relevance on feedback_posts(relevance_score desc, created_at desc);

create table if not exists user_module_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  module_id text not null,
  open_count int not null default 1,
  last_opened_at timestamptz not null default now(),
  unique(user_id, module_id)
);
create index if not exists idx_user_module_usage_user_count on user_module_usage(user_id, open_count desc);

-- v7.1: Universal profession attributes (April 2026)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profession_attributes JSONB;
