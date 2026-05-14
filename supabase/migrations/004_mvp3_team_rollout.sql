alter table users
  add column if not exists default_channel text,
  add column if not exists default_supervisor text;

alter table titles
  add column if not exists blocked_by text,
  add column if not exists blocked_at timestamp with time zone,
  add column if not exists blocked_category text,
  add column if not exists completed_at timestamp with time zone;

insert into users (name, email, role, active)
values
  ('Ahtesham', null, 'Admin', true),
  ('Kamran', null, 'Supervisor', true),
  ('Farhan', null, 'Supervisor', true),
  ('Raktim', null, 'Supervisor', true),
  ('Deepak', null, 'Operations Supervisor', true)
on conflict (email) do nothing;

create index if not exists idx_titles_blocked_category on titles(blocked_category);
create index if not exists idx_titles_completed_at on titles(completed_at);
create index if not exists idx_users_role_active on users(role, active);
