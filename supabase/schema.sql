create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text not null default 'admin' check (role in ('owner', 'admin', 'staff')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  sku text unique,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  short_name text,
  category text not null default 'Sushi Cake',
  description text,
  tagline text,
  theme text not null default 'salmon-sunrise',
  price integer not null default 0,
  compare_at_price integer,
  cost_price integer,
  serves text,
  pieces integer not null default 0,
  spicy_level text not null default 'Mild',
  spice_score integer not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  image_url text,
  thumbnail_url text,
  seo_title text,
  seo_description text,
  pos_external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_items (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  name text not null,
  price integer not null default 0,
  compare_at_price integer,
  stock_quantity integer not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  pos_external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id bigint generated always as identity primary key,
  product_id uuid references public.products(id) on delete set null,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  movement_type text not null check (movement_type in ('initial', 'restock', 'sale', 'adjustment', 'refund')),
  quantity integer not null,
  note text,
  reference_type text,
  reference_id text,
  created_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  birth_date date,
  marketing_opt_in boolean not null default false,
  notes text,
  loyalty_points integer not null default 0,
  pos_external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_email_unique_not_null
  on public.customers (lower(email))
  where email is not null;

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  recipient_name text,
  phone text,
  address_line_1 text not null,
  address_line_2 text,
  district text,
  city text,
  province text,
  postal_code text,
  country_code text not null default 'ID',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_default boolean not null default false,
  delivery_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outlets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  code text unique,
  name text not null,
  short_label text,
  address_line_1 text not null,
  address_line_2 text,
  district text,
  city text,
  province text,
  postal_code text,
  country_code text not null default 'ID',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_active boolean not null default true,
  keywords jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  session_id text,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned')),
  currency text not null default 'IDR',
  subtotal integer not null default 0,
  discount_total integer not null default 0,
  total integer not null default 0,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price integer not null default 0,
  total_price integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  source text not null default 'online-shop',
  customer_id uuid references public.customers(id) on delete set null,
  outlet_slug text references public.outlets(slug) on delete set null,
  billing_address_id uuid references public.customer_addresses(id) on delete set null,
  shipping_address_id uuid references public.customer_addresses(id) on delete set null,
  status text not null default 'pending' check (status in ('draft', 'pending', 'confirmed', 'paid', 'processing', 'out_for_delivery', 'completed', 'cancelled', 'refunded')),
  fulfillment_type text not null default 'delivery' check (fulfillment_type in ('delivery', 'pickup')),
  customer_name text,
  customer_phone text,
  customer_email text,
  currency text not null default 'IDR',
  subtotal integer not null default 0,
  discount_total integer not null default 0,
  tax_total integer not null default 0,
  service_fee integer not null default 0,
  delivery_fee integer not null default 0,
  grand_total integer not null default 0,
  notes text,
  internal_notes text,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'quoted', 'booked', 'driver_assigned', 'picked_up', 'delivered', 'cancelled', 'failed')),
  payment_provider text,
  payment_reference text,
  delivery_provider text,
  delivery_reference text,
  delivery_quote_id text,
  pos_sync_status text not null default 'not_synced' check (pos_sync_status in ('not_synced', 'queued', 'synced', 'failed')),
  pos_sync_error text,
  pos_external_id text,
  paid_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  sku text,
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price integer not null default 0,
  discount_total integer not null default 0,
  line_total integer not null default 0,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_transaction_id text,
  provider_reference text,
  payment_method_type text,
  payment_channel text,
  amount integer not null default 0,
  currency text not null default 'IDR',
  status text not null default 'pending' check (status in ('pending', 'requires_action', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  checkout_url text,
  expires_at timestamptz,
  paid_at timestamptz,
  raw_response jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_logs (
  id bigint generated always as identity primary key,
  payment_transaction_id uuid references public.payment_transactions(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  event_type text not null,
  provider text,
  provider_event_id text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create table if not exists public.delivery_quotes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  provider text not null,
  provider_quote_id text,
  service_type text,
  currency text not null default 'IDR',
  amount integer not null default 0,
  expires_at timestamptz,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  delivery_quote_id uuid references public.delivery_quotes(id) on delete set null,
  provider text not null,
  provider_order_id text,
  service_type text,
  status text not null default 'pending',
  driver_name text,
  driver_phone text,
  vehicle_type text,
  tracking_url text,
  raw_response jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_logs (
  id bigint generated always as identity primary key,
  delivery_order_id uuid references public.delivery_orders(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  provider text,
  event_type text not null,
  status text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create table if not exists public.pos_sync_logs (
  id bigint generated always as identity primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  sync_target text not null default 'mysql-pos',
  direction text not null check (direction in ('push', 'pull')),
  status text not null default 'queued' check (status in ('queued', 'success', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  error_message text,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.admin_profiles(id) on delete set null,
  actor_email text,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_slug_idx on public.categories(slug);
create unique index if not exists products_slug_idx on public.products(slug);
create unique index if not exists products_sku_idx on public.products(sku) where sku is not null;
create unique index if not exists product_variants_sku_idx on public.product_variants(sku) where sku is not null;
create unique index if not exists outlets_slug_idx on public.outlets(slug);
create unique index if not exists outlets_code_idx on public.outlets(code) where code is not null;
create index if not exists product_items_product_id_idx on public.product_items(product_id);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists inventory_movements_product_id_idx on public.inventory_movements(product_id);
create index if not exists customer_addresses_customer_id_idx on public.customer_addresses(customer_id);
create index if not exists outlets_city_idx on public.outlets(city);
create index if not exists carts_customer_id_idx on public.carts(customer_id);
create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_outlet_slug_idx on public.orders(outlet_slug);
create index if not exists orders_reference_idx on public.orders(reference);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
create index if not exists orders_delivery_status_idx on public.orders(delivery_status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists payment_transactions_order_id_idx on public.payment_transactions(order_id);
create index if not exists payment_logs_order_id_idx on public.payment_logs(order_id);
create index if not exists delivery_quotes_order_id_idx on public.delivery_quotes(order_id);
create index if not exists delivery_orders_order_id_idx on public.delivery_orders(order_id);
create index if not exists delivery_logs_order_id_idx on public.delivery_logs(order_id);
create index if not exists pos_sync_logs_order_id_idx on public.pos_sync_logs(order_id);
create index if not exists pos_sync_logs_product_id_idx on public.pos_sync_logs(product_id);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

drop trigger if exists set_updated_at_admin_profiles on public.admin_profiles;
create trigger set_updated_at_admin_profiles
before update on public.admin_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_categories on public.categories;
create trigger set_updated_at_categories
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_products on public.products;
create trigger set_updated_at_products
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_product_variants on public.product_variants;
create trigger set_updated_at_product_variants
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_customers on public.customers;
create trigger set_updated_at_customers
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_customer_addresses on public.customer_addresses;
create trigger set_updated_at_customer_addresses
before update on public.customer_addresses
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_outlets on public.outlets;
create trigger set_updated_at_outlets
before update on public.outlets
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_carts on public.carts;
create trigger set_updated_at_carts
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_cart_items on public.cart_items;
create trigger set_updated_at_cart_items
before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_orders on public.orders;
create trigger set_updated_at_orders
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_payment_transactions on public.payment_transactions;
create trigger set_updated_at_payment_transactions
before update on public.payment_transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_delivery_orders on public.delivery_orders;
create trigger set_updated_at_delivery_orders
before update on public.delivery_orders
for each row execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_items enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.outlets enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_logs enable row level security;
alter table public.delivery_quotes enable row level security;
alter table public.delivery_orders enable row level security;
alter table public.delivery_logs enable row level security;
alter table public.pos_sync_logs enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.is_active = true
  );
$$;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories
for select
using (is_active = true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
using (is_active = true);

drop policy if exists "Public can read product items" on public.product_items;
create policy "Public can read product items"
on public.product_items
for select
using (
  exists (
    select 1
    from public.products p
    where p.id = product_items.product_id
      and p.is_active = true
  )
);

drop policy if exists "Admins manage catalog categories" on public.categories;
create policy "Admins manage catalog categories"
on public.categories
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage catalog products" on public.products;
create policy "Admins manage catalog products"
on public.products
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage product items" on public.product_items;
create policy "Admins manage product items"
on public.product_items
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage product variants" on public.product_variants;
create policy "Admins manage product variants"
on public.product_variants
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage customers" on public.customers;
create policy "Admins manage customers"
on public.customers
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage customer addresses" on public.customer_addresses;
create policy "Admins manage customer addresses"
on public.customer_addresses
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Public can read active outlets" on public.outlets;
create policy "Public can read active outlets"
on public.outlets
for select
using (is_active = true);

drop policy if exists "Admins manage outlets" on public.outlets;
create policy "Admins manage outlets"
on public.outlets
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
on public.orders
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items"
on public.order_items
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage payment transactions" on public.payment_transactions;
create policy "Admins manage payment transactions"
on public.payment_transactions
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage payment logs" on public.payment_logs;
create policy "Admins manage payment logs"
on public.payment_logs
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage delivery quotes" on public.delivery_quotes;
create policy "Admins manage delivery quotes"
on public.delivery_quotes
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage delivery orders" on public.delivery_orders;
create policy "Admins manage delivery orders"
on public.delivery_orders
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage delivery logs" on public.delivery_logs;
create policy "Admins manage delivery logs"
on public.delivery_logs
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage pos sync logs" on public.pos_sync_logs;
create policy "Admins manage pos sync logs"
on public.pos_sync_logs
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins manage audit logs" on public.audit_logs;
create policy "Admins manage audit logs"
on public.audit_logs
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admin can view own profile" on public.admin_profiles;
create policy "Admin can view own profile"
on public.admin_profiles
for select
using (auth.uid() = id or public.is_admin_user());

drop policy if exists "Admin can manage own profile" on public.admin_profiles;
create policy "Admin can manage own profile"
on public.admin_profiles
for update
using (auth.uid() = id or public.is_admin_user())
with check (auth.uid() = id or public.is_admin_user());
