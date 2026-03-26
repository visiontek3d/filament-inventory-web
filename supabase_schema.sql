-- Run this in your Supabase project's SQL editor

-- Filaments
create table public.filaments (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  manufacturer text not null default '',
  type         text not null default '',
  color        text not null default '',
  upc          text not null default '',
  photo_url    text,
  url          text,
  priority     text not null default 'None',
  created_at   timestamptz default now() not null
);

alter table public.filaments enable row level security;
create policy "Own filaments" on public.filaments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Rolls
create table public.rolls (
  id             bigserial primary key,
  filament_id    bigint references public.filaments(id) on delete cascade not null,
  is_checked_out integer not null default 0,  -- 0 = inventory, 1 = in use
  archived       integer not null default 0,  -- 1 = empty spool
  created_at     timestamptz default now() not null
);

alter table public.rolls enable row level security;
create policy "Own rolls" on public.rolls
  for all using (
    filament_id in (select id from public.filaments where user_id = auth.uid())
  );

-- Settings (thresholds etc.)
create table public.filament_settings (
  user_id uuid references auth.users(id) on delete cascade not null,
  key     text not null,
  value   text not null,
  primary key (user_id, key)
);

alter table public.filament_settings enable row level security;
create policy "Own settings" on public.filament_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
