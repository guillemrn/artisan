-- Run with `supabase test db` after applying all migrations.

begin;

do $$
begin
  if exists (
    with expected as (
      select
        sale.user_id,
        sale.id,
        sale.total,
        sale.cost,
        sale.profit,
        sum(
          (coalesce((item->>'qty')::numeric, 0) + coalesce((item->>'returnQty')::numeric, 0))
          * coalesce((item->>'cost')::numeric, 0)
        ) as actual_cost
      from public.sales as sale
      cross join lateral jsonb_array_elements(sale.items) as item
      group by sale.user_id, sale.id, sale.total, sale.cost, sale.profit
    )
    select 1
    from expected
    where cost is distinct from actual_cost
       or profit is distinct from total - actual_cost
  ) then
    raise exception 'Stored sale cost or profit does not include replacement costs.';
  end if;
end;
$$;

rollback;
