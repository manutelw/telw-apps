create table if not exists public.product_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null check (product in ('ascent','cat','language')),
  active boolean not null default true,
  access_type text not null default 'paid' check (access_type in ('paid','institutional_free','manual','promo')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product)
);

alter table public.product_entitlements enable row level security;

create policy "Users can read own entitlements"
on public.product_entitlements
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists product_entitlements_user_product_idx
on public.product_entitlements(user_id, product);

comment on table public.product_entitlements is
'ClarionPrep product access. Authentication is shared; access remains product-specific.';
