alter table public.oracy_share_invites
  add column if not exists access_duration_days integer not null default 7
  check (access_duration_days between 1 and 7);

alter table public.oracy_share_invites
  drop constraint if exists oracy_share_invites_scope_type_check;
alter table public.oracy_share_invites
  add constraint oracy_share_invites_scope_type_check
  check (scope_type in ('unit', 'level', 'selection'));

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
  v_access_expires_at timestamptz;
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

  v_access_expires_at := now() + make_interval(days => v_invite.access_duration_days);

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
    values (v_learner.id, v_unit, true, now(), v_access_expires_at)
    on conflict (learner_id, unit_no) do update
      set is_active = true,
          assigned_at = excluded.assigned_at,
          expires_at = case
            when oracy_unit_assignments.is_active is true
             and oracy_unit_assignments.expires_at is null then null
            else greatest(coalesce(oracy_unit_assignments.expires_at, now()), excluded.expires_at)
          end;
  end loop;

  insert into public.oracy_sessions (learner_id, token_hash, expires_at)
  values (v_learner.id, p_session_token_hash, least(p_session_expires_at, v_access_expires_at));

  update public.oracy_share_invites
  set status = 'redeemed', redeemed_at = now(), learner_id = v_learner.id
  where id = v_invite.id;

  return jsonb_build_object(
    'ok', true,
    'email', v_invite.email,
    'scope_label', v_invite.scope_label,
    'destination_path', v_invite.destination_path,
    'learner_id', v_learner.id,
    'session_expires_at', least(p_session_expires_at, v_access_expires_at),
    'access_expires_at', v_access_expires_at
  );
end;
$$;

revoke all on function public.oracy_redeem_share_invite(text, text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.oracy_redeem_share_invite(text, text, text, text, timestamptz)
  to service_role;
