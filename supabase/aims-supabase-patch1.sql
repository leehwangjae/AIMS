-- AIMS 추가 SQL (1회): 내 이름 변경 기능용 함수
create or replace function public.aims_set_my_name(n text) returns void language sql security definer set search_path=public as
$$ update public.aims_profiles set name = left(trim(n),40) where id = auth.uid() and length(trim(n))>0 $$;
grant execute on function public.aims_set_my_name(text) to authenticated;
