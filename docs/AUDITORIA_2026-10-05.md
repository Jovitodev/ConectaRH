# Auditoria técnica do ConectaRH — 05/10/2026

## 1. Resumo executivo

O projeto é um portal React/Vite híbrido. Supabase Auth autentica candidatos e colaboradores; o currículo, as áreas e as mensagens do candidato usam tabelas reais. As vagas, candidaturas e a maior parte do painel do colaborador usam dados de demonstração ou localStorage. Não há um backend de vagas/candidaturas compartilhado. Esta auditoria não criou contas nem removeu dados. Corrigiu duas permissões pontuais, passou a detectar atualizações que afetem zero registros e corrigiu labels do login. A persistência com contas reais e os fluxos administrativos ainda precisam de testes autenticados.

## 2. Arquitetura atual

| Camada | Implementação |
| --- | --- |
| Interface | React 18, Vite, Tailwind, Radix/shadcn, componentes em `src/components/` |
| Navegação | `src/App.jsx`: `pathname` + estado React; sem React Router |
| Auth | Supabase Auth em `src/lib/authStore.js`; `app_metadata.role=colaborador` diferencia colaborador |
| Dados de candidato | `candidateStore.js`, `candidateExtras.js`, `profileFiles.js` com Supabase Data API/Storage |
| Dados de vagas | `mockData.js`, `adminData.js`, estado React e `localStore.js` |
| Configuração | `.env` ignorado pelo Git, com URL e chave publicável; `vite.config.js` |
| Banco | 11 tabelas públicas reais, RLS habilitada em todas; buckets privados `avatars` (legado) e `pcd-documents` |

Não há diretório `hooks/` nem serviço de backend próprio. `supabase/schema.sql` descreve uma proposta histórica incompatível com o banco conectado.

## 3. Telas encontradas

**Público:** Home `/` com busca, filtros e diálogo de detalhes; `/login`, `/cadastro`; `/colaborador/login`.

**Candidato:** `/cadastro-curriculo`; após login, abas Buscar Vagas, Minhas Candidaturas, Meu Perfil, Meu Currículo, Configurações, Suporte e Central de Mensagens. As abas são estado de `App`, não URLs individuais. O processo de candidatura detalhado está dentro de Minhas Candidaturas.

**Colaborador:** Dashboard, Controle de Vagas, Criar/Editar Vaga, Templates, Gestão/Detalhe de Candidatos, Kanban, Agenda, Relatórios, Equipe e Configurações. São vistas de `adminView`, não URLs independentes. Nenhuma rota dedicada de Candidaturas foi encontrada.

## 4. Fluxo do candidato

Visitante pode ver, filtrar e abrir vagas sem sessão. Clicar em candidatura redireciona a `/login`; cadastro básico gera `usuarios` e `candidatos` por trigger. `perfil_completo=0` leva a `/cadastro-curriculo`; o usuário salva seções nas tabelas atuais e finaliza após salvar cargo, cidade, estado e ao menos uma área. A finalização grava `perfil_completo=100` e vai para Home. Valores maiores que zero seguem para área normal. Esse campo mistura indicador de preenchimento e marco de conclusão; separar os conceitos é recomendável em futura migração planejada, sem alterar os registros legados em massa.

## 5. Fluxo do colaborador

`/colaborador/login` usa Supabase Auth e aceita apenas `app_metadata.role=colaborador`. `joao.adm@gmail.com` foi consultado e mantém essa role. `getCurrentUser()` lê o usuário atualizado do Auth. O painel atual usa principalmente dados demonstrativos; a role não concede acesso RLS amplo a candidatos reais. Não foi feito login real com a conta por falta de credencial fornecida nesta auditoria.

## 6. Supabase

**Tabelas reais em `public`:**

| Tabela | Finalidade e relacionamentos | Registros auditados |
| --- | --- | ---: |
| `usuarios` | dados pessoais; `auth_user_id` único, `email` e `cpf` únicos | 24 |
| `candidatos` | profissional/PCD/progresso; `usuario_id` único FK `usuarios` | 24 |
| `experiencias` | histórico profissional, FK `candidatos` | 24 |
| `formacoes` | formação, FK `candidatos` | 4 |
| `habilidades` | habilidades, FK `candidatos` | 6 |
| `idiomas` | idiomas, FK `candidatos` | 2 |
| `portfolio_links` | links, FK `candidatos` | 1 |
| `conquistas_certificados` | conquistas, FK `candidatos` | 3 |
| `areas` | catálogo de áreas, `nome` único | 8 |
| `candidato_areas` | N:N; par candidato/área único, duas FKs | 0 |
| `notificacoes` | mensagens do candidato, FK `candidatos` | 1 |

Todas possuem PK e RLS. Índices adicionais: `candidato_areas.area_id`, `notificacoes(candidato_id,created_at desc)`; chaves únicas criam seus índices. `auth.users` tem trigger `on_auth_user_created`, que chama `public.handle_new_user()`. Não há `vagas`, `vaga_areas` nem `candidaturas` no banco conectado.

