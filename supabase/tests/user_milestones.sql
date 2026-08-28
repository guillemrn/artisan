-- Run with `supabase test db` against a disposable local database.
-- The transaction always rolls back and never changes a real user's milestones.

begin;

do $$
declare
  v_user_id uuid;
  v_count integer;
begin
  select id into v_user_id from auth.users order by created_at limit 1;

  if v_user_id is null then
    raise notice 'Skipping milestone idempotency test because auth.users is empty.';
    return;
  end if;

  delete from public.user_milestones
  where user_id = v_user_id
    and event_name = 'first_product_created';

  perform public.capture_user_milestone(
    v_user_id,
    'first_product_created',
    '{"source":"test"}'::jsonb
  );
  perform public.capture_user_milestone(
    v_user_id,
    'first_product_created',
    '{"source":"duplicate"}'::jsonb
  );

  select count(*)
    into v_count
  from public.user_milestones
  where user_id = v_user_id
    and event_name = 'first_product_created';

  if v_count <> 1 then
    raise exception 'Expected one idempotent milestone, found %', v_count;
  end if;
end;
$$;

rollback;

