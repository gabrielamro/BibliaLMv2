# 📜 Histórico de Mudanças (Changelog)

> **AI INSTRUCTION:** Ao finalizar uma tarefa, adicione uma nova entrada no topo desta lista.
> **VERSION SYNC:** Lembre-se de atualizar `constants.ts`, `_ARCHITECTURE.md` e `_PROJECT_CONTEXT.md` ao mudar a versão aqui.
> **GIT SYNC:** Após atualizar este arquivo, o Arquiteto deve executar `git commit` com a mensagem do release.

## [Unreleased] - 2026-06-23 (Gestao da Igreja independente)
### Tipo: Feature / Security / MVP
- **Resumo:** Avanco do roadmap de Gestao da Igreja para reduzir dependencia de previews e fechar fluxos reais do MVP.
- **Novidades:**
  - **Perfis gerais separados de permissoes:** Perfis agora suportam `Usuario`, `Pastor` e `Gestor` via `profileType`, mantendo permissoes reais da igreja em roles operacionais.
  - **Pastor/Gestor sem igreja:** `/complete-profile` permite escolher Pastor ou Gestor sem solicitar permissao da igreja; a Gestao da Igreja mostra CTA de vinculo/solicitacao sem conceder acesso automatico.
  - **Compatibilidade Supabase:** `profiles.profile_type` foi adicionado com backfill para contas `subscription_tier = pastor`, mantendo fallback para ambientes ainda nao migrados.
  - **QR publico real:** `/qr/[token]` agora busca o formulario ativo via `churchManagementService.getQrFormByToken`, registra scan por sessao e usa preview apenas como fallback quando o schema ainda nao estiver disponivel.
  - **Envio para inbox:** O formulario publico aceita `ChurchQrForm` real e envia respostas para `church_form_submissions`, preservando mensagem de fallback para ambientes demonstrativos.
  - **Gate operacional:** Novo `ChurchManagementAccessGate` protege todo o segmento `/gestao-igreja` por igreja vinculada e papel operacional ativo (`church_manager`, `pastor` ou `leader`), mantendo admin como excecao tecnica.
  - **Minha Igreja com dados reais:** A home de `/minha-igreja` passa a exibir submissions, designacoes e insignias reais do membro quando disponiveis, mantendo previews apenas como estado demonstrativo.
  - **Contadores de QR:** O SQL do modulo agora inclui `increment_church_qr_counter`, usado para scans e envios sem depender de RPC generica externa ao roadmap.
  - **Admin legado da igreja:** O gate operacional tambem reconhece admins/fundadores registrados em `churches.admins`, preservando compatibilidade com igrejas criadas antes dos novos roles.
  - **Inbox operacional:** A inbox ganhou atribuicao de responsavel, prioridade e botao "atribuir a mim", conectados a `updateSubmissionStatus`.
  - **Notificacoes dedicadas:** Criado `churchNotificationService` com matriz inicial de eventos, canais e severidades padrao para os fluxos essenciais.
  - **Eventos de notificacao:** SQL e service agora registram `church_notification_events` com origem, dedupe, status e payload minimo antes da notificacao visivel.
  - **Central de alertas operacional:** `/gestao-igreja/notificacoes` ganhou filtros por estado, refresh, leitura em lote, links acionaveis e RLS para operadores atualizarem alertas do dashboard.
  - **Diretorio operacional real:** `/gestao-igreja/pessoas` deixou de preencher cards ficticios quando nao ha papeis reais, usa metadados dos roles quando existem e mostra estado vazio com atalho para nova permissao.
  - **QR anonimo com alerta seguro:** SQL adiciona `notify_church_form_submission`, uma RPC `security definer` para criar eventos/notificacoes de submissions publicas sem depender de permissao client-side.
  - **Listagens sem operacao ficticia:** Designacoes, QR Codes, Equipes e Notificacoes deixam de usar cards demonstrativos quando a base real esta vazia e passam a exibir estados vazios acionaveis.
  - **Detalhes e hubs sem preview:** Detalhes, Inbox, Grupos/Celulas e Culto+ deixam de preencher registros ficticios e passam a mostrar estados vazios reais com atalhos para a acao correta.
  - **Services sem fallback ficticio:** `churchManagementService` passa a retornar listas vazias/contadores zerados quando o schema do modulo ainda nao foi aplicado, mantendo previews apenas em catalogos intencionais da UI.
  - **Jornadas guiadas:** Novas paginas `/gestao-igreja/jornada` e `/minha-igreja/jornada-obreiro` explicam os fluxos de gestor, lider, pastor, voluntario e obreiro.
  - **Pipeline de voluntariado:** Nova rota `/gestao-igreja/voluntariado` organiza interesses reais de QR/formulario `volunteer` por etapa, com atribuicao, acompanhamento e encerramento.
  - **Categorias de voluntariado:** Pipeline e QR de voluntarios agora usam cargos padronizados por ministerio, com filtro por categoria, contagem e inferencia para envios antigos.
  - **Admin de gestao de igrejas:** `/admin?view=church_management` lista gestores aprovados/ativos por igreja, e `/admin?view=users` mostra igreja vinculada e tipo de conta de cada usuario.
  - **Impressao premium de QR Codes:** Cada QR Code da Gestao ganhou pagina A4 para mural, com dados da igreja, lider, criador, vaga/formulario, QR central e link publico.
  - **Culto+ operacional:** `/gestao-igreja/cultos` agora usa resumo da Gestao para mostrar check-ins, pedidos de oracao, escalas e pendencias por culto sem duplicar o CRUD do Culto+.
  - **Status das fases:** Novo documento `docs/roadmaps/gestao-igreja-independente-status.md` consolida fases implementadas, parciais e pendentes do MVP.
  - **Reconhecimento de voluntario:** Aceite de designacao passa a tentar registrar insignia privada de disponibilidade, evento de Mana auditavel e notificacao ao membro, sem bloquear o aceite se o schema ainda nao estiver aplicado.
  - **RLS de reconhecimento:** SQL atualizado para permitir que o proprio assignee registre apenas a badge de designacao aceita vinculada a uma designacao real aceita.
  - **Snapshots leves:** SQL, service e tela de relatorios agora suportam `church_analytics_snapshots`, com criacao/listagem de snapshots diarios para indicadores historicos de baixo custo.
  - **Grupos com convites reais:** `/gestao-igreja/grupos` passou a consumir `churchManagementService.getGroupOperationalItems`, exibindo grupos/celulas reais e convites pendentes sem acesso direto da UI ao banco.
  - **Infra SQL/RLS validavel:** Novos comandos `church:sql:apply`, `church:sql:validate` e `church:rls:validate` aplicam/auditam o SQL principal no Postgres do Supabase quando a conexao real esta correta.
  - **Testes ESM organizados:** `test:church-management` agora usa um runner local com esbuild e `node --test`, evitando falha do loader `ts-node/esm` no Node 24.
  - **Sincronizacao Culto+ -> Gestao:** `syncCultoPlusOperationalItems` importa escalas como designacoes e pedidos publicos de oracao como inbox, usando `source_type/source_id` para evitar duplicidade.
  - **Acompanhamento de grupos:** Grupos/celulas agora podem gerar alertas operacionais deduplicados para convites pendentes.
  - **RLS por perfil real:** Novo comando `church:rls:profiles` prepara testes com UUIDs reais de gestor, pastor, lider, voluntario, membro comum e admin.
  - **Regras testaveis do modulo:** Nova camada `utils/churchManagementRules.ts` cobre gate, QR publico, inbox, notificacoes e categorias de voluntariado com testes locais; `test:church-management` agora executa 28 casos.

