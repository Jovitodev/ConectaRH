# ConectaRH

Portal React/Vite com Home pública, área do candidato e painel do colaborador.

## Estado atual

- Supabase Auth: login, cadastro, logout e recuperação de senha. O Login da Equipe em `/colaborador/login` direciona `app_metadata.role=colaborador` ao recrutamento e `app_metadata.role=comercial` à área Comercial.
- Supabase Database: perfis, currículo, áreas, notificações, empresas, vagas, candidaturas e feedbacks. O recrutamento operacional é persistido no Supabase.
- A busca pública mostra vagas ativas e públicas. O candidato consulta seu histórico de candidaturas mesmo após pausa ou encerramento da vaga.
- O colaborador consulta suas vagas, candidaturas e feedbacks no banco. Outras telas futuras do painel permanecem demonstrativas e identificadas.
- A evolução de 13/10/2026 inclui gestão de vagas em tabela, ficha lateral por candidatura, etapas com contagens, Timeline interna, anotações/avaliações, entrevistas persistidas e mensagens pendentes. O painel e a agenda consultam dados reais. Consulte [implementação e validação](docs/EVOLUCAO_COLABORADORES_2026-10-13.md).
- E-mails ainda não são disparados: mensagens são salvas como pendentes. Somente mensagens com identificador do provedor e data de envio podem comprovar envio no novo contador. Registros legados de feedback são preservados como histórico não verificado.
- A área Comercial possui clientes completos, indicadores por status, filtros, arquivamento/restauração e propostas R&S e Riscos Psicossociais. Contatos, faturamento e propostas têm RLS exclusiva do Comercial; empresas existentes permanecem vinculadas às vagas. Veja a [documentação do Comercial](docs/COMERCIAL_2026-10-13.md).
- A conta `joao.comercial@gmail.com` usa `app_metadata.role=comercial`, sem perfil de candidato. `/comercial/login` continua como endereço alternativo para o mesmo Login da Equipe.
- Os papéis `administrador` (acesso amplo) e `financeiro` ainda não possuem políticas RLS nem áreas próprias; não são liberados pelo login atual.
- Registros DEMO persistidos no Supabase foram preservados. Dados locais legados do currículo podem ser importados; vagas e candidaturas locais não entram no fluxo operacional.

## Executar localmente

Configure `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave publicável). Nunca coloque `service_role` no frontend.

```bash
npm install
npm run dev
npm run build
```

## Estrutura

- `src/App.jsx`: rotas por `pathname` e abas.
- `src/pages/` e `src/pages/admin/`: páginas do candidato e painel do colaborador.
- `src/lib/authStore.js`: autenticação e perfil.
- `src/lib/recruitmentStore.js`: operações de recrutamento no Supabase.
- `src/lib/recruitmentWorkflow.js`: consultas paginadas de gestão, etapas, histórico, entrevistas e mensagens.
- `src/lib/candidateStore.js`, `candidateExtras.js`, `profileFiles.js`: dados do candidato.
- `src/data/mockData.js`, `adminData.js`, `src/lib/localStore.js`: demonstrações e dados locais legados, separados do recrutamento operacional.

Rotas principais: `/`, `/login`, `/cadastro`, `/cadastro-curriculo`, `/colaborador/login`. `/comercial/login` abre a mesma tela da equipe por compatibilidade. As abas internas não possuem URLs próprias.

Consulte o [estado validado da Fase 1](docs/PLANO_RECRUTAMENTO_FASE1_2026-10-07.md) e a [auditoria de 05/10/2026](docs/AUDITORIA_2026-10-05.md). `supabase/schema.sql` é um protótipo histórico incompatível com o banco conectado: **não execute esse arquivo**.
