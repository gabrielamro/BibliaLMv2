# BibliaLM Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** reduzir lixo versionado, restaurar gates de qualidade, corrigir inconsistencias tipadas e preparar a base para consolidar a arquitetura Next.js + Supabase + services sem regressao.

**Architecture:** a limpeza deve ser incremental e em baixo risco. Primeiro removemos artefatos mortos e restauramos a capacidade de validar o projeto; depois corrigimos erros reais de tipagem e residuos de migracao; por fim endurecemos a fronteira de IA e planejamos a consolidacao de `app/` sobre a camada atual de `views/` e `components/`.

**Tech Stack:** Next.js 16, React 18, TypeScript 5, Supabase, Playwright, App Router, custom router shim em `utils/router.tsx`.

---

## File Map

**Core validation and config**
- Modify: `C:\Users\gabri\Downloads\biblialm\package.json`
- Modify: `C:\Users\gabri\Downloads\biblialm\tsconfig.json`
- Modify: `C:\Users\gabri\Downloads\biblialm\.gitignore`

**Immediate code fixes**
- Modify: `C:\Users\gabri\Downloads\biblialm\components\Layout.tsx`
- Modify: `C:\Users\gabri\Downloads\biblialm\services\devotionalResolver.ts`
- Modify: `C:\Users\gabri\Downloads\biblialm\services\supabase.ts`
- Modify: `C:\Users\gabri\Downloads\biblialm\views\public\PublicUserProfilePage.tsx`
- Modify: `C:\Users\gabri\Downloads\biblialm\components\reader\ReaderView.tsx`
- Modify: `C:\Users\gabri\Downloads\biblialm\services\geminiService.ts`

**Cleanup targets**
- Remove from git: `C:\Users\gabri\Downloads\biblialm\dist\`
- Remove from git: `C:\Users\gabri\Downloads\biblialm\tmp\`
- Remove from git: `C:\Users\gabri\Downloads\biblialm\test-results\`
- Remove from git: root temp/debug files such as `build_log*.txt`, `tsc_errors*.txt`, `tmp_*`, `test_*.js`, `test_*.ts`
- Review/archive: `C:\Users\gabri\Downloads\biblialm\desativados\`
- Review/update: `C:\Users\gabri\Downloads\biblialm\views\AdminPage.tsx`

**Verification**
- Run: `npx tsc --noEmit`
- Run: `npm run build`
- Run: targeted Playwright or unit tests affected by each phase

---

## Chunk 1: Repository Hygiene And Validation Baseline

### Task 1: Remove Versioned Build And Debug Artifacts

**Files:**
- Modify: `C:\Users\gabri\Downloads\biblialm\.gitignore`
- Remove from git: `C:\Users\gabri\Downloads\biblialm\dist\`
- Remove from git: `C:\Users\gabri\Downloads\biblialm\tmp\`
- Remove from git: `C:\Users\gabri\Downloads\biblialm\test-results\`
- Remove from git: root temp/debug artifacts

- [ ] **Step 1: Confirm tracked garbage before deletion**

Run: `git ls-files dist tmp desativados test-results`
Expected: tracked files appear under ignored directories, confirming repository pollution.

- [ ] **Step 2: Expand ignore rules only if a missing pattern is discovered**

Review: `C:\Users\gabri\Downloads\biblialm\.gitignore`
Expected: `dist/`, `tmp/`, `test-results/`, `tmp_*.ts`, `test_*.ts` already covered; add only missing root artifacts such as `build_log*.txt` or `tsc_errors*.txt` if desired.

- [ ] **Step 3: Remove tracked artifacts from git index without deleting working copies**

Run:
```powershell
git rm -r --cached dist tmp test-results
git rm --cached build_log.txt build_log_new.txt tsc_errors.log tsc_errors.txt tsc_errors_utf8.txt
git rm --cached tmp_check_tables.cjs tmp_layout.tsx tmp_test_comments.cjs tmp_test_comments.js tmp_test_comments.ts tmp_test_gen.cjs tmp_test_gen.ts
```
Expected: only generated/debug files are unstaged for removal; active source files remain untouched.

- [ ] **Step 4: Review whether `desativados/` should be removed or archived**

Run: `git ls-files desativados`
Expected: folder is versioned and clearly separate from active app code.

- [ ] **Step 5: Commit hygiene-only cleanup**

```bash
git add .gitignore
git commit -m "chore(repo): remove tracked artifacts and debug leftovers"
```

### Task 2: Restore Local Quality Gates

**Files:**
- Modify: `C:\Users\gabri\Downloads\biblialm\package.json`
- Modify: `C:\Users\gabri\Downloads\biblialm\tsconfig.json`

- [ ] **Step 1: Fix TypeScript include scope**

Update `tsconfig.json` so `app/` is included in compilation alongside existing folders.

- [ ] **Step 2: Replace the broken lint script**

Current `next lint` is incompatible with this setup on Next 16. Replace with a supported command, for example:
```json
"lint": "eslint ."
```
Only do this after confirming ESLint is configured or add a minimal config in a separate small step.

- [ ] **Step 3: Add a dedicated typecheck script**

Add:
```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 4: Verify the new validation commands**