## [v2.3.0] - 2026-06-12 (Mana, Niveis e Rankings)
### Tipo: Feature / Architecture / Database
- **Resumo:** Implementacao inicial do roadmap de expansao de Mana, niveis e rankings.
- **Novidades:**
  - **Fonte unica de regras:** Matriz completa de `ActionType` com XP, limites diarios, cooldowns, estrategia anti-duplicidade, publico e status.
  - **Progresso e badges:** `recordActivity` agora atualiza `stats` e libera conquistas baseadas em estatisticas, alem dos niveis por XP.
  - **Anti-abuso inicial:** Leitura de capitulo so concede Mana quando o capitulo ainda nao estava concluido e eventos repetidos por fonte/dia passam a ser ignorados.
  - **Competicao:** Nova rota protegida `/competicao` com progresso pessoal, checklist diario, regras de Mana e ranking global de usuarios.
  - **Eventos sociais:** Comentarios no Reino, comentarios em jornadas, convites e mencoes passam a usar ActionTypes explicitos.
  - **Banco preparado:** Novo script `scripts/create_mana_gamification.sql` para `mana_events`, regras, niveis, badges configuraveis e snapshots de igreja.
  - **Auditoria Admin:** Nova aba `Auditoria Mana` para revisar e anular eventos quando `mana_events` estiver disponivel.
  - **Campanhas:** Temporadas/desafios de Mana configuraveis em `SystemSettings.gamificationCampaigns`.
  - **Estimulos:** `ManaNudge` contextual na Home e Mapa Vivo atualizado com a Central de Competicao.

