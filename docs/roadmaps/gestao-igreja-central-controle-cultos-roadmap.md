# Roadmap: Central de Controle do Gestor por Culto/Evento

Status: proposta de produto
Data: 2026-07-01
Modulo alvo: Gestao da Igreja, Culto+ e escalas operacionais
Relacionado: `docs/roadmaps/perfis-gerais-e-permissoes-igreja-roadmap.md`

## 1. Objetivo

Criar uma pagina central para o perfil `Gestor da Igreja` administrar toda a operacao ligada a cultos e eventos a partir de um unico ponto.

A pagina deve reduzir a descentralizacao atual entre criacao de culto, equipes, ministerios, escalas, convites, QR Codes e acompanhamento. O culto/evento passa a ser o eixo operacional: primeiro o gestor escolhe ou cria um culto, depois monta cargos, equipes, lideres, vagas, voluntarios, convites e alertas.

O objetivo nao e substituir a pagina publica do Culto+ nem obrigar que todo culto tenha escala. O objetivo e criar uma camada de controle operacional para quando a igreja quiser gerir voluntarios, lideres e pastores em torno de um culto/evento.

## 2. Principios do Produto

- Culto/evento pode existir sem qualquer vinculo operacional com a gestao.
- Gestao operacional pode ser ativada depois da criacao do culto.
- Uma escala operacional deve nascer a partir de um culto/evento, nao como uma lista solta.
- Equipes recorrentes devem ser reaproveitadas sem retrabalho semanal.
- Cargos/vagas devem ser claros antes de convidar voluntarios.
- Lideres devem ter autonomia no escopo do time que lideram.
- Voluntarios devem receber convite simples, com aceite ou recusa.
- QR Code e link devem poder apontar para um posto especifico do culto, nao apenas para um formulario generico.
- O gestor precisa ver lacunas, pendencias e conflitos rapidamente.
- Dados pastorais sensiveis nao devem ser expostos automaticamente ao gestor operacional.

## 3. Problema Atual

Hoje o fluxo tende a ficar espalhado:

- culto e criado em uma area;
- equipes/ministerios podem existir em outra;
- escala fica dentro do painel do culto;
- convites e QR Codes podem ser tratados como formularios separados;
- voluntarios, lideres e pastores nao ficam centralizados por evento;
- recorrencia de cultos e repeticao de equipes ainda exigem muito trabalho manual;
- alertas de vaga aberta, convite pendente, recusa e conflito nao aparecem como uma visao unica.

A nova pagina deve organizar esse fluxo pela pergunta operacional principal:

> "Para este culto/evento, quem vai servir, em qual equipe, em qual cargo, com quantas vagas e qual status?"

## 4. Escopo

### Dentro do escopo

- Pagina central para gestor administrar cultos/eventos pela otica operacional.
- Lista de cultos/eventos criados.
- Card por culto com indicadores de escala, vagas e alertas.
- Expansao do culto para mostrar equipes, cargos, vagas, lideres e participantes.
- Criacao de culto/evento sem obrigatoriedade de vinculo com gestao.
- Ativacao posterior da gestao operacional em um culto existente.
- Definicao de equipes do culto.
- Definicao de lider por equipe.
- Definicao de cargos/postos por equipe.
- Definicao de quantidade de vagas por cargo/posto.
- Replicacao de vagas, cargos e equipes de outro culto.
- Templates de escala por tipo de culto.
- Convite direto de usuario para atuar como voluntario.
- Geracao de link ou QR Code para posto especifico do culto.
- Acompanhamento de aceite, recusa, pendencia, substituicao e presenca.
- Alertas operacionais para o gestor.

### Fora do escopo inicial

- Redesenho completo do Culto+ publico.
- Mudanca obrigatoria da experiencia do membro durante o culto.
- Automacao completa de escala sem revisao humana.
- Controle financeiro, pagamentos ou oferta.
- Avaliacao espiritual individual de voluntarios.
- Exposicao de pedidos pastorais sensiveis ao gestor administrativo.
- Sincronizacao externa com Google Calendar/Outlook no MVP.

## 5. Personas

### Gestor da Igreja

Administra a operacao do culto/evento. Cria cultos, ativa gestao operacional, define equipes, cargos, lideres, vagas, convites, alertas e substituicoes.

### Pastor

Pode ter visao pastoral e/ou responsavel por culto. Nem todo pastor precisa ser gestor administrativo. Quando responsavel pelo culto, pode acompanhar escala, liderancas e andamento.