Run:
```bash
npm run typecheck
npm run build
```
Expected: typecheck may still fail on real code issues, but the command itself must run correctly; build must remain green.

- [ ] **Step 5: Commit validation baseline**

```bash
git add package.json tsconfig.json
git commit -m "chore(tooling): restore typecheck and lint entrypoints"
```

---

## Chunk 2: Fix Confirmed Type Errors Before Refactors

### Task 3: Fix `Layout` Effect Cleanup Contract

**Files:**
- Modify: `C:\Users\gabri\Downloads\biblialm\components\Layout.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Write the smallest failing expectation**

Current issue: effect cleanup at `components/Layout.tsx:118` returns `setTimeout(...)` instead of clearing the timer.

- [ ] **Step 2: Implement the minimal correction**

Use a stable timer variable and cleanup with `clearTimeout(timer)`.

- [ ] **Step 3: Run targeted verification**

Run: `npx tsc --noEmit`
Expected: the `Layout.tsx` error disappears.

- [ ] **Step 4: Commit this isolated fix**

```bash
git add components/Layout.tsx
git commit -m "fix(layout): correct effect cleanup typing"
```

### Task 4: Fix Devotional Resolver Provider Drift

**Files:**
- Modify: `C:\Users\gabri\Downloads\biblialm\services\devotionalResolver.ts`
- Inspect supporting contract: `C:\Users\gabri\Downloads\biblialm\services\pastorAgent.ts` or provider type definition used by `generateDailyDevotional`

- [ ] **Step 1: Inspect the actual signature of `generateDailyDevotional`**

Confirm the accepted parameters and the current `AIProvider` union.

- [ ] **Step 2: Remove or replace invalid provider literal `bigpickle`**

Replace with a valid provider if the function supports provider selection, or remove the extra argument if no longer supported.

- [ ] **Step 3: Re-run typecheck**

Run: `npx tsc --noEmit`
Expected: errors at `services/devotionalResolver.ts:106` and `:177` disappear.

- [ ] **Step 4: Commit the resolver fix**

```bash
git add services/devotionalResolver.ts
git commit -m "fix(devotional): align provider usage with current API"
```

### Task 5: Sync Global Types With Supabase And Profile Usage

**Files:**
- Modify: `C:\Users\gabri\Downloads\biblialm\services\supabase.ts`
- Modify: `C:\Users\gabri\Downloads\biblialm\views\public\PublicUserProfilePage.tsx`
- Inspect: `C:\Users\gabri\Downloads\biblialm\types.ts`

- [ ] **Step 1: Import the missing `SacredArtImage` type**

`types.ts` already defines it; add the import in `services/supabase.ts`.

- [ ] **Step 2: Fix `CustomPlan` usage mismatch**

`PublicUserProfilePage` expects `plan.totalDays`, but `CustomPlan` does not expose it. Compute days from `weeks`, or add a helper local to the page instead of mutating the global type without evidence.

- [ ] **Step 3: Re-run typecheck**

Run: `npx tsc --noEmit`
Expected: errors at `services/supabase.ts` and `views/public/PublicUserProfilePage.tsx` disappear.

- [ ] **Step 4: Commit contract sync**

```bash
git add services/supabase.ts views/public/PublicUserProfilePage.tsx
git commit -m "fix(types): align profile and gallery contracts"
```

---

## Chunk 3: Remove Migration Residue

### Task 6: Finish Routing Migration Cleanup

**Files:**
- Modify: `C:\Users\gabri\Downloads\biblialm\components\reader\ReaderView.tsx`
- Modify: `C:\Users\gabri\Downloads\biblialm\package.json`
- Modify: `C:\Users\gabri\Downloads\biblialm\package-lock.json`
- Inspect: `C:\Users\gabri\Downloads\biblialm\utils\router.tsx`

- [ ] **Step 1: Remove the last direct `react-router-dom` import**

`ReaderView.tsx` imports `useNavigate` from `react-router-dom` but does not need it. Remove the unused import or migrate to `utils/router.tsx` if navigation is actually needed.

- [ ] **Step 2: Confirm no remaining runtime imports**

Run: `git grep -n "react-router-dom" -- '*.ts' '*.tsx'`
Expected: only migration scripts may remain; app runtime should be clean.

- [ ] **Step 3: Remove the dependency**

Run:
```bash
npm uninstall react-router-dom
```
Expected: `package.json` and lockfile update cleanly.

- [ ] **Step 4: Verify app still builds**

Run:
```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 5: Commit migration cleanup**

```bash
git add components/reader/ReaderView.tsx package.json package-lock.json
git commit -m "refactor(routing): remove remaining react-router-dom dependency"
```

