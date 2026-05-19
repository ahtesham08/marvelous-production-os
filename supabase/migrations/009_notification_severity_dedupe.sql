alter table notifications
  add column if not exists severity text default 'Low',
  add column if not exists dedupe_key text,
  add column if not exists related_title_name text,
  add column if not exists supervisor_name text,
  add column if not exists due_date date;

create unique index if not exists idx_notifications_dedupe_key
  on notifications(dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_notifications_severity_created
  on notifications(severity, created_at desc);
