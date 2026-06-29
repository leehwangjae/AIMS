-- Migration: fix departments and programs table schema mismatch
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
