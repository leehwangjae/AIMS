-- AIMS 추가 SQL 2 (1회): 사업일정도 '본인 것만 수정/삭제'로 서버에서 강제
drop policy if exists aims_rec_write on public.aims_records;
create policy aims_rec_write on public.aims_records for all
  using (aims_is_approved() and case collection
          when 'indicators' then aims_is_admin()
          when 'budget' then aims_is_admin()
          else (owner_id=auth.uid() or aims_is_master()) end)
  with check (aims_is_approved() and case collection
          when 'indicators' then aims_is_admin()
          when 'budget' then aims_is_admin()
          else (owner_id=auth.uid() or aims_is_master()) end);
