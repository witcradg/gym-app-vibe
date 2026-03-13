create table if not exists public.gym_app_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);