**Integridade:** não foram encontrados candidatos órfãos, usuários ligados a Auth inexistente, usuários sem candidato nem `perfil_completo` nulo. Há 20 usuários legados com `auth_user_id` nulo. Eles não devem ser vinculados ou removidos automaticamente: exigem conciliação de identidade antes de um plano de migração. No início da auditoria havia 23 usuários/candidatos e dois candidatos com progresso 0; durante a leitura surgiu mais um par `usuarios`/`candidatos` ligado ao Auth, com progresso 0, sem cadastro feito por esta sessão. A contagem final é 24, com três candidatos em progresso 0 (incluindo a conta do colaborador).

## 7. Autenticação

Login, cadastro, logout, recuperação e alteração de senha usam Supabase Auth. A UI exige 8 caracteres, maiúscula, número e símbolo; essa regra é validada no cliente em cadastro/troca de senha. A política equivalente no serviço Auth **não foi comprovada** pela consulta disponível. O aviso do Security Advisor informa que a proteção contra senhas vazadas está desabilitada; habilitar exige revisão das configurações do projeto. Não existe coluna própria de senha em `public`.

## 8. RLS e segurança

`usuarios` e `candidatos` usam políticas ligadas a `auth.uid()`; seções de currículo e `candidato_areas` seguem o candidato dono. `notificacoes` permite SELECT e UPDATE apenas da mensagem do próprio candidato. A permissão direta de `EXECUTE` da função `handle_new_user()` foi retirada de `PUBLIC`, `anon` e `authenticated`, preservando `EXECUTE` para `supabase_auth_admin`; os avisos de execução pública desapareceram. `authenticated` recebeu somente `UPDATE(lida)` em `notificacoes`, confirmado por `has_column_privilege`, sem poder atualizar `titulo`. Buckets `avatars` e `pcd-documents` são privados e suas políticas isolam o diretório por `auth.uid()`.

O frontend usa chave `sb_publishable` em `.env` ignorado pelo Git; nenhuma `service_role` foi encontrada no código. O painel administrativo ainda não possui operações privilegiadas reais no backend. Antes da migração, criar RLS por role/escopo de empresa para vagas, candidaturas e candidatos; **não** conceder SELECT global de candidatos ao papel `authenticated`.

## 9. Vagas

Busca pública usa `src/data/mockData.js`; criação/status do painel usam `adminData.js` e `localStore.js`. Os dois conjuntos não são a mesma fonte. Criar/editar/publicar vaga no painel não altera a lista pública. O período de inscrição é calculado em `jobSearchRules.js`, mas as datas das vagas públicas são valores estáticos, com encerramento em 31/10/2026; depois disso todas ficarão fechadas até atualização dos dados. `EditVacancy.jsx` mostra confirmação de salvamento sem persistir a edição. A migração completa deve resolver essas inconsistências em conjunto.

## 10. Candidaturas

São guardadas em `localStorage` por ID do usuário, com estado React e histórico local. Não sincronizam entre dispositivos. O clique em candidatura é bloqueado para visitante ou candidato com progresso 0 e para vaga fora do período. A aba Entrevistas separada não aparece. Pipeline e tarefas do processo continuam demonstrativos; não são persistência Supabase.

## 11. Notificações

`notificacoes` é lida do Supabase e ordenada por `created_at desc`. Marcar lida e marcar todas usam UPDATE da própria conta. Antes desta auditoria havia RLS de UPDATE, mas faltava permissão SQL; agora apenas `lida` pode ser atualizada por `authenticated`. O código também verifica se todos os IDs solicitados retornaram do banco. A aplicação não cria mensagens pelo cliente, coerente com o grant de SELECT/UPDATE restrito. Um teste de leitura/escrita com duas sessões reais ainda é necessário.

## 12. localStorage e mock

Pode continuar local: tema, estado visual transitório e marcador de importação legado. Temporário até migração planejada: candidaturas, vagas do painel, templates, equipe, agenda, relatórios, Kanban e seus contadores. `mockData.js` fornece vagas públicas fixas; `adminData.js` alimenta quase todo o painel. Currículo antigo pode ser importado do navegador para Supabase uma vez. Auth, currículo atual, áreas e notificações não dependem de localStorage como fonte primária.

## 13. Problemas encontrados

