-- Run with `supabase test db` against a disposable local database.
-- The transaction always rolls back.

begin;

do $$
declare
  v_sale record;
  v_created_at timestamptz;
  v_paid_at timestamptz;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sales'
      and column_name = 'paid_at'
  ) then
    raise exception 'Expected public.sales.paid_at to exist.';
  end if;

  if exists (
    select 1 from public.sales where status = 'Entregado' and paid_at is null
  ) then
    raise exception 'Every existing settled sale should have paid_at.';
  end if;

  select user_id, id, created_at
    into v_sale
  from public.sales
  where status = 'Pendiente'
  limit 1;

  if not found then
    raise notice 'Skipping payment transition test because no pending sale exists.';
    return;
  end if;

  update public.sales
  set status = 'Entregado'
  where user_id = v_sale.user_id
    and id = v_sale.id
  returning created_at, paid_at into v_created_at, v_paid_at;

  if v_created_at is distinct from v_sale.created_at then
    raise exception 'Paying a sale must preserve its original created_at.';
  end if;

  if v_paid_at is null then
    raise exception 'Paying a sale must populate paid_at.';
  end if;
end;
$$;

rollback;
