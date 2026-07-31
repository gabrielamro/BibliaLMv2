# Roadmap CPO — Padronização visual por módulos do Culto+

**Status:** implementado em `v2.8.1`  
**Responsável pelo produto:** CPO  
**Escopo:** menu principal, `newhome`, shells e páginas internas dos módulos  
**Princípio central:** a cor deve ajudar o usuário a reconhecer o módulo atual sem substituir texto, ícone, título ou contexto de navegação.

## 1. Visão de produto

O Culto+ reúne experiências pessoais, bíblicas, sociais, criativas, pastorais e administrativas. Essa amplitude é uma força do produto, mas também cria risco de desorientação quando páginas do mesmo módulo usam cores diferentes ou quando módulos distintos compartilham a mesma cor dominante.

A padronização deve criar uma linguagem cromática consistente em três níveis:

1. **Navegação:** menu lateral, menu móvel, alternador de visão e item ativo.
2. **Orientação:** cabeçalho, ícone do módulo, marcador de seção, abas e foco.
3. **Ação:** CTA principal, seleção e destaque contextual.

O conteúdo continua sobre superfícies legíveis e predominantemente neutras. A cor do módulo não deve transformar todas as páginas em grandes blocos saturados.

## 2. Objetivo

Permitir que o usuário reconheça em qual módulo está trabalhando antes mesmo de ler todo o cabeçalho, mantendo:

- identidade única em desktop e mobile;
- coerência entre menu, `newhome` e páginas internas;
- contraste WCAG 2.1 AA;
- suporte equivalente a tema claro e escuro;
- estados semânticos de sucesso, alerta, erro e informação;
- estrutura, fluxos e permissões atuais.

## 3. Resultado esperado

Ao final:

- cada rota relevante possui um módulo visual proprietário;
- cada módulo possui tokens oficiais para claro e escuro;
- menu, `newhome`, shells e páginas usam a mesma fonte de verdade;
- uma mesma funcionalidade não troca de identidade conforme a forma de acesso;
- verde de sucesso não é confundido com a identidade de Cultos;
- páginas utilitárias permanecem neutras;
- nenhuma orientação depende somente de cor.

## 4. Arquitetura cromática proposta

Os hexadecimais abaixo são uma proposta inicial para prototipação e teste de contraste. A aprovação final ocorre na Fase 0.

| Módulo | Conceito | Primária | Secundária | Superfície clara | Superfície escura | Gradiente recomendado |
| --- | --- | --- | --- | --- | --- | --- |
| **Início** | marca, acolhimento e direção | `#171319` | `#F2AB1D` | `#FFF9EC` | `#0D0B0E` | `#171319 → #2B2133`, com amarelo somente como acento |
| **Bíblia** | pergaminho, couro e ouro envelhecido | `#74451F` | `#C9A45C` | `#FFF7E7` | `#15110E` | `#3A2416 → #74451F`, com detalhes `#C9A45C` |
| **Reino / Feed** | comunidade, expressão e movimento | `#5B2A86` | `#C13C8A` | `#FFF4F7` | `#17101B` | `#5B2A86 → #C13C8A → #E76F51` |
| **Cultos** | presença, comunhão e continuidade | `#073B35` | `#0F6B5D` | `#EFF8F4` | `#071C19` | `#073B35 → #0F6B5D` |
| **Criar** | imaginação e potência da marca | `#4F2AA7` | `#EF4B5F` | `#FFF5F2` | `#17101D` | `#4F2AA7 → #C13C8A → #EF4B5F → #F2A81D` |
| **Gestão da Igreja** | precisão e operação premium | `#111315` | `#AAB1B7` | `#F4F5F6` | `#090A0B` | `#111315 → #2B2F33` |
| **Workspace Pastoral** | cuidado, ensino e autoridade pastoral | `#5B2B87` | `#8B5BB5` | `#F7F0FC` | `#160D20` | `#3D185F → #7A3FA0` |
| **Utilitário / neutro** | conta, suporte e sistema | `#475569` | `#94A3B8` | `#F8FAFC` | `#111827` | sem gradiente institucional |

