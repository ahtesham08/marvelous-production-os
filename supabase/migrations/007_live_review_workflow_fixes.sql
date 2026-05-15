alter table brainstorming_titles
  add column if not exists expected_word_count integer,
  add column if not exists hold_until_date date;

alter table titles
  add column if not exists expected_word_count integer,
  add column if not exists ahtesham_directives text;

create index if not exists idx_brainstorming_titles_hold_until_date
  on brainstorming_titles(hold_until_date);

create index if not exists idx_titles_expected_word_count
  on titles(expected_word_count);
