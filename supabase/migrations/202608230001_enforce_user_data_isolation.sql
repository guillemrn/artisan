-- Enforce per-user ownership for Artisan business data.
-- Apply this in Supabase before production.
--
-- If these tables already contain shared/demo rows, backfill user_id first:
-- update public.products set user_id = '<owner-user-uuid>' where user_id is null;
-- update public.clients set user_id = '<owner-user-uuid>' where user_id is null;
-- update public.sales set user_id = '<owner-user-uuid>' where user_id is null;
-- Then consider making user_id NOT NULL once every row has an owner.

alter table public.products
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.clients
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.sales
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists sales_user_id_idx on public.sales(user_id);

alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.sales enable row level security;

alter table public.products force row level security;
alter table public.clients force row level security;
alter table public.sales force row level security;

drop policy if exists "products_select_own" on public.products;
drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_delete_own" on public.products;

create policy "products_select_own"
  on public.products
  for select
  using (auth.uid() = user_id);

create policy "products_insert_own"
  on public.products
  for insert
  with check (auth.uid() = user_id);

create policy "products_update_own"
  on public.products
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "products_delete_own"
  on public.products
  for delete
  using (auth.uid() = user_id);

drop policy if exists "clients_select_own" on public.clients;
drop policy if exists "clients_insert_own" on public.clients;
drop policy if exists "clients_update_own" on public.clients;
drop policy if exists "clients_delete_own" on public.clients;

create policy "clients_select_own"
  on public.clients
  for select
  using (auth.uid() = user_id);

create policy "clients_insert_own"
  on public.clients
  for insert
  with check (auth.uid() = user_id);

create policy "clients_update_own"
  on public.clients
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "clients_delete_own"
  on public.clients
  for delete
  using (auth.uid() = user_id);

drop policy if exists "sales_select_own" on public.sales;
drop policy if exists "sales_insert_own" on public.sales;
drop policy if exists "sales_update_own" on public.sales;
drop policy if exists "sales_delete_own" on public.sales;

create policy "sales_select_own"
  on public.sales
  for select
  using (auth.uid() = user_id);

create policy "sales_insert_own"
  on public.sales
  for insert
  with check (auth.uid() = user_id);

create policy "sales_update_own"
  on public.sales
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sales_delete_own"
  on public.sales
  for delete
  using (auth.uid() = user_id);
