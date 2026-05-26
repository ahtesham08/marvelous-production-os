create table if not exists proofreading_reviews (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  proofreader_id uuid references users(id) on delete set null,
  proofreader_name text,
  proofreading_status text not null default 'Not Started',
  script_quality_rating text,
  latest_feedback text,
  latest_supervisor_response text,
  is_blocked boolean not null default false,
  blocked_at timestamptz,
  blocked_by uuid references users(id) on delete set null,
  blocked_by_name text,
  block_category text,
  block_reason text,
  what_needs_fixing text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(title_id)
);

create table if not exists proofreading_threads (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(title_id)
);

create table if not exists proofreading_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references proofreading_threads(id) on delete cascade,
  title_id uuid not null references titles(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  sender_name text,
  sender_role text,
  message_text text,
  attachment_url text,
  attachment_type text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists proofreading_block_cycles (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  proofreader_id uuid references users(id) on delete set null,
  proofreader_name text,
  supervisor_id uuid references users(id) on delete set null,
  supervisor_name text,
  block_category text not null,
  block_reason text not null,
  proofreader_feedback text,
  what_needs_fixing text,
  supervisor_fix_response text,
  supervisor_fixed_at timestamptz,
  recheck_status text,
  final_resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proofreading_reviews_title_id on proofreading_reviews(title_id);
create index if not exists idx_proofreading_reviews_proofreader_name on proofreading_reviews(proofreader_name);
create index if not exists idx_proofreading_reviews_status on proofreading_reviews(proofreading_status);
create index if not exists idx_proofreading_messages_title_id on proofreading_messages(title_id);
create index if not exists idx_proofreading_messages_thread_id on proofreading_messages(thread_id);
create index if not exists idx_proofreading_block_cycles_title_id on proofreading_block_cycles(title_id);

insert into storage.buckets (id, name, public)
values ('proofreading-feedback', 'proofreading-feedback', true)
on conflict (id) do nothing;

insert into users (name, email, role, active)
values
  ('Rubai', null, 'Proofreader', true),
  ('Ashmita', null, 'Proofreader', true),
  ('Mehek', null, 'Proofreader', true),
  ('Mansi', null, 'Proofreader', true)
on conflict do nothing;
