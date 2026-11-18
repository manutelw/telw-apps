-- ORACY self sign-up: visitor accounts, known devices, emailed sign-in codes.
alter table public.oracy_learners add column if not exists self_registered boolean not null default false;
create table if not exists public.oracy_devices(
  learner_id text not null,
  device_hash text not null,
  created_at timestamptz not null default now(),
  primary key(learner_id,device_hash)
);
alter table public.oracy_devices enable row level security;
create table if not exists public.oracy_login_codes(
  id uuid primary key default gen_random_uuid(),
  learner_id text not null,
  device_hash text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.oracy_login_codes enable row level security;
