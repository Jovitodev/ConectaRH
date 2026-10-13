-- Teste transacional de FLUXO: dados DEMO existentes, alterações revertidas.
-- Verifique os IDs de referência antes de executar em outro projeto.
begin;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',email,'role','authenticated','app_metadata',jsonb_build_object('role','colaborador'))::text from auth.users where id='7eb62e50-b421-4d55-8f3d-8c40134c8075'),true);
set local role authenticated;
update public.candidaturas set etapa_atual='Entrevista' where id=5;
insert into public.candidatura_registros(candidatura_id,autor_id,autor_nome,tipo,conteudo) values(5,auth.uid(),'Teste transacional','anotacao','Anotação de validação'),(5,auth.uid(),'Teste transacional','avaliacao','Avaliação de validação');
select public.agendar_entrevista(5,(now()+interval '2 days')::timestamp,'America/Sao_Paulo',45,'Entrevistador de teste','Online','https://example.com/reuniao','Teste revertido');
insert into public.candidatura_mensagens(candidatura_id,autor_id,assunto,conteudo,remetente,destinatario)
select 5,auth.uid(),'Teste de pendência','Sem envio',auth.jwt()->>'email',email_candidato from public.candidaturas where id=5;
select public.reprovar_candidatura(5,'em_andamento','Validação transacional');
select (select etapa_atual from public.candidaturas where id=5) etapa,
(select status from public.candidaturas where id=5) status,
(select count(*) from public.candidatura_eventos where candidatura_id=5) eventos,
(select count(*) from public.candidatura_registros where candidatura_id=5) registros,
(select count(*) from public.entrevistas where candidatura_id=5) entrevistas,
(select status from public.candidatura_mensagens where candidatura_id=5 limit 1) mensagem,
(select total from public.recrutamento_etapas where vaga_id=4 and etapa_atual='Entrevista' and status='reprovado') contador;
rollback;

