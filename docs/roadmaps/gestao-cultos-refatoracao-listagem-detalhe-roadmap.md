# Roadmap: Refatoracao da Gestao de Cultos

Status: proposta complementar
Data: 2026-07-02
Modulo alvo: `/gestao-igreja/cultos`
Relacionado: `docs/roadmaps/gestao-igreja-central-controle-cultos-roadmap.md`

## 1. Objetivo

Refatorar a pagina `/gestao-igreja/cultos` para transformar a central atual em uma experiencia operacional clara para gestores e lideres:

- listagem de cultos com indicadores no topo;
- card de culto compacto, escaneavel e acionavel;
- popups de equipes, QR Code e convite sem sair da listagem;
- pagina de detalhes do culto para gestao completa da escala;
- fluxo de aprovacao do lider/gestor antes de notificar voluntarios quando a igreja exigir aprovacao;
- aceite/recusa de voluntarios refletindo nos indicadores da escala.

Este roadmap complementa o roadmap maior da Central de Controle por Culto. Ele nao substitui o Culto+ publico. A Gestao de Cultos fica como camada operacional sobre cultos ja criados no Culto+.

## 2. Fontes usadas

- Anexo: Complemento do Requisito Funcional - Gestao de Cultos.
- Anexo: Pagina Detalhes do culto.
- Imagens de referencia enviadas no pedido.
- `_PROJECT_CONTEXT.md`.
- `_ARCHITECT_AGENT.md`.
- `docs/roadmaps/gestao-igreja-central-controle-cultos-roadmap.md`.
- `docs/roadmaps/gestao-igreja-independente-status.md`.
- Codigo atual:
  - `app/gestao-igreja/cultos/page.tsx`;
  - `components/church-management/ChurchCultoIntegrationPreview.tsx`;
  - `services/churchManagementService.ts`;
  - `services/cultoPlusService.ts`;
  - `types.ts`.

## 3. Estado atual observado

Fatos observados no repositorio:

- A rota `/gestao-igreja/cultos` renderiza `ChurchCultoIntegrationPreview`.
- A tela atual ja lista cultos do Culto+ via `churchManagementService.getCultoOperationalItems`.
- O service ja cruza dados de `church_services`, `service_schedule_assignments` e `church_assignments`.
- Existe fluxo inicial de selecionar times para culto, solicitar aprovacao da equipe e criar convites/designacoes individuais apos aprovacao.
- Existe link para pagina publica do culto em `/culto/{slug}`.
- Nao existe rota dedicada de detalhe operacional em `app/gestao-igreja/cultos/[id]`.
- Popups atuais existem, mas ainda nao cobrem RF-024, RF-025, RF-026 e RF-027 de forma completa.
- A listagem atual e funcional, mas visualmente ainda esta mais proxima de uma central expandida do que do layout solicitado nos anexos.

Inferencia tecnica:

- A primeira entrega pode ser majoritariamente frontend + agregacao de dados.
- Convites abertos, vagas por funcao, validade de QR e historico operacional exigirao extensao de modelo de dados ou formalizacao sobre `church_assignments`.

## 4. Principios de produto

- A listagem deve responder rapido: quais cultos precisam de atencao?
- O card deve mostrar o essencial sem exigir expansao.
- Acoes frequentes devem estar no card: QR Code, convidar voluntarios, ver detalhes.
- Popups preservam pesquisa, filtros e scroll da listagem.
- A pagina de detalhe concentra gestao completa e progressiva.
- Lider gerencia somente seu escopo.
- Gestor ve consolidado da igreja.
- Voluntario ve somente seus proprios convites/designacoes.
- Dados pastorais sensiveis nao entram na gestao operacional por padrao.
- Todo fluxo relevante deve gerar notificacao e historico.

## 5. Escopo

### Dentro do escopo

- Redesign da listagem `/gestao-igreja/cultos`.
- Cards de metricas no topo.
- Filtros de busca, periodo e status.
- Card de culto conforme imagem de referencia.
- Popup `Equipes do culto`.
- Popup `QR Code do culto`.
- Popup `Convidar voluntarios`.
- Convite compartilhavel por link/QR.
- Rota de detalhe operacional do culto.
- Abas do detalhe: Equipes, Voluntarios, Vagas e funcoes, Convites, Informacoes, Historico.
- Alertas operacionais e proxima acao recomendada.
- Ajustes em `services/` para agregacoes e acoes.
- Testes de service, regras e navegacao essencial.

