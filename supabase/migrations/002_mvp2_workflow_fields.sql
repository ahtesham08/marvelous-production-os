alter table titles
  add column if not exists writer_due_date date,
  add column if not exists writer_assigned_at timestamp with time zone,
  add column if not exists help_doc_ready_at timestamp with time zone,
  add column if not exists script_submitted_at timestamp with time zone,
  add column if not exists blocked boolean default false,
  add column if not exists blocked_reason text,
  add column if not exists notes text,
  add column if not exists sheet_write_back_status text,
  add column if not exists sheet_write_back_at timestamp with time zone;

create index if not exists idx_titles_writer_due_date on titles(writer_due_date);
create index if not exists idx_titles_blocked on titles(blocked);
create index if not exists idx_activity_log_title_created on activity_log(title_id, created_at desc);
