# Roadmap - Gestao da Igreja: Pessoas, Equipes, Cultos e Escalas

Documento criado a partir do roadmap anexo, das referencias visuais de Pessoas e Equipes, e da arquitetura atual do BibliaLM.

## Objetivo

Evoluir a Gestao da Igreja para um modulo operacional integrado, onde o gestor consegue:

- manter equipes permanentes, lideres, membros, funcoes e capacidade;
- consultar um diretorio de membros com vinculos, papeis, proxima escala, historico e pendencias;
- conectar cultos do Culto+ ao fluxo de escala;
- enviar escalas para aprovacao de lideres;
- notificar voluntarios e exigir aceite individual por culto ou evento;
- detectar conflitos, substituir pessoas e registrar participacao ou falta.

## Leitura das imagens

### Pessoas

A tela alvo e um diretorio operacional, nao uma simples tabela de perfis. O primeiro viewport precisa mostrar:

- menu lateral da Gestao da Igreja;
- cabecalho escuro com titulo, descricao e cards de indicadores;
- filtros densos por busca, equipe, papel, status e escopo "somente membros da igreja";
- tabela principal com membro, papel, equipes, proxima escala, participacao, status e acoes;
- painel lateral persistente do membro selecionado com dados, papeis, equipes, proximas escalas, log e acoes rapidas.

### Equipes

A tela alvo e a pagina estrutural das equipes. O primeiro viewport precisa mostrar:

- menu lateral consistente com Gestao da Igreja;
- cabecalho claro, titulo "Equipes", subtitulo e botao "Nova Equipe";
- cards de indicadores: equipes ativas, lideres designados, voluntarios, vagas abertas;
- barra de busca e filtros por area/status;
- lista objetiva por equipe com icone, descricao, area, lider, voluntarios, vagas, status e acoes.

## Principios arquiteturais

1. Componentes devem tratar apresentacao e estado local. Banco, agregacoes e regras ficam em `services/`.
2. `types.ts` segue como fonte de verdade para interfaces globais.
3. Todo dado operacional deve ser filtrado por `churchId`.
4. Vinculo permanente com equipe nao e o mesmo que escala para um culto.
5. Capacidade permanente da equipe nao e a mesma necessidade por culto.
6. Todo convite de escala precisa ter aceite proprio, mesmo que o membro ja pertenca ao time.
7. Toda tabela exposta no Supabase deve ter RLS habilitado, grants explicitos quando necessario e indices para colunas usadas em politicas.
8. Listagens de Pessoas e Equipes devem evitar N+1: carregar agregados por lote ou via views/RPCs seguras.

## Estado atual no codigo

Rotas e componentes que serao impactados:

- `app/gestao-igreja/pessoas/page.tsx` usa `components/church-management/ChurchPeoplePreview.tsx`.
- `app/gestao-igreja/equipes/page.tsx` usa `components/church-management/ChurchOperationalPhasePreview.tsx` com `phase="equipes"`.
- `app/gestao-igreja/cultos/page.tsx` usa `components/church-management/ChurchCultosDashboard.tsx`.
- `app/gestao-igreja/cultos/[serviceId]/page.tsx` usa `components/church-management/ChurchCultoDetailPage.tsx`.
- `services/churchManagementService.ts` ja concentra boa parte das operacoes de equipes, roles, designacoes, notificacoes e itens operacionais de culto.
- `services/cultoPlusService.ts` continua sendo a ponte com cultos criados no Culto+.

## Modelo de dominio recomendado

### Entidades principais

- `church_service_teams`: equipe permanente.
- `church_team_members`: vinculo permanente pessoa/equipe, com funcao, status e datas.
- `church_team_functions`: funcoes esperadas dentro de uma equipe.
- `church_member_roles`: papeis e permissoes operacionais, separado de participacao em equipe.
- `church_service_scale_requests`: pedido de escala de um ou mais times para culto/evento.
- `church_service_scale_slots`: vagas por funcao dentro de uma escala especifica.
- `church_service_invites`: convite individual para o voluntario aceitar ou recusar.
- `church_participation_logs`: presenca, falta, substituicao e justificativas.
- `church_assignment_history`: auditoria operacional legivel para gestor.

### Compatibilidade com o que ja existe

O MVP pode continuar usando:

- `church_service_teams` para times;
- `church_assignments` para algumas designacoes e aprovacoes;
- `service_schedule_assignments` para participantes escalados no Culto+.

