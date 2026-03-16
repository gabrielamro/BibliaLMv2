"use client";
import { useNavigate, useSearchParams } from '../utils/router';

import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/supabase';
import {
    Loader2, Save, LayoutDashboard, Users,
    Terminal, Info, ShieldCheck, Check, X,
    Settings, ToggleLeft, ToggleRight, Search,
    BarChart3, Coins, Ban, FileEdit, Trash2,
    MessageSquareHeart, Calendar, RefreshCw, Crown,
    AlertTriangle, ExternalLink, Activity, Mail, Megaphone, Layout, Image as ImageIcon, BellRing, Plus, Edit2, Menu,
    Globe, Database, Share2
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { SystemSettings, PlanFeatures, SubscriptionTier, UserProfile, SystemLog, ReportTicket, AIUsageStats, Devotional, FeatureFlag, Church as ChurchType, SupportTicket, Banner, SEOSettings } from '../types';
import { DAILY_BREAD } from '../constants';
import ConfirmationModal from './ConfirmationModal';

// --- CONSTANTS ---
const TIERS: SubscriptionTier[] = ['free', 'bronze', 'silver', 'gold', 'pastor', 'admin'];
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

const MENU_GROUPS = [
    {
        title: 'Visão Geral',
        items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }]
    },
    {
        title: 'Operações (LiveOps)',
        items: [
            { id: 'megafone', label: 'Megafone', icon: Megaphone },
            { id: 'billboard', label: 'Billboard', icon: Layout },
            { id: 'cms', label: 'Pão Diário', icon: FileEdit },
            { id: 'seops', label: 'Gestor SEO', icon: Globe }
        ]
    },
    {
        title: 'Inteligência',
        items: [
            { id: 'finops', label: 'Custos IA', icon: Coins },
            { id: 'logs', label: 'Logs Sistema', icon: Terminal }
        ]
    },
    {
        title: 'Comunidade',
        items: [
            { id: 'users', label: 'Membros', icon: Users },
            { id: 'moderation', label: 'Moderação', icon: ShieldCheck },
            { id: 'support', label: 'Suporte', icon: MessageSquareHeart }
        ]
    },
    {
        title: 'Sistema',
        items: [
            { id: 'matrix', label: 'Regras de Negócio', icon: Settings }
        ]
    }
];

