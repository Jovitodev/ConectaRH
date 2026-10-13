-- Teste com rollback. Verifique os IDs de referência antes de repetir em outro projeto.
begin;
select set_config('request.jwt.claims','{"sub":"76b42bc0-30d3-4404-a915-8fe0edbdfdb1","role":"authenticated","app_metadata":{"role":"comercial"}}',true);
set local role authenticated;
update public.empresa_dados_comerciais set status='bloqueado' where empresa_id=(select empresa_id from public.vagas where id=4);
select set_config('request.jwt.claims','{"sub":"7eb62e50-b421-4d55-8f3d-8c40134c8075","role":"authenticated","app_metadata":{"role":"colaborador"}}',true);
do $test$ begin
if not exists(select 1 from public.vagas v join public.empresas e on e.id=v.empresa_id where v.id=4 and not e.ativa) then raise exception 'Identificação da vaga perdida'; end if;
if exists(select 1 from public.empresas where id=(select empresa_id from public.vagas where id=4) and ativa) then raise exception 'Empresa bloqueada selecionável'; end if;
end;$test$;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $test$ begin
if not exists(select 1 from public.vagas v join public.empresas e on e.id=v.empresa_id where v.id=4) then raise exception 'Identificação pública perdida'; end if;
end;$test$;
select 'Cliente bloqueado indisponível para novas vagas; identificação de vagas existentes preservada para recrutador e público' resultado;
rollback;
