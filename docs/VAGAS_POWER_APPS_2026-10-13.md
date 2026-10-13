# Vagas e avaliações — referência Power Apps

## Implementado

- Comercial: nome do cliente é texto; edição somente pelo lápis.
- Controle de vagas em colunas: A classificar, Alinhamento, R&S, Entrevista gestor, Admissão e Suspensa. Concluída/Cancelada acessíveis pelo filtro.
- Contadores gerais consultam todas as vagas do responsável. Cada coluna tem busca, filtros e paginação próprios no servidor (12 registros por página).
- Filtros por publicação, andamento, reposição, cargo/empresa/código/CV, entrega, entrevista, admissão e intervalo de abertura; preservados filtros de feedback e vagas antigas.
- Ficha operacional: CV manual além do código automático, reposição Sim/Não, gestor/contatos, valor de proposta, abertura/reabertura/motivos, datas previstas, datas importantes, suspensão, finalista da própria vaga e comentários preservados.
- Prazos em dias corridos pela data civil de São Paulo: restante, hoje ou atraso. Ausência de previsão não gera meta presumida. Lead time: abertura até fechamento.
- Criação de vaga e ficha operacional atômica pela RPC `criar_vaga_operacional`; uma falha desfaz ambas. Edição de ficha usa controle de concorrência por `updated_at`.
- Candidaturas: indicadores das etapas reais, CV da vaga, etapa/status/motivo interno, busca por nome/e-mail e filtro de motivo no servidor.
- Avaliação estruturada: experiências, síntese profissional, perfil comportamental, conclusão, profissional/registro declarados e versões imutáveis. Opções cadastráveis por recrutador. Cada versão gera evento interno na timeline.

## Regras preservadas

Andamento operacional e publicação são controles separados. Suspender/cancelar operacionalmente não pausa o anúncio automaticamente; o botão Pausar controla publicação. Vagas antigas sem ficha ficam A classificar, sem inferência de andamento ou prazos.

Empresas continuam cadastradas pelo Comercial. Novas vagas selecionam empresas ativas. Atribuição a outros consultores não foi liberada: cada recrutador acessa somente suas vagas, candidaturas e registros.

Currículo exibido é o retrato profissional enviado na candidatura. CPF, laudos, informações médicas e campos removidos de Meu Perfil não foram acrescentados. Contatos do gestor são informados na vaga; dados privados de faturamento do Comercial continuam restritos. Nenhum dado pessoal das capturas foi importado.

Não foram adicionadas exclusão definitiva, decisões em lote, assinatura digital, envio de avaliação por e-mail ou anexos sem infraestrutura. O resultado de avaliação não altera automaticamente a seleção. A movimentação já existente continua explícita na ficha do candidato.

## Banco e verificação

Migrations aplicadas via MCP:

1. `vagas_operacao_e_avaliacoes_20261013` — `VAGAS_OPERACAO_2026-10-13.sql`.
2. `vagas_criacao_atomica_20261013` — `VAGAS_CRIACAO_ATOMICA_2026-10-13.sql`.
3. `vagas_classificacao_e_historico_20261013` — `VAGAS_CLASSIFICACAO_HISTORICO_2026-10-13.sql`.

Tabelas internas: `vaga_operacao`, `vaga_comentarios`, `recrutamento_opcoes`, `candidatura_avaliacoes`. Todas com RLS, grants mínimos e índices para chaves estrangeiras. Views usam `security_invoker`.

Testes em `testes-vagas-operacao-2026-10-13.sql`: criação, alteração, comentários, avaliação, opções, imutabilidade, finalista de outra vaga, cancelamento sem motivo, rollback atômico, isolamento entre recrutadores/Comercial/candidatos. Todos dentro de transação desfeita ao terminar. Testes de datas: `node --test tests/vacancyDates.test.js`.

Build validado. Advisors sem novos alertas de segurança; aviso anterior de proteção de senhas vazadas continua fora desta alteração. Nenhum deploy foi executado.
