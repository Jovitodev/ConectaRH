-- Inativar/arquivar impede seleção em novas vagas; não remove a identificação
-- de empresas em vagas que já existem. Nenhum contato comercial é exposto.
begin;
alter policy empresas_publicas on public.empresas using (
  exists(select 1 from public.vagas v where v.empresa_id=empresas.id and v.status='ativa' and v.visibilidade='publica')
);
alter policy empresas_colaborador_ler on public.empresas using (
  ((select auth.jwt())->'app_metadata'->>'role')='colaborador' and (
    ativa or exists(select 1 from public.vagas v where v.empresa_id=empresas.id and v.responsavel_auth_user_id=(select auth.uid()))
  )
);
commit;
