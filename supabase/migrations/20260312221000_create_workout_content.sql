create table if not exists public.collections (
  id text primary key,
  name text not null,
  description text null
);

create table if not exists public.exercises (
  id text primary key,
  collection_id text not null references public.collections(id) on delete cascade,
  name text not null,
  order_index integer not null,
  sets integer not null check (sets >= 1),
  reps text null,
  weight text null,
  notes text null
);

create index if not exists exercises_collection_order_idx
  on public.exercises (collection_id, order_index);
