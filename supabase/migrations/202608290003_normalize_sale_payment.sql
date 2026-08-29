-- Store the selected payment option directly on the sale instead of hiding it in item JSON.

begin;

do $$
begin
  if exists (
    select 1
    from public.sales
    where (items->0) ? '_paymentMethod'
      and items->0->>'_paymentMethod' not in (
        'Efectivo',
        'Transferencia',
        'Pendiente',
        'Consignación',
        'Cortesía'
      )
  ) then
    raise exception 'Some sales contain an unsupported legacy payment method.';
  end if;
end;
$$;

-- Remove any legacy payment check before restoring the original values.
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select constraint_definition.conname
    from pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.sales'::regclass
      and constraint_definition.contype = 'c'
      and pg_get_constraintdef(constraint_definition.oid) ilike '%payment%'
  loop
    execute format('alter table public.sales drop constraint %I', v_constraint.conname);
  end loop;
end;
$$;

update public.sales
set payment = items->0->>'_paymentMethod'
where (items->0) ? '_paymentMethod';

update public.sales as sale
set items = (
  select jsonb_agg(item.value - '_paymentMethod' order by item.ordinality)
  from jsonb_array_elements(sale.items) with ordinality as item(value, ordinality)
)
where exists (
  select 1
  from jsonb_array_elements(sale.items) as element(value)
  where element.value ? '_paymentMethod'
);

alter table public.sales
  alter column payment set not null;

alter table public.sales
  add constraint sales_payment_check
  check (payment in ('Efectivo', 'Transferencia', 'Pendiente', 'Consignación', 'Cortesía'));

create or replace function public.register_sale(
  p_sale_id text,
  p_client_id text,
  p_client_name text,
  p_channel text,
  p_items jsonb,
  p_total numeric,
  p_cost numeric,
  p_profit numeric,
  p_payment text,
  p_status text,
  p_created_at timestamptz
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item record;
  v_current_stock integer;
  v_deduction integer;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para registrar ventas.'
      using errcode = '28000';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta necesita al menos un producto.'
      using errcode = '22023';
  end if;

  if p_payment is null
    or p_payment not in ('Efectivo', 'Transferencia', 'Pendiente', 'Consignación', 'Cortesía') then
    raise exception 'El método de pago no es válido.'
      using errcode = '22023';
  end if;

  if p_status is null or p_status not in ('Pendiente', 'Entregado') then
    raise exception 'El estado de la venta no es válido.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.clients
    where id = p_client_id
      and user_id = v_user_id
  ) then
    raise exception 'El cliente no existe o no pertenece a tu cuenta.'
      using errcode = '22023';
  end if;

  for v_item in
    select
      item->>'productId' as product_id,
      sum(coalesce((item->>'qty')::integer, 0)) as qty,
      sum(coalesce((item->>'returnQty')::integer, 0)) as return_qty
    from jsonb_array_elements(p_items) as item
    group by item->>'productId'
  loop
    if v_item.product_id is null or v_item.product_id = '' then
      raise exception 'La venta contiene un producto invalido.'
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

    select stock
      into v_current_stock
    from public.products
    where id = v_item.product_id
      and user_id = v_user_id
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
  end loop;

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
    user_id
  )
  values (
    p_sale_id,
    p_client_id,
    p_client_name,
    p_channel,
    p_items,
    p_total,
    p_cost,
    p_profit,
    p_payment,
    p_status,
    p_created_at,
    v_user_id
  );
end;
$$;

revoke all on function public.register_sale(
  text,
  text,
  text,
  text,
  jsonb,
  numeric,
  numeric,
  numeric,
  text,
  text,
  timestamptz
) from public;

grant execute on function public.register_sale(
  text,
  text,
  text,
  text,
  jsonb,
  numeric,
  numeric,
  numeric,
  text,
  text,
  timestamptz
) to authenticated;

commit;
