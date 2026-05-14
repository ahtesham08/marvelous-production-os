alter table production_details
  add column if not exists production_status text;

create index if not exists idx_titles_approved_date on titles(approved_date);
create index if not exists idx_titles_source on titles(source);
