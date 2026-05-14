create table if not exists brainstorming_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  session_date date not null default current_date,
  channels text[] default '{}',
  participants text[] default '{}',
  notes text,
  status text not null default 'Draft',
  created_by uuid references users(id),
  created_by_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists brainstorming_titles (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references brainstorming_sessions(id) on delete set null,
  title text not null,
  normalized_title text,
  channel text default 'MV N',
  priority text default 'Normal',
  submitted_by uuid references users(id),
  submitted_by_name text,
  supervisor text,
  short_pitch text,
  why_good text,
  reference_links text,
  suggested_writer text,
  notes text,
  ahtesham_notes text,
  discussion_summary text,
  status text not null default 'Proposed',
  decision_status text,
  decision_reason text,
  decided_by uuid references users(id),
  decided_by_name text,
  decided_at timestamp with time zone,
  converted_title_id uuid references titles(id),
  converted_at timestamp with time zone,
  duplicate_warning text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists brainstorming_discussion_notes (
  id uuid primary key default gen_random_uuid(),
  brainstorming_title_id uuid references brainstorming_titles(id) on delete cascade,
  note_text text not null,
  author_id uuid references users(id),
  author_name text,
  created_at timestamp with time zone default now()
);

alter table titles
  add column if not exists source_session_id uuid references brainstorming_sessions(id),
  add column if not exists source_brainstorming_title_id uuid references brainstorming_titles(id);

create unique index if not exists idx_titles_source_brainstorming_title_id
  on titles(source_brainstorming_title_id)
  where source_brainstorming_title_id is not null;

create index if not exists idx_brainstorming_sessions_status_date on brainstorming_sessions(status, session_date);
create index if not exists idx_brainstorming_titles_session on brainstorming_titles(session_id);
create index if not exists idx_brainstorming_titles_status on brainstorming_titles(status);
create index if not exists idx_brainstorming_titles_normalized on brainstorming_titles(normalized_title);
create index if not exists idx_brainstorming_notes_title on brainstorming_discussion_notes(brainstorming_title_id);
