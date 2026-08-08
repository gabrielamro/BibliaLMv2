---
name: culto-plus
description: Especialista no aplicativo Culto+ (v2.10.6) — Arquitetura, Regras de Negócio, Módulos Visuais, Banco de Dados, Gamificação (Maná) e Fluxos do Ecossistema.
---

# 📖 Culto+ Skill (v2.10.6)

Esta skill é o guia definitivo de arquitetura, ecossistema, módulos visuais, banco de dados, regras de negócio e boas práticas do **Culto+** (anteriormente BibliaLM).

---

## 1. Visão Geral e Identidade da Marca

- **Nome Oficial da Marca**: `Culto+` (Versão Atual: `v2.10.6`).
- **Domínio e Origem Canônica**: `https://cultomais.vercel.app`.
- **Nomes Legados**: `BibliaLM` e domínios anteriores (`biblialm.com.br`, `biblialm.vercel.app`) são mantidos exclusivamente para redirecionamentos e compatibilidade.
- **Propósito**: Plataforma cristã integrada para leitura bíblica, devocionais ("Pão Diário"), crescimento espiritual, gamificação ("Maná"), comunidade social ("O Reino" / "Trama Viva"), acompanhamento de cultos ao vivo ("Cultos"), gestão de voluntários/escalas ("Gestão da Igreja") e ferramentas pastorais ("Workspace Pastoral").
- **Fontes da Verdade**:
  - `constants.ts`: Configurações centrais, versão (`SYSTEM_VERSION`), versículos e limites.
  - `types.ts`: Definições globais de tipos e interfaces TypeScript.
  - `_ARCHITECT_AGENT.md`: Leis inegociáveis de arquitetura e histórico de versões.
  - `_PROJECT_CONTEXT.md`: Regras de negócio, visão do produto e módulo visual.

---

## 2. Leis Inegociáveis da Arquitetura

1. **Segurança de Dados**:
   - Nenhuma chave secreta ou credencial de API deve ficar exposta no cliente.
   - Variáveis de ambiente e operações privilegiadas permanecem restritas ao servidor (`.env`).
2. **Controle de Gastos e Cotas de IA**:
   - Toda chamada às APIs de Inteligência Artificial deve obrigatoriamente ser envolvida por `checkFeatureAccess` e protegida por `retryWithBackoff`.
3. **Pureza da Camada de Apresentação**:
   - Componentes React (`components/` e `views/`) lidam apenas com renderização e estado local da UI.
   - Toda lógica de negócios, banco de dados (Supabase) e APIs deve residir nos serviços (`services/`).
4. **Fonte Única de Tipos e Constantes**:
   - `types.ts` é a única fonte autorizada para contratos e interfaces globais.
   - `constants.ts` centraliza parâmetros de sistema, limites e metadados.
5. **Registro de Atividades (Audit & XP)**:
   - Funcionalidades relevantes do usuário devem ser registradas via `recordActivity`/`earnMana` (`utils/activityRules.ts`), alimentando a tabela `mana_events` e os logs de perfil.
   - Proibido `console.log` em código de produção.

---

## 3. Arquitetura Técnica e Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript.
- **Estilização**: Tailwind CSS v4 + CSS Variables para design system de módulos + Framer Motion.
- **Banco de Dados & Auth**: Supabase PostgreSQL + Auth + Realtime + Storage + Row Level Security (RLS).
- **Inteligência Artificial (Obreiro IA)**: `@google/genai` (Gemini 2.5 Flash / Pro, Gemini TTS para áudio e podcast, geração de artes sacras com Imagen/Gemini).
- **Editores**: `@tiptap/react` (Estúdio da Palavra), `@grapesjs/react` (Páginas Web da Igreja), `konva`/`react-konva` (Canvas de Artes Sacras).
- **Testes & Qualidade**: Playwright (`@playwright/test`) para E2E e testes integrados, scripts de QA em `scripts/seed_full_qa_fixture.mjs`.

---

## 4. Módulos e Identidade Visual (Module Design System)

Cada rota pertence a um módulo visual resolvido em `utils/moduleTheme.ts` e `constants.ts` (`APP_MODULES`):

