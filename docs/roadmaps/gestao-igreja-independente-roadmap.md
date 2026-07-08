# Roadmap: Modulo Independente de Gestao da Igreja

Status: proposta de produto e arquitetura
Data: 2026-06-19
Modulo alvo: Gestao da Igreja como modulo independente do ecossistema BibliaLM
Relacionado: `docs/roadmaps/perfis-gerais-e-permissoes-igreja-roadmap.md`

## 1. Objetivo

Criar um modulo independente de Gestao da Igreja, conectado ao Workspace Pastoral, ao Reino, ao Culto+, aos grupos/celulas, as oracoes, ao Mana e ao perfil publico da igreja.

A meta nao e criar um painel isolado, nem amarrar a gestao administrativa ao pastor ou ao Workspace Pastoral. A igreja deve virar um eixo central do BibliaLM: tudo que hoje ja nasce com `churchId` ou pode nascer com contexto de igreja deve conseguir alimentar a gestao, os indicadores e os fluxos pastorais.

Principios centrais:

- Gestao da Igreja e modulo proprio, com rota, feature flag, permissoes e navegacao independentes.
- Workspace Pastoral continua focado em criacao, estudo, salas, oracoes guiadas, cuidado e apoio pastoral.
- Pastor pode usar recursos pastorais sem ser gestor administrativo da igreja.
- Gestor da Igreja pode administrar a operacao sem ser pastor.
- Primeiro criar as funcionalidades operacionais.
- Depois gerar indicadores confiaveis a partir delas.
- No MVP, cada indicador precisa nascer com custo baixo: query pequena, projection explicita, limite, cache ou snapshot.
- Evitar metricas frias sobre espiritualidade.
- Medir sinais objetivos: participacao, cuidado, resposta, organizacao, presenca, engajamento e acompanhamento.

## 2. Estado atual observado no sistema

### Base tecnica

- App principal em Next.js, React e TypeScript.
- Dados e auth em Supabase.
- `types.ts` e a fonte principal de interfaces globais.
- A arquitetura exige dados e banco em `services/`, nao direto em telas.
- Existe uso de `featureFlags`, `checkFeatureAccess`, `recordActivity` e eventos de Mana.

### Recursos ja existentes ou parcialmente existentes

#### Igreja e comunidade

- `Church` em `types.ts`.
- Pagina publica de igreja em `views/public/ChurchProfilePage.tsx`.
- Busca e cadastro de igrejas em `services/supabase.ts` e `scripts/create_churches.sql`.
- `memberships` para vinculo de usuario com igreja/celula.
- `church_role_requests` para solicitar responsabilidade por igreja.
- `church_followers` para seguir igreja.
- `cells` para grupos/celulas.
- Convites para grupos privados em `group_access_invites`.

#### Reino/social

- Feed com posts, comentarios, visibilidade, igreja e grupo.
- Postagens com `churchId`, `cellId`, `destination`, `visibility` e `serviceId`.
- Mural/unificacao de pedidos e posts na pagina da igreja.

#### Oracao

- `PrayerRequest` global, igreja e celula.
- Sala de oracao em `views/PrayerRoomPage.tsx`.
- Oracoes guiadas criadas por pastor em `views/PrayersManagerPage.tsx`.
- Pedidos de oracao no Culto+ em `service_prayer_requests`.

#### Workspace Pastoral

- Rota `/workspace-pastoral`.
- Hoje funciona como hub para planos/salas, jogos, oracoes guiadas e preview do Culto+.
- Usa `WorkspaceProvider` e `WorkspaceOnePage`.
- Ainda possui trecho de membros/equipes com dados mockados, o que impede indicadores reais nessa parte.
- Deve continuar existindo como modulo pastoral, mas nao deve ser o dono da Gestao da Igreja.

#### Culto+

- Gestao dedicada atualmente em `/workspace-pastoral/cultos`.
- OnePage publica em `/culto/[serviceSlug]`.
- Criacao de cultos, liturgia, banner, versiculo-chave e status.
- Check-ins, visitas, anotacoes, posts, reacoes, pedidos de oracao, versiculos salvos.
- Ministerios, membros de ministerios e escalas de culto.
- Estado ao vivo e apoio por IA.
- QR Code de check-in ja existe na OnePage, mas ainda como caso especifico do Culto+.
- Pode ser linkado pela Gestao da Igreja sem precisar mover todo o Culto+ no MVP.

#### Gamificacao/Mana

- `mana_events` e `church_gamification_snapshots` previstos em migration.
- Ranking de igrejas e snapshots de Mana por igreja.
- Eventos ligados a igreja/grupo quando `recordActivity` recebe `churchData`.

## 3. Lacunas principais

### Produto

- Ainda nao existe um modulo unico de gestao da igreja.
- Ainda nao existe uma entrada independente para a operacao da igreja.
- O produto ainda mistura criacao pastoral, operacao da igreja e cuidado em pontos diferentes.
- Nao existe caixa de entrada pastoral central para pedidos de oracao, voluntariado, visitantes, aconselhamento e acompanhamentos.
- Nao existe motor generico de formularios/QR Codes para a igreja.
- Nao existe fluxo de voluntariado fora das escalas de Culto+.
- Nao existe diretorio operacional de membros com status, papeis, ministerios, grupos, tags e acompanhamento.
- Nao existe painel de indicadores da igreja com dados confiaveis e agregados.

### Arquitetura

- `subscriptionTier` mistura plano comercial com acesso pastoral.
- `memberships.role` existe, mas e pouco expressivo para os novos perfis.
- Os novos perfis precisam ser papeis de igreja, nao planos de assinatura.
- Papeis podem ser multiplos e escopados. Exemplo: uma pessoa pode ser Pastor da igreja, Lider de celula e Voluntario do louvor.
- RLS precisa sair de "membro da igreja pode tudo" para permissoes por papel e escopo.
- Indicadores devem vir de tabelas/eventos reais, nao de arrays mockados ou contadores locais.

### Pastoral

- Pedidos privados e acompanhamentos exigem privacidade forte.
- Indicadores nao devem rotular pessoas como "frias", "fracas" ou "espirituais".
- A gestao deve ajudar cuidado, nao vigilancia.
- Historico pastoral sensivel precisa de consentimento, escopo e auditoria.

## 4. Estrategia de custo e queries para MVP

O BibliaLM ainda esta em fase de MVP. Mesmo com um banco robusto, o modulo de Gestao da Igreja deve ser desenhado para crescer sem gerar custo alto no inicio.

Diretriz principal:

- nao limitar o roadmap;
- nao criar dados duplicados sem necessidade;
- nao carregar listas completas para montar dashboards;
- nao fazer analytics pesado em tempo real;
- preparar agregados e snapshots para quando houver volume.

### Principios de query economica

1. Primeira tela sempre leve.
   - O dashboard inicial deve buscar apenas contadores, proximas pendencias e poucos itens recentes.
   - Nada de carregar membros, pedidos, cultos, grupos e escalas completos ao mesmo tempo.

2. Projection explicita em todo `select`.
   - Evitar `select('*')` em telas de gestao.
   - Cada card deve pedir somente as colunas que usa.

3. Listas paginadas desde o primeiro dia.
   - Pessoas, pedidos, formularios, submissoes, escalas e logs devem usar `limit` e `range`.
   - Preferir paginacao por cursor/data quando a lista crescer.

4. Detalhe sob demanda.
   - O dashboard mostra resumo.
   - Ao abrir uma aba ou item, buscar os detalhes daquele contexto.

5. Contadores cacheados antes de contagens exatas repetidas.
   - Para o MVP, usar contadores ja existentes quando houver, como `checkins_count` e `posts_count` em `church_services`.
   - Criar contadores/snapshots para novas areas quando o volume justificar.

6. Evitar N+1 queries.
   - Services devem entregar dados ja agrupados para a UI.
   - Se uma tela precisar de membros + roles + grupos, preferir RPC/view/service composto em vez de uma query por membro.

7. Realtime apenas onde tiver valor claro.
   - Inbox pastoral, QR scans e dashboard nao precisam realtime no MVP.
   - Usar refresh manual, refetch ao focar a tela ou polling moderado apenas em telas abertas.
   - Culto+ pode manter polling/realtime especifico porque a experiencia ao vivo justifica.

8. Analytics por snapshot, nao por varredura.
   - Indicadores historicos devem vir de `church_analytics_snapshots`.
   - Enquanto snapshots nao existirem, mostrar apenas indicadores simples de tabelas pequenas ou contadores existentes.

9. Indices antes de escala.
   - Toda tabela nova deve nascer com indices para:
     - `church_id`;
     - `created_at`;
     - `status`;
     - `assigned_to`;
     - `token`, quando for link publico;
     - pares de escopo como `(church_id, status, created_at desc)`.

10. QR barato por desenho.
    - QR Code deve apontar para `/qr/[token]`, com lookup unico por token indexado.
    - Eventos de visualizacao devem ser deduplicados por `session_id` quando possivel.
    - Contadores de scans/envios devem ser agregados por periodo, nao recalculados a cada abertura do dashboard.

11. IA fora do caminho critico.
    - Nenhum indicador ou dashboard deve depender de chamada de IA.
    - IA entra apenas como apoio opcional e sempre atras de `checkFeatureAccess`, cotas e acao explicita do usuario.

12. Feature flags para liberar custo progressivamente.
    - `church_management` pode liberar o modulo.
    - Flags adicionais podem liberar QR, inbox pastoral, analytics avancado e automacoes por etapas.

### Padrao recomendado para services

Cada service novo deve separar tres tipos de chamada:

- `getSummary`: barato, usado em dashboard e cards.
- `list`: paginado, usado em abas.
- `getDetails`: detalhado, usado ao abrir item.

Exemplo conceitual:

- `churchManagementService.getChurchSummary(churchId)`
- `pastoralCareService.listCareItems(churchId, filters, page)`
- `pastoralCareService.getCareItemDetails(itemId)`
- `churchQrService.listQrLinks(churchId, page)`
- `churchQrService.getQrSummary(churchId)`

### Politica de indicadores no MVP

Um indicador so entra na primeira tela se atender pelo menos uma condicao:

- vem de contador ja cacheado;
- vem de uma query `count` simples e indexada;
- vem de uma lista limitada a poucos itens;
- vem de snapshot;
- e essencial para a operacao diaria.

Indicadores caros ficam em:

- aba especifica;
- carregamento sob demanda;
- relatorio manual;
- fase de analytics.

### Evolucao sem travar o futuro

A estrategia de baixo custo nao reduz o roadmap. Ela muda a forma de entrega:

1. MVP mostra dados essenciais baratos.
2. Fluxos operacionais geram eventos e registros.
3. Snapshots agregam dados por periodo.
4. Relatorios avancados passam a ler snapshots.
5. Com volume real, otimizar indices, RPCs e views baseado em uso observado.

### Politica transversal de notificacoes e alertas

Tudo que entrar no roadmap deve responder a duas perguntas:

- quem precisa ser notificado?
- quem precisa ver alerta acionavel no dashboard ou em "Meu Acompanhamento"?

Eventos minimos que devem gerar notificacao ou alerta:

- novo pedido por QR/formulario;
- pedido atribuido, atrasado, respondido ou encerrado;
- designacao atribuida, aceita, recusada, pausada, expirada ou removida;
- convite para grupo/celula;
- convite ou aprovacao para ministerio;
- escala criada, alterada, pendente, confirmada, recusada ou vencida;
- interesse em voluntariado recebido, aprovado ou arquivado;
- follow-up pastoral vencido;
- resposta aguardando acao do membro;
- formulario publico desativado ou QR expirado;
- permissao sensivel atribuida ou revogada.

Regras de custo:

- notificacoes devem nascer como eventos pequenos;
- usar contadores por usuario/igreja para badges;
- listas de notificacoes sempre paginadas;
- dashboards devem ler resumo, nao todos os eventos;
- realtime apenas para casos abertos e com valor claro.

## 5. Visao do modulo Gestao da Igreja

Nome recomendado na UI:

- Gestao da Igreja

Entrada recomendada:

- Rota principal independente: `/gestao-igreja`
- Variante por igreja, se necessario: `/gestao-igreja/[churchId]` ou igreja ativa no contexto do usuario.
- Atalho no menu lateral/global quando o usuario tiver papel eclesiastico de gestao.
- O item "Gestao da Igreja" no menu lateral deve funcionar como grupo de navegacao com submenus das funcionalidades do modulo.
- As funcionalidades principais nao devem ficar escondidas apenas dentro da pagina principal; cada area precisa ter rota propria e entrada direta no menu.
- Atalho contextual opcional no Workspace Pastoral, no Culto+ e na pagina publica da igreja.
- Link contextual na pagina publica da igreja para responsaveis autorizados.

Relacao com o Workspace Pastoral:

- Gestao da Igreja e modulo irmao, nao submodulo.
- Workspace Pastoral serve o pastor em estudo, salas, criacao, oracoes guiadas e cuidado.
- Gestao da Igreja serve a operacao da igreja: pessoas, pedidos, QR, voluntarios, ministerios, grupos, indicadores e configuracoes.
- As duas areas compartilham `churchId`, roles, services e indicadores, mas cada uma tem entrada, permissao e experiencia propria.

Areas internas recomendadas:

1. Dashboard
2. Permissoes
3. Designacoes
4. Equipes
5. QR Codes e Formularios
6. Inbox/Pedidos e Cuidado
7. Notificacoes e Alertas
8. Conquistas, Selos e Mana
9. Pessoas
10. Cultos e Eventos
11. Grupos e Discipulado
12. Comunicacao
13. Indicadores e Relatorios
14. Configuracoes

### Navegacao do menu lateral

No MVP, o menu global deve expor "Gestao da Igreja" como um grupo expansivel, e nao apenas como um link para uma pagina com todos os atalhos.

Submenus recomendados no primeiro corte:

- Dashboard: `/gestao-igreja`
- Pessoas: `/gestao-igreja/pessoas`
- Permissoes: `/gestao-igreja/permissoes`
- Designacoes: `/gestao-igreja/designacoes`
- Equipes: `/gestao-igreja/equipes`
- Cultos/Eventos: `/gestao-igreja/cultos`
- Grupos/Celulas: `/gestao-igreja/grupos`
- QR Codes: `/gestao-igreja/qrcodes`
- Inbox: `/gestao-igreja/inbox`
- Notificacoes: `/gestao-igreja/notificacoes`
- Conquistas/Selos: `/gestao-igreja/insignias`
- Indicadores: `/gestao-igreja/indicadores`
- Configuracoes: `/gestao-igreja/configuracoes`

Rotas de cadastro/edicao recomendadas para o MVP:

- Nova permissao: `/gestao-igreja/permissoes/nova`
- Editar permissao: `/gestao-igreja/permissoes/[id]/editar`
- Diretorio de pessoas: `/gestao-igreja/pessoas`
- Nova designacao: `/gestao-igreja/designacoes/nova`
- Editar designacao: `/gestao-igreja/designacoes/[id]/editar`
- Nova equipe: `/gestao-igreja/equipes/nova`
- Editar equipe: `/gestao-igreja/equipes/[id]/editar`
- Novo QR/formulario: `/gestao-igreja/qrcodes/novo`
- Editar QR/formulario: `/gestao-igreja/qrcodes/[id]/editar`
- Novo template/configuracao de notificacao futura: `/gestao-igreja/notificacoes/nova`

Observacao sobre Conquistas/Selos:

- `/gestao-igreja/insignias` nao deve ter CRUD de cadastro de selos;
- selos sao padroes do BibliaLM, nao configuracoes da igreja;
- a tela deve exibir catalogo, regras, eventos que alimentam conquistas e historico agregado quando houver dados.

Regras de UX:

- a pagina principal continua sendo dashboard/resumo, nao repositorio de todas as funcionalidades;
- cada funcionalidade deve ter rota propria, titulo proprio e estado proprio;
- CRUDs devem separar listagem/visao operacional de cadastro/edicao;
- telas de dashboard, listagem e detalhe nao devem embutir formularios grandes de cadastro;
- cada area gerenciavel deve ter botao claro de acao primaria, como "Cadastrar", "Criar" ou "Novo";
- botoes de cadastro devem levar para tela propria, por exemplo `/gestao-igreja/equipes/novo`, `/gestao-igreja/designacoes/nova`, `/gestao-igreja/qrcodes/novo` e `/gestao-igreja/permissoes/nova`;
- formularios de edicao devem seguir rotas dedicadas ou drawers focados quando forem pequenos, mas nunca competir com o dashboard da funcionalidade;
- a tela de listagem deve priorizar busca, filtros, cards/tabela, estados e acoes rapidas;
- implementacao atual deve remover formularios embutidos das telas de `permissoes`, `designacoes`, `equipes` e `qrcodes`, mantendo apenas o botao de cadastro que abre a tela propria;
- implementacao atual inclui diretorio operacional em `/gestao-igreja/pessoas` baseado em roles e escopos, sem virar CRM completo no MVP;
- central de notificacoes deve permitir marcar como lida e dispensar eventos reais, mantendo preview quando nao houver dados;
- implementacao atual inclui rotas de edicao dedicadas para QR Codes, Designacoes, Equipes e Permissoes;
- permissoes devem permitir revogacao em tela propria, preservando auditoria e evitando formularios misturados na listagem;
- implementacao atual inclui rotas de detalhe dedicadas para QR Codes, Designacoes, Equipes, Permissoes, Pessoas e Inbox;
- detalhes devem ser telas de leitura/acompanhamento, com link para editar quando o recurso permitir edicao;
- edicoes devem usar controles fechados para status, evitando campo texto livre em estados operacionais;
- listagens de Pessoas, QR Codes e Designacoes devem ter busca/filtro leve no MVP;
- detalhes de QR Codes, Equipes e Designacoes devem oferecer acoes rapidas de pausar, arquivar ou remover quando aplicavel;
- implementacao atual inclui `/gestao-igreja/indicadores` com indicadores leves baseados em summary, sem analytics historico pesado;
- implementacao atual inclui `/gestao-igreja/configuracoes` com preferencias persistentes para validade de QR, mensagens padrao, notificacoes e feedback ao membro;
- implementacao atual inclui `/gestao-igreja/cultos` como camada operacional conectada ao Culto+, sem duplicar CRUD de culto no MVP;
- implementacao atual inclui `/gestao-igreja/grupos` como camada operacional conectada aos grupos/celulas, sem transformar Gestao da Igreja em cadastro completo de grupos;
- Cultos/Eventos e Grupos/Celulas devem funcionar como hubs de acompanhamento, impacto e atalhos, respeitando os modulos de origem;
- o menu expandido deve mostrar os submenus quando o usuario estiver dentro de `/gestao-igreja`;
- no menu recolhido, o item principal pode permanecer como atalho unico para preservar espaco;
- se o usuario nao tiver role autorizado, o grupo deve seguir a regra de acesso protegido;
- os submenus devem respeitar permissao e escopo quando os roles reais estiverem ativos.

Area complementar para membros:

- Meu Acompanhamento na Igreja
- Deve ser uma area do membro, nao da gestao administrativa.
- Mostra retorno e status dos fluxos que o membro iniciou ou recebeu.
- Nao expõe dados internos da equipe, notas pastorais, indicadores administrativos ou informacoes de outros membros.
- Funciona como espelho seguro da Gestao da Igreja para o membro.

Principio da experiencia do membro:

- se o membro enviou um pedido, ele deve saber que foi recebido;
- se a igreja respondeu, ele deve ver a resposta ou proximo passo;
- se foi convidado para grupo, ministerio, escala ou acompanhamento, ele deve ter uma area unica para acompanhar;
- se algo foi encerrado, ele deve ver o historico permitido;
- se algo for pastoralmente sensivel, o retorno precisa ser acolhedor, discreto e privado.

### Direcao UI/UX premium

Como a Gestao da Igreja sera um modulo independente, ela deve parecer quase uma aplicacao propria, mas ainda reconhecivel como parte do BibliaLM.

Principio visual:

- identidade propria para operacao da igreja;
- linguagem visual mais premium que um admin comum;
- mais cards funcionais, sem virar landing page;
- movimento sutil para dar sensacao de sistema vivo;
- experiencia densa, organizada e rapida para uso recorrente.

Paleta recomendada:

- identidade principal do modulo: prata/platina metalizado (`#E5E7EB`, `#CBD5E1`, `#94A3B8`);
- cor de contraste e acao principal: grafite premium (`#111827` ou `#0F172A`);
- cor de apoio premium: dourado BibliaLM em detalhes, divisores, estados premium e pequenos acentos;
- verde/esmeralda apenas para sucesso, progresso ou voluntariado, nao como identidade principal;
- assinatura BibliaLM: dourado biblico apenas em detalhes, destaques e estados premium, sem competir com a prata;
- base clara: branco, platina clara, cinza quente e off-white;
- base escura: grafite, carvao premium e superficies elevadas;
- efeito metalizado deve aparecer em bordas, divisores, highlights, icones e cards especiais, nao como fundo brilhante constante;
- evitar jade/teal como cor principal, pois essa familia visual fica muito proxima do Culto+;
- evitar prata pura para textos ou botoes importantes, pois pode perder contraste;
- evitar uma tela inteira monocromatica em cinza/prata; cada area deve ter acento proprio.

Cores por dominio:

- Pessoas: azul discreto.
- Pedidos e Cuidado: rose/vermelho suave.
- QR Codes e Formularios: ciano ou violeta controlado.
- Voluntarios e Ministerios: verde.
- Cultos e Eventos: dourado/ambar.
- Grupos e Discipulado: indigo discreto.
- Relatorios: grafite com acento prata ou dourado.

Layout recomendado:

- shell proprio do modulo em `/gestao-igreja`;
- navegacao global com grupo expansivel "Gestao da Igreja" e submenus diretos para as funcionalidades;
- sidebar interna do modulo pode existir futuramente para ambientes densos, mas nao deve substituir os submenus globais do modulo no MVP;
- header premium com igreja ativa, seletor de igreja, periodo, status do plano/feature e acoes rapidas;
- primeira tela com grid de cards e resumo operacional, nao tabela gigante nem deposito de todas as funcionalidades;
- coluna lateral "Atencao hoje" para urgencias, follow-ups, escalas e pedidos sem responsavel;
- drawers laterais para detalhes de pessoa, pedido, QR ou ministerio, evitando navegar demais;
- CRUDs devem seguir o padrao lista -> cadastro/edicao -> detalhe:
  - listagem: `/gestao-igreja/{recurso}`;
  - cadastro: `/gestao-igreja/{recurso}/novo` ou `/nova`;
  - edicao: `/gestao-igreja/{recurso}/{id}/editar`;
  - detalhe: `/gestao-igreja/{recurso}/{id}`;
- o formulario de cadastro deve ocupar uma tela dedicada, com cabecalho, campos, validacao, salvar/cancelar e retorno claro;
- a tela da funcionalidade deve conter botao primario para cadastrar e acoes secundarias por item, sem misturar form longo com cards de resumo;
- mobile com abas/segmentos e acoes principais fixas, sem sobrecarregar a primeira dobra.

Cards esperados:

- card de indicador: numero, variacao, origem do dado e acao;
- card de pedido: status, prioridade, responsavel e tempo aberto;
- card de pessoa: papel, grupo, ministerio e ultimo contato;
- card de QR: finalidade, scans, envios, status e botao baixar;
- card de ministerio: voluntarios, faltas, proxima escala e pendencias;
- card de alerta: pendencia acionavel, responsavel e prazo;
- card de atalho: criar QR, cadastrar pessoa, abrir inbox, criar formulario.

Motion e microinteracoes:

- entrada suave dos cards no dashboard;
- hover com elevacao leve e borda destacada;
- transicao curta entre abas;
- contadores animados apenas quando o dado muda;
- feedback visual ao gerar QR Code, copiar link ou baixar imagem;
- skeleton loading em cards e listas;
- respeitar `prefers-reduced-motion`;
- evitar animacoes decorativas continuas que consumam bateria ou desviem foco.

Regras de qualidade visual:

- usar `lucide-react` para icones dos cards e acoes;
- manter raio dos cards contido, com 8px como padrao para telas operacionais;
- nao colocar cards dentro de cards;
- nao usar hero de marketing como primeira tela;
- nao usar texto explicando como usar a interface dentro da tela;
- garantir contraste AA em claro e escuro;
- manter touch target minimo de 44px;
- layouts responsivos com grid estavel para evitar saltos.
- efeitos metalizados devem ser discretos e nao prejudicar legibilidade.

Tokens recomendados para o modulo:

- `church-ui-metal`: prata/platina da identidade do modulo;
- `church-ui-primary`: grafite premium para acoes principais e contraste;
- `church-ui-accent`: dourado BibliaLM;
- `church-ui-surface`: superficie clara/escura do modulo;
- `church-ui-border`: borda prata suave;
- `church-ui-highlight`: brilho metalizado controlado;
- `church-ui-danger`: pedidos urgentes;
- `church-ui-care`: cuidado pastoral;
- `church-ui-success`: tarefas concluidas;
- `church-ui-warning`: pendencias e escalas atrasadas.

## 6. Novos perfis e permissoes

### Regra estrutural

Separar:

- plano comercial: `subscriptionTier`
- papel operacional na igreja: novo modelo de roles por igreja

O plano pode liberar acesso a recursos premium. O papel define o que a pessoa pode fazer dentro daquela igreja.

Regra de produto:

- Pastor nao recebe permissao administrativa automaticamente.
- Gestor da Igreja nao recebe acesso pastoral sensivel automaticamente.
- Quando uma pessoa precisar exercer os dois papeis, ela deve ter os dois roles de forma explicita.
- Roles definem permissao. Designacoes definem atividade, funcao, responsabilidade e area de servico.
- Toda designacao atribuida, alterada, recusada, vencida ou removida deve gerar feedback para o usuario afetado.

### Designacoes e atividades personalizaveis da igreja

A igreja precisa configurar designacoes proprias para refletir sua organizacao real, principalmente atividades praticas de servico.

Exemplos:

- cuidador de criancas;
- portaria;
- recepcao;
- organizar carros/estacionamento;
- limpeza e organizacao;
- apoio no louvor;
- intercessao;
- apoio de midia/projecao;
- fotografia;
- seguranca/apoio de entrada;
- professor de classe;
- apoio em evento;
- visita pastoral;
- acolhimento de visitantes;
- lider de celula;
- coordenador de voluntarios.

Regras:

- designacao nao deve conceder permissao automaticamente sem role associado;
- uma designacao pode sugerir permissoes padrao, mas precisa respeitar RLS e escopo;
- designacoes podem ter escopo: igreja, campus futuro, grupo, ministerio, culto, evento ou formulario;
- designacoes podem pertencer a grupos/equipes de lideres ou voluntarios;
- designacoes podem ter periodo, status e responsavel por aprovacao;
- usuario precisa receber feedback quando recebe, aceita, recusa, perde ou tem uma designacao expirada;
- a area do membro deve mostrar as proprias designacoes ativas e pendentes.
- servico recorrente pode gerar insignias e Mana, sem virar ranking espiritual.

### Papeis minimos

#### Gestor da Igreja

Perfil voltado para administracao operacional.

Permissoes:

- configurar dados da igreja;
- aprovar e atribuir papeis;
- ver dashboard geral;
- gerir membros;
- criar QR Codes e formularios;
- gerir ministerios e escalas;
- ver relatorios agregados;
- exportar dados permitidos;
- configurar privacidade e visibilidade;
- acessar Culto+ e eventos da igreja.

Limites pastorais:

- nao deve ver detalhes sensiveis de aconselhamento se nao tiver permissao pastoral explicita.
- pode ver contadores agregados de cuidado sem expor conteudo privado.

#### Pastor

Perfil voltado para ensino, cuidado e direcao pastoral.

Permissoes:

- ver e acompanhar pedidos pastorais;
- criar estudos, salas, trilhas, oracoes guiadas e conteudos da igreja;
- acompanhar discipulado e grupos;
- responder ou encaminhar pedidos de oracao;
- acessar notas pastorais sensiveis quando permitido;
- criar e supervisionar cultos;
- acompanhar indicadores de cuidado.

Limites:

- nao substitui automaticamente o papel de Gestor da Igreja;
- deve respeitar privacidade de pedidos marcados como privados;
- todo registro pastoral sensivel deve ser auditavel.

#### Lider

Perfil escopado a um grupo, celula ou ministerio.

Permissoes:

- gerir membros do grupo/ministerio sob sua responsabilidade;
- ver pedidos atribuidos ao seu grupo/ministerio;
- criar comunicacoes internas do grupo;
- acompanhar presenca e participacao do grupo;
- sugerir voluntarios ou convidar membros;
- comentar e acompanhar jornadas do grupo.

Limites:

- nao ve dados gerais sensiveis da igreja inteira;
- nao atribui papeis globais;
- nao acessa relatorios financeiros ou pastorais amplos.

#### Voluntario

Perfil de servico.

Permissoes:

- ver suas escalas;
- confirmar, recusar ou pedir substituicao;
- informar disponibilidade;
- receber tarefas e lembretes;
- responder comunicados do ministerio;
- submeter interesse em servir por QR Code.

Limites:

- nao acessa dados de outros membros alem do necessario para escala;
- nao ve pedidos pastorais privados.

#### Membro

Usuario vinculado a igreja.

Permissoes:

- participar do feed/mural conforme regras;
- enviar pedidos;
- responder formularios;
- fazer check-in;
- entrar em grupos/salas;
- acompanhar suas jornadas.

#### Visitante

Pessoa sem vinculo ou sem login.

Permissoes:

- acessar formularios publicos por QR;
- enviar pedido se a igreja permitir;
- pedir contato;
- indicar interesse em voluntariado ou visita;
- fazer check-in visitante se o produto permitir.

## 7. Modelo de dados recomendado

### Evoluir `memberships`

Manter compatibilidade com a tabela atual, mas expandir seu uso.

Campos recomendados:

- `user_id`
- `church_id`
- `cell_id`
- `status`: active, inactive, pending, removed
- `joined_at`
- `last_seen_at`
- `source`: manual, qr, invite, church_page, culto_checkin
- `member_type`: member, visitor, regular_attender

### Nova tabela `church_member_roles`

Necessaria porque uma pessoa pode ter mais de um papel.

Campos:

- `id`
- `church_id`
- `user_id`
- `role`: church_manager, pastor, leader, volunteer
- `scope_type`: church, group, ministry, service, form
- `scope_id`
- `granted_by`
- `granted_at`
- `revoked_at`
- `status`: active, revoked

### Nova tabela `church_designation_templates`

Catalogo personalizavel de designacoes/atividades da igreja.

Campos:

- `id`
- `church_id`
- `name`
- `description`
- `category`: children, reception, parking, cleaning, worship, media, intercession, teaching, event, care, leadership, volunteer, ministry, group, custom
- `suggested_role`: church_manager, pastor, leader, volunteer, member
- `default_scope_type`: church, group, ministry, service, event, form
- `team_type`: leaders, volunteers, mixed
- `mana_reward_key`
- `badge_key`
- `requires_acceptance`: boolean
- `requires_approval`: boolean
- `is_public_on_profile`: boolean
- `is_active`
- `created_by`
- `created_at`
- `updated_at`

### Nova tabela `church_member_designations`

Atribuicoes reais de designacoes a usuarios ou pessoas cadastradas.

Campos:

- `id`
- `church_id`
- `template_id`
- `user_id`
- `person_name`
- `designation_name_snapshot`
- `team_id`
- `scope_type`: church, group, ministry, service, event, form
- `scope_id`
- `status`: pending, active, declined, paused, expired, revoked
- `starts_at`
- `ends_at`
- `assigned_by`
- `accepted_at`
- `declined_at`
- `revoked_at`
- `notes_public`
- `created_at`
- `updated_at`

Regras:

- manter `designation_name_snapshot` para preservar historico se o template mudar;
- criar indices para `(church_id, user_id, status)`, `(church_id, scope_type, scope_id)` e `(template_id, status)`;
- usar `notes_public` apenas para informacao que o usuario pode ler;
- notas internas devem ficar em estrutura separada ou no modulo administrativo com permissao adequada.

### Nova tabela `church_service_teams`

Grupos/equipes de lideres e voluntarios ligados a atividades da igreja.

Campos:

- `id`
- `church_id`
- `name`
- `description`
- `team_type`: leaders, volunteers, mixed
- `activity_category`: children, reception, parking, cleaning, worship, media, intercession, teaching, event, care, custom
- `leader_user_id`
- `scope_type`: church, ministry, group, service, event
- `scope_id`
- `is_active`
- `created_by`
- `created_at`
- `updated_at`

### Nova tabela `church_service_team_members`

Vinculo entre usuarios e equipes de servico.

Campos:

- `id`
- `church_id`
- `team_id`
- `user_id`
- `role_in_team`: leader, assistant_leader, volunteer, trainee
- `status`: invited, active, paused, removed
- `joined_at`
- `left_at`
- `created_at`

### Conquistas e selos padronizados do BibliaLM

Insignias e selos nao sao uma funcionalidade gerenciavel pela igreja.

Eles fazem parte do sistema padrao de conquistas do BibliaLM e podem reconhecer servico, constancia, disponibilidade, lideranca e pastoreio a partir de eventos auditaveis.

Regra de produto:

- a igreja nao cria, edita ou concede selos manualmente;
- o BibliaLM define o catalogo oficial de conquistas;
- conquistas especificas podem existir para Voluntario, Lider e Pastor;
- a Gestao da Igreja exibe regras, progresso e conquistas recebidas;
- eventos operacionais da igreja podem alimentar conquistas padrao;
- a area "Minha Igreja" mostra ao membro os selos recebidos e o motivo permitido;
- nenhum selo mede maturidade espiritual ou valor da pessoa diante de Deus.

Exemplos de selos padrao:

- Voluntario disponivel: aceitou designacoes e confirmou presenca em eventos auditaveis.
- Servo constante: manteve constancia em atividades de servico por periodo.
- Lider cuidadoso: acompanhou equipe/designacoes dentro do escopo autorizado.
- Pastor presente: respondeu acompanhamentos pastorais dentro de fluxo permitido e seguro.
- Acolhimento: participou de recepcao, portaria ou boas-vindas em evento auditavel.

### Registro de conquistas recebidas

Conquistas recebidas por usuarios.

Campos:

- `id`
- `church_id`
- `user_id`
- `badge_key` padronizado pelo BibliaLM
- `source_type`: designation, team, scale, mana_event, system_rule
- `source_id`
- `awarded_by`
- `awarded_at`
- `visibility`: private, church_team, public_profile

Regras:

- insignias reconhecem servico e disponibilidade, nao valor espiritual;
- a origem deve ser evento auditavel do app, nao decisao manual livre da igreja;
- `awarded_by` deve ser nulo ou sistema quando for conquista automatica;
- usuario deve poder ver as proprias insignias em "Minha Igreja";
- visibilidade publica precisa ser configuravel;
- Mana por servico deve ser limitado, auditavel e anti-spam.

### Nova tabela `church_forms`

Motor generico para formularios publicos e internos da igreja.

Tipos iniciais:

- prayer_request
- volunteer_application
- visitor_card
- counseling_request
- decision_card
- event_registration
- group_interest
- service_checkin
- custom

Campos:

- `id`
- `church_id`
- `title`
- `description`
- `type`
- `visibility`: public, church, leaders, private
- `fields_schema`
- `destination`: prayer_inbox, volunteer_pipeline, visitor_inbox, care_inbox, event_list
- `assigned_role`
- `assigned_user_id`
- `is_active`
- `created_by`
- `created_at`
- `updated_at`

### Nova tabela `church_qr_links`

QR Code deve ser um link rastreavel, nao apenas uma imagem.

Campos:

- `id`
- `church_id`
- `form_id`
- `purpose`
- `token`
- `url`
- `label`
- `campaign_name`
- `target_route`
- `created_by`
- `created_at`
- `expires_at`
- `is_active`

### Nova tabela `church_form_submissions`

Submissoes feitas por QR, pagina da igreja ou link.

Campos:

- `id`
- `church_id`
- `form_id`
- `qr_link_id`
- `submitter_user_id`
- `submitter_name`
- `submitter_contact`
- `payload`
- `privacy_level`: public, leaders, pastoral_private
- `status`: new, triaged, assigned, in_progress, closed, archived
- `priority`: low, normal, high, urgent
- `assigned_to`
- `created_at`
- `updated_at`

### Nova tabela `pastoral_care_items`

Fila pastoral unificada para pedidos que viram acompanhamento.

Campos:

- `id`
- `church_id`
- `source_type`: prayer_request, service_prayer, form_submission, manual, visitor_card
- `source_id`
- `person_user_id`
- `person_name`
- `category`: prayer, counseling, visit, decision, family, health, follow_up, other
- `summary`
- `sensitivity`: normal, private, restricted
- `status`: open, assigned, contacted, praying, follow_up, closed
- `assigned_to`
- `due_at`
- `last_contact_at`
- `created_at`
- `updated_at`

### Nova tabela `pastoral_care_notes`

Notas sensiveis separadas do item principal.

Campos:

- `id`
- `care_item_id`
- `church_id`
- `author_id`
- `content`
- `visibility`: assigned_only, pastors, church_managers_with_permission
- `created_at`

### Nova tabela ou view `member_church_updates`

Linha do tempo segura para o membro acompanhar retornos da igreja.

Pode nascer como view/RPC lendo fontes existentes e evoluir para tabela de eventos quando houver volume.

Campos recomendados:

- `id`
- `church_id`
- `user_id`
- `source_type`: form_submission, care_item, volunteer_application, group_invite, ministry_assignment, service_schedule, prayer_request
- `source_id`
- `title`
- `summary_public`
- `status_public`: received, in_review, assigned, waiting_member, scheduled, approved, declined, completed, closed
- `action_label`
- `action_url`
- `visibility`: member_only, household, public_to_member
- `last_update_at`
- `created_at`

Regras:

- nunca incluir notas pastorais sensiveis;
- nunca expor nome de responsavel interno sem permissao;
- `summary_public` deve ser escrito para o membro, nao para a equipe;
- status interno pode ser mapeado para status publico mais simples.

### Nova tabela `church_notification_events`

Fila de eventos para notificacoes e alertas do ecossistema de Gestao da Igreja.

Campos:

- `id`
- `church_id`
- `event_type`
- `audience_type`: member, assignee, role, manager, pastor, leader, volunteer
- `recipient_user_id`
- `recipient_role`
- `source_type`
- `source_id`
- `title`
- `body`
- `severity`: info, success, warning, urgent
- `action_url`
- `status`: queued, sent, read, dismissed, failed
- `dedupe_key`
- `created_at`
- `sent_at`
- `read_at`

Regras:

- eventos devem ser deduplicados por `dedupe_key` quando possivel;
- alertas urgentes nao devem gerar spam;
- notificacoes sensiveis nunca devem carregar conteudo privado completo no corpo;
- o usuario precisa poder marcar como lido ou dispensar quando apropriado;
- dashboards devem consultar contadores de alertas, nao varrer todos os eventos.

### Nova tabela `church_qr_events`

Eventos para indicadores de QR.

Campos:

- `id`
- `church_id`
- `qr_link_id`
- `event_type`: viewed, started, submitted
- `session_id`
- `user_id`
- `created_at`

### Nova tabela `church_analytics_snapshots`

Agregados periodicos para dashboards rapidos.

Campos:

- `church_id`
- `period_key`
- `members_count`
- `active_members_count`
- `visitors_count`
- `new_members_count`
- `prayer_requests_count`
- `care_items_open_count`
- `care_items_overdue_count`
- `volunteer_applications_count`
- `active_volunteers_count`
- `services_count`
- `checkins_count`
- `groups_count`
- `active_groups_count`
- `forms_submissions_count`
- `qr_scans_count`
- `created_at`

## 8. Services recomendados

Criar services dedicados, mantendo `services/supabase.ts` como base compartilhada quando necessario.

### `churchRoleService.ts`

Responsabilidades:

- verificar papel do usuario na igreja;
- atribuir papel;
- revogar papel;
- resolver escopo;
- helper `canManageChurch`, `canViewPastoralCare`, `canManageVolunteers`, `canManageGroup`.

### `churchDesignationService.ts`

Responsabilidades:

- criar e editar templates de designacao;
- atribuir designacao a pastor, lider, voluntario ou membro;
- vincular designacao a atividade e equipe de servico;
- resolver escopo da designacao;
- solicitar aceite do usuario quando necessario;
- registrar aceite, recusa, pausa, expiracao ou revogacao;
- alimentar "Meu Acompanhamento na Igreja" com status da designacao;
- emitir eventos de notificacao e alerta via `churchNotificationService`.

### `churchServiceTeamService.ts`

Responsabilidades:

- criar grupos/equipes de lideres e voluntarios;
- vincular atividades a equipes;
- adicionar/remover membros da equipe;
- definir lider e auxiliares;
- listar equipes por igreja, ministerio, culto ou evento;
- gerar alertas de equipes sem lider, sem voluntarios suficientes ou com escala pendente;
- alimentar acompanhamento do membro com equipes e atividades em que ele serve.

### `churchVolunteerRecognitionService.ts`

Responsabilidades:

- exibir catalogo padrao de conquistas de voluntariado, lideranca e pastoreio;
- registrar conquistas automaticamente por criterios padronizados do app;
- registrar Mana por servico quando aplicavel e auditavel;
- limitar repeticao de Mana por evento/escala para evitar abuso;
- alimentar "Minha Igreja" com insignias recebidas;
- emitir notificacoes quando uma insignia for concedida.

### `churchManagementService.ts`

Responsabilidades:

- dashboard da igreja;
- membros;
- grupos;
- ministerios;
- contadores;
- status operacional da igreja.

### `churchQrService.ts`

Responsabilidades:

- criar formulario;
- gerar link/token;
- registrar eventos de visualizacao/envio;
- montar URL publica;
- gerar payload para download de QR;
- desativar campanhas.

### `pastoralCareService.ts`

Responsabilidades:

- caixa de entrada pastoral;
- transformar pedido em acompanhamento;
- atribuir responsavel;
- registrar status e notas;
- preservar privacidade.

### `memberChurchJourneyService.ts`

Responsabilidades:

- montar a area "Meu Acompanhamento na Igreja";
- listar retornos visiveis para o membro;
- buscar status publico de pedidos, formularios, voluntariado, convites e escalas;
- buscar designacoes ativas e pendentes do usuario;
- buscar equipes de servico, atividades, insignias e Mana recebido pelo usuario;
- separar status interno de status publico;
- carregar detalhes sob demanda;
- garantir que notas sensiveis e dados de outros membros nunca sejam retornados.

### `churchNotificationService.ts`

Responsabilidades:

- registrar eventos de notificacao e alerta;
- deduplicar notificacoes repetidas;
- separar notificacao de membro, gestor, pastor, lider e voluntario;
- gerar contadores leves para badges e cards;
- marcar notificacoes como lidas ou dispensadas;
- evitar que conteudo pastoral sensivel apareca no corpo da notificacao;
- ser usado por todos os fluxos do roadmap que mudarem status, responsavel, designacao, pedido, escala ou convite.

### `churchAnalyticsService.ts`

Responsabilidades:

- agregar indicadores;
- criar snapshots;
- montar cards do dashboard;
- alimentar relatorios sem consultas pesadas.

## 9. Rotas propostas

### Gestao interna

- `/gestao-igreja`
- `/gestao-igreja/pessoas`
- `/gestao-igreja/pedidos`
- `/gestao-igreja/qrcodes`
- `/gestao-igreja/voluntarios`
- `/gestao-igreja/ministerios`
- `/gestao-igreja/designacoes`
- `/gestao-igreja/equipes`
- `/gestao-igreja/insignias`
- `/gestao-igreja/grupos`
- `/gestao-igreja/relatorios`
- `/gestao-igreja/configuracoes`

### Area do membro

- `/minha-igreja`
- `/minha-igreja/acompanhamento`
- `/minha-igreja/pedidos`
- `/minha-igreja/voluntariado`
- `/minha-igreja/designacoes`
- `/minha-igreja/equipes`
- `/minha-igreja/insignias`
- `/minha-igreja/grupos`
- `/minha-igreja/escalas`

Essa area mostra apenas dados do proprio membro e retornos permitidos pela igreja.

### Publicas por QR

- `/qr/[token]`

Essa rota resolve:

- formulario de pedido de oracao;
- formulario de voluntariado;
- ficha de visitante;
- pedido de aconselhamento;
- inscricao em grupo/evento;
- check-in ou link do Culto+.

### Integracao com rotas existentes

- `/igreja/[churchSlug]`: exibir CTAs publicos gerados pela igreja, quando ativos.
- `/social/igreja/[churchSlug]`: manter o mesmo perfil social, com links para cultos e formularios.
- `/workspace-pastoral`: exibir atalho contextual para Gestao da Igreja apenas quando o usuario tambem tiver papel de gestao.
- `/workspace-pastoral/cultos`: continuar sendo a gestao completa de Culto+ no MVP, com links de ida e volta para Gestao da Igreja quando fizer sentido.
- `/oracoes/gerenciar`: continuar sendo editor de oracoes guiadas, nao caixa de entrada pastoral.
- `/competicao`: receber indicadores agregados da igreja quando Mana estiver ativado.
- `/`: pode exibir cards pessoais de "Minha Igreja" quando houver retornos pendentes para o membro.

## 10. Indicadores por maturidade

### Indicadores que podem nascer com dados existentes

Sem criar novas funcionalidades grandes, ja da para iniciar:

- total de membros (`memberships`);
- total de seguidores da igreja (`church_followers`);
- total de grupos/celulas (`cells`);
- pedidos de oracao por mural (`prayer_requests`);
- posts da igreja (`posts.church_id`);
- cultos criados (`church_services`);
- visitas em culto (`service_visits`);
- check-ins em culto (`service_checkins`);
- pedidos de oracao de culto (`service_prayer_requests`);
- reacoes em culto (`service_reactions`);
- escalas por culto (`service_schedule_assignments`);
- pendencias de escala;
- ministerios do Culto+ (`service_ministries`);
- membros por ministerio (`service_ministry_members`);
- Mana por igreja, se `mana_events` e snapshots estiverem aplicados.

### Indicadores que exigem novas funcionalidades

Dependem do novo modulo:

- QR Codes ativos por finalidade;
- scans de QR por campanha;
- taxa de conversao QR -> formulario enviado;
- pedidos recebidos por formulario;
- tempo ate primeiro contato pastoral;
- pedidos pastorais pendentes;
- acompanhamentos atrasados;
- interessados em voluntariado;
- voluntarios aprovados;
- voluntarios por atividade;
- equipes de servico ativas;
- atividades com falta de voluntarios;
- insignias concedidas por periodo;
- Mana de servico por igreja/equipe, quando ativado;
- ministerios com falta de pessoas;
- membros sem grupo;
- membros sem ministerio;
- visitantes novos;
- visitantes que retornaram;
- membros inativos por falta de atividade recente;
- tarefas pastorais por responsavel;
- status de pipeline de cuidado;
- relatorios agregados por periodo.

### Indicadores que devem ser evitados

Nao usar:

- nivel espiritual do membro;
- fe forte/fraca;
- membro quente/frio;
- ranking de santidade;
- qualidade espiritual individual.

Usar no lugar:

- participacao recente;
- vinculo com grupo;
- pedido de acompanhamento aberto;
- check-in em cultos;
- resposta a escala;
- conclusao de jornada;
- interacao comunitaria;
- data de ultimo contato.

## 11. Roadmap por etapas

### Etapa 0 - Alinhamento e guardrails

Objetivo:

Definir o escopo do modulo e evitar retrabalho antes de mexer no banco.

Entregas:

- aprovar nome do modulo: Gestao da Igreja;
- aprovar Gestao da Igreja como modulo independente, nao como area interna do Workspace Pastoral;
- aprovar rota principal: `/gestao-igreja`;
- aprovar papeis: Gestor da Igreja, Pastor, Lider, Voluntario;
- decidir se Visitante por QR pode enviar formulario sem login;
- decidir politica de privacidade para pedidos privados;
- decidir se Gestor pode ver conteudo pastoral sensivel ou apenas agregados;
- definir feature flag inicial: `church_management`;
- definir quais indicadores entram no MVP.
- definir um orcamento de queries para a primeira tela do modulo.
- classificar cada indicador como barato, moderado ou caro.

Impactos:

- produto;
- arquitetura;
- seguranca/RLS;
- navegacao global;
- UX de modulos independentes;
- comunicacao pastoral.

Criterios de aceite:

- matriz de permissoes aprovada;
- decisoes sensiveis documentadas;
- backlog quebrado em entregas pequenas.
- indicadores caros ficam fora do dashboard inicial ate existir snapshot ou contador.

### Etapa 1 - Fundacao de papeis e permissoes

Objetivo:

Criar a base de seguranca para os novos perfis antes das telas.

Entregas:

- criar tipos em `types.ts` para papeis de igreja;
- criar migration para `church_member_roles`;
- evoluir `memberships` com status e fonte, se necessario;
- criar `churchRoleService.ts`;
- criar helpers de permissao por papel e escopo;
- ajustar RLS para evitar que qualquer membro gerencie dados sensiveis;
- criar indices minimos junto com cada tabela nova;
- manter compatibilidade com `church_role_requests`;
- criar testes unitarios de permissao.

Impactos:

- `types.ts`;
- `services/supabase.ts`;
- novo service de roles;
- scripts SQL;
- Admin de aprovacao de igreja;
- `AuthContext` ou hooks de perfil, se precisar expor roles;
- rotas protegidas.

Ordem tecnica:

1. Tipos.
2. Migration.
3. Service.
4. RLS.
5. Testes.
6. UI minima de leitura dos roles.

Criterios de aceite:

- um usuario pode ter papel de Gestor, Pastor, Lider ou Voluntario em uma igreja;
- papeis sao separados de plano de assinatura;
- usuario sem papel nao acessa gestao;
- lider so acessa escopo permitido;
- testes cobrem os quatro papeis.

### Etapa 1A - Designacoes, atividades e equipes de servico

Objetivo:

Permitir que cada igreja configure atividades reais de servico, equipes de lideres/voluntarios e designacoes para pastores, lideres, voluntarios e membros, sem confundir atividade com permissao tecnica.

Entregas:

- criar `church_designation_templates`;
- criar `church_member_designations`;
- criar `church_service_teams`;
- criar `church_service_team_members`;
- criar `churchDesignationService.ts`;
- criar `churchServiceTeamService.ts`;
- criar area `/gestao-igreja/designacoes`;
- criar area `/gestao-igreja/equipes`;
- permitir templates personalizados por igreja;
- permitir categorias de atividade como:
  - cuidador de criancas;
  - portaria;
  - recepcao;
  - estacionamento/organizar carros;
  - limpeza e organizacao;
  - midia/projecao;
  - intercessao;
  - apoio em eventos;
- permitir designacoes com escopo:
  - igreja;
  - grupo/celula;
  - ministerio;
  - culto;
  - evento;
  - formulario;
- permitir criar grupos de lideres e grupos de voluntarios por atividade;
- permitir aceite/recusa de designacao pelo usuario quando configurado;
- exibir designacoes ativas e pendentes em `/minha-igreja/designacoes`;
- exibir equipes e atividades do usuario em `/minha-igreja/equipes`;
- gerar notificacao para atribuição, aceite, recusa, pausa, expiracao e remocao;
- gerar alerta para designacoes pendentes de aceite ou expirando;
- registrar historico basico de mudancas.

Impactos:

- `types.ts`;
- migrations SQL;
- `churchRoleService.ts`;
- `churchDesignationService.ts`;
- `churchServiceTeamService.ts`;
- `memberChurchJourneyService.ts`;
- `churchNotificationService.ts`;
- UI de Gestao da Igreja;
- Area do membro.

Criterios de aceite:

- igreja cria designacao personalizada sem alterar codigo;
- gestor cria atividade como "cuidador de criancas", "portaria" ou "organizar carros";
- gestor cria equipe de lideres ou voluntarios para uma atividade;
- gestor atribui designacao/atividade a pastor, lider ou voluntario;
- usuario recebe notificacao e consegue aceitar ou recusar quando aplicavel;
- designacao aparece no acompanhamento do usuario;
- designacao nao concede permissao sensivel sem role/escopo correspondente;
- equipe aparece para lideres e voluntarios autorizados;
- designacoes expiradas ou pendentes geram alertas;
- listas sao paginadas e filtradas por escopo/status.

### Etapa 2 - Identidade visual e shell do modulo Gestao da Igreja

Objetivo:

Criar a entrada visual premium, o design system do modulo e o dashboard inicial sem inventar dados.

Entregas:

- criar rota independente `/gestao-igreja`;
- criar identidade visual propria do modulo com tokens de cor, superficie, borda, estados e motion;
- criar layout com shell proprio, sidebar interna, header do modulo e abas internas;
- criar dashboard v0 com indicadores ja existentes;
- criar grid premium de cards para indicadores, acoes rapidas e pendencias;
- criar coluna "Atencao hoje" com poucos itens recentes e acionaveis;
- criar drawers laterais para detalhes sem recarregar a tela principal;
- criar motion base com `framer-motion`, respeitando `prefers-reduced-motion`;
- criar skeletons e estados vazios visualmente consistentes;
- criar `getChurchManagementSummary` ou equivalente para concentrar consultas baratas;
- criar estados vazios claros;
- adicionar atalho contextual no Workspace Pastoral apenas para usuarios com papel autorizado;
- adicionar item de menu apenas para quem tem papel autorizado;
- adicionar feature flag `church_management`;
- remover ou isolar dados mockados de membros no Workspace atual.

Indicadores v0:

- membros;
- seguidores;
- grupos;
- cultos;
- check-ins de Culto+;
- pedidos de oracao publicos;
- escalas pendentes;
- ministerios;
- Mana da igreja quando disponivel.

Impactos:

- `app/gestao-igreja/page.tsx`;
- nova view `ChurchManagementPage`;
- novos componentes visuais do modulo em `components/church-management/`;
- `components/Sidebar/Sidebar.tsx`;
- `components/workspace/WorkspaceOnePage.tsx`, apenas para atalho contextual;
- `contexts/FeatureContext.tsx`;
- `services/churchManagementService.ts`;
- testes Playwright da nova rota.
- indices/contadores existentes do Supabase.

Criterios de aceite:

- Gestor da Igreja ve a nova area sem precisar ser pastor;
- Pastor ve a nova area apenas se tambem tiver papel autorizado de gestao ou permissao pastoral especifica;
- usuario comum nao ve ou recebe bloqueio correto;
- dashboard nao usa mock;
- cada indicador informa origem do dado;
- tela carrega bem com igreja sem dados.
- primeira tela nao carrega listas completas de membros, pedidos, cultos ou grupos.
- detalhes sao carregados apenas ao abrir aba ou item.
- modulo tem identidade visual propria sem parecer fora do BibliaLM.
- cards, botoes, drawers e abas funcionam bem em mobile e desktop.
- motion nao bloqueia uso, nao cria layout shift e respeita reducao de movimento.
- contraste, foco de teclado e areas clicaveis seguem acessibilidade minima.

### Etapa 3 - Pessoas, membros e lideranca

Objetivo:

Transformar a igreja em uma base operacional real de pessoas.

Entregas:

- diretorio de membros da igreja;
- filtros por grupo, papel, ministerio, status e atividade;
- paginacao obrigatoria desde o MVP;
- edicao de status de membro;
- atribuicao de papeis;
- atribuicao de designacoes personalizadas;
- vinculacao com grupos/celulas;
- visualizacao de vinculo com ministerios;
- historico basico de entrada;
- acao "convidar para grupo" reaproveitando convites existentes;
- substituir blocos mockados no Workspace por dados reais.

Impactos:

- `memberships`;
- `church_member_roles`;
- `church_member_designations`;
- `cells`;
- `service_ministry_members`;
- `views/public/ChurchProfilePage.tsx`;
- `components/workspace/WorkspaceOnePage.tsx`;
- novo componente `ChurchPeopleTab`.

Criterios de aceite:

- Gestor consegue ver membros reais;
- lista de membros usa projection explicita e paginacao;
- Gestor atribui Pastor, Lider e Voluntario;
- Gestor atribui designacao personalizada sem dar permissao indevida;
- Lider ve apenas seu escopo;
- Voluntario nao acessa diretorio amplo;
- membros sem grupo/ministerio podem ser identificados.

### Etapa 4 - Motor de QR Codes e formularios

Objetivo:

Permitir que a igreja gere QR Codes para pedidos de oracao, voluntariado, visitantes e outros fluxos.

Entregas:

- criar `church_forms`;
- criar `church_qr_links`;
- criar `church_form_submissions`;
- criar `church_qr_events`;
- criar `churchQrService.ts`;
- criar area `/gestao-igreja/qrcodes`;
- criar rota publica `/qr/[token]`;
- criar templates iniciais:
  - Pedido de oracao;
  - Quero ser voluntario;
  - Sou visitante;
  - Quero conversar com o pastor;
  - Quero entrar em um grupo;
  - Inscricao em evento.
- gerar link curto;
- exibir QR Code na tela;
- baixar imagem do QR para impressao/slide;
- registrar visualizacao e envio.
- deduplicar eventos de scan por sessao quando possivel.
- criar indices para `token`, `church_id`, `form_id` e `created_at`.

Impactos:

- nova migration SQL;
- novo service;
- nova rota publica;
- dashboard da igreja;
- pagina publica da igreja;
- Culto+ pode futuramente usar o mesmo motor.

Criterios de aceite:

- usuario autorizado cria QR de pedido de oracao em menos de 1 minuto;
- QR abre formulario publico no celular;
- envio aparece na caixa correta;
- gestor baixa imagem do QR;
- QR pode ser desativado;
- contadores mostram scans e envios.
- rota `/qr/[token]` resolve o formulario com uma query indexada por token.
- dashboard nao recalcula scans lendo todos os eventos.

