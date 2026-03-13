alter table public.collections
  add column if not exists order_index integer;

with ordered_collections as (
  select
    id,
    row_number() over (order by name asc, id asc) as next_order_index
  from public.collections
)
update public.collections
set order_index = ordered_collections.next_order_index
from ordered_collections
where public.collections.id = ordered_collections.id
  and public.collections.order_index is null;

alter table public.collections
  alter column order_index set not null;

create index if not exists collections_order_index_idx
  on public.collections (order_index);
