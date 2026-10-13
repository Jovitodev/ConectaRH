-- Teste transacional de VALIDACOES: dados DEMO existentes, alterações revertidas.
-- Verifique os IDs de referência antes de executar em outro projeto.
begin;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',email,'role','authenticated','app_metadata',jsonb_build_object('role','colaborador'))::text from auth.users where id='7eb62e50-b421-4d55-8f3d-8c40134c8075'),true);
set local role authenticated;
do $test$
declare before_count integer; after_count integer; blocked boolean;
begin
  select count(*) into before_count from public.candidatura_eventos where candidatura_id=5;
  update public.candidaturas set etapa_atual=etapa_atual where id=5;
  select count(*) into after_count from public.candidatura_eventos where candidatura_id=5;
  if before_count<>after_count then raise exception 'Movimentação repetida criou evento'; end if;
  blocked=false;
  begin update public.candidaturas set etapa_atual='Etapa inexistente' where id=5;
  exception when others then blocked=true; end;
  if not blocked then raise exception 'Etapa inválida aceita'; end if;
  blocked=false;
  begin perform public.reprovar_candidatura(5,'em_andamento','');
  exception when others then blocked=true; end;
  if not blocked then raise exception 'Reprovação sem motivo aceita'; end if;
  blocked=false;
  begin
    insert into public.candidatura_mensagens(candidatura_id,autor_id,assunto,conteudo,remetente,destinatario,status)
    select 5,auth.uid(),'Teste','Teste',auth.jwt()->>'email',email_candidato,'enviado' from public.candidaturas where id=5;
  exception when others then blocked=true; end;
  if not blocked then raise exception 'Envio fictício aceito'; end if;
  blocked=false;
  begin
    insert into public.candidatura_eventos(candidatura_id,autor_id,tipo,detalhes) values(5,auth.uid(),'fraude','{}');
  exception when insufficient_privilege then blocked=true; end;
  if not blocked then raise exception 'Auditoria forjada'; end if;
end;$test$;
select 'Etapa inválida, reprovação vazia, envio fictício e auditoria forjada bloqueados; repetição sem evento' resultado;
rollback;

