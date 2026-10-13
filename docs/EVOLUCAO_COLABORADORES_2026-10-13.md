# Evolução da área de colaboradores — 13/10/2026

## Referência e escopo

Implementação baseada nas imagens fornecidas e em `REFERENCIAS_GUPY_COLABORADORES_2026-10-13.md`, preservando componentes, cores e tipografia do ConectaRH. Não foram copiados marca, textos comerciais, ranking, IA ou integrações da Gupy.

## Estado do projeto conectado

O Supabase `oaddxkfxopzzsyqjnjxr` foi encontrado INACTIVE. A retomada do mesmo projeto foi solicitada; após ACTIVE_HEALTHY, esquema, constraints e políticas foram relidos antes da migração. Foram confirmados e preservados 5 empresas, 10 vagas, 14 candidaturas e 7 feedbacks. Não foram criadas contas Auth, alterados papéis ou modificados usuários legados.

## Implementação

| Área | Alteração |
|---|---|
| Gestão de vagas | Tabela com empresa, código, responsável, inscrições, publicação original, status, candidaturas e pendência de feedback; busca por título/código, status, filtro de 80 dias, ordenação e paginação no banco. |
| Ciclo de vida | Confirmações para publicar/reativar, pausar, encerrar, cancelar e duplicar. Pausa, encerramento e cancelamento retiram da busca pública e preservam candidaturas. Reativação mantém publicação original. Cópia nasce como rascunho, com novo código, sem candidaturas ou publicação. |
| Candidaturas | Lista por vaga, busca por nome/e-mail, status, etapas com contagens globais por vaga e paginação. |
| Ficha | Painel lateral com retrato enviado na candidatura, experiências, escolaridade, habilidades, idiomas, áreas, etapa, status e data; anterior/próximo na página de seleção. |
| Etapas | Movimentação com confirmação, validação da etapa da vaga, bloqueio de etapas inexistentes e de candidaturas finalizadas. Repetir etapa não cria evento. Reprovação exige motivo interno. |
| Timeline | Eventos gerados atomicamente por gatilhos com autor, data e detalhes de ações novas. Não se inventa retrospectivamente a data de movimentos anteriores à migração. |
| Anotações/avaliações | Texto, autoria e data, visíveis somente ao responsável atual pela vaga. Registros imutáveis; sem ocultação ambígua. |
| Agenda | Agendamento por candidatura com horário, fuso IANA, duração, entrevistador, modalidade, local/link, observações e status; concluir/cancelar com confirmação. Sem convite automático. |
| Quadro | Etapas e candidaturas do Supabase; mostra a página carregada com indicação explícita e filtro por etapa para consulta completa paginada. Movimentação pela ficha, sem arrastar. |
| Mensagens | Assunto, corpo, remetente, destinatário, data e estado; formulário salva pendência. Frontend não pode marcar enviado/entregue. |
| Painel | Métricas reais de vagas ativas, candidaturas, vagas com pendência de feedback, entrevistas do dia e vagas com mais de 80 dias; atalhos aplicam filtros nas listas. |

O histórico público do candidato continua usando `candidaturas`; motivos de reprovação e dados internos ficam em tabelas com RLS exclusiva do responsável. A ficha não abre acesso geral a `candidatos`, `usuarios` ou arquivos PCD.

## Banco

Migrações aplicadas, nesta ordem:

1. `recrutamento_fluxo_colaboradores_20261013` — `RECRUTAMENTO_EVOLUCAO_2026-10-13.sql`.
2. `recrutamento_motivo_interno_20261013` — `RECRUTAMENTO_PRIVACIDADE_2026-10-13.sql`.
3. `recrutamento_rls_initplan_20261013` — `RECRUTAMENTO_RLS_2026-10-13.sql`.
4. `recrutamento_feedback_verificado_20261013` — `RECRUTAMENTO_FEEDBACK_2026-10-13.sql`.

