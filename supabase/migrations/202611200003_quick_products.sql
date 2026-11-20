-- Productos rápidos: se crean al vender, sin pasar antes por el catálogo.
-- archived: "solo esta venta" (existe para que register_sale lo acepte, pero no sale en el catálogo).
-- needs_cost: se creó sin costo; su ganancia no es real hasta capturarlo.

alter table public.products
  add column if not exists archived boolean not null default false,
  add column if not exists needs_cost boolean not null default false;

create index if not exists products_user_active_idx
  on public.products (user_id)
  where archived = false;
