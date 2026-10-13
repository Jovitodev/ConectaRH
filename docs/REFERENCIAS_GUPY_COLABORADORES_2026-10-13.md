# Referência funcional — área de colaboradores da Gupy

Análise das oito imagens de `gupy colaborador.zip`, fornecidas em 13/10/2026. As conclusões descrevem o que está visível nas capturas; não validam o funcionamento da Gupy nem suas regras internas. Comparação com o código local do ConectaRH, sem nova auditoria do banco. Nenhum dado pessoal das capturas foi transcrito para este documento.

## Capturas e evidências

| Final do nome da captura | Tela | Recursos visíveis |
|---|---|---|
| 083733 | Gestão de vagas | Indicadores de prazo expirado, prazo a expirar, pendências de aprovação e tempo médio de fechamento; busca por nome/código; ações em massa; ordenação; status; filtros; criação; seleção de linhas; posições, contratações e inscrições; publicação e prazos; favorito e menu de ações. |
| 083810 | Candidaturas da vaga | Resumo da vaga; link para anúncio; publicação, fim de inscrições e prazo de contratação; talentos inscritos/recomendados; alternância de visualização, com lista selecionada; busca por palavra-chave com menção a AND/OR/NOT; adicionar; filtrar; ordenação por aderência; etapas com contagem. |
| 083829 | Lista de candidaturas | Atalhos Perfil/Currículo; WhatsApp/LinkedIn; aderência; características; tags; etapa atual e reprovação; votos positivos/negativos; ícone de fixação. |
| 083857 | Ficha da candidatura | Navegação entre pessoas; etapa e data de cadastro; cargo e escolaridade; contato; indicação; aderência e posição; histórico; mover para etapa; reprovar; agendar entrevista; roteiro com IA; adicionar avaliação. |
| 083918 | Ficha, habilidades e abas | Habilidades destacadas e demais habilidades; tags; abas Cadastro, Testes, Avaliações, Timeline, Mensagens, Carta Oferta e LinkedIn Recruiter; dados pessoais na aba Cadastro. |
| 083946 | Perguntas da etapa Cadastro | Respostas a perguntas da vaga sobre localidade, formação, informática, disponibilidade e experiência; formatos de escolha e texto livre. |
| 084207 | Menu da vaga | Duplicar, Compartilhar, Impulsionar, Ver Resumo, Editar, Congelar, Cancelar e Encerrar; alerta de prazo próximo. |
| 085045 | Painel inicial | Entrevistas do dia; indicadores de candidaturas com feedback e vagas antigas; links para vagas sem feedback e vagas antigas; insights sobre expiração e poucas inscrições. A captura usa 90 dias como referência de antiguidade. |

## Núcleo de trabalho do recrutador

A estrutura central é vaga → lista de candidaturas por etapa → ficha da candidatura → ação e acompanhamento. A pessoa tem um currículo, mas etapa, reprovação, entrevista, avaliação e comunicação precisam estar ligadas à candidatura em uma vaga específica. Isso evita que uma decisão em uma vaga altere todas as candidaturas da mesma pessoa.

### Gestão de vagas

- Identificar a vaga por título e código, com filtros e ordenação.
- Distinguir número de posições, pessoas inscritas e pessoas contratadas.
- Exibir status e três referências de tempo: publicação original, fim das inscrições e prazo previsto de contratação.
- Facilitar edição, consulta do anúncio e ações de ciclo de vida.
- Duplicar uma vaga deve criar um novo processo; as imagens não mostram se a Gupy copia etapas, perguntas ou candidaturas.
- Congelar, cancelar e encerrar aparecem como ações diferentes. Seus efeitos sobre inscrições, comunicações e histórico precisam de definição própria para o ConectaRH.

### Gestão de candidaturas

- Etapas em abas com quantidade de pessoas; filtros e busca dentro da vaga.
- Lista com resumo profissional e acesso à ficha e ao currículo.
- Movimentação de etapa, reprovação, avaliações, tags e histórico.
- Navegação anterior/próxima dentro da seleção da vaga.
- Ações coletivas precisam de confirmação dos efeitos, especialmente se enviarem mensagens ou alterarem etapas.

