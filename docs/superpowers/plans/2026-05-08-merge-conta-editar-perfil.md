# Merge Conta Into Editar Perfil Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the profile **Conta** tab and move every account/profile setting it contains into the existing **Editar Perfil** flow at `/complete-profile`.

**Architecture:** Keep the public profile page focused on public/social content: feed, estudos and jornadas. Consolidate private account editing inside `views/CompleteProfilePage.tsx`, reusing existing auth/profile update APIs and moving only the settings UI that already exists in `views/public/PublicUserProfilePage.tsx`. Avoid redesigning unrelated profile layout or changing public content behavior.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase via `services/supabase.ts`, existing `useAuth` profile update flow, lucide-react icons, Tailwind CSS.

---

## File Structure

- Modify: `views/public/PublicUserProfilePage.tsx`
  - Remove the owner-only `settings` tab from the profile tab list.
  - Remove account/settings-only state and handlers that become unused after the migration.
  - Keep the owner **Editar** button pointing to `/complete-profile`.

- Modify: `views/CompleteProfilePage.tsx`
  - Add the account sections currently under **Conta**: profile fields, notification preferences placeholder, appearance selector, privacy toggle, subscription management, logout/change password if present in current UX.
  - Preserve existing fields and save behavior.
  - Add a compact internal section navigation if needed, but keep it inside the Editar Perfil page.

- Modify or create tests:
  - Prefer focused unit tests for any extracted helpers.
  - Add/adjust Playwright coverage only if existing profile/edit profile specs already cover this route.

- Optional create: `utils/profileSettings.ts`
  - Only if duplicate mapping/state logic becomes hard to read in `CompleteProfilePage.tsx`.

---

## Chunk 1: Remove Conta From Public Profile Tabs

### Task 1: Add a failing tab contract test

**Files:**
- Test: `tests/profileTabs.test.ts`
- Modify later: `views/public/PublicUserProfilePage.tsx`

- [ ] **Step 1: Write the failing test**

Create a small testable helper if needed, for example:

```ts
import test from 'node:test';
import * as assert from 'node:assert/strict';
import { getPublicProfileTabs } from '../utils/profileTabs.ts';

test('owner profile tabs do not include account settings', () => {
  assert.deepEqual(
    getPublicProfileTabs({ isOwner: true }).map(tab => tab.id),
    ['overview', 'studies', 'plans'],
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx ts-node --esm tests/profileTabs.test.ts
```

Expected: FAIL because `utils/profileTabs.ts` or the new behavior does not exist yet.

- [ ] **Step 3: Implement minimal tab helper or inline removal**

If using a helper, create `utils/profileTabs.ts`:

```ts
export type PublicProfileTabId = 'overview' | 'studies' | 'plans';

export function getPublicProfileTabs(_params: { isOwner: boolean }) {
  return [
    { id: 'overview', label: 'Início' },
    { id: 'studies', label: 'Estudos' },
    { id: 'plans', label: 'Jornadas' },
  ] as const;
}
```

Then update `views/public/PublicUserProfilePage.tsx` to remove:

```ts
...(isOwner ? [{ id: 'settings', label: 'Conta', icon: <Settings size={14} /> }] : [])
```

- [ ] **Step 4: Remove settings render branch from public profile**

Delete the `activeTab === 'settings' && isOwner` block from `views/public/PublicUserProfilePage.tsx`.

Also remove unused local state/imports after deletion:

```ts
SettingsTab
activeSettingsTab
isSettingsOpen
isPasswordModalOpen
isSaving
editedProfile
settingsRef
updateProfile
handleSave
handleLogout
ChangePasswordModal
Settings, Bell, Shield, Palette, Check, X, Camera, LogOut
```

Keep any imports still used elsewhere.

- [ ] **Step 5: Run focused verification**

Run:

```bash
npx ts-node --esm tests/profileTabs.test.ts
npm run typecheck
```

Expected: tab test PASS. Typecheck may still report existing unrelated `ChurchProfilePage.tsx` errors; do not fix those in this task unless they block this file.

---

## Chunk 2: Move Conta Sections Into Editar Perfil

### Task 2: Inventory existing Editar Perfil state and save flow

**Files:**
- Inspect: `views/CompleteProfilePage.tsx`
- Inspect: `contexts/AuthContext.tsx`

- [ ] **Step 1: Read current form fields**

Confirm how `CompleteProfilePage` stores and saves:

```ts
displayName
username
bio
slogan
instagram
city
state
photoURL/avatar
subscriptionTier
```

- [ ] **Step 2: Identify moved fields**

From the removed **Conta** tab, migrate only these behaviors:

```ts
isProfilePublic
theme
notification toggles UI
subscription status/actions
logout action
```

Do not add new database columns for notification toggles unless existing persistence already exists.

### Task 3: Add failing tests for profile settings data shape

**Files:**
- Test: `tests/profileSettings.test.ts`
- Optional create: `utils/profileSettings.ts`

- [ ] **Step 1: Write failing test for edit-profile draft defaults**

```ts
import test from 'node:test';
import * as assert from 'node:assert/strict';
import { buildEditableProfileDraft } from '../utils/profileSettings.ts';

test('edit profile draft includes account privacy and appearance defaults', () => {
  const draft = buildEditableProfileDraft({
    displayName: 'Gabriel',
    bio: '',
    slogan: '',
    instagram: '',
    city: '',
    state: '',
    isProfilePublic: undefined,
    theme: undefined,
  } as any);

  assert.equal(draft.isProfilePublic, true);
  assert.equal(draft.theme, 'dark');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx ts-node --esm tests/profileSettings.test.ts
```

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement minimal helper if useful**

