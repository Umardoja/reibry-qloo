\set ON_ERROR_STOP on
-- Disposable local PostgreSQL only. Minimal foundation matches the relevant contracts.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated, anon, service_role;
create table auth.users(id uuid primary key);
create table public.profiles(id uuid primary key default gen_random_uuid(), user_id uuid unique references auth.users(id), display_name text, onboarding_completed_at timestamptz, updated_at timestamptz default now(), role text not null default 'user');
grant select,insert,update,delete on public.profiles to authenticated;
create table public.memories(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),unique(id,user_id));
create table public.life_contexts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),type text,title text,status text,unique(id,user_id));
\ir ../supabase/migrations/20260925000000_ready_packs.sql
\ir ../supabase/migrations/20260926000000_ready_pack_uniqueness.sql
\ir ../supabase/migrations/20261025000000_profile_privileges.sql
\ir ../supabase/migrations/20261025000001_taste_discoveries.sql
insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.memories(id,user_id) values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002');
do $$ begin
  if has_table_privilege('authenticated','public.profiles','UPDATE') or has_column_privilege('authenticated','public.profiles','role','UPDATE') or has_table_privilege('authenticated','public.profiles','INSERT') then raise exception 'Profile escalation remains'; end if;
  if not has_column_privilege('authenticated','public.profiles','display_name','UPDATE') then raise exception 'Profile editing broken'; end if;
  if has_function_privilege('authenticated','public.save_taste_selection(uuid,uuid,jsonb,jsonb,uuid[])','EXECUTE') or has_function_privilege('anon','public.save_taste_selection(uuid,uuid,jsonb,jsonb,uuid[])','EXECUTE') then raise exception 'RPC is not server owned'; end if;
end $$;
set role service_role;
select public.save_taste_selection('00000000-0000-4000-8000-000000000001',null,'{"entity_id":"10000000-0000-4000-8000-000000000001","name":"Synthetic Film","types":["urn:entity:movie"]}','[{"name":"Synthetic Interest"}]',array['00000000-0000-4000-8000-000000000003']::uuid[]);
select public.save_taste_selection('00000000-0000-4000-8000-000000000001',null,'{"entity_id":"10000000-0000-4000-8000-000000000001","name":"Synthetic Film","types":["urn:entity:movie"]}','[{"name":"Synthetic Interest"}]',array['00000000-0000-4000-8000-000000000003']::uuid[]);
reset role;
do $$ declare pack uuid; before_count integer; begin
  if (select count(*) from public.ready_packs) <> 1 or (select count(*) from public.life_contexts) <> 1 or (select count(*) from public.ready_pack_discoveries) <> 1 then raise exception 'Duplicate prevention failed'; end if;
  if (select count(*) from public.ready_pack_items) <> 0 then raise exception 'External entity inserted as Memory'; end if;
  select id into pack from public.ready_packs limit 1;
  begin
    perform public.save_taste_selection('00000000-0000-4000-8000-000000000002',pack,'{"entity_id":"10000000-0000-4000-8000-000000000002","name":"Synthetic Film","types":["urn:entity:movie"]}','[{}]',array['00000000-0000-4000-8000-000000000004']::uuid[]);
    raise exception 'Cross-user pack accepted';
  exception when raise_exception then if sqlerrm = 'Cross-user pack accepted' then raise; end if; end;
  begin
    perform public.save_taste_selection('00000000-0000-4000-8000-000000000002',null,'{"entity_id":"10000000-0000-4000-8000-000000000002","name":"Synthetic Film","types":["urn:entity:movie"]}','[{}]',array['00000000-0000-4000-8000-000000000003']::uuid[]);
    raise exception 'Cross-user Memory accepted';
  exception when raise_exception then if sqlerrm = 'Cross-user Memory accepted' then raise; end if; end;
  select count(*) into before_count from public.life_contexts;
  begin
    perform public.save_taste_selection('00000000-0000-4000-8000-000000000002',null,'{"entity_id":"invalid-uuid","name":"Synthetic Film","types":["urn:entity:movie"]}','[{}]',array['00000000-0000-4000-8000-000000000004']::uuid[]);
    raise exception 'Malformed entity saved';
  exception when invalid_text_representation then null; end;
  if (select count(*) from public.life_contexts) <> before_count then raise exception 'Atomic rollback failed'; end if;
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$ begin if (select count(*) from public.ready_pack_discoveries) <> 0 then raise exception 'RLS cross-user read'; end if; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$ begin if (select count(*) from public.ready_pack_discoveries) <> 1 then raise exception 'Owner reload failed'; end if; end $$;
reset role;
select 'QLOO_DATABASE_TESTS_PASSED' as result;
