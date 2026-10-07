-- Contexto mínimo da vaga na candidatura, legível apenas pelo candidato dono
-- ou pelo colaborador responsável, conforme o RLS já existente em candidaturas.
alter table public.candidaturas
  add column vaga_titulo text,
  add column vaga_empresa text,
  add column vaga_localidade text,
  add column vaga_modalidade text,
  add column vaga_contrato text,
  add column vaga_areas text[] not null default '{}',
  add column vaga_etapas text[] not null default '{}',
  add column vaga_status text,
  add column vaga_visibilidade text,
  add column vaga_salario_min numeric(12,2),
  add column vaga_salario_max numeric(12,2),
  add column vaga_publicada_em timestamptz;

update public.candidaturas ca set
  vaga_titulo = v.titulo,
  vaga_empresa = e.nome,
  vaga_localidade = v.localidade_texto,
  vaga_modalidade = v.modalidade,
  vaga_contrato = v.contrato,
  vaga_areas = v.areas,
  vaga_etapas = v.etapas_iniciais,
  vaga_status = v.status,
  vaga_visibilidade = v.visibilidade,
  vaga_salario_min = v.salario_min,
  vaga_salario_max = v.salario_max,
  vaga_publicada_em = v.publicada_em
from public.vagas v join public.empresas e on e.id = v.empresa_id
where ca.vaga_id = v.id;

alter table public.candidaturas
  alter column vaga_titulo set not null,
  alter column vaga_empresa set not null,
  alter column vaga_status set not null;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.candidatura_vaga_contexto()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  select vagas.titulo, empresas.nome as empresa, vagas.localidade_texto,
    vagas.modalidade, vagas.contrato, vagas.areas, vagas.etapas_iniciais,
    vagas.status, vagas.visibilidade, vagas.salario_min, vagas.salario_max,
    vagas.publicada_em
  into strict v
  from public.vagas join public.empresas on empresas.id = vagas.empresa_id
  where vagas.id = new.vaga_id;
  new.vaga_titulo := v.titulo;
  new.vaga_empresa := v.empresa;
  new.vaga_localidade := v.localidade_texto;
  new.vaga_modalidade := v.modalidade;
  new.vaga_contrato := v.contrato;
  new.vaga_areas := v.areas;
  new.vaga_etapas := v.etapas_iniciais;
  new.vaga_status := v.status;
  new.vaga_visibilidade := v.visibilidade;
  new.vaga_salario_min := v.salario_min;
  new.vaga_salario_max := v.salario_max;
  new.vaga_publicada_em := v.publicada_em;
  return new;
end $$;

create trigger candidaturas_vaga_contexto_insert
before insert on public.candidaturas
for each row execute function private.candidatura_vaga_contexto();

create function private.propagar_vaga_contexto()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.candidaturas ca set
    vaga_titulo = new.titulo,
    vaga_empresa = (select e.nome from public.empresas e where e.id = new.empresa_id),
    vaga_localidade = new.localidade_texto,
    vaga_modalidade = new.modalidade,
    vaga_contrato = new.contrato,
    vaga_areas = new.areas,
    vaga_etapas = new.etapas_iniciais,
    vaga_status = new.status,
    vaga_visibilidade = new.visibilidade,
    vaga_salario_min = new.salario_min,
    vaga_salario_max = new.salario_max,
    vaga_publicada_em = new.publicada_em
  where ca.vaga_id = new.id;
  return new;
end $$;

create trigger vagas_propagar_contexto
after update of titulo, empresa_id, localidade_texto, modalidade, contrato,
  areas, etapas_iniciais, status, visibilidade, salario_min, salario_max,
  publicada_em on public.vagas
for each row execute function private.propagar_vaga_contexto();

revoke all on function private.candidatura_vaga_contexto() from public, anon, authenticated;
revoke all on function private.propagar_vaga_contexto() from public, anon, authenticated;
