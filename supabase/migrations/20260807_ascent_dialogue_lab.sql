-- ASCENT Dialogue Lab — staging-only migration
-- Run this only in a separate Supabase staging project or persistent branch.
-- It intentionally creates no relationship with live ASCENT student, task,
-- assignment, submission, score, email or leaderboard tables.

begin;

create extension if not exists pgcrypto;

create table if not exists public.ascent_lab_feature_flags (
  flag_key text primary key,
  enabled boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

insert into public.ascent_lab_feature_flags(flag_key, enabled, notes)
values ('DIALOGUE_LAB', true, 'Private protected test module only')
on conflict (flag_key) do update
set notes = excluded.notes,
    updated_at = now();

create table if not exists public.ascent_lab_scenario_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  active boolean not null default true,
  source_type text not null check (source_type in ('EXISTING_ASCENT','NEW_WORKPLACE')),
  practice_type text not null check (practice_type in ('STUDENT_QA','STUDENT_INTERVIEW','WORKPLACE_DIALOGUE')),
  profile_key text,
  level_key text,
  topic_key text not null,
  title text not null,
  competency text not null,
  ai_role text not null,
  base_situation text not null,
  base_opening text not null,
  stakes text not null,
  pressure_point text not null,
  approved_followup_paths jsonb not null default '[]'::jsonb,
  scoring_criteria jsonb not null default '[]'::jsonb,
  tone_limits jsonb not null default '[]'::jsonb,
  expected_response_elements jsonb not null default '[]'::jsonb,
  variation_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ascent_lab_scenario_lookup_idx
on public.ascent_lab_scenario_templates(practice_type, topic_key, profile_key, level_key)
where active = true;

create table if not exists public.ascent_lab_sessions (
  id uuid primary key default gen_random_uuid(),
  tester_email text not null,
  scenario_template_id uuid not null references public.ascent_lab_scenario_templates(id),
  practice_type text not null,
  profile_key text,
  level_key text,
  difficulty text not null check (difficulty in ('GUIDED','REALISTIC','PRESSURE')),
  topic_key text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','READY_FOR_EVALUATION','COMPLETED','ABANDONED')),
  max_learner_turns integer not null check (max_learner_turns between 1 and 3),
  title text not null,
  situation_summary text not null,
  scenario_snapshot jsonb not null,
  model_opening text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ascent_lab_sessions_tester_idx
on public.ascent_lab_sessions(tester_email, created_at desc);

create table if not exists public.ascent_lab_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ascent_lab_sessions(id) on delete cascade,
  turn_index integer not null,
  speaker text not null check (speaker in ('AI','LEARNER')),
  turn_kind text not null check (turn_kind in ('OPENING','ANSWER','FOLLOW_UP','FINAL_CHALLENGE')),
  text text not null,
  analysis jsonb not null default '{}'::jsonb,
  model_name text,
  created_at timestamptz not null default now(),
  unique(session_id, turn_index)
);

create index if not exists ascent_lab_turns_session_idx
on public.ascent_lab_turns(session_id, turn_index);

create table if not exists public.ascent_lab_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.ascent_lab_sessions(id) on delete cascade,
  tester_email text not null,
  overall_score numeric(4,2) not null check (overall_score between 0 and 10),
  criterion_scores jsonb not null,
  strengths jsonb not null,
  weaknesses jsonb not null,
  concern_answer text not null,
  professional_impression text not null,
  missed_evidence text not null,
  improved_response text not null,
  practice_instruction text not null,
  transcript jsonb not null,
  model_name text,
  created_at timestamptz not null default now()
);

create index if not exists ascent_lab_results_tester_idx
on public.ascent_lab_results(tester_email, created_at desc);

alter table public.ascent_lab_feature_flags enable row level security;
alter table public.ascent_lab_scenario_templates enable row level security;
alter table public.ascent_lab_sessions enable row level security;
alter table public.ascent_lab_turns enable row level security;
alter table public.ascent_lab_results enable row level security;

-- Deliberately create no anon/authenticated policies.
-- The Cloudflare backend uses the staging service role and enforces the Access email.
revoke all on table public.ascent_lab_feature_flags from anon, authenticated;
revoke all on table public.ascent_lab_scenario_templates from anon, authenticated;
revoke all on table public.ascent_lab_sessions from anon, authenticated;
revoke all on table public.ascent_lab_turns from anon, authenticated;
revoke all on table public.ascent_lab_results from anon, authenticated;

-- -------------------------------------------------------------------------
-- Approved scenario seeds: 7 developed from existing ASCENT questions and
-- 3 new workplace scenarios. The system varies surface details but keeps the
-- competency, follow-up paths, expected elements and scoring criteria fixed.
-- -------------------------------------------------------------------------

