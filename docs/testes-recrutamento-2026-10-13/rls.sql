-- Teste transacional de RLS: dados DEMO existentes, alterações revertidas.
-- Verifique os IDs de referência antes de executar em outro projeto.
begin;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',email,'role','authenticated','app_metadata',jsonb_build_object('role','colaborador'))::text from auth.users where id='7eb62e50-b421-4d55-8f3d-8c40134c8075'),true);
set local role authenticated;
insert into public.candidatura_registros(candidatura_id,autor_id,autor_nome,tipo,conteudo) values(5,auth.uid(),'Teste','anotacao','RLS teste');
select public.agendar_entrevista(5,(now()+interval '2 days')::timestamp,'America/Sao_Paulo',45,'Teste','Online','https://example.com','');
insert into public.candidatura_mensagens(candidatura_id,autor_id,assunto,conteudo,remetente,destinatario) select 5,auth.uid(),'RLS','Teste',auth.jwt()->>'email',email_candidato from public.candidaturas where id=5;
select set_config('request.jwt.claims','{"sub":"24293fdc-7373-4c6c-9b1a-280201b56d4a","role":"authenticated","app_metadata":{}}',true);
do $test$
begin
  if (select count(*) from public.candidaturas where id=5)<>1 then raise exception 'Histórico próprio inacessível'; end if;
  if exists(select 1 from public.candidatura_registros) or exists(select 1 from public.candidatura_eventos) or exists(select 1 from public.entrevistas) or exists(select 1 from public.candidatura_mensagens) or exists(select 1 from public.feedbacks) then raise exception 'Dados internos expostos ao candidato'; end if;
  begin
    insert into public.candidatura_registros(candidatura_id,autor_id,autor_nome,tipo,conteudo) values(5,auth.uid(),'Teste','anotacao','Negado');
    raise exception 'Escrita indevida permitida';
  exception when insufficient_privilege then null; end;
end;$test$;
select set_config('request.jwt.claims','{"sub":"76b42bc0-30d3-4404-a915-8fe0edbdfdb1","role":"authenticated","app_metadata":{"role":"comercial"}}',true);
do $test$
begin
  if exists(select 1 from public.recrutamento_vagas) or exists(select 1 from public.candidatura_registros) or exists(select 1 from public.entrevistas) or exists(select 1 from public.candidatura_mensagens) then raise exception 'Acesso de recrutamento pelo Comercial'; end if;
end;$test$;
select set_config('request.jwt.claims','{"sub":"6f9d0657-2fc7-4c6c-827c-bf3f50e55525","role":"authenticated","app_metadata":{"role":"colaborador"}}',true);
do $test$
begin
  if exists(select 1 from public.recrutamento_vagas where id=4) or exists(select 1 from public.candidaturas where vaga_id=4) or exists(select 1 from public.candidatura_registros) or exists(select 1 from public.candidatura_eventos) or exists(select 1 from public.entrevistas) or exists(select 1 from public.candidatura_mensagens) then raise exception 'Acesso de outro recrutador'; end if;
end;$test$;
select 'RLS: candidato, comercial e outro recrutador isolados' resultado;
rollback;