### Etapa 5 - Caixa pastoral de pedidos e cuidado

Objetivo:

Unificar pedidos de oracao, pedidos privados, formularios e acompanhamentos em uma fila pastoral.

Entregas:

- criar `pastoral_care_items`;
- criar `pastoral_care_notes`;
- criar `pastoralCareService.ts`;
- criar aba `Pedidos e Cuidado`;
- listar pedidos com paginacao e filtros por status/prioridade/responsavel;
- importar fontes:
  - `prayer_requests`;
  - `service_prayer_requests`;
  - `church_form_submissions`;
  - entradas manuais;
- criar status:
  - novo;
  - em triagem;
  - atribuido;
  - contato feito;
  - em oracao;
  - acompanhamento;
  - encerrado;
- atribuir responsavel;
- marcar prioridade;
- registrar follow-up;
- criar alertas de atraso;
- preservar notas sensiveis separadas.
- carregar notas sensiveis somente ao abrir o item.

Impactos:

- oracoes;
- Culto+;
- QR/forms;
- notificacoes;
- RLS;
- dashboard.

Criterios de aceite:

- pedido de QR aparece na caixa pastoral;
- pedido privado nao aparece publicamente;
- Pastor pode atribuir pedido a lider autorizado;
- Gestor sem permissao pastoral ve apenas agregados;
- item atrasado aparece como pendencia.
- inbox inicial busca apenas itens abertos recentes e contadores por status.
- notas pastorais nao sao carregadas em lote.

### Etapa 5A - Meu Acompanhamento na Igreja

Objetivo:

Criar a contrapartida do membro para tudo que nasce ou passa pela Gestao da Igreja.

Essa area nao e administrativa. Ela existe para que o membro tenha retorno claro, privado e pastoralmente cuidadoso sobre pedidos, formularios, voluntariado, grupos, escalas e acompanhamentos.

Entregas:

- criar rota `/minha-igreja/acompanhamento`;
- criar `memberChurchJourneyService.ts`;
- criar lista paginada de retornos do membro;
- criar cards de status publico:
  - pedido recebido;
  - em analise;
  - responsavel atribuido, quando puder aparecer;
  - contato agendado;
  - aguardando resposta do membro;
  - aprovado;
  - encaminhado;
  - encerrado;
- criar detalhe do item com historico permitido;
- exibir proximas acoes do membro:
  - responder contato;
  - confirmar disponibilidade;
  - aceitar convite de grupo;
  - confirmar escala;
  - atualizar dados de contato;
- criar notificacoes simples para mudanca de status;
- criar estados vazios por igreja;
- criar texto de privacidade explicando quem pode ler cada tipo de pedido.

Impactos:

- nova area `/minha-igreja`;
- `church_form_submissions`;
- `pastoral_care_items`;
- `service_schedule_assignments`;
- `service_ministry_members`;
- convites de grupos/celulas;
- notificacoes;
- RLS;
- pagina inicial do membro, se houver card de pendencias.

Criterios de aceite:

- membro ve que seu pedido por QR foi recebido;
- membro consegue acompanhar status publico sem ver notas internas;
- membro ve convites, escalas e proximas acoes em uma area unica;
- membro nao ve dados de outros membros;
- status interno sensivel e traduzido para linguagem simples;
- area inicial carrega apenas poucos itens recentes e usa paginacao;
- detalhes sao carregados somente ao abrir um item;
- pedido privado continua privado mesmo dentro da area do membro.

### Etapa 6 - Voluntariado, ministerios e escalas

Objetivo:

Ligar pedido de voluntariado por QR aos ministerios, atividades de servico, equipes de voluntarios, reconhecimento por insignias e escalas do Culto+.

Entregas:

- formulario de interesse em servir;
- listagem paginada de interessados;
- pipeline de voluntariado:
  - novo interesse;
  - em conversa;
  - aprovado;
  - vinculado a ministerio;
  - recusado/arquivado;
- vincular interessado a `service_ministries`;
- atribuir designacao de voluntario conforme ministerio;
- vincular voluntario a equipe de servico;
- configurar atividades como criancas, portaria, recepcao, estacionamento e apoio em eventos;
- criar catalogo padrao de conquistas de servico, lideranca e pastoreio;
- registrar Mana de voluntariado quando uma escala/atividade for concluida;
- area do voluntario para ver suas escalas;
- area do voluntario para ver equipes, atividades, insignias e Mana recebido;
- disponibilidade do voluntario;
- confirmacao/recusa/substituicao usando fluxo do Culto+;
- notificacoes internas;
- indicador de ministerios com falta de pessoas.
- indicador de equipes com falta de voluntarios.
- ranking publico de voluntarios nao entra no MVP.

Impactos:

- `service_ministries`;
- `service_ministry_members`;
- `service_schedule_assignments`;
- `church_service_teams`;
- `church_service_team_members`;
- `church_volunteer_badges`;
- `church_member_badges`;
- `mana_events`;
- `church_form_submissions`;
- `church_member_roles`;
- `components/culto-plus/CultoPlusManager.tsx`;
- nova aba `Voluntarios e Ministerios`.

Criterios de aceite:

- pessoa envia interesse via QR;
- gestor aprova e vincula a ministerio;
- voluntario recebe papel `volunteer`;
- voluntario recebe designacao visivel no proprio acompanhamento;
- voluntario entra em equipe de servico;
- voluntario recebe conquista quando criterio padrao do BibliaLM for cumprido;
- Mana de servico e registrado de forma limitada e auditavel;
- voluntario ve escala e confirma;
- dashboard mostra pendencias de escala.
- voluntario ve suas insignias em `/minha-igreja/insignias`.
- indicadores de ministerio usam contadores ou consultas limitadas, nao varredura de todas as escalas.

### Etapa 7 - Grupos, discipulado e conteudo da igreja

Objetivo:

Conectar o modulo de gestao com salas, planos, grupos, estudos e jornada de discipulado.

Entregas:

- aba `Grupos e Discipulado`;
- listar grupos/celulas;
- listar lideres e membros por grupo;
- ver salas/planos vinculados a igreja;
- acompanhar inscricoes e progresso agregado;
- carregar progresso detalhado apenas dentro do grupo/sala selecionado;
- criar sala a partir da gestao da igreja com contexto preenchido;
- permitir Lider criar conteudo para seu grupo, se autorizado;
- indicadores de grupos ativos, salas ativas e participantes.

Impactos:

- `custom_plans`;
- `plan_participants`;
- `cells`;
- `WorkspaceProvider`;
- rotas de criar sala/conteudo;
- `utils/contentPrivacy.ts`.

Criterios de aceite:

- gestor ve grupos reais;
- lider ve progresso do seu grupo;
- sala criada pela igreja ja nasce com `churchId`;
- indicador de discipulado nao expoe respostas privadas.
- dashboard mostra apenas agregados leves de grupos e salas.

### Etapa 8 - Analytics e relatorios

Objetivo:

Transformar dados operacionais em indicadores confiaveis e historicos.

Entregas:

- criar `church_analytics_snapshots`;
- criar `churchAnalyticsService.ts`;
- gerar snapshots por dia/semana/mes;
- priorizar snapshot manual ou sob demanda no inicio, antes de cron automatico;
- criar dashboard com tendencias;
- criar filtros por periodo;
- criar exportacao CSV;
- integrar Mana snapshots;
- criar cards por area:
  - Pessoas;
  - Cuidado;
  - QR/forms;
  - Voluntariado;
  - Cultos;
  - Grupos;
  - Conteudo;
  - Mana.

Impactos:

- Supabase;
- cron/job ou funcao manual de refresh;
- dashboard;
- admin/monitoramento;
- testes de agregacao.

Criterios de aceite:

- dashboard nao depende de consultas pesadas em tempo real;
- indicador tem periodo e origem;
- filtros funcionam;
- exportacao nao inclui dados sensiveis indevidos;
- igrejas pequenas nao ficam com ranking injusto quando houver comparacao.
- relatorios historicos leem snapshots, nao tabelas transacionais completas.
- exportacao grande deve ser acao explicita, nunca carregamento automatico da tela.

### Etapa 9 - Comunicacao, automacoes e notificacoes

Objetivo:

Reduzir trabalho manual da equipe pastoral sem automatizar cuidado humano e garantir que todo fluxo do roadmap gere notificacoes, alertas e feedback para o usuario correto.

Entregas:

- criar `church_notification_events`;
- criar `churchNotificationService.ts`;
- definir matriz de eventos por fluxo;
- notificacao para novo pedido urgente;
- lembrete de follow-up;
- lembrete de escala pendente;
- aviso para voluntario confirmar escala;
- mensagem para lider quando membro entra no grupo;
- notificacao para designacao atribuida, aceita, recusada, pausada, expirada ou removida;
- notificacao para mudanca de status visivel ao membro;
- alerta para gestor/pastor quando houver item sem responsavel;
- alerta para lider quando houver pedido atribuido ao seu escopo;
- alerta para QR/formulario expirado, pausado ou com aumento incomum de envios;
- badge de pendencias por area;
- tarefas pastorais simples;
- historico de notificacoes.

Impactos:

- `notifications`;
- `AuthContext`;
- service de cuidado;
- service de escalas;
- service de designacoes;
- service de QR/forms;
- caixa pastoral;
- area do membro;
- dashboard da gestao.

Criterios de aceite:

- responsavel e notificado quando pedido e atribuido;
- voluntario recebe lembrete de escala;
- follow-up atrasado aparece no dashboard;
- notificacoes podem ser reduzidas ou desativadas.
- toda mudanca relevante do roadmap possui evento de notificacao mapeado;
- membro recebe feedback quando um pedido, interesse, convite, escala ou designacao muda de status;
- notificacoes sensiveis nao exibem conteudo privado no preview;
- alertas urgentes sao deduplicados para evitar spam;
- badges usam contadores leves, nao varredura de notificacoes.

### Etapa 10 - Modulos avancados futuros

Nao colocar no MVP, mas manter arquitetura preparada.

Possiveis evolucoes:

- multi-campus;
- agenda pastoral completa;
- visitas pastorais;
- controle de eventos maiores;
- check-in geral fora do Culto+;
- certificados ou presenca em cursos;
- integracoes externas de comunicacao;
- relatorios financeiros, se virar escopo do BibliaLM;
- CRM pastoral avancado.

## 12. Ordem recomendada de implantacao

Ordem prioritaria:

1. Etapa 0 - alinhamento e guardrails.
2. Etapa 1 - roles e permissoes.
3. Etapa 1A - designacoes personalizaveis.
4. Etapa 2 - identidade visual, shell independente e dashboard com dados existentes.
5. Etapa 4 - QR Codes e formularios.
6. Etapa 5 - caixa pastoral de pedidos e cuidado.
7. Etapa 5A - Meu Acompanhamento na Igreja.
8. Etapa 3 - pessoas e lideranca.
9. Etapa 6 - voluntariado, ministerios e escalas.
10. Etapa 7 - grupos e discipulado.
11. Etapa 9 - comunicacao, notificacoes e alertas.
12. Etapa 8 - analytics e relatorios.

Justificativa:

- Roles precisam vir antes de telas sensiveis.
- Designacoes precisam vir cedo porque afetam pastor, lider, voluntario, membro e feedback ao usuario.
- Shell independente evita amarrar gestor, pastor e criador de conteudo na mesma experiencia.
- Identidade visual propria deve vir antes dos fluxos para evitar refatoracao visual grande depois.
- Dashboard v0 ajuda a validar valor rapidamente usando dados existentes.
- Dashboard v0 precisa ser barato: resumo unico, contadores ou queries indexadas.
- QR/forms cria novos dados e destrava pedidos reais.
- Caixa pastoral vem logo depois porque QR sem inbox vira apenas formulario solto.
- Area do membro vem logo depois da inbox para fechar o ciclo de retorno e nao deixar o membro sem resposta.
- Pessoas e voluntariado consolidam a operacao.
- Notificacoes e alertas devem ser padronizados antes de automacoes e analytics avancado.
- Analytics completo deve vir depois de fluxo operacional, nao antes.
- Analytics avancado entra somente quando houver volume e snapshot.

## 13. Impacto por area do BibliaLM

### Gestao da Igreja

Impacto alto.

Mudancas:

- criar modulo independente com rota, menu, feature flag e permissoes proprias;
- centralizar operacao da igreja sem exigir que o usuario seja pastor;
- usar `churchId` como eixo de integracao com Culto+, Reino, grupos, oracoes, Mana e pagina publica;
- separar visao administrativa, pastoral e de lideranca por role e escopo.

### Area do Membro

Impacto alto.

Mudancas:

- criar uma experiencia "Minha Igreja" para retornos pessoais;
- mostrar pedidos, formularios, convites, escalas e acompanhamentos visiveis ao proprio membro;
- traduzir status interno da gestao para linguagem simples e pastoral;
- permitir que o membro responda proximas acoes sem entrar na area administrativa;
- exibir designacoes ativas, pendentes, expiradas e historico permitido;
- entregar feedback quando designacoes, convites, pedidos e escalas mudarem de status;
- proteger notas pastorais, dados de outros membros e informacoes internas da equipe.

### Designacoes e notificacoes

Impacto alto.

Mudancas:

- permitir designacoes personalizaveis por igreja;
- separar designacao, role e permissao tecnica;
- gerar notificacoes e alertas para todos os fluxos relevantes;
- criar feedback visivel para usuario afetado por designacao, pedido, convite ou escala;
- criar badges e contadores leves para evitar consultas caras;
- implementar preferencias basicas de notificacao por igreja no MVP e deixar preferencias granulares por usuario para fase futura.

### Design system e navegacao

Impacto medio/alto.

Mudancas:

- criar tokens visuais especificos para Gestao da Igreja sem duplicar todo o design system;
- adicionar componentes reutilizaveis de card, status badge, metric card, action card, drawer e empty state;
- usar `lucide-react` como biblioteca padrao de icones;
- usar `framer-motion` apenas para transicoes curtas e microinteracoes;
- manter acessibilidade, contraste, foco e responsividade como criterios de aceite;
- revisar sidebar global para expor Gestao da Igreja como modulo independente quando houver role.

### Workspace Pastoral

Impacto medio.

Mudancas:

- continuar focado em criacao pastoral, estudos, salas, oracoes guiadas e apoio ao pastor;
- exibir atalho contextual para Gestao da Igreja apenas quando o usuario tambem tiver papel autorizado;
- remover ou isolar dados mockados de membros/equipes para nao gerar indicadores falsos;
- compartilhar contexto de igreja com o novo modulo quando houver `churchId`;
- nao concentrar gestao administrativa da igreja dentro do workspace.

### Pagina da Igreja

Impacto medio.

Mudancas:

- exibir CTAs publicos da igreja;
- destacar QR/forms ativos quando permitido;
- manter cultos e mural;
- permitir entrada de responsaveis na gestao.

### Culto+

Impacto alto, mas incremental.

Mudancas:

- reaproveitar roles;
- futuramente usar motor generico de QR;
- integrar pedidos do culto com caixa pastoral;
- integrar escalas com voluntariado amplo;
- alimentar analytics geral da igreja.

### Oracoes

Impacto alto.

Mudancas:

- separar oracao guiada de pedido de oracao;
- pedidos de oracao viram fonte da caixa pastoral;
- pedidos privados precisam de RLS forte.

### Reino/Social

Impacto medio.

Mudancas:

- posts da igreja entram como sinal de engajamento;
- mural da igreja continua publico/comunitario;
- cuidado pastoral nao deve acontecer dentro do feed aberto.

### Grupos/Celulas

Impacto medio/alto.

Mudancas:

- Lider ganha escopo real;
- grupo alimenta indicadores;
- convites e planos se conectam a gestao.

### Mana/Competicao

Impacto medio.

Mudancas:

- indicadores de igreja podem compor progresso coletivo;
- servico voluntario pode gerar Mana quando houver evento auditavel;
- insignias podem reconhecer constancia, disponibilidade e servico;
- cuidado para Mana nao virar pressao espiritual;
- usar apenas eventos auditaveis.
- evitar ranking individual publico de voluntarios no MVP.

### Admin

Impacto medio.

Mudancas:

- aprovar solicitacoes de responsabilidade continua existindo;
- pode evoluir para auditoria de igreja;
- feature flags e roles sensiveis precisam ser visiveis.

## 14. Roadmap de QR Codes

### MVP de QR

Tipos:

1. Pedido de oracao
2. Quero ser voluntario
3. Sou visitante
4. Quero conversar com o pastor
5. Quero entrar em um grupo

Fluxo:

1. Usuario autorizado cria formulario.
2. Sistema gera token e URL.
3. Sistema exibe QR.
4. Usuario autorizado baixa a imagem.
5. Igreja coloca em slide, cartaz ou recepcao.
6. Pessoa abre no celular.
7. Pessoa envia resposta.
8. Resposta cai na inbox correta.
9. Dashboard registra scan/envio.

Campos configuraveis iniciais:

- nome;
- telefone/email;
- mensagem;
- preferencia de contato;
- permitir envio anonimo;
- privacidade;
- responsavel pelo recebimento;
- mensagem de confirmacao.

Criterios pastorais:

- pedido privado nao aparece no mural;
- pedido de aconselhamento deve ser restrito;
- pessoa deve saber quem pode ler o pedido;
- formulario publico deve ter texto simples e acolhedor.

## 15. Matriz resumida de permissoes

| Acao | Gestor da Igreja | Pastor | Lider | Voluntario |
| --- | --- | --- | --- | --- |
| Ver dashboard geral | Sim | Parcial | Parcial | Nao |
| Editar dados da igreja | Sim | Parcial | Nao | Nao |
| Atribuir roles | Sim | Se permitido | Nao | Nao |
| Criar designacoes personalizadas | Sim | Se permitido | Nao | Nao |
| Atribuir designacoes | Sim | Se permitido | Escopo | Nao |
| Aceitar/recusar propria designacao | Sim | Sim | Sim | Sim |
| Criar equipes de servico | Sim | Se permitido | Escopo | Nao |
| Gerir equipe de servico | Sim | Se permitido | Escopo | Nao |
| Ver propria equipe/atividade | Sim | Sim | Sim | Sim |
| Ver regras de conquistas padrao | Sim | Sim | Sim | Sim |
| Ver proprias insignias e Mana | Sim | Sim | Sim | Sim |
| Ver membros | Sim | Parcial | Escopo | Nao |
| Ver pedidos privados | Apenas se permitido | Sim | Se atribuido | Nao |
| Criar QR/formulario | Sim | Se permitido | Escopo | Nao |
| Ver submissoes de voluntariado | Sim | Parcial | Escopo | Nao |
| Gerir ministerios | Sim | Se permitido | Escopo | Nao |
| Confirmar escala propria | Sim | Sim | Sim | Sim |
| Criar culto | Sim | Sim | Se permitido | Nao |
| Ver relatorios agregados | Sim | Parcial | Escopo | Nao |
| Exportar relatorios | Sim | Parcial | Nao | Nao |
| Ver proprio acompanhamento | Sim | Sim | Sim | Sim |
| Ver acompanhamento de outro membro | Se permitido | Se permitido | Se atribuido | Nao |
| Responder propria proxima acao | Sim | Sim | Sim | Sim |
| Receber notificacoes e alertas | Sim | Sim | Sim | Sim |

## 16. Criterios de sucesso do modulo

### Produto

- igreja consegue gerar QR Code util em poucos minutos;
- pedidos chegam em uma caixa organizada;
- lideranca sabe o que esta pendente;
- voluntario entende onde servir e confirmar escala;
- membro acompanha retorno dos pedidos, convites, voluntariado e escalas em uma area propria;
- pastor ve cuidado pendente sem procurar em varias telas;
- indicadores nascem de dados reais.

### Tecnico

- roles separados de assinatura;
- RLS protege pedidos sensiveis;
- services centralizam banco;
- tipos ficam em `types.ts`;
- dashboard usa agregados quando possivel;
- area do membro usa service proprio e nao consulta diretamente dados sensiveis;
- testes cobrem permissoes e fluxos principais.

### UI/UX

- modulo possui cor propria e identidade reconhecivel;
- usuario entende que esta em uma area independente do Workspace Pastoral;
- primeira tela parece premium, mas continua operacional e escaneavel;
- cards trazem acao e origem do dado, nao apenas numeros soltos;
- motion melhora feedback sem prejudicar performance;
- experiencia mobile preserva as acoes principais;
- membro entende o status dos seus pedidos sem precisar conhecer o fluxo interno da equipe;
- usuarios com reducao de movimento continuam tendo uma experiencia estavel;
- modo claro e escuro mantem contraste e legibilidade.

### Pastoral

- linguagem acolhedora;
- sem ranking espiritual individual;
- privacidade clara;
- retorno ao membro e acolhedor, objetivo e sem expor bastidores pastorais;
- acompanhamento humano no centro;
- IA apenas como apoio, nao substituto de cuidado pastoral.

## 17. Riscos e mitigacoes

### Risco: criar dashboard bonito sem dados confiaveis

Mitigacao:

- MVP usar apenas indicadores de fontes existentes;
- marcar indicador como "em construcao" quando depender de nova funcao;
- criar snapshots depois dos fluxos operacionais.

### Risco: custo subir por consultas pesadas no MVP

Mitigacao:

- dashboard inicial deve usar `getSummary`, contadores, queries indexadas ou snapshots;
- evitar `select('*')` em telas de gestao;
- todas as listas devem ser paginadas;
- detalhes e notas sensiveis carregam sob demanda;
- realtime fica desativado por padrao fora de experiencias ao vivo;
- revisar queries com dados reais antes de liberar analytics avancado.

### Risco: visual premium virar interface pesada

Mitigacao:

- cards devem ser funcionais e acionaveis, nao decorativos;
- motion deve ser curta, cancelavel por `prefers-reduced-motion` e sem animacao continua;
- primeira tela nao deve carregar graficos pesados no MVP;
- usar skeletons simples e componentes reaproveitaveis;
- limitar sombras, transparencias e blur em mobile;
- usar prata/metalizado como acabamento visual, nao como cor de texto ou botao sem contraste;
- validar contraste de grafite, prata e dourado em modo claro e escuro;
- validar com Playwright em desktop e mobile antes de liberar.

### Risco: permissao fraca expor dados sensiveis

Mitigacao:

- Etapa 1 obrigatoria antes de inbox pastoral;
- RLS por papel e escopo;
- notas sensiveis em tabela separada;
- testes de acesso por papel.

### Risco: confundir plano pago com papel de igreja

Mitigacao:

- `subscriptionTier` continua plano comercial;
- `church_member_roles` define papel eclesiastico;
- UI mostra ambos de forma distinta.

### Risco: designacao virar permissao indevida

Mitigacao:

- designacao nao concede acesso sensivel automaticamente;
- role e escopo continuam sendo a fonte de permissao;
- templates de designacao podem sugerir permissoes, mas nao aplicar sem aprovacao;
- toda atribuicao sensivel deve ser auditavel;
- area do membro mostra titulo/funcao, nao bastidores administrativos.

### Risco: QR virar formulario solto

Mitigacao:

- QR/forms e inbox pastoral devem ser entregues em sequencia curta;
- todo formulario precisa de destino;
- todo envio precisa de status.
- area do membro deve mostrar pelo menos "recebido" e "ultima atualizacao" quando houver identificacao do usuario.

### Risco: membro ficar sem retorno visivel

Mitigacao:

- criar "Meu Acompanhamento na Igreja" logo depois da inbox pastoral;
- cada item recebido deve ter status publico;
- status interno deve ser mapeado para linguagem simples;
- notificacoes devem avisar mudancas importantes;
- quando nao houver resposta detalhada, mostrar ao menos recebimento, privacidade e proximo passo esperado;
- nao prometer prazo automatico se a igreja nao configurou SLA.

### Risco: sobrecarregar o pastor com notificacoes

Mitigacao:

- prioridade;
- atribuicao a lideres;
- resumo diario;
- configuracao de notificacoes.

### Risco: notificacoes virarem ruido

Mitigacao:

- deduplicar eventos por `dedupe_key`;
- agrupar eventos repetidos em resumo;
- separar notificacao informativa de alerta acionavel;
- permitir marcar como lido/dispensar;
- nao enviar notificacao para cada microalteracao sem impacto para o usuario;
- criar preferencias futuras por tipo de evento.

### Risco: metricas virarem vigilancia

Mitigacao:

- usar indicadores agregados;
- evitar labels espirituais;
- permitir anonimato ou privacidade em rankings;
- mostrar dados pessoais apenas quando houver finalidade pastoral legitima.

### Risco: insignias e Mana virarem competicao espiritual

Mitigacao:

- tratar insignias como reconhecimento de servico, nao medicao espiritual;
- evitar ranking individual publico de voluntarios no MVP;
- permitir visibilidade privada ou apenas para equipe;
- limitar Mana por evento auditavel para evitar abuso;
- nao atribuir Mana para pedidos pastorais sensiveis;
- comunicar que reconhecimento nao mede valor da pessoa diante de Deus.

## 18. Primeiro MVP recomendado

Escopo do primeiro corte:

1. Roles e permissoes.
2. Rota independente `/gestao-igreja`.
3. Identidade visual v0 do modulo: prata/platina, grafite, shell, cards e motion leve.
4. Designacoes v0: atividades personalizaveis, equipes simples, atribuicao, aceite/recusa e feedback ao usuario.
5. Notificacoes v0: eventos essenciais, badges leves e alertas acionaveis.
6. Dashboard v0 com dados existentes.
7. Motor QR/forms para pedido de oracao e voluntariado.
8. Inbox simples para submissoes.
9. Meu Acompanhamento v0 para o membro ver recebimento e status publico.
10. Atribuicao de responsavel.
11. Status basico do pedido.
12. Padrao de queries economicas nos services: summary, list paginado e detail sob demanda.

Nao incluir no primeiro corte:

- analytics avancado;
- multi-campus;
- financeiro;
- automacoes complexas;
- relatorios exportaveis amplos;
- CRM pastoral completo.
- realtime amplo;
- timeline completa do membro;
- chat direto membro-equipe pastoral;
- automacoes avancadas de notificacao;
- preferencias granulares por canal;
- templates complexos de designacao com workflow multiaprovador;
- gamificacao avancada de voluntariado;
- ranking publico individual de voluntarios;
- ranking interno detalhado;
- varreduras historicas em tempo real.
- animacoes decorativas continuas;
- graficos complexos na primeira tela;
- personalizacao visual avancada por igreja.

Definicao de pronto do MVP:

- Gestor da Igreja acessa Gestao da Igreja sem precisar ser pastor.
- Pastor acessa Gestao da Igreja apenas quando tiver role/permissao compativel.
- Usuario comum nao acessa.
- Modulo abre com identidade visual propria e nao parece uma aba do Workspace Pastoral.
- Dashboard usa cards premium, acionaveis e responsivos.
- Motion leve funciona sem layout shift e respeita reducao de movimento.
- Gestor cria designacao personalizada simples.
- Gestor cria atividade de servico como criancas, portaria ou estacionamento.
- Gestor cria equipe simples de lideres ou voluntarios.
- Usuario recebe notificacao ao receber designacao e consegue aceitar/recusar quando aplicavel.
- Usuario autorizado cria QR de pedido de oracao.
- Pessoa envia pedido via celular.
- Pedido aparece na inbox.
- Responsavel pastoral autorizado atribui, muda status e encerra.
- Membro ve status publico do proprio pedido em `/minha-igreja/acompanhamento`.
- Usuario autorizado cria QR de voluntariado.
- Pessoa envia interesse.
- Interesse aparece na inbox/pipeline.
- Membro ve status publico do interesse em voluntariado.
- Voluntario ve atividade/equipe em que serve.
- Voluntario pode receber conquista padrao por servico.
- Mana de servico pode ser registrado apenas para evento auditavel e limitado.
- Notificacoes essenciais aparecem para novo pedido, atribuicao, mudanca de status, designacao e escala pendente.
- Alertas acionaveis aparecem no dashboard sem varrer todos os eventos.
- Dashboard mostra contadores iniciais reais.
- Dashboard inicial nao carrega listas completas.
- Todas as listas do MVP possuem limite e paginacao.
- QR e formularios usam lookup por token indexado.
- Nenhum relatorio historico pesado e carregado automaticamente.

## 19. Parecer dos papeis de decisao

### CTO

Recomendacao:

- nao implementar indicadores avancados antes dos eventos operacionais;
- separar roles de assinatura agora, para nao pagar juros arquiteturais depois;
- priorizar RLS e services antes de UI sensivel com dados reais;
- usar feature flag para lancamento gradual;
- reaproveitar Culto+, Reino, grupos, oracoes e Mana.
- estabelecer orcamento de query por tela antes de codar.
- medir custo real antes de liberar analytics avancado.

### Arquiteto

Recomendacao:

- manter `types.ts` como contrato global;
- criar services dedicados;
- evitar duplicar tabelas ja existentes sem motivo;
- unificar por `churchId`;
- tratar QR como link rastreavel e formulario como entidade;
- usar snapshots para analytics.
- todo service novo deve expor chamadas separadas de summary, list e detail.
- indices devem nascer junto com tabelas novas, nao depois da primeira crise.

### Pastor

Recomendacao:

- tratar pedidos como cuidado, nao como ticket frio;
- privacidade precisa estar clara para quem envia;
- metricas devem ajudar a lembrar pessoas e pendencias;
- nao classificar espiritualidade;
- todo conteudo pastoral sensivel deve ter acesso restrito.

## 20. Decisões Consolidadas (MVP)

Após deliberação, as seguintes regras guiarão a construção do módulo Gestão da Igreja:

### Acesso e Cadastro
- **Visitantes e QR Codes**: Visitantes não podem fazer check-in sem login. O acesso para enviar formulários ou pedidos via QR Code também exigirá autenticação do usuário.
- **Rota do Módulo**: A rota será `/gestao-igreja`. Ela será exibida para o usuário logado com papel de Pastor ou Gestor da Igreja. Usuários comuns que não tiverem o papel poderão solicitar a "Gestão da Igreja", o que criará um fluxo de aprovação a ser gerido pelos administradores do app.
- **Culto+**: O submódulo de cultos sairá do Workspace Pastoral e ficará acessível dentro do módulo de Gestão, através da rota `/gestao-igreja/cultos`.

### Privacidade e Cuidado
- **Pedidos Privados**: Pedidos marcados como privados só poderão ser lidos diretamente pelo Pastor escolhido pelo membro. Gestores e demais pastores não têm acesso por padrão.
- **Acesso do Líder**: O líder do grupo/célula poderá ver automaticamente os pedidos associados aos membros de seu grupo ou designados ao seu escopo.
- **Inativos**: Indicadores de membros inativos mostrarão nominalmente quem são os membros (não apenas números agregados).

### Papéis e Designações
- **Múltiplos Papéis**: Um usuário poderá ter mais de um papel simultaneamente (ex: Pastor e Líder de Grupo).
- **Gestão da Igreja**: Para evitar acessos indevidos, a atribuição inicial de "Gestor da Igreja" deve passar por um fluxo de aprovação controlado pela plataforma (admin).
- **Aceite de Designação**: Toda designação exigirá um aceite ou recusa formal por parte do usuário designado.
- **Perfil Público**: O usuário poderá optar por exibir ou não suas designações ativas no seu perfil público.
- **Categorias Iniciais**: Serão disponibilizados todos os templates de categorias para servir (crianças, portaria, recepção, estacionamento, limpeza, mídia, intercessão, etc.).

### Formulários, Notificações e Comunicação
- **QR Codes e Formulários**: Utilizarão templates fixos para o MVP. As datas de validade dos QRs serão personalizadas pelo pastor ou gestor. A igreja poderá configurar padrões para as mensagens de retorno automático.
- **Acompanhamento (Área do Membro)**: A área do membro chamará **Minha Igreja**, contendo todos os fluxos de retorno (pedidos, voluntariado, grupos, escalas) e submenus caso o usuário seja líder ou voluntário para ver atribuições específicas. Apenas usuários autenticados poderão acessar esta área.
- **Equipes de Serviço**: Não haverá chat interno para as equipes de voluntários/líderes no MVP; a comunicação será restrita aos alertas de convite e aceite.
- **Notificações**: Serão divididas em 3 grandes grupos visuais/caixas (Notificações do Reino/App, Notificações de Gestão da Igreja e Notificações de Minha Igreja). Usaremos o alerta central (ícone de sino) indicando se há novidades na aba de Gestão ou Minha Igreja. O usuário não precisará configurar preferências manuais no MVP.

### UI, Analytics e Gamificação
- **UI/UX**: O título da página sempre irá identificar a área em que o usuário está, abandonando sidebars fixas pesadas na navegação principal.
- **Indicadores**: Nos cards de dashboard, os indicadores mostrarão a variação histórica quando disponível. Relatórios detalhados exportáveis ficam postergados para a aba de Analytics futuramente. Personalizações completas de logotipo e cor pela igreja serão permitidas em fase avançada.
- **Gamificação**: Atividades e serviços de Gestão da Igreja e Minha Igreja **não contabilizarão XP (Maná)** bruto para evitar abusos ou competição. Serão geradas e contabilizadas apenas **Insígnias/Conquistas**.
- **Visualização de Insígnias**: As insígnias relativas a serviço e voluntariado (criadas com temas focados na seriedade e beleza do Reino de Deus) aparecerão também no perfil do Reino (Público) do usuário.

## 21. Recomendacao final

Criar sim um novo modulo independente de Gestao da Igreja, conectado ao Workspace Pastoral e profundamente integrado ao ecossistema existente, mas sem ficar dentro dele.

Essa separacao e importante porque:

- existe pastor que nao faz gestao administrativa;
- existe gestor que nao e pastor;
- o Workspace Pastoral deve continuar servindo a criacao, estudo, cuidado e rotina pastoral;
- a Gestao da Igreja deve servir a operacao, equipe, pedidos, voluntariado, QR Codes e indicadores.
- a area do membro deve devolver acompanhamento e respostas sobre aquilo que a gestao recebe e trata.
- a UI deve ter identidade propria, com prata/platina metalizado, grafite, cards e motion suficientes para parecer um modulo premium.

O caminho mais seguro e:

1. fundacao de roles;
2. designacoes personalizaveis;
3. notificacoes e alertas essenciais;
4. identidade visual e shell independente;
5. dashboard simples com dados reais;
6. QR/forms;
7. inbox pastoral;
8. acompanhamento do membro;
9. voluntariado;
10. analytics.

Assim o BibliaLM passa de uma plataforma de estudo, culto e comunidade para uma plataforma de operacao pastoral leve, sem perder o foco biblico, comunitario e humano.