insert into public.ascent_lab_scenario_templates
(code, source_type, practice_type, profile_key, level_key, topic_key, title, competency, ai_role, base_situation, base_opening, stakes, pressure_point, approved_followup_paths, scoring_criteria, tone_limits, expected_response_elements, variation_fields)
values
('SQ_SELF_POSITIONING_MBA','EXISTING_ASCENT','STUDENT_QA',null,null,'SELF_POSITIONING','Position Yourself Clearly','state a relevant professional identity with proof and direction','interviewer','An MBA learner is asked for a concise professional introduction.','Tell me about yourself.','medium','The answer must avoid becoming a life story.',
 '["Ask for one role-relevant strength","Ask for one proof point","Ask for the target role"]',
 '["Structure and Clarity","Relevance","Evidence","Communication and Professionalism","Composure"]',
 '["professional","calm","no praise before evaluation","no invented learner facts"]',
 '["current professional identity","one relevant strength","specific proof","future direction"]',
 '["industry","target role","interviewer tone","organisation type"]'),

('SQ_PROJECT_BTECH','EXISTING_ASCENT','STUDENT_QA','BTECH',null,'PROJECTS','Explain a Technical Project','explain a project through personal action, evidence and relevance','recruiter','A BTech learner must explain one project contribution.','Tell me about a project you are proud of.','medium','The response must distinguish personal contribution from team output.',
 '["Ask what the learner personally did","Ask for evidence of impact","Ask what changed after the work"]',
 '["Structure and Clarity","Relevance","Evidence","Communication and Professionalism","Composure"]',
 '["professional","curious","not hostile"]',
 '["project purpose","personal action","result or evidence","learning or relevance"]',
 '["project type","industry","technical constraint","team size"]'),

('SQ_PROJECT_ARCH','EXISTING_ASCENT','STUDENT_QA','ARCHITECTURE',null,'PROJECTS','Explain a Design Project','explain a design decision, process and evidence','reviewer','An architecture learner must explain a design or studio project.','Describe one design project that best shows how you think.','medium','The learner must explain the decision rather than only describing the final design.',
 '["Ask why that design choice was made","Ask about a constraint","Ask what evidence informed the decision"]',
 '["Structure and Clarity","Relevance","Evidence","Communication and Professionalism","Composure"]',
 '["professional","analytical","not theatrical"]',
 '["brief or problem","design decision","constraint","evidence","outcome or learning"]',
 '["project scale","client type","site constraint","reviewer tone"]'),

('SI_MISTAKE_ANY','EXISTING_ASCENT','STUDENT_INTERVIEW',null,null,'MISTAKES','Own a Mistake','show ownership, corrective action and process change','interviewer','The learner is asked about a genuine mistake.','Tell me about a mistake you made.','high','The interviewer challenges whether the mistake should have been caught earlier.',
 '["Why did you not catch it earlier?","What did you personally do to correct it?","What changed in your process afterwards?"]',
 '["Structure and Clarity","Content Depth and Evidence","Listening and Responsiveness","Business Thinking","Communication and Professionalism","Composure Under Pressure","Recovery and Adaptation"]',
 '["firm but fair","no humiliation","no accusation beyond the scenario"]',
 '["clear mistake","ownership","correction","impact","prevention or process change"]',
 '["project","deadline","stakeholder","error type","urgency"]'),

('SI_HIRE_MBA','EXISTING_ASCENT','STUDENT_INTERVIEW','MBA',null,'SELF_POSITIONING','Defend Your Fit','connect strengths and evidence to a role','recruiter','An MBA learner is asked why the organisation should select them.','Why should we hire you for this role?','high','The recruiter challenges broad claims and asks for proof.',
 '["Which strength matters most here?","What evidence supports that claim?","What gap would you still need to close?"]',
 '["Structure and Clarity","Content Depth and Evidence","Listening and Responsiveness","Business Thinking","Communication and Professionalism","Composure Under Pressure","Recovery and Adaptation"]',
 '["sceptical but professional","no personal attack"]',
 '["role need","relevant strength","specific evidence","balanced self-awareness","direction"]',
 '["role","industry","company type","business priority"]'),

('SI_CONFLICTING_PRIORITIES','EXISTING_ASCENT','STUDENT_INTERVIEW',null,null,'DEADLINES','Manage Conflicting Priorities','prioritise work and communicate trade-offs','manager','The learner must describe or handle competing deadlines.','Tell me about a time you had conflicting priorities.','high','A later question tests the logic behind the priority decision.',
 '["How did you decide what came first?","Who did you inform and when?","What risk did your choice create?"]',
 '["Structure and Clarity","Content Depth and Evidence","Listening and Responsiveness","Business Thinking","Communication and Professionalism","Composure Under Pressure","Recovery and Adaptation"]',
 '["direct","professional","not aggressive"]',
 '["competing demands","decision criteria","stakeholder communication","trade-off","result"]',
 '["deadlines","stakeholders","resource constraint","project type"]'),

