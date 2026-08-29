-- Preserve the delivery date and record payment as a separate business event.

begin;

alter table public.sales
  add column if not exists paid_at timestamptz;

-- Existing settled sales were previously dated by their latest payment event.
update public.sales
set paid_at = created_at
where status = 'Entregado'
  and paid_at is null;

create or replace function public.set_sale_payment_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'Entregado' and new.paid_at is null then
    if tg_op = 'INSERT' then
      new.paid_at := coalesce(new.created_at, now());
    elsif old.status is distinct from 'Entregado' then
      new.paid_at := now();
    end if;
  elsif new.status = 'Pendiente' then
    new.paid_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists set_sale_payment_date on public.sales;

create trigger set_sale_payment_date
before insert or update of status, paid_at on public.sales
for each row
execute function public.set_sale_payment_date();

commit;
