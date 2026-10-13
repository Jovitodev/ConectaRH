-- Evolução aditiva: preserva empresas e vínculos de vagas.
begin;
create table public.comercial_opcoes (
  id bigint generated always as identity primary key,
  tipo text not null check(tipo in ('negocio','origem')),
  nome text not null check(length(trim(nome)) between 2 and 120),
  criada_por uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create unique index comercial_opcoes_nome_idx on public.comercial_opcoes(tipo,lower(trim(nome)));
create index comercial_opcoes_autor_idx on public.comercial_opcoes(criada_por);

create table public.empresa_dados_comerciais (
  empresa_id bigint primary key references public.empresas(id),
  nome_fantasia text,
  cnpj text unique,
  solicitante text,
  negocio_id bigint references public.comercial_opcoes(id),
  telefone text,
  email_contato text,
  email_faturamento text,
  cep text,
  estado_id integer references public.estados(id),
  cidade_id integer,
  endereco text,
  status text not null default 'pendente' check(status in ('ativo','inativo','pendente','bloqueado')),
  excluido_em timestamptz,
  updated_at timestamptz not null default now(),
  constraint comercial_cidade_estado_fk foreign key(cidade_id,estado_id) references public.cidades(id,estado_id),
  constraint comercial_cep_check check(cep is null or cep ~ '^[0-9]{8}$'),
  constraint comercial_telefone_check check(telefone is null or telefone ~ '^[0-9]{10,11}$'),
  constraint comercial_cnpj_formato_check check(cnpj is null or cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$')
);
create index empresa_comercial_status_idx on public.empresa_dados_comerciais(status,empresa_id) where excluido_em is null;
create index empresa_comercial_negocio_idx on public.empresa_dados_comerciais(negocio_id);
create index empresa_comercial_cidade_idx on public.empresa_dados_comerciais(cidade_id,estado_id);
create index empresa_comercial_estado_idx on public.empresa_dados_comerciais(estado_id);
-- Nenhum contato ou documento é inventado para empresas já existentes.
insert into public.empresa_dados_comerciais(empresa_id,status)
select id,case when ativa then 'ativo' else 'inativo' end from public.empresas;

create table public.comercial_propostas (
  id bigint generated always as identity primary key,
  empresa_id bigint not null references public.empresas(id),
  tipo text not null check(tipo in ('rs','riscos_psicossociais')),
  status text not null default 'aguardando' check(status in ('fechado','aguardando','nao_fechado')),
  solicitante text not null check(length(trim(solicitante)) between 2 and 200),
  email text not null,
  telefone text not null,
  data_envio date not null,
  origem_id bigint references public.comercial_opcoes(id),
  taxa_percentual numeric(5,2),
  cancelamento_percentual numeric(5,2),
  vencimento_dias integer,
  reposicao_dias integer,
  descricao text,
  valor numeric(14,2),
  criada_por uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint propostas_rs_campos check(tipo<>'rs' or (origem_id is not null and taxa_percentual between 0 and 100 and taxa_percentual is not null and cancelamento_percentual between 0 and 100 and cancelamento_percentual is not null and vencimento_dias>=0 and vencimento_dias is not null and reposicao_dias>=0 and reposicao_dias is not null)),
  constraint propostas_riscos_campos check(tipo<>'riscos_psicossociais' or (length(trim(descricao)) between 3 and 10000 and descricao is not null and valor>=0 and valor is not null)),
  constraint proposta_email_check check(email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint proposta_telefone_check check(telefone ~ '^[0-9]{10,11}$')
);
create index propostas_empresa_tipo_data_idx on public.comercial_propostas(empresa_id,tipo,data_envio desc,id desc);
create index propostas_status_idx on public.comercial_propostas(tipo,status);
create index propostas_origem_idx on public.comercial_propostas(origem_id);
create index propostas_autor_idx on public.comercial_propostas(criada_por);

do $rls$
declare tabela text;
begin
  foreach tabela in array array['comercial_opcoes','empresa_dados_comerciais','comercial_propostas'] loop
    execute format('alter table public.%I enable row level security',tabela);
    execute format('revoke all on public.%I from public,anon,authenticated',tabela);
    execute format('grant select,insert,update on public.%I to authenticated',tabela);
    execute format('create policy comercial_ler on public.%I for select to authenticated using (((select auth.jwt())->''app_metadata''->>''role'')=''comercial'')',tabela);
    execute format('create policy comercial_inserir on public.%I for insert to authenticated with check (((select auth.jwt())->''app_metadata''->>''role'')=''comercial'')',tabela);
    execute format('create policy comercial_atualizar on public.%I for update to authenticated using (((select auth.jwt())->''app_metadata''->>''role'')=''comercial'') with check (((select auth.jwt())->''app_metadata''->>''role'')=''comercial'')',tabela);
  end loop;
end;$rls$;
revoke update on public.comercial_opcoes from authenticated;
alter policy comercial_inserir on public.comercial_opcoes with check (((select auth.jwt())->'app_metadata'->>'role')='comercial' and criada_por=(select auth.uid()));
revoke update on public.comercial_propostas from authenticated;
grant update(status,solicitante,email,telefone,data_envio,origem_id,taxa_percentual,cancelamento_percentual,vencimento_dias,reposicao_dias,descricao,valor,updated_at) on public.comercial_propostas to authenticated;
grant usage on sequence public.comercial_opcoes_id_seq,public.comercial_propostas_id_seq to authenticated;

create function public.comercial_cnpj_valido(p_cnpj text) returns boolean
language plpgsql immutable security invoker set search_path='' as $fn$
declare s text; n integer; soma integer; i integer; tamanho integer; digito integer; pesos integer[];
begin
  s=upper(regexp_replace(coalesce(p_cnpj,''),'[^a-zA-Z0-9]','','g'));
  if s !~ '^[A-Z0-9]{12}[0-9]{2}$' or s ~ '^([0-9])\1{13}$' then return false; end if;
  for tamanho in 12..13 loop
    pesos=case when tamanho=12 then array[5,4,3,2,9,8,7,6,5,4,3,2] else array[6,5,4,3,2,9,8,7,6,5,4,3,2] end;
    soma=0;
    for i in 1..tamanho loop soma=soma+(ascii(substr(s,i,1))-48)*pesos[i]; end loop;
    n=soma%11; digito=case when n<2 then 0 else 11-n end;
    if substr(s,tamanho+1,1)::integer<>digito then return false; end if;
  end loop;
  return true;
end;$fn$;
revoke all on function public.comercial_cnpj_valido(text) from public,anon;
grant execute on function public.comercial_cnpj_valido(text) to authenticated;

create function private.comercial_validar_cliente() returns trigger
language plpgsql security invoker set search_path='' as $fn$
declare validar boolean;
begin
  validar=tg_op='INSERT';
  if tg_op='UPDATE' then
    validar=row(new.nome_fantasia,new.cnpj,new.solicitante,new.negocio_id,new.telefone,new.email_contato,new.email_faturamento,new.cep,new.estado_id,new.cidade_id,new.endereco)
      is distinct from row(old.nome_fantasia,old.cnpj,old.solicitante,old.negocio_id,old.telefone,old.email_contato,old.email_faturamento,old.cep,old.estado_id,old.cidade_id,old.endereco);
  end if;
  if validar then
    if nullif(trim(new.nome_fantasia),'') is null or nullif(trim(new.solicitante),'') is null or new.negocio_id is null or new.estado_id is null or new.cidade_id is null or nullif(trim(new.endereco),'') is null or new.cep is null or new.telefone is null then raise exception 'Preencha todos os campos obrigatórios do cliente'; end if;
    if new.email_contato is null or new.email_faturamento is null or new.email_contato !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or new.email_faturamento !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Informe e-mails válidos'; end if;
    if not public.comercial_cnpj_valido(new.cnpj) then raise exception 'CNPJ inválido'; end if;
    if not exists(select 1 from public.comercial_opcoes where id=new.negocio_id and tipo='negocio') then raise exception 'Tipo de negócio inválido'; end if;
  end if;
  new.updated_at=now();
  return new;
end;$fn$;
create trigger comercial_validar_cliente before insert or update on public.empresa_dados_comerciais for each row execute function private.comercial_validar_cliente();

create function private.comercial_sincronizar_status() returns trigger
language plpgsql security invoker set search_path='' as $fn$
begin
  update public.empresas set ativa=(new.status='ativo' and new.excluido_em is null),updated_at=now() where id=new.empresa_id;
  return new;
end;$fn$;
create trigger comercial_sincronizar_status after insert or update of status,excluido_em on public.empresa_dados_comerciais for each row execute function private.comercial_sincronizar_status();

create function private.comercial_validar_proposta() returns trigger
language plpgsql security invoker set search_path='' as $fn$
begin
  if tg_op='INSERT' and new.criada_por is distinct from auth.uid() then raise exception 'Autor inválido'; end if;
  if exists(select 1 from public.empresa_dados_comerciais where empresa_id=new.empresa_id and excluido_em is not null) then raise exception 'Restaure o cliente antes de alterar propostas'; end if;
  if not exists(select 1 from public.empresa_dados_comerciais where empresa_id=new.empresa_id) then raise exception 'Cliente não encontrado'; end if;
  if new.origem_id is not null and not exists(select 1 from public.comercial_opcoes where id=new.origem_id and tipo='origem') then raise exception 'Origem inválida'; end if;
  new.updated_at=now();
  return new;
end;$fn$;
create trigger comercial_validar_proposta before insert or update on public.comercial_propostas for each row execute function private.comercial_validar_proposta();
revoke all on function private.comercial_validar_cliente(),private.comercial_sincronizar_status(),private.comercial_validar_proposta() from public,anon,authenticated;

-- Invocador mantém RLS; salva empresa e detalhes na mesma transação.
create function public.comercial_salvar_cliente(p_id bigint,p_dados jsonb) returns bigint
language plpgsql security invoker set search_path='' as $fn$
declare resultado bigint; v_status text;
begin
  if (auth.jwt()->'app_metadata'->>'role') is distinct from 'comercial' then raise exception 'Acesso Comercial necessário'; end if;
  if length(trim(coalesce(p_dados->>'nome','')))<2 then raise exception 'Informe a razão social'; end if;
  v_status=coalesce(p_dados->>'status','pendente');
  if p_id is null then
    insert into public.empresas(nome,ativa,cadastrada_por) values(trim(p_dados->>'nome'),v_status='ativo',auth.uid()) returning id into resultado;
  else
    perform 1 from public.empresa_dados_comerciais where empresa_id=p_id and excluido_em is null for update;
    if not found then raise exception 'Cliente indisponível'; end if;
    update public.empresas set nome=trim(p_dados->>'nome'),updated_at=now() where id=p_id returning id into resultado;
    if resultado is null then raise exception 'Cliente indisponível'; end if;
  end if;
  insert into public.empresa_dados_comerciais(empresa_id,nome_fantasia,cnpj,solicitante,negocio_id,telefone,email_contato,email_faturamento,cep,estado_id,cidade_id,endereco,status)
  values(resultado,trim(p_dados->>'nome_fantasia'),upper(regexp_replace(p_dados->>'cnpj','[^a-zA-Z0-9]','','g')),trim(p_dados->>'solicitante'),(p_dados->>'negocio_id')::bigint,regexp_replace(p_dados->>'telefone','\D','','g'),lower(trim(p_dados->>'email_contato')),lower(trim(p_dados->>'email_faturamento')),regexp_replace(p_dados->>'cep','\D','','g'),(p_dados->>'estado_id')::integer,(p_dados->>'cidade_id')::integer,trim(p_dados->>'endereco'),v_status)
  on conflict(empresa_id) do update set nome_fantasia=excluded.nome_fantasia,cnpj=excluded.cnpj,solicitante=excluded.solicitante,negocio_id=excluded.negocio_id,telefone=excluded.telefone,email_contato=excluded.email_contato,email_faturamento=excluded.email_faturamento,cep=excluded.cep,estado_id=excluded.estado_id,cidade_id=excluded.cidade_id,endereco=excluded.endereco,status=excluded.status;
  return resultado;
end;$fn$;
revoke all on function public.comercial_salvar_cliente(bigint,jsonb) from public,anon;
grant execute on function public.comercial_salvar_cliente(bigint,jsonb) to authenticated;

create view public.comercial_clientes with(security_invoker=true) as
select e.id,e.nome,e.ativa,e.created_at,e.updated_at as empresa_updated_at,
  d.nome_fantasia,d.cnpj,d.solicitante,d.negocio_id,o.nome as negocio_nome,d.telefone,d.email_contato,d.email_faturamento,d.cep,d.estado_id,es.sigla as estado,d.cidade_id,c.nome as cidade,d.endereco,d.status,d.excluido_em,d.updated_at
from public.empresas e join public.empresa_dados_comerciais d on d.empresa_id=e.id
left join public.comercial_opcoes o on o.id=d.negocio_id
left join public.estados es on es.id=d.estado_id left join public.cidades c on c.id=d.cidade_id;
create view public.comercial_indicadores with(security_invoker=true) as
select count(*)::integer total,count(*) filter(where status='ativo')::integer ativos,count(*) filter(where status='inativo')::integer inativos,count(*) filter(where status='pendente')::integer pendentes,count(*) filter(where status='bloqueado')::integer bloqueados
from public.empresa_dados_comerciais where excluido_em is null;
create view public.comercial_propostas_indicadores with(security_invoker=true) as
select empresa_id,tipo,count(*)::integer total,count(*) filter(where status='fechado')::integer fechado,count(*) filter(where status='aguardando')::integer aguardando,count(*) filter(where status='nao_fechado')::integer nao_fechado from public.comercial_propostas group by empresa_id,tipo;
revoke all on public.comercial_clientes,public.comercial_indicadores,public.comercial_propostas_indicadores from public,anon,authenticated;
grant select on public.comercial_clientes,public.comercial_indicadores,public.comercial_propostas_indicadores to authenticated;
commit;
