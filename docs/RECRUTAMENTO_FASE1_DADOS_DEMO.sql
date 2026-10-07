-- Dados persistentes de demonstração da Fase 1. Idempotente por nome de empresa,
-- título de vaga, par vaga/candidato e candidatura com feedback já registrado.
-- Não cria contas Auth, candidatos, áreas ou localidades.
begin;

insert into public.empresas (nome, ativa)
select seed.nome, true
from (values
  ('DEMO | Atlântico Tecnologia'),
  ('DEMO | Maranhão Gestão'),
  ('DEMO | Horizonte Serviços'),
  ('DEMO | Litoral Comércio'),
  ('DEMO | Norte Operações')
) as seed(nome)
where not exists (select 1 from public.empresas e where lower(e.nome) = lower(seed.nome));

with specs(empresa, titulo, area, cidade, modalidade, salario_min, salario_max, dias_publicada, status, descricao, requisito) as (
  values
  ('DEMO | Maranhão Gestão','Analista Administrativo','Administrativo','São Luís','Presencial',2800,4200,100,'ativa','Organizar rotinas administrativas, documentos e indicadores da operação.','Experiência em rotinas administrativas e planilhas.'),
  ('DEMO | Atlântico Tecnologia','Desenvolvedor Front-end','Tecnologia','São Luís','Híbrido',4500,7000,85,'ativa','Desenvolver interfaces web acessíveis e colaborar com produto e design.','Conhecimento de React, JavaScript e acessibilidade.'),
  ('DEMO | Maranhão Gestão','Analista de Recursos Humanos','Recursos Humanos','Imperatriz','Presencial',3200,5000,68,'ativa','Apoiar recrutamento, integração e indicadores de pessoas.','Experiência em processos seletivos e comunicação.'),
  ('DEMO | Horizonte Serviços','Assistente Financeiro','Financeiro','São Luís','Presencial',2100,3100,45,'ativa','Apoiar contas a pagar, conciliação e controles financeiros.','Organização e conhecimento de planilhas.'),
  ('DEMO | Litoral Comércio','Analista Comercial','Comercial / Vendas','Caxias','Híbrido',3000,4800,35,'ativa','Acompanhar carteira de clientes e oportunidades comerciais.','Vivência com atendimento e CRM.'),
  ('DEMO | Norte Operações','Auxiliar de Logística','Logística / Operações','Bacabal','Presencial',1800,2600,10,'ativa','Apoiar recebimento, conferência e movimentação de materiais.','Organização e disponibilidade para operação presencial.'),
  ('DEMO | Atlântico Tecnologia','Técnico de Informática','Tecnologia','Imperatriz','Presencial',2400,3500,3,'ativa','Prestar suporte a equipamentos, redes e usuários.','Conhecimento de manutenção e suporte técnico.'),
  ('DEMO | Atlântico Tecnologia','Desenvolvedor Back-end','Tecnologia','São Luís','Remoto',5000,8000,92,'pausada','Construir APIs e integrações para produtos digitais.','Experiência com APIs, bancos de dados e testes.'),
  ('DEMO | Horizonte Serviços','Assistente Administrativo','Administrativo','São Luís','Presencial',1900,2800,75,'encerrada','Apoiar atendimento interno, arquivos e controle de documentos.','Boa comunicação e organização.'),
  ('DEMO | Norte Operações','Analista de Suporte','Tecnologia','Imperatriz','Híbrido',2700,3900,20,'encerrada','Atender chamados técnicos e registrar soluções.','Experiência com suporte a usuários.')
)
insert into public.vagas (
  empresa_id, responsavel_auth_user_id, titulo, departamento, descricao,
  cidade_id, estado_id, localidade_texto, modalidade, contrato,
  salario_min, salario_max, requisitos, beneficios, areas, etapas_iniciais,
  visibilidade, status, inscricoes_inicio, inscricoes_fim, publicada_em, created_at
)
select e.id, a.id, s.titulo, s.area, s.descricao,
  c.id, st.id, c.nome || ', ' || st.sigla, s.modalidade, 'CLT',
  s.salario_min, s.salario_max, array[s.requisito], array['Vale-transporte','Vale-alimentação'],
  array[s.area], array['Triagem curricular','Entrevista','Entrevista com gestor'],
  'publica', s.status, current_date - s.dias_publicada,
  case when s.status='encerrada' then current_date - 2 else current_date + 30 end,
  now() - make_interval(days => s.dias_publicada), now() - make_interval(days => s.dias_publicada)
from specs s
join public.empresas e on e.nome=s.empresa
join public.cidades c on c.nome=s.cidade
join public.estados st on st.id=c.estado_id and st.sigla='MA'
cross join lateral (select id from auth.users where raw_app_meta_data->>'role'='colaborador' order by id limit 1) a
where not exists (select 1 from public.vagas v where v.empresa_id=e.id and lower(v.titulo)=lower(s.titulo));

