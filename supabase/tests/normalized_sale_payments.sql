-- Run with `supabase test db` after applying all migrations.

begin;

do $$
begin
  if exists (
    select 1
    from public.sales
    where payment not in ('Efectivo', 'Transferencia', 'Pendiente', 'Consignación', 'Cortesía')
  ) then
    raise exception 'A sale contains an unsupported payment value.';
  end if;

  if exists (
    select 1
    from public.sales as sale
    cross join lateral jsonb_array_elements(sale.items) as item(value)
    where item.value ? '_paymentMethod'
  ) then
    raise exception 'Legacy _paymentMethod metadata still exists inside sale items.';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.sales'::regclass
      and conname = 'sales_payment_check'
      and contype = 'c'
  ) then
    raise exception 'Expected sales_payment_check to exist.';
  end if;
end;
$$;

rollback;
