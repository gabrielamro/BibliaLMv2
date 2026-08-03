# Lei Maxima da Arquitetura - Culto+

Este documento contem as regras inegociaveis. Violacoes destas regras resultam em veto automatico de qualquer mudanca.

## 1. Os 3 Pilares Inegociaveis
1. **Seguranca de Dados:** Nenhuma chave (`.env`) ou credencial deve ser exposta ou removida da protecao de servidor.
2. **Controle de Gastos (IA):** Toda chamada a IA deve ser precedida por `checkFeatureAccess` e protegida por `retryWithBackoff`.
3. **Pureza de Fluxo:** Logica de banco/API deve residir em `services/`. Componentes sao apenas para apresentacao e estado local.

## 2. Regras Tecnicas (RN)
- **RN01:** O `types.ts` e a unica fonte de verdade para interfaces globais.
- **RN02:** O `constants.ts` centraliza todas as configuracoes de sistema e limites.
- **RN03:** Nao use `console.log` em producao.
- **RN04:** O Firestore nunca e chamado diretamente em Views; use o `firebaseService`.
- **RN05:** Todo novo modulo deve vir acompanhado de testes de integracao (Playwright).
- **RN06 (VERSAO):** O Arquiteto e responsavel por atualizar o numero da versao em `constants.ts` e os `_RELEASENOTES.md` em cada entrega significativa.
- **RN07 (ATIVIDADES):** Toda criacao ou alteracao de funcionalidade que represente uma acao relevante do usuario deve avaliar se precisa registrar historico em `/historico`. Quando aplicavel, use o fluxo central `recordActivity`/`earnMana`, preservando as regras de Mana em `systemSettings.gamification` e a persistencia de `profiles.activity_log`; nao implemente logs paralelos em componentes.