### 4.1. Notas de identidade

- **Início:** preto e amarelo devem refletir a marca, sem competir com a área Criar, que usa o gradiente colorido do ícone.
- **Bíblia:** a referência canônica é a família visual já usada no Pão Diário: couro, marrom, ouro envelhecido, pergaminho e carvão quente.
- **Reino:** o gradiente deve lembrar a energia visual de redes sociais baseadas em imagem, mas usar proporções e tons próprios. Não copiar o gradiente, a ordem cromática ou os componentes do Instagram.
- **Cultos:** verde permanece como cor institucional, mas deve existir uma única escala oficial.
- **Criar:** pode usar o espectro do ícone da marca, com limite de saturação em áreas extensas.
- **Gestão:** remover o verde institucional do shell e dos itens ativos. Verde permanece apenas como estado semântico ou dado ligado a Cultos.
- **Workspace Pastoral:** preservar o roxo atual e consolidar suas variações.

## 5. Tokens obrigatórios por módulo

Cada módulo deve fornecer o mesmo contrato:

- `primary`;
- `primaryHover`;
- `primarySoft`;
- `secondary`;
- `surface`;
- `surfaceStrong`;
- `border`;
- `text`;
- `textMuted`;
- `onPrimary`;
- `focus`;
- `gradient`;
- equivalentes para tema escuro.

### 5.1. Aplicação dos tokens

Os tokens do módulo podem aparecer em:

- item ativo e ícone do menu;
- faixa ou marcador do cabeçalho;
- título auxiliar e eyebrow;
- CTA primário da página;
- aba selecionada;
- borda de seleção;
- anel de foco;
- progresso e destaque contextual;
- skeleton ou loading temático discreto.

Os tokens do módulo não devem substituir:

- vermelho de erro;
- âmbar de alerta;
- verde de sucesso;
- azul de informação;
- cores de status operacionais;
- cores configuráveis do conteúdo criado pelo usuário;
- identidade pública própria de uma igreja.

Quando a identidade de Cultos e o estado de sucesso forem verdes na mesma tela, o estado deve incluir ícone e texto, nunca apenas uma variação de verde.

## 6. Matriz de propriedade visual das rotas

### 6.1. Início

Rotas e superfícies:

- `/newhome?tab=inicio`;
- cabeçalho geral da `newhome`;
- atalhos de visão geral;
- estado inicial do menu pessoal.

Aplicação:

- item `Início` preto com acento amarelo;
- boas-vindas, seleção da aba e CTA principal alinhados à marca;
- cards internos podem representar outros módulos com suas próprias pequenas etiquetas.

### 6.2. Bíblia

Rotas principais:

- `/bibliasagrada` e compatibilidade `/biblia`;
- `/biblia-dashboard`;
- `/devocional`;
- `/plano` e `/plano/**`;
- `/oracoes`;
- `/quiz`;
- `/estudos` e `/estudos/**`;
- leitores e estudos bíblicos que não pertençam ao Workspace.

Regra:

- Pão Diário é a referência visual canônica;
- superfícies extensas usam pergaminho ou carvão quente;
- texto bíblico em área escura usa branco envelhecido `#E7E0D4`;
- cada funcionalidade preserva seu layout, mas não cria nova cor institucional.

### 6.3. Reino / Feed

Rotas principais:

- `/social` e `/social/**`;
- `/p/[postId]`;
- perfis, igrejas e grupos quando abertos no contexto social;
- aba `/newhome?tab=reino`.

Regra:

- substituir o verde dominante atual pelo gradiente social próprio;
- publicações continuam majoritariamente neutras para favorecer leitura;
- tipos de post podem ter cores semânticas secundárias;
- oração comunitária `/social/oracao` pertence ao Reino, não ao módulo Bíblia.

### 6.4. Cultos

Rotas principais:

- `/culto` e `/culto/**`;
- `/meus-cultos` e `/meus-cultos/**`;
- aba `/newhome?tab=calendario`;
- agenda, escala pessoal, equipes e solicitações da visão pessoal.

