# 🏗️ BíbliaLM - Architecture & Technical Source of Truth

> **AI INSTRUCTION:** Read this file FIRST before modifying any code. This defines the project structure and patterns.
> **VERSION:** v1.7.0 (Refino de Perfis e Topo Unificado)

## 1. Tech Stack (Strict Versions)
*   **Core:** React 18, Vite 5, TypeScript.
*   **Styling:** TailwindCSS 3 (Dark Mode strategy: `class` strategy).
*   **Backend/DB:** Firebase v10+ (Auth, Firestore, Storage).
*   **AI Engine:** Google GenAI SDK (`@google/genai`).
*   **Icons:** Lucide React.
*   **Routing:** React Router DOM v6.

## 2. Directory Structure (Map)
*   **`/components`**: Reusable UI blocks.
    *   `Layout.tsx`: Main wrapper (Header, Sidebar, MobileNav).
    *   `Reader.tsx`: Bible reading engine.
    *   `social/`: Specific components for the Social Feed.
*   **`/pages`**: Route entry points.
*   **`/services`**: External API logic.
    *   `firebase.ts`: Firebase init & generic DB methods.
    *   `geminiService.ts`: All AI logic (Text, Image, TTS).
    *   `bibleService.ts`: Local bible content & caching strategy.
*   **`/contexts`**: Global State (React Context API).
    *   `AuthContext.tsx`: User session, Profile data, Subscription status.
    *   `SettingsContext.tsx`: Theme, Font size.
*   **`/types.ts`**: **SINGLE SOURCE OF TRUTH** for TS Interfaces.

## 3. Key Design Patterns

### 3.1. Data Access (The `dbService`)
*   We do NOT call Firestore directly in components.
*   ALWAYS use `dbService` methods (e.g., `dbService.getAll`, `dbService.add`).
*   **WriteBatch:** Use for deleting/updating multiple docs (e.g., Wipe Data).

### 3.2. AI Integration
*   **Model:** `gemini-3-flash-preview` (Text) & `gemini-2.5-flash-image` (Image).
*   **Retry Logic:** All AI calls must use `retryWithBackoff`.
*   **Output:** AI must return **HTML** (not Markdown) for rich text content, or **JSON** for structured data.

### 3.3. Authentication & User Profile
*   Auth is handled by Firebase Auth, but user data lives in Firestore collection `users`.
*   `userProfile` object in `AuthContext` is the master state for the current user.

### 3.4. Global Constants
*   All hardcoded values (Prices, Badge definitions, Book lists) reside in `constants.ts`.

## 4. Critical Logic Flows

### Gamification (Mana System)
*   Actions (Read, Share, Create) -> Trigger `recordActivity` -> Updates `lifetimeXp` -> Checks `BADGES` constants -> Updates User Profile.

### Subscription System (Paywall)
*   Tiers: Free, Bronze, Silver, Gold, Pastor.
*   Logic: `checkFeatureAccess(featureKey)` in `AuthContext` validates against `SystemSettings` (fetched from Firestore).

### Content Creation (AI)
*   Input -> Validation (Quota check) -> Gemini API -> Output Parsing -> DB Save -> UI Update.
