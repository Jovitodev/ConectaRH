begin;
-- As vagas antigas ainda não possuem andamento operacional confirmado.
alter table public.vaga_operacao drop constraint vaga_operacao_andamento_check;
alter table public.vaga_operacao add constraint vaga_operacao_andamento_check check(andamento in ('nao_classificada','alinhamento','rs','entrevista_gestor','admissao','suspensa','concluida','cancelada'));
create or replace view public.recrutamento_operacao with(security_invoker=true) as
 select r.*,o.cv,coalesce(o.andamento,'nao_classificada') as andamento,coalesce(o.reposicao,false) as reposicao,o.data_abertura,o.previsao_alinhamento,o.previsao_entrega,o.previsao_entrevista,o.previsao_admissao,o.inicio_suspensao,o.fechamento
 from public.recrutamento_vagas r left join public.vaga_operacao o on o.vaga_id=r.id;
-- Reutiliza o mecanismo privado de auditoria já empregado nas avaliações livres.
alter table public.candidatura_avaliacoes add column tipo text generated always as ('avaliacao'::text) stored;
create trigger recrutamento_auditar_avaliacao after insert on public.candidatura_avaliacoes for each row execute function private.recrutamento_auditar();
commit;
