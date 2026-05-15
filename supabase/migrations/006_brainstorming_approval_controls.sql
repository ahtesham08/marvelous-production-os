alter table brainstorming_titles
  add column if not exists urgency text default 'Normal',
  add column if not exists approved_due_date date;

update brainstorming_titles
set urgency = coalesce(nullif(urgency, ''), nullif(priority, ''), 'Normal')
where urgency is null or urgency = '';

create index if not exists idx_brainstorming_titles_approved_due_date
  on brainstorming_titles(approved_due_date);
