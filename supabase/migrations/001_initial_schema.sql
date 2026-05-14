create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  role text not null,
  active boolean default true,
  default_channel text,
  default_supervisor text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sheet_tab_name text unique,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists titles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  normalized_title text,
  channel_id uuid references channels(id),
  priority text default 'Normal',
  source text,
  approved_date date,
  approved_by uuid references users(id),
  supervisor_id uuid references users(id),
  writer_id uuid references users(id),
  imported_supervisor_name text,
  imported_writer_name text,
  help_doc_url text,
  script_doc_url text,
  writer_due_date date,
  writer_assigned_at timestamp with time zone,
  help_doc_ready_at timestamp with time zone,
  script_submitted_at timestamp with time zone,
  blocked boolean default false,
  blocked_reason text,
  blocked_by text,
  blocked_at timestamp with time zone,
  blocked_category text,
  completed_at timestamp with time zone,
  notes text,
  current_status text default 'Approved',
  match_status text default 'Unmatched',
  sheet_write_back_status text,
  sheet_write_back_at timestamp with time zone,
  source_key text unique,
  source_sheet_id text,
  source_sheet_tab text,
  source_row_number integer,
  production_sheet_id text,
  production_sheet_tab text,
  production_row_number integer,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists production_details (
  id uuid primary key default gen_random_uuid(),
  title_id uuid references titles(id) on delete cascade unique,
  word_count integer,
  clip_finder text,
  proofreader_id uuid references users(id),
  proofreader_text text,
  vo_artist text,
  editor_id uuid references users(id),
  editor_text text,
  proofreading_status text,
  vo_status text,
  editing_status text,
  production_status text,
  final_status text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  title_id uuid references titles(id) on delete cascade,
  role_type text not null,
  user_id uuid references users(id),
  assigned_at timestamp with time zone default now(),
  due_date date,
  completed_at timestamp with time zone,
  status text default 'Assigned',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  title_id uuid references titles(id) on delete cascade,
  action text not null,
  old_value text,
  new_value text,
  performed_by uuid references users(id),
  created_at timestamp with time zone default now()
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  title_id uuid references titles(id) on delete cascade,
  alert_type text not null,
  severity text not null,
  message text not null,
  resolved boolean default false,
  created_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);

create index if not exists idx_titles_normalized_title on titles(normalized_title);
create index if not exists idx_titles_channel_id on titles(channel_id);
create index if not exists idx_titles_supervisor_id on titles(supervisor_id);
create index if not exists idx_titles_writer_id on titles(writer_id);
create index if not exists idx_titles_match_status on titles(match_status);
create index if not exists idx_alerts_resolved on alerts(resolved);

insert into channels (name, sheet_tab_name)
values
  ('MV N', 'MV N'),
  ('LL', 'LL'),
  ('Gamers', 'Gamers'),
  ('Anime', 'Anime'),
  ('Long Reads', 'Long Reads')
on conflict (name) do update set
  sheet_tab_name = excluded.sheet_tab_name,
  active = true,
  updated_at = now();
