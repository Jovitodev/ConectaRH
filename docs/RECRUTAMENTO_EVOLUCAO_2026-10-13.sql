-- Aplicada como recrutamento_fluxo_colaboradores_20261013 após revalidar o banco.
-- Aplicar também RECRUTAMENTO_PRIVACIDADE_2026-10-13.sql, que move o motivo para o histórico interno.
begin;

alter table public.vagas drop constraint vagas_status_check;
alter table public.vagas add constraint vagas_status_check check (status in ('rascunho','ativa','pausada','encerrada','cancelada'));
alter table public.candidaturas add column motivo_reprovacao text;
alter table public.candidaturas add constraint candidaturas_motivo_tamanho_check check (motivo_reprovacao is null or length(motivo_reprovacao)<=2000);

create table public.candidatura_eventos (
  id bigint generated always as identity primary key,
  candidatura_id bigint not null references public.candidaturas(id),
  autor_id uuid references auth.users(id),
  tipo text not null,
  detalhes jsonb not null,
  created_at timestamptz not null default now()
);
create index candidatura_eventos_consulta_idx on public.candidatura_eventos(candidatura_id,created_at desc,id desc);
create index candidatura_eventos_autor_idx on public.candidatura_eventos(autor_id);
alter table public.candidatura_eventos enable row level security;
revoke all on public.candidatura_eventos from public,anon,authenticated;
grant select on public.candidatura_eventos to authenticated;
create policy eventos_responsavel on public.candidatura_eventos for select to authenticated using (
  (select auth.jwt()->'app_metadata'->>'role')='colaborador' and exists (
    select 1 from public.candidaturas c join public.vagas v on v.id=c.vaga_id
    where c.id=candidatura_id and v.responsavel_auth_user_id=(select auth.uid())
  )
);

