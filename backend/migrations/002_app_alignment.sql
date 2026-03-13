-- Align runtime application entities with persistent schema for demo readiness

create table if not exists app_users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  password_hash text,
  created_at timestamptz default now()
);

create table if not exists enrollments (
  id uuid primary key,
  user_id uuid not null,
  topic text not null,
  module_id text not null,
  module_title text not null,
  difficulty text,
  created_at timestamptz default now()
);

create table if not exists module_instances (
  user_id uuid not null,
  module_id text not null,
  payload jsonb not null,
  updated_at timestamptz default now(),
  primary key (user_id, module_id)
);

create table if not exists module_progress (
  user_id uuid not null,
  module_id text not null,
  completed_lessons int default 0,
  completed_concepts int default 0,
  completed_chapters int default 0,
  quizzes_passed int default 0,
  streak_days int default 0,
  time_spent_minutes int default 0,
  last_activity timestamptz default now(),
  primary key (user_id, module_id)
);

create table if not exists exercise_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id text,
  exercise_id text not null,
  score int,
  created_at timestamptz default now()
);

create table if not exists quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id text,
  quiz_id text not null,
  score int,
  total int,
  created_at timestamptz default now()
);

alter table if exists mentor_conversations add column if not exists module_id text;

alter table app_users enable row level security;
alter table enrollments enable row level security;
alter table module_instances enable row level security;
alter table module_progress enable row level security;
alter table exercise_submissions enable row level security;
alter table quiz_submissions enable row level security;

create policy if not exists "users_can_access_own_app_users" on app_users
for all using (auth.uid() = id);

create policy if not exists "users_can_access_own_enrollments" on enrollments
for all using (auth.uid() = user_id);

create policy if not exists "users_can_access_own_module_instances" on module_instances
for all using (auth.uid() = user_id);

create policy if not exists "users_can_access_own_module_progress" on module_progress
for all using (auth.uid() = user_id);

create policy if not exists "users_can_access_own_exercise_submissions" on exercise_submissions
for all using (auth.uid() = user_id);

create policy if not exists "users_can_access_own_quiz_submissions" on quiz_submissions
for all using (auth.uid() = user_id);
