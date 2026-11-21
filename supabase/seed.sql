insert into public.categories (slug, name, description, sort_order)
values
  ('sushi-cake', 'Sushi Cake', 'Hero category for Street Sushi celebration products.', 1)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.outlets (
  slug,
  code,
  name,
  short_label,
  address_line_1,
  city,
  province,
  country_code,
  latitude,
  longitude,
  is_active,
  keywords
)
values
  ('demo-outlet-1', 'DEMO-01', 'Demo Outlet 1', 'Demo 1', 'DEMO_OUTLET_ADDRESS_1', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 1","demo district 1"]'::jsonb),
  ('demo-outlet-2', 'DEMO-02', 'Demo Outlet 2', 'Demo 2', 'DEMO_OUTLET_ADDRESS_2', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 2","demo district 2"]'::jsonb),
  ('demo-outlet-3', 'DEMO-03', 'Demo Outlet 3', 'Demo 3', 'DEMO_OUTLET_ADDRESS_3', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 3","demo district 3"]'::jsonb),
  ('demo-outlet-4', 'DEMO-04', 'Demo Outlet 4', 'Demo 4', 'DEMO_OUTLET_ADDRESS_4', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 4","demo district 4"]'::jsonb),
  ('demo-outlet-5', 'DEMO-05', 'Demo Outlet 5', 'Demo 5', 'DEMO_OUTLET_ADDRESS_5', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 5","demo district 5"]'::jsonb),
  ('demo-outlet-6', 'DEMO-06', 'Demo Outlet 6', 'Demo 6', 'DEMO_OUTLET_ADDRESS_6', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 6","demo district 6"]'::jsonb),
  ('demo-outlet-7', 'DEMO-07', 'Demo Outlet 7', 'Demo 7', 'DEMO_OUTLET_ADDRESS_7', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 7","demo district 7"]'::jsonb),
  ('demo-outlet-8', 'DEMO-08', 'Demo Outlet 8', 'Demo 8', 'DEMO_OUTLET_ADDRESS_8', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 8","demo district 8"]'::jsonb),
  ('demo-outlet-9', 'DEMO-09', 'Demo Outlet 9', 'Demo 9', 'DEMO_OUTLET_ADDRESS_9', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 9","demo district 9"]'::jsonb),
  ('demo-outlet-10', 'DEMO-10', 'Demo Outlet 10', 'Demo 10', 'DEMO_OUTLET_ADDRESS_10', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 10","demo district 10"]'::jsonb),
  ('demo-outlet-11', 'DEMO-11', 'Demo Outlet 11', 'Demo 11', 'DEMO_OUTLET_ADDRESS_11', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 11","demo district 11"]'::jsonb),
  ('demo-outlet-12', 'DEMO-12', 'Demo Outlet 12', 'Demo 12', 'DEMO_OUTLET_ADDRESS_12', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 12","demo district 12"]'::jsonb),
  ('demo-outlet-13', 'DEMO-13', 'Demo Outlet 13', 'Demo 13', 'DEMO_OUTLET_ADDRESS_13', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 13","demo district 13"]'::jsonb),
  ('demo-outlet-14', 'DEMO-14', 'Demo Outlet 14', 'Demo 14', 'DEMO_OUTLET_ADDRESS_14', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 14","demo district 14"]'::jsonb),
  ('demo-outlet-15', 'DEMO-15', 'Demo Outlet 15', 'Demo 15', 'DEMO_OUTLET_ADDRESS_15', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 15","demo district 15"]'::jsonb),
  ('demo-outlet-16', 'DEMO-16', 'Demo Outlet 16', 'Demo 16', 'DEMO_OUTLET_ADDRESS_16', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 16","demo district 16"]'::jsonb),
  ('demo-outlet-17', 'DEMO-17', 'Demo Outlet 17', 'Demo 17', 'DEMO_OUTLET_ADDRESS_17', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 17","demo district 17"]'::jsonb),
  ('demo-outlet-18', 'DEMO-18', 'Demo Outlet 18', 'Demo 18', 'DEMO_OUTLET_ADDRESS_18', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 18","demo district 18"]'::jsonb),
  ('demo-outlet-19', 'DEMO-19', 'Demo Outlet 19', 'Demo 19', 'DEMO_OUTLET_ADDRESS_19', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 19","demo district 19"]'::jsonb),
  ('demo-outlet-20', 'DEMO-20', 'Demo Outlet 20', 'Demo 20', 'DEMO_OUTLET_ADDRESS_20', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 20","demo district 20"]'::jsonb),
  ('demo-outlet-21', 'DEMO-21', 'Demo Outlet 21', 'Demo 21', 'DEMO_OUTLET_ADDRESS_21', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 21","demo district 21"]'::jsonb),
  ('demo-outlet-22', 'DEMO-22', 'Demo Outlet 22', 'Demo 22', 'DEMO_OUTLET_ADDRESS_22', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 22","demo district 22"]'::jsonb),
  ('demo-outlet-23', 'DEMO-23', 'Demo Outlet 23', 'Demo 23', 'DEMO_OUTLET_ADDRESS_23', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 23","demo district 23"]'::jsonb),
  ('demo-outlet-24', 'DEMO-24', 'Demo Outlet 24', 'Demo 24', 'DEMO_OUTLET_ADDRESS_24', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 24","demo district 24"]'::jsonb),
  ('demo-outlet-25', 'DEMO-25', 'Demo Outlet 25', 'Demo 25', 'DEMO_OUTLET_ADDRESS_25', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 25","demo district 25"]'::jsonb),
  ('demo-outlet-26', 'DEMO-26', 'Demo Outlet 26', 'Demo 26', 'DEMO_OUTLET_ADDRESS_26', 'Demo City', 'Demo Province', 'ID', null, null, true, '["demo outlet 26","demo district 26"]'::jsonb)
on conflict (slug) do update
set
  code = excluded.code,
  name = excluded.name,
  short_label = excluded.short_label,
  address_line_1 = excluded.address_line_1,
  city = excluded.city,
  province = excluded.province,
  country_code = excluded.country_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  is_active = excluded.is_active,
  keywords = excluded.keywords;

with sushi_cake as (
  select id from public.categories where slug = 'sushi-cake'
)
insert into public.products (
  slug,
  sku,
  category_id,
  name,
  short_name,
  category,
  description,
  tagline,
  theme,
  price,
  serves,
  pieces,
  spicy_level,
  spice_score,
  is_featured,
  is_active,
  metadata
)
values
  (
    'sushicake-chisai',
    'SSC-CHISAI',
    (select id from sushi_cake),
    'Chisai',
    'Chisai',
    'Sushi Cake',
    'Cake sushi mungil untuk birthday surprise, quick celebration, atau comfort food fancy tapi tetap santai.',
    'Cute party starter',
    'salmon-sunrise',
    145000,
    '2-3 orang',
    29,
    'Mild',
    1,
    true,
    true,
    '{"highlight":"best for mini celebration"}'::jsonb
  ),
  (
    'sushicake-kawaii',
    'SSC-KAWAII',
    (select id from sushi_cake),
    'Kawaii',
    'Kawaii',
    'Sushi Cake',
    'Vibe paling playful untuk surprise manis dengan kombinasi creamy, spicy, dan crowd-pleasing.',
    'Birthday energy boost',
    'mango-pop',
    150000,
    '2-3 orang',
    31,
    'Medium',
    2,
    true,
    true,
    '{"highlight":"playful bestseller"}'::jsonb
  ),
  (
    'sushicake-kofuku',
    'SSC-KOFUKU',
    (select id from sushi_cake),
    'Kofuku',
    'Kofuku',
    'Sushi Cake',
    'Sushi cake rame-rame yang pas untuk kantor, keluarga besar, dan celebration table centerpiece.',
    'Party centerpiece',
    'wasabi-burst',
    300000,
    '5-6 orang',
    72,
    'Mixed',
    2,
    false,
    true,
    '{"highlight":"great for office sharing"}'::jsonb
  ),
  (
    'sushicake-oiwai',
    'SSC-OIWAI',
    (select id from sushi_cake),
    'Oiwai',
    'Oiwai',
    'Sushi Cake',
    'Pilihan premium yang terasa meriah, bold, dan cocok jadi hero product untuk momen spesial.',
    'Big celebration mode',
    'night-market',
    330000,
    '5-6 orang',
    72,
    'Bold',
    3,
    false,
    true,
    '{"highlight":"premium celebration"}'::jsonb
  )
on conflict (slug) do update
set
  sku = excluded.sku,
  category_id = excluded.category_id,
  name = excluded.name,
  short_name = excluded.short_name,
  category = excluded.category,
  description = excluded.description,
  tagline = excluded.tagline,
  theme = excluded.theme,
  price = excluded.price,
  serves = excluded.serves,
  pieces = excluded.pieces,
  spicy_level = excluded.spicy_level,
  spice_score = excluded.spice_score,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  metadata = excluded.metadata;

delete from public.product_items
where product_id in (
  select id
  from public.products
  where slug in ('sushicake-chisai', 'sushicake-kawaii', 'sushicake-kofuku', 'sushicake-oiwai')
);

insert into public.product_items (product_id, label, sort_order)
select p.id, item.label, item.sort_order
from public.products p
join (
  values
    ('sushicake-chisai', 'Salmon Mozza 8 pcs', 1),
    ('sushicake-chisai', 'Firecracker Roll / Cheesy Salmon Roll 5 pcs', 2),
    ('sushicake-chisai', 'Salmon Maki 8 pcs', 3),
    ('sushicake-chisai', 'Spicy Tuna Maki 8 pcs', 4),
    ('sushicake-kawaii', 'Salmon Mozza 5 pcs', 1),
    ('sushicake-kawaii', 'Cheesy Salmon Roll 5 pcs', 2),
    ('sushicake-kawaii', 'Spicy Tuna Roll 5 pcs', 3),
    ('sushicake-kawaii', 'Spicy Tuna Maki 8 pcs', 4),
    ('sushicake-kawaii', 'Salmon Maki 8 pcs', 5),
    ('sushicake-kofuku', 'Kani Tanuki Roll 8 pcs', 1),
    ('sushicake-kofuku', 'Salmon Mozza 8 pcs', 2),
    ('sushicake-kofuku', 'Cheesy Salmon Roll 8 pcs', 3),
    ('sushicake-kofuku', 'California Street Roll 8 pcs', 4),
    ('sushicake-kofuku', 'Tuna Mayo Maki 8 pcs', 5),
    ('sushicake-kofuku', 'Salmon Maki 8 pcs', 6),
    ('sushicake-kofuku', 'Tamago Maki 8 pcs', 7),
    ('sushicake-kofuku', 'Kani Maki 8 pcs', 8),
    ('sushicake-oiwai', 'Hebi Roll 8 pcs', 1),
    ('sushicake-oiwai', 'Crispy Unagi Roll 8 pcs', 2),
    ('sushicake-oiwai', 'Cheesy Salmon Roll 8 pcs', 3),
    ('sushicake-oiwai', 'Spicy Tuna Maki 8 pcs', 4),
    ('sushicake-oiwai', 'Salmon Maki 8 pcs', 5)
) as item(slug, label, sort_order)
  on item.slug = p.slug;