## [v2.2.0] - 2026-05-18 (Culto+ MVP)
### Tipo: Feature / Architecture / Database
- **Resumo:** Primeira entrega do Culto+, criando a base de acompanhamento digital de cultos no BibliaLM.
- **Novidades:**
  - **Workspace Pastoral:** Novo gestor de cultos com cadastro, tema, pregador, horarios, versiculo-chave, banner e timeline liturgica.
  - **OnePage do Culto:** Nova rota publica `/culto/[serviceSlug]` com check-in, anotacoes privadas, timeline e postagem vinculada ao mural da igreja.
  - **Pagina da Igreja:** Nova aba `Cultos` mostrando as OnePages publicadas pela comunidade.
  - **Feed do Reino:** Posts agora podem receber `service_id` e `service_title` para copostagem ligada ao culto.
  - **Infraestrutura:** Novo servico `cultoPlusService`, tipos globais e script `scripts/create_culto_plus.sql` com tabelas/RLS iniciais.

## [v2.1.0] - 2026-05-11 (Ecossistema Social & Gestão de Perfil)
### Tipo: Feature / UI / UX / Database
- **Resumo:** Expansão das funcionalidades sociais e melhoria profunda na gestão de perfis e interatividade.
- **Novidades:**
  - **Interatividade Social**: Implementação de sistema de comentários em posts (`PostCommentsSheet`), contagem de visualizações e curtidas em tempo real.
  - **Gestão de Perfil**: Refatoração completa da edição de perfil (`CompleteProfilePage`), incluindo campos para biografia, redes sociais e personalização de avatar/capa.
  - **Feed do Reino Otimizado**: Melhorias no hook `useKingdomFeed` para suportar filtragem avançada por igreja e integração de posts oficiais no mural geral.
  - **Infraestrutura de Banco**: Scripts de migração SQL para novas colunas sociais, visualizações e metadados de comentários no Supabase.
  - **Experiência do Usuário**: Novo cabeçalho padrão (`StandardHeader`) e navegação social aprimorada.
  - **Suíte de Testes**: Adição de testes para mood de posts, interações sociais, e fluxos de edição de perfil.

## [v2.0.0] - 2026-05-06 (Ecossistema Social & Expansão Eclesiástica)
### Tipo: Feature / Architecture / UX
- **Resumo:** Lançamento da v2.0 com foco total em comunidade e remoção de barreiras financeiras.
- **Novidades:**
  - **Remoção de Monetização**: Todo o sistema de planos e pagamentos foi desativado. Usuários agora possuem acesso total às funcionalidades premium globalmente.
  - **Ecossistema de Igrejas**: Sistema completo de gestão de igrejas, incluindo administração, perfis públicos e fundação de comunidades.
  - **Grupos Sociais**: Implementação de grupos sociais com regras de acesso, convites e moderação.
  - **Privacidade de Conteúdo**: Novos controles de privacidade para posts e estudos.
  - **Infraestrutura Social**: Fallback inteligente para o feed do Reino e melhorias no payload de posts.
  - **Testes de Integridade**: Adição de suíte de testes abrangente para regras de atividade, busca de igrejas e segurança de grupos.

---

### Tipo: Infrastructure / Fix / DOM
- **Resumo:** Expansão do sistema de auto-cura para neutralizar erros de `isBatchingLegacy` no `react-dom`.
- **Novidades:**
  - **React DOM Patch**: Proteção contra falhas de `ReactCurrentActQueue` em 23 arquivos do `react-dom`.
  - **Bridge v2**: Reforço da ponte de runtime no `layout.tsx` para garantir estabilidade do `ErrorBoundary` no navegador.
  - **Zero-Crash Build**: Validada a renderização estática de 61 páginas sem erros de reconciliador.

---

