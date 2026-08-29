-- A replacement is free for the customer but still consumes inventory and production cost.

begin;

with recalculated_costs as (
  select
    sale.user_id,
    sale.id,
    sum(
      (coalesce((item->>'qty')::numeric, 0) + coalesce((item->>'returnQty')::numeric, 0))
      * coalesce((item->>'cost')::numeric, 0)
    ) as actual_cost
  from public.sales as sale
  cross join lateral jsonb_array_elements(sale.items) as item
  group by sale.user_id, sale.id
)
update public.sales as sale
set
  cost = recalculated.actual_cost,
  profit = sale.total - recalculated.actual_cost
from recalculated_costs as recalculated
where sale.user_id = recalculated.user_id
  and sale.id = recalculated.id;

commit;
