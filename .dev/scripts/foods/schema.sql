create table public.foods (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) > 0),
  aliases text[] not null default '{}',
  category text,
  kcal_per_100 numeric not null check (kcal_per_100 >= 0),
  protein_per_100 numeric not null check (protein_per_100 >= 0),
  carbs_per_100 numeric not null check (carbs_per_100 >= 0),
  fat_per_100 numeric not null check (fat_per_100 >= 0),
  priority smallint not null default 0,
  source text not null default 'manual'
);

alter table public.foods enable row level security;

create policy foods_read on public.foods for select to authenticated using (true);
