"use client";
import { useNavigate, useSearchParams } from '../utils/router';

import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/supabase';
import {
    Loader2, Save, LayoutDashboard, Users,
    Terminal, ShieldCheck, Check, X,
    Settings, ToggleLeft, ToggleRight, Search,
    Coins, Ban, FileEdit, Trash2,
    MessageSquareHeart, Megaphone, Layout,
    BellRing, Edit2, ArrowRight, ArrowLeft, Home,
    Globe, Eye, EyeOff, Plus, Mail, FileCode, Copy,
    BookMarked, ScrollText, Code
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import {
    SystemSettings, PlanFeatures, SubscriptionTier, UserProfile, SystemLog,
    ReportTicket, AIUsageStats, Devotional, Banner, LandingPageConfig, HomeConfig, SupportTicket
} from '../types';
import { DAILY_BREAD } from '../constants';

// --- CONSTANTS ---
const TIERS: SubscriptionTier[] = ['free', 'bronze', 'silver', 'gold', 'pastor'];
const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
    aiChatAccess: "Chat IA",
    aiImageGen: "Gerar Imagens",
    aiPodcastGen: "Gerar Podcasts",
    aiDeepAnalysis: "Análise Profunda",
    aiSermonBuilder: "Criador Sermões",
    aiNoteImprovement: "Melhorar Notas",
    aiSocialCaptions: "Legendas Social",
    churchFoundation: "Fundar Igreja",
    churchAdminPanel: "Admin Igreja",
    cellCreation: "Criar Células",
    muralPosting: "Postar Mural",
    teamCompetition: "Gincana Equipes",
    socialFeedRead: "Ler Feed",
    socialFeedPost: "Postar Feed",
    globalHighlight: "Destaque Global",
    followingSystem: "Seguir Usuários",
    profileCustomization: "Personalizar Perfil",
    readingPlans: "Planos Leitura",
    audioNarration: "Áudio Bíblia",
    unlimitedNotes: "Notas Ilimitadas",
    achievementBadges: "Badges",
    advancedSearch: "Busca Avançada",
    focusMode: "Modo Foco",
    customThemes: "Temas",
    noAds: "Sem Anúncios"
};

