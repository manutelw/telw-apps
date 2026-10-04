alter table public.ascent_account_deletion_requests
  drop constraint if exists ascent_account_deletion_requests_student_uuid_fkey;

alter table public.ascent_account_deletion_requests
  alter column student_uuid drop not null;

alter table public.ascent_account_deletion_requests
  add constraint ascent_account_deletion_requests_student_uuid_fkey
  foreign key (student_uuid) references public.ascent_students(id) on delete set null;

alter table public.ascent_account_deletion_requests
  add column if not exists reviewed_by text,
  add column if not exists resolution_note text,
  add column if not exists learner_reference text;

create or replace function public.ascent_account_deletion_complete(
  p_request_id uuid,
  p_reviewed_by text,
  p_learner_reference text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_student uuid;
begin
  select student_uuid into v_student
  from public.ascent_account_deletion_requests
  where id=p_request_id and status='VERIFIED_PENDING_REVIEW'
  for update;
  if v_student is null then return jsonb_build_object('ok',false,'message','Verified pending request not found.'); end if;
  delete from public.ascent_app_issues where student_uuid=v_student;
  delete from public.ascent_dialogue_lab_attempts where student_uuid=v_student;
  delete from public.ascent_password_reset_requests where account_type='STUDENT' and account_uuid=v_student;
  update public.ascent_account_deletion_requests
    set status='COMPLETED',reviewed_at=now(),completed_at=now(),reviewed_by=p_reviewed_by,
        resolution_note='Deletion approved and completed',learner_reference=p_learner_reference,code_hash='COMPLETED'
    where id=p_request_id;
  delete from public.ascent_students where id=v_student;
  if found then return jsonb_build_object('ok',true,'message','Learner account and ASCENT learning data deleted.'); end if;
  raise exception 'Learner deletion did not complete';
end;
$$;
revoke all on function public.ascent_account_deletion_complete(uuid,text,text) from public, anon, authenticated;