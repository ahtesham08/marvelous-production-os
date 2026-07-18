insert into channels (name, sheet_tab_name, active, updated_at)
values
  ('OCTAGON OF HORROR', 'OCTAGON OF HORROR', true, now()),
  ('MARVELOUS ANIME', 'MARVELOUS ANIME', true, now())
on conflict (name) do update set
  sheet_tab_name = excluded.sheet_tab_name,
  active = true,
  updated_at = now();
