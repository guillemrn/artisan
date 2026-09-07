-- Keep replacement/merma cost separate from the commercial profit of a sale.
-- Replacements still consume stock and remain recorded in sales.items.returnQty.

begin;

create or replace function public.register_sale(
  p_sale_id text,
  p_client_id text,
  p_items jsonb,
  p_price_mode text,
  p_payment text
)
returns public.sales
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_client_name text;
  v_channel text;
  v_status text;
  v_created_at timestamptz := now();
  v_item record;
  v_product_name text;
  v_product_cost numeric;
  v_unit_price numeric;
  v_current_stock integer;
  v_deduction integer;
  v_total numeric := 0;
  v_cost numeric := 0;
  v_profit numeric := 0;
  v_calculated_items jsonb := '[]'::jsonb;
  v_registered_sale public.sales%rowtype;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para registrar ventas.'
      using errcode = '28000';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta necesita al menos un producto.'
      using errcode = '22023';
  end if;

  if p_price_mode is null or p_price_mode not in ('distributor', 'public') then
    raise exception 'El tipo de precio no es válido.'
      using errcode = '22023';
  end if;

  if p_payment is null
    or p_payment not in ('Efectivo', 'Transferencia', 'Pendiente', 'Consignación', 'Cortesía') then
    raise exception 'El método de pago no es válido.'
      using errcode = '22023';
  end if;

  select client.name, client.channel
    into v_client_name, v_channel
  from public.clients as client
  where client.id = p_client_id
    and client.user_id = v_user_id;

  if not found then
    raise exception 'El cliente no existe o no pertenece a tu cuenta.'
      using errcode = '22023';
  end if;

  v_status := case
    when p_payment in ('Pendiente', 'Consignación') then 'Pendiente'
    else 'Entregado'
  end;

  for v_item in
    select
      entry.value->>'productId' as product_id,
      sum(coalesce((entry.value->>'qty')::integer, 0)) as qty,
      sum(coalesce((entry.value->>'returnQty')::integer, 0)) as return_qty,
      min(entry.ordinality) as sort_order
    from jsonb_array_elements(p_items) with ordinality as entry(value, ordinality)
    group by entry.value->>'productId'
    order by min(entry.ordinality)
  loop
    if v_item.product_id is null or v_item.product_id = '' then
      raise exception 'La venta contiene un producto inválido.'
        using errcode = '22023';
    end if;

    if v_item.qty < 0 or v_item.return_qty < 0 then
      raise exception 'Las cantidades no pueden ser negativas.'
        using errcode = '22023';
    end if;

    v_deduction := v_item.qty + v_item.return_qty;

    if v_deduction <= 0 then
      raise exception 'Cada producto necesita una cantidad mayor a cero.'
        using errcode = '22023';
    end if;

    select
      product.name,
      product.cost,
      case
        when p_price_mode = 'public' then product.public_price
        else product.distributor_price
      end,
      product.stock
    into v_product_name, v_product_cost, v_unit_price, v_current_stock
    from public.products as product
    where product.id = v_item.product_id
      and product.user_id = v_user_id
    for update;

    if not found then
      raise exception 'Un producto de la venta no existe o no pertenece a tu cuenta.'
        using errcode = '22023';
    end if;

    if v_current_stock < v_deduction then
      raise exception 'No hay inventario suficiente para registrar esta venta.'
        using errcode = '22023';
    end if;

    update public.products
    set stock = stock - v_deduction
    where id = v_item.product_id
      and user_id = v_user_id;

    if p_payment <> 'Cortesía' then
      v_total := v_total + (v_item.qty * v_unit_price);
    end if;

    -- Only sold pieces belong to the sale cost. Merma remains in returnQty.
    v_cost := v_cost + (v_item.qty * v_product_cost);

    v_calculated_items := v_calculated_items || jsonb_build_array(
      jsonb_build_object(
        'productId', v_item.product_id,
        'productName', v_product_name,
        'qty', v_item.qty,
        'returnQty', v_item.return_qty,
        'unitPrice', v_unit_price,
        'cost', v_product_cost
      )
    );
  end loop;

  v_profit := v_total - v_cost;

  update public.clients
  set last_delivery = 'Hoy'
  where id = p_client_id
    and user_id = v_user_id;

  insert into public.sales (
    id,
    client_id,
    client_name,
    channel,
    items,
    total,
    cost,
    profit,
    payment,
    status,
    created_at,
    user_id,
    price_mode
  )
  values (
    p_sale_id,
    p_client_id,
    v_client_name,
    v_channel,
    v_calculated_items,
    v_total,
    v_cost,
    v_profit,
    p_payment,
    v_status,
    v_created_at,
    v_user_id,
    p_price_mode
  )
  returning * into v_registered_sale;

  return v_registered_sale;
end;
$$;

revoke all on function public.register_sale(text, text, jsonb, text, text) from public;
grant execute on function public.register_sale(text, text, jsonb, text, text) to authenticated;

-- Repair stored commercial cost and profit while preserving item and stock history.
with recalculated_sales as (
  select
    sale.user_id,
    sale.id,
    coalesce(
      sum(
        coalesce((item.value->>'qty')::numeric, 0)
        * coalesce((item.value->>'cost')::numeric, 0)
      ),
      0
    ) as sale_cost
  from public.sales as sale
  left join lateral jsonb_array_elements(coalesce(sale.items, '[]'::jsonb)) as item(value)
    on true
  group by sale.user_id, sale.id
)
update public.sales as sale
set
  cost = recalculated.sale_cost,
  profit = sale.total - recalculated.sale_cost
from recalculated_sales as recalculated
where sale.user_id = recalculated.user_id
  and sale.id = recalculated.id;

commit;
