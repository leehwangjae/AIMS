-- Migration: fix departments/programs schema + RLS 401 error
-- Run this in the Supabase SQL Editor.

-- 1. departments 테이블: 앱에서 실제 사용하는 컬럼 추가
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS bachelor  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS master    numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS doctor    numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nano      numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS note      text;

-- name 컬럼 NOT NULL 제약 해제 (앱이 department 컬럼을 사용하므로)
ALTER TABLE departments ALTER COLUMN name DROP NOT NULL;

-- 2. programs 테이블: has_plan, has_result_report 컬럼 추가
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS has_plan          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_result_report boolean DEFAULT false;

-- 3. RLS 정책 수정: anon(비로그인) 사용자도 읽기/쓰기 허용
--    (내부 전용 시스템이므로 anon key 소지자 = 내부 사용자로 간주)
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','programs','budget_allocations','budget_executions',
    'budget_allocation_history','documents','tasks','task_comments',
    'kpi_records','companies','departments','participants','audit_logs'
  ] loop
    execute format('drop policy if exists aims_internal_select on %I', t);
    execute format('drop policy if exists aims_internal_insert on %I', t);
    execute format('drop policy if exists aims_internal_update on %I', t);
    execute format('drop policy if exists aims_internal_delete on %I', t);
    -- anon + authenticated 모두 허용
    execute format('create policy aims_internal_select on %I for select using (auth.role() in (''authenticated'', ''anon''))', t);
    execute format('create policy aims_internal_insert on %I for insert with check (auth.role() in (''authenticated'', ''anon''))', t);
    execute format('create policy aims_internal_update on %I for update using (auth.role() in (''authenticated'', ''anon''))', t);
    execute format('create policy aims_internal_delete on %I for delete using (auth.role() in (''authenticated'', ''anon''))', t);
  end loop;
end $$;
