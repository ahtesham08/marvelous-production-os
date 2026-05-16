create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references users(id) on delete set null,
  recipient_name text,
  title_id uuid references titles(id) on delete cascade,
  brainstorming_title_id uuid references brainstorming_titles(id) on delete cascade,
  session_id uuid references brainstorming_sessions(id) on delete cascade,
  type text not null,
  message text not null,
  link_url text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index if not exists idx_notifications_recipient_user_id
  on notifications(recipient_user_id, read_at, created_at desc);

create index if not exists idx_notifications_recipient_name
  on notifications(recipient_name, read_at, created_at desc);

create index if not exists idx_notifications_title_id
  on notifications(title_id);