Regra:

- usar uma única família de verdes;
- a aba Calendário da `newhome` deixa de usar azul como identidade dominante;
- transmissão e OnePage podem ser imersivas, mas ações e orientação permanecem verdes;
- escala pendente, confirmação e conflito continuam usando cores semânticas.

### 6.5. Criar

Rotas principais:

- `/newhome?tab=criar`;
- `/estudio-criativo`;
- `/criar-conteudo`;
- `/criar-arte-sacra`;
- `/criar-podcast`;
- demais ferramentas autorais explicitamente agrupadas em Criar.

Regra:

- unificar os atuais violetas, azuis, rosas, cianos e verdes em um gradiente oficial;
- o gradiente aparece em heros, ícones e CTA primário;
- áreas de edição e canvas permanecem neutras para não alterar percepção de cor do conteúdo;
- estados de IA usam texto e ícone, não apenas o gradiente.

### 6.6. Gestão da Igreja

Rotas principais:

- `/gestao-igreja` e `/gestao-igreja/**`;
- rotas legadas de gestão que redirecionam ou renderizam o shell oficial;
- aba `/newhome?tab=gestao`.

Regra:

- preto, grafite e prata formam a identidade;
- remover verde do item ativo, hero, avatar fallback e alternador de visão;
- cards de indicadores podem usar cores semânticas quando representam estados;
- uma página de Cultos dentro da Gestão continua preta/grafite, pois o módulo proprietário é Gestão. Verde pode identificar o dado “culto”, mas não o shell.

### 6.7. Workspace Pastoral

Rotas principais:

- `/workspace-pastoral` e `/workspace-pastoral/**`;
- `/acervo`;
- experiências exclusivas de ensino e cuidado pastoral;
- `/oracoes/gerenciar`.

Regra:

- consolidar o roxo existente;
- páginas de cultos dentro do Workspace continuam roxas no shell;
- verde pode aparecer em status ou links para a OnePage do culto;
- nenhuma página do Workspace deve herdar o preto da Gestão.

### 6.8. Utilitários e marca

Permanecem neutros ou usam a identidade geral da marca:

- `/minha-conta`;
- `/perfil`;
- `/historico`;
- `/planos`;
- `/suporte`;
- `/termos`;
- `/privacidade`;
- `/login`;
- `/intro`;
- `/admin`;
- `/system-integrity`;
- estados globais de autenticação, erro e manutenção.

Essas páginas não devem ser forçadas a um módulo apenas para receber uma cor.

## 7. Decisões de produto que precisam ser fechadas

### 7.1. `/criar-sala`

**Conflito atual:** aparece em Criar e no Workspace Pastoral.

**Recomendação do CPO:** tornar o Workspace Pastoral o proprietário visual, porque a criação de sala é uma capacidade pastoral e comunitária. O acesso pode continuar existindo em Criar, mas deve sinalizar “abre no Workspace Pastoral”.

### 7.2. Cultos dentro de Gestão e Workspace

**Decisão:** o shell determina o módulo visual:

- `/gestao-igreja/cultos` usa Gestão;
- `/workspace-pastoral/cultos` usa Workspace Pastoral;
- `/culto` e `/meus-cultos` usam Cultos.

O domínio é o mesmo, mas a tarefa e a visão do usuário são diferentes.

### 7.3. Orações

**Decisão:**

- `/oracoes` e experiências guiadas pessoais usam Bíblia;
- `/social/oracao` usa Reino;
- `/oracoes/gerenciar` usa Workspace Pastoral.

### 7.4. Chat / Conselheiro IA

**Pendente:** definir se `/chat` é uma utilidade global neutra ou uma experiência bíblica.

**Recomendação do CPO:** neutro com identidade de marca enquanto o assistente atender vários módulos. Se futuramente houver assistentes por contexto, cada entrada pode herdar o módulo de origem sem mudar o shell global.

### 7.5. Rotas legadas

