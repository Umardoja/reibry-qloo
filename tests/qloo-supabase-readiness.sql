-- Read-only catalog assertions. Run only against the positively identified,
-- explicitly approved reibry-qloo-test instance after all migrations.
begin read only;
do $$
begin
  if not exists(select 1 from pg_extension where extname = 'vector') then raise exception 'pgvector missing'; end if;
  if to_regclass('public.memories') is null or to_regclass('public.ready_packs') is null or to_regclass('public.ready_pack_discoveries') is null then raise exception 'Required tables missing'; end if;
  if to_regprocedure('public.save_taste_selection(uuid,uuid,jsonb,jsonb,uuid[])') is null then raise exception 'Taste RPC missing'; end if;
  if not exists(select 1 from pg_trigger where tgname = 'create_reibry_profile' and not tgisinternal) then raise exception 'Profile trigger missing'; end if;
  if has_table_privilege('authenticated','public.profiles','UPDATE') or has_column_privilege('authenticated','public.profiles','role','UPDATE') or has_table_privilege('authenticated','public.profiles','INSERT') then raise exception 'Profile privilege restriction failed'; end if;
  if not has_column_privilege('authenticated','public.profiles','display_name','UPDATE') then raise exception 'Profile editing unavailable'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('memories','ready_packs','ready_pack_discoveries') and not c.relrowsecurity) then raise exception 'Required RLS missing'; end if;
  if has_table_privilege('authenticated','public.ready_pack_discoveries','INSERT') or has_table_privilege('authenticated','public.ready_pack_discoveries','UPDATE') then raise exception 'Client discovery mutation allowed'; end if;
  if has_function_privilege('authenticated','public.save_taste_selection(uuid,uuid,jsonb,jsonb,uuid[])','EXECUTE') or has_function_privilege('anon','public.save_taste_selection(uuid,uuid,jsonb,jsonb,uuid[])','EXECUTE') then raise exception 'Client RPC execution allowed'; end if;
  if not has_function_privilege('service_role','public.save_taste_selection(uuid,uuid,jsonb,jsonb,uuid[])','EXECUTE') then raise exception 'Server RPC unavailable'; end if;
end $$;
select 'CATALOG_CHECKS_PASSED_NOT_E2E' as result;
rollback;