-- Somente duas contas de candidato têm Auth vinculado e dados profissionais
-- suficientes. A terceira conta de candidato está sem currículo e o quarto
-- vínculo Auth pertence ao colaborador. Não fabricar identidades.
with targets(titulo, candidato_id, etapa, status) as (
  values
  ('Analista Administrativo',23,'Triagem curricular','em_andamento'),
  ('Analista Administrativo',26,'Entrevista','em_andamento'),
  ('Desenvolvedor Front-end',23,'Teste','em_andamento'),
  ('Desenvolvedor Front-end',26,'Triagem curricular','em_andamento'),
  ('Analista de Recursos Humanos',23,'Entrevista com gestor','em_andamento'),
  ('Analista de Recursos Humanos',26,'Triagem curricular','reprovado'),
  ('Assistente Financeiro',23,'Triagem curricular','em_andamento'),
  ('Assistente Financeiro',26,'Entrevista','em_andamento'),
  ('Analista Comercial',23,'Triagem curricular','em_andamento'),
  ('Auxiliar de Logística',26,'Triagem curricular','em_andamento'),
  ('Desenvolvedor Back-end',23,'Entrevista','em_andamento'),
  ('Desenvolvedor Back-end',26,'Triagem curricular','em_andamento'),
  ('Assistente Administrativo',23,'Entrevista com gestor','aprovado'),
  ('Assistente Administrativo',26,'Triagem curricular','reprovado')
)
insert into public.candidaturas (
  vaga_id,candidato_id,usuario_id,candidato_auth_user_id,nome_candidato,email_candidato,
  cidade_candidato,estado_candidato,escolaridade,experiencias_resumo,
  habilidades,idiomas_resumo,areas,etapa_atual,status,aplicada_em
)
select v.id,c.id,u.id,u.auth_user_id,u.nome,u.email,c.cidade,c.estado,
  (select coalesce(f.grau,f.curso) from public.formacoes f where f.candidato_id=c.id order by f.id desc limit 1),
  coalesce((select jsonb_agg(jsonb_build_object('role',x.cargo,'company',x.empresa,'period',jsonb_build_object('start',x.data_inicio,'end',x.data_fim),'description',x.descricao) order by x.id) from public.experiencias x where x.candidato_id=c.id),'[]'::jsonb),
  coalesce((select array_agg(h.nome order by h.id) from public.habilidades h where h.candidato_id=c.id),'{}'::text[]),
  coalesce((select jsonb_agg(jsonb_build_object('name',i.nome,'level',i.nivel) order by i.id) from public.idiomas i where i.candidato_id=c.id),'[]'::jsonb),
  coalesce((select array_agg(ar.nome order by ar.id) from public.candidato_areas ca join public.areas ar on ar.id=ca.area_id where ca.candidato_id=c.id),'{}'::text[]),
  t.etapa,t.status, case when v.status='encerrada' then v.inscricoes_fim::timestamptz - interval '1 day' else greatest(v.publicada_em + interval '1 day',now() - interval '1 day') end
from targets t
join public.vagas v on v.titulo=t.titulo
join public.candidatos c on c.id=t.candidato_id
join public.usuarios u on u.id=c.usuario_id and u.auth_user_id is not null
join auth.users au on au.id=u.auth_user_id and coalesce(au.raw_app_meta_data->>'role','candidato')<>'colaborador'
where not exists (select 1 from public.candidaturas ca where ca.vaga_id=v.id and ca.candidato_id=c.id);

with targets(titulo,candidato_id,observacao) as (
  values
  ('Analista Administrativo',23,'DEMO: avaliação inicial registrada; comunicação ainda pendente.'),
  ('Desenvolvedor Front-end',23,'DEMO: perfil encaminhado para análise técnica; comunicação ainda pendente.'),
  ('Desenvolvedor Front-end',26,'DEMO: avaliação técnica registrada; comunicação ainda pendente.'),
  ('Analista de Recursos Humanos',23,'DEMO: entrevista com gestor registrada; comunicação ainda pendente.'),
  ('Assistente Financeiro',26,'DEMO: entrevista em preparação; comunicação ainda pendente.'),
  ('Assistente Administrativo',23,'DEMO: decisão de aprovação registrada; comunicação ainda pendente.'),
  ('Assistente Administrativo',26,'DEMO: decisão de reprovação registrada; comunicação ainda pendente.')
)
insert into public.feedbacks(candidatura_id,etapa,canal,status,observacao,responsavel_auth_user_id)
select ca.id,ca.etapa_atual,'manual','pendente',t.observacao,v.responsavel_auth_user_id
from targets t
join public.vagas v on v.titulo=t.titulo
join public.candidaturas ca on ca.vaga_id=v.id and ca.candidato_id=t.candidato_id
where not exists (select 1 from public.feedbacks f where f.candidatura_id=ca.id and f.observacao=t.observacao);

commit;