create table public.candidatura_registros (
  id bigint generated always as identity primary key,
  candidatura_id bigint not null references public.candidaturas(id),
  autor_id uuid not null references auth.users(id),
  autor_nome text not null,
  tipo text not null check (tipo in ('anotacao','avaliacao')),
  conteudo text not null check (length(trim(conteudo)) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index candidatura_registros_consulta_idx on public.candidatura_registros(candidatura_id,created_at desc,id desc);
create index candidatura_registros_autor_idx on public.candidatura_registros(autor_id);

create table public.entrevistas (
  id bigint generated always as identity primary key,
  candidatura_id bigint not null references public.candidaturas(id),
  autor_id uuid not null references auth.users(id),
  entrevistador text not null check (length(trim(entrevistador)) between 1 and 200),
  inicio timestamptz not null,
  fuso text not null default 'America/Sao_Paulo',
  duracao_minutos integer not null check (duracao_minutos between 5 and 480),
  modalidade text not null check (modalidade in ('Online','Presencial','Telefone')),
  local_ou_link text not null check (length(trim(local_ou_link)) between 1 and 2000),
  status text not null default 'agendada' check (status in ('agendada','concluida','cancelada')),
  observacoes text check (length(observacoes)<=10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index entrevistas_candidatura_inicio_idx on public.entrevistas(candidatura_id,inicio);
create index entrevistas_inicio_idx on public.entrevistas(inicio,status);
create index entrevistas_autor_idx on public.entrevistas(autor_id);

create table public.candidatura_mensagens (
  id bigint generated always as identity primary key,
  candidatura_id bigint not null references public.candidaturas(id),
  autor_id uuid not null references auth.users(id),
  assunto text not null check (length(trim(assunto)) between 1 and 200),
  conteudo text not null check (length(trim(conteudo)) between 1 and 10000),
  remetente text not null,
  destinatario text not null,
  status text not null default 'pendente' check (status in ('pendente','processamento','enviado','falha','entregue')),
  provider_id text,
  enviado_em timestamptz,
  entregue_em timestamptz,
  created_at timestamptz not null default now(),
  constraint mensagens_pendente_insert check (
    (status in ('pendente','falha','processamento') and entregue_em is null) or
    (status='enviado' and provider_id is not null and enviado_em is not null and entregue_em is null) or
    (status='entregue' and provider_id is not null and enviado_em is not null and entregue_em is not null)
  )
);
create index candidatura_mensagens_consulta_idx on public.candidatura_mensagens(candidatura_id,created_at desc,id desc);
create index candidatura_mensagens_autor_idx on public.candidatura_mensagens(autor_id);

-- Registros internos são visíveis somente ao responsável atual pela vaga.
do $policies$
declare tabela text;
begin
  foreach tabela in array array['candidatura_registros','entrevistas','candidatura_mensagens'] loop
    execute format('alter table public.%I enable row level security',tabela);
    execute format('revoke all on public.%I from public,anon,authenticated',tabela);
    execute format('grant select,insert on public.%I to authenticated',tabela);
    execute format('create policy responsavel_ler on public.%I for select to authenticated using (
      (select auth.jwt()->''app_metadata''->>''role'')=''colaborador'' and exists (
        select 1 from public.candidaturas c join public.vagas v on v.id=c.vaga_id
        where c.id=candidatura_id and v.responsavel_auth_user_id=(select auth.uid())
      ))',tabela);
    execute format('create policy responsavel_inserir on public.%I for insert to authenticated with check (
      autor_id=(select auth.uid()) and (select auth.jwt()->''app_metadata''->>''role'')=''colaborador'' and exists (
        select 1 from public.candidaturas c join public.vagas v on v.id=c.vaga_id
        where c.id=candidatura_id and v.responsavel_auth_user_id=(select auth.uid())
      ))',tabela);
  end loop;
end;
$policies$;
grant usage on sequence public.candidatura_registros_id_seq,public.entrevistas_id_seq,public.candidatura_mensagens_id_seq to authenticated;
grant update(status,updated_at) on public.entrevistas to authenticated;
create policy entrevistas_atualizar on public.entrevistas for update to authenticated using (
  (select auth.jwt()->'app_metadata'->>'role')='colaborador' and exists (
    select 1 from public.candidaturas c join public.vagas v on v.id=c.vaga_id
    where c.id=candidatura_id and v.responsavel_auth_user_id=(select auth.uid())
  )
) with check (
  (select auth.jwt()->'app_metadata'->>'role')='colaborador' and exists (
    select 1 from public.candidaturas c join public.vagas v on v.id=c.vaga_id
    where c.id=candidatura_id and v.responsavel_auth_user_id=(select auth.uid())
  )
);
grant update(motivo_reprovacao) on public.candidaturas to authenticated;

create schema if not exists private;
create function private.recrutamento_validar_movimento() returns trigger
language plpgsql security invoker set search_path='' as $fn$
declare etapas text[];
begin
  if new.etapa_atual is distinct from old.etapa_atual then
    select array_prepend('Triagem curricular',v.etapas_iniciais) into etapas from public.vagas v where v.id=new.vaga_id;
    if not (new.etapa_atual=any(etapas)) then raise exception 'Etapa não configurada para esta vaga'; end if;
    if old.status in ('reprovado','contratado','desistiu') then raise exception 'Candidatura finalizada não pode ser movimentada'; end if;
  end if;
  if new.status='reprovado' and nullif(trim(new.motivo_reprovacao),'') is null then
    raise exception 'Informe o motivo da reprovação';
  end if;
  new.updated_at=now();
  return new;
end;
$fn$;
revoke all on function private.recrutamento_validar_movimento() from public,anon,authenticated;
create trigger recrutamento_validar_movimento before update of etapa_atual,status,motivo_reprovacao on public.candidaturas
for each row execute function private.recrutamento_validar_movimento();

-- Trigger privado: escrita de auditoria atômica, sem endpoint privilegiado exposto.
create function private.recrutamento_auditar() returns trigger
language plpgsql security definer set search_path='' as $fn$
declare detalhes jsonb; tipo text;
begin
  if tg_table_name='candidaturas' then
    if new.etapa_atual is not distinct from old.etapa_atual and new.status is not distinct from old.status then return new; end if;
    detalhes=jsonb_build_object('etapa_origem',old.etapa_atual,'etapa_destino',new.etapa_atual,'status_origem',old.status,'status_destino',new.status,'motivo',new.motivo_reprovacao);
    tipo='movimentacao';
    insert into public.candidatura_eventos(candidatura_id,autor_id,tipo,detalhes) values(new.id,auth.uid(),tipo,detalhes);
  else
    if tg_table_name='entrevistas' then
      tipo='entrevista';
      detalhes=jsonb_build_object('registro_id',new.id,'status',new.status,'inicio',new.inicio);
    elsif tg_table_name='candidatura_mensagens' then
      tipo='mensagem_pendente'; detalhes=jsonb_build_object('registro_id',new.id);
    else
      tipo=new.tipo; detalhes=jsonb_build_object('registro_id',new.id);
    end if;
    insert into public.candidatura_eventos(candidatura_id,autor_id,tipo,detalhes) values(new.candidatura_id,auth.uid(),tipo,detalhes);
  end if;
  return new;
end;
$fn$;
revoke all on function private.recrutamento_auditar() from public,anon,authenticated;
create trigger recrutamento_auditar_movimento after update of etapa_atual,status on public.candidaturas for each row execute function private.recrutamento_auditar();
create trigger recrutamento_auditar_registro after insert on public.candidatura_registros for each row execute function private.recrutamento_auditar();
create trigger recrutamento_auditar_entrevista after insert or update of status on public.entrevistas for each row execute function private.recrutamento_auditar();
create trigger recrutamento_auditar_mensagem after insert on public.candidatura_mensagens for each row execute function private.recrutamento_auditar();

create function public.agendar_entrevista(p_candidatura_id bigint,p_inicio_local timestamp,p_fuso text,p_duracao integer,p_entrevistador text,p_modalidade text,p_local text,p_observacoes text)
returns bigint language plpgsql security invoker set search_path='' as $fn$
declare resultado bigint;
begin
  if not exists(select 1 from pg_catalog.pg_timezone_names where name=p_fuso) then raise exception 'Fuso inválido'; end if;
  if (p_inicio_local at time zone p_fuso)<=now() then raise exception 'Escolha um horário futuro'; end if;
  insert into public.entrevistas(candidatura_id,autor_id,inicio,fuso,duracao_minutos,entrevistador,modalidade,local_ou_link,observacoes)
  values(p_candidatura_id,auth.uid(),p_inicio_local at time zone p_fuso,p_fuso,p_duracao,p_entrevistador,p_modalidade,p_local,p_observacoes)
  returning id into resultado;
  return resultado;
end;
$fn$;
revoke all on function public.agendar_entrevista(bigint,timestamp,text,integer,text,text,text,text) from public,anon;
grant execute on function public.agendar_entrevista(bigint,timestamp,text,integer,text,text,text,text) to authenticated;

-- Emissão futura só via processo confiável. Frontend pode criar apenas pendências.
create function private.validar_mensagem_pendente() returns trigger language plpgsql security invoker set search_path='' as $fn$
declare destino text;
begin
  select email_candidato into destino from public.candidaturas where id=new.candidatura_id;
  if new.status<>'pendente' or new.provider_id is not null or new.enviado_em is not null or new.entregue_em is not null then raise exception 'Somente mensagens pendentes podem ser registradas'; end if;
  if new.destinatario is distinct from destino or new.remetente is distinct from (auth.jwt()->>'email') then raise exception 'Remetente ou destinatário inválido'; end if;
  return new;
end;
$fn$;
revoke all on function private.validar_mensagem_pendente() from public,anon,authenticated;
create trigger validar_mensagem_pendente before insert on public.candidatura_mensagens for each row execute function private.validar_mensagem_pendente();

create view public.recrutamento_vagas with (security_invoker=true) as
select v.*,e.nome as empresa_nome,
  (select count(*)::integer from public.candidaturas c where c.vaga_id=v.id) as candidaturas_total,
  (select count(*)::integer from public.candidaturas c where c.vaga_id=v.id and not exists(select 1 from public.feedbacks f where f.candidatura_id=c.id)) as sem_registro_feedback,
  (select count(*)::integer from public.candidaturas c where c.vaga_id=v.id and not exists(select 1 from public.feedbacks f where f.candidatura_id=c.id and f.status='enviado')
    and not exists(select 1 from public.candidatura_mensagens m where m.candidatura_id=c.id and m.status in ('enviado','entregue'))) as sem_feedback_enviado
from public.vagas v left join public.empresas e on e.id=v.empresa_id
where (select auth.jwt()->'app_metadata'->>'role')='colaborador' and v.responsavel_auth_user_id=(select auth.uid());
create view public.recrutamento_etapas with (security_invoker=true) as
select c.vaga_id,c.etapa_atual,c.status,count(*)::integer as total from public.candidaturas c
where (select auth.jwt()->'app_metadata'->>'role')='colaborador' and exists(select 1 from public.vagas v where v.id=c.vaga_id and v.responsavel_auth_user_id=(select auth.uid()))
group by c.vaga_id,c.etapa_atual,c.status;
revoke all on public.recrutamento_vagas,public.recrutamento_etapas from public,anon,authenticated;
grant select on public.recrutamento_vagas,public.recrutamento_etapas to authenticated;
commit;
