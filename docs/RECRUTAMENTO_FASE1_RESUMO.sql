-- Contagens do colaborador calculadas no banco, respeitando RLS das tabelas base.
create view public.vagas_resumo_fase1 with (security_invoker = true) as
select v.id as vaga_id,
  count(c.id)::integer as candidaturas,
  count(c.id) filter (where c.id is not null and not exists (
    select 1 from public.feedbacks f where f.candidatura_id = c.id
  ))::integer as sem_feedback
from public.vagas v
left join public.candidaturas c on c.vaga_id = v.id
where (select auth.jwt()->'app_metadata'->>'role') = 'colaborador'
  and v.responsavel_auth_user_id = (select auth.uid())
group by v.id;

revoke all on public.vagas_resumo_fase1 from public, anon, authenticated;
grant select on public.vagas_resumo_fase1 to authenticated;
