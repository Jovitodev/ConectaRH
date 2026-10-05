# Complemento de padronização e currículo — 05/10/2026

1. **Tabelas criadas:** `estados`, `cidades`, `candidato_disponibilidades`.
2. **Tabelas alteradas:** `candidatos`, `formacoes`, `notificacoes`.
3. **Campos criados:** `candidatos.estado_id`, `candidatos.cidade_id`; `formacoes.grau`, `formacoes.situacao`, `formacoes.periodo_atual`; `notificacoes.chave`, `notificacoes.destino`, `notificacoes.ativa`. As novas tabelas contêm identificadores oficiais do IBGE e opções de disponibilidade.
4. **Campos removidos:** nenhum nesta etapa. Os campos textuais antigos foram preservados para não perder dados existentes.
5. **Índices criados:** índices de busca em `cidades(estado_id,nome)`, `candidatos.estado_id`, `candidatos.cidade_id` e índice único parcial em `notificacoes(candidato_id,chave)`.
6. **Estados e cidades:** 27 estados e 5.571 municípios importados da API oficial do IBGE. A interface carrega estados uma vez e busca até 20 cidades do estado selecionado por prefixo, após duas letras. Não carrega a lista inteira no navegador. As colunas textuais legadas não foram migradas automaticamente; o seletor tenta reconhecer correspondências exatas.
7. **Filtros e máscaras:** CPF com dígitos verificadores, telefone com DDD, salário em reais, datas por controles de data ou mês, URLs completas e filtro salarial numérico por sobreposição de faixa. A busca de vagas aceita estado e cidade selecionados. CEP não está na interface atual.
8. **Disponibilidade:** seleção múltipla, gravada em `candidato_disponibilidades`; o texto legado em `candidatos.disponibilidade` permanece intacto. Valores antigos reconhecidos aparecem como opção selecionada quando ainda não existem linhas novas.
9. **Preferência de trabalho:** opções controladas no currículo, persistidas em `candidatos.modalidade`; valores legados continuam visíveis.
10. **Formação:** curso e instituição textuais, grau e situação controlados, período atual de 1 a 12. O campo histórico `periodo` continua preservado.
11. **Níveis:** novos itens de habilidades e idiomas exigem seleção de um nível padronizado; valores históricos permanecem legíveis.
12. **Causa identificada para o reset:** ao trocar de etapa, o componente do formulário era desmontado e descartava dados digitados que ainda não tinham sido salvos.
13. **Correção:** a navegação entre etapas é bloqueada enquanto há edição ou alterações pendentes. Após finalizar, os dados do currículo são recarregados do Supabase antes da confirmação visual e do redirecionamento.
14. **Mensagens automáticas:** uma função central verifica nome, CPF, nascimento, e-mail, telefone, cargo, localidade, áreas, experiência, formação e habilidade. Cada pendência tem chave estável; a mensagem é resolvida quando o dado é preenchido e reativada se o problema voltar.
15. **Links:** notificações de perfil abrem `Meu Perfil`; notificações de currículo abrem `Meu Currículo` e rolam até a seção indicada. O clique marca a mensagem como lida.
16. **Responsividade:** filtros e cartões de vaga usam colunas fluidas. No teste anônimo, não houve rolagem horizontal em 360, 390, 430, 1366 e 1920 px.
17. **Mock/localStorage:** vagas, edição administrativa de vagas, candidaturas e dados demonstrativos continuam em mock/localStorage. A criação de vaga usa seletor de localidade, mas ainda grava localmente, pois não existe tabela operacional de vagas para migrar nesta etapa.
18. **Build:** `npm run build` concluiu com sucesso. O Vite avisou que o bundle principal supera 500 kB; é uma oportunidade futura de dividir código.
19. **Testes realizados:** catálogo e integridade referencial via Supabase MCP; busca anônima de estado, cidade e salário no navegador; cinco larguras de viewport; validações básicas de CPF, telefone, salário e filtro; build de produção.
20. **Pendente:** teste autenticado completo de cadastro, login, finalização, gravação, recarregamento e notificações depende de uma conta de candidato de teste. Nenhuma conta foi criada sem autorização. A migração segura dos valores textuais legados e a futura persistência de vagas no Supabase permanecem trabalhos separados.

## Dados legados preservados

Antes da mudança havia valores livres incompatíveis em localidade, disponibilidade, modalidade, formação e níveis. Nenhuma linha existente foi zerada ou removida. As novas referências são opcionais para os registros antigos e obrigatórias somente para concluir o novo onboarding.

Fonte do catálogo: [API de Localidades do IBGE](https://servicodados.ibge.gov.br/api/docs/localidades).
