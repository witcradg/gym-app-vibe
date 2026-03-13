alter table public.exercises
  drop constraint if exists exercises_collection_id_fkey;

alter table public.exercises
  add constraint exercises_collection_id_fkey
  foreign key (collection_id)
  references public.collections(id)
  on delete restrict;
