# Front Mobile e Fluxo Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir responsividade mobile e inconsistencias de fluxo/rotas no front sem alterar layout visual nem regras de negocio.

**Architecture:** A implementacao vai fortalecer o shell global e os padroes responsivos compartilhados antes de aplicar correcoes nas telas criticas. O foco sera reduzir conflitos entre elementos fixos, consolidar fluxos de navegacao e trocar rigidez estrutural por wrappers e utilitarios reutilizaveis.

**Tech Stack:** Next.js 16, React 18, TypeScript, Tailwind CSS 4, utilitario de roteamento customizado sobre `next/navigation`

---

## Chunk 1: Base Compartilhada

### Task 1: Mapear e ajustar shell global

**Files:**
- Modify: `app/globals.css`
- Modify: `components/Layout.tsx`
- Modify: `components/MobileBottomNav.tsx`

- [ ] **Step 1: Identificar classes fixas e espacos seguros usados pelo shell**
- [ ] **Step 2: Ajustar wrappers globais para evitar overflow lateral e sobreposicao mobile**
- [ ] **Step 3: Alinhar comportamento de header/back button/bottom nav por contexto**
- [ ] **Step 4: Verificar visualmente por leitura de diff e manter o layout existente**

### Task 2: Padronizar utilitarios de fluxo

**Files:**
- Modify: `utils/router.tsx`
- Modify: paginas `app/*/page.tsx` que funcionam como aliases ou entradas de builder

- [ ] **Step 1: Garantir navegacao conservadora para aliases e retornos**
- [ ] **Step 2: Reduzir fragilidade causada por estado efemero onde houver fallback por URL**
- [ ] **Step 3: Validar compatibilidade com os caminhos existentes**

## Chunk 2: Builders Criticos

### Task 3: Refatorar `CreateStudyPage`

**Files:**
- Modify: `views/CreateStudyPage.tsx`

- [ ] **Step 1: Ajustar barra de acao, painel lateral e canvas para mobile**
- [ ] **Step 2: Remover larguras rigidas perigosas e reforcar conteudo rolavel**
- [ ] **Step 3: Preservar a ordem e a aparencia geral dos componentes**

### Task 4: Refatorar `PlanBuilderPage`

**Files:**
- Modify: `views/PlanBuilderPage.tsx`
- Modify: `components/Builder/*.tsx` se necessario

- [ ] **Step 1: Padronizar tabs, header interno, canvas widths e area util no mobile**
- [ ] **Step 2: Ajustar editor/paineis para nao disputar espaco com shell global**
- [ ] **Step 3: Manter o fluxo entre planejamento, conteudo, configuracoes e avaliacao**

### Task 5: Refatorar `SermonBuilderPage`

**Files:**
- Modify: `views/SermonBuilderPage.tsx`

- [ ] **Step 1: Aplicar o mesmo padrao conservador de responsividade**
- [ ] **Step 2: Garantir consistencia com os outros builders**

## Chunk 3: Varredura Conservadora

### Task 6: Corrigir paginas secundarias com grids e tabs rigidos

**Files:**
- Modify: `views/ExplorePage.tsx`
- Modify: `views/ProfilePage.tsx`
- Modify: `views/PrayersManagerPage.tsx`
- Modify: `views/WorkspacePage.tsx`
- Modify: `views/PastoralWorkspacePage.tsx`
- Modify: outros arquivos encontrados durante a varredura

- [ ] **Step 1: Corrigir colunas fixas que quebram no mobile**
- [ ] **Step 2: Ajustar listas horizontais, truncamento e `min-w-0`**
- [ ] **Step 3: Reaplicar padroes compartilhados sem redesign**

## Chunk 4: Verificacao

### Task 7: Validar build e impactos da refatoracao

**Files:**
- Verify: `package.json`

- [ ] **Step 1: Rodar `npm run build`**
- [ ] **Step 2: Revisar erros e ajustar o necessario**
- [ ] **Step 3: Confirmar que os builders e shell global continuam compilando**