### Lider de Equipe

Gerencia somente a equipe/time sob sua responsabilidade. Pode acompanhar voluntarios do seu time, convidar pessoas conforme permissao, indicar substitutos e confirmar presenca operacional.

### Voluntario

Recebe convite para servir em um cargo/posto especifico. Pode aceitar, recusar, informar indisponibilidade e ver suas designacoes.

## 6. Conceitos de Produto

| Conceito | Descricao |
| --- | --- |
| Culto/evento | Encontro criado pela igreja. Pode ser um culto do Culto+, conferencia, vigilia, celula especial ou evento interno. |
| Gestao operacional | Camada opcional ativada sobre um culto/evento para controlar equipes, cargos, vagas e voluntarios. |
| Equipe/time | Grupo operacional que serve no culto, como louvor, midia, recepcao, infantil, intercessao. |
| Lider da equipe | Pessoa responsavel por uma equipe especifica naquele culto ou em uma recorrencia. |
| Cargo/posto | Funcao operacional dentro de uma equipe, como vocal, camera, recepcao porta principal, professor infantil. |
| Vaga | Quantidade necessaria de pessoas para um cargo/posto em um culto/evento. |
| Participante designado | Usuario convidado ou confirmado para ocupar uma vaga. |
| Template de escala | Modelo reutilizavel de equipes, cargos, lideres e quantidades de vagas. |
| Serie recorrente | Conjunto de cultos/eventos que se repetem por regra definida, como todo domingo as 19h. |
| Convite especifico | Link ou QR Code que direciona para um culto, equipe e cargo/posto especificos. |

## 7. Caminho Feliz

1. Gestor acessa a pagina central de controle.
2. Gestor cria um culto/evento ou seleciona um culto existente.
3. O culto pode permanecer sem gestao operacional, se for apenas uma pagina ou agenda.
4. Gestor ativa a gestao operacional do culto.
5. Sistema permite montar escala manualmente ou replicar estrutura de outro culto/template.
6. Gestor define equipes do culto.
7. Gestor define lider de cada equipe.
8. Gestor define cargos/postos de cada equipe.
9. Gestor define quantidade de vagas por cargo/posto.
10. Sistema calcula vagas abertas, vagas preenchidas e convites pendentes.
11. Gestor seleciona uma equipe/time.
12. Sistema mostra membros da equipe, lider, cargos, vagas e participantes designados.
13. Gestor remove pessoa do culto, convida usuario existente ou gera link/QR Code para convite.
14. Voluntario acessa convite, aceita ou recusa.
15. Sistema atualiza o card do culto e os alertas.
16. Lider/pastor acompanha pendencias e confirma escala antes do culto.
17. Durante ou apos o culto, responsavel registra presenca, ausencia ou substituicao.
18. Culto e encerrado com historico operacional salvo para replicacao futura.

## 8. Estrutura Sugerida da Pagina

### 8.1 Cabecalho

- Nome da igreja ativa.
- Filtro de periodo: hoje, proximos 7 dias, mes, personalizado.
- Filtro de status: rascunho, publicado, ao vivo, encerrado, arquivado.
- Filtro operacional: sem escala, escala incompleta, escala completa, com alertas.
- Acao principal: `Novo culto/evento`.
- Acao secundaria: `Criar a partir de template`.

### 8.2 Lista de Cultos/Eventos

Cada card deve mostrar:

- nome do culto/evento;
- data e horario;
- tipo do culto/evento;
- status do culto;
- status da gestao operacional;
- quantidade de equipes vinculadas;
- total de vagas;
- vagas abertas;
- vagas preenchidas;
- convites pendentes;
- recusas;
- substituicoes;
- alertas criticos;
- origem da escala, quando copiada de outro culto/template;
- indicador de recorrencia, quando fizer parte de uma serie.

### 8.3 Alertas no Card

Alertas recomendados:

- culto proximo com vagas abertas;
- equipe sem lider definido;
- cargo sem vagas configuradas;
- cargo com vagas abertas;
- convite pendente perto do prazo;
- voluntario recusou;
- voluntario removido sem substituto;
- conflito de horario do voluntario;
- voluntario escalado em dois cargos simultaneos;
- lider ausente ou sem confirmacao;
- QR Code expirado, pausado ou sem destino;
- culto recorrente sem escala gerada para a proxima ocorrencia;
- equipe pausada tentando ser usada no culto;
- template antigo ou desatualizado.

