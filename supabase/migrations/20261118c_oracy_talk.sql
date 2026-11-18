-- ORACY Talk practice: monthly count of conversation turns.
alter table public.oracy_usage add column if not exists talk_turns integer not null default 0;
