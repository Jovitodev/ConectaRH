-- Status legado em feedbacks não comprova envio real por provedor.
-- Preserva os registros e considera apenas mensagens com evidência de envio.
begin;
create or replace view public.recrutamento_vagas with (security_invoker=true) as
select v.*,e.nome as empresa_nome,
  (select count(*)::integer from public.candidaturas c where c.vaga_id=v.id) as candidaturas_total,
  (select count(*)::integer from public.candidaturas c where c.vaga_id=v.id and not exists(select 1 from public.feedbacks f where f.candidatura_id=c.id)) as sem_registro_feedback,
  (select count(*)::integer from public.candidaturas c where c.vaga_id=v.id
    and not exists(select 1 from public.candidatura_mensagens m where m.candidatura_id=c.id and m.status in ('enviado','entregue') and m.provider_id is not null and m.enviado_em is not null)) as sem_feedback_enviado
from public.vagas v left join public.empresas e on e.id=v.empresa_id
where ((select auth.jwt())->'app_metadata'->>'role')='colaborador' and v.responsavel_auth_user_id=(select auth.uid());
commit;
