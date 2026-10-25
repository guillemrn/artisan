-- Store product recipes and calculate their cost on the server.

begin;

create table if not exists public.product_costings (
  user_id uuid not null,
  product_id text not null,
  yield_quantity numeric not null check (yield_quantity > 0),
  units_per_product numeric not null check (units_per_product > 0),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  batch_cost numeric not null check (batch_cost >= 0),
  unit_cost numeric not null check (unit_cost >= 0),
  product_cost numeric not null check (product_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_costings_pkey primary key (user_id, product_id),
  constraint product_costings_product_fkey
    foreign key (user_id, product_id)
    references public.products (user_id, id)
    on delete cascade
);

alter table public.product_costings enable row level security;
alter table public.product_costings force row level security;

drop policy if exists "Users can read their product costings" on public.product_costings;
create policy "Users can read their product costings"
on public.product_costings for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their product costings" on public.product_costings;
create policy "Users can insert their product costings"
on public.product_costings for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their product costings" on public.product_costings;
create policy "Users can update their product costings"
on public.product_costings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their product costings" on public.product_costings;
create policy "Users can delete their product costings"
on public.product_costings for delete
using (auth.uid() = user_id);

create or replace function public.create_product_with_costing(
  p_product_id text,
  p_name text,
  p_cost numeric,
  p_distributor_price numeric,
  p_public_price numeric,
  p_stock integer,
  p_costing jsonb default null
)
returns public.products
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_mode text;
  v_name text;
  v_purchase_cost numeric;
  v_purchase_quantity numeric;
  v_usage_quantity numeric;
  v_purchase_unit text;
  v_usage_unit text;
  v_purchase_dimension text;
  v_usage_dimension text;
  v_purchase_factor numeric;
  v_usage_factor numeric;
  v_line_cost numeric;
  v_batch_cost numeric := 0;
  v_yield_quantity numeric;
  v_units_per_product numeric;
  v_unit_cost numeric;
  v_product_cost numeric;
  v_product public.products%rowtype;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para crear productos.' using errcode = '28000';
  end if;

  if nullif(trim(p_product_id), '') is null or nullif(trim(p_name), '') is null then
    raise exception 'El producto necesita nombre e identificador.' using errcode = '22023';
  end if;
  if p_distributor_price < 0 or p_public_price < 0 or p_stock < 0 then
    raise exception 'Los precios y el inventario no pueden ser negativos.' using errcode = '22023';
  end if;

  if p_costing is null then
    if p_cost is null or p_cost < 0 then
      raise exception 'El costo del producto no es válido.' using errcode = '22023';
    end if;
    v_product_cost := p_cost;
  else
    if jsonb_typeof(p_costing->'items') <> 'array' or jsonb_array_length(p_costing->'items') = 0 then
      raise exception 'El costeo necesita al menos un insumo.' using errcode = '22023';
    end if;

    v_yield_quantity := (p_costing->>'yieldQuantity')::numeric;
    v_units_per_product := (p_costing->>'unitsPerProduct')::numeric;
    if v_yield_quantity <= 0 or v_units_per_product <= 0 then
      raise exception 'El rendimiento y la presentación deben ser mayores a cero.' using errcode = '22023';
    end if;

    for v_item in select value from jsonb_array_elements(p_costing->'items')
    loop
      v_name := nullif(trim(v_item->>'name'), '');
      v_mode := v_item->>'mode';
      v_purchase_cost := (v_item->>'purchaseCost')::numeric;
      if v_name is null or v_purchase_cost < 0 then
        raise exception 'Hay un insumo incompleto en el costeo.' using errcode = '22023';
      end if;

      if v_mode = 'fixed' then
        v_line_cost := v_purchase_cost;
      elsif v_mode = 'proportional' then
        v_purchase_quantity := (v_item->>'purchaseQuantity')::numeric;
        v_usage_quantity := (v_item->>'usageQuantity')::numeric;
        v_purchase_unit := v_item->>'purchaseUnit';
        v_usage_unit := v_item->>'usageUnit';

        select dimension, factor into v_purchase_dimension, v_purchase_factor
        from (values
          ('g', 'mass', 1::numeric), ('kg', 'mass', 1000::numeric),
          ('ml', 'volume', 1::numeric), ('l', 'volume', 1000::numeric),
          ('piece', 'count', 1::numeric),
          ('cm', 'length', 1::numeric), ('m', 'length', 100::numeric)
        ) as units(unit, dimension, factor)
        where unit = v_purchase_unit;

        select dimension, factor into v_usage_dimension, v_usage_factor
        from (values
          ('g', 'mass', 1::numeric), ('kg', 'mass', 1000::numeric),
          ('ml', 'volume', 1::numeric), ('l', 'volume', 1000::numeric),
          ('piece', 'count', 1::numeric),
          ('cm', 'length', 1::numeric), ('m', 'length', 100::numeric)
        ) as units(unit, dimension, factor)
        where unit = v_usage_unit;

        if v_purchase_quantity <= 0 or v_usage_quantity < 0
          or v_purchase_dimension is null or v_usage_dimension is null
          or v_purchase_dimension <> v_usage_dimension then
          raise exception 'Las cantidades o unidades de % no son válidas.', v_name using errcode = '22023';
        end if;

        v_line_cost := v_purchase_cost
          * ((v_usage_quantity * v_usage_factor) / (v_purchase_quantity * v_purchase_factor));
      else
        raise exception 'El tipo de costo de % no es válido.', v_name using errcode = '22023';
      end if;

      v_batch_cost := v_batch_cost + v_line_cost;
    end loop;

    v_unit_cost := v_batch_cost / v_yield_quantity;
    v_product_cost := round(v_unit_cost * v_units_per_product, 2);
  end if;

  insert into public.products (
    user_id, id, name, cost, distributor_price, public_price, stock
  ) values (
    v_user_id, p_product_id, trim(p_name), v_product_cost,
    p_distributor_price, p_public_price, p_stock
  ) returning * into v_product;

  if p_costing is not null then
    insert into public.product_costings (
      user_id, product_id, yield_quantity, units_per_product, items,
      batch_cost, unit_cost, product_cost
    ) values (
      v_user_id, p_product_id, v_yield_quantity, v_units_per_product,
      p_costing->'items', v_batch_cost, v_unit_cost, v_product_cost
    );
  end if;

  return v_product;
end;
$$;

revoke all on function public.create_product_with_costing(
  text, text, numeric, numeric, numeric, integer, jsonb
) from public;
grant execute on function public.create_product_with_costing(
  text, text, numeric, numeric, numeric, integer, jsonb
) to authenticated;

commit;
