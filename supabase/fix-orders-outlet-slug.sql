alter table public.orders
  add column if not exists outlet_slug text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'outlet_id'
  ) then
    update public.orders as o
    set outlet_slug = outlets.slug
    from public.outlets as outlets
    where o.outlet_slug is null
      and o.outlet_id is not null
      and outlets.id = o.outlet_id;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_outlet_slug_fkey'
  ) then
    alter table public.orders
      add constraint orders_outlet_slug_fkey
      foreign key (outlet_slug)
      references public.outlets(slug)
      on delete set null;
  end if;
end $$;

create index if not exists orders_outlet_slug_idx
  on public.orders(outlet_slug);
