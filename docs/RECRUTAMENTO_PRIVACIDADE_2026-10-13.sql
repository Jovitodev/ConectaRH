-- Aplicada após recrutamento_fluxo_colaboradores_20261013.
-- Motivo pertence ao evento interno, nunca ao registro que o candidato consulta.
begin;
create or replace function private.recrutamento_validar_movimento() returns trigger
language plpgsql security invoker set search_path='' as $fn$
declare etapas text[]; motivo text;
begin
  if (new.etapa_atual is distinct from old.etapa_atual or new.status is distinct from old.status) and old.status in ('reprovado','contratado','desistiu') then
    raise exception 'Candidatura finalizada não pode ser movimentada';
  end if;
  if new.etapa_atual is distinct from old.etapa_atual then
    select array_prepend('Triagem curricular',v.etapas_iniciais) into etapas from public.vagas v where v.id=new.vaga_id;
    if not (new.etapa_atual=any(etapas)) then raise exception 'Etapa não configurada para esta vaga'; end if;
  end if;
  if new.status='reprovado' and new.status is distinct from old.status then
    motivo=pg_catalog.current_setting('conectarh.motivo_reprovacao',true);
    if nullif(trim(motivo),'') is null or length(motivo)>2000 then raise exception 'Use a ação de reprovação com motivo'; end if;
  end if;
  new.updated_at=now();
  return new;
end;
$fn$;

create or replace function private.recrutamento_auditar() returns trigger
language plpgsql security definer set search_path='' as $fn$
declare detalhes jsonb; tipo text;
begin
  if tg_table_name='candidaturas' then
    if new.etapa_atual is not distinct from old.etapa_atual and new.status is not distinct from old.status then return new; end if;
    detalhes=jsonb_build_object('etapa_origem',old.etapa_atual,'etapa_destino',new.etapa_atual,'status_origem',old.status,'status_destino',new.status);
    if new.status='reprovado' then detalhes=detalhes||jsonb_build_object('motivo',pg_catalog.current_setting('conectarh.motivo_reprovacao',true)); end if;
    insert into public.candidatura_eventos(candidatura_id,autor_id,tipo,detalhes) values(new.id,auth.uid(),'movimentacao',detalhes);
  else
    if tg_table_name='entrevistas' then
      tipo='entrevista'; detalhes=jsonb_build_object('registro_id',new.id,'status',new.status,'inicio',new.inicio);
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
drop trigger recrutamento_validar_movimento on public.candidaturas;
create trigger recrutamento_validar_movimento before update of etapa_atual,status on public.candidaturas for each row execute function private.recrutamento_validar_movimento();

-- Coluna adicionada nesta evolução, ainda sem dados, removida após verificação.
do $guard$
begin
  if exists(select 1 from public.candidaturas where motivo_reprovacao is not null) then raise exception 'Há motivos a preservar antes da remoção'; end if;
end;$guard$;
alter table public.candidaturas drop column motivo_reprovacao;

create function public.reprovar_candidatura(p_id bigint,p_status_anterior text,p_motivo text) returns bigint
language plpgsql security invoker set search_path='' as $fn$
declare resultado bigint;
begin
  if (auth.jwt()->'app_metadata'->>'role') is distinct from 'colaborador' then raise exception 'Acesso de recrutamento necessário'; end if;
  if nullif(trim(p_motivo),'') is null or length(p_motivo)>2000 then raise exception 'Informe um motivo de até 2000 caracteres'; end if;
  perform pg_catalog.set_config('conectarh.motivo_reprovacao',trim(p_motivo),true);
  update public.candidaturas set status='reprovado' where id=p_id and status=p_status_anterior and status not in ('reprovado','contratado','desistiu') returning id into resultado;
  perform pg_catalog.set_config('conectarh.motivo_reprovacao','',true);
  if resultado is null then raise exception 'Candidatura indisponível ou alterada por outra sessão'; end if;
  return resultado;
end;
$fn$;
revoke all on function public.reprovar_candidatura(bigint,text,text) from public,anon;
grant execute on function public.reprovar_candidatura(bigint,text,text) to authenticated;
commit;