### Task 7: Archive Or Delete Legacy Docs And Inactive Code Paths

**Files:**
- Review/update: `C:\Users\gabri\Downloads\biblialm\views\AdminPage.tsx`
- Review/archive: `C:\Users\gabri\Downloads\biblialm\desativados\`

- [ ] **Step 1: Decide whether inactive code is historical reference or dead code**

If historical reference matters, move selected files to `docs/archive/`; otherwise remove them from git.

- [ ] **Step 2: Remove stale embedded architecture manifesto**

`views/AdminPage.tsx` still references Vite/Firebase/React Router. Update it to match Next/Supabase or remove embedded architecture text entirely in favor of `_ARCHITECT_AGENT.md`.

- [ ] **Step 3: Run quick smoke validation**

Run: `npm run build`
Expected: admin and system pages still compile without stale content dependencies.

- [ ] **Step 4: Commit legacy cleanup**

```bash
git add views/AdminPage.tsx docs
git commit -m "docs(admin): remove stale architecture references"
```

---

## Chunk 4: Harden The AI Boundary

### Task 8: Move AI Provider Access Behind Server-Side Endpoints

**Files:**
- Modify: `C:\Users\gabri\Downloads\biblialm\services\geminiService.ts`
- Create: `C:\Users\gabri\Downloads\biblialm\app\api\ai\...` route handlers as needed
- Modify callers that currently invoke provider SDKs directly from client components

- [ ] **Step 1: Inventory all client-side provider entrypoints**

Focus on calls that use `NEXT_PUBLIC_API_KEY`, `NEXT_PUBLIC_GROQ_API_KEY`, `NEXT_PUBLIC_OPENROUTER_API_KEY`, and `NEXT_PUBLIC_PEXELS_API_KEY`.

- [ ] **Step 2: Split browser-safe orchestration from server-only provider access**

Create server routes or server modules that:
- read private env vars only on the server
- enforce quota and auth before provider calls
- centralize retry and provider fallback rules

- [ ] **Step 3: Update one vertical at a time**

Recommended order:
1. text chat
2. devotional generation
3. image generation
4. podcast generation

- [ ] **Step 4: Add verification per vertical**

For each migrated vertical:
- run targeted UI flow
- confirm no provider key remains exposed in browser code
- confirm `checkFeatureAccess` is still enforced before requests leave the client

- [ ] **Step 5: Commit by vertical, not in one mega-commit**

Example:
```bash
git commit -m "refactor(ai): move chat generation to server boundary"
```

---

## Chunk 5: Consolidate Architecture Without Big Bang Refactor

### Task 9: Define The End-State For `app/`, `views/`, And `components/`

**Files:**
- Review: `C:\Users\gabri\Downloads\biblialm\app\`
- Review: `C:\Users\gabri\Downloads\biblialm\views\`
- Review: `C:\Users\gabri\Downloads\biblialm\components\`

- [ ] **Step 1: Keep current wrappers stable while documenting target boundaries**

Target model:
- `app/` owns routing, metadata, server boundaries, auth redirects
- `components/` owns reusable UI
- `services/` owns API/data/business integrations
- `views/` is transitional and should shrink over time

- [ ] **Step 2: Pick one route family to absorb first**

Recommended pilot:
- `app/biblia/*`
- `app/social/*`

Reason: these areas are high-value and already strongly tied to App Router navigation patterns.

- [ ] **Step 3: For the pilot family, move page composition into `app/`**

Do not rewrite all screens. Move only route-level composition and leave large presentational pieces in `components/`.

- [ ] **Step 4: Verify parity**

Run:
```bash
npm run build
npx tsc --noEmit
```
Add or update Playwright coverage for the migrated routes if behavior changes.

- [ ] **Step 5: Commit per route family**

```bash
git commit -m "refactor(app): absorb bible route composition into app router"
```

---

## Final Verification Checklist

- [ ] `git status --short` shows only intended cleanup changes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] `git grep -n "react-router-dom" -- '*.ts' '*.tsx'` returns no runtime usage
- [ ] `git ls-files dist tmp test-results` returns nothing
- [ ] client bundles no longer read provider secrets from `NEXT_PUBLIC_*` keys for paid AI services

## Recommended Execution Order

1. Chunk 1 first
2. Chunk 2 second
3. Chunk 3 third
4. Chunk 4 as a dedicated refactor stream
5. Chunk 5 only after validation and AI hardening are stable

## Notes For The Implementer

- Do not touch the user's current uncommitted sacred-art changes unless a task directly requires it.
- Do not mix repository hygiene with AI boundary refactors in the same commit.
- Prefer removing dead code over keeping “just in case” files in the active tree.
- When a global type mismatch appears, prefer local derivation/helpers before expanding shared types without data evidence.
- Preserve the project rule that UI should not directly own API/database logic; keep business and provider access in `services/` or server routes.

Plan complete and saved to `docs/superpowers/plans/2026-04-06-cleanup-roadmap.md`. Ready to execute?