Rotas duplicadas ou antigas devem redirecionar para a experiência canônica. Não vale padronizar visualmente duas implementações que deveriam ser uma só.

## 8. Fonte de verdade técnica

A implementação não deve manter sete paletas copiadas em vários arrays de menu.

Proposta:

1. Definir o registro tipado de módulos e propriedade de rotas em `constants.ts`.
2. Definir variáveis CSS semânticas em `app/globals.css`, usando `data-module`.
3. Criar uma fronteira compartilhada de tema, por exemplo `ModuleThemeBoundary`, que aplique o módulo correto no shell.
4. Fazer menus e componentes consumirem tokens semânticos:
   - `--module-primary`;
   - `--module-secondary`;
   - `--module-surface`;
   - `--module-border`;
   - `--module-focus`;
   - `--module-gradient`.
5. Evitar classes Tailwind montadas dinamicamente em runtime.
6. Manter o roteamento e as regras de negócio fora da camada visual.

Superfícies prioritárias:

- `views/NewHomePage.tsx`;
- `components/CultoPlusPageShell.tsx`;
- `components/MobileBottomNav.tsx`;
- `components/AppViewSwitcher.tsx`;
- `components/Sidebar/Sidebar.tsx`;
- `components/workspace/PastoralWorkspaceShell.tsx`;
- `components/church-management/ChurchManagementShell.tsx`;
- shells e headers específicos ainda existentes nas páginas internas.

## 9. Roadmap de execução

### Fase 0 — Contrato visual e inventário

**Objetivo:** aprovar a linguagem antes de alterar páginas.

Entregas:

- inventário completo rota → módulo → shell;
- amostras claro/escuro das sete paletas;
- matriz de contraste;
- protótipo de item ativo, hero, CTA, aba e foco;
- decisões sobre `/criar-sala`, `/chat` e rotas legadas;
- lista de exceções documentadas.

Critérios de aceite:

- 100% das rotas de produto classificadas;
- nenhum conflito de propriedade sem decisão;
- contraste mínimo de `4.5:1` para texto normal e `3:1` para texto grande e componentes;
- CPO aprova a matriz antes da implementação.

### Fase 1 — Fundação de temas

**Objetivo:** criar uma única fonte de verdade.

Entregas:

- tipos e registro de módulos;
- tokens CSS claro/escuro;
- boundary ou helper de tema;
- componentes demonstrativos;
- testes unitários do mapeamento de rotas.

Critérios de aceite:

- não existem paletas duplicadas na nova fundação;
- rota desconhecida recebe tema neutro;
- subrotas herdam o módulo correto;
- tema escuro não depende de cores improvisadas.

### Fase 2 — Navegação global

**Objetivo:** fazer o usuário reconhecer o módulo já no menu.

Entregas:

- menu lateral da `newhome`;
- menu do `CultoPlusPageShell`;
- menu móvel e navegação inferior;
- alternador de visões;
- menus de Gestão e Workspace;
- estados ativo, hover, foco, expandido e desabilitado.

Critérios de aceite:

- o mesmo módulo tem a mesma identidade em desktop e mobile;
- Gestão deixa de aparecer verde no alternador de visão;
- Início usa preto/amarelo;
- nenhuma seleção depende apenas de cor;
- navegação por teclado permanece funcional.

### Fase 3 — `newhome` como mapa visual do produto

**Objetivo:** transformar a Home na referência da arquitetura modular.

Entregas:

- aba Início em preto/amarelo;
- aba Bíblia e atalhos bíblicos na família Pão Diário;
- aba Reino no gradiente social;
- aba Cultos/Calendário em verde;
- aba Criar no gradiente da marca;
- aba Gestão em preto/grafite;
- cards que apontam para outro módulo recebem marcador visual do destino.

Critérios de aceite:

- mudar de aba atualiza título, foco e acento do módulo;
- cards mistos não transformam a Home em mosaico saturado;
- Calendário deixa de usar azul institucional;
- cada CTA informa visual e textualmente para onde leva.

### Fase 4 — Bíblia

