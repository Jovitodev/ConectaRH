# Comercial — clientes e propostas (13/10/2026)

## Escopo

Reformulação baseada nas seis capturas do Power Apps fornecidas pelo usuário. Mantém identidade e componentes do ConectaRH. O usuário confirmou que taxa e cancelamento são percentuais, vencimento e reposição são dias, opções de negócio/origem podem ser cadastradas pelo Comercial e Riscos Psicossociais começa com descrição, valor e status.

## Funcionalidades

- Indicadores reais de total, ativos, inativos, pendentes e bloqueados. Consideram somente clientes não arquivados e funcionam como atalhos de filtro.
- Cards com razão social, nome fantasia, CNPJ, solicitante, contato, telefone, localidade, status e data original de criação.
- Busca por razão social, nome fantasia, solicitante e CNPJ; status, paginação no banco e consulta de arquivados.
- Cadastro/edição com razão social, nome fantasia, CNPJ, solicitante, tipo de negócio, telefone, e-mail de contato, e-mail de faturamento, CEP, estado, cidade e endereço. Criado em é automático. Status editável: ativo, inativo, pendente ou bloqueado.
- CNPJ com máscara e dígitos verificadores para formato numérico e alfanumérico. CEP com 8 dígitos; telefone com DDD; e-mails e localização padronizada validados.
- O Comercial pode cadastrar tipos de negócio e origens pelo formulário. Nenhuma lista presumida foi semeada.
- Propostas por cliente, separadas entre R&S e Riscos Psicossociais, com criação/edição, data informada, solicitante, contato e indicadores Fechado/Aguardando/Não fechado.
- R&S: origem, taxa percentual, taxa de cancelamento percentual, vencimento e reposição em dias. Sem valores comerciais predefinidos.
- Riscos Psicossociais: descrição e valor, além do status e dados de contato da proposta.
- WhatsApp abre o contato em uma nova aba, quando há telefone cadastrado. Não há envio automático.
- Arquivamento com confirmação é reversível. Mantém vagas e propostas. Restauração devolve o status anterior. Bloqueados, inativos, pendentes e arquivados ficam indisponíveis na seleção de novas vagas.

## Banco e privacidade

Foram preservadas as 5 empresas existentes e seus IDs. O cadastro básico `empresas` continua usado nas vagas. Os detalhes ficam em `empresa_dados_comerciais`, com acesso apenas ao papel `comercial`, porque `empresas` possui leitura de identificação pela busca pública.

Tabelas novas: `empresa_dados_comerciais`, `comercial_opcoes`, `comercial_propostas`. Visões: `comercial_clientes`, `comercial_indicadores`, `comercial_propostas_indicadores`, todas com `security_invoker=true`.

`comercial_salvar_cliente` usa segurança do invocador e grava empresa e detalhes atomicamente. CNPJ duplicado ou dados inválidos revertem a operação completa. Gatilho sincroniza `empresas.ativa` com status/arquivamento. Índices, FKs, checks e RLS protegem as estruturas novas. Não há grant de DELETE; arquivamento preserva dados.

Migrações aplicadas:

1. `comercial_clientes_propostas_20261013`: `COMERCIAL_CLIENTES_PROPOSTAS_2026-10-13.sql`.
2. `comercial_preservar_identificacao_vagas_20261013`: `COMERCIAL_COMPATIBILIDADE_VAGAS_2026-10-13.sql`.

A segunda mantém a leitura do nome da empresa de uma vaga existente mesmo quando o cliente é bloqueado/arquivado, sem expor contatos. O filtro `ativa=true` para selecionar empresas em novas vagas foi preservado.

## Verificações

- Build passou; aviso de bundle grande permanece.
- Validação de CNPJ no frontend e no banco com exemplos numérico, alfanumérico e inválido. Testes reproduzíveis: `node --test tests/commercialValidation.test.js`.
- SQL transacional validou cadastro, edição, propostas dos dois tipos, contadores por status, percentuais, CNPJ inválido/duplicado, atomicidade, bloqueio, arquivamento e restauração. Tudo revertido com rollback.
- RLS testado com dados de teste preenchidos: recrutador, candidato e visitante não acessam contatos, faturamento, opções ou propostas; RPC de cadastro negada ao candidato.
- Compatibilidade testada: empresa bloqueada deixa da seleção de novas vagas e continua identificada em vagas já existentes para recrutador e público.
- Na sessão Comercial real, foram inspecionados painel, cadastro, máscara de CNPJ, seleção de estado/cidade, filtros e formulários das duas propostas. Os formulários foram fechados sem salvar dados de teste. Escritas foram verificadas por SQL transacional, não por uma jornada de gravação completa na interface.
- Corrigido o indicador de busca de cidades que não terminava após seleção automática de correspondência exata.

## Dados e limites

As empresas anteriores não tinham CNPJ, contatos ou endereço no banco. Esses campos continuam vazios e os cards indicam “Cadastro a completar”. Nenhum contato foi copiado das imagens nem inventado. Não houve importação da base Power Apps, criação de contas ou alteração de usuários legados.

Propostas são registros comerciais; data de envio é informada pelo usuário. Salvar não dispara e-mail, campanha, cobrança ou contrato. Campanhas, exportação de documentos, integrações com Power Apps e financeiro não foram implementados. Sem deploy: código disponível localmente e migrações aplicadas ao Supabase conectado.

Referências técnicas: [Cálculo do DV do CNPJ — Receita Federal](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj), [segurança de visões — Supabase](https://supabase.com/docs/guides/database/views).
