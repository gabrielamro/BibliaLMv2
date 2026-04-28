# Criador Jornada Studio Layout Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current four-step journey creator with a safer "Estudio da Sala" layout where room setup, lessons, publishing readiness, and student preview live in one workspace.

**Architecture:** Implement the new layout incrementally around the existing `CustomPlan` model and existing `dbService` calls. First add regression tests and pure helpers, then extract presentational panels from `views/PlanBuilderPage.tsx`, then switch the default UI only after the new studio layout is verified. Keep lesson editing through the existing embedded `CreateContentV3Page` until the room shell is stable.

**Tech Stack:** Next.js App Router, React 19, TypeScript, TailwindCSS, Supabase services, Playwright, Node test runner.

---

## Product Direction

The current four-step flow is useful for first-time setup, but it is not ideal for managing a living room with many lessons. The new UX should behave like a workspace:

- Left panel: essential room data, cover, organization, access.
- Center panel: lesson structure as the primary working surface.
- Right panel: publication checklist, student preview, quick actions.
- Top actions: save draft, preview, publish.
- Tabs: overview, lessons, students, publication, but without forcing a linear wizard.

The first implementation should avoid database schema changes. Use the existing `CustomPlan.weeks`, `days`, `privacyType`, `coverUrl`, `hasEvaluation`, `evaluationId`, and `status` fields.

## Scope Boundaries

In scope:

- Redesign `/criador-jornada` room management shell.
- Preserve create/edit/delete/reorder lessons.
- Preserve save draft, publish, preview, evaluation creation, cover upload/generation.
- Preserve embedded lesson editor behavior.
- Preserve reduced application menu behavior.
- Add responsive desktop and mobile layouts.

Out of scope for this roadmap:

- Rebuilding the lesson editor itself.
- Changing Supabase schema.
- Rewriting `CreateContentV3Page`.
- New student analytics or real enrollment management beyond placeholders/links.
- New AI generation flows beyond existing cover/content hooks.

## Proposed File Structure

Create focused components so `views/PlanBuilderPage.tsx` stops carrying the entire UI:

- Modify: `views/PlanBuilderPage.tsx`
  - Keep data loading, save/publish orchestration, URL sync, and embedded editor bridge during the first migration.
- Create: `components/PlanStudio/PlanStudioShell.tsx`
  - Layout wrapper for header, tabs, left details, center lessons, right checklist.
- Create: `components/PlanStudio/PlanStudioHeader.tsx`
  - Back, title, status, save, preview, publish.
- Create: `components/PlanStudio/RoomDetailsPanel.tsx`
  - Title, description, cover, frequency, dates, access controls.
- Create: `components/PlanStudio/LessonStructurePanel.tsx`
  - Week/unit list, lesson cards, add unit, add lesson, reorder hooks.
- Create: `components/PlanStudio/PublishChecklistPanel.tsx`
  - Completeness score, requirements, student preview, quick actions.
- Create: `components/PlanStudio/PlanStudioTabs.tsx`
  - Overview/lessons/students/publication navigation.
- Create: `components/PlanStudio/planStudioProgress.ts`
  - Pure helpers for completion score and checklist state.
- Create: `components/PlanStudio/types.ts`
  - UI-only props/types if local typing becomes noisy.
- Create: `tests/planStudioProgress.test.ts`
  - Fast node tests for checklist/completion behavior.
- Create: `tests/criadorJornadaStudio.spec.ts`
  - Playwright smoke/regression test for the new layout.

## Phase 0: Stabilize Baseline

**Goal:** Know what cannot break before touching layout.

- [ ] Add or update a Playwright smoke test that opens `/criador-jornada` and verifies the page loads for an authenticated/pastor-capable path or mocked safe state.
- [ ] Add assertions for the existing core actions: title input, add aula, save draft button, publish button, preview button.
- [ ] Run `npx playwright test tests/criadorJornadaStudio.spec.ts --project=chromium` and record the current failure/pass baseline.
- [ ] Run `npm run typecheck` and document existing unrelated failures before starting UI work.
- [ ] Commit only baseline tests/docs.

Acceptance:

- There is a known automated signal for `/criador-jornada`.
- Existing typecheck failures are documented so new work is not blamed for old debt.

## Phase 1: Extract Pure Checklist Logic

**Goal:** Make publication readiness testable without rendering the page.

- [ ] Create `components/PlanStudio/planStudioProgress.ts`.
- [ ] Add `getPlanStudioChecklist(plan)` returning checklist items: essential data, cover, at least one lesson, optional evaluation, invitations/access.
- [ ] Add `getPlanStudioCompletion(plan)` returning a percentage based on required items only.
- [ ] Write failing tests in `tests/planStudioProgress.test.ts` for empty plan, draft with title only, plan with lesson, and published-ready plan.
- [ ] Implement the minimal helper logic.
- [ ] Run `node --test tests/planStudioProgress.test.ts`.
- [ ] Commit.

Acceptance:

- Checklist state is deterministic and independent from React.
- Optional evaluation does not block publishing unless product decides otherwise.

## Phase 2: Build New Presentational Shell Behind a Flag

**Goal:** Introduce the layout without replacing the current wizard yet.

- [ ] Create `components/PlanStudio/PlanStudioShell.tsx`.
- [ ] Create `PlanStudioHeader`, `PlanStudioTabs`, `RoomDetailsPanel`, `LessonStructurePanel`, and `PublishChecklistPanel` with props only.
- [ ] In `views/PlanBuilderPage.tsx`, render the new shell only when `?studio=1` is present.
- [ ] Pass existing state and handlers into the new shell; do not duplicate save/publish logic.
- [ ] Keep the old four-step UI as default.
- [ ] Add Playwright test for `/criador-jornada?studio=1` verifying the three-panel layout, add aula button, save button, and publish checklist.
- [ ] Run targeted Playwright test and `node --test tests/planStudioProgress.test.ts`.
- [ ] Commit.