### Comunicação e entrevistas

- Agendamento e painel de entrevistas do dia.
- Aba de mensagens e atalhos de contato.
- Indicadores de feedback e atalhos para processos pendentes.
- Registro interno, tentativa de envio e entrega de mensagem são eventos diferentes; as imagens não mostram como a Gupy os contabiliza.

### Recursos avançados

Aderência, posição no ranking, talentos recomendados, personalização de ordenação, testes, avaliações psicológicas, roteiro com IA, carta oferta, impulsionamento e LinkedIn Recruiter aparecem na interface. As capturas não mostram critérios, integrações, custos ou conteúdo desses recursos. Sua presença visual não é evidência suficiente para reproduzir o comportamento.

## Comparação com o ConectaRH

| Área | Evidência no código atual | Evolução possível a partir das referências |
|---|---|---|
| Vagas | Criação, edição, listagem por responsável, status, paginação e contagem de candidaturas usam recruitmentStore. | Lista mais completa, busca por código/título, prazos de contratação, posições e ações de ciclo de vida. |
| Candidaturas | Consulta paginada por vaga com retrato profissional. | Ficha própria, filtros, navegação entre pessoas, currículo e movimentação real por etapa. |
| Etapas | Há dados de etapas, mas o Kanban usa adminData e estado local. | Persistir movimentações e registrar histórico por candidatura. |
| Feedback | Registro interno persistido e contagem de candidaturas sem feedback. | Comunicação real com resultado de envio e histórico. Definir o que conta como feedback ao candidato. |
| Entrevistas | Agenda atual usa dados demonstrativos e estado local. | Agendamento persistido por candidatura, responsável, horário, local/link e status. |
| Painel | Dashboard usa dados demonstrativos e valores fixos. | Indicadores reais derivados de vagas, candidaturas, entrevistas e feedback. |
| Perguntas da vaga | Não foi identificado fluxo operacional de questionário nas telas reais consultadas. | Perguntas configuradas na vaga e respostas vinculadas à candidatura. |
| Empresas e acessos | Login da Equipe direciona recrutamento/comercial; Comercial possui área de empresas; administrador e financeiro estão pendentes. | Manter empresas no Comercial e recrutamento no perfil do recrutador; definir atribuições e permissões do administrador. |

Os registros de currículo e perfil pertencem ao candidato. A exposição de dados pessoais ao recrutador deve ser uma decisão explícita de produto e permissão; a presença desses campos na Gupy não implica necessidade de copiá-los.

## Ordem sugerida de evolução

1. Ficha real da candidatura e fluxo por etapas: avançar, reprovar, histórico e acesso ao currículo autorizado.
2. Entrevistas e comunicação: agenda real, avaliações internas e mensagens com registro do resultado do envio.
3. Gestão de vagas: busca e filtros no banco, quantidade de posições, prazo de contratação, duplicação e estados com efeitos definidos.
4. Painel operacional: entrevistas do dia, vagas próximas do prazo e pendências de feedback com contagens reais.
5. Questionários e avaliações estruturadas conforme necessidade da Serhum.
6. Só após definir requisitos e critérios, avaliar recomendações, aderência, ranking, IA e integrações externas.

Esta é uma proposta de prioridade para discussão, não substitui o plano de fases nem autoriza implementação. No ConectaRH, o filtro atual é de mais de 80 dias; a captura da Gupy usa 90 dias. Não há razão para mudar esse requisito automaticamente.

## Imagens adicionais que esclarecem os fluxos

Após o segundo envio, ainda faltam:

1. Tela/modal de “Reprovar”, incluindo opções de motivo e mensagem; confirmação exibida depois de escolher outra etapa.
2. Parte inferior da Timeline com eventos já registrados e tela de composição/envio de mensagem.
3. Modal “Agendar entrevista” e formulário “Adicionar avaliação”.
4. Criação/edição da vaga nas partes de etapas, perguntas, responsáveis, número de posições e prazos.