## [v1.9.2] - 2026-04-24 (Estabilização Nuclear do Reconciler)
### Tipo: Infrastructure / Fix / Security
- **Resumo:** Implementação de um sistema de auto-cura universal que neutraliza falhas de internos do React diretamente no `node_modules`.
- **Novidades:**
  - **Nuclear Reconciler Patch**: Patch cirúrgico injetado no `react-reconciler` (dev/prod) para prevenir o erro de `ReactSharedInternals is undefined`.
  - **Auto-Healing System (v2)**: Novo script `fix-konva-crash.cjs` que monitora e cura automaticamente `its-fine`, `react-konva` e `react-reconciler` após cada instalação.
  - **ESM Compatibility**: Script de automação convertido para CommonJS para garantir execução estável em ambientes Next.js com módulos nativos.
- **Arquivos Afetados:**
  - `scripts/fix-konva-crash.cjs` (Novo motor de estabilização)
  - `package.json` (Vínculo do patch ao ciclo de vida de instalação)
  - `constants.ts` (Bump v1.9.2)

---

## [v1.9.1] - 2026-04-24 (Estabilização do Motor de Canvas)
### Tipo: Infrastructure / Fix / DevOps
- **Resumo:** Estabilização crítica do motor de renderização Konva para resolver erros de "ReactSharedInternals is undefined" no Turbopack.
- **Novidades:**
  - **React Internals Bridge**: Implementada ponte de compatibilidade no `layout.tsx` para garantir que o Konva acesse corretamente os segredos do React em ambientes Next.js modernos.
  - **Isolamento de SSR**: Refatoração de todos os componentes de Canvas (`SlideKonva`, `SacredArtCanvas`, `TextNode`) para importação dinâmica 100% isolada do servidor.
  - **Dependency Overrides**: Forçada a consistência de instâncias do React via `package.json` para evitar duplicidade de bibliotecas no bundle final.
- **Arquivos Afetados:**
  - `app/layout.tsx` (Implementação da Ponte Global)
  - `package.json` (Adicionado `overrides` de React)
  - `next.config.ts` (Otimização de `transpilePackages`)
  - `components/Builder/blocks/SlideKonva.tsx` (Ponte local e isolamento)
  - `components/sacred-art-editor/SacredArtCanvas.tsx` (Ponte local e isolamento)
  - `constants.ts` (Bump v1.9.1)

---

## [v1.9.0] - 2026-04-23 (Acesso Freemium & Estúdio Profissional)
### Tipo: Feature / UI / UX / Architecture
- **Resumo:** Transformação do modelo de acesso para "Freemium" (convidados podem explorar sem login) e refatoração completa do Estúdio de Arte Sacra para um design de sidebar profissional.
- **Novidades:**
  - **Modelo Freemium**: Removida a obrigatoriedade de login para acessar o app. Visitantes podem explorar o Santuário e usar o Estúdio de Arte (limite de 2 usos gratuitos via localStorage).
  - **Sidebar Profissional**: O painel de ferramentas da Arte Sacra foi refatorado para uma barra lateral direita em estilo glassmorphic, melhorando a ergonomia e o foco na arte.
  - **Sincronização de Precisão**: Corrigido erro de desalinhamento (âncora) entre o editor e o exportador de imagem, garantindo exportações 100% fiéis ao preview.
  - **UI de Entrada de Texto**: Nova barra de busca com indicador visual de inserção de texto e controles de ferramenta externos para maior clareza.
- **Arquivos Afetados:**
  - `app/criar-arte-sacra/page.tsx` (Lógica de limites guest e novo layout de header)
  - `components/sacred-art-editor/SacredArtDrawer.tsx` (Refatoração para Sidebar)
  - `components/sacred-art-editor/SacredArtCanvas.tsx` (Fix de offset e escala Konva)
  - `utils/imageCompositor.ts` (Sincronização de âncoras de exportação)
  - `constants.ts` (Bump v1.9.0)
  - `package.json` (Fix: Downgrade react-konva para compatibilidade com React 18)

---

## [v1.8.0] - 2026-04-22 (Layout Avançado & Sumário Inteligente)
### Tipo: Feature / UI / UX
- **Resumo:** Implementação de ferramentas de layout flexível e automação de conteúdo. O bloco "Template" agora é o "Sumário", com extração automática de H2.
- **Novidades:**
  - **Sumário Automático**: O bloco Sumário agora monitora o editor em tempo real e extrai todos os subtítulos (H2) para criar o índice automaticamente.
  - **Alinhamento de Blocos**: Blocos de 1/3 e 1/2 agora possuem controles de alinhamento (Esquerda, Centro, Direita), permitindo composições mais complexas.
  - **Grid de Versículos**: Melhoria no bloco de Versículos Relacionados (1/1) para exibir 3 colunas por padrão.
  - **UI Refinement**: O botão "Configurar" foi redesenhado como um pill flutuante com maior z-index para evitar sobreposições.