Acceptance:

- New layout is visible on `/criador-jornada?studio=1`.
- Old wizard remains available and unchanged.
- All room data still uses the existing `plan` state.

## Phase 3: Wire Lesson Structure Fully

**Goal:** Make the central lesson panel production-ready.

- [ ] Move unit/week rendering into `LessonStructurePanel`.
- [ ] Preserve drag/drop with `@hello-pangea/dnd`.
- [ ] Preserve add unit, rename unit, delete unit, add lesson, rename lesson, delete lesson, open lesson editor.
- [ ] Ensure empty states explain the next action without blocking the user.
- [ ] Add Playwright coverage for add lesson and open embedded editor.
- [ ] Verify that returning from the embedded editor keeps the user in the studio layout.
- [ ] Commit.

Acceptance:

- A pastor can create the room structure from the new layout.
- Lesson editor integration remains intact.
- No database changes are required.

## Phase 4: Wire Room Details and Publishing Panel

**Goal:** Make the left and right panels fully useful.

- [ ] Move title, description, dates, frequency, access, cover prompt/upload/generate controls into `RoomDetailsPanel`.
- [ ] Wire existing `handleFrequencyChange`, `handleSuggestPrompt`, `handleGenerateCover`, and `handleFileChange`.
- [ ] Move evaluation entry point into `PublishChecklistPanel`.
- [ ] Add student preview card using current plan fields only.
- [ ] Add quick actions: generate with IA, import aulas as disabled/placeholder unless existing behavior exists.
- [ ] Add validation messaging for missing title and no lessons before publishing.
- [ ] Add Playwright coverage for title edit, access change, checklist update, and evaluation button.
- [ ] Commit.

Acceptance:

- The new panels cover all existing wizard functionality.
- Checklist updates as the room becomes more complete.
- Publishing still calls the existing `handleSavePlan('published')`.

## Phase 5: Responsive Layout

**Goal:** Make the studio usable on desktop, tablet, and mobile.

- [ ] Desktop: keep 3-column layout with reduced app menu.
- [ ] Tablet: collapse right checklist below center panel or into a side sheet.
- [ ] Mobile: use tabs/accordion sections instead of three simultaneous columns.
- [ ] Ensure all touch targets are at least 44px.
- [ ] Ensure long room titles and lesson titles truncate/wrap cleanly.
- [ ] Run Playwright screenshots at desktop and mobile widths.
- [ ] Commit.

Acceptance:

- No overlapping text or buttons at 390px, 768px, and desktop widths.
- Core actions remain reachable without horizontal scrolling.

## Phase 6: Flip Default and Retire Wizard

**Goal:** Make the studio the default after parity is proven.

- [ ] Change `/criador-jornada` to render the studio layout by default.
- [ ] Keep the old wizard temporarily behind `?wizard=1` for one release if desired.
- [ ] Update breadcrumbs/header behavior for the studio layout.
- [ ] Remove duplicated wizard-only UI after validation window.
- [ ] Update `_RELEASENOTES.md` and `constants.ts` version if this is treated as a significant release.
- [ ] Run `npx playwright test tests/criadorJornadaStudio.spec.ts --project=chromium`.
- [ ] Run `npm run typecheck`.
- [ ] Commit.

Acceptance:

- `/criador-jornada` opens the new studio layout.
- Existing plan editing URLs with `?id=...`, `?tab=...`, and `?lesson=...` still behave correctly or have documented redirects.

## Phase 7: Cleanup and Hardening

**Goal:** Reduce long-term maintenance risk.

- [ ] Extract any remaining bulky UI from `views/PlanBuilderPage.tsx`.
- [ ] Remove unused imports from `PlanBuilderPage.tsx`.
- [ ] Confirm no direct Supabase calls were introduced in components.
- [ ] Confirm AI calls remain behind existing access checks.
- [ ] Add review notes for any known follow-up, especially import aulas and student enrollment.
- [ ] Run final targeted tests and typecheck.
- [ ] Commit.

Acceptance:

- Components have clear responsibilities.
- No unrelated app screens changed.
- The page is easier to maintain than the current single-file wizard.

## Suggested Milestones

1. **MVP seguro:** Phases 0-2. New layout preview available behind `?studio=1`.
2. **Parity funcional:** Phases 3-4. New layout can replace the wizard for real use.
3. **Release candidate:** Phase 5. Responsive and visually approved.
4. **Release:** Phase 6. Studio becomes default.
5. **Maintenance pass:** Phase 7. Remove dead UI and harden tests.

## Main Risks

- `views/PlanBuilderPage.tsx` is large and mixes loading, URL sync, editor bridge, and UI; avoid one-shot rewrite.
- The embedded `CreateContentV3Page` may assume full-screen/focus behavior; preserve it until after the room shell is stable.
- Current global typecheck already has unrelated failures; document before starting to avoid false regression analysis.
- Drag/drop regressions are easy to miss manually; keep Playwright coverage around lesson ordering.
- Cover generation and other AI actions must keep existing quota/access protections.

## Verification Commands

- `node --test tests/planStudioProgress.test.ts`
- `npx playwright test tests/criadorJornadaStudio.spec.ts --project=chromium`
- `npm run typecheck`

## Final Definition of Done

- `/criador-jornada` uses the new studio layout by default.
- User can create a room, add units, add lessons, edit a lesson, save draft, preview, create/edit evaluation, and publish.
- Existing saved rooms still load.
- Mobile and desktop layouts are usable.
- No database migration is required.
- Targeted Playwright test passes.
- TypeScript status is either clean or has only documented pre-existing failures.