const AdminPage: React.FC = () => {
    const { currentUser, userProfile, showNotification } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';

    // --- STATE ---
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showWipeModal, setShowWipeModal] = useState(false);

    // Data States
    const [stats, setStats] = useState({ users: 0, churches: 0, paidUsers: 0 });
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

    // SEO State
    const [seoConfig, setSeoConfig] = useState<SEOSettings>({
        defaultTitle: 'BíbliaLM - Inteligência Artificial para Estudo Bíblico',
        defaultDescription: 'Sua plataforma de estudo bíblico profundo com IA, devocionais diários e gamificação cristã.',
        defaultKeywords: 'bíblia, estudo bíblico, inteligência artificial, devocional, cristão, jesus, deus'
    });
    const [generatedSitemap, setGeneratedSitemap] = useState('');

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
        loadTabData();
    }, [activeTab, isAdmin]);

    const loadTabData = useCallback(async () => {
        setLoading(true);
        try {
            // Pre-load settings for SEO tab
            const sett = await dbService.getSystemSettings();
            if (sett) {
                setSettings(sett);
                if (sett.seo) setSeoConfig(sett.seo);
            }

            switch (activeTab) {
                case 'dashboard':
                    const s = await dbService.getAdminStats();
                    setStats(s);
                    break;
                case 'users':
                    if (users.length === 0) await handleUserSearch('');
                    break;
                case 'cms':
                    const today = new Date().toLocaleDateString('pt-BR');
                    const dev = await dbService.getAdminDevotional(today);
                    if (dev) setCmsDevotional(dev);
                    break;
                case 'billboard':
                    const bns = await dbService.getBanners(false);
                    setBanners(bns);
                    break;
                case 'moderation':
                    const reps = await dbService.getReportTickets();
                    setReports(reps);
                    break;
                case 'support':
                    const tcks = await dbService.getSupportTickets();
                    setTickets(tcks);
                    break;
                case 'finops':
                    const ai = await dbService.getAIUsageStats();
                    setAiStats(ai || { date: new Date().toISOString(), totalTokens: 0, costEstimate: 0, requests: { chat: 0, images: 0, podcasts: 0, analysis: 0 } });
                    break;
                case 'logs':
                    const l = await dbService.getSystemLogs();
                    setLogs(l);
                    break;
            }
        } catch (e) {
            console.error("Admin Load Error:", e);
            showNotification("Erro ao carregar dados.", "error");
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

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

    const handleSaveSettings = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            // Merge SEO config into settings
            const updatedSettings = { ...settings, seo: seoConfig };
            await dbService.saveSystemSettings(updatedSettings);
            setSettings(updatedSettings);
            showNotification("Regras e SEO atualizados", "success");
        } catch (e) {
            showNotification("Erro ao salvar regras", "error");
        } finally {
            setSaving(false);
        }
    };

    const generateSitemapXML = async () => {
        setLoading(true);
        try {
            // Fetch dynamic data for sitemap
            const churches = await dbService.searchGlobalChurches(''); // Assuming this gets a batch

            let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://biblialm.com.br/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://biblialm.com.br/biblia</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://biblialm.com.br/planos</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
`;
            // Add Churches
            churches.forEach(c => {
                xml += `  <url><loc>https://biblialm.com.br/igreja/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
            });

            // Add Static Important Routes
            ['/social/explore', '/devocional', '/quiz'].forEach(path => {
                xml += `  <url><loc>https://biblialm.com.br${path}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
            });

            xml += `</urlset>`;
            setGeneratedSitemap(xml);
            showNotification("Sitemap gerado! Copie e salve em public/sitemap.xml", "success");
        } catch (e) {
            showNotification("Erro ao gerar sitemap.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ... (Other handlers: handleUpdateUserPlan, handleWipeDatabase, handleSaveCMS, handleSendNotification, handleSaveBanner, handleDeleteBanner, toggleFeature, handleResolveReport, handleCloseTicket - kept same as original file)

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

    const handleWipeDatabase = async () => {
        setShowWipeModal(false);
        setLoading(true);
        try {
            await dbService.wipeAllUserData();
            showNotification("Base de dados limpa com sucesso.", "success");
            setUsers([]);
            setStats({ users: 0, churches: 0 });
        } catch (e) {
            showNotification("Erro ao limpar base de dados.", "error");
            console.error(e);
        } finally {
            setLoading(false);
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

    const toggleFeature = (tier: SubscriptionTier, feature: keyof PlanFeatures) => {
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

    const renderSidebar = () => (
        <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-bible-darkPaper h-full border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex md:shrink-0
      `}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h1 className="text-xl font-serif font-bold text-bible-leather dark:text-bible-gold flex items-center gap-2">
                    <Terminal size={20} /> Admin 2.0
                </h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {MENU_GROUPS.map((group, idx) => (
                    <div key={idx}>
                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 pl-2">{group.title}</h3>
                        <div className="space-y-1">
                            {group.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setSearchParams({ tab: item.id });
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === item.id ? 'bg-bible-gold text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                >
                                    <item.icon size={16} /> {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );

    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
            <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <Users className="text-blue-500 mb-4" size={32} />
                <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest">Membros Totais</h3>
                <p className="text-4xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.users}</p>
            </div>
            <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-bible-gold mb-4"><Crown size={32} /></div>
                <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest">Igrejas Fundadas</h3>
                <p className="text-4xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.churches}</p>
            </div>
            <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-green-500 mb-4"><Check size={32} /></div>
                <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest">Assinantes Pagos</h3>
                <p className="text-4xl font-black text-gray-900 dark:text-white">{loading ? '...' : (stats as any).paidUsers ?? 0}</p>
            </div>
        </div>
    );

    const renderSEO = () => (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-blue-600"><Globe size={24} /> Configuração de SEO (Global)</h2>
                    <div className="text-xs text-gray-400 font-mono">Meta Tags Padrão</div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Título Padrão</label>
                        <input
                            type="text"
                            value={seoConfig.defaultTitle}
                            onChange={e => setSeoConfig({ ...seoConfig, defaultTitle: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Descrição Padrão</label>
                        <textarea
                            value={seoConfig.defaultDescription}
                            onChange={e => setSeoConfig({ ...seoConfig, defaultDescription: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm h-24"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Keywords (separadas por vírgula)</label>
                        <input
                            type="text"
                            value={seoConfig.defaultKeywords}
                            onChange={e => setSeoConfig({ ...seoConfig, defaultKeywords: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar Meta Tags
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-green-600"><Database size={24} /> Sitemap Generator</h2>
                    <div className="text-xs text-gray-400 font-mono">XML Dinâmico</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
                    <p className="text-xs text-gray-500 mb-2">XML Gerado (Copie e salve em <code>public/sitemap.xml</code>):</p>
                    <textarea
                        value={generatedSitemap}
                        readOnly
                        className="w-full h-40 bg-white dark:bg-black p-2 rounded text-[10px] font-mono border border-gray-200 dark:border-gray-800"
                    />
                </div>

                <div className="flex justify-end">
                    <button onClick={generateSitemapXML} disabled={loading} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} Gerar Novo Sitemap
                    </button>
                </div>
            </div>
        </div>
    );

    // ... (Other renderers: renderMegafone, renderBillboard, renderUsers, renderCMS, renderMatrix, renderModeration, renderSupport, renderFinops, renderLogs - Same as original but ensuring imports and logic are present)

    const renderMegafone = () => (
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in max-w-2xl">
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
        <div className="space-y-8 animate-in fade-in">
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
                        <img src={banner.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
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
        <div className="space-y-6 animate-in fade-in">
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

            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl border border-red-200 dark:border-red-900/50">
                <h3 className="text-red-700 dark:text-red-400 font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} /> ZONA DE PERIGO
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                    Ações irreversíveis que afetam toda a base de usuários. Use com extremo cuidado.
                </p>
                <button
                    onClick={() => setShowWipeModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg flex items-center gap-2"
                >
                    <Trash2 size={16} /> Limpar Base de Dados (Wipe)
                </button>
            </div>
        </div>
    );

    const renderCMS = () => (
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in max-w-3xl">
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
        <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in">
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
                                            <button onClick={() => toggleFeature(tier, feature)} className={`transition-colors ${active ? 'text-green-500' : 'text-gray-300'}`}>
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
        <div className="space-y-6 animate-in fade-in">
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
        <div className="space-y-6 animate-in fade-in">
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
        <div className="space-y-6 animate-in fade-in">
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
        <div className="bg-gray-900 text-green-400 p-6 rounded-3xl font-mono text-xs overflow-hidden shadow-2xl animate-in fade-in">
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
        <div className="h-full bg-gray-50 dark:bg-black/20 overflow-hidden flex">
            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Sidebar Navigation */}
            {renderSidebar()}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto h-full relative">
                {/* Mobile Header Toggle */}
                <div className="md:hidden p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-bible-darkPaper sticky top-0 z-30">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 dark:text-gray-300"><Menu /></button>
                    <span className="font-bold text-gray-900 dark:text-white">Menu Admin</span>
                </div>

                <div className="p-4 md:p-8 pb-32 max-w-5xl mx-auto">
                    <header className="mb-8">
                        <h2 className="text-2xl font-serif font-bold text-bible-leather dark:text-bible-gold">
                            {MENU_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab)?.label}
                        </h2>
                    </header>

                    {/* Content Area */}
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'cms' && renderCMS()}
                    {activeTab === 'megafone' && renderMegafone()}
                    {activeTab === 'billboard' && renderBillboard()}
                    {activeTab === 'matrix' && settings && renderMatrix()}
                    {activeTab === 'moderation' && renderModeration()}
                    {activeTab === 'support' && renderSupport()}
                    {activeTab === 'finops' && renderFinops()}
                    {activeTab === 'logs' && renderLogs()}
                    {activeTab === 'seops' && renderSEO()}
                </div>
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
                            <div className="grid grid-cols-3 gap-3">
                                {TIERS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => handleUpdateUserPlan(t, 30)}
                                        className={`p-3 rounded-xl border text-xs font-black uppercase ${editingUser.subscriptionTier === t
                                                ? 'border-bible-gold bg-bible-gold text-white'
                                                : t === 'admin' ? 'border-red-300 text-red-500 hover:bg-red-50'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t === 'admin' ? '⚡ Admin' : t}
                                    </button>
                                ))}
                            </div>
                            <div className="text-xs text-center text-gray-400 mt-4">
                                Planos normais concedem 30 dias. Admin é permanente.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showWipeModal}
                onClose={() => setShowWipeModal(false)}
                onConfirm={handleWipeDatabase}
                title="Wipe Total da Base"
                message="ATENÇÃO: Esta ação é irreversível. Todos os dados de usuários, posts, igrejas e conteúdo serão apagados permanentemente. Deseja continuar?"
                confirmText="Sim, Apagar Tudo"
                variant="danger"
            />
        </div>
    );
};

export default AdminPage;