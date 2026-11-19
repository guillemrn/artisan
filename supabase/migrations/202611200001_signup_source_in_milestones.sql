-- Guarda el origen del registro (utm_source, etc.) en el hito user_confirmed
-- para medir qué canal trae gente que de verdad registra su primera venta.
-- El origen lo manda el cliente en user_metadata al crear la cuenta.

create or replace function public.capture_confirmed_user_milestone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_should_capture boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_capture := new.email_confirmed_at is not null;
  elsif tg_op = 'UPDATE' then
    v_should_capture := new.email_confirmed_at is not null and old.email_confirmed_at is null;
  end if;

  if v_should_capture then
    perform public.capture_user_milestone(
      new.id,
      'user_confirmed',
      jsonb_strip_nulls(jsonb_build_object(
        'email', new.email,
        'full_name', new.raw_user_meta_data ->> 'full_name',
        'business_name', new.raw_user_meta_data ->> 'business_name',
        'business_type', new.raw_user_meta_data ->> 'business_type',
        'signup_source', coalesce(new.raw_user_meta_data ->> 'signup_source', 'directo'),
        'signup_medium', new.raw_user_meta_data ->> 'signup_medium',
        'signup_campaign', new.raw_user_meta_data ->> 'signup_campaign',
        'signup_landing', new.raw_user_meta_data ->> 'signup_landing',
        'signup_at', new.created_at,
        'confirmed_at', new.email_confirmed_at
      ))
    );
  end if;

  return new;
end;
$$;

revoke all on function public.capture_confirmed_user_milestone() from public;