Create `utils/profileSettings.ts`:

```ts
import type { UserProfile } from '../types';

export type EditableProfileDraft = {
  displayName: string;
  bio: string;
  slogan: string;
  instagram: string;
  city: string;
  state: string;
  isProfilePublic: boolean;
  theme: 'light' | 'dark';
};

export function buildEditableProfileDraft(profile: Partial<UserProfile>): EditableProfileDraft {
  return {
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    slogan: profile.slogan || '',
    instagram: profile.instagram || '',
    city: profile.city || '',
    state: profile.state || '',
    isProfilePublic: profile.isProfilePublic ?? true,
    theme: profile.theme || 'dark',
  };
}
```

- [ ] **Step 4: Run helper test**

Run:

```bash
npx ts-node --esm tests/profileSettings.test.ts
```

Expected: PASS.

### Task 4: Extend `CompleteProfilePage` UI

**Files:**
- Modify: `views/CompleteProfilePage.tsx`

- [ ] **Step 1: Add section navigation inside Editar Perfil**

Use compact tabs/segmented buttons inside `/complete-profile`:

```ts
type EditProfileSection = 'profile' | 'privacy' | 'appearance' | 'subscription' | 'account';
```

Labels:

```ts
Perfil
Privacidade
Visual
Plano
Conta
```

This is allowed because **Conta** is no longer a public profile tab; here it is an internal edit-profile section.

- [ ] **Step 2: Move privacy controls**

Add the existing public profile toggle:

```tsx
<button
  type="button"
  onClick={() => setDraft({ ...draft, isProfilePublic: !draft.isProfilePublic })}
>
  Perfil Público
</button>
```

Save `isProfilePublic` through the existing profile update payload.

- [ ] **Step 3: Move appearance controls**

Add the existing light/dark selector:

```tsx
{(['light', 'dark'] as const).map(theme => (
  <button
    key={theme}
    type="button"
    onClick={() => setDraft({ ...draft, theme })}
  >
    {theme === 'dark' ? 'Escuro' : 'Claro'}
  </button>
))}
```

Save `theme` through the existing profile update payload.

- [ ] **Step 4: Move subscription controls**

Show current plan status using `userProfile.subscriptionTier`.

Buttons:

```tsx
openSubscription()
```

Text:

```ts
Fazer Upgrade
Mudar de Plano
Gerenciar Fatura
```

Keep the same action already used in `PublicUserProfilePage`.

- [ ] **Step 5: Move account/logout controls**

Add logout action in the internal account section:

```ts
await signOut();
navigate('/');
```

If `ChangePasswordModal` is already wired on the edit-profile page, keep it there; otherwise defer password changes to a later task.

- [ ] **Step 6: Add notification preferences as non-persistent placeholders only if currently non-persistent**

If the old **Conta** notification toggles do not persist to Supabase, move them visually but do not pretend they save. Either:

```tsx
disabled
```

or keep local-only behavior with a small muted label:

```tsx
Preferências locais
```

Do not add storage without a product decision.

- [ ] **Step 7: Run focused manual route check**

Run dev server if needed:

```bash
npm run dev
```

Open:

```text
http://localhost:3010/complete-profile
http://localhost:3010/social/u/gabrielamaro
```

Expected:
- `/complete-profile` contains all former account settings.
- `/social/u/gabrielamaro` no longer shows the **Conta** tab.
- Existing **Editar** button still opens `/complete-profile`.

---

## Chunk 3: Cleanup, Verification, And Regression Guard

### Task 5: Remove dead code and imports

**Files:**
- Modify: `views/public/PublicUserProfilePage.tsx`
- Modify: `views/CompleteProfilePage.tsx`

- [ ] **Step 1: Remove unused imports**

Run:

```bash
npm run typecheck
```

Use TypeScript errors and editor hints to remove dead imports/states introduced by the migration.

- [ ] **Step 2: Search for stale Conta tab references**

Run:

```bash
rg -n "label: 'Conta'|activeTab === 'settings'|SettingsTab|activeSettingsTab" views/public views/CompleteProfilePage.tsx
```

Expected:
- No public profile **Conta** tab.
- Any remaining account wording lives only inside `/complete-profile` or unrelated app settings.

### Task 6: Final verification

- [ ] **Step 1: Run focused tests**

Run:

```bash
npx ts-node --esm tests/profileTabs.test.ts
npx ts-node --esm tests/profileSettings.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: No new errors from `PublicUserProfilePage.tsx`, `CompleteProfilePage.tsx`, or new helpers. If existing `ChurchProfilePage.tsx` errors remain, document them separately and do not conflate them with this feature.

- [ ] **Step 3: Manual acceptance checklist**

Verify:

- [ ] Owner profile has no **Conta** tab.
- [ ] Public visitor profile has no **Conta** tab.
- [ ] **Editar** opens `/complete-profile`.
- [ ] `/complete-profile` allows editing profile identity fields.
- [ ] `/complete-profile` includes privacy, visual, plan/subscription and account actions.
- [ ] Save persists `displayName`, `bio`, `slogan`, `instagram`, `city`, `state`, `isProfilePublic`, and `theme`.
- [ ] Logout still works.
- [ ] Studies and jornadas tabs are unchanged.
- [ ] Início feed behavior from the previous change is unchanged.

---

## Product Acceptance Criteria

- The public/social profile no longer exposes a separate **Conta** tab.
- Users edit profile and account preferences from the single **Editar Perfil** page.
- No settings are lost in the migration from **Conta** to **Editar Perfil**.
- The change is owner-only; public visitors cannot access private account controls.
- The rest of the profile tabs and feed behavior remain intact.

