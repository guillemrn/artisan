-- Run with `supabase test db` against a disposable local database.
-- The transaction always rolls back.

begin;

do $$
declare
  v_table text;
  v_primary_key_columns text[];
  v_user_ids uuid[];
  v_count integer;
begin
  foreach v_table in array array['products', 'clients', 'sales']
  loop
    select array_agg(attribute.attname order by key_column.ordinality)
      into v_primary_key_columns
    from pg_index index_definition
    cross join lateral unnest(index_definition.indkey)
      with ordinality as key_column(attribute_number, ordinality)
    join pg_attribute attribute
      on attribute.attrelid = index_definition.indrelid
      and attribute.attnum = key_column.attribute_number
    where index_definition.indrelid = format('public.%I', v_table)::regclass
      and index_definition.indisprimary;

    if v_primary_key_columns <> array['user_id', 'id']::text[] then
      raise exception
        'Expected public.% primary key to be (user_id, id), found %',
        v_table,
        v_primary_key_columns;
    end if;
  end loop;

  select array_agg(id order by created_at)
    into v_user_ids
  from (
    select id, created_at
    from auth.users
    order by created_at
    limit 2
  ) users;

  if coalesce(array_length(v_user_ids, 1), 0) < 2 then
    raise notice 'Skipping cross-account insert test because fewer than two auth users exist.';
    return;
  end if;

  delete from public.clients
  where id = '__tenant_key_test__'
    and user_id = any(v_user_ids);

  insert into public.clients (id, name, channel, user_id)
  values
    ('__tenant_key_test__', 'Same name', 'Público', v_user_ids[1]),
    ('__tenant_key_test__', 'Same name', 'Público', v_user_ids[2]);

  select count(*)
    into v_count
  from public.clients
  where id = '__tenant_key_test__'
    and user_id = any(v_user_ids);

  if v_count <> 2 then
    raise exception 'Expected the same client ID in two accounts, found % rows.', v_count;
  end if;
end;
$$;

rollback;

