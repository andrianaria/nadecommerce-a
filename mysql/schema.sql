-- Street Sushi Shop MySQL 8.0 schema (core tables used by the app)
-- Charset/collation are important for FK compatibility on string columns.

create table if not exists admin_profiles (
  id varchar(64) not null,
  email varchar(255) not null,
  full_name varchar(255) null,
  role varchar(32) not null default 'admin',
  is_active boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  primary key (id),
  unique key admin_profiles_email_uq (email)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists admin_users (
  id char(36) not null,
  email varchar(255) not null,
  password_hash varchar(255) not null,
  full_name varchar(255) null,
  role varchar(32) not null default 'admin',
  is_active boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  primary key (id),
  unique key admin_users_email_uq (email)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists products (
  slug varchar(96) not null,
  name varchar(255) not null,
  category varchar(96) not null default 'Sushi Cake',
  price int not null default 0,
  serves varchar(64) null,
  pieces int not null default 0,
  description text null,
  tagline varchar(255) null,
  theme varchar(64) null,
  is_featured boolean not null default false,
  image_url text null,
  spicy_level varchar(32) null,
  metadata json null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  primary key (slug),
  key products_featured_idx (is_featured),
  key products_created_idx (created_at)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists outlets (
  id char(36) not null,
  slug varchar(96) not null,
  code varchar(64) null,
  name varchar(255) not null,
  short_label varchar(128) null,
  address_line_1 text not null,
  address_line_2 text null,
  city varchar(128) null,
  province varchar(128) null,
  latitude decimal(10,7) null,
  longitude decimal(10,7) null,
  is_active boolean not null default true,
  keywords json not null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  primary key (id),
  unique key outlets_slug_uq (slug),
  unique key outlets_code_uq (code)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists member_accounts (
  id char(36) not null,
  franchise_customer_id bigint unsigned null,
  brand_id bigint unsigned null,
  full_name varchar(255) not null,
  email varchar(255) null,
  phone varchar(64) null,
  password_hash varchar(255) null,
  google_sub varchar(255) null,
  auth_provider varchar(32) not null default 'credentials',
  is_active boolean not null default true,
  metadata json null,
  last_login_at timestamp null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  primary key (id),
  unique key member_accounts_email_uq (email),
  unique key member_accounts_phone_uq (phone),
  unique key member_accounts_google_sub_uq (google_sub),
  key member_accounts_franchise_customer_idx (franchise_customer_id),
  key member_accounts_created_idx (created_at)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists orders (
  id char(36) not null,
  reference varchar(64) not null,
  source varchar(64) not null default 'online-shop',
  outlet_slug varchar(96) null,
  status varchar(32) not null default 'pending',
  fulfillment_type varchar(16) not null default 'delivery',
  customer_name varchar(255) null,
  customer_phone varchar(64) null,
  customer_email varchar(255) null,
  subtotal int not null default 0,
  discount_total int not null default 0,
  tax_total int not null default 0,
  delivery_fee int not null default 0,
  grand_total int not null default 0,
  notes text null,
  payment_status varchar(32) not null default 'unpaid',
  payment_provider varchar(32) null,
  payment_reference varchar(128) null,
  delivery_status varchar(32) not null default 'pending',
  delivery_provider varchar(32) null,
  delivery_reference varchar(128) null,
  delivery_quote_id varchar(128) null,
  paid_at timestamp null,
  metadata json null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  primary key (id),
  unique key orders_reference_uq (reference),
  key orders_created_idx (created_at),
  key orders_payment_status_idx (payment_status),
  key orders_outlet_slug_idx (outlet_slug),
  constraint orders_outlet_slug_fk foreign key (outlet_slug) references outlets(slug) on delete set null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists promotions (
  id char(36) not null,
  code varchar(64) null,
  name varchar(255) not null,
  description text null,
  eligibility_scope varchar(32) not null default 'all',
  discount_type varchar(16) not null default 'fixed',
  discount_value int not null default 0,
  max_discount int null,
  min_subtotal int not null default 0,
  auto_apply boolean not null default false,
  is_active boolean not null default true,
  starts_at timestamp null,
  ends_at timestamp null,
  metadata json null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  primary key (id),
  unique key promotions_code_uq (code),
  key promotions_is_active_idx (is_active),
  key promotions_auto_apply_idx (auto_apply)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists promotion_products (
  promotion_id char(36) not null,
  product_slug varchar(96) not null,
  created_at timestamp not null default current_timestamp,
  primary key (promotion_id, product_slug),
  key promotion_products_product_idx (product_slug),
  constraint promotion_products_promotion_fk foreign key (promotion_id) references promotions(id) on delete cascade,
  constraint promotion_products_product_fk foreign key (product_slug) references products(slug) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists promotion_outlets (
  promotion_id char(36) not null,
  outlet_slug varchar(96) not null,
  created_at timestamp not null default current_timestamp,
  primary key (promotion_id, outlet_slug),
  key promotion_outlets_outlet_idx (outlet_slug),
  constraint promotion_outlets_promotion_fk foreign key (promotion_id) references promotions(id) on delete cascade,
  constraint promotion_outlets_outlet_fk foreign key (outlet_slug) references outlets(slug) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists order_items (
  id bigint not null auto_increment,
  order_id char(36) not null,
  product_id varchar(96) null,
  name varchar(255) not null,
  quantity int not null default 1,
  unit_price int not null default 0,
  line_total int not null default 0,
  metadata json null,
  primary key (id),
  key order_items_order_id_idx (order_id),
  key order_items_product_id_idx (product_id),
  constraint order_items_order_fk foreign key (order_id) references orders(id) on delete cascade,
  constraint order_items_product_fk foreign key (product_id) references products(slug) on delete set null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists product_outlets (
  product_slug varchar(96) not null,
  outlet_slug varchar(96) not null,
  created_at timestamp not null default current_timestamp,
  primary key (product_slug, outlet_slug),
  key product_outlets_outlet_idx (outlet_slug),
  constraint product_outlets_product_fk foreign key (product_slug) references products(slug) on delete cascade,
  constraint product_outlets_outlet_fk foreign key (outlet_slug) references outlets(slug) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists payment_transactions (
  id char(36) not null,
  order_id char(36) not null,
  provider varchar(32) not null,
  provider_transaction_id varchar(128) null,
  provider_reference varchar(128) null,
  payment_method_type varchar(64) null,
  payment_channel varchar(64) null,
  amount int not null default 0,
  currency varchar(8) not null default 'IDR',
  status varchar(32) not null default 'pending',
  checkout_url text null,
  expires_at timestamp null,
  paid_at timestamp null,
  raw_response json null,
  metadata json null,
  created_at timestamp not null default current_timestamp,
  primary key (id),
  key payment_transactions_order_id_idx (order_id),
  key payment_transactions_provider_idx (provider),
  constraint payment_transactions_order_fk foreign key (order_id) references orders(id) on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table if not exists payment_logs (
  id char(36) not null,
  order_id char(36) not null,
  payment_transaction_id char(36) null,
  event_type varchar(64) not null,
  provider varchar(32) null,
  provider_event_id varchar(128) null,
  status varchar(32) null,
  payload json null,
  created_at timestamp not null default current_timestamp,
  primary key (id),
  key payment_logs_order_id_idx (order_id),
  key payment_logs_txn_id_idx (payment_transaction_id),
  constraint payment_logs_order_fk foreign key (order_id) references orders(id) on delete cascade,
  constraint payment_logs_txn_fk foreign key (payment_transaction_id) references payment_transactions(id) on delete set null
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;