Novas tabelas: `candidatura_eventos`, `candidatura_registros`, `entrevistas`, `candidatura_mensagens`. Todas com RLS, grants específicos, FKs, constraints e índices para candidatura, autoria e consulta. Visões `recrutamento_vagas` e `recrutamento_etapas` usam `security_invoker=true` e filtram responsável/papel. RPCs `agendar_entrevista` e `reprovar_candidatura` usam segurança do invocador. A gravação privilegiada de eventos fica em gatilho privado, com execução pública revogada.

O motivo inicialmente previsto em coluna da candidatura foi movido para o evento interno. A coluna foi removida após confirmar zero valores preenchidos. Nenhum motivo existente foi perdido.

## Testes realizados

Scripts em `docs/testes-recrutamento-2026-10-13/`, executados por SQL em transações com rollback:

- Movimento, reprovação, anotação, avaliação, entrevista e mensagem pendente; seis eventos auditados e contador de etapa atualizado.
- Candidato mantém acesso à própria candidatura, sem eventos, registros, entrevistas, mensagens ou feedbacks internos.
- Comercial e outro recrutador sem acesso aos registros internos da vaga do responsável.
- Rejeição de etapa inexistente, motivo vazio, envio fictício e escrita direta na auditoria; repetição de etapa não cria evento.
- Cancelamento mantém candidaturas e atualiza contexto histórico; reativação preserva data; duplicação não copia candidaturas; registros internos e pendências não diminuem contagem de ausência de envio.
- Contagens originais preservadas após rollback. As quatro tabelas novas terminaram sem registros de teste.
- `npm run build` passou, com aviso de bundle grande. A busca no bundle não encontrou o valor da chave administrativa local.
- Advisor de segurança retornou apenas o aviso já existente de proteção contra senhas vazadas desabilitada. Os alertas novos de reavaliação de JWT nas políticas foram corrigidos; alertas antigos de desempenho permanecem.

Os testes de banco usam claims simuladas por SQL e não equivalem a login real pela interface. O usuário entrou com a conta real de recrutador no navegador local. Nessa sessão, foram verificados: painel com 7 vagas publicadas e 14 candidaturas; atalho de vagas antigas aplicando status Publicada e filtro de 80 dias, com 2 resultados; abertura da vaga e das 2 candidaturas; abas de etapas com contagens 1/1; ficha lateral com currículo; navegação para a próxima pessoa; abas de Timeline e Mensagens; formulário de movimentação com etapa atual desabilitada; formulário de entrevista com fuso/duração; recarga da página com restauração da sessão e dos indicadores. A ficha foi inspecionada visualmente. A sessão Comercial também foi observada funcionando.

Na interface, os formulários foram abertos e fechados sem salvar. As operações de escrita foram validadas nos testes SQL transacionais descritos acima. Não foi executada uma jornada de escrita pela interface com dados reais de produção.

## Dependências e limitações

- Não há Edge Functions de envio instaladas nem integração de disparo implementada no projeto. E-mails, respostas do candidato, processamento pelo provedor, callbacks de entrega e leitura dependem de implementação/configuração específica. Pendências não são despachadas automaticamente.
- Menções, anexos, editor rico e edição de anotações não foram adicionados. Registros internos são texto imutável.
- Número de posições e prazo previsto de contratação não foram adicionados; os prazos exibidos são os de inscrição. Não são apresentados indicadores de contratação sem esses dados.
- Administrador e Financeiro continuam sem liberação. Login único da Equipe e conta Comercial existentes foram preservados.
- Templates, relatórios, equipe e configurações futuros continuam identificados como demonstrativos. As novas telas operacionais não consultam mock/localStorage. Os dados locais antigos não foram apagados.
- A busca pública do candidato conserva sua limitação documentada de filtros sobre a página carregada; a busca nova do recrutador usa filtros no banco.
- Não houve deploy. As telas alteradas estão no projeto local; o banco conectado recebeu as migrações acima.

Avisos existentes: [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [índices de FKs](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys), [RLS e initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan).
