create table if not exists public.clarion_products (
  code text primary key,
  display_name text not null,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  duration_days integer not null default 15 check (duration_days > 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_label text not null default 'attempts',
  launch_url text not null,
  is_active boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clarion_product_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null references public.clarion_products(code),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','REVOKED')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  usage_limit integer,
  usage_used integer not null default 0 check (usage_used >= 0),
  source text not null default 'RAZORPAY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_code)
);

create table if not exists public.clarion_product_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null references public.clarion_products(code),
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  payment_status text not null default 'CREATED' check (payment_status in ('CREATED','PAID','FAILED','REFUNDED')),
  provider_response jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clarion_products enable row level security;
alter table public.clarion_product_entitlements enable row level security;
alter table public.clarion_product_payment_orders enable row level security;

revoke all on public.clarion_products from anon, authenticated;
revoke all on public.clarion_product_entitlements from anon, authenticated;
revoke all on public.clarion_product_payment_orders from anon, authenticated;

create index if not exists clarion_entitlements_user_product_idx
  on public.clarion_product_entitlements(user_id, product_code);
create index if not exists clarion_orders_user_created_idx
  on public.clarion_product_payment_orders(user_id, created_at desc);
