-- Executado no Supabase como migração comercial_auth_sem_perfil_candidato_20261007.
-- O gatilho ignora contas cujo role já esteja em app_metadata no INSERT.
-- Na criação administrativa desta conta, o Auth definiu app_metadata após o INSERT;
-- o perfil de candidato gerado inicialmente foi removido e a ausência foi verificada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare novo_usuario_id bigint;
begin
  if new.raw_app_meta_data ->> 'role' in ('colaborador', 'comercial') then
    return new;
  end if;
  insert into public.usuarios(nome,email,auth_user_id)
  values (coalesce(new.raw_user_meta_data ->> 'name',''),new.email,new.id)
  returning id into novo_usuario_id;
  insert into public.candidatos(usuario_id) values (novo_usuario_id);
  return new;
end;
$function$;