| Problema / impacto | Local | Solução aplicada | Supabase / banco / risco |
| --- | --- | --- | --- |
| Função privilegiada executável pelo público; superfície RPC desnecessária | `public.handle_new_user()` | Revogados grants públicos; concedido apenas a `supabase_auth_admin` | Sim / permissão DDL / baixo, trigger preservado |
| Marcar mensagem como lida sem grant SQL; falha de persistência | `notificacoes`, `candidateExtras.js` | Concedido `UPDATE(lida)` e checados IDs retornados | Sim / permissão DDL / baixo |
| UPDATE de perfil/dados profissionais podia afetar zero linhas e aparentar sucesso | `authStore.js`, `candidateStore.js` | Exigido `.select('id').single()` | Sim / não altera esquema / baixo |
| Inputs de login/cadastro sem associação explícita com labels | `AuthScreen.jsx` | IDs, `htmlFor` e autocomplete | Não / não / baixo |
| SQL e README históricos descrevem arquitetura inexistente; risco de execução indevida | `supabase/schema.sql`, READMEs | Avisos e esta documentação | Não / não / baixo |
| Vaga criada no painel não aparece ao candidato; edição tem toast sem persistência | `CreateVacancy.jsx`, `EditVacancy.jsx`, `JobsSearch.jsx` | Pendente migração integral | Futuro / sim / alto se parcial |
| Dados de 20 usuários sem Auth; acesso e conciliação incertos | `usuarios` | Somente relatado | Sim / dados / alto para vinculação automática |
| Política real de senha no Auth não verificada; proteção contra vazamentos desabilitada | Supabase Auth | Somente relatado | Sim / configuração / requer análise |

## 14. Correções realizadas

Foram feitas as duas alterações de permissão, verificadas por consulta de privilégios e Security Advisor; detecção de UPDATE sem linha; associação de labels no login; e aviso/documentação de esquema legado. Nenhuma tabela nova, exclusão de dados ou migração de vagas/candidaturas foi realizada.

## 15. Problemas que não devem ser alterados ainda

Não executar `supabase/schema.sql`; não vincular automaticamente os 20 usuários legados; não adicionar somente uma tabela de vagas mantendo candidaturas locais; não conceder acesso geral de colaboradores a `candidatos` antes de definir empresa, equipe e escopo; não apagar o bucket `avatars` apenas por ter saído da UI.

## 16. Débitos técnicos

Roteamento por estados não oferece URLs estáveis para abas; bundle público carrega módulos do painel; avisos de chunk grande no build; componentes legados aparentemente não importados (`Navbar`, `CommandPalette`, `Modal`, `Toast`) requerem confirmação antes de remoção. `App.jsx` concentra autenticação, rotas, candidaturas e carregamento de currículo. O campo `perfil_completo` mistura percentual e conclusão inicial. Os dois conjuntos de vagas mockados divergem.

## 17. Melhorias UX/UI

Desktop e mobile da Home e do login foram inspecionados. A 390 px, não houve scroll horizontal na Home ou login e os cartões permaneceram legíveis. A navegação pública, busca, filtro por área/localidade e detalhes funcionaram na inspeção. O formulário de login recebeu labels associados. Painel do colaborador, currículo e perfil precisam de inspeção visual autenticada em tablet/mobile; não foram declarados validados.

## 18. Testes realizados

- UI pública sem sessão: abriu Home, listou vagas, filtrou por palavra-chave e área, combinou palavra-chave/localidade (estado vazio correto), abriu detalhes e redirecionou candidatura para `/login`.
- UI: `/colaborador/login` abriu sem sessão; não foi efetuado login com credenciais reais.
- Mobile 390 px: Home e login sem scroll horizontal, por inspeção visual/DOM.
- Banco: esquema, FKs, UNIQUE, CHECK, índices, políticas, grants, função, trigger, buckets, contagens e inconsistências consultados. Permissões alteradas verificadas. Não foram feitas mutações de dados de teste.
- Não comprovados: cadastro/login real, retomada/conclusão de currículo, CRUD persistente de cada seção, leitura cruzada entre usuários, login de João, painel autenticado e marcação real de mensagem. Exigem contas de teste/credenciais e execução controlada.

## 19. Resultado do build

`npm run build` executado com sucesso: 1781 módulos transformados e saída gerada em `dist/`. Houve aviso de chunk JavaScript de 923,12 kB (258,16 kB gzip), acima de 500 kB; isso não impede a compilação, mas reforça separar o painel em carregamento sob demanda. `git diff --check` passou sem erros de whitespace.

## 20. Estrutura recomendada para a próxima etapa

1. Definir contrato único para `vagas`: status, publicação, visibilidade, período, empresa, modalidade, salário, requisitos e benefícios.
2. Criar migração versionada e revisada para `vagas`, `vaga_areas`, `candidaturas`, histórico/etapas e índices/FKs. Reusar `areas` e `candidato_areas`; a interseção de áreas deve ser feita pela relação, não por string.
3. Criar RLS: leitura anônima somente de vagas públicas abertas/visíveis; candidato insere e lê suas candidaturas; colaborador recebe escopo por empresa/equipe via `app_metadata` ou tabela de membros controlada pelo backend. Definir ações de serviço para notificações.
4. Migrar criação/edição/publicação e busca pública para a mesma fonte; depois candidaturas e histórico; só então retirar mocks e localStorage correspondentes.
5. Conciliar 20 registros legados por processo explícito de identidade; testar dois candidatos e um colaborador com recarregamento e isolamento RLS.
6. Criar testes automatizados de regras de candidatura e integração com ambiente isolado, além de dividir rotas e módulos administrativos por carregamento sob demanda.
