# Recrutamento — Fase 1 (07/10/2026)

## Estado revalidado

Antes das alterações: 5 empresas DEMO, 10 vagas, 14 candidaturas, 7 feedbacks, 7 vagas públicas ativas, 1 colaborador com esse papel e 20 usuários antigos sem vínculo com Supabase Auth. Os dados foram preservados. Testes de escrita ocorreram em transações revertidas.

## Implementado e verificado

- O fluxo operacional de vagas, candidaturas e feedbacks usa Supabase. As telas futuras com mock são identificadas e separadas.
- Criação de vaga usa empresas e áreas do banco e o colaborador autenticado. Edição carrega a vaga pelo ID, grava e relê o registro.
- Pausa e reativação preservam `publicada_em`; o filtro de mais de 80 dias consulta essa data.
- `candidaturas` guarda o contexto da vaga mesmo quando ela deixa de ser pública. Gatilhos preenchem esse contexto na inserção e o atualizam quando a vaga muda. Todas as 14 linhas existentes foram preenchidas.
- `vagas_resumo_fase1` agrega contagens por vaga e candidaturas sem feedback sob segurança do invocador. O painel usa esses números. Novo feedback é registro interno com status `pendente`, sem afirmar envio de e-mail.
- Consultas de vagas e candidaturas são paginadas no banco. Contadores demonstrativos saíram do menu.
- SQL transacional validou criação de candidatura, histórico após encerramento, data original de publicação, acesso do colaborador atribuído e negação ao outro. A visão de resumo não retornou linhas ao candidato. RLS permanece ativo.
- Na interface pública local, as 7 vagas ativas apareceram e a busca por "Financeiro" retornou apenas a vaga correspondente. `npm run build` passou (com aviso de bundle grande).

Migrações aplicadas: [histórico](RECRUTAMENTO_FASE1_HISTORICO_VAGA.sql) e [resumo](RECRUTAMENTO_FASE1_RESUMO.sql). Esquema e DEMO anteriores: `RECRUTAMENTO_FASE1_SCHEMA.sql` e `RECRUTAMENTO_FASE1_DADOS_DEMO.sql`.

## Pendente

- Não havia credenciais para testar login e jornada completa na interface como colaborador e candidato. Testes SQL não substituem esse teste.
- Os filtros da busca pública atuam na página carregada. As 7 vagas públicas atuais cabem em uma página; antes de ultrapassar 12, os filtros precisam ser aplicados na consulta ao banco para resultados globais corretos.
- Os 20 usuários legados sem Auth exigem plano próprio e não foram alterados.
- Otimização de bundle e alertas de desempenho do Supabase ficam para trabalho posterior. Proteção contra senhas vazadas é uma configuração de Auth existente e não foi alterada.

**Status: parcialmente concluída.** Banco, código e testes transacionais estão prontos. Falta a jornada autenticada pela interface e busca filtrada global para mais de uma página.