**Objetivo:** levar a identidade do Pão Diário às experiências bíblicas.

Ordem:

1. Bíblia Sagrada;
2. Meta e plano de leitura;
3. Estudos;
4. Orações guiadas;
5. Quiz;
6. leitores públicos relacionados.

Critérios de aceite:

- pergaminho, couro e ouro são consistentes;
- texto bíblico mantém legibilidade e hierarquia;
- tema escuro usa carvão quente e branco envelhecido;
- layouts funcionais não são redesenhados.

### Fase 5 — Reino e Cultos

**Objetivo:** separar visualmente comunidade e culto, hoje muito próximos pelo uso do verde.

Reino:

- hero e navegação no gradiente social;
- compositor e CTAs alinhados;
- cards de feed neutros;
- oração comunitária dentro da mesma identidade.

Cultos:

- menu, agenda, Meu Painel, escala e OnePage na escala verde oficial;
- estados litúrgicos e operacionais preservados;
- transmissão não perde contraste.

Critérios de aceite:

- Reino não usa verde como identidade principal;
- Cultos não mistura esmeralda, teal e outros verdes sem token;
- abrir Reino e Cultos produz reconhecimento visual imediato.

### Fase 6 — Criar

**Objetivo:** dar unidade ao conjunto de ferramentas autorais.

Entregas:

- hero e menus no gradiente da marca;
- Arte Sacra, Podcast e Estúdio da Palavra alinhados;
- canvas e editores neutros;
- loading, IA e histórico com linguagem comum.

Critérios de aceite:

- ferramentas parecem partes do mesmo módulo;
- o gradiente não afeta fidelidade de cor no canvas;
- foco, seleção e CTA usam tokens oficiais;
- `/criar-sala` respeita a decisão de propriedade.

### Fase 7 — Gestão e Workspace Pastoral

**Objetivo:** consolidar duas visões profissionais sem confundi-las.

Gestão:

- shell preto/grafite/prata;
- menu ativo e avatar fallback sem verde institucional;
- páginas internas herdando tokens premium.

Workspace:

- roxo canônico no shell e páginas;
- remoção de variações fúcsia não aprovadas;
- conteúdos de culto e oração tratados como subdomínios, não como troca de módulo.

Critérios de aceite:

- alternar entre Gestão e Workspace gera mudança visual inequívoca;
- indicadores semânticos continuam legíveis;
- permissões e fluxos não são alterados.

### Fase 8 — QA visual, acessibilidade e rollout

**Objetivo:** liberar sem regressão funcional.

Entregas:

- Playwright em desktop, tablet e mobile;
- screenshots de referência em claro e escuro;
- teste de teclado e foco;
- auditoria de contraste;
- verificação de loading, vazio, erro, sucesso e desabilitado;
- rollout progressivo por módulo;
- atualização de `_PROJECT_CONTEXT.md` e `_RELEASENOTES.md` na entrega.

Critérios de aceite:

- TypeScript sem erros;
- testes existentes continuam aprovados;
- nenhuma rolagem horizontal em `320px`;
- nenhuma regressão de autenticação, publicação, leitura, culto ou gestão;
- 100% das páginas prioritárias usam tokens, sem cores institucionais avulsas.

## 10. Coordenação do CPO

### Responsabilidades

| Papel | Responsabilidade |
| --- | --- |
| **CPO** | aprovar propriedade das rotas, paletas, ordem, exceções e critérios de pronto |
| **Design/Frontend** | tokens, protótipos, contraste, responsividade e componentes compartilhados |
| **DEV** | arquitetura de tema, mapeamento de rotas, integração e testes |
| **QA** | regressão visual e funcional em claro/escuro e breakpoints |
| **Responsável do módulo** | validar se a identidade não prejudica a tarefa principal |
| **Pastoral** | revisar superfícies de oração, Bíblia e cuidado quando houver alteração de tom ou conteúdo |

### Gates

