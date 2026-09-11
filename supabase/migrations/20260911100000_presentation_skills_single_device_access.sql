create table if not exists public.presentation_learners (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  login_id text not null,
  password_salt text not null,
  password_hash text not null,
  is_active boolean not null default true,
  device_generation bigint not null default 0,
  created_by_trainer_uuid uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists presentation_learners_login_lower_uidx on public.presentation_learners (lower(login_id));
create table if not exists public.presentation_sessions (
  token_hash text primary key,
  learner_id uuid not null references public.presentation_learners(id) on delete cascade,
  device_hash text not null,
  device_generation bigint not null,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists presentation_sessions_learner_idx on public.presentation_sessions (learner_id, created_at desc);
alter table public.presentation_learners enable row level security;
alter table public.presentation_sessions enable row level security;
revoke all on public.presentation_learners from public, anon, authenticated;
revoke all on public.presentation_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.presentation_learners to service_role;
grant select, insert, update, delete on public.presentation_sessions to service_role;
