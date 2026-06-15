-- AIMS Supabase schema
-- Run this file in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id text primary key,
  name text not null,
  email text,
  role text not null default 'VIEWER',
  department text,
  unit_task_id text,
  unit_task_ids text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists programs (
  id text primary key,
  unit_task_id text,
  track_id text,
  name text not null,
  type text,
  linked_kpi text,
  faculty text,
  company_names text,
  start_date date,
  end_date date,
  participants numeric default 0,
  budget numeric default 0,
  status text,
  location text,
  target text,
  expected_recognized numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists budget_allocations (
  id text primary key,
  base_item_id text,
  unit_task_id text not null,
  track_id text,
  fund_type text not null default 'CURRENT',
  rise_category text not null,
  erp_item text,
  allocated numeric not null default 0,
  allocation_type text,
  detail text,
  status text default 'ACTIVE',
  source text default 'custom',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists budget_executions (
  id text primary key,
  unit_task_id text not null,
  budget_item_id text,
  track_id text,
  fund_type text not null default 'CURRENT',
  category text,
  erp_item text,
  program_name text,
  allocated numeric default 0,
  executed numeric not null default 0,
  execution_date date,
  execution_rate text,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists budget_allocation_history (
  id text primary key,
  unit_task_id text,
  budget_item_id text,
  track_id text,
  fund_type text,
  changed_at text,
  action text,
  rise_category text,
  previous_allocated numeric default 0,
  next_allocated numeric default 0,
  diff numeric default 0,
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists documents (
  id text primary key,
  category text,
  unit_task_id text,
  track_id text,
  program_name text,
  title text,
  status text,
  file_name text,
  file_size text,
  file_type text,
  file_path text,
  file_data_url text,
  uploaded_at text,
  uploaded_by text,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id text primary key,
  title text not null,
  unit_task_id text,
  track_id text,
  owner text,
  due_date date,
  status text,
  progress numeric default 0,
  priority text,
  type text,
  description text,
  issue text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists task_comments (
  id text primary key,
  task_id text references tasks(id) on delete cascade,
  author text,
  author_role text,
  comment text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists kpi_records (
  id text primary key,
  unit_task_id text,
  track_id text,
  kpi_type text,
  value numeric default 0,
  raw_value numeric default 0,
  recognized_value numeric default 0,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists companies (
  id text primary key,
  unit_task_id text,
  track_id text,
  name text not null,
  type text,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists departments (
  id text primary key,
  unit_task_id text,
  track_id text,
  name text not null,
  student_count numeric default 0,
  graduate_count numeric default 0,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists participants (
  id text primary key,
  unit_task_id text,
  track_id text,
  name text not null,
  role text,
  contract_date date,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  action text not null,
  table_name text,
  row_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table programs enable row level security;
alter table budget_allocations enable row level security;
alter table budget_executions enable row level security;
alter table budget_allocation_history enable row level security;
alter table documents enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table kpi_records enable row level security;
alter table companies enable row level security;
alter table departments enable row level security;
alter table participants enable row level security;
alter table audit_logs enable row level security;

-- MVP internal beta policy: authenticated users can read/write.
-- Tighten these policies after Supabase Auth user mapping is finalized.
do $$
declare
  t text;
begin
  foreach t in array array['profiles','programs','budget_allocations','budget_executions','budget_allocation_history','documents','tasks','task_comments','kpi_records','companies','departments','participants','audit_logs'] loop
    execute format('drop policy if exists aims_internal_select on %I', t);
    execute format('drop policy if exists aims_internal_insert on %I', t);
    execute format('drop policy if exists aims_internal_update on %I', t);
    execute format('drop policy if exists aims_internal_delete on %I', t);
    execute format('create policy aims_internal_select on %I for select using (auth.role() = ''authenticated'')', t);
    execute format('create policy aims_internal_insert on %I for insert with check (auth.role() = ''authenticated'')', t);
    execute format('create policy aims_internal_update on %I for update using (auth.role() = ''authenticated'')', t);
    execute format('create policy aims_internal_delete on %I for delete using (auth.role() = ''authenticated'')', t);
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('aims-documents', 'aims-documents', false)
on conflict (id) do nothing;