- **Arquivos Afetados:**
  - `components/Builder/blocks/StudyOutlineBlock.tsx` (Lógica de Auto-ToC)
  - `components/UnifiedEditor/components/BlockNodeView.tsx` (UI de Alinhamento e Configurar)
  - `components/Builder/blocks/RelatedVersesBlock.tsx` (Grid 3 colunas)
  - `components/UnifiedEditor/extensions/BlockExtension.ts` (Sync de Alinhamento)
  - `constants.ts` (Bump v1.8.0)

---

## [v1.7.2] - 2026-04-22 (Estabilização do Editor Unificado)
### Tipo: Refactor / UI / UX / Fix
- **Resumo:** Consolidação do `CreateContentV3Page` como o motor principal de edição para estudos e aulas. Implementada lógica de contexto embutido (`embeddedContext`) para esconder controles irrelevantes no criador de jornadas. Corrigidos múltiplos erros de Tipagem (TypeScript).
- **Arquivos Afetados:**
  - `views/CreateContentV3Page.tsx` (Suporte a modo embutido e validações)
  - `views/PlanBuilderPage.tsx` (Migração para o novo editor unificado)
  - `components/UnifiedEditor/UnifiedEditor.tsx` (Fix de tipagem e setContent)
  - `components/Builder/blocks/HeroSplitBlock.tsx` (Fix TS2322)
  - `components/Builder/blocks/TextNode.tsx` (Fix TS18047)
  - `constants.ts` (Bump v1.7.2)
- **Contexto Técnico:** Removida a fragmentação entre a criação de artigos e edição de aulas. O modo embutido agora desabilita automaticamente botões de Preview/Configurações e ajusta o padding do canvas para máxima produtividade.

---

## [v1.7.1] - 2026-04-22 (Manutenção de Agentes)
### Tipo: Docs / Architecture / UI
- **Resumo:** Atualização das instruções dos agentes Dev e Arquiteto. Adição da exibição da versão do sistema no rodapé do menu lateral (Sidebar).
- **Arquivos Afetados:**
  - `constants.ts` (Bump v1.7.1)
  - `.agents/skills/dev/SKILL.md` (Novas responsabilidades)
  - `_ARCHITECT_AGENT.md` (Novas responsabilidades)
  - `components/Layout.tsx` (Versão no rodapé)
- **Contexto Técnico:** Formalização do processo de documentação e versionamento. Adição de link mestre para `SYSTEM_VERSION` no Layout.

---

## [v1.7.0] - 2026-03-16 (Refino de Perfis e Topo Unificado)
### Tipo: Style / Refactor / UX
- **Resumo:** Padronização do topo global para perfis públicos (Usuário, Igreja, Planos e Estudos). Removidas duplicações de cabeçalho e ajustada a visibilidade do topo no modo leitura.
- **Arquivos Afetados:**
  - `components/Layout.tsx` (Ajuste de tipografia suave e alinhamento no mobile)
  - `views/public/ChurchProfilePage.tsx` (Remoção de título redundante)
  - `views/public/PublicUserProfilePage.tsx` (Remoção de título redundante e adição de selo de identificação)
  - `views/public/PublicPlanPage.tsx` (Gestão de visibilidade do topo global no modo de leitura do dia)
  - `views/public/PublicStudyPage.tsx` (Integração com HeaderContext)
- **Hash Git:** (pendente commit)
- **Contexto Técnico:** Utilização intensiva do `HeaderContext` para gerir títulos e breadcrumbs de forma centralizada pelo Layout, garantindo uma UI premium e sem elementos repetidos.

---

## [v1.6.3] - 2026-03-16 (Controle de Versão Git)
### Tipo: Infrastructure / DevOps
- **Resumo:** Inicialização do repositório Git local para controle de versões do BíbliaLM. Criado workflow `/versao` para salvar, listar e restaurar snapshots.
- **Arquivos Afetados:**
  - `.git/` (Repositório inicializado)
  - `.gitignore` (Configurado para Next.js — exclui node_modules, .next, dist, .env)
  - `.agents/workflows/versao.md` (Novo workflow de controle de versão)
  - `_ARCHITECT_AGENT.md` (Adicionada responsabilidade de release notes)
  - `_RELEASENOTES.md` (Este arquivo — atualizado com protocolo Git)
