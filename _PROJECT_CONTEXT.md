# 📖 BíbliaLM - Product Context & Business Rules

> **AI INSTRUCTION:** This file contains the "Soul" of the application. Refer to this for logic, gamification rules, and terminology.
> **VERSION:** v1.5.2 (Nova Jornada + One Page Presentation + Vínculo Eclesiástico)

## 1. Product Vision
A deep Bible study platform powered by AI, designed to look like a "Sanctuary" (Clean, Serene, Gold/Leather aesthetic). The AI is a "Counselor" or "Worker," not a generic bot.

## 2. User Roles & Permissions (The Hierarchy)

| Role | Key Permissions | Limits |
| :--- | :--- | :--- |
| **Visitante (Free)** | Read Bible, Feed (Read), Prayer Wall | AI Limits (low), Ads (future) |
| **Semeador (Bronze)** | + AI Chat (Medium), Custom Profile | ~10 Images/day |
| **Fiel (Silver)** | + Create Church/Cell, Podcast Gen | ~30 Images/day |
| **Visionário (Gold)** | **UNLIMITED AI**, Global Highlight | Unlimited |
| **Pastor** | + Pastoral Workspace (Journey Creator) | Unlimited + Leadership Tools |
| **Admin** | Full System Control, Wipe Data, CMS | N/A |

## 3. Core Modules

### 3.1. Início (Home)
*   The dashboard. Contains "Daily Bread" (Devotional), Reading Progress, and Shortcuts.

### 3.2. Bíblia (Reader)
*   Offline-first capability.
*   **AI Tools:** Explain Verse, Generate Image, Audio Narration (TTS).

### 3.3. O Reino (Social)
*   **Feed:** Chronological posts. Types: Prayer, Reflection, Feeling, Quiz result.
*   **Ecclesia:** Church & Cell system. Users bind to a Church/Group to see specific Prayer Walls.
*   **Explore:** OmniSearch for finding Users, Churches, or Bible content.

### 3.4. Estúdio Criativo
*   Generates "Sacred Art" (DALL-E/Imagen style via Gemini) from verses.
*   Generates "AI Podcasts" (Dialogues between two hosts).

### 3.5. Workspace Pastoral
*   Exclusive to Pastors. Allows creating "Jornadas" (Study Plans) with structured weeks/days.

## 4. Gamification (The Mana System)
*   **Currency:** "Maná" (XP). Not spendable, prestige only.
*   **Streaks:** Daily consecutive usage.
*   **Badges:** Awarded based on XP thresholds or specific actions (e.g., "First Share").

## 5. Domain Glossary
*   **Obreiro IA:** The AI persona.
*   **Jornada:** A structured study plan (course).
*   **Célula:** Small group within a church.
*   **Mural:** Prayer request board.
*   **Artes Sacras:** AI-generated images.

## 6. Safety & Integrity
*   **Wipe:** Admin capability to hard-delete all Firestore UGC (User Generated Content).
*   **Moderation:** Reporting system for toxic content.
*   **Quotas:** `checkFeatureAccess` must wrap ALL AI calls to prevent abuse/billing spikes.
