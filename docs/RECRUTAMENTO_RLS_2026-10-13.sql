-- Evita reavaliar o JWT em cada linha nas políticas novas desta evolução.
begin;
do $policies$
declare tabela text; predicado text;
begin
  foreach tabela in array array['candidatura_eventos','candidatura_registros','entrevistas','candidatura_mensagens'] loop
    predicado=format('((select auth.jwt())->''app_metadata''->>''role'')=''colaborador'' and exists (
      select 1 from public.candidaturas c join public.vagas v on v.id=c.vaga_id
      where c.id=%I.candidatura_id and v.responsavel_auth_user_id=(select auth.uid()))',tabela);
    if tabela='candidatura_eventos' then
      execute format('alter policy eventos_responsavel on public.%I using (%s)',tabela,predicado);
    else
      execute format('alter policy responsavel_ler on public.%I using (%s)',tabela,predicado);
      execute format('alter policy responsavel_inserir on public.%I with check (autor_id=(select auth.uid()) and (%s))',tabela,predicado);
      if tabela='entrevistas' then execute format('alter policy entrevistas_atualizar on public.%I using (%s) with check (%s)',tabela,predicado,predicado); end if;
    end if;
  end loop;
end;
$policies$;
commit;
