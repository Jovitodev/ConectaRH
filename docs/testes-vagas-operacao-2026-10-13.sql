begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"7eb62e50-b421-4d55-8f3d-8c40134c8075","role":"authenticated","app_metadata":{"role":"colaborador"}}',true);
do $$ declare v public.vagas; created public.vagas; app_id bigint; different_app bigint; n integer; begin
 select * into strict v from public.vagas where responsavel_auth_user_id=auth.uid() order by id limit 1;
 select id into strict app_id from public.candidaturas where vaga_id=v.id order by id limit 1;
 select id into different_app from public.candidaturas where vaga_id<>v.id order by id limit 1;
 created=public.criar_vaga_operacional(to_jsonb(v)||jsonb_build_object('titulo','TESTE TRANSACIONAL - NÃO PERSISTIR','status','rascunho'),jsonb_build_object('cv','TESTE-CV','reposicao',true,'data_abertura','2026-10-01','previsao_entrega','2026-10-20','andamento','rs'));
 if not exists(select 1 from public.recrutamento_operacao where id=created.id and cv='TESTE-CV' and reposicao and andamento='rs') then raise exception 'Falha no quadro operacional'; end if;
 update public.vaga_operacao set andamento='admissao',previsao_admissao='2026-10-25' where vaga_id=created.id;
 insert into public.vaga_comentarios(vaga_id,conteudo) values(created.id,'Comentário de teste transacional');
 insert into public.recrutamento_opcoes(campo,nome) values('resultado','Opção de teste transacional');
 insert into public.candidatura_avaliacoes(candidatura_id,dados) values(app_id,'{"resultado":"Opção de teste transacional","trajetoria":"Teste"}');
 if not exists(select 1 from public.candidatura_eventos where candidatura_id=app_id and tipo='avaliacao' and created_at>=transaction_timestamp()) then raise exception 'Avaliação sem evento na timeline'; end if;
 insert into public.vaga_operacao(vaga_id,finalista_id,escolha_finalista) values(v.id,app_id,'2026-10-13');
 if not exists(select 1 from public.vaga_operacao where vaga_id=v.id and finalista_id=app_id) then raise exception 'Finalista válido não foi salvo'; end if;
 begin update public.candidatura_avaliacoes set dados='{}' where candidatura_id=app_id; raise exception 'Avaliação permitiu sobrescrita'; exception when insufficient_privilege then null; end;
 begin update public.vaga_operacao set andamento='cancelada' where vaga_id=v.id; raise exception 'Cancelamento sem motivo aceito'; exception when raise_exception then if sqlerrm='Cancelamento sem motivo aceito' then raise; end if; end;
 begin update public.vaga_operacao set finalista_id=different_app where vaga_id=v.id; raise exception 'Finalista de outra vaga aceito'; exception when raise_exception then if sqlerrm='Finalista de outra vaga aceito' then raise; end if; end;
 select count(*) into n from public.vagas;
 begin perform public.criar_vaga_operacional(to_jsonb(v),'{"andamento":"invalido"}'); raise exception 'Andamento inválido aceito'; exception when check_violation then null; end;
 if (select count(*) from public.vagas)<>n then raise exception 'Criação não foi atômica'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"76b42bc0-30d3-4404-a915-8fe0edbdfdb1","role":"authenticated","app_metadata":{"role":"comercial"}}',true);
do $$ begin
 if exists(select 1 from public.vaga_operacao) or exists(select 1 from public.vaga_comentarios) or exists(select 1 from public.candidatura_avaliacoes) or exists(select 1 from public.recrutamento_operacao) or exists(select 1 from public.recrutamento_candidaturas) then raise exception 'Vazamento para Comercial'; end if;
 begin insert into public.recrutamento_opcoes(campo,nome) values('parecer','Não permitido'); raise exception 'Comercial conseguiu inserir opção'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"24293fdc-7373-4c6c-9b1a-280201b56d4a","role":"authenticated","app_metadata":{"role":"candidato"}}',true);
do $$ begin
 if exists(select 1 from public.vaga_operacao) or exists(select 1 from public.vaga_comentarios) or exists(select 1 from public.candidatura_avaliacoes) or exists(select 1 from public.recrutamento_candidaturas) then raise exception 'Vazamento para candidato'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"6f9d0657-2fc7-4c6c-827c-bf3f50e55525","role":"authenticated","app_metadata":{"role":"colaborador"}}',true);
do $$ begin
 if exists(select 1 from public.vaga_operacao) or exists(select 1 from public.vaga_comentarios) or exists(select 1 from public.candidatura_avaliacoes) or exists(select 1 from public.recrutamento_opcoes) then raise exception 'Vazamento para outro recrutador'; end if;
end $$;
rollback;
