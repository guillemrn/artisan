-- Run with `supabase test db` after applying all migrations.

begin;

do $$
begin
  if to_regprocedure(
    'public.register_sale(text,text,text,text,jsonb,numeric,numeric,numeric,text,text,timestamp with time zone)'
  ) is not null then
    raise exception 'The legacy register_sale overload still accepts browser-calculated fields.';
  end if;

  if to_regprocedure('public.register_sale(text,text,jsonb,text,text)') is null then
    raise exception 'Expected the server-authoritative register_sale function to exist.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sales'
      and column_name = 'price_mode'
  ) then
    raise exception 'Expected public.sales.price_mode to exist.';
  end if;
end;
$$;

rollback;
