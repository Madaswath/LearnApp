create extension if not exists vector;

create table if not exists users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text
);

create table if not exists learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  topic_id uuid,
  title text not null,
  level text,
  created_at timestamptz default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null,
  title text not null,
  level text,
  sort_order int default 0
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null,
  title text not null,
  content text,
  embedding vector(1536)
);

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null,
  prompt text not null,
  difficulty text,
  solution text
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null,
  title text not null,
  questions jsonb not null
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null,
  title text not null,
  brief text,
  rubric jsonb
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null,
  kind text,
  url text,
  summary text
);

create table if not exists mentor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  learning_path_id uuid,
  question text,
  answer text,
  context_sources jsonb,
  created_at timestamptz default now()
);

create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  learning_path_id uuid not null,
  lesson_id uuid,
  exercise_id uuid,
  quiz_id uuid,
  score numeric,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  learning_path_id uuid,
  metric_name text not null,
  metric_value numeric,
  captured_at timestamptz default now()
);

create table if not exists skill_gaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  learning_path_id uuid,
  gap_name text,
  severity int,
  detected_at timestamptz default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  learning_path_id uuid,
  recommendation text,
  created_at timestamptz default now()
);

create table if not exists learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  learning_path_id uuid,
  duration_minutes int,
  engagement_score numeric,
  created_at timestamptz default now()
);

alter table learning_paths enable row level security;
alter table chapters enable row level security;
alter table lessons enable row level security;
alter table exercises enable row level security;
alter table quizzes enable row level security;
alter table projects enable row level security;
alter table resources enable row level security;
alter table mentor_conversations enable row level security;
alter table user_progress enable row level security;
alter table analytics enable row level security;
alter table skill_gaps enable row level security;
alter table recommendations enable row level security;
alter table learning_sessions enable row level security;

create policy "users_can_access_own_learning_paths" on learning_paths
for all using (auth.uid() = user_id);

create policy "users_can_access_own_progress" on user_progress
for all using (auth.uid() = user_id);

create policy "users_can_access_own_conversations" on mentor_conversations
for all using (auth.uid() = user_id);

create index if not exists idx_lessons_embedding on lessons using ivfflat (embedding vector_cosine_ops);