('SI_CONFIDENTIALITY','EXISTING_ASCENT','STUDENT_INTERVIEW',null,null,'ETHICS','Handle Confidential Information','apply judgement, boundaries and escalation','interviewer','The learner faces a confidentiality question.','How would you handle confidential information in your role?','high','The follow-up introduces pressure from a colleague or senior person.',
 '["What would you do if a senior asked for it informally?","Where would you seek guidance?","How would you protect the relationship while refusing?"]',
 '["Structure and Clarity","Content Depth and Evidence","Listening and Responsiveness","Business Thinking","Communication and Professionalism","Composure Under Pressure","Recovery and Adaptation"]',
 '["professional","testing judgement","no illegal instruction"]',
 '["boundary","verification","policy or authorised channel","escalation","professional wording"]',
 '["information type","requester role","urgency","organisation type"]'),

('WL_DELAY_MANAGER','NEW_WORKPLACE','WORKPLACE_DIALOGUE',null,null,'CRISIS_DELAY_UPDATES','Communicate a Delay Early','state a delay clearly, own it, explain impact and propose recovery','senior manager','A manager must report a deliverable that will miss an agreed deadline.','The client deliverable was due this afternoon. Why is it still incomplete?','high','A client review is close and the senior manager needs a reliable recovery plan.',
 '["What is the actual impact?","What can still be delivered today?","What decision or support do you need?","Why was this not raised earlier?"]',
 '["Issue Clarity","Ownership","Judgement","Stakeholder Awareness","Options and Recommendation","Professional Language","Composure","Decision or Next-Step Clarity"]',
 '["firm","impatient but professional","never insulting"]',
 '["early clear update","ownership","cause without excuse","impact","recovery options","recommendation","next checkpoint"]',
 '["industry","deliverable","client review time","cause","available options"]'),

('WL_CLIENT_PROFESSIONAL','NEW_WORKPLACE','WORKPLACE_DIALOGUE',null,null,'CLIENT_COMMUNICATION','Handle an Unhappy Client','acknowledge concern, clarify facts and state a practical next step','unhappy client','A professional receives a complaint about delayed or inaccurate work.','This is the second time the update has been late. Why should I trust the next commitment?','high','The client is dissatisfied but must remain realistic and professional.',
 '["What exactly will you do next?","When will I receive the corrected work?","How will you prevent another failure?"]',
 '["Issue Clarity","Ownership","Judgement","Stakeholder Awareness","Options and Recommendation","Professional Language","Composure","Decision or Next-Step Clarity"]',
 '["demanding but professional","no insults","no threats"]',
 '["acknowledgement","ownership","facts","specific correction","time commitment","prevention"]',
 '["service type","client sector","error","deadline","relationship length"]'),

('WL_BOARD_CXO','NEW_WORKPLACE','WORKPLACE_DIALOGUE',null,'CXO','LEADERSHIP_COMMUNICATION','Respond to Board-Level Challenge','communicate risk, recommendation, trade-offs and required decision','board member','A CXO must answer a board challenge about a missed target or strategic risk.','The target has been missed again. Why should the board support your current plan?','very high','The board wants a decision, not a defensive explanation.',
 '["What assumption has proved wrong?","Which option do you recommend now?","What are the downside risks?","What decision do you need from the board today?"]',
 '["Issue Clarity","Ownership","Judgement","Stakeholder Awareness","Options and Recommendation","Professional Language","Composure","Decision or Next-Step Clarity"]',
 '["challenging","board-level","professional","no theatrics","no personal attack"]',
 '["clear issue","ownership","evidence","options","recommendation","risk","decision request","next milestone"]',
 '["industry","target","strategic assumption","options","board concern"]')
on conflict (code) do update set
  active = excluded.active,
  source_type = excluded.source_type,
  practice_type = excluded.practice_type,
  profile_key = excluded.profile_key,
  level_key = excluded.level_key,
  topic_key = excluded.topic_key,
  title = excluded.title,
  competency = excluded.competency,
  ai_role = excluded.ai_role,
  base_situation = excluded.base_situation,
  base_opening = excluded.base_opening,
  stakes = excluded.stakes,
  pressure_point = excluded.pressure_point,
  approved_followup_paths = excluded.approved_followup_paths,
  scoring_criteria = excluded.scoring_criteria,
  tone_limits = excluded.tone_limits,
  expected_response_elements = excluded.expected_response_elements,
  variation_fields = excluded.variation_fields,
  updated_at = now();

commit;
