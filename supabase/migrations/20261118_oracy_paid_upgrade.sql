-- ORACY paid upgrade (₹2,999 for 30 days): expiry date, conversation minutes, payments.
alter table public.oracy_learners add column if not exists full_access_until timestamptz;
alter table public.oracy_usage add column if not exists conversation_seconds integer not null default 0;
create table if not exists public.oracy_payments(
  order_id text primary key,
  learner_id text not null,
  amount integer not null,
  status text not null default 'created',
  payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.oracy_payments enable row level security;
create table if not exists public.oracy_conversations(
  id uuid primary key default gen_random_uuid(),
  learner_id text not null,
  started_at timestamptz not null default now(),
  granted_seconds integer not null,
  used_seconds integer,
  ended_at timestamptz
);
alter table public.oracy_conversations enable row level security;