const APPS = [
    { id: 'roadmap', label: 'Roadmap', icon: ToggleRight, color: 'text-pink-600', bgColor: 'bg-pink-50', desc: 'Feature Flags & Rollout' },
    { id: 'cms', label: 'Pão Diário', icon: FileEdit, color: 'text-yellow-600', bgColor: 'bg-yellow-50', desc: 'Devocional Diário' },
    { id: 'home_cms', label: 'Editor Início', icon: Home, color: 'text-purple-600', bgColor: 'bg-purple-50', desc: 'CMS da Home (App)' },
    { id: 'landing_cms', label: 'Landing Page', icon: Globe, color: 'text-cyan-600', bgColor: 'bg-cyan-50', desc: 'CMS da Web (Site)' },
    { id: 'integrity', label: 'Integridade', icon: ShieldCheck, color: 'text-green-600', bgColor: 'bg-green-50', desc: 'Saúde e IA Check' },
    { id: 'manifest', label: 'Manifesto', icon: FileCode, color: 'text-indigo-600', bgColor: 'bg-indigo-50', desc: 'Código e Docs' },
    { id: 'megafone', label: 'Megafone', icon: Megaphone, color: 'text-red-500', bgColor: 'bg-red-50', desc: 'Push Notifications' },
    { id: 'billboard', label: 'Billboard', icon: Layout, color: 'text-orange-500', bgColor: 'bg-orange-50', desc: 'Banners Globais' },
    { id: 'finops', label: 'Custos IA', icon: Coins, color: 'text-green-600', bgColor: 'bg-green-50', desc: 'Uso de Tokens' },
    { id: 'users', label: 'Membros', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50', desc: 'Gestão de Usuários' },
    { id: 'moderation', label: 'Moderação', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-100', desc: 'Denúncias' },
    { id: 'support', label: 'Suporte', icon: MessageSquareHeart, color: 'text-blue-400', bgColor: 'bg-blue-50', desc: 'Tickets' },
    { id: 'matrix', label: 'Regras', icon: Settings, color: 'text-slate-600', bgColor: 'bg-slate-100', desc: 'Planos e Features' },
    { id: 'logs', label: 'Logs', icon: Terminal, color: 'text-gray-600', bgColor: 'bg-gray-100', desc: 'Eventos do Sistema' }
];

// --- DOCUMENTATION SOURCES ---
// Extraído diretamente dos arquivos técnicos do projeto
const SYSTEM_SOURCE_DOCS = {
    architecture: {
        name: '_ARCHITECTURE.md',
        content: `# 🏗️ BíbliaLM - Architecture & Technical Source of Truth\n\n> **AI INSTRUCTION:** Read this file FIRST before modifying any code. This defines the project structure and patterns.\n> **VERSION:** v1.6.0 (Admin Manifesto + System Integrity Health)\n\n## 1. Tech Stack (Strict Versions)\n*   **Core:** React 18, Vite 5, TypeScript.\n*   **Styling:** TailwindCSS 3 (Dark Mode strategy: \`class\` strategy).\n*   **Backend/DB:** Firebase v10+ (Auth, Firestore, Storage).\n*   **AI Engine:** Google GenAI SDK (\`@google/genai\`).\n*   **Icons:** Lucide React.\n*   **Routing:** React Router DOM v6.\n\n## 2. Directory Structure (Map)\n*   **\`/components\`**: Reusable UI blocks.\n*   **\`/pages\`**: Route entry points.\n*   **\`/services\`**: External API logic.\n*   **\`/contexts\`**: Global State (React Context API).\n*   **\`/types.ts\`**: SINGLE SOURCE OF TRUTH for TS Interfaces.\n\n## 3. Key Design Patterns\n### 3.1. Data Access (The \`dbService\`)\n*   We do NOT call Firestore directly in components.\n*   ALWAYS use \`dbService\` methods.\n\n### 3.2. AI Integration\n*   **Model:** \`gemini-3-flash-preview\` (Text) & \`gemini-2.5-flash-image\` (Image).\n*   **Retry Logic:** All AI calls must use \`retryWithBackoff\`.\n*   **Output:** AI must return **HTML** (not Markdown) for rich text content, or **JSON** for structured data.`
    },
    context: {
        name: '_PROJECT_CONTEXT.md',
        content: `# 📖 BíbliaLM - Product Context & Business Rules\n\n> **AI INSTRUCTION:** This file contains the "Soul" of the application.\n> **VERSION:** v1.6.0\n\n## 1. Product Vision\nA deep Bible study platform powered by AI, designed to look like a "Sanctuary" (Clean, Serene, Gold/Leather aesthetic).\n\n## 2. Core Modules\n### 2.1. Início (Home)\nThe dashboard. Contains "Daily Bread", Reading Progress, and Discovery Items.\n### 2.2. Bíblia (Reader)\nOffline-first capability with AI-powered verse explanations and art generation.\n### 2.3. O Reino (Social)\nCommunity feed, Church system, and Prayer Wall.\n### 2.4. Estúdio Criativo\nGenerates Sacred Art and AI Podcasts.\n### 2.5. Workspace Pastoral\nJourney creator for leadership study plans.\n\n## 3. Gamification\n*   **Currency:** "Maná" (XP).\n*   **Streaks:** Daily consecutive usage.\n*   **Badges:** XP thresholds or action-based.`
    },
    release: {
        name: '_RELEASENOTES.md',
        content: `# 📜 Histórico de Mudanças (Changelog)\n\n## [v1.6.0] - 2024-03-20 (Admin Manifesto & Integrity)\n### Tipo: Admin / Documentation\n- **Resumo:** Adicionado módulo "Manifesto" no admin para visualização de documentos técnicos.\n- **Feature:** Link direto para a página de Integridade do Sistema via Dashboard Admin.\n- **Feature:** Central de Cópia de Código para regras de segurança do Firebase.\n\n## [v1.5.2] - 2024-03-20 (Onboarding Eclesiástico)\n### Tipo: Feature / UX\n- **Resumo:** Adicionada etapa de vínculo com igreja durante o cadastro.\n\n## [v1.5.0] - 2024-03-20 (Nova Jornada)\n### Tipo: Feature / Admin / Architecture\n- **Resumo:** Implementação do sistema de integridade e Wipe Data.`
    },
    firestore: {
        name: 'firestore.rules',
        content: `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    function isAuthenticated() { return request.auth != null; }\n    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }\n    function isAdmin() { \n      return isAuthenticated() && (\n        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && \n         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.username == 'gabrielamaro') ||\n        request.auth.token.email == 'gabrielamaro@live.com'\n      );\n    }\n    \n    match /users/{userId} { \n      allow get: if true; \n      allow create: if isOwner(userId);\n      allow update: if isOwner(userId) || isAdmin();\n      match /notes/{id} { allow read, write: if isOwner(userId); }\n    }\n    \n    match /posts/{id} { allow read: if true; allow create: if isAuthenticated(); }\n  }\n}`
    },
    storage: {
        name: 'storage.rules',
        content: `rules_version = '2';\nservice firebase.storage {\n  match /b/{bucket}/o {\n    match /profiles/{userId}/{allPaths=**} {\n      allow read: if true;\n      allow write: if request.auth != null && request.auth.uid == userId;\n    }\n    match /posts/{userId}/{allPaths=**} {\n      allow read: if true;\n      allow write: if request.auth != null && request.auth.uid == userId;\n    }\n  }\n}`
    }
};

const AdminPage: React.FC = () => {
    const { currentUser, userProfile, showNotification } = useAuth();
    const { features, toggleFeature, refreshFeatures } = useFeatures();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeView = searchParams.get('view') || 'dashboard';

    // --- STATE ---
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data States
    const [stats, setStats] = useState({ users: 0, churches: 0 });
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [aiStats, setAiStats] = useState<AIUsageStats | null>(null);
    const [reports, setReports] = useState<ReportTicket[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    // CMS State
    const [cmsDevotional, setCmsDevotional] = useState<Devotional>(DAILY_BREAD);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [newBanner, setNewBanner] = useState<Partial<Banner>>({ active: true, priority: 1, type: 'hero' });
    const [isEditingBanner, setIsEditingBanner] = useState(false);
    const [landingConfig, setLandingConfig] = useState<LandingPageConfig>({
        heroTitle: '', heroSubtitle: '', heroButtonText: '',
        featureSectionTitle: '', featureSectionDesc: '',
        ctaTitle: '', ctaDesc: '', ctaButtonText: ''
    });
    const [homeConfig, setHomeConfig] = useState<HomeConfig>({
        hero: { type: 'verse_of_day' },
        shortcuts: { devotional: { label: 'Pão Diário', active: true }, readingPlan: { label: 'Meta', active: true }, activeJourneys: { label: 'Trilhas', active: true } },
        sections: { discovery: { active: true, title: 'Descobertas' }, profileWidget: { active: true }, quickAccess: { active: true }, prayerWidget: { active: true } },
        promoBanners: []
    });

    // Manifest View State
    const [activeDocKey, setActiveDocKey] = useState<keyof typeof SYSTEM_SOURCE_DOCS>('architecture');
    const [copied, setCopied] = useState(false);

    // Notification State
    const [notifData, setNotifData] = useState({ title: '', message: '', type: 'info' as const, link: '' });

    // User Management State
    const [userSearch, setUserSearch] = useState('');
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    // Security Check
    const isAdmin = userProfile?.subscriptionTier === 'admin' || userProfile?.username === 'gabrielamaro' || currentUser?.email === 'gabrielamaro@live.com';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }
        if (activeView === 'integrity') {
            navigate('/system-integrity');
            return;
        }
        loadTabData();
    }, [activeView, isAdmin, navigate]);

    const loadTabData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeView === 'dashboard') {
                const s = await dbService.getAdminStats();
                setStats(s);
            }
            else if (activeView === 'users' && users.length === 0) await handleUserSearch('');
            else if (activeView === 'cms') {
                const today = new Date().toLocaleDateString('pt-BR');
                const dev = await dbService.getAdminDevotional(today);
                if (dev) setCmsDevotional(dev);
            }
            else if (activeView === 'landing_cms') {
                const lCms = await dbService.getLandingPageConfig();
                if (lCms) setLandingConfig(lCms);
            }
            else if (activeView === 'home_cms') {
                const hCms = await dbService.getHomeConfig();
                if (hCms) setHomeConfig(hCms);
            }
            else if (activeView === 'billboard') {
                const bns = await dbService.getBanners(false);
                setBanners(bns);
            }
            else if (activeView === 'matrix') {
                const sett = await dbService.getSystemSettings();
                setSettings(sett);
            }
            else if (activeView === 'moderation') {
                const reps = await dbService.getReportTickets();
                setReports(reps);
            }
            else if (activeView === 'support') {
                const tcks = await dbService.getSupportTickets();
                setTickets(tcks);
            }
            else if (activeView === 'finops') {
                const ai = await dbService.getAIUsageStats();
                setAiStats(ai || { date: new Date().toISOString(), totalTokens: 0, costEstimate: 0, requests: { chat: 0, images: 0, podcasts: 0, analysis: 0 } });
            }
            else if (activeView === 'logs') {
                const l = await dbService.getSystemLogs();
                setLogs(l);
            }
        } catch (e) {
            console.error("Admin Load Error:", e);
            showNotification("Erro ao carregar dados.", "error");
        } finally {
            setLoading(false);
        }
    }, [activeView, users.length, showNotification]);

    // --- ACTIONS ---
    const handleUserSearch = async (term: string) => {
        setLoading(true);
        try {
            const res = term ? await dbService.searchUsersByName(term) : await dbService.getAllUsers();
            setUsers(res);
        } catch (e) {
            showNotification("Erro ao buscar usuários", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyManifest = () => {
        navigator.clipboard.writeText(SYSTEM_SOURCE_DOCS[activeDocKey].content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showNotification("Código copiado!", "success");
    };

    const handleUpdateUserPlan = async (tier: SubscriptionTier, days: number) => {
        if (!editingUser) return;
        setSaving(true);
        try {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + days);

            await dbService.updateUserProfile(editingUser.uid, {
                subscriptionTier: tier,
                subscriptionStatus: tier === 'free' ? 'inactive' : 'active',
                subscriptionExpiresAt: tier === 'free' ? null : expiry.toISOString()
            });

            setUsers(prev => prev.map(u => u.uid === editingUser.uid ? { ...u, subscriptionTier: tier } : u));
            setEditingUser(null);
            showNotification(`Plano de ${editingUser.displayName} atualizado para ${tier.toUpperCase()}`, "success");
        } catch (e) {
            showNotification("Erro ao atualizar plano", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCMS = async () => {
        setSaving(true);
        try {
            await dbService.saveAdminDevotional(cmsDevotional);
            showNotification("Devocional do dia salvo/agendado!", "success");
        } catch (e) {
            showNotification("Erro ao salvar CMS", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLandingCMS = async () => {
        setSaving(true);
        try {
            await dbService.saveLandingPageConfig(landingConfig);
            showNotification("Landing Page atualizada!", "success");
        } catch (e) {
            showNotification("Erro ao salvar.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveHomeCMS = async () => {
        setSaving(true);
        try {
            await dbService.saveHomeConfig(homeConfig);
            showNotification("Início (App Home) atualizado!", "success");
        } catch (e) {
            showNotification("Erro ao salvar.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSendNotification = async () => {
        if (!notifData.title || !notifData.message) return;
        setSaving(true);
        try {
            await dbService.sendGlobalNotification(notifData.title, notifData.message, notifData.type, notifData.link);
            showNotification("Notificação enviada para a fila global.", "success");
            setNotifData({ title: '', message: '', type: 'info', link: '' });
        } catch (e) {
            showNotification("Erro ao enviar notificação.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBanner = async () => {
        if (!newBanner.title || !newBanner.imageUrl) return;
        setSaving(true);
        try {
            await dbService.saveBanner(newBanner as Banner);
            const updatedBanners = await dbService.getBanners(false);
            setBanners(updatedBanners);
            setNewBanner({ active: true, priority: 1, type: 'hero' });
            setIsEditingBanner(false);
            showNotification("Banner salvo!", "success");
        } catch (e) {
            showNotification("Erro ao salvar banner.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (!confirm("Excluir este banner?")) return;
        try {
            await dbService.deleteBanner(id);
            setBanners(prev => prev.filter(b => b.id !== id));
            showNotification("Banner removido.", "success");
        } catch (e) { showNotification("Erro ao excluir.", "error"); }
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await dbService.saveSystemSettings(settings);
            showNotification("Regras do sistema atualizadas", "success");
        } catch (e) {
            showNotification("Erro ao salvar regras", "error");
        } finally {
            setSaving(false);
        }
    };

    const toggleTierFeature = (tier: SubscriptionTier, feature: keyof PlanFeatures) => {
        if (!settings) return;
        const current = settings.featuresMatrix?.[tier]?.[feature] || false;
        const newMatrix = {
            ...settings.featuresMatrix,
            [tier]: {
                ...settings.featuresMatrix?.[tier],
                [feature]: !current
            }
        } as Record<SubscriptionTier, PlanFeatures>;
        setSettings({ ...settings, featuresMatrix: newMatrix });
    };

    const handleResolveReport = async (id: string, action: 'banned' | 'dismissed') => {
        try {
            await dbService.resolveReport(id, action);
            setReports(prev => prev.filter(r => r.id !== id));
            showNotification(`Denúncia resolvida: ${action}`, "success");
        } catch (e) {
            showNotification("Erro ao resolver denúncia", "error");
        }
    };

    const handleCloseTicket = async (id: string) => {
        try {
            await dbService.updateTicketStatus(id, 'closed');
            setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'closed' } : t));
            showNotification("Ticket fechado.", "success");
        } catch (e) {
            showNotification("Erro ao fechar ticket", "error");
        }
    };

    // --- RENDERERS ---

    const renderRoadmap = () => (
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-pink-600"><ToggleRight size={24} /> Roadmap & Features</h2>
                    <p className="text-xs text-gray-400 font-mono mt-1">Controle o lançamento de funcionalidades.</p>
                </div>
                <button onClick={refreshFeatures} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white">Atualizar</button>
            </div>

            <div className="space-y-4">
                {features.map(feature => (
                    <div key={feature.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${feature.isEnabled ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-gray-200 text-gray-400 dark:bg-gray-800'}`}>
                                {feature.isEnabled ? <Check size={20} /> : <Ban size={20} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{feature.label}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{feature.description}</p>
                                <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">{feature.key}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <span className={`text-xs font-black uppercase px-2 py-1 rounded ${feature.isEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                                    {feature.isEnabled ? 'Ativo' : 'Desativado'}
                                </span>
                            </div>
                            <button
                                onClick={() => toggleFeature(feature.key, !feature.isEnabled)}
                                className={`w-14 h-8 rounded-full p-1 transition-colors ${feature.isEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${feature.isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div className="space-y-8 animate-in fade-in">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Membros Totais</h3>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.users}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-blue-600 dark:text-blue-400">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Igrejas Fundadas</h3>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.churches}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl text-yellow-600 dark:text-yellow-400">
                        <LayoutDashboard size={24} />
                    </div>
                </div>
            </div>

            {/* Launchpad Grid */}
            <div>
                <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-6 pl-1">Aplicativos Admin</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {APPS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSearchParams({ view: item.id })}
                            className="group flex flex-col items-start p-5 bg-white dark:bg-bible-darkPaper rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:border-bible-gold/30 transition-all text-left relative overflow-hidden"
                        >
                            <div className={`p-3 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${item.bgColor || 'bg-gray-100'} ${item.color || 'text-gray-600'}`}>
                                <item.icon size={24} />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{item.label}</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">{item.desc}</p>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300">
                                <ArrowRight size={16} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderManifest = () => (
        <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in">
            {/* Sidebar de Arquivos */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Arquivos do Sistema</h3>
                <div className="space-y-1">
                    {(Object.keys(SYSTEM_SOURCE_DOCS) as Array<keyof typeof SYSTEM_SOURCE_DOCS>).map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveDocKey(key)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all ${activeDocKey === key ? 'bg-bible-gold text-white shadow-md' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                        >
                            {key.includes('rules') ? <ShieldCheck size={14} /> : <ScrollText size={14} />}
                            {SYSTEM_SOURCE_DOCS[key].name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Área de Visualização */}
            <div className="flex-1 flex flex-col bg-white dark:bg-bible-darkPaper p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Code size={18} className="text-bible-gold" />
                        <span className="text-sm font-black font-mono text-gray-400">{SYSTEM_SOURCE_DOCS[activeDocKey].name}</span>
                    </div>
                    <button
                        onClick={handleCopyManifest}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copiado!' : 'Copiar Tudo'}
                    </button>
                </div>

                <div className="flex-1 relative">
                    <textarea
                        readOnly
                        value={SYSTEM_SOURCE_DOCS[activeDocKey].content}
                        className="w-full h-full p-6 bg-gray-50 dark:bg-black/40 rounded-2xl font-mono text-xs text-gray-700 dark:text-green-400 outline-none border border-gray-100 dark:border-gray-800 resize-none custom-scrollbar"
                    />
                    <div className="absolute top-4 right-4 pointer-events-none opacity-10">
                        <FileCode size={80} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderHomeCMS = () => (
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-purple-600"><Home size={24} /> Editor do Início</h2>
                    <p className="text-xs text-gray-400 font-mono mt-1">Configure a experiência inicial do app.</p>
                </div>
            </div>

            <div className="space-y-8">

                {/* 1. HERO SECTION */}
                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
                    <h3 className="text-sm font-black uppercase text-gray-500 tracking-widest border-b pb-2">Hero Section (Topo)</h3>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setHomeConfig({ ...homeConfig, hero: { ...homeConfig.hero, type: 'verse_of_day' } })}
                            className={`flex-1 p-4 rounded-xl border-2 text-xs font-bold transition-all ${homeConfig.hero.type === 'verse_of_day' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-700' : 'border-gray-200 dark:border-gray-700 opacity-50'}`}
                        >
                            Versículo do Dia (Automático)
                        </button>
                        <button
                            onClick={() => setHomeConfig({ ...homeConfig, hero: { ...homeConfig.hero, type: 'custom' } })}
                            className={`flex-1 p-4 rounded-xl border-2 text-xs font-bold transition-all ${homeConfig.hero.type === 'custom' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-700' : 'border-gray-200 dark:border-gray-700 opacity-50'}`}
                        >
                            Banner Personalizado
                        </button>
                    </div>

                    {homeConfig.hero.type === 'custom' && (
                        <div className="space-y-3 pt-2 animate-in slide-in-from-top-2">
                            <input type="text" value={homeConfig.hero.customTitle || ''} onChange={e => setHomeConfig({ ...homeConfig, hero: { ...homeConfig.hero, customTitle: e.target.value } })} placeholder="Título do Banner" className="w-full p-3 rounded-xl border text-sm font-bold" />
                            <input type="text" value={homeConfig.hero.customSubtitle || ''} onChange={e => setHomeConfig({ ...homeConfig, hero: { ...homeConfig.hero, customSubtitle: e.target.value } })} placeholder="Subtítulo ou Versículo" className="w-full p-3 rounded-xl border text-sm" />
                            <input type="text" value={homeConfig.hero.customImageUrl || ''} onChange={e => setHomeConfig({ ...homeConfig, hero: { ...homeConfig.hero, customImageUrl: e.target.value } })} placeholder="URL da Imagem de Fundo" className="w-full p-3 rounded-xl border text-sm" />
                            <input type="text" value={homeConfig.hero.customLink || ''} onChange={e => setHomeConfig({ ...homeConfig, hero: { ...homeConfig.hero, customLink: e.target.value } })} placeholder="Link de Ação (ex: /plano)" className="w-full p-3 rounded-xl border text-sm" />
                        </div>
                    )}
                </div>

                {/* 2. SHORTCUTS */}
                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
                    <h3 className="text-sm font-black uppercase text-gray-500 tracking-widest border-b pb-2">Atalhos Principais</h3>

                    {['devotional', 'readingPlan', 'activeJourneys'].map((key) => {
                        const k = key as keyof typeof homeConfig.shortcuts;
                        return (
                            <div key={key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">{key}</span>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={homeConfig.shortcuts[k].label}
                                        onChange={e => setHomeConfig({ ...homeConfig, shortcuts: { ...homeConfig.shortcuts, [k]: { ...homeConfig.shortcuts[k], label: e.target.value } } })}
                                        className="p-1 border rounded text-xs w-32"
                                    />
                                    <button
                                        onClick={() => setHomeConfig({ ...homeConfig, shortcuts: { ...homeConfig.shortcuts, [k]: { ...homeConfig.shortcuts[k], active: !homeConfig.shortcuts[k].active } } })}
                                        className={`p-1 rounded ${homeConfig.shortcuts[k].active ? 'text-green-500' : 'text-gray-300'}`}
                                    >
                                        {homeConfig.shortcuts[k].active ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 3. SECTIONS TOGGLE */}
                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
                    <h3 className="text-sm font-black uppercase text-gray-500 tracking-widest border-b pb-2">Seções da Página</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.keys(homeConfig.sections).map((key) => {
                            const k = key as keyof typeof homeConfig.sections;
                            // Fix: Access properties safely
                            const section = homeConfig.sections[k] as { active: boolean, title?: string };
                            return (
                                <div key={key} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={section.active}
                                        onChange={e => setHomeConfig({ ...homeConfig, sections: { ...homeConfig.sections, [k]: { ...section, active: e.target.checked } } })}
                                        className="w-5 h-5 accent-purple-600 rounded"
                                    />
                                    <label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. PROMO BANNERS */}
                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-sm font-black uppercase text-gray-500 tracking-widest">Banners Injetados</h3>
                        <button
                            onClick={() => setHomeConfig({ ...homeConfig, promoBanners: [...homeConfig.promoBanners, { title: 'Novo Banner', subtitle: '', imageUrl: '', link: '', active: true, priority: 1, type: 'alert' }] })}
                            className="text-[10px] font-bold bg-purple-600 text-white px-3 py-1 rounded-full flex items-center gap-1"
                        >
                            <Plus size={12} /> Add
                        </button>
                    </div>

                    {homeConfig.promoBanners.map((banner, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 relative group">
                            <button onClick={() => {
                                const newBanners = [...homeConfig.promoBanners];
                                newBanners.splice(idx, 1);
                                setHomeConfig({ ...homeConfig, promoBanners: newBanners });
                            }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>

                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={banner.title} onChange={e => { const b = [...homeConfig.promoBanners]; b[idx].title = e.target.value; setHomeConfig({ ...homeConfig, promoBanners: b }); }} placeholder="Título" className="p-2 border rounded text-xs font-bold" />
                                <input type="text" value={banner.subtitle} onChange={e => { const b = [...homeConfig.promoBanners]; b[idx].subtitle = e.target.value; setHomeConfig({ ...homeConfig, promoBanners: b }); }} placeholder="Subtítulo" className="p-2 border rounded text-xs" />
                            </div>
                            <input type="text" value={banner.imageUrl} onChange={e => { const b = [...homeConfig.promoBanners]; b[idx].imageUrl = e.target.value; setHomeConfig({ ...homeConfig, promoBanners: b }); }} placeholder="URL Imagem" className="w-full p-2 border rounded text-xs" />
                        </div>
                    ))}
                    {homeConfig.promoBanners.length === 0 && <p className="text-xs text-gray-400 italic text-center">Nenhum banner extra configurado.</p>}
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={handleSaveHomeCMS} disabled={saving} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Publicar Alterações
                    </button>
                </div>
            </div>
        </div>
    );

    const renderLandingCMS = () => (
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="text-cyan-600" /> Editor Landing Page</h2>
                <div className="text-xs text-gray-400 font-mono">Web (Landing)</div>
            </div>

            <div className="space-y-6">
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-black/20 rounded-2xl">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Seção Hero</h4>
                    <input type="text" value={landingConfig.heroTitle} onChange={e => setLandingConfig({ ...landingConfig, heroTitle: e.target.value })} className="w-full p-3 bg-white dark:bg-gray-900 border rounded-xl text-sm" placeholder="Título Principal" />
                    <textarea value={landingConfig.heroSubtitle} onChange={e => setLandingConfig({ ...landingConfig, heroSubtitle: e.target.value })} className="w-full p-3 bg-white dark:bg-gray-900 border rounded-xl text-sm h-20" placeholder="Subtítulo" />
                    <input type="text" value={landingConfig.heroButtonText} onChange={e => setLandingConfig({ ...landingConfig, heroButtonText: e.target.value })} className="w-full p-3 bg-white dark:bg-gray-900 border rounded-xl text-sm" placeholder="Texto do Botão" />
                </div>

                <div className="space-y-3 p-4 bg-gray-50 dark:bg-black/20 rounded-2xl">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Seção Features</h4>
                    <input type="text" value={landingConfig.featureSectionTitle} onChange={e => setLandingConfig({ ...landingConfig, featureSectionTitle: e.target.value })} className="w-full p-3 bg-white dark:bg-gray-900 border rounded-xl text-sm" placeholder="Título da Seção" />
                    <textarea value={landingConfig.featureSectionDesc} onChange={e => setLandingConfig({ ...landingConfig, featureSectionDesc: e.target.value })} className="w-full p-3 bg-white dark:bg-gray-900 border rounded-xl text-sm h-20" placeholder="Descrição" />
                </div>

                <div className="space-y-3 p-4 bg-gray-50 dark:bg-black/20 rounded-2xl">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">CTA Final</h4>
                    <input type="text" value={landingConfig.ctaTitle} onChange={e => setLandingConfig({ ...landingConfig, ctaTitle: e.target.value })} className="w-full p-3 bg-white dark:bg-gray-900 border rounded-xl text-sm" placeholder="Título do CTA" />
                    <textarea value={landingConfig.ctaDesc} onChange={e => setLandingConfig({ ...landingConfig, ctaDesc: e.target.value })} className="w-full p-3 bg-white dark:bg-gray-900 border rounded-xl text-sm h-20" placeholder="Descrição" />
                    <input type="text" value={landingConfig.ctaButtonText} onChange={e => setLandingConfig({ ...landingConfig, ctaButtonText: e.target.value })} className="w-full p-3 bg-white dark:bg-gray-900 border rounded-xl text-sm" placeholder="Texto do Botão" />
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={handleSaveLandingCMS} disabled={saving} className="bg-cyan-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-cyan-700 transition-all flex items-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );

    const renderMegafone = () => (
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-red-500"><Megaphone size={24} /> Megafone Global</h2>
                <div className="text-xs text-gray-400 font-mono">Envio em Massa</div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Título</label>
                    <input type="text" value={notifData.title} onChange={e => setNotifData({ ...notifData, title: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold" placeholder="Ex: O Domingo Chegou!" />
                </div>
                <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Mensagem</label>
                    <textarea value={notifData.message} onChange={e => setNotifData({ ...notifData, message: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-24 text-sm" placeholder="Corpo da notificação..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Tipo</label>
                        <select value={notifData.type} onChange={e => setNotifData({ ...notifData, type: e.target.value as any })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm">
                            <option value="info">Info (Azul)</option>
                            <option value="success">Sucesso (Verde)</option>
                            <option value="warning">Alerta (Amarelo)</option>
                            <option value="badge">Badge (Roxo)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Link (Opcional)</label>
                        <input type="text" value={notifData.link} onChange={e => setNotifData({ ...notifData, link: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm" placeholder="/plano" />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={handleSendNotification} disabled={saving || !notifData.title} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <BellRing size={16} />} Disparar Alerta
                    </button>
                </div>
            </div>
        </div>
    );

    const renderBillboard = () => (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            {/* Form */}
            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsEditingBanner(!isEditingBanner)}>
                    <h3 className="font-bold flex items-center gap-2"><Layout size={20} className="text-bible-gold" /> Editor de Banners</h3>
                    <button className="text-bible-gold">{isEditingBanner ? 'Minimizar' : 'Novo Banner'}</button>
                </div>

                {isEditingBanner && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" value={newBanner.title || ''} onChange={e => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="Título Principal" className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-sm font-bold" />
                            <input type="text" value={newBanner.subtitle || ''} onChange={e => setNewBanner({ ...newBanner, subtitle: e.target.value })} placeholder="Subtítulo" className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-sm" />
                        </div>
                        <input type="text" value={newBanner.imageUrl || ''} onChange={e => setNewBanner({ ...newBanner, imageUrl: e.target.value })} placeholder="URL da Imagem (https://...)" className="w-full p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-sm" />
                        <div className="grid grid-cols-3 gap-4">
                            <input type="text" value={newBanner.link || ''} onChange={e => setNewBanner({ ...newBanner, link: e.target.value })} placeholder="Link de Ação (/plano)" className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-sm" />
                            <select value={newBanner.type} onChange={e => setNewBanner({ ...newBanner, type: e.target.value as any })} className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-sm">
                                <option value="hero">Hero (Grande)</option>
                                <option value="alert">Alert (Faixa)</option>
                            </select>
                            <input type="number" value={newBanner.priority} onChange={e => setNewBanner({ ...newBanner, priority: parseInt(e.target.value) })} placeholder="Prioridade (1-10)" className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-sm" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={newBanner.active} onChange={e => setNewBanner({ ...newBanner, active: e.target.checked })} className="w-5 h-5 accent-bible-gold" />
                                <label className="text-sm">Ativo</label>
                            </div>
                            <button onClick={handleSaveBanner} disabled={saving} className="ml-auto bg-bible-gold text-white px-6 py-2 rounded-xl text-sm font-bold">{saving ? 'Salvando...' : 'Salvar Banner'}</button>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map(banner => (
                    <div key={banner.id} className="relative group overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 h-40">
                        <img src={banner.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                            <h4 className="text-white font-bold">{banner.title}</h4>
                            <p className="text-white/70 text-xs">{banner.subtitle}</p>
                            <div className="absolute top-2 right-2 flex gap-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${banner.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-gray-200'}`}>
                                    {banner.active ? 'Ativo' : 'Inativo'}
                                </span>
                                <button onClick={() => handleDeleteBanner(banner.id!)} className="bg-red-500 p-1.5 rounded text-white hover:bg-red-600"><Trash2 size={12} /></button>
                                <button onClick={() => { setNewBanner(banner); setIsEditingBanner(true); }} className="bg-blue-500 p-1.5 rounded text-white hover:bg-blue-600"><Edit2 size={12} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Buscar por nome ou username..."
                    className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserSearch(userSearch)}
                />
                <button onClick={() => handleUserSearch(userSearch)} className="bg-bible-gold text-white p-3 rounded-xl">
                    <Search size={20} />
                </button>
            </div>

            <div className="bg-white dark:bg-bible-darkPaper rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4 hidden md:table-cell">Email</th>
                            <th className="px-6 py-4">Plano</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {users.map(u => (
                            <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-bold">{u.displayName}</td>
                                <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{u.email}</td>
                                <td className="px-6 py-4 uppercase text-xs">
                                    <span className={`px-2 py-1 rounded-full ${u.subscriptionTier === 'gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {u.subscriptionTier}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setEditingUser(u)} className="text-bible-gold hover:underline text-xs font-bold">
                                        Gerenciar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && <div className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</div>}
            </div>
        </div>
    );

    const renderCMS = () => (
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><FileEdit className="text-bible-gold" /> Editor do Pão Diário</h2>
                <div className="text-xs text-gray-400 font-mono">Data Alvo: {new Date().toLocaleDateString('pt-BR')}</div>
            </div>

            <div className="space-y-4">
                <input
                    type="text"
                    value={cmsDevotional.title}
                    onChange={e => setCmsDevotional({ ...cmsDevotional, title: e.target.value })}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                    placeholder="Título do Devocional"
                />
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={cmsDevotional.verseReference} onChange={e => setCmsDevotional({ ...cmsDevotional, verseReference: e.target.value })} className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm" placeholder="Ref (ex: João 3:16)" />
                    <input type="text" value={cmsDevotional.date} disabled className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm opacity-60" />
                </div>
                <textarea value={cmsDevotional.verseText} onChange={e => setCmsDevotional({ ...cmsDevotional, verseText: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm h-20" placeholder="Texto do Versículo" />
                <textarea value={cmsDevotional.content} onChange={e => setCmsDevotional({ ...cmsDevotional, content: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm h-40" placeholder="Conteúdo da Reflexão" />
                <textarea value={cmsDevotional.prayer} onChange={e => setCmsDevotional({ ...cmsDevotional, prayer: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm h-24 italic" placeholder="Oração Final" />

                <div className="flex justify-end pt-4">
                    <button onClick={handleSaveCMS} disabled={saving} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Publicar Agora
                    </button>
                </div>
            </div>
        </div>
    );

    const renderMatrix = () => (
        <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in max-w-5xl mx-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <h3 className="font-bold text-gray-900 dark:text-white">Matriz de Permissões (Paywall)</h3>
                <button onClick={handleSaveSettings} disabled={saving} className="bg-bible-gold text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md">
                    {saving ? 'Salvando...' : 'Salvar Regras'}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-white dark:bg-bible-darkPaper">
                            <th className="p-4 border-b font-black text-xs uppercase text-gray-400 sticky left-0 bg-white dark:bg-bible-darkPaper">Feature</th>
                            {TIERS.map(tier => <th key={tier} className="p-4 border-b text-center uppercase text-xs font-black">{tier}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {(Object.keys(FEATURE_LABELS) as Array<keyof PlanFeatures>).map(feature => (
                            <tr key={feature} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-bible-darkPaper">{FEATURE_LABELS[feature]}</td>
                                {TIERS.map(tier => {
                                    const active = settings?.featuresMatrix?.[tier]?.[feature];
                                    return (
                                        <td key={`${tier}-${feature}`} className="p-4 text-center">
                                            <button onClick={() => toggleTierFeature(tier, feature)} className={`transition-colors ${active ? 'text-green-500' : 'text-gray-300'}`}>
                                                {active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderModeration = () => (
        <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                <ShieldCheck className="text-red-500" size={24} />
                <div>
                    <h3 className="font-bold text-red-700 dark:text-red-400">Denúncias Pendentes</h3>
                    <p className="text-xs text-red-600/70 dark:text-red-400/70">Ações de moderação necessárias.</p>
                </div>
            </div>
            {reports.length === 0 ? (
                <div className="text-center p-8 bg-white dark:bg-bible-darkPaper rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                    <Check className="mx-auto text-green-500 mb-2" size={32} />
                    <p className="text-gray-500">Nenhuma denúncia pendente. A comunidade está em paz.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reports.map(report => (
                        <div key={report.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">{report.type}</span>
                                    <span className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="font-bold text-red-600 mb-1">{report.reason}</p>
                                {report.contentSnapshot && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                        "{report.contentSnapshot.substring(0, 100)}..."
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleResolveReport(report.id, 'dismissed')} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200">Ignorar</button>
                                <button onClick={() => handleResolveReport(report.id, 'banned')} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 flex items-center gap-2"><Ban size={14} /> Banir</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSupport = () => (
        <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                <MessageSquareHeart className="text-blue-500" size={24} />
                <div>
                    <h3 className="font-bold text-blue-700 dark:text-blue-400">Chamados de Suporte</h3>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Dúvidas e problemas reportados.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-bible-darkPaper rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {tickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum chamado aberto.</div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{ticket.subject}</h4>
                                        <p className="text-xs text-gray-500">De: {ticket.userName} ({ticket.userEmail})</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{ticket.status}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{ticket.message}</p>
                                <div className="flex gap-2">
                                    <a href={`mailto:${ticket.userEmail}?subject=Re: ${ticket.subject}`} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-100"><Mail size={12} /> Responder</a>
                                    {ticket.status !== 'closed' && (
                                        <button onClick={() => handleCloseTicket(ticket.id)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200">Fechar Ticket</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderFinops = () => (
        <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Custo IA (Hoje)</h3>
                    <div className="flex items-center gap-2">
                        <Coins className="text-yellow-500" size={32} />
                        <span className="text-3xl font-black text-gray-900 dark:text-white">${aiStats?.costEstimate?.toFixed(4) || '0.0000'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Tokens Totais: {aiStats?.totalTokens || 0}</p>
                </div>

                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Consumo por Feature</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Chat IA</span> <span className="font-bold">{aiStats?.requests?.chat || 0} reqs</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Imagens</span> <span className="font-bold">{aiStats?.requests?.images || 0} reqs</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Podcasts</span> <span className="font-bold">{aiStats?.requests?.podcasts || 0} reqs</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Análise</span> <span className="font-bold">{aiStats?.requests?.analysis || 0} reqs</span></div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Nota FinOps:</strong> Os custos são estimados com base na tabela do Gemini Pro ($0.50/1M input, $1.50/1M output).
            </div>
        </div>
    );

    const renderLogs = () => (
        <div className="bg-gray-900 text-green-400 p-6 rounded-3xl font-mono text-xs overflow-hidden shadow-2xl animate-in fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                <span className="font-bold flex items-center gap-2"><Terminal size={14} /> System Logs</span>
                <span className="text-gray-500">{logs.length} events</span>
            </div>
            <div className="h-[500px] overflow-y-auto space-y-2 custom-scrollbar">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 hover:bg-white/5 p-1 rounded">
                        <span className="text-gray-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`font-bold shrink-0 ${log.type === 'error' ? 'text-red-500' : log.type === 'admin_action' ? 'text-yellow-500' : 'text-blue-400'}`}>[{log.type.toUpperCase()}]</span>
                        <span className="break-all">{log.message || log.action || log.description}</span>
                    </div>
                ))}
                {logs.length === 0 && <span className="text-gray-600">-- No logs found --</span>}
            </div>
        </div>
    );

    return (
        <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto">

            {/* Top Navigation Bar (Launchpad style) */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-bible-darkPaper/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 p-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-serif font-bold text-bible-leather dark:text-bible-gold flex items-center gap-2">
                        <Terminal size={20} /> Admin OnePage
                    </h1>

                    {activeView !== 'dashboard' && (
                        <button
                            onClick={() => setSearchParams({ view: 'dashboard' })}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft size={14} /> Voltar ao Painel
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 md:p-8 pb-32 max-w-6xl mx-auto">

                {/* Header Content */}
                <header className="mb-8">
                    {activeView !== 'dashboard' && (
                        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white animate-in slide-in-from-left-2">
                            {APPS.find(i => i.id === activeView)?.label}
                        </h2>
                    )}
                </header>

                {/* Content Area */}
                {activeView === 'dashboard' && renderDashboard()}
                {activeView === 'roadmap' && renderRoadmap()}
                {activeView === 'users' && renderUsers()}
                {activeView === 'cms' && renderCMS()}
                {activeView === 'landing_cms' && renderLandingCMS()}
                {activeView === 'home_cms' && renderHomeCMS()}
                {activeView === 'megafone' && renderMegafone()}
                {activeView === 'billboard' && renderBillboard()}
                {activeView === 'matrix' && settings && renderMatrix()}
                {activeView === 'moderation' && renderModeration()}
                {activeView === 'support' && renderSupport()}
                {activeView === 'finops' && renderFinops()}
                {activeView === 'logs' && renderLogs()}
                {activeView === 'manifest' && renderManifest()}
            </div>

            {/* Modal de Edição de Usuário */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-bible-darkPaper w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Gerenciar: {editingUser.displayName}</h3>
                            <button onClick={() => setEditingUser(null)}><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">Alterar plano manualmente (sem cobrar):</p>
                            <div className="grid grid-cols-2 gap-3">
                                {TIERS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => handleUpdateUserPlan(t, 30)}
                                        className={`p-3 rounded-xl border text-xs font-black uppercase ${editingUser.subscriptionTier === t ? 'border-bible-gold bg-bible-gold text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <div className="text-xs text-center text-gray-400 mt-4">
                                Isso concederá 30 dias de acesso ao plano selecionado.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;