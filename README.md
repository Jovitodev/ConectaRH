# ConectaRH

Portal React/Vite com Home pública, área do candidato e painel do colaborador.

## Estado atual

- Supabase Auth: login, cadastro, logout e recuperação de senha. A role `app_metadata.role=colaborador` direciona para o painel.
- Supabase Database: `usuarios`, `candidatos`, seções do currículo, `areas`, `candidato_areas` e `notificacoes`.
- Supabase Storage: comprovantes PCD privados. O bucket de avatares é legado e permanece preservado.
- Mock/localStorage: vagas, candidaturas e a maior parte do painel do colaborador. As duas listas de vagas ainda não são uma fonte única.

## Executar localmente

Configure `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave publicável). Nunca coloque uma chave `service_role` no frontend. Depois:

```bash
npm install
npm run dev
npm run build
```

## Estrutura

- `src/App.jsx`: rotas por `pathname` e estados das abas.
- `src/pages/`: páginas públicas e do candidato; `src/pages/admin/`: painel do colaborador.
- `src/lib/authStore.js`: Supabase Auth e perfil.
- `src/lib/candidateStore.js`, `candidateExtras.js`, `profileFiles.js`: dados do candidato no Supabase.
- `src/data/mockData.js`, `adminData.js`, `src/lib/localStore.js`: dados demonstrativos e armazenamento local.

Rotas principais: `/`, `/login`, `/cadastro`, `/cadastro-curriculo`, `/colaborador/login`. As abas internas não possuem URLs próprias.

Leia [a auditoria técnica de 05/10/2026](docs/AUDITORIA_2026-10-05.md) antes de ampliar o esquema ou migrar vagas/candidaturas. `supabase/schema.sql` é um protótipo histórico incompatível com o banco conectado: **não execute esse arquivo**.
