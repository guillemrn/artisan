-- Con "Continuar con Google" la cuenta nace confirmada y sin datos del negocio:
-- el negocio y el origen (signup_source) llegan después, desde la pantalla "Tu negocio".
-- Este trigger copia esos datos al hito user_confirmed cuando cambian.

create or replace function public.sync_profile_into_confirmed_milestone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data is distinct from old.raw_user_meta_data then
    update public.user_milestones
       set metadata = metadata || jsonb_strip_nulls(jsonb_build_object(
             'full_name', new.raw_user_meta_data ->> 'full_name',
             'business_name', new.raw_user_meta_data ->> 'business_name',
             'business_type', new.raw_user_meta_data ->> 'business_type',
             'signup_source', new.raw_user_meta_data ->> 'signup_source',
             'signup_medium', new.raw_user_meta_data ->> 'signup_medium',
             'signup_campaign', new.raw_user_meta_data ->> 'signup_campaign',
             'signup_landing', new.raw_user_meta_data ->> 'signup_landing',
             'auth_provider', new.raw_app_meta_data ->> 'provider'
           ))
     where user_id = new.id
       and event_name = 'user_confirmed';
  end if;
  return new;
exception
  when others then
    -- La analítica nunca debe romper el inicio de sesión.
    raise warning 'Could not sync profile into milestone for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

revoke all on function public.sync_profile_into_confirmed_milestone() from public;

drop trigger if exists sync_profile_into_confirmed_milestone on auth.users;
create trigger sync_profile_into_confirmed_milestone
  after update of raw_user_meta_data on auth.users
  for each row
  execute function public.sync_profile_into_confirmed_milestone();
