begin;
create table public.ready_pack_discoveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ready_pack_id uuid not null,
  entity_id uuid not null,
  entity jsonb not null check (jsonb_typeof(entity) = 'object' and entity->>'entity_id' = entity_id::text),
  interests jsonb not null check (jsonb_typeof(interests) = 'array'),
  provenance text not null default 'qloo-live' check (provenance = 'qloo-live'),
  created_at timestamptz not null default now(),
  unique (ready_pack_id, entity_id),
  foreign key (ready_pack_id, user_id) references public.ready_packs(id, user_id) on delete cascade
);
alter table public.ready_pack_discoveries enable row level security;
create policy taste_owner_read on public.ready_pack_discoveries for select to authenticated using (user_id = auth.uid());
grant select on public.ready_pack_discoveries to authenticated;
revoke insert, update, delete on public.ready_pack_discoveries from authenticated, anon;

-- Atomic transaction, auth.uid() ownership checks, concurrency-safe default pack.
-- The API verifies the signed Qloo receipt before invoking this narrow function.
create function public.save_taste_selection(p_user_id uuid, p_pack_id uuid, p_entity jsonb, p_interests jsonb, p_memory_ids uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := p_user_id; pack_id uuid := p_pack_id; context_id uuid;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if cardinality(p_memory_ids) not between 1 and 5 or p_memory_ids is null
     or (select count(distinct id) from public.memories where user_id = owner_id and id = any(p_memory_ids)) <> cardinality(p_memory_ids)
     then raise exception 'Invalid owned memories'; end if;
  if p_entity is null or p_interests is null or jsonb_typeof(p_entity) <> 'object'
     or coalesce(length(p_entity->>'name'), 0) not between 1 and 500
     or not coalesce(p_entity->'types' @> '["urn:entity:movie"]'::jsonb, false)
     or jsonb_typeof(p_interests) <> 'array' or jsonb_array_length(p_interests) not between 1 and 5
     then raise exception 'Invalid entity'; end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text || ':taste', 0));
  if pack_id is null then
    select p.id into pack_id from public.ready_packs p join public.life_contexts l on l.id = p.life_context_id and l.user_id = owner_id
      where p.user_id = owner_id and p.status = 'active' and p.pack_type = 'event' and l.status = 'active' and l.title = 'Movie night' order by p.created_at limit 1;
    if pack_id is null then
      insert into public.life_contexts(user_id,type,title,status) values(owner_id,'event','Movie night','active') returning id into context_id;
      insert into public.ready_packs(user_id,life_context_id,title,pack_type) values(owner_id,context_id,'Movie night','event') returning id into pack_id;
    end if;
  elsif not exists(select 1 from public.ready_packs p join public.life_contexts l on l.id = p.life_context_id and l.user_id = owner_id where p.id = pack_id and p.user_id = owner_id and p.status = 'active' and p.pack_type = 'event' and l.status = 'active') then
    raise exception 'Invalid owned pack';
  end if;
  insert into public.ready_pack_discoveries(user_id,ready_pack_id,entity_id,entity,interests)
    values(owner_id,pack_id,(p_entity->>'entity_id')::uuid,p_entity,p_interests)
    on conflict(ready_pack_id,entity_id) do nothing;
  return pack_id;
end;
$$;
revoke all on function public.save_taste_selection(uuid,uuid,jsonb,jsonb,uuid[]) from public, anon, authenticated;
grant execute on function public.save_taste_selection(uuid,uuid,jsonb,jsonb,uuid[]) to service_role;
commit;

