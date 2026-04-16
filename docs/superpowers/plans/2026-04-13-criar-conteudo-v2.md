# Criar Conteudo V2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated `/criar-conteudo-v2` route with an editorial layout inspired by the approved image while preserving the existing V1 flow.

**Architecture:** Add a new App Router entry point that renders a dedicated V2 view with local mock state and focused presentational components. Keep the V2 independent from the legacy builder schema so we can validate the new experience without risking regressions in `/criar-conteudo`.

**Tech Stack:** Next.js App Router, React 18, TypeScript, TailwindCSS 4, Playwright.

---

## Chunk 1: Route Smoke Test

### Task 1: Add a failing Playwright smoke test for the new route

**Files:**
- Create: `tests/criarConteudoV2.spec.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `npx playwright test tests/criarConteudoV2.spec.ts --project=chromium` and verify the route fails before implementation**

## Chunk 2: V2 Route and View

### Task 2: Add a dedicated route entry and editorial page view

**Files:**
- Create: `app/criar-conteudo-v2/page.tsx`
- Create: `views/CreateContentV2Page.tsx`

- [ ] **Step 1: Add the new App Router page that renders the V2 view**
- [ ] **Step 2: Build the V2 view with hero, split banner, highlight carousel, two-column study area, sidebar cards, and reflection card**
- [ ] **Step 3: Reuse existing shared utilities only when they reduce risk; keep V2 state local**

## Chunk 3: Verification

### Task 3: Verify the route works and remains isolated from V1

**Files:**
- Modify: `tests/criarConteudoV2.spec.ts`

- [ ] **Step 1: Re-run `npx playwright test tests/criarConteudoV2.spec.ts --project=chromium` and verify it passes**
- [ ] **Step 2: Run `npm run typecheck` to catch TypeScript issues introduced by the new route**
- [ ] **Step 3: Report results with any remaining risks**
