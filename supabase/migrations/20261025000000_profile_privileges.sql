begin;
-- Column revocation alone never overrides the original table-wide grant.
revoke update, insert, delete on public.profiles from authenticated, anon;
grant update(display_name, onboarding_completed_at, updated_at) on public.profiles to authenticated;
-- Account profiles are created by the existing auth.users trigger. Clients cannot
-- delete/reinsert their profile with role='admin'.
commit;