- **Hash Git:** `970836e`
- **Contexto Técnico:** Possibilita restore de qualquer arquivo para qualquer commit anterior. Protege contra regressões acidentais de UI/lógica.

---

## [v1.6.2] - 2026-03-16 (Ajuste de Espaçamentos — Pão Diário)
### Tipo: Style / UI
- **Resumo:** Refatoração de espaçamentos e fontes da `DevotionalPage` após padronização tipográfica. Ponto médio equilibrado entre hero muito grande e muito pequeno.
- **Arquivos Afetados:**
  - `views/DevotionalPage.tsx` (Hero, versículo, parágrafos, sidebar, botões)
- **Hash Git:** (sessão atual — não commitado ainda)
- **Detalhes:**
  - Hero: `h-56 md:h-80` (antes: h-96, depois h-48, agora equilíbrio)
  - Título: `text-5xl md:text-6xl` (antes: text-8xl)
  - Versículo: `text-2xl md:text-3xl`
  - Parágrafos: `text-lg` com `space-y-6`
  - Padding interno: `p-5 md:p-10`

---

## [v1.6.1] - 2026-03-16 (Capitular + Tipografia — Pão Diário)
### Tipo: Style / Fix
- **Resumo:** Restaurado efeito de letra capitular (`first-letter:`) nos parágrafos do corpo devocional. Reduzido `md:text-8xl → md:text-5xl` no título do hero.
- **Arquivos Afetados:**
  - `views/DevotionalPage.tsx`
  - `app/globals.css` (ajuste na utility `@layer` para md:text-8xl → 5xl)
- **Hash Git:** `674d79a` (snapshot inicial)

---

## [v1.6.0] - 2026-03-16 (Pão Diário — Fallback IA + Normalização)
### Tipo: Feature / Fix / Architecture
- **Resumo:** Implementado sistema de fallback em 3 camadas para o Pão Diário: Supabase → IA → Constante estática. Corrigido erro 406 com `.maybeSingle()`. Adicionada função `normalizeDevotional` para unificar campos de dados.
- **Arquivos Afetados:**
  - `views/DevotionalPage.tsx` (Fallback IA, normalização, tela de erro)
  - `services/supabase.ts` (maybeSingle, try/catch em user_devotionals)
  - `hooks/useMana.ts` (removido import não utilizado)
- **Hash Git:** `674d79a` (snapshot inicial)

## [v1.5.2] - 2024-03-20 (Onboarding Eclesiástico)
### Tipo: Feature / UX
- **Resumo:** Adicionada etapa de vínculo com igreja durante o cadastro de novos usuários.
- **Arquivos Afetados:**
  - `components/LoginModal.tsx` (Nova UI de busca)
  - `contexts/AuthContext.tsx` (Lógica de registro com igreja)
  - `constants.ts` (Bump de versão)
- **Contexto Técnico:** Permite que o usuário já entre na plataforma com o contexto de sua comunidade local, populando o feed e mural de oração imediatamente.

---

## [v1.5.1] - 2024-03-20 (Atualização de UI)
### Tipo: Feature / UI
- **Resumo:** Adicionado link "Apresentação" no menu de configurações do usuário.
- **Arquivos Afetados:**
  - `components/Layout.tsx` (Menu Dropdown)
  - `constants.ts` (Bump de versão)
  - Documentação Mestra (`.md`)
- **Contexto Técnico:** Facilita o acesso à página de One Page (Landing) mesmo para usuários logados.

---

## [v1.5.0] - 2024-03-20 (Nova Jornada)
### Tipo: Feature / Admin / Architecture
- **Resumo:** Implementação do sistema de integridade de versão e funcionalidade de "Wipe Data" (Reset Total).
- **Arquivos Afetados:**
  - `_RELEASENOTES.md` (Novo)
  - `_ARCHITECTURE.md` (Versionamento)
  - `_PROJECT_CONTEXT.md` (Versionamento)
  - `constants.ts` (Bump de versão)
  - `services/firebase.ts` (Nova função `wipeAllUserData`)
  - `components/AdminPage.tsx` (UI da Zona de Perigo)
- **Contexto Técnico:** Adicionado suporte a `writeBatch` no Firebase para deleção em massa. Criada estrutura de documentação viva para reduzir alucinações da IA.