### Fora do escopo deste roadmap

- Reescrever o modulo publico do Culto+.
- Criar automacao de escala sem revisao humana.
- Integracao WhatsApp real.
- Ranking publico individual de voluntarios.
- Relatorios avancados.
- Multi-campus.

## 6. Experiencia alvo: listagem

### Cabecalho

Deve apresentar:

- breadcrumb ou etiqueta `Gestao da Igreja`;
- titulo `Gestao de Cultos`;
- subtitulo curto: `Escalas, equipes e confirmacoes em um so lugar.`;
- sino/notificacoes do shell quando aplicavel;
- botao primario `Novo Culto`.

### Indicadores do topo

Cards recomendados:

- `Cultos no periodo`: total de cultos filtrados.
- `Equipes`: total de equipes ativas/designadas.
- `Confirmados`: confirmados sobre convidados, com percentual.
- `Pendentes`: convites aguardando resposta.

Regras:

- indicadores devem respeitar filtros ativos;
- cards devem ter icone, numero e texto auxiliar;
- percentuais nao devem depender apenas de cor.

### Filtros

Controles recomendados:

- busca por nome, tema ou local;
- periodo: proximos cultos, proximos 7 dias, proximos 30 dias, personalizados;
- status operacional: todos, sem escala, aguardando, completo, com alerta;
- filtros devem permanecer apos abrir e fechar popups.

### Card de culto

Cada culto deve apresentar:

- imagem/banner quando existir, fallback visual quando nao existir;
- nome do culto;
- tema/descricao resumida;
- tipo do culto;
- visibilidade/status publico;
- data e horario;
- local;
- quantidade de equipes;
- progresso de confirmacoes;
- status da escala;
- acoes: QR Code, Convidar voluntarios, Ver detalhes.

Regras:

- clicar em quantidade de equipes abre `Equipes do culto`;
- `Ver detalhes` navega para a pagina de detalhe operacional;
- `QR Code` abre popup, nao navega;
- `Convidar voluntarios` abre popup, nao navega;
- card deve funcionar em mobile com acoes empilhadas.

### Bloco de ajuda

Manter um bloco discreto:

`Como funciona a escala? Lideres recebem notificacao para aprovar a equipe. Apos aprovacao, os voluntarios convidados confirmam ou recusam o convite.`

## 7. Experiencia alvo: popup Equipes do culto

Rota permanece na listagem. O popup deve abrir sobre a pagina atual.

### Cabecalho

Apresentar:

- titulo `Equipes do culto`;
- nome do culto;
- data e horario;
- quantidade de equipes;
- total de escalados;
- confirmados;
- pendentes.

### Conteudo por equipe

Para cada equipe:

- nome;
- icone/identificacao visual;
- lider;
- status da aprovacao do lider;
- vagas;
- escalados;
- confirmados;
- integrantes.

### Conteudo por integrante

Para cada integrante:

- foto ou iniciais;
- nome;
- funcao/cargo;
- status do convite;
- indicador de lider quando aplicavel.

Estados visuais:

- Lider;
- Convite nao enviado;
- Aguardando confirmacao;
- Confirmado;
- Recusado;
- Indisponivel;
- Substituido.

### Acoes

Conforme permissao:

- visualizar integrante;
- adicionar membro;
- substituir membro;
- reenviar convite;
- remover da escala;
- gerenciar equipe;
- acessar escala completa;
- fechar.

Regras:

- primeira equipe abre expandida por padrao;
- equipe sem integrantes mostra `Nenhum membro escalado nesta equipe`;
- `Gerenciar equipe` leva ao detalhe operacional do culto com a equipe focada;
- fechamento por X, Fechar, Esc e clique fora quando nao houver alteracoes pendentes.

## 8. Experiencia alvo: popup QR Code do culto

O popup deve explicar claramente para onde o QR aponta.

### Dados exibidos

- nome do culto;
- data e horario;
- local;
- QR Code;
- link correspondente;
- finalidade do QR;
- orientacoes resumidas.

Finalidades possiveis:

- pagina publica do culto;
- convite para voluntarios;
- check-in do culto.

### Acoes

- copiar link;
- compartilhar;
- baixar QR Code;
- imprimir;
- abrir pagina vinculada;
- fechar.

