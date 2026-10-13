-- Teste transacional de VAGAS: dados DEMO existentes, alterações revertidas.
-- Verifique os IDs de referência antes de executar em outro projeto.
begin;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',email,'role','authenticated','app_metadata',jsonb_build_object('role','colaborador'))::text from auth.users where id='7eb62e50-b421-4d55-8f3d-8c40134c8075'),true);
set local role authenticated;
do $test$
declare original timestamptz; clone_id bigint; titulo_atual text; total_before integer; total_after integer;
begin
  select publicada_em,titulo into original,titulo_atual from public.vagas where id=4;
  update public.vagas set status='cancelada' where id=4;
  if (select count(*) from public.candidaturas where vaga_id=4)<>2 then raise exception 'Candidaturas perdidas'; end if;
  if exists(select 1 from public.candidaturas where vaga_id=4 and vaga_status<>'cancelada') then raise exception 'Histórico da vaga desatualizado'; end if;
  update public.vagas set status='ativa' where id=4;
  if (select publicada_em from public.vagas where id=4) is distinct from original then raise exception 'Publicação original alterada'; end if;
  insert into public.vagas(empresa_id,responsavel_auth_user_id,titulo,departamento,descricao,cidade_id,estado_id,localidade_texto,modalidade,contrato,salario_min,salario_max,requisitos,beneficios,areas,etapas_iniciais,visibilidade,inscricoes_inicio,inscricoes_fim,status,publicada_em)
  select empresa_id,responsavel_auth_user_id,titulo||' (cópia)',departamento,descricao,cidade_id,estado_id,localidade_texto,modalidade,contrato,salario_min,salario_max,requisitos,beneficios,areas,etapas_iniciais,visibilidade,inscricoes_inicio,inscricoes_fim,'rascunho',null from public.vagas where id=4 returning id into clone_id;
  if exists(select 1 from public.candidaturas where vaga_id=clone_id) then raise exception 'Candidaturas copiadas'; end if;
  if not exists(select 1 from public.vagas where id=clone_id and status='rascunho' and publicada_em is null and codigo is not null) then raise exception 'Cópia inválida'; end if;
  select sem_feedback_enviado into total_before from public.recrutamento_vagas where id=4;
  insert into public.candidatura_registros(candidatura_id,autor_id,autor_nome,tipo,conteudo) values(5,auth.uid(),'Teste','anotacao','Não é feedback enviado');
  insert into public.candidatura_mensagens(candidatura_id,autor_id,assunto,conteudo,remetente,destinatario) select 5,auth.uid(),'Teste','Mensagem pendente',auth.jwt()->>'email',email_candidato from public.candidaturas where id=5;
  select sem_feedback_enviado into total_after from public.recrutamento_vagas where id=4;
  if total_before<>total_after then raise exception 'Pendência contada como envio'; end if;
end;$test$;
select 'Cancelamento preserva histórico, reativação preserva data, cópia sem candidaturas, pendências não contam como envio' resultado;
rollback;

