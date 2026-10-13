-- Teste com rollback. Verifique os IDs de referência antes de repetir em outro projeto.
begin;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',email,'role','authenticated','app_metadata',jsonb_build_object('role','comercial'))::text from auth.users where id='76b42bc0-30d3-4404-a915-8fe0edbdfdb1'),true);
set local role authenticated;
do $test$
declare negocio bigint; origem bigint; cidade integer; estado integer; cliente bigint; proposta bigint; dados jsonb; bloqueado boolean;
begin
  select c.id,c.estado_id into cidade,estado from public.cidades c join public.estados e on e.id=c.estado_id where c.nome='São Luís' and e.sigla='MA' limit 1;
  insert into public.comercial_opcoes(tipo,nome,criada_por) values('negocio','TESTE NEGÓCIO TRANSACIONAL',auth.uid()) returning id into negocio;
  insert into public.comercial_opcoes(tipo,nome,criada_por) values('origem','TESTE ORIGEM TRANSACIONAL',auth.uid()) returning id into origem;
  dados=jsonb_build_object('nome','TESTE COMERCIAL TRANSACIONAL 20261013','nome_fantasia','Teste Comercial','cnpj','11222333000181','solicitante','Contato de teste','negocio_id',negocio,'telefone','98999998888','email_contato','contato@example.com','email_faturamento','faturamento@example.com','cep','65000000','estado_id',estado,'cidade_id',cidade,'endereco','Endereço de teste','status','ativo');
  cliente=public.comercial_salvar_cliente(null,dados);
  if not exists(select 1 from public.comercial_clientes where id=cliente and cnpj='11222333000181' and email_faturamento='faturamento@example.com') then raise exception 'Cliente não persistido'; end if;
  perform public.comercial_salvar_cliente(cliente,dados||'{"nome_fantasia":"Teste editado"}'::jsonb);
  if not exists(select 1 from public.comercial_clientes where id=cliente and nome_fantasia='Teste editado') then raise exception 'Edição não persistida'; end if;
  insert into public.comercial_propostas(empresa_id,tipo,solicitante,email,telefone,data_envio,origem_id,taxa_percentual,cancelamento_percentual,vencimento_dias,reposicao_dias,criada_por)
  values(cliente,'rs','Contato de teste','contato@example.com','98999998888',current_date,origem,70,30,10,45,auth.uid()) returning id into proposta;
  update public.comercial_propostas set status='fechado',taxa_percentual=75 where id=proposta;
  insert into public.comercial_propostas(empresa_id,tipo,solicitante,email,telefone,data_envio,descricao,valor,criada_por)
  values(cliente,'riscos_psicossociais','Contato de teste','contato@example.com','98999998888',current_date,'Descrição de teste',1500,auth.uid());
  if not exists(select 1 from public.comercial_propostas_indicadores where empresa_id=cliente and tipo='rs' and fechado=1 and aguardando=0) then raise exception 'Indicadores incorretos'; end if;
  bloqueado=false;
  begin
    update public.comercial_propostas set taxa_percentual=101 where id=proposta;
  exception when check_violation then bloqueado=true; end;
  if not bloqueado then raise exception 'Taxa inválida aceita'; end if;
  bloqueado=false;
  begin
    perform public.comercial_salvar_cliente(null,dados||'{"nome":"TESTE INVÁLIDO 20261013","cnpj":"11222333000182"}'::jsonb);
  exception when others then bloqueado=true; end;
  if not bloqueado or exists(select 1 from public.empresas where nome='TESTE INVÁLIDO 20261013') then raise exception 'Falha de atomicidade'; end if;
  bloqueado=false;
  begin
    perform public.comercial_salvar_cliente(null,dados||'{"nome":"TESTE DUPLICADO 20261013"}'::jsonb);
  exception when unique_violation then bloqueado=true; end;
  if not bloqueado or exists(select 1 from public.empresas where nome='TESTE DUPLICADO 20261013') then raise exception 'Duplicação ou empresa órfã'; end if;
  update public.empresa_dados_comerciais set status='bloqueado' where empresa_id=cliente;
  if exists(select 1 from public.empresas where id=cliente and ativa) then raise exception 'Bloqueado disponível para novas vagas'; end if;
  update public.empresa_dados_comerciais set status='ativo',excluido_em=now() where empresa_id=cliente;
  if exists(select 1 from public.empresas where id=cliente and ativa) then raise exception 'Arquivado disponível'; end if;
  if (select count(*) from public.comercial_propostas where empresa_id=cliente)<>2 then raise exception 'Histórico perdido'; end if;
  update public.empresa_dados_comerciais set excluido_em=null where empresa_id=cliente;
  if not exists(select 1 from public.empresas where id=cliente and ativa) then raise exception 'Restauração incorreta'; end if;
end;$test$;

select set_config('request.jwt.claims','{"sub":"7eb62e50-b421-4d55-8f3d-8c40134c8075","role":"authenticated","app_metadata":{"role":"colaborador"}}',true);
do $test$ begin
if exists(select 1 from public.empresa_dados_comerciais) or exists(select 1 from public.comercial_propostas) or exists(select 1 from public.comercial_opcoes) or exists(select 1 from public.comercial_clientes) then raise exception 'Dados comerciais expostos ao recrutador'; end if;
end;$test$;
select set_config('request.jwt.claims','{"sub":"24293fdc-7373-4c6c-9b1a-280201b56d4a","role":"authenticated","app_metadata":{}}',true);
do $test$ declare bloqueado boolean=false; begin
if exists(select 1 from public.empresa_dados_comerciais) or exists(select 1 from public.comercial_propostas) or exists(select 1 from public.comercial_opcoes) or exists(select 1 from public.comercial_clientes) then raise exception 'Dados comerciais expostos ao candidato'; end if;
begin perform public.comercial_salvar_cliente(null,'{}'); exception when raise_exception then if sqlerrm='Acesso Comercial necessário' then bloqueado=true; else raise; end if; end;
if not bloqueado then raise exception 'RPC acessível ao candidato'; end if;
end;$test$;
set local role anon;
do $test$ declare bloqueado boolean=false; begin
begin perform 1 from public.empresa_dados_comerciais; exception when insufficient_privilege then bloqueado=true; end;
if not bloqueado then raise exception 'Dados comerciais públicos'; end if;
end;$test$;
select 'RLS: recrutador, candidato e visitante sem acesso a contatos, faturamento, opções e propostas' resultado;
rollback;