Depois: opções de filtros de candidaturas; segunda visualização ao lado da lista; ações em massa; diálogos de congelar/cancelar/encerrar; telas de administração de equipe e permissões. Para entender Comercial, seriam necessárias capturas específicas de empresas/clientes: elas não aparecem neste ZIP.

Podem ser utilizadas capturas de teste ou com dados pessoais ocultados. Precisamos dos controles, rótulos e opções, não da identidade das pessoas.

## Complemento — segundo envio de imagens

Foram recebidas sete capturas: uma repetição do painel (085045) e seis novas imagens (085842, 085922, 085931, 085945, 090713 e 090723).

### Movimento entre etapas — 085842

O botão abre uma lista de etapas da vaga, incluindo Seleção, Avaliação Psicológica, Entrevista Técnica e Contratação. A lista tem rolagem, portanto não é um inventário completo de etapas. Entrevista Técnica aparece desabilitada e corresponde à etapa atual mostrada anteriormente; essa correspondência sugere que a etapa atual não pode ser selecionada novamente, mas outras condições de bloqueio não são conhecidas. Não foi mostrado o resultado de escolher uma etapa: confirmação, notificações, testes liberados e histórico permanecem sem validação.

### Anotações na Timeline — 085922

A aba oferece editor com formatação, listas e imagem, anexo com limite indicado de 10 MB, botão Salvar e controle “Ocultar anotação”. A dica da interface descreve menções por @ a usuários com acesso à vaga, com aviso por e-mail e dentro da Gupy, e possibilidade de editar comentários próprios. Não foi demonstrada a criação de anotação ou notificação. Não está claro quem pode ver uma anotação ocultada. A imagem mostra o editor; o histórico de eventos abaixo dele não está visível.

Para o ConectaRH, anotações internas, eventos de movimentação e mensagens ao candidato devem ter visibilidade e autoria explícitas. Uma anotação não deve ser contabilizada automaticamente como feedback enviado.

### Mensagens — 085931 e 085945

As imagens mostram a mesma mensagem recolhida e expandida. O histórico apresenta assunto, remetente, data/hora e rótulo “Mensagem entregue”. O aviso informa que novos envios podem demorar a aparecer por estarem em processamento. Há botão Responder e controle “Permitir a resposta dos candidatos”. O corpo da mensagem comunica a liberação de uma etapa de teste e menciona acesso pela plataforma.

Isso confirma a apresentação de histórico de comunicação e de um estado declarado de entrega. Não demonstra confirmação de leitura, provedor utilizado ou disparo automático provocado pela troca de etapa. Não foi mostrado o editor de resposta. O escopo do controle de respostas (mensagem, conversa ou candidatura) ainda precisa ser esclarecido.

### Talentos recomendados — 090713 e 090723

A aba separa recomendações de pessoas já inscritas. Cada item mostra resumo de cargo, escolaridade, localização e origem identificada como “Banco de talentos” ou “Banco Gupy”. Há ações Recusar, Atribuir e Gerar mais recomendações. Ao abrir uma pessoa, surge um painel lateral com experiências profissionais, empresas, períodos e descrições, além de abas para escolaridade e outras informações. As ações Recusar/Atribuir permanecem no rodapé do painel.

O painel lateral permite consultar a pessoa sem perder a lista, padrão útil também para as candidaturas do ConectaRH. O efeito exato de “Atribuir” não foi mostrado: não sabemos se cria candidatura, convite ou outro vínculo. Não se deve tratar recomendação como candidatura voluntária nem “Recusar” como reprovação sem confirmar essas regras. O algoritmo e as condições de acesso às duas bases não estão visíveis.

### Consequências para o planejamento

As novas referências reforçam a prioridade de ficha por candidatura, etapas e histórico. Em seguida, anotações com autoria e visibilidade, comunicação com estados reais de envio e agenda. A consulta lateral pode ser adotada como padrão de navegação independentemente de existir recomendação automática. Recomendações e integração com bases externas continuam dependendo de escopo próprio e critérios definidos.
