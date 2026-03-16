# 📜 Histórico de Mudanças (Changelog)

> **AI INSTRUCTION:** Ao finalizar uma tarefa, adicione uma nova entrada no topo desta lista.
> **VERSION SYNC:** Lembre-se de atualizar `constants.ts`, `_ARCHITECTURE.md` e `_PROJECT_CONTEXT.md` ao mudar a versão aqui.
> **GIT SYNC:** Após atualizar este arquivo, o Arquiteto deve executar `git commit` com a mensagem do release.

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