### 8.4 Culto Expandido

Ao clicar no card, o culto deve expandir sem tirar o gestor do contexto.

Abas ou secoes sugeridas:

- `Resumo`: indicadores, pendencias e acoes rapidas.
- `Equipes`: times vinculados ao culto.
- `Cargos e vagas`: funcoes, quantidades e preenchimento.
- `Participantes`: pessoas confirmadas, pendentes, recusadas e substituidas.
- `Convites`: links, QR Codes, validade e origem.
- `Recorrencia`: origem, serie e proximas ocorrencias.
- `Historico`: acoes, alteracoes, presenca e encerramento.

## 9. Funcionalidades Necessarias

### 9.1 Criar culto/evento independente

O gestor deve conseguir criar um culto/evento sem ativar gestao operacional.

Campos minimos:

- nome;
- tipo;
- data/hora de inicio;
- data/hora de fim;
- status;
- responsavel opcional;
- observacoes internas opcionais.

Regra: a criacao do culto nao deve obrigar equipe, escala, vagas ou voluntarios.

### 9.2 Ativar gestao operacional

Em um culto existente, o gestor pode ativar a gestao operacional.

Ao ativar, o sistema deve oferecer:

- iniciar do zero;
- copiar de outro culto;
- aplicar template;
- aplicar template da serie recorrente;
- importar equipes padrao da igreja.

### 9.3 Replicar escopo de outro culto

O gestor deve copiar equipes, cargos, vagas e lideres de outro culto.

Opcoes de copia:

- copiar somente estrutura de equipes;
- copiar equipes e cargos;
- copiar equipes, cargos e quantidade de vagas;
- copiar tambem lideres;
- copiar tambem voluntarios confirmados;
- copiar somente pessoas que aceitaram no culto anterior;
- copiar mantendo todos como pendentes para novo aceite.

Regra recomendada: por padrao, nao copiar aceite anterior como aceite automatico para novo culto. O sistema pode sugerir as pessoas, mas deve solicitar nova confirmacao quando o culto for outra data.

### 9.4 Templates de escala

Templates ajudam em cultos que se repetem.

Exemplos:

- Domingo manha;
- Domingo noite;
- Culto de jovens;
- Santa Ceia;
- Conferencia;
- Vigilia;
- Culto infantil.

Cada template pode conter:

- equipes padrao;
- lider padrao por equipe;
- cargos por equipe;
- quantidade de vagas por cargo;
- instrucoes internas;
- prazo padrao de confirmacao;
- antecedencia para alertas;
- regra de convite.

### 9.5 Recorrencia de cultos

Cultos recorrentes devem ser tratados como serie.

Casos:

- todo domingo as 19h;
- toda quarta as 20h;
- primeiro domingo do mes;
- quinzenal;
- evento com varios dias.

Funcionalidades:

- gerar proximas ocorrencias;
- aplicar template automaticamente nas novas ocorrencias;
- permitir editar somente uma ocorrencia;
- permitir editar a serie inteira;
- permitir cancelar uma ocorrencia sem apagar a serie;
- alertar quando proxima ocorrencia nao tiver escala completa.

### 9.6 Equipes do culto

O gestor deve selecionar ou criar equipes para o culto.

Cada equipe no culto deve ter:

- nome;
- area;
- lider responsavel;
- status;
- cargos/postos;
- participantes;
- observacoes internas.

Regra: equipe global da igreja e diferente de equipe usada naquele culto. A equipe global pode ser reaproveitada, mas a escala do culto deve guardar seu proprio estado historico.

### 9.7 Lider por equipe

Cada equipe pode ter um lider principal e, opcionalmente, um suplente.

Funcionalidades:

- definir lider principal;
- definir lider suplente;
- trocar lider para apenas aquele culto;
- trocar lider para a serie recorrente;
- permitir que lider gerencie somente sua equipe;
- alertar equipe sem lider.

### 9.8 Cargos, postos e vagas

Cada equipe deve poder ter varios cargos/postos.

Exemplo:

| Equipe | Cargo/posto | Vagas |
| --- | --- | --- |
| Louvor | Vocal | 3 |
| Louvor | Violao | 1 |
| Midia | Camera | 2 |
| Recepcao | Porta principal | 4 |
| Infantil | Professor | 2 |

Regras:

- todo cargo/posto operacional deve ter quantidade de vagas;
- vaga deve ser inteiro positivo;
- vaga preenchida e vaga pendente devem ser contadas separadamente;
- convite pendente pode reservar vaga para evitar excesso;
- recusa deve liberar vaga;
- remocao deve liberar vaga;
- substituicao deve preservar historico.

### 9.9 Selecionar time e gerir participantes

Ao selecionar uma equipe/time, a pagina deve mostrar:

- lider;
- suplente;
- cargos/postos daquela equipe;
- pessoas confirmadas;
- pessoas pendentes;
- pessoas recusadas;
- pessoas removidas;
- vagas abertas por cargo;
- acoes por pessoa.

Acoes:

- convidar usuario existente;
- remover do culto;
- trocar cargo;
- marcar como substituto;
- reenviar convite;
- registrar observacao interna;
- gerar link de convite;
- gerar QR Code de convite;
- copiar lista de convidados.

### 9.10 Convite por link ou QR Code especifico

O gestor ou lider autorizado deve conseguir gerar convite para:

- culto inteiro;
- equipe especifica;
- cargo/posto especifico;
- vaga especifica, quando necessario.

Dados do convite:

- igreja;
- culto/evento;
- equipe;
- cargo/posto;
- validade;
- limite de usos;
- status;
- texto de confirmacao;
- politica de login;
- responsavel pelo convite.

Regras recomendadas:

- convite para cargo especifico deve preencher automaticamente o contexto da vaga;
- QR Code expirado nao deve aceitar novas respostas;
- QR Code pausado nao deve aceitar novas respostas;
- convite com limite de usos atingido deve bloquear novo aceite;
- se houver mais respostas do que vagas, excedentes devem entrar como interessados ou lista de espera;
- aceitar convite nao deve conceder role administrativa automaticamente.

### 9.11 Fluxo de aceite/recusa

Voluntario convidado deve poder:

- ver culto, data, horario, equipe e cargo;
- aceitar;
- recusar;
- informar motivo opcional;
- indicar indisponibilidade;
- solicitar contato do lider, se permitido;
- ver suas designacoes depois em area propria.

Estados recomendados:

- `draft`;
- `invited`;
- `pending`;
- `accepted`;
- `declined`;
- `expired`;
- `removed`;
- `substituted`;
- `checked_in`;
- `no_show`.

### 9.12 Substituicao

Quando alguem recusar ou for removido:

- sistema libera a vaga;
- alerta o gestor/lider;
- permite convidar substituto;
- registra quem substituiu quem;
- preserva historico do convite original;
- nao apaga a pessoa removida do historico do culto.

### 9.13 Presenca e fechamento do culto

Apos ou durante o culto, lider ou gestor deve registrar:

- presente;
- ausente;
- substituido;
- dispensado;
- observacao operacional.

No encerramento:

- calcular preenchimento final;
- salvar historico;
- gerar base para replicar proximo culto;
- destacar voluntarios frequentes sem criar ranking espiritual;
- apontar equipes com maior recorrencia de falta ou vaga aberta.

### 9.14 Notificacoes e lembretes

Eventos que devem gerar notificacao:

- convite criado;
- convite aceito;
- convite recusado;
- convite expirando;
- prazo de confirmacao proximo;
- escala alterada;
- lider alterado;
- voluntario removido;
- substituto convidado;
- culto proximo com vagas abertas;
- escala completa.

Canais possiveis:

- notificacao interna;
- email;
- WhatsApp/manual futuro;
- push futuro.

### 9.15 Disponibilidade do voluntario

Funcionalidade importante para reduzir recusas:

- voluntario informa disponibilidade por dia/horario;
- gestor ve alerta antes de convidar alguem indisponivel;
- sistema marca conflito se voluntario ja estiver escalado em outro culto ou equipe no mesmo horario;
- lider pode filtrar por disponiveis.

Pode ficar fora do MVP, mas deve estar previsto no modelo.

### 9.16 Busca e diretorio de pessoas

Ao convidar, gestor/lider deve conseguir buscar por:

- nome;
- email;
- telefone;
- equipe;
- papel;
- disponibilidade;
- historico de participacao;
- status de membro;
- tags operacionais.

Regras:

- lider deve ver somente pessoas permitidas pela sua equipe/escopo;
- dados sensiveis devem seguir permissoes;
- visitante/interessado vindo de QR deve passar por aprovacao antes de virar voluntario recorrente.

### 9.17 Auditoria

