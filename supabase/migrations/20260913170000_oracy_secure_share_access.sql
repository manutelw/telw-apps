create table if not exists public.oracy_share_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email) and length(email) between 3 and 320),
  scope_type text not null check (scope_type in ('unit', 'level')),
  scope_key text not null,
  scope_label text not null,
  unit_numbers integer[] not null check (cardinality(unit_numbers) > 0),
  destination_path text not null check (destination_path ~ '^/oracy/'),
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'sent', 'redeemed', 'expired', 'revoked', 'failed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  learner_id uuid references public.oracy_learners(id) on delete set null,
  email_provider_id text,
  error_message text
);

alter table public.oracy_share_invites enable row level security;
revoke all on public.oracy_share_invites from public, anon, authenticated;
grant all on public.oracy_share_invites to service_role;

create index if not exists oracy_share_invites_email_created_idx
  on public.oracy_share_invites (email, created_at desc);
create index if not exists oracy_share_invites_status_expiry_idx
  on public.oracy_share_invites (status, expires_at);
create index if not exists oracy_share_invites_learner_idx
  on public.oracy_share_invites (learner_id);

create or replace function public.oracy_redeem_share_invite(
  p_token_hash text,
  p_password_salt text,
  p_password_hash text,
  p_session_token_hash text,
  p_session_expires_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_invite public.oracy_share_invites%rowtype;
  v_learner public.oracy_learners%rowtype;
  v_unit integer;
begin
  select * into v_invite
  from public.oracy_share_invites
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'INVALID_INVITE');
  end if;
  if v_invite.status not in ('pending', 'sent') then
    return jsonb_build_object('ok', false, 'code', upper(v_invite.status));
  end if;
  if v_invite.expires_at <= now() then
    update public.oracy_share_invites set status = 'expired' where id = v_invite.id;
    return jsonb_build_object('ok', false, 'code', 'EXPIRED');
  end if;

  select * into v_learner
  from public.oracy_learners
  where lower(coalesce(email, '')) = v_invite.email
     or lower(login_id) = v_invite.email
  order by case when lower(coalesce(email, '')) = v_invite.email then 0 else 1 end
  limit 1
  for update;

  if not found then
    insert into public.oracy_learners
      (display_name, login_id, email, password_salt, password_hash, is_active, updated_at)
    values
      (split_part(v_invite.email, '@', 1), v_invite.email, v_invite.email,
       p_password_salt, p_password_hash, true, now())
    returning * into v_learner;
  elsif v_learner.is_active is not true then
    update public.oracy_learners
    set is_active = true, updated_at = now()
    where id = v_learner.id
    returning * into v_learner;
  end if;

  foreach v_unit in array v_invite.unit_numbers loop
    insert into public.oracy_unit_assignments
      (learner_id, unit_no, is_active, assigned_at, expires_at)
    values (v_learner.id, v_unit, true, now(), null)
    on conflict (learner_id, unit_no) do update
      set is_active = true, assigned_at = excluded.assigned_at, expires_at = null;
  end loop;

  insert into public.oracy_sessions (learner_id, token_hash, expires_at)
  values (v_learner.id, p_session_token_hash, p_session_expires_at);

  update public.oracy_share_invites
  set status = 'redeemed', redeemed_at = now(), learner_id = v_learner.id
  where id = v_invite.id;

  return jsonb_build_object(
    'ok', true,
    'email', v_invite.email,
    'scope_label', v_invite.scope_label,
    'destination_path', v_invite.destination_path,
    'learner_id', v_learner.id,
    'session_expires_at', p_session_expires_at
  );
end;
$$;

revoke all on function public.oracy_redeem_share_invite(text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.oracy_redeem_share_invite(text, text, text, text, timestamptz) to service_role;