## 3. Protocolo de Commit
As mensagens de commit devem ser semanticas:
`tipo(escopo): descricao - vX.Y.Z`
- Tipos Permitidos: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`.

## 4. Registro de Mudancas Aprovadas (Log Sagrado)

| DATA | TIPO | ARQUIVO(S) | DESCRICAO CURTA | Arquiteto |
| :--- | :--- | :--- | :--- | :--- |
| 2026-08-02 | refactor | app/, components/, views/, services/supabase.ts, tests/ | Template Culto+ consolidado, rotas canonicas, marca unificada e mural global corrigido - v2.10.0 | Codex |
| 2026-08-01 | fix | services/churchManagementService.ts, views/MyCultosPage.tsx, tests/myCultosMobileExperience.test.ts | Proximo culto usa membership persistida e exibe somente a ocorrencia mais proxima - v2.9.4 | Codex |
| 2026-08-01 | fix | components/MobileBottomNav.tsx, tests/kingdomRoadmapUi.test.ts | Destaque premium da barra inferior acompanha exclusivamente a pagina ativa - v2.9.3 | Codex |
| 2026-08-01 | refactor | views/MyCultosPage.tsx, tests/myCultosMobileExperience.test.ts | Indicadores mobile compactos e proximos cultos publicados da igreja - v2.9.2 | Codex |
| 2026-08-01 | refactor | components/MobileBottomNav.tsx, views/social/SocialFeedPage.tsx, components/social/FeedPostCard.tsx, tests/ | Navegacao mobile unificada e Trama Viva replicada no feed em telas pequenas - v2.9.1 | Codex |
| 2026-07-31 | refactor | views/social/, components/social/, services/kingdomPathService.ts, app/globals.css, tests/ | Feed editorial com dobra de folha, passagem contextual e jornada real de culto, escala, oracao e estudo - v2.9.0 | Codex |
| 2026-07-31 | refactor | views/social/, components/social/, views/public/, services/postInteractionService.ts, services/churchGroupService.ts, supabase/migrations/, tests/ | Trama Viva aplicada, Caderno contextual, interacoes persistentes e rotas canonicas - v2.8.9 | Codex |
| 2026-07-31 | refactor | views/social/SocialFeedPage.tsx, components/social/, views/public/ChurchProfilePage.tsx, views/public/CellForumPage.tsx, tests/kingdomRoadmapUi.test.ts | Reino Trama Viva, Caderno de Partilha acessivel e tabs editoriais de igreja/grupo - v2.8.7 | Codex |
| 2026-07-31 | refactor | views/public/ChurchProfilePage.tsx, views/public/CellForumPage.tsx, services/churchGroupService.ts, utils/churchGroupRules.ts, supabase/migrations/, tests/ | Igrejas e grupos com capabilities por papel/escopo, privacidade e navegacao canonica - v2.8.6 | Codex |
| 2026-07-29 | refactor | views/NewHomePage.tsx, tests/newHome.spec.ts | NewHome compacta, Pao Diario em destaque e agenda sem linhas duplicadas - v2.8.5 | Codex |
| 2026-07-29 | feat | components/reader/Library.tsx, tests/bibleLibraryExperience.spec.ts | Biblioteca restaura filtros de versao, testamentos e livros deuterocanonicos - v2.8.4 | Codex |
| 2026-07-29 | fix | app/api/devotional/daily/route.ts, services/devotionalResolver.ts, tests/devotionalResolver.test.ts | Pao Diario preserva leitura canonica e fallback local quando a personalizacao falha - v2.8.3 | Codex |
| 2026-07-29 | refactor | views/NewHomePage.tsx, app/globals.css, tests/newHomeSettings.test.ts | NewHome refatorada para consumir tokens oficiais por aba e por bloco contextual - v2.8.2 | Codex |
| 2026-07-29 | style | constants.ts, utils/moduleTheme.ts, app/globals.css, components/*Shell.tsx, views/NewHomePage.tsx, views/social/SocialFeedPage.tsx | Identidade visual tipada e acessível por módulos, com navegação e shells padronizados - v2.8.1 | Codex |
| 2026-07-28 | feat | components/study-studio/, hooks/studyStudio/, services/studyStudio/, views/CreateLandingPage.tsx, views/CreateRoomStudioPage.tsx, supabase/migrations/, app/criar-conteudo-v2/, app/criar-conteudo-v3/ | Estudio concluido com diff de IA, persistencia otimista, biblioteca e consolidacao de rotas - v2.8.0 | Codex |
| 2026-07-28 | refactor | components/study-studio/StudyStudio.tsx, hooks/studyStudio/, views/CreateLandingPage.tsx, app/criar-conteudo*, views/CreateRoomStudioPage.tsx | Host canonico, capabilities e recuperacao local versionada do Estudio - v2.7.1 | Codex |
| 2026-07-28 | refactor | views/CreateLandingPage.tsx, views/CreateRoomStudioPage.tsx, components/study-studio/, utils/studyDocument.ts, app/api/ai/studio/route.ts | Estudio da Palavra unificado com grade canonica, IA no servidor e renderizador compartilhado - v2.7.0 | Codex |
| 2026-07-27 | style | views/NewHomePage.tsx, tests/newHome.spec.ts | Faixa da jornada reduzida a tres CTAs equivalentes - v2.6.17 | Codex |
| 2026-07-27 | fix | views/NewHomePage.tsx, tests/newHome.spec.ts | Pesquisa compacta com saudacao lateral e abas restauradas - v2.6.16 | Codex |
| 2026-07-27 | style | views/NewHomePage.tsx, tests/newHome.spec.ts | Barra compacta com saudacao Bem-vindo integrada - v2.6.15 | Codex |
| 2026-07-27 | refactor | views/NewHomePage.tsx, tests/newHome.spec.ts | Minha semana promovida e Minha escala priorizada na nova Home - v2.6.14 | Codex |
| 2026-07-27 | fix | components/CultoPlusPageShell.tsx, components/MobileBottomNav.tsx, views/NewHomePage.tsx | Menu Cultos direcionado para Meus Cultos - v2.6.13 | Codex |
| 2026-07-27 | style | views/social/SocialFeedPage.tsx, tests/socialFeedWidth.spec.ts | Reino com coluna editorial ampliada e responsiva - v2.6.12 | Codex |
| 2026-07-27 | refactor | views/GuidedPrayersPage.tsx, tests/guidedPrayersExperience.spec.ts | Oracoes alinhadas ao tema biblico premium do Pao Diario - v2.6.11 | Codex |
| 2026-07-27 | refactor | views/DevotionalPage.tsx, tests/devotionalExperience.spec.ts | Leitura prioritaria no Pao Diario com reflexao antes do contexto e etapas secundarias - v2.6.10 | Codex |
| 2026-07-24 | feat | components/culto-plus/CultoPlusOnePage.tsx, components/culto-plus/CultoPlusTopActions.tsx | Modo compacto de culto com transmissão e seis ações na primeira tela horizontal - v2.6.9 | Codex |
| 2026-07-24 | fix | components/culto-plus/CultoLiveTimeline.tsx | Reações reposicionadas no rodapé da timeline e alinhadas às ações da transmissão - v2.6.8 | Codex |
| 2026-07-24 | fix | components/culto-plus/CultoLiveTimeline.tsx | Filtro da timeline acima das reações, responsivo e acessível - v2.6.7 | Codex |
| 2026-07-24 | fix | contexts/AuthContext.tsx, components/LoginModal.tsx, components/culto-plus/CultoPlusOnePage.tsx, utils/authIntent.ts | Retorno seguro ao culto e registro único da reação iniciada antes do login - v2.6.6 | Codex |
| 2026-07-24 | feat | components/culto-plus/, services/cultoPlusService.ts, supabase/migrations/ | Tres reacoes acumulativas com foto flutuante e atualizacao Realtime na timeline - v2.6.5 | Codex |
| 2026-07-24 | feat | components/culto-plus/, services/cultoPlusService.ts, supabase/migrations/, scripts/seed_full_qa_fixture.mjs | Timeline liturgica viva com participacao em tempo real e oracao privada redigida - v2.6.4 | Codex |
| 2026-07-24 | refactor | components/culto-plus/, components/Layout.tsx, utils/cultoPlusOnePage.ts | Template público de culto imersivo, responsivo e compartilhado - v2.6.3 | Codex |
| 2026-07-23 | feat | scripts/seed_full_qa_fixture.mjs, docs/qa-massa-completa.md, package.json | Massa QA idempotente com cinco personas e cobertura integral do ecossistema - v2.6.2 | Codex |
| 2026-07-23 | fix | supabase/migrations/, services/, components/church-management/, utils/churchManagementRules.ts | Estrutura operacional completa, quiz personalizado e permissões separadas por papel e escopo - v2.6.1 | Codex |
| 2026-07-23 | feat | services/kingdomPublishingService.ts, components/social/, views/QuizPage.tsx, supabase/migrations/20260723184447_secure_kingdom_posts.sql | Contrato central de publicação, cards estruturados e audiência protegida por RLS - v2.6.0 | Codex |
| 2026-07-22 | fix | views/DevotionalPage.tsx, tests/devotionalExperience.spec.ts | Coluna do Sentido central centralizada sem perder justificacao - v2.5.18 | Codex |
| 2026-07-22 | refactor | views/DevotionalPage.tsx, tests/devotionalExperience.spec.ts | Navegacao visual das cinco etapas e Sentido central estruturado - v2.5.17 | Codex |
| 2026-07-22 | style | views/DevotionalPage.tsx, tests/devotionalExperience.spec.ts | Modo escuro suavizado e textos bíblicos em branco envelhecido - v2.5.16 | Codex |
| 2026-07-22 | fix | components/CultoPlusPageShell.tsx, views/DevotionalPage.tsx, tests/devotionalExperience.spec.ts | Altura natural do shell e rolagem vertical do Pão Diário restauradas - v2.5.15 | Codex |
| 2026-07-22 | refactor | app/devocional/page.tsx, views/DevotionalPage.tsx, tests/devotionalExperience.spec.ts | Pão Diário integrado ao menu oficial responsivo do Culto+, sem navegação duplicada - v2.5.14 | Codex |
| 2026-07-22 | refactor | views/DevotionalPage.tsx, tests/devotionalExperience.spec.ts | Pão Diário em tema bíblico premium, versículos em serifada clássica e leitor em largura total - v2.5.13 | Codex |
| 2026-07-22 | feat | app/api/devotional/daily/route.ts, services/devotionalResolver.ts, views/DevotionalPage.tsx, supabase/migrations/20260722145400_daily_devotional_rotation.sql | Pão Diário compartilhado por data, catálogo sem repetição e atualização pessoal diária - v2.5.12 | Codex |
| 2026-07-21 | refactor | app/social/page.tsx, views/social/SocialFeedPage.tsx, components/Layout.tsx, components/social/ | Feed do Reino integrado ao shell, menu e identidade visual Culto+ - v2.5.11 | Codex |
| 2026-07-21 | refactor | components/AppViewSwitcher.tsx, tests/appViewSwitcher.test.ts | Alternância de visão compactada em ícones lado a lado, sem cards, selo ou opção de ocultar - v2.5.10 | Codex |
| 2026-07-21 | feat | app/api/bible/context/route.ts, services/devotionalBibleContextService.ts, utils/devotionalBibleContext.ts, views/DevotionalPage.tsx | Etapa Palavra enriquecida com contexto bíblico real, observação guiada e reflexão pastoral identificada - v2.5.9 | Codex |
| 2026-07-21 | refactor | views/DevotionalPage.tsx, components/Layout.tsx, tests/devotionalExperience.spec.ts, docs/roadmaps/pao-diario-cultoplus-roadmap.md | Pão Diário convertido em leitor de estudo compacto com uma etapa por vez e navegação guiada - v2.5.8 | Codex |
| 2026-07-21 | refactor | app/devocional/page.tsx, views/DevotionalPage.tsx, tests/devotionalExperience.spec.ts, tests/cultoPlusBibleModulePages.spec.ts | Pão Diário convertido de dashboard em landing editorial e tela contínua de leitura - v2.5.7 | Codex |
| 2026-07-21 | feat | views/DevotionalPage.tsx, components/DevotionalFeed*, services/devotionalJourneyService.ts, utils/devotional*, components/social/FeedPostCard.tsx | Pão Diário guiado em cinco etapas com retomada, modo sem interrupções e publicação opcional no Reino - v2.5.6 | Codex |
| 2026-07-21 | refactor | app/devocional, app/oracoes, app/plano, app/quiz, components/CultoPlusPageShell.tsx, components/Layout.tsx, components/MobileBottomNav.tsx, views/ | Pão Diário, Orações, Meta de Leitura e Quiz integrados ao shell e à identidade Culto+ - v2.5.5 | Codex |
| 2026-07-21 | refactor | app/biblia, app/bibliasagrada, components/CultoPlusPageShell.tsx, components/Layout.tsx, components/MobileBottomNav.tsx, views/ReaderPage.tsx | Bíblia Sagrada integrada ao menu e à identidade oficial Culto+ - v2.5.4 | Codex |
| 2026-07-17 | refactor | app/intro, components/CultoPlusIntroPage.tsx, tests/intro.spec.ts | Apresentacao do Culto+ como ecossistema integral e responsivo - v2.5.3 | Codex |
| 2026-03-10 | feat | components/Layout.tsx | Implementacao inicial do Header Centrado | Antigravity |
| 2026-03-17 | chore | .agents/ | Setup completo dos Agentes Pastor, CPO e Arquiteto | Antigravity |
| 2026-04-01 | fix | app/, components/, views/ | Persistencia de imagem de capa de estudos | Antigravity |
| 2026-04-23 | feat | app/, components/, utils/ | Acesso Freemium & Estudio Profissional - v1.9.0 | Antigravity |
| 2026-04-29 | docs | _ARCHITECT_AGENT.md | Regra obrigatoria para avaliar e manter log de atividades em funcionalidades modificadas | Codex |
| 2026-05-06 | feat | core | Ecossistema Social & Expansão Eclesiástica - v2.0.0 | Antigravity |
| 2026-06-12 | feat | utils/, services/, app/competicao, views/ | Expansao de Mana, niveis, regras e competicao - v2.3.0 | Codex |
| 2026-07-12 | feat | app/newhome, views/, components/ | New Home isolada, responsiva e personalizada por papel - v2.4.0 | Codex |
| 2026-07-16 | refactor | app/minha-igreja, views/MyCultosPage.tsx, components/ | Centralizacao da experiencia pessoal de cultos, escalas e voluntariado - v2.4.1 | Codex |
| 2026-07-16 | feat | app/gestao-igreja, components/church-management, services/ | Central operacional de pessoas, equipes, agenda e escalas por culto - v2.5.0 | Codex |
| 2026-07-16 | refactor | components/church-management, app/gestao-igreja, services/ | Pessoas como lista operacional unica, sem abas, com drawers e pop-ups contextuais - v2.5.1 | Codex |
| 2026-07-17 | feat | components/church-management, services/, utils/ | Recusa de candidatura com retorno ao usuario e nova solicitacao liberada - v2.5.2 | Codex |


---

> "Construimos sobre rocha. A flexibilidade do codigo nao deve comprometer a solidez da base."