Toda mudanca operacional relevante deve ter historico:

- quem criou culto;
- quem ativou gestao;
- quem criou equipe;
- quem alterou lider;
- quem criou cargo/vaga;
- quem convidou voluntario;
- quem aceitou/recusou;
- quem removeu;
- quem substituiu;
- data/hora da alteracao.

## 10. Regras de Negocio

| ID | Regra |
| --- | --- |
| RN-CGC-001 | Culto/evento pode ser criado sem gestao operacional. |
| RN-CGC-002 | Gestao operacional pode ser ativada depois da criacao do culto/evento. |
| RN-CGC-003 | A pagina central deve listar cultos/eventos da igreja ativa conforme permissao do usuario. |
| RN-CGC-004 | Card do culto deve exibir vagas abertas, vagas preenchidas e alertas. |
| RN-CGC-005 | Culto sem escala deve aparecer como "sem gestao operacional" ou equivalente, nao como erro. |
| RN-CGC-006 | Gestor pode criar, editar, cancelar e arquivar gestao operacional de culto. |
| RN-CGC-007 | Pastor nao vira gestor administrativo automaticamente. |
| RN-CGC-008 | Lider so pode gerenciar equipes dentro do seu escopo. |
| RN-CGC-009 | Voluntario so pode ver e responder suas proprias designacoes. |
| RN-CGC-010 | Equipe global pode ser usada em varios cultos, mas a participacao em um culto deve ter registro proprio. |
| RN-CGC-011 | Cada equipe do culto pode ter lider principal. |
| RN-CGC-012 | Equipe sem lider deve gerar alerta quando tiver cargos/vagas ativos. |
| RN-CGC-013 | Todo cargo/posto ativo deve possuir quantidade de vagas. |
| RN-CGC-014 | Quantidade de vagas deve ser maior que zero. |
| RN-CGC-015 | Vaga aceita conta como preenchida. |
| RN-CGC-016 | Convite pendente pode reservar vaga conforme configuracao da igreja. |
| RN-CGC-017 | Recusa libera vaga. |
| RN-CGC-018 | Remocao libera vaga. |
| RN-CGC-019 | Substituicao deve preservar historico da pessoa substituida. |
| RN-CGC-020 | Nao deve ser permitido confirmar mais pessoas do que o total de vagas do cargo, salvo permissao explicita de overbooking. |
| RN-CGC-021 | Copiar escala de outro culto nao deve confirmar automaticamente voluntarios para nova data por padrao. |
| RN-CGC-022 | Template pode sugerir pessoas, mas aceite deve ser confirmado por culto/ocorrencia. |
| RN-CGC-023 | Serie recorrente pode gerar ocorrencias futuras com template pre-aplicado. |
| RN-CGC-024 | Editar uma ocorrencia nao deve alterar a serie inteira sem confirmacao explicita. |
| RN-CGC-025 | Cancelar uma ocorrencia nao deve apagar historico da serie. |
| RN-CGC-026 | Link/QR de convite deve apontar para igreja, culto/evento e contexto operacional. |
| RN-CGC-027 | Link/QR para cargo especifico deve respeitar quantidade de vagas. |
| RN-CGC-028 | QR expirado, pausado ou arquivado nao aceita novos convites. |
| RN-CGC-029 | Convite aceito nao concede role administrativa automaticamente. |
| RN-CGC-030 | Lider pode reenviar convite somente dentro do escopo permitido. |
| RN-CGC-031 | Alteracoes relevantes devem gerar auditoria. |
| RN-CGC-032 | Alertas devem priorizar lacunas operacionais, nao julgamento espiritual de pessoas. |
| RN-CGC-033 | Dados pastorais sensiveis nao entram na central operacional por padrao. |
| RN-CGC-034 | Encerramento do culto deve manter historico para relatorio e replicacao futura. |
| RN-CGC-035 | Pessoa removida do culto nao deve ser apagada do historico. |
| RN-CGC-036 | Voluntario pode recusar sem precisar justificar obrigatoriamente. |
| RN-CGC-037 | Motivo de recusa, quando informado, deve respeitar privacidade e escopo. |
| RN-CGC-038 | Gestor deve conseguir identificar rapidamente cultos proximos com escala incompleta. |
| RN-CGC-039 | Cultos arquivados nao devem aparecer na lista principal por padrao. |
| RN-CGC-040 | A central deve suportar culto unico e culto recorrente. |

## 11. Roadmap por Fases

