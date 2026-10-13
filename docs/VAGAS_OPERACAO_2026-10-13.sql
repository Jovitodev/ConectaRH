begin;
create table public.vaga_operacao (
 vaga_id bigint primary key references public.vagas(id),
 cv text check(char_length(cv) between 1 and 40),
 andamento text not null default 'alinhamento' check(andamento in ('alinhamento','rs','entrevista_gestor','admissao','suspensa','concluida','cancelada')),
 reposicao boolean not null default false,
 data_abertura date, data_reabertura date, motivo_reabertura text check(char_length(motivo_reabertura)<=2000),
 gestor text check(char_length(gestor)<=200), email text check(char_length(email)<=254), telefone text check(char_length(telefone)<=30),
 valor_proposta numeric(14,2) check(valor_proposta>=0), motivo_cancelamento text check(char_length(motivo_cancelamento)<=2000),
 previsao_alinhamento date, previsao_entrega date, previsao_entrevista date, previsao_admissao date,
 envio_material date, entrevista_tecnica date, fechamento date, previsao_faturamento date, inicio_suspensao date, fim_suspensao date,
 finalista_id bigint references public.candidaturas(id), escolha_finalista date,
 updated_at timestamptz not null default now(),
 check(data_reabertura is null or data_abertura is null or data_reabertura>=data_abertura),
 check(fechamento is null or data_abertura is null or fechamento>=data_abertura),
 check(fim_suspensao is null or inicio_suspensao is not null and fim_suspensao>=inicio_suspensao)
);
create index vaga_operacao_finalista_idx on public.vaga_operacao(finalista_id);
create table public.vaga_comentarios (
 id bigint generated always as identity primary key, vaga_id bigint not null references public.vagas(id),
 autor_id uuid not null default auth.uid() references auth.users(id), conteudo text not null check(char_length(trim(conteudo)) between 1 and 10000), created_at timestamptz not null default now()
);
create index vaga_comentarios_vaga_idx on public.vaga_comentarios(vaga_id,created_at desc);
create index vaga_comentarios_autor_idx on public.vaga_comentarios(autor_id);
create table public.recrutamento_opcoes (
 id bigint generated always as identity primary key, autor_id uuid not null default auth.uid() references auth.users(id),
 campo text not null check(campo in ('atencao','organizacao','iniciativa','raciocinio','personalidade','relacionamento','lideranca','comunicacao','area','parecer','resultado')),
 nome text not null check(char_length(trim(nome)) between 1 and 120), created_at timestamptz not null default now()
);
create unique index recrutamento_opcoes_unicas on public.recrutamento_opcoes(autor_id,campo,lower(trim(nome)));
create table public.candidatura_avaliacoes (
 id bigint generated always as identity primary key, candidatura_id bigint not null references public.candidaturas(id),
 autor_id uuid not null default auth.uid() references auth.users(id), dados jsonb not null check(jsonb_typeof(dados)='object' and octet_length(dados::text)<=64000), created_at timestamptz not null default now()
);
create index candidatura_avaliacoes_candidatura_idx on public.candidatura_avaliacoes(candidatura_id,created_at desc,id desc);
create index candidatura_avaliacoes_autor_idx on public.candidatura_avaliacoes(autor_id);
do $$ declare t text; pred text; begin
 foreach t in array array['vaga_operacao','vaga_comentarios','candidatura_avaliacoes'] loop
  execute format('alter table public.%I enable row level security',t);
  pred = case when t='candidatura_avaliacoes' then format('exists(select 1 from public.candidaturas c join public.vagas v on v.id=c.vaga_id where c.id=%I.candidatura_id and v.responsavel_auth_user_id=(select auth.uid()))',t)
   else format('exists(select 1 from public.vagas v where v.id=%I.vaga_id and v.responsavel_auth_user_id=(select auth.uid()))',t) end;
  pred = '((select auth.jwt())->''app_metadata''->>''role'')=''colaborador'' and '||pred;
  execute format('create policy operacao_ler on public.%I for select to authenticated using (%s)',t,pred);
  execute format('create policy operacao_inserir on public.%I for insert to authenticated with check (%s %s)',t,pred,case when t='vaga_operacao' then '' else 'and autor_id=(select auth.uid())' end);
  if t='vaga_operacao' then execute format('create policy operacao_atualizar on public.%I for update to authenticated using (%s) with check (%s)',t,pred,pred); end if;
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select,insert on public.%I to authenticated',t);
 end loop;
