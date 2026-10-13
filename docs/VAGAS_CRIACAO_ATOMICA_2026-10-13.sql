begin;
create function public.criar_vaga_operacional(p_vaga jsonb,p_operacao jsonb) returns public.vagas language plpgsql security invoker set search_path='' as $$
declare v public.vagas; saved public.vagas; o public.vaga_operacao;
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','')<>'colaborador' then raise exception 'Acesso restrito ao recrutamento.'; end if;
 if not exists(select 1 from public.empresas where id=(p_vaga->>'empresa_id')::bigint and ativa) then raise exception 'Selecione uma empresa ativa cadastrada pelo Comercial.'; end if;
 v=jsonb_populate_record(null::public.vagas,p_vaga);
 insert into public.vagas(empresa_id,responsavel_auth_user_id,titulo,departamento,descricao,cidade_id,estado_id,localidade_texto,modalidade,contrato,salario_min,salario_max,requisitos,beneficios,areas,etapas_iniciais,visibilidade,status,inscricoes_inicio,inscricoes_fim,publicada_em)
 values(v.empresa_id,auth.uid(),v.titulo,v.departamento,v.descricao,v.cidade_id,v.estado_id,v.localidade_texto,v.modalidade,v.contrato,v.salario_min,v.salario_max,v.requisitos,v.beneficios,v.areas,v.etapas_iniciais,v.visibilidade,v.status,v.inscricoes_inicio,v.inscricoes_fim,case when v.status='ativa' then now() else null end) returning * into saved;
 o=jsonb_populate_record(null::public.vaga_operacao,jsonb_build_object('andamento','alinhamento','reposicao',false)||coalesce(p_operacao,'{}')||jsonb_build_object('vaga_id',saved.id,'updated_at',now()));
 insert into public.vaga_operacao select o.*;
 return saved;
end $$;
revoke all on function public.criar_vaga_operacional(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.criar_vaga_operacional(jsonb,jsonb) to authenticated;
commit;