### Fase 0 - Alinhamento e desenho funcional

Objetivo: fechar modelo de produto antes de implementar.

Entregas:

- definir nome final da pagina;
- definir rota conceitual;
- confirmar se "culto" e "evento" usam o mesmo motor;
- mapear tabelas existentes de Culto+ e Gestao da Igreja;
- decidir relacao entre `service_ministries`, `service_ministry_members`, `service_schedule_assignments` e novas designacoes;
- definir permissao exata de gestor, pastor, lider e voluntario;
- validar se QR especifico de posto usa fluxo existente de QR ou novo convite operacional;
- definir estados oficiais de convite/designacao.

Criterios de aceite:

- produto sabe diferenciar culto sem gestao, culto com gestao e culto recorrente;
- regras de permissao estao claras;
- nao ha duplicacao desnecessaria entre escala do Culto+ e gestao operacional.

### Fase 1 - MVP da central operacional

Objetivo: criar uma pagina unica para listar cultos e visualizar estado operacional.

Entregas:

- lista de cultos/eventos da igreja ativa;
- card com data, status, vagas abertas, vagas preenchidas e alertas;
- expansao do culto;
- criacao de culto/evento sem gestao operacional;
- ativacao de gestao operacional;
- criacao manual de equipes do culto;
- definicao de lider por equipe;
- criacao de cargos/postos com quantidade de vagas;
- visualizacao de participantes por cargo;
- acoes basicas de convidar usuario existente e remover do culto.

Criterios de aceite:

- gestor consegue enxergar todos os cultos em uma unica tela;
- culto sem gestao aparece corretamente;
- culto com gestao mostra lacunas e preenchimento;
- gestor consegue montar uma escala simples do zero.

### Fase 2 - Convites, aceite e QR/link especifico

Objetivo: fechar o ciclo entre gestor/lider e voluntario.

Entregas:

- convite para usuario existente;
- aceite/recusa do voluntario;
- status de convite;
- alerta de pendencia;
- liberacao de vaga em caso de recusa;
- link de convite por culto/equipe/cargo;
- QR Code por culto/equipe/cargo;
- controle de validade do convite;
- limite de usos do link/QR;
- tela simples de resposta do voluntario.

Criterios de aceite:

- voluntario entende para qual culto, equipe e cargo foi chamado;
- aceite preenche vaga;
- recusa libera vaga;
- gestor ve card atualizado apos resposta;
- QR/link nao gera compromisso fora do contexto correto.

### Fase 3 - Replicacao e templates

Objetivo: reduzir retrabalho em cultos recorrentes.

Entregas:

- copiar estrutura de outro culto;
- copiar somente equipes;
- copiar equipes + cargos + vagas;
- copiar lideres;
- sugerir voluntarios do culto anterior;
- templates por tipo de culto;
- aplicar template em culto existente;
- salvar escala atual como template;
- comparar escala atual com template.

Criterios de aceite:

- gestor consegue montar culto desta semana a partir do culto anterior;
- template nao confirma voluntario automaticamente sem regra explicita;
- gestor consegue ajustar diferencas antes de enviar convites.

### Fase 4 - Recorrencia de cultos/eventos

Objetivo: apoiar cultos que se repetem sem criar trabalho manual em cada ocorrencia.

Entregas:

- criar serie recorrente;
- gerar proximas ocorrencias;
- aplicar template padrao da serie;
- editar uma ocorrencia;
- editar serie inteira;
- cancelar ocorrencia;
- alerta de proxima ocorrencia sem escala;
- visao de proximas ocorrencias da serie.

Criterios de aceite:

- culto semanal pode gerar agenda futura;
- escala padrao pode ser aplicada automaticamente como rascunho;
- gestor consegue ajustar apenas uma data sem quebrar a serie.

### Fase 5 - Lideranca por equipe

Objetivo: tirar tudo das costas do gestor sem perder controle.

Entregas:

- lider ve somente suas equipes;
- lider convida voluntarios permitidos;
- lider acompanha aceite/recusa;
- lider sugere substituto;
- lider registra presenca da equipe;
- gestor ve consolidado de todas as equipes;
- regras de permissao por escopo.

Criterios de aceite:

- lider nao ve dados fora do seu escopo;
- gestor continua com visao global;
- equipe consegue operar sem depender de um unico gestor para cada ajuste.

### Fase 6 - Presenca, fechamento e historico