Mas o roadmap deve preparar a transicao para tabelas explicitas de escala/convite/historico. Isso evita sobrecarregar `church_assignments` com conceitos diferentes.

## Regras de dados e Supabase

### RLS

- Habilitar RLS em todas as novas tabelas.
- Usar policies com `to authenticated` e predicado real de autorizacao por igreja.
- Evitar autorizacao baseada em `user_metadata`.
- Em policies, usar `(select auth.uid())` para evitar chamada por linha quando aplicavel.
- Policies de `update` precisam de `using` e `with check`.
- Views operacionais devem usar `security_invoker = true` quando expostas.

### Grants

Como a mudanca de Supabase em 2026 remove exposicao automatica de novas tabelas em alguns projetos, migrations devem declarar grants explicitamente para `authenticated` quando a Data API precisar acessar a tabela.

### Indices minimos

Criar indices para:

- `church_id`;
- `team_id`;
- `member_user_id`;
- `service_id`;
- `status`;
- combinacoes usadas por listagens, como `(church_id, status, created_at)` e `(church_id, team_id, status)`;
- FKs, pois Postgres nao cria indices de FK automaticamente.

### Listagens

- Pessoas: usar cursor pagination por `(display_name, user_id)` ou `(created_at, id)`.
- Equipes: carregar contadores por lote, nao uma query por equipe.
- Cultos: carregar schedules, invites e teams por lote por `service_id`.

## Roadmap de execucao

### Sprint 0 - Preparacao tecnica e design contract

Objetivo: travar o contrato visual e tecnico antes de refatorar telas grandes.

Arquitetura:

- mapear tabelas existentes e lacunas;
- definir tipos em `types.ts` para membros, vinculos, funcoes, escala, convite e participacao;
- criar plano de migracao incremental, sem quebrar telas atuais;
- definir camada de agregacao em `churchManagementService`.

Frontend:

- definir layout padrao de Gestao da Igreja: sidebar, header, metric cards, toolbar, table/list, side panel;
- criar componentes compartilhados: `ChurchMetricCard`, `ChurchFilterBar`, `ChurchStatusBadge`, `ChurchActionButton`, `ChurchSidePanel`, `ChurchDataTable`;
- garantir responsivo: tabela vira cards no mobile e painel lateral vira drawer.

Aceite:

- documento de contrato de UI e dados aprovado;
- nenhum componente novo acessa Supabase diretamente.

### Sprint 1 - Fundacao de dados e servicos

Objetivo: criar a base que Pessoas, Equipes e Cultos vao compartilhar.

Arquitetura:

- criar ou ajustar migrations para vinculo pessoa/equipe, funcoes, convites e participacao;
- criar RLS e grants explicitos;
- adicionar indices de FK e indices compostos;
- implementar metodos no `churchManagementService`:
  - `listChurchMembersDirectory`;
  - `getChurchMemberOperationalProfile`;
  - `listTeamDirectory`;
  - `getTeamOperationalDetail`;
  - `listServiceScaleOverview`.

Frontend:

- adicionar estados padrao de loading, empty, error e skeleton;
- padronizar badges de status: disponivel, pendente, conflito, indisponivel, ativo, pausado.

Aceite:

- testes de service cobrindo fallback quando schema nao existe;
- queries principais sem N+1;
- RLS validada para usuario de outra igreja nao enxergar dados.

### Sprint 2 - Refatoracao da pagina Equipes

Objetivo: aproximar `/gestao-igreja/equipes` da imagem alvo.

Arquitetura:

- trocar dados mockados/agregados manuais por `listTeamDirectory`;
- incluir contadores por equipe: voluntarios, lideres, vagas abertas;
- separar lider principal de lideres auxiliares;
- expor acoes sem misturar edicao estrutural com escala de culto.

Frontend:

- implementar header claro com botao "Nova Equipe";
- cards de indicadores;
- toolbar com busca, filtro por area, filtro por status e alternancia de visualizacao;
- tabela/lista com colunas: equipe, area, lider, voluntarios, vagas, status, acoes;
- icones por area usando biblioteca existente;
- manter cards com raio maximo de 8px.

Aceite:

- gestor ve quantidade real de membros e vagas por equipe;
- filtro por area/status nao recarrega a pagina;
- mobile exibe cards legiveis, sem texto estourado.

### Sprint 3 - Detalhe de equipe e funcoes

Objetivo: permitir administracao completa de cada time.

Arquitetura:

- `getTeamOperationalDetail(teamId)` deve retornar equipe, lideres, membros, funcoes, vagas e historico;
- criar metodos de mutacao:
  - adicionar/remover membro;
  - alterar funcao;
  - trocar lider;
  - mover entre equipes;
  - abrir vaga;
  - gerar convite/QR de voluntariado.

Frontend:

- criar tela `/gestao-igreja/equipes/[id]` com abas:
  - Visao geral;
  - Membros;
  - Funcoes e vagas;
  - Convites;
  - Historico;
- drawer/modal para adicionar membro e editar funcao;
- botoes de acao com icones e labels acessiveis.

Aceite:

- capacidade permanente e necessidade por culto aparecem como conceitos separados;
- historico registra alteracoes relevantes;
- foco e teclado funcionam em modais/drawers.

### Sprint 4 - Diretorio de Pessoas

Objetivo: transformar `/gestao-igreja/pessoas` no diretorio operacional da imagem.

Arquitetura:

- `listChurchMembersDirectory` deve retornar pagina de membros com:
  - papeis;
  - equipes vinculadas;
  - proxima escala;
  - total de participacoes;
  - faltas;
  - disponibilidade;
  - pendencias;
  - conflito.
- `getChurchMemberOperationalProfile` deve alimentar o painel lateral.

Frontend:

- implementar header escuro com metric cards;
- toolbar com busca, filtros por equipe/papel/status e toggle de membros da igreja;
- tabela com linhas selecionaveis;
- painel lateral persistente no desktop e drawer no mobile;
- acoes rapidas: editar papel, mover de equipe, escalar para culto/evento.

Aceite:

- selecionar membro atualiza painel sem navegar;
- listagem mostra apenas membros da igreja ativa;
- filtros combinados preservam performance e acessibilidade;
- pendencias de aceite aparecem claramente.

### Sprint 5 - Cultos e criacao de escala

Objetivo: conectar o diretorio estrutural aos cultos do Culto+.

Arquitetura:

- consolidar `ChurchCultosDashboard` e `ChurchCultoDetailPage` com os novos servicos de escala;
- criar fluxo `createServiceScaleRequest`;
- permitir selecionar culto, equipes, vagas por funcao, lider responsavel e membros sugeridos;
- gerar escala em status `aguardando_aprovacao_lider`.

Frontend:

- manter listagem de cultos em formato operacional ja iniciado;
- adicionar wizard/drawer de "Escalar culto";
- na selecao de equipes, exibir quantidade de participantes e capacidade;
- tela de detalhe do culto deve mostrar equipes, voluntarios, vagas/funcoes, convites, alertas e historico.

Aceite:

- ao escalar time, lider da equipe recebe notificacao;
- se nao houver lider, gestor responsavel recebe a aprovacao;
- escala ainda nao aprovada nao dispara convite final aos voluntarios.

### Sprint 6 - Aprovacao, convites e conflitos

Objetivo: fechar o fluxo lider -> voluntario -> gestor.

Arquitetura:

- implementar estados da escala:
  - rascunho;
  - aguardando_aprovacao_lider;
  - aguardando_aceite_voluntarios;
  - parcialmente_confirmada;
  - completa;
  - cancelada;
  - concluida.
- implementar estados do convite:
  - nao_enviado;
  - pendente;
  - confirmado;
  - recusado;
  - expirado;
  - cancelado;
  - conflito.
- detectar conflito por horario, duplicidade, membro inativo, limite de vagas e funcao incompatvel.

Frontend:

- tela de aprovacao do lider com resumo da equipe, membros e funcoes;
- experiencia do voluntario para aceitar/recusar escala;
- alertas acionaveis no detalhe do culto;
- acoes de reenviar, substituir, cancelar convite e alterar funcao.

Aceite:

- cada convite de culto exige aceite proprio;
- recusas exigem caminho claro de substituicao;
- conflitos aparecem antes do envio final.

### Sprint 7 - QR Codes, presenca, historico e indicadores

Objetivo: fechar o ciclo pos-evento e alimentar indicadores.

Arquitetura:

- QR por equipe e QR por culto com token, validade e status;
- registro de presenca/falta/substituicao;
- historico operacional por membro e por equipe;
- agregados de indicadores:
  - taxa de aceite;
  - taxa de recusa;
  - vagas nao preenchidas;
  - equipes com deficit;
  - faltas;
  - tempo medio de resposta.

Frontend:

