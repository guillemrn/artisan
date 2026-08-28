-- Allow separate Artisan accounts to reuse human-readable IDs and ticket numbers.
-- RLS scopes access by user_id; primary keys must use the same ownership boundary.

begin;

do $$
declare
  v_table text;
  v_null_count bigint;
  v_mismatched_sales bigint;
begin
  foreach v_table in array array['products', 'clients', 'sales']
  loop
    execute format(
      'select count(*) from public.%I where user_id is null',
      v_table
    ) into v_null_count;

    if v_null_count > 0 then
      raise exception
        'Cannot scope %.pkey by user: % rows still have a null user_id.',
        v_table,
        v_null_count;
    end if;
  end loop;

  select count(*)
    into v_mismatched_sales
  from public.sales sale
  left join public.clients client
    on client.user_id = sale.user_id
    and client.id = sale.client_id
  where client.id is null;

  if v_mismatched_sales > 0 then
    raise exception
      'Cannot scope sales.client_id by user: % sales do not belong to the same user as their client.',
      v_mismatched_sales;
  end if;
end;
$$;

alter table public.products alter column user_id set not null;
alter table public.clients alter column user_id set not null;
alter table public.sales alter column user_id set not null;

-- Replace the old global client reference before changing the client primary key.
alter table public.sales drop constraint if exists sales_client_id_fkey;

alter table public.products drop constraint if exists products_pkey;
alter table public.products
  add constraint products_pkey primary key (user_id, id);

alter table public.clients drop constraint if exists clients_pkey;
alter table public.clients
  add constraint clients_pkey primary key (user_id, id);

alter table public.sales drop constraint if exists sales_pkey;
alter table public.sales
  add constraint sales_pkey primary key (user_id, id);

alter table public.sales
  add constraint sales_client_id_fkey
  foreign key (user_id, client_id)
  references public.clients (user_id, id)
  on delete restrict;

commit;