| Módulo | Escopo e Rota Canônica | Cores / Tema Visual |
| :--- | :--- | :--- |
| **Início (Home)** | `/`, `/newhome` | Preto `#0B0F17` + Amarelo da marca `#EAB308` |
| **Bíblia (Reader)** | `/biblia`, `/devocional`, `/oracoes`, `/plano`, `/quiz` | Tema Pão Diário: Pergaminho `#FDFBF7`, carvão `#1C1917`, couro/marrom `#78350F`, ouro `#D97706`, texto em branco envelhecido `#E7E0D4` no modo escuro, fonte serifada |
| **O Reino (Social)** | `/social`, `/u/*`, `/igreja/*`, `/grupo/*`, `/p/*` | Conceito "Trama Viva", gradiente roxo/magenta/coral, cards estilo folha editorial com dobra inferior |
| **Cultos (Services)** | `/meus-cultos`, `/culto/[slug]` | Verde Esmeralda `#10B981`, 5 indicadores sintéticos, agenda de 60 dias da igreja, OnePage imersiva do culto ao vivo |
| **Criar (Estúdio)** | `/criar-conteudo`, `/criar-sala` | Gradiente multicolorido da marca, grade de 12 colunas do Estúdio da Palavra (`StudyDocumentV2`), autocompletar `/`, diff de IA |
| **Gestão da Igreja** | `/gestao-igreja/*` | Preto, grafite e prata `#64748B`, interface operacional por drawers e pop-ups |
| **Workspace Pastoral** | `/workspace-pastoral/*` | Roxo profundo `#8B5CF6`, ambiente exclusivo para pastores criarem Jornadas e prestarem cuidado pastoral |

---

## 5. Hierarquia de Usuários e Permissões

### Assinaturas do Usuário:
- **Visitante (Free)**: Leitura da Bíblia, feed em modo leitura, mural de oração, cota baixa de IA.
- **Semeador (Bronze)**: Chat de IA intermediário, perfil personalizado (~10 imagens/dia).
- **Fiel (Silver)**: Criação de igreja, geração de podcasts (~30 imagens/dia).
- **Visionário (Gold)**: IA ilimitada, destaque global no Reino.
- **Pastor**: Acesso ao Workspace Pastoral, criação de Jornadas e cuidado pastoral.
- **Admin**: Controle total do sistema, limpeza de UGC (hard wipe), painel de CMS e auditoria de Maná.

### Papéis Operacionais na Igreja:
- `church_manager`: Administrador operacional da igreja.
- `pastor`: Responsável pelo cuidado espiritual (não concede gestão da igreja automaticamente).
- `leader`: Líder de célula/grupo de estudo ou equipe.
- `volunteer`: Voluntário com foco nos convites e escalas pessoais.

---

## 6. Gamificação (Sistema de Maná)

- **Moeda**: "Maná" (XP) — não gastável, indica reputação e progresso espiritual.
- **Recursos**: Streaks diários, níveis de usuário, conquistas (badges), ranking público em `/competicao`.
- **Regras Centrais**: Definidas em `utils/activityRules.ts` (ações, limites diários, cooldowns, prevenção de duplicatas).
- **Auditoria**: Tabela `mana_events` com políticas de RLS e aba de auditoria no painel Admin.

---

## 7. Principais Serviços da Aplicação (`services/`)

- `services/supabase.ts`: Cliente centralizado do Supabase, gerenciador de sessão, RLS e chamadas ao PostgreSQL.
- `services/geminiService.ts`: Integração com Gemini (chat, análise de versículos, TTS e geração de podcast).
- `services/cultoPlusService.ts`: Gestão de cultos ao vivo, momentos litúrgicos, presença, orações privadas e reações em tempo real (Amém, Glória, Aleluia).
- `services/churchManagementService.ts`: Cadastro de igrejas, gestão de membros, solicitação de voluntariado, escalas e equipes.
- `services/kingdomPublishingService.ts` & `services/postInteractionService.ts`: Publicação no Reino, interações (curtir, salvar, ocultar, denunciar), comentários e audiência protegida por RLS.
- `services/devotionalResolver.ts` & `services/devotionalBibleContextService.ts`: Lógica do Pão Diário com trava por data (`America/Manaus`), contexto bíblico imediato e reflexão pastoral.
- `services/bibleService.ts`: Consulta de livros, capítulos, versículos e busca offline-first.

---

## 8. Workflow para Desenvolvedores e Agentes

1. **Antes de Modificar Código**:
   - Verifique o impacto nas regras em `_PROJECT_CONTEXT.md` e `_ARCHITECT_AGENT.md`.
   - Consulte `types.ts` antes de criar novos modelos de dados.
2. **Durante a Implementação**:
   - Mantenha a separação entre UI (views/components) e lógica de dados (services).
   - Envolva chamadas de IA com `checkFeatureAccess` e `retryWithBackoff`.
   - Assegure suporte responsivo (mobile first / desktop ampliado) e acessibilidade (ARIA).
3. **Verificação & Qualidade**:
   - Execute a verificação de tipos: `npm run typecheck`.
   - Execute a suíte de testes relevante (ex: `npm run test:church-management`, `npm run test:kingdom-ui` ou Playwright).
4. **Entrega & Histórico**:
   - Em modificações relevantes, incremente a versão em `constants.ts` (`SYSTEM_VERSION`).
   - Registre o release no topo de `_RELEASENOTES.md` e na tabela de logs em `_ARCHITECT_AGENT.md`.