Regras:

- nunca mostrar QR Code sem finalidade;
- QR de convite aberto deve mostrar equipe, funcao, validade e vagas;
- QR expirado, pausado ou sem vagas nao deve aceitar novas respostas.

## 9. Experiencia alvo: popup Convidar voluntarios

Fluxo em etapas.

### Etapa 1 - Selecionar equipe

Campos:

- equipe;
- funcao/cargo;
- quantidade de vagas;
- lider responsavel quando aplicavel.

### Etapa 2 - Selecionar voluntarios

Recursos:

- pesquisar por nome;
- filtrar por equipe;
- filtrar por funcao;
- filtrar por disponibilidade;
- selecionar um ou varios voluntarios;
- visualizar conflito de horario;
- visualizar se ja esta escalado no culto.

### Etapa 3 - Configurar convite

Campos:

- mensagem adicional;
- prazo para resposta;
- horario de apresentacao;
- observacoes da equipe;
- canal de notificacao disponivel.

### Etapa 4 - Revisar e enviar

Resumo:

- culto;
- equipe;
- funcao;
- voluntarios selecionados;
- data e horario;
- prazo para resposta.

Acao final: `Enviar convites`.

### Convite compartilhavel

No mesmo popup, permitir:

- convite individual;
- convite aberto;
- link;
- QR Code;
- compartilhamento externo.

Regras:

- convite individual somente o usuario convidado responde;
- convite aberto aceita interessados enquanto houver vagas;
- modalidade deve estar visivel antes de gerar link/QR.

## 10. Experiencia alvo: pagina de detalhes

Criar rota recomendada:

`/gestao-igreja/cultos/[serviceId]`

Opcionalmente aceitar query:

- `?teamId=...`;
- `?tab=equipes`;
- `?from=/gestao-igreja/cultos?...`.

### Cabecalho compacto

Deve apresentar:

- voltar para Gestao de Cultos;
- nome do culto;
- data, horario e local;
- status da escala;
- percentual de confirmacao;
- QR Code;
- Convidar voluntarios;
- Editar escala;
- menu de acoes adicionais.

### Resumo operacional

Cards:

- Equipes;
- Escalados;
- Confirmados;
- Pendentes.

Barra:

- `66% da escala confirmada`;
- `8 de 12 confirmados`.

### Alertas e pendencias

Exemplos:

- voluntarios ainda nao responderam;
- equipe sem lider;
- vaga ainda nao preenchida;
- participante recusou convite;
- prazo termina amanha.

Cada alerta deve ter acao direta:

- Reenviar;
- Escolher lider;
- Preencher vaga;
- Substituir.

### Abas

1. Equipes.
2. Voluntarios.
3. Vagas e funcoes.
4. Convites.
5. Informacoes.
6. Historico.

### Lateral direita

Conforme imagem:

- proxima acao recomendada;
- resumo do culto;
- detalhes rapidos.

No mobile, a lateral deve virar secao abaixo do conteudo principal.

## 11. Abas do detalhe

### Aba Equipes

Cards expansivos por equipe:

- nome;
- lider;
- status da aprovacao;
- confirmacoes;
- membros;
- funcao;
- status;
- acoes.

Acoes:

- adicionar membro;
- reenviar convites;
- gerenciar equipe;
- alterar lider;
- editar funcoes;
- substituir;
- remover equipe.

### Aba Voluntarios

Tabela/lista consolidada:

- nome;
- equipe;
- funcao;
- lider responsavel;
- status;
- data da resposta.

Filtros:

- equipe;
- funcao;
- status;
- pendentes;
- recusados.

### Aba Vagas e funcoes

Mostrar:

- equipe;
- funcao;
- necessario;
- confirmado;
- situacao.

Acoes:

- preencher vaga;
- convidar voluntarios;
- alterar quantidade;
- marcar funcao obrigatoria/opcional.

### Aba Convites

Mostrar:

- enviados;
- confirmados;
- pendentes;
- recusados;
- expirados;
- voluntario;
- equipe;
- enviado em;
- prazo;
- status.

Acoes:

- reenviar;
- cancelar;
- substituir;
- alterar prazo;
- lembrete coletivo.

### Aba Informacoes

Dados vindos do Culto+:

- nome;
- tema;
- descricao;
- tipo;
- data;
- horario;
- local;
- endereco;
- horario de apresentacao;
- responsavel;
- observacoes operacionais.

Regra:

- dados principais do culto continuam editados no Culto+;
- dados de escala podem ser editados na Gestao da Igreja.

### Aba Historico

Eventos:

- equipe adicionada;
- lider definido;
- convite enviado;
- convite aceito/recusado;
- substituicao;
- remocao;
- alteracao de data;
- cancelamento.

Cada registro:

- acao;
- usuario responsavel;
- data;
- hora.

## 12. Arquitetura recomendada

### Componentizacao

Criar componentes menores:

- `ChurchCultosPageShell`;
- `ChurchCultosSummaryCards`;
- `ChurchCultosFilters`;
- `ChurchCultoCard`;
- `ChurchCultoTeamsModal`;
- `ChurchCultoQrModal`;
- `ChurchCultoInviteModal`;
- `ChurchCultoDetailPage`;
- `ChurchCultoDetailHeader`;
- `ChurchCultoDetailTabs`;
- `ChurchCultoAlertsPanel`;
- `ChurchCultoRecommendedAction`;

Motivo:

- o componente atual tende a concentrar listagem, filtros, modais, busca de usuarios e acoes;
- separar reduz risco de regressao e facilita testes.

### Services

Toda regra de dados deve ficar em `services/`.

Novas APIs recomendadas em `churchManagementService`:

- `getCultosDashboard(churchId, filters)`;
- `getCultoOperationalDetail(churchId, serviceId)`;
- `getCultoTeams(serviceId)`;
- `getCultoQrContext(serviceId, purpose)`;
- `createCultoInviteBatch(input)`;
- `createOpenCultoInvite(input)`;
- `resendCultoInvite(inviteId)`;
- `cancelCultoInvite(inviteId)`;
- `getCultoOperationalHistory(serviceId)`.

Manter `cultoPlusService` como dono dos dados principais do culto.

### Tipos

Adicionar em `types.ts` somente tipos globais e compartilhados:

- `ChurchCultoOperationalStatus`;
- `ChurchCultoTeamStatus`;
- `ChurchCultoInviteStatus`;
- `ChurchCultoQrPurpose`;
- `ChurchCultoOperationalDetail`;
- `ChurchCultoTeamSummary`;
- `ChurchCultoVolunteerRow`;
- `ChurchCultoSlotSummary`;
- `ChurchCultoHistoryEvent`.

## 13. Modelo de dados

### Pode usar no MVP

- `church_services`: origem do culto.
- `service_schedule_assignments`: escala por culto/ministry/usuario.
- `service_ministries`: equipe/ministry do Culto+.
- `church_service_teams`: times globais da Gestao.
- `church_assignments`: designacoes/convites individuais.
- `church_management_notifications`: notificacoes operacionais.
- `church_notification_events`: eventos estruturados.

### Lacunas para fases avancadas

Para cumprir todo o requisito, avaliar novas tabelas ou extensoes:

- `church_service_slots`: vagas por culto, equipe e funcao.
- `church_service_invites`: convite individual ou aberto.
- `church_service_invite_links`: link/QR, finalidade, validade, limite de usos.
- `church_service_operation_events`: historico operacional do culto.
- `church_service_availability`: disponibilidade declarada do voluntario.

Decisao recomendada:

- Fase 1 usa agregacao sobre tabelas existentes;
- Fase 2 formaliza slots/convites abertos antes de implementar QR com vagas e validade.

## 14. Regras de negocio consolidadas

- Somente equipes vinculadas ao culto aparecem no popup.
- Equipe sem integrantes mostra estado vazio e acao de adicionar membros.
- Lider so ocupa vaga se tambem estiver escalado em funcao operacional.
- Nao enviar convite ativo duplicado para mesma pessoa, culto, equipe e funcao.
- Conflito de horario deve alertar antes do envio.
- Convites podem depender de aprovacao obrigatoria do lider.
- Convite aberto nao aceita confirmacao quando vagas acabarem.
- QR/link precisa respeitar validade, culto ativo, convite ativo e vagas.
- Cancelamento do culto cancela convites e desativa links.
- Confirmacao/recusa atualiza listagem, detalhe e popup.
- Alteracoes relevantes geram notificacao e historico.

## 15. Permissoes e RLS