Objetivo: transformar cada culto encerrado em base confiavel para proximas escalas.

Entregas:

- registro de presenca;
- ausente/no-show;
- substituicao durante culto;
- encerramento operacional;
- resumo de escala;
- historico por culto;
- historico por voluntario;
- base para copiar pessoas frequentes;
- relatorio simples.

Criterios de aceite:

- escala final do culto fica historica;
- gestor sabe quem serviu de fato;
- proxima escala pode usar historico sem expor metricas sensiveis indevidas.

### Fase 7 - Inteligencia operacional e automacoes

Objetivo: ajudar o gestor a decidir, sem automatizar responsabilidade humana.

Entregas:

- sugestao de voluntarios disponiveis;
- alerta de conflito antes do convite;
- sugestao de substituto;
- identificacao de cargos frequentemente descobertos;
- lembretes automaticos por prazo;
- analise de templates mais usados;
- recomendacao de escala com revisao humana;
- fila de interessados vindos de QR publico.

Criterios de aceite:

- sistema sugere, mas gestor/lider confirma;
- alertas reduzem esquecimento;
- nenhuma sugestao rotula espiritualidade ou valor pessoal do voluntario.

## 12. Funcionalidades que Valem Incluir

Estas funcionalidades nao apareceram explicitamente no caminho feliz, mas devem entrar no desenho para evitar retrabalho:

- **Status de gestao do culto:** sem gestao, rascunho de escala, escala aberta, aguardando aceite, escala completa, em andamento, encerrada.
- **Prazo de confirmacao:** data limite para voluntarios responderem.
- **Lista de espera:** quando QR/link receber mais interessados que vagas.
- **Substituto sugerido:** pessoa indicada para ocupar vaga recusada.
- **Indisponibilidade do voluntario:** evita convite em dias/horarios indisponiveis.
- **Conflito de escala:** pessoa ja escalada em outro culto/cargo no mesmo horario.
- **Observacao interna por cargo:** detalhes como roupa, chegada antecipada, material, ensaio.
- **Horario de chegada diferente do horario do culto:** importante para louvor, midia, recepcao e infantil.
- **Check-in do voluntario:** confirma presenca operacional, diferente do check-in comum do membro.
- **Permissao temporaria de lider:** lider pode gerir equipe apenas naquele culto/evento.
- **Duplicar somente estrutura:** copia cargos/vagas sem pessoas.
- **Duplicar com pessoas sugeridas:** copia pessoas como recomendacao, mas sem aceite automatico.
- **Historico de alteracoes:** indispensavel quando ha remocao, substituicao ou conflito.
- **Arquivar/cancelar escala:** preservar historico sem mostrar na lista principal.
- **Exportacao simples:** PDF/CSV da escala do culto para uso offline.
- **Impressao da escala:** muitas igrejas ainda usam lista impressa no dia.
- **Acesso mobile para lider:** lider precisa resolver substituicoes pelo celular.
- **Modo dia do culto:** foco em presenca, ausencias e substituicoes, sem poluir com criacao.
- **Comentarios internos por equipe:** comunicacao operacional sem virar feed publico.
- **Anexos ou links por equipe:** repertorio, slides, ordem de culto, escala tecnica.

## 13. Modelo de Estados Sugerido

### Culto/evento

- `draft`;
- `published`;
- `live`;
- `finished`;
- `cancelled`;
- `archived`.

### Gestao operacional do culto

- `not_enabled`;
- `draft`;
- `open`;
- `waiting_confirmations`;
- `complete`;
- `in_progress`;
- `closed`;
- `cancelled`;
- `archived`.

### Convite/designacao

- `draft`;
- `invited`;
- `pending`;
- `accepted`;
- `declined`;
- `expired`;
- `removed`;
- `substituted`;
- `checked_in`;
- `no_show`.

### Link/QR de convite

- `draft`;
- `active`;
- `paused`;
- `expired`;
- `archived`.

## 14. Relacao com Culto+

O Culto+ continua sendo a experiencia de culto: pagina publica, liturgia, check-in, pedidos de oracao, posts, notas e modo ao vivo.

A nova central do gestor deve funcionar como camada operacional:

- usa o culto/evento como origem;
- administra equipes, lideres, cargos, vagas e convites;
- pode abrir a pagina/painel do Culto+ quando necessario;
- nao obriga o Culto+ publico a ter escala;
- nao mistura pedido pastoral sensivel com escala operacional;
- pode alimentar a escala do culto e relatorios operacionais.