- telas de QR com copiar link, baixar, imprimir e abrir pagina publica;
- acao pos-culto para registrar participacao;
- dashboards de indicadores com filtros por periodo/equipe/culto.

Aceite:

- gestor consegue auditar quem aceitou, recusou, faltou e substituiu;
- historico do membro mostra cultos, funcoes, equipes e faltas;
- indicadores nao dependem de contagem manual na UI.

## Menu recomendado

Gestao da Igreja:

- Dashboard;
- Pessoas;
- Equipes;
- Cargos e Funcoes;
- Cultos e Eventos;
- Escalas e Convites;
- QR Codes;
- Inbox;
- Notificacoes;
- Indicadores;
- Configuracoes.

Permissoes deixam de ser uma area operacional isolada. Atribuicao de papeis acontece em Pessoas. Configuracao do que cada papel pode fazer fica em Configuracoes > Papeis e Permissoes.

## MVP recomendado

Ordem de entrega mais segura:

1. Fundacao de dados e services.
2. Equipes listagem.
3. Detalhe de equipe e vinculo de membros.
4. Pessoas diretorio e painel lateral.
5. Cultos: escalar equipe para culto.
6. Aprovacao do lider.
7. Aceite/recusa do voluntario.
8. Conflitos basicos e substituicao.
9. Historico de participacao.

Fora do MVP:

- recomendacao automatica de voluntarios;
- ranking de disponibilidade;
- rodizio automatico;
- escala recorrente;
- WhatsApp;
- check-in automatico;
- previsao de deficit.

## Plano de componentes frontend

Componentes compartilhados sugeridos:

- `ChurchManagementShell`;
- `ChurchPageHeader`;
- `ChurchMetricCard`;
- `ChurchFilterBar`;
- `ChurchDataTable`;
- `ChurchMemberSidePanel`;
- `ChurchTeamRow`;
- `ChurchTeamDetailTabs`;
- `ChurchStatusBadge`;
- `ChurchActionMenu`;
- `ChurchInviteDrawer`;
- `ChurchScaleWizard`;
- `ChurchQrActions`.

Padroes obrigatorios:

- botoes com icones lucide quando houver icone claro;
- targets de toque com minimo de 44px;
- foco visivel;
- modais/drawers com foco inicial e retorno de foco;
- tabela responsiva convertendo para cards em mobile;
- cards com raio de 8px ou menos;
- textos sem overflow em 320px.

## Plano de testes

### Services

- `churchManagementService.listTeamDirectory`;
- `churchManagementService.getTeamOperationalDetail`;
- `churchManagementService.listChurchMembersDirectory`;
- `churchManagementService.getChurchMemberOperationalProfile`;
- `churchManagementService.createServiceScaleRequest`;
- fluxo de aprovacao e aceite.

### UI

- Equipes: busca, filtros, vazio, erro e paginacao;
- Pessoas: selecionar membro e atualizar painel;
- Cultos: escalar equipe, aprovar, convidar e aceitar;
- mobile 320px, tablet e desktop.

### Banco

- usuario de uma igreja nao acessa dados de outra;
- lider acessa aprovacoes de sua equipe;
- voluntario acessa apenas seus convites;
- gestor acessa escopo completo da igreja.

## Riscos e mitigacoes

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| Misturar permissao com vinculo de equipe | Alto | Separar `church_member_roles` de `church_team_members`. |
| N+1 em diretorio de membros | Alto | Agregacao em service/view/RPC e batch queries. |
| Vazamento entre igrejas | Critico | RLS por `church_id`, indices e testes de isolamento. |
| Fluxo de convite duplicado | Medio | Constraint unica por `service_id`, `team_id`, `member_user_id`, funcao e status ativo. |
| UI virar painel denso demais no mobile | Medio | Drawer para painel lateral e cards compactos. |
| Mudanca de grants do Supabase | Medio | Migrations com grants explicitos e RLS antes de exposicao. |

## Criterios de pronto por sprint

- TypeScript sem erros.
- Testes de service atualizados.
- Estados de loading, erro e vazio implementados.
- RLS revisada para novas tabelas.
- Sem acesso direto ao Supabase em componentes.
- Sem keys instaveis ou duplicadas em listas React.
- Sem texto estourado em mobile.
- Roadmap/status atualizado ao final da sprint.

## Referencias tecnicas consultadas

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase RLS performance: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Supabase API security: https://supabase.com/docs/guides/api/securing-your-api
- Supabase changelog sobre grants automaticos: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