Perfis:

- Gestor: visao global da igreja e acoes administrativas.
- Pastor: acesso conforme papel operacional e cuidado pastoral, sem virar gestor automaticamente.
- Lider: gerencia equipes sob seu escopo.
- Voluntario: ve e responde somente suas designacoes.

Regras tecnicas:

- nao usar `user_metadata` para autorizacao;
- RLS deve combinar usuario, igreja e escopo;
- update precisa de select policy correspondente;
- policies devem evitar `TO authenticated` sem predicado de propriedade/escopo;
- funcoes `security definer`, se necessarias, devem ser minimizadas e auditadas.

## 16. Roadmap por fases

### Fase 0 - Validacao funcional e UX

Entregas:

- consolidar anexos neste roadmap;
- definir rota do detalhe;
- validar estados oficiais de convite/escala;
- decidir se detalhe usa `serviceId` ou `slug`;
- mapear dados que ja existem vs dados novos;
- definir responsividade desktop/mobile.

Aceite:

- produto e engenharia concordam no fluxo listagem -> popups -> detalhe;
- nenhum requisito exige migracao oculta sem plano.

### Fase 1 - Refatoracao visual da listagem

Entregas:

- novo layout da pagina conforme imagem;
- cards de indicadores do topo;
- filtros de busca, periodo e status;
- card de culto compacto;
- acoes no card: QR Code, Convidar voluntarios, Ver detalhes;
- botao de equipes abrindo popup futuro ou modal basico;
- preservar rota `/gestao-igreja/cultos`.

Aceite:

- gestor ve rapidamente cultos, equipes, confirmados e pendentes;
- acoes principais estao visiveis sem expandir o card;
- mobile nao quebra texto nem sobrepoe acoes.

### Fase 2 - Popups da listagem

Entregas:

- popup `Equipes do culto`;
- popup `QR Code do culto`;
- popup `Convidar voluntarios` em versao guiada;
- fechamento acessivel;
- foco preso no modal;
- preservacao de filtros/scroll;
- estados vazios e loading.

Aceite:

- clicar em `4 equipes` abre times e membros;
- QR informa finalidade;
- convidar voluntarios gera convites sem duplicidade;
- popup fecha por X, botao, Esc e clique fora quando seguro.

### Fase 3 - Pagina de detalhe operacional

Entregas:

- rota `/gestao-igreja/cultos/[serviceId]`;
- header compacto;
- resumo operacional;
- alertas e acoes diretas;
- abas Equipes, Voluntarios, Vagas, Convites, Informacoes, Historico;
- lateral de proxima acao, resumo e detalhes rapidos;
- link de volta preservando filtros quando possivel.

Aceite:

- `Ver detalhes` abre a pagina do culto;
- a aba Equipes reproduz a experiencia do anexo;
- alertas aparecem no topo quando houver pendencia;
- dados do Culto+ aparecem sem duplicar edicao principal.

### Fase 4 - Convites, vagas e QR compartilhavel

Entregas:

- modelo formal de vagas por funcao;
- convite individual;
- convite aberto;
- validade de convite;
- QR por finalidade;
- bloqueio por vagas esgotadas;
- conflito de horario;
- reenvio/cancelamento de convite.

Aceite:

- convite duplicado e bloqueado;
- voluntario ja escalado aparece com alerta;
- QR de convite aberto mostra validade e vagas;
- confirmacao preenche vaga.

### Fase 5 - Historico, auditoria e atualizacao em tempo real

Entregas:

- historico operacional;
- eventos para alteracoes relevantes;
- atualizacao dos indicadores apos aceite/recusa;
- invalidacao/refetch controlado;
- preparacao para realtime quando viavel.

Aceite:

- detalhe mostra quem fez o que e quando;
- listagem reflete confirmacoes sem recarregar toda a app;
- notificacoes nao bloqueiam fluxo principal.

### Fase 6 - Otimizacao e escala

Entregas:

- queries paginadas/range;
- agregacoes economicas para topo e cards;
- evitar carregar membros de todos os cultos no primeiro paint;
- skeletons;
- testes Playwright em desktop/mobile;
- revisao de acessibilidade.

Aceite:

- pagina permanece rapida com dezenas de cultos;
- popups carregam detalhes sob demanda;
- keyboard navigation funciona.

## 17. Plano tecnico por arquivos