## 15. Relacao com Gestao da Igreja

A Gestao da Igreja deve ser a dona das permissoes e regras operacionais:

- quem e gestor;
- quem e pastor;
- quem e lider;
- quem e voluntario;
- qual escopo cada pessoa possui;
- quais equipes existem na igreja;
- quais equipes podem ser usadas em culto/evento;
- quais dados cada perfil pode ver.

A central por culto/evento deve ser uma entrada mais organizada para executar o trabalho da gestao, nao uma segunda gestao paralela.

## 16. Indicadores da Primeira Tela

Indicadores recomendados para cada card:

- total de vagas;
- vagas preenchidas;
- vagas abertas;
- convites pendentes;
- recusas;
- equipes sem lider;
- cargos sem preenchimento;
- percentual de escala completa;
- dias/horas ate o culto;
- status de recorrencia;
- alertas criticos.

Indicadores do topo da pagina:

- cultos proximos;
- cultos com escala incompleta;
- total de vagas abertas no periodo;
- total de convites pendentes;
- cultos sem lideranca definida;
- cultos recorrentes sem proxima escala gerada.

## 17. Criterios de Aceite Gerais

- Gestor acessa uma pagina central e ve os cultos/eventos da igreja ativa.
- Gestor identifica rapidamente cultos com vagas abertas ou alertas.
- Culto pode existir sem gestao operacional.
- Gestor consegue ativar gestao operacional em culto existente.
- Gestor consegue criar equipes, lideres, cargos e vagas a partir de um culto.
- Gestor consegue selecionar equipe e ver participantes daquele time.
- Gestor consegue convidar usuario ou gerar link/QR para cargo especifico.
- Voluntario consegue aceitar ou recusar designacao.
- Recusa libera vaga e gera alerta.
- Estrutura de um culto pode ser replicada de outro culto.
- Cultos recorrentes podem reutilizar templates.
- Lider ve apenas o que esta dentro do seu escopo.
- Pastor nao recebe permissao administrativa automaticamente.
- Historico operacional nao e perdido quando alguem e removido ou substituido.

## 18. Questoes em Aberto

1. A pagina deve ficar dentro de `/gestao-igreja` ou dentro de `/workspace-pastoral/cultos`?
2. O nome do produto deve ser `Central de Escalas`, `Controle do Culto`, `Gestao de Cultos` ou outro?
3. "Culto" e "evento" devem usar o mesmo modelo desde o MVP?
4. O convite por QR pode ser respondido por visitante anonimo ou exige login?
5. Interessado vindo por QR vira voluntario pendente, membro da equipe ou apenas submissao para aprovacao?
6. Quem pode criar templates: gestor, pastor, lider ou todos conforme escopo?
7. Lider pode convidar qualquer membro da igreja ou apenas membros do seu time?
8. Convite pendente reserva vaga por padrao?
9. Qual o prazo padrao de confirmacao?
10. Copiar pessoas de outro culto deve convidar automaticamente ou apenas sugerir?
11. Equipe global e equipe do culto devem ser entidades separadas ou uma relacao historica?
12. Como tratar voluntario sem conta no BibliaLM?
13. Como diferenciar check-in de membro no Culto+ e presenca operacional do voluntario?
14. Como sera feita a impressao/exportacao da escala?
15. Quais alertas devem ser criticos e quais apenas informativos?

## 19. Prioridade Recomendada

Ordem recomendada para nao criar complexidade cedo demais:

1. Central com lista de cultos e cards operacionais.
2. Ativacao de gestao operacional por culto.
3. Equipes, lideres, cargos e vagas.
4. Convite de usuario existente.
5. Aceite/recusa e contagem de vagas.
6. Link/QR especifico para cargo.
7. Replicar de outro culto.
8. Templates.
9. Recorrencia.
10. Lideranca por equipe.
11. Presenca e fechamento.
12. Inteligencia operacional.

## 20. Resumo Executivo

A pagina central deve virar o cockpit do gestor da igreja para cultos/eventos. O culto continua podendo existir sozinho, mas, quando a igreja quiser operar equipes e voluntarios, tudo nasce dele: equipes, lideres, cargos, vagas, convites, QR Codes, aceite, recusas, substituicoes e historico.

O maior ganho de produto e sair de fluxos soltos para uma pergunta unica e operacional: "este culto esta pronto para acontecer com as pessoas certas nos postos certos?"
