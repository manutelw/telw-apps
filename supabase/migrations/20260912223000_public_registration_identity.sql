alter table public.clarion_public_users
  add column if not exists institution_name text;

alter table public.clarion_public_users
  add column if not exists roll_number text;

create unique index if not exists clarion_public_users_institution_roll_unique
  on public.clarion_public_users (lower(institution_name), upper(roll_number))
  where institution_name is not null and roll_number is not null;