Arquivos provaveis:

- `components/church-management/ChurchCultoIntegrationPreview.tsx`: reduzir responsabilidade ou substituir por shell.
- `components/church-management/ChurchCultos*.tsx`: novos componentes de listagem/modal/detalhe.
- `app/gestao-igreja/cultos/[serviceId]/page.tsx`: nova rota de detalhe.
- `services/churchManagementService.ts`: agregacoes, convites, historico.
- `services/cultoPlusService.ts`: somente consultas/dados do culto quando necessario.
- `types.ts`: tipos compartilhados.
- `utils/churchManagementRules.ts`: regras puras de status, duplicidade, disponibilidade.
- `scripts/create_church_management.sql`: novas tabelas/indices/RLS quando fases 4+ exigirem.
- `tests/churchManagement.test.ts`: services e regras.
- `tests/features.spec.ts` ou nova spec Playwright: fluxo visual essencial.

## 18. Testes e validacao

### Unitarios/regras

- status operacional por culto;
- contagem de confirmados/pendentes/recusados;
- bloqueio de convite duplicado;
- vagas abertas;
- QR expirado/ativo;
- conflito de horario.

### Services

- agregacao da listagem;
- detalhe por culto;
- criar convite individual;
- criar convite aberto;
- reenviar convite;
- aceitar/recusar;
- historico.

### Playwright

- abrir `/gestao-igreja/cultos`;
- buscar culto;
- abrir popup de equipes;
- abrir popup QR Code;
- abrir popup convite;
- navegar em Ver detalhes;
- alternar abas;
- validar mobile 390px e desktop 1440px.

## 19. Riscos e mitigacoes

| Risco | Mitigacao |
| --- | --- |
| Duplicar regra entre Culto+ e Gestao | Culto+ mantem dados do culto; Gestao mantem operacao. |
| Componente grande demais | Quebrar em shell, cards, filtros, modais e detalhe. |
| Consultas pesadas | Listagem carrega agregados; detalhes sob demanda. |
| QR sem finalidade clara | Tipo/finalidade obrigatorios no popup. |
| Convite duplicado | Indice/regra por culto/equipe/funcao/usuario/status ativo. |
| Lider vendo dados fora do escopo | RLS por igreja + role + scope. |
| Estados divergentes entre assignment e schedule | Definir origem canonica por fase e sincronizacao idempotente. |
| Redesign quebrar mobile | Validar com Playwright e screenshots. |

## 20. Questoes em aberto

1. `Ver detalhes` deve usar `serviceId` ou `slug` na URL?
2. O QR Code inicial deve apontar para pagina publica, check-in ou seletor de finalidade?
3. Convite aberto exige login para aceitar?
4. Convite pendente reserva vaga por padrao?
5. Quem pode enviar direto sem aprovacao do lider?
6. Qual prazo padrao de resposta?
7. O detalhe deve permitir editar dados do Culto+ ou apenas abrir link para Culto+?
8. Vagas/funcoes entram no MVP ou apenas na fase de convite avancado?
9. O historico operacional deve ser tabela propria ou eventos de notificacao enriquecidos?
10. A atualizacao em tempo real sera Supabase Realtime ou refetch apos acoes no MVP?

## 21. Ordem recomendada de execucao

1. Criar componentes visuais da listagem sem alterar modelo de dados.
2. Implementar agregacao economica para indicadores.
3. Criar rota de detalhe e navegar via `Ver detalhes`.
4. Implementar popup de equipes completo.
5. Implementar popup QR Code com finalidade clara.
6. Evoluir popup de convite individual.
7. Formalizar vagas/funcoes.
8. Implementar convite aberto e QR compartilhavel.
9. Implementar historico operacional.
10. Adicionar testes Playwright e revisar acessibilidade.

## 22. Definicao de pronto do roadmap

O roadmap sera considerado entregue quando:

- a listagem corresponder ao desenho funcional dos anexos;
- o card de culto mostrar informacoes e acoes pedidas;
- `Ver detalhes` abrir uma pagina operacional completa;
- popups principais funcionarem sem sair da listagem;
- convites atualizarem indicadores;
- regras de duplicidade, vaga, permissao e QR estiverem cobertas;
- testes locais cobrirem services/regras e fluxo visual principal;
- RLS estiver validado para gestor, lider e voluntario.