end $$;
grant update(cv,andamento,reposicao,data_abertura,data_reabertura,motivo_reabertura,gestor,email,telefone,valor_proposta,motivo_cancelamento,previsao_alinhamento,previsao_entrega,previsao_entrevista,previsao_admissao,envio_material,entrevista_tecnica,fechamento,previsao_faturamento,inicio_suspensao,fim_suspensao,finalista_id,escolha_finalista,updated_at) on public.vaga_operacao to authenticated;
alter table public.recrutamento_opcoes enable row level security;
revoke all on public.recrutamento_opcoes from anon,authenticated;
grant select,insert on public.recrutamento_opcoes to authenticated;
create policy opcoes_ler on public.recrutamento_opcoes for select to authenticated using (autor_id=(select auth.uid()) and ((select auth.jwt())->'app_metadata'->>'role')='colaborador');
create policy opcoes_inserir on public.recrutamento_opcoes for insert to authenticated with check (autor_id=(select auth.uid()) and ((select auth.jwt())->'app_metadata'->>'role')='colaborador');
grant usage on sequence public.vaga_comentarios_id_seq,public.recrutamento_opcoes_id_seq,public.candidatura_avaliacoes_id_seq to authenticated;
create function public.validar_vaga_operacao() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if new.finalista_id is not null and not exists(select 1 from public.candidaturas where id=new.finalista_id and vaga_id=new.vaga_id) then raise exception 'O finalista deve pertencer à vaga.'; end if;
 if new.andamento='cancelada' and nullif(trim(new.motivo_cancelamento),'') is null then raise exception 'Informe o motivo de cancelamento.'; end if;
 if new.data_reabertura is not null and nullif(trim(new.motivo_reabertura),'') is null then raise exception 'Informe o motivo de reabertura.'; end if;
 new.updated_at=now(); return new; end $$;
revoke all on function public.validar_vaga_operacao() from public,anon,authenticated;
create trigger validar_operacao before insert or update on public.vaga_operacao for each row execute function public.validar_vaga_operacao();
create view public.recrutamento_operacao with(security_invoker=true) as
 select r.*,o.cv,coalesce(o.andamento,'alinhamento') as andamento,coalesce(o.reposicao,false) as reposicao,o.data_abertura,o.previsao_alinhamento,o.previsao_entrega,o.previsao_entrevista,o.previsao_admissao,o.inicio_suspensao,o.fechamento
 from public.recrutamento_vagas r left join public.vaga_operacao o on o.vaga_id=r.id;
create view public.recrutamento_operacao_indicadores with(security_invoker=true) as select andamento,reposicao,count(*)::integer as total from public.recrutamento_operacao group by andamento,reposicao;
create view public.recrutamento_candidaturas with(security_invoker=true) as
 select c.*,(select e.detalhes->>'motivo' from public.candidatura_eventos e where e.candidatura_id=c.id and e.detalhes->>'motivo' is not null order by e.created_at desc,e.id desc limit 1) as motivo_interno
 from public.candidaturas c join public.vagas v on v.id=c.vaga_id
 where ((select auth.jwt())->'app_metadata'->>'role')='colaborador' and v.responsavel_auth_user_id=(select auth.uid());
revoke all on public.recrutamento_operacao,public.recrutamento_operacao_indicadores,public.recrutamento_candidaturas from anon,authenticated;
grant select on public.recrutamento_operacao,public.recrutamento_operacao_indicadores,public.recrutamento_candidaturas to authenticated;
commit;
