-- Isolated request ledger for verified ASCENT account-deletion requests.
-- This migration does not delete or alter learner records.
create table if not exists public.ascent_account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  student_uuid uuid not null references public.ascent_students(id) on delete restrict,
  requested_email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  status text not null default 'PENDING_VERIFICATION'
    check (status in ('PENDING_VERIFICATION','VERIFIED_PENDING_REVIEW','CANCELLED','COMPLETED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  completed_at timestamptz
);

create index if not exists ascent_account_deletion_requests_student_idx
  on public.ascent_account_deletion_requests(student_uuid, requested_at desc);

create index if not exists ascent_account_deletion_requests_email_idx
  on public.ascent_account_deletion_requests(lower(requested_email), requested_at desc);

alter table public.ascent_account_deletion_requests enable row level security;

revoke all on table public.ascent_account_deletion_requests from public, anon, authenticated;
