-- HISTÓRICO / NÃO EXECUTAR NO PROJETO ATUAL.
-- Esta proposta descreve profiles/candidate_profiles/vacancies que NÃO
-- correspondem ao Supabase em uso (usuarios/candidatos/areas/notificacoes).
-- Consulte docs/AUDITORIA_2026-10-05.md antes de planejar migrações.
-- ConectaRH / Supabase PostgreSQL: proposta antiga, preservada como referência.

create extension if not exists pgcrypto;

create type public.user_role as enum ('candidato','recrutador','gestor','administrador');
create type public.vacancy_status as enum ('rascunho','ativa','pausada','encerrada');
create type public.application_status as enum ('em_andamento','reprovado','contratado','desistiu');
create type public.interview_status as enum ('agendada','confirmada','realizada','cancelada','nao_compareceu');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role public.user_role not null default 'candidato',
  department text,
  position text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidate_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cpf text,
  birth_date date,
  gender text,
  nationality text,
  pcd_option text,
  pcd_description text,
  cep text,
  address text,
  address_number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  professional_title text,
  professional_summary text,
  desired_salary numeric(12,2),
  availability text,
  work_preference text,
  linkedin_url text,
  portfolio_url text,
  profile_progress integer not null default 0 check (profile_progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  document text,
  website text,
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.job_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  department text,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vacancies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  template_id uuid references public.job_templates(id) on delete set null,
  code text unique,
  title text not null,
  sector text,
  location text,
  work_model text,
  employment_type text,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  description text,
  status public.vacancy_status not null default 'rascunho',
  visibility text not null default 'publica',
  openings integer not null default 1,
  priority text default 'normal',
  recruiter_id uuid references public.profiles(id) on delete set null,
  manager_id uuid references public.profiles(id) on delete set null,
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vacancy_requirements (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references public.vacancies(id) on delete cascade,
  requirement text not null,
  is_required boolean not null default true,
  sort_order integer not null default 0
);

create table public.vacancy_benefits (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references public.vacancies(id) on delete cascade,
  benefit text not null,
  sort_order integer not null default 0
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references public.vacancies(id) on delete cascade,
  name text not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  unique(vacancy_id, sort_order)
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  name text not null default 'Currículo Geral',
  summary text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resume_experiences (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  role text not null,
  company text not null,
  modality text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  sort_order integer not null default 0
);

create table public.resume_education (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  degree text not null,
  institution text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  sort_order integer not null default 0
);

create table public.resume_skills (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  name text not null,
  level text,
  sort_order integer not null default 0
);

create table public.resume_languages (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  name text not null,
  level text,
  sort_order integer not null default 0
);

create table public.resume_portfolio (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  label text not null,
  url text not null,
  type text,
  sort_order integer not null default 0
);

create table public.resume_certificates (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  title text not null,
  institution text,
  year integer,
  description text,
  document_path text,
  sort_order integer not null default 0
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  vacancy_id uuid not null references public.vacancies(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  current_stage_id uuid references public.pipeline_stages(id) on delete set null,
  status public.application_status not null default 'em_andamento',
  match_score numeric(5,2),
  rejection_reason text,
  recruiter_id uuid references public.profiles(id) on delete set null,
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(candidate_id, vacancy_id)
);

create table public.application_stage_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_stage_id uuid references public.pipeline_stages(id) on delete set null,
  to_stage_id uuid references public.pipeline_stages(id) on delete set null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  note text not null,
  is_private boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.application_tasks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  title text not null,
  type text,
  status text not null default 'pending',
  deadline timestamptz,
  description text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer default 45,
  modality text,
  meeting_url text,
  location text,
  host_id uuid references public.profiles(id) on delete set null,
  status public.interview_status not null default 'agendada',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_participants (
  interview_id uuid references public.interviews(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  primary key(interview_id, profile_id)
);

create table public.interview_feedback (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  rating numeric(3,1),
  strengths text,
  concerns text,
  recommendation text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete cascade,
  name text not null,
  document_type text,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  status text default 'pending',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text,
  title text not null,
  message text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key(team_id, user_id)
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  granted boolean not null,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index applications_candidate_idx on public.applications(candidate_id);
create index applications_vacancy_idx on public.applications(vacancy_id);
create index applications_stage_idx on public.applications(current_stage_id);
create index notifications_user_unread_idx on public.notifications(user_id, read_at);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

-- Segurança: RLS deve ser habilitado antes do uso em produção.
alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_experiences enable row level security;
alter table public.resume_education enable row level security;
alter table public.resume_skills enable row level security;
alter table public.resume_languages enable row level security;
alter table public.resume_portfolio enable row level security;
alter table public.resume_certificates enable row level security;
alter table public.applications enable row level security;
alter table public.notifications enable row level security;
alter table public.consents enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id);
create policy "candidate own read" on public.candidate_profiles for select using (auth.uid() = user_id);
create policy "candidate own insert" on public.candidate_profiles for insert with check (auth.uid() = user_id);
create policy "candidate own update" on public.candidate_profiles for update using (auth.uid() = user_id);
create policy "resumes own access" on public.resumes for all using (auth.uid() = candidate_id) with check (auth.uid() = candidate_id);
create policy "applications candidate read" on public.applications for select using (auth.uid() = candidate_id);
create policy "applications candidate insert" on public.applications for insert with check (auth.uid() = candidate_id);
create policy "notifications own access" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications own update" on public.notifications for update using (auth.uid() = user_id);
create policy "consents own access" on public.consents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Observação: regras de recrutador/gestor/admin devem ser adicionadas via função has_role()
-- e policies específicas. Nunca confie apenas no frontend para RBAC.
