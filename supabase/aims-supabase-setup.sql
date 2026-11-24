-- AIMS Supabase 초기 설정 v2 (SQL Editor에 통째로 붙여넣고 Run 한 번)
-- 기존 테이블과 이름이 겹치지 않도록 aims_ 접두어를 사용합니다. 여러 번 실행해도 안전합니다.

-- 0) 이전 시도/스타터 템플릿 잔여물 정리
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists aims_on_auth_user_created on auth.users;

-- 1) 사용자 프로필
create table if not exists public.aims_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login_id text unique not null,
  name text not null,
  role text not null default 'staff' check (role in ('master','professor','staff')),
  is_admin boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) 모든 데이터 (컬렉션별 1행 = 1건)
create table if not exists public.aims_records (
  collection text not null,
  id text not null,
  owner_id uuid,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
create index if not exists aims_records_col_idx on public.aims_records (collection);

-- 3) 권한 판별 함수
create or replace function public.aims_is_approved() returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select approved from public.aims_profiles where id=auth.uid()),false) $$;
create or replace function public.aims_is_master() returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select approved and role='master' from public.aims_profiles where id=auth.uid()),false) $$;
create or replace function public.aims_is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select approved and (role='master' or is_admin) from public.aims_profiles where id=auth.uid()),false) $$;

-- 4) 가입 시 프로필 자동 생성 (항상 '승인 대기 · 일반 권한'으로 시작)
create or replace function public.aims_handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.aims_profiles (id, login_id, name, role, is_admin, approved)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'login_id', split_part(new.email,'@',1)),
          coalesce(new.raw_user_meta_data->>'name','이름없음'),
          case when new.raw_user_meta_data->>'role'='professor' then 'professor' else 'staff' end,
          false, false);
  return new;
end $$;
create trigger aims_on_auth_user_created after insert on auth.users for each row execute function public.aims_handle_new_user();

-- 5) 보안 정책 (RLS)
alter table public.aims_profiles enable row level security;
alter table public.aims_records enable row level security;

drop policy if exists aims_prof_select on public.aims_profiles;
create policy aims_prof_select on public.aims_profiles for select using (id=auth.uid() or aims_is_approved());
drop policy if exists aims_prof_update on public.aims_profiles;
create policy aims_prof_update on public.aims_profiles for update using (aims_is_master()) with check (aims_is_master());
drop policy if exists aims_prof_delete on public.aims_profiles;
create policy aims_prof_delete on public.aims_profiles for delete using (aims_is_master());

drop policy if exists aims_rec_select on public.aims_records;
create policy aims_rec_select on public.aims_records for select using (aims_is_approved());
drop policy if exists aims_rec_write on public.aims_records;
create policy aims_rec_write on public.aims_records for all
  using (aims_is_approved() and case collection
          when 'indicators' then aims_is_admin()
          when 'budget' then aims_is_admin()
          when 'events' then true
          else (owner_id=auth.uid() or aims_is_master()) end)
  with check (aims_is_approved() and case collection
          when 'indicators' then aims_is_admin()
          when 'budget' then aims_is_admin()
          when 'events' then true
          else (owner_id=auth.uid() or aims_is_master()) end);

-- 6) 실시간 반영 (이미 등록돼 있으면 오류가 나도 무시해도 됩니다)
do $$ begin
  begin alter publication supabase_realtime add table public.aims_records; exception when others then null; end;
  begin alter publication supabase_realtime add table public.aims_profiles; exception when others then null; end;
end $$;

-- 7) (가입 후 1회) 마스터 지정: 'admin' 대신 본인이 가입한 아이디를 넣고 실행
-- update public.aims_profiles set role='master', approved=true, is_admin=true where login_id='admin';