1. **Gate A — Identidade:** CPO aprova paleta e matriz de rotas.
2. **Gate B — Fundação:** frontend e DEV aprovam tokens e contrato.
3. **Gate C — Piloto:** Início, menu e uma página de cada módulo.
4. **Gate D — Escala:** migração das páginas restantes.
5. **Gate E — Liberação:** QA, acessibilidade e documentação.

Nenhuma fase deve começar migrando dezenas de páginas antes de o piloto ser aprovado.

## 11. Plano de testes

### Testes de contrato

- toda rota conhecida resolve um único módulo;
- rota desconhecida resolve `neutral`;
- subrotas herdam corretamente;
- aliases `/biblia` e `/bibliasagrada` compartilham tema;
- rotas de culto em Gestão e Workspace não herdam Cultos por engano.

### Testes de interface

- menu desktop e móvel apresentam a mesma cor;
- item ativo inclui `aria-current`;
- foco visível tem contraste;
- título ou breadcrumb confirma o módulo;
- claro e escuro usam tokens equivalentes;
- CTAs mantêm target mínimo de `44px`;
- cards e textos não estouram em `320px`.

### Testes funcionais de regressão

- Bíblia: navegação e retomada;
- Reino: publicar, comentar, curtir e compartilhar;
- Cultos: agenda, check-in, escala e OnePage;
- Criar: abrir ferramenta, salvar e exportar;
- Gestão: navegar e executar ações autorizadas;
- Workspace: criar sala, acessar acervo e gerenciar culto.

## 12. Métricas de sucesso

- `100%` das rotas prioritárias classificadas;
- `100%` dos shells usando tokens compartilhados;
- `0` módulo com duas paletas institucionais concorrentes;
- `0` falha de contraste AA em componentes críticos;
- pelo menos `90%` dos usuários de teste identificam o módulo atual em até cinco segundos;
- redução de relatos de “não sei em qual área estou”;
- nenhuma queda relevante nas conclusões dos fluxos principais após o rollout.

## 13. Riscos e mitigação

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Saturação excessiva | interface cansativa | cor concentrada em orientação e ação, superfícies neutras |
| Verde de Cultos confundido com sucesso | leitura errada de estado | ícone, texto e tokens semânticos independentes |
| Gradientes reduzirem contraste | acessibilidade | `onPrimary` validado e overlay controlado |
| Mesma rota aparecer em dois módulos | perda de orientação | proprietário visual único e links com indicação de destino |
| Refatoração visual quebrar fluxo | regressão funcional | migração por shell, testes e rollout progressivo |
| Tema escuro improvisado | inconsistência | tokens escuros aprovados desde a Fase 0 |
| Cores hardcoded reaparecerem | dívida recorrente | lint/teste de contrato e documentação do design system |

## 14. Fora de escopo

- redesenhar layouts completos;
- alterar permissões ou regras de negócio;
- renomear módulos sem decisão separada;
- mudar identidade visual de igrejas públicas;
- recolorir conteúdo criado pelo usuário;
- substituir cores semânticas por cores de módulo;
- duplicar páginas para aplicar temas diferentes.

## 15. Pontos que não estavam explícitos no pedido

Para a padronização funcionar de ponta a ponta, também precisam entrar no escopo:

1. **tema escuro**, não apenas o claro;
2. **menu móvel, bottom navigation e alternador de visões**;
3. **estados de foco, hover, loading, erro, vazio e seleção**;
4. **separação entre cor institucional e cor semântica**;
5. **propriedade visual de rotas compartilhadas**;
6. **páginas utilitárias neutras**;
7. **rotas legadas e aliases**;
8. **acessibilidade para daltonismo e baixa visão**;
9. **documentação e testes para impedir nova divergência**;
10. **marcador textual ou breadcrumb**, pois cor sozinha não orienta todos os usuários.

## 16. Próximo passo recomendado

Executar somente a **Fase 0** e produzir um piloto com:

- menu principal;
- abas da `newhome`;
- uma página representativa de cada módulo;
- versões clara e escura;
- matriz de contraste.

Após aprovação do piloto, iniciar a fundação técnica e migrar módulo por módulo.
