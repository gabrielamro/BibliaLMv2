"use client";
import { useNavigate } from '../utils/router';


import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';

import { useWisdomStream } from '../hooks/useWisdomStream';
import { StudyModule, HomeConfig, CustomPlan, ChurchService, Post } from '../types';
import {
    PlusCircle, Loader2, Flame, BookOpen,
    Trophy, MessageCircle, ArrowRight, Zap,
    Heart, Sparkles, Crown, Quote, Target, BookMarked, Calendar, ChevronRight, Sun,
    MoreHorizontal, PenTool, Layout, Plus, History, Users
} from 'lucide-react';
import { FeedPostCard } from './social/FeedPostCard';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { postInteractionService } from '../services/postInteractionService';
import { generateShareLink } from '../utils/shareUtils';
import { cultoPlusService } from '../services/cultoPlusService';
import { INSPIRATIONAL_VERSES, BIBLE_BOOKS_LIST } from '../constants';
import { normalizeText } from '../utils/textUtils';
import { getAgendaRange } from '../utils/cultoPlusCalendar';
import { canAccessPastoralWorkspace } from '../utils/profileAccess';
import ManaNudge from './ManaNudge';
// O componente ActiveJourneys foi movido para o backlog (desativados)


const HomeDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { userProfile, showNotification, currentUser } = useAuth();
    const { setTitle, setIcon, setBreadcrumbs, resetHeader, setIsHeaderHidden } = useHeader();
    const { loading, dailyState, activeJourneys, discoveryItems, prayerAlert } = useWisdomStream();

    const [config, setConfig] = useState<HomeConfig | null>(null);
    const [userPlans, setUserPlans] = useState<CustomPlan[]>([]);
    const [churchServices, setChurchServices] = useState<ChurchService[]>([]);
    const churchAgendaRange = useMemo(() => getAgendaRange(new Date(), 14), []);

    // --- HEADER MANAGEMENT ---
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTitle('Início');
        setBreadcrumbs([]);

        const handleScrollToTop = () => {
            if (containerRef.current) {
                containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('biblialm-scroll-top', handleScrollToTop);

        return () => {
            resetHeader();
            setIsHeaderHidden(false);
            window.removeEventListener('biblialm-scroll-top', handleScrollToTop);
        };
    }, [setTitle, setBreadcrumbs, resetHeader, setIsHeaderHidden]);

    useEffect(() => {
        const loadConfig = async () => {
            const remoteConfig = await dbService.getHomeConfig();
            if (remoteConfig) setConfig(remoteConfig);
        };
        const loadUserPlans = async () => {
            if (currentUser && canAccessPastoralWorkspace(userProfile)) {
                const plans = await dbService.getUserCustomPlans(currentUser.uid);
                setUserPlans(plans.slice(0, 3));
            }
        };
        loadConfig();
        loadUserPlans();
    }, [currentUser, userProfile]);

    useEffect(() => {
        const churchId = userProfile?.churchData?.churchId;
        if (!churchId) {
            setChurchServices([]);
            return;
        }

        let mounted = true;
        cultoPlusService.getServicesByChurchRange(churchId, {
            startDate: churchAgendaRange.startDate,
            endDate: churchAgendaRange.endDate,
            status: ['published', 'live', 'finished'],
            limit: 6,
        })
            .then((services) => {
                if (mounted) setChurchServices(services);
            })
            .catch(() => {
                if (mounted) setChurchServices([]);
            });

        return () => {
            mounted = false;
        };
    }, [userProfile?.churchData?.churchId, churchAgendaRange.startDate, churchAgendaRange.endDate]);

    const formatShortDate = (value?: string) => new Date(value || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const formatServiceTime = (value?: string) => new Date(value || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const getServiceBadge = (service: ChurchService) => {
        const nowTime = Date.now();
        const start = new Date(service.startsAt).getTime();
        const end = new Date(service.endsAt).getTime();
        if (nowTime >= start && nowTime <= end) return 'Ao vivo';
        if (nowTime < start) return 'Agendado';
        return service.status === 'finished' ? 'Finalizado' : 'Realizado';
    };

    // Fallback defaults
    const shortcuts = config?.shortcuts || {
        devotional: { label: 'Pão Diário', active: true },
        readingPlan: { label: 'Meta de Leitura', active: true },
        activeJourneys: { label: 'Trilhas', active: false }
    };

    // Versículo do dia aleatório (ou baseado na data)
    const verseOfTheDay = useMemo(() => {
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        return INSPIRATIONAL_VERSES[dayOfYear % INSPIRATIONAL_VERSES.length];
    }, []);

    // Função para navegar para o versículo do dia
    const navigateToVerseOfDay = useCallback(() => {
        const ref = verseOfTheDay.ref;
        // Ex: "Salmos 23:1", "João 3:16", "Filipenses 4:13"
        const parsed = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
        if (!parsed) {
            navigate('/biblia');
            return;
        }
        const [, bookName, chapterStr, verseStr] = parsed;
        const chapter = parseInt(chapterStr, 10);
        const verse = parseInt(verseStr, 10);

        // Busca o ID do livro na lista (ignora acentos/maiúsculas)
        const normalizedBookName = normalizeText(bookName.trim());
        const found = BIBLE_BOOKS_LIST.find(b =>
            normalizeText(b.name) === normalizedBookName
        );
        const bookId = found?.id || normalizeText(bookName.trim());

        navigate(`/biblia?book=${bookId}&cap=${chapter}&vs=${verse}`);
    }, [verseOfTheDay.ref, navigate]);

    const lastScrollYList = useRef(0);

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-bible-gold" size={40} /></div>;
    }

    const handleInteraction = async (post: Post, type: 'like' | 'comment' | 'share' | 'save') => {
        if (!currentUser) return;
        if (type === 'like') {
            await postInteractionService.setLiked(post, currentUser.uid, !post.likedBy?.includes(currentUser.uid));
        } else if (type === 'save') {
            await postInteractionService.setSaved(post, !post.saved);
        } else if (type === 'comment') {
            navigate(`/p/${post.id}`);
        } else {
            const url = generateShareLink('post', { postId: post.id });
            if (navigator.share) await navigator.share({ title: 'Culto+', url });
            else { await navigator.clipboard.writeText(url); showNotification('Link copiado!', 'success'); }
        }
    };

    const hasReadingPlan = userProfile?.readingPlan?.isActive;
    const isPastor = canAccessPastoralWorkspace(userProfile);
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;

        if (currentScrollY > lastScrollYList.current && currentScrollY > 20) {
            setIsHeaderHidden(true);
        } else if (currentScrollY < lastScrollYList.current) {
            setIsHeaderHidden(false);
        }
        lastScrollYList.current = currentScrollY;
    };

    return (
        <div ref={containerRef} className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8" onScroll={handleScroll}>
            <div className="max-w-7xl mx-auto space-y-8 pb-10">

                {/* HEADER & WELCOME */}
                <header className="flex flex-col md:flex-row md:items-center justify-center gap-4">
                    <div className="flex items-center gap-3">
                        <span suppressHydrationWarning className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white dark:bg-bible-darkPaper px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </header>

                {/* 1. HERO SECTION (Dynamic) */}
                {config?.hero?.type === 'custom' ? (
                    <section className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] shadow-xl h-64 md:h-80" onClick={() => config.hero.customLink && navigate(config.hero.customLink)}>
                        <img src={config.hero.customImageUrl || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=1000'} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 md:p-12 flex flex-col justify-end text-white">
                            <h2 className="text-3xl md:text-5xl font-serif font-black mb-2">{config.hero.customTitle || 'Bem-vindo'}</h2>
                            <p className="text-lg opacity-90">{config.hero.customSubtitle}</p>
                        </div>
                    </section>
                ) : (
                    <section className="relative group cursor-pointer" onClick={navigateToVerseOfDay}>
                        <div className="bg-gradient-to-br from-bible-leather to-[#3d2b25] dark:from-[#1a1a1a] dark:to-black p-8 md:p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl border border-white/5 transition-transform duration-500 hover:scale-[1.01]">
                            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700"><Quote size={180} /></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="max-w-3xl">
                                    <div className="flex items-center gap-2 mb-4 opacity-80">
                                        <Sun size={16} className="text-bible-gold" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Versículo do Dia</span>
                                    </div>
                                    <p className="font-serif italic text-xl md:text-3xl leading-relaxed mb-2 text-white/95">
                                        "{verseOfTheDay.text}"
                                    </p>
                                    <span className="text-sm font-black text-bible-gold uppercase tracking-widest">{verseOfTheDay.ref}</span>
                                </div>
                                <div className="hidden md:block">
                                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-bible-leather transition-colors">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Promo Banners Injected */}
                {config?.promoBanners?.filter(b => b.active).map(b => (
                    <div key={b.title} onClick={() => navigate(b.link)} className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-2xl text-white flex justify-between items-center cursor-pointer shadow-lg transform hover:-translate-y-1 transition-transform">
                        <div>
                            <h4 className="font-bold text-sm">{b.title}</h4>
                            <p className="text-xs opacity-80">{b.subtitle}</p>
                        </div>
                        <ArrowRight size={16} />
                    </div>
                ))}

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN (Content Stream) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* BENTO GRID: Ações Principais */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {/* Card Meta de Leitura */}
                            {shortcuts.readingPlan.active && (
                                <div
                                    onClick={() => navigate('/plano')}
                                    className="col-span-1 p-4 md:p-5 rounded-[2rem] bg-white dark:bg-bible-darkPaper/90 backdrop-blur-md border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-all cursor-pointer relative overflow-hidden group shadow-sm flex flex-col justify-between"
                                    style={{ minHeight: '140px' }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                            {hasReadingPlan ? <Target size={20} /> : <Calendar size={20} />}
                                        </div>
                                    </div>

                                    <div className="relative z-10 z-20">
                                        <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white mb-1">
                                            {shortcuts.readingPlan.label}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-bible-gold transition-colors">
                                            {hasReadingPlan ? 'Retomar' : 'Configurar'} <ChevronRight size={10} />
                                        </div>
                                    </div>

                                    {hasReadingPlan && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-b-full">
                                            <div className="h-full bg-blue-500 rounded-b-full" style={{ width: `${dailyState.readingProgress}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Card Pão Diário */}
                            {shortcuts.devotional.active && (
                                <div
                                    onClick={() => navigate('/devocional')}
                                    className={`col-span-1 p-4 md:p-5 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group shadow-sm flex flex-col justify-between ${dailyState.devotionalDone
                                        ? 'bg-green-50/80 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                        : 'bg-white dark:bg-bible-darkPaper/90 backdrop-blur-md border-gray-100 dark:border-gray-800 hover:border-bible-gold'
                                        }`}
                                    style={{ minHeight: '140px' }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`p-2 rounded-2xl group-hover:scale-110 transition-transform ${dailyState.devotionalDone ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            <Heart size={20} fill={dailyState.devotionalDone ? "currentColor" : "none"} />
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white mb-1">{shortcuts.devotional.label}</h3>
                                        <div className="flex items-center gap-1 mt-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-bible-gold transition-colors">
                                            {dailyState.devotionalDone ? 'Revisar' : 'Acessar'} <ChevronRight size={10} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Card Mural de Oração (Tile Opcional) */}
                            {(config?.sections?.prayerWidget?.active !== false) && prayerAlert && (
                                <div onClick={() => navigate(`/social/igreja/${userProfile?.churchData?.churchSlug}`)} className="col-span-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-[2rem] p-4 text-white shadow-md cursor-pointer transform hover:scale-[1.02] transition-transform flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                                    <div className="flex items-center justify-between mb-2 opacity-90 relative z-10">
                                        <div className="flex items-center gap-1.5">
                                            <Heart size={14} fill="currentColor" className="animate-pulse" />
                                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider">Mural de Oração</span>
                                        </div>
                                        <span className="text-[8px] font-black opacity-80 uppercase bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">Igreja</span>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="font-bold text-[10px] md:text-xs line-clamp-2 leading-snug">"{prayerAlert.content}"</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SANTUÁRIO / ESPAÇO + (EXCLUSIVE FOR PASTORS) */}
                        {isPastor && (
                            <section className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={18} className="text-bible-gold" />
                                        <div>
                                            <h2 className="text-xl font-serif font-black text-gray-900 dark:text-white">Espaço +</h2>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Espaço do pastor e Igreja</p>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/workspace-pastoral')} className="text-[10px] font-black text-bible-gold uppercase tracking-widest hover:underline">Painel de Controle</button>
                                </div>

                                <div className="rounded-[2.5rem] border border-gray-100 bg-white/70 p-4 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper/70">
                                    <div className="mb-3 flex items-center justify-between px-1">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-300">Salas</p>
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white">Salas de Estudo</h3>
                                        </div>
                                        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-200">Premium roxo</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* NEW ROOM CTA - PREMIUM DARK */}
                                    <div
                                        onClick={() => navigate('/criar-sala')}
                                        className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-violet-400/50 rounded-[2.5rem] bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/30 dark:via-black dark:to-fuchsia-950/20 hover:border-violet-500 transition-all cursor-pointer group shadow-xl shadow-violet-950/5 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="p-4 bg-violet-600 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-[0_0_18px_rgba(124,58,237,0.35)]">
                                                <Plus size={24} strokeWidth={3} />
                                            </div>
                                            <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest text-center px-4">Nova Sala</span>

                                        </div>
                                    </div>

                                    {/* USER PLANS - DYNAMIC */}
                                    {userPlans.map((plan, idx) => (
                                        <div
                                            key={plan.id}
                                            onClick={(e) => {
                                                if ((e.target as HTMLElement).closest('button')) return;
                                                navigate(`/jornada/${plan.id}`);
                                            }}
                                            className="bg-white dark:bg-bible-darkPaper p-5 rounded-[2.5rem] border border-violet-200 dark:border-violet-900/50 shadow-sm relative overflow-hidden group hover:border-violet-400 hover:shadow-xl hover:shadow-violet-950/10 transition-all flex flex-col cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black border ${plan.status === 'published' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-500 border-gray-200'} uppercase`}>
                                                    {plan.status === 'published' ? 'Em Andamento' : 'Rascunho'}
                                                </span>
                                                <div className="text-[8px] text-gray-400 font-bold uppercase">
                                                    {formatShortDate(plan.createdAt)}
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-xs line-clamp-2 mb-3 flex-1">{plan.title}</h4>

                                            <div className="space-y-1 mb-4">
                                                <div className="flex items-center gap-1.5 text-[9px] text-violet-600 dark:text-violet-300 font-bold uppercase tracking-tighter">
                                                    <Users size={10} /> {plan.subscribersCount || 0} inscritos
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                                                    <BookOpen size={10} /> {plan.weeks?.length || 0} módulos
                                                </div>
                                            </div>

                                            <button
                                                className="w-full py-2 bg-violet-50 dark:bg-violet-950/30 group-hover:bg-violet-600 group-hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm text-violet-700 dark:text-violet-200"
                                            >
                                                Gerenciar Sala <ArrowRight size={10} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* EMPTY STATE IF NO PLANS */}
                                    {userPlans.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="bg-violet-50/60 dark:bg-violet-950/10 p-6 rounded-[2.5rem] border border-dashed border-violet-200 dark:border-violet-900/50 flex items-center justify-center opacity-70">
                                            <Layout size={24} className="text-gray-300" />
                                        </div>
                                    ))}
                                    </div>

                                    <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
                                        <div className="mb-3 flex items-center justify-between px-1">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Cultos +</p>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white">Cultos da igreja {userProfile?.churchData?.churchName || ''} agendados</h3>
                                            </div>
                                            <button onClick={() => navigate('/workspace-pastoral/cultos')} className="text-[10px] font-black uppercase tracking-widest text-bible-gold hover:text-emerald-700 transition-colors">Ver cultos</button>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div
                                                onClick={() => navigate('/workspace-pastoral/cultos/novo')}
                                                className="h-[180px] flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-emerald-500/40 bg-gradient-to-br from-emerald-950 via-emerald-800 to-bible-gold text-white cursor-pointer group shadow-xl shadow-emerald-950/10 relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%)]" />
                                                <div className="relative p-4 bg-white/15 rounded-2xl mb-4 ring-1 ring-white/20 group-hover:scale-110 transition-transform">
                                                    <Sparkles size={24} />
                                                </div>
                                                <span className="relative text-[11px] font-black uppercase tracking-widest text-center px-4">Novo Culto +</span>
                                            </div>

                                            {churchServices.map((service) => (
                                                <div
                                                    key={service.id}
                                                    onClick={() => navigate(`/culto/${service.slug}`)}
                                                    className="h-[180px] rounded-[2.5rem] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm transition-all hover:border-bible-gold hover:shadow-xl hover:shadow-emerald-950/10 dark:border-emerald-900/50 dark:bg-emerald-950/10 cursor-pointer group relative overflow-hidden flex flex-col"
                                                >
                                                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-bible-gold/20 blur-2xl" />
                                                    <div className="relative mb-3 flex items-center justify-between">
                                                        <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-[7px] font-black uppercase tracking-widest text-white">{getServiceBadge(service)}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{formatServiceTime(service.startsAt)}</span>
                                                    </div>
                                                    <h4 className="relative font-black text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{service.title}</h4>
                                                    <p className="relative mt-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 line-clamp-1">{service.theme || service.serviceType}</p>
                                                    <div className="relative mt-auto flex items-center justify-between">
                                                        <span className="text-gray-400 text-[8px] font-bold">{formatShortDate(service.startsAt)}</span>
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-bible-gold">Abrir <ArrowRight size={10} /></span>
                                                    </div>
                                                </div>
                                            ))}

                                            {churchServices.length === 0 && (
                                                <div className="h-[180px] rounded-[2.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 flex items-center justify-center text-center dark:border-emerald-900/50 dark:bg-emerald-950/10">
                                                    <div>
                                                        <Calendar size={24} className="mx-auto mb-3 text-emerald-600" />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Nenhum Culto+ criado ainda</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Active Journeys */}


                        {/* Discovery Stream */}
                        {(config?.sections?.discovery?.active !== false) && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <Zap size={16} className="text-bible-gold" />
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{config?.sections?.discovery?.title || 'Descobertas'}</h3>
                                </div>

                                <div className="space-y-6">
                                    {discoveryItems.map((item: any) => {
                                        if (item.type === 'ranking_duel') {
                                            return (
                                                <div key={item.id} onClick={() => navigate('/quiz')} className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-[2rem] text-white shadow-lg cursor-pointer relative overflow-hidden transform hover:-translate-y-1 transition-transform">
                                                    <Trophy size={48} className="absolute -right-4 -bottom-4 opacity-20 rotate-12" />
                                                    <h4 className="font-bold text-lg mb-1">Duelo de Sabedoria</h4>
                                                    <p className="text-xs opacity-90 mb-4">Você está a {item.data.diff} XP de superar {item.data.rivalName}!</p>
                                                    <button className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">Aceitar Desafio</button>
                                                </div>
                                            );
                                        }
                                        if (item.type === 'trending_post') {
                                            return (
                                                <div key={item.id}>
                                                    <div className="mb-2 text-[10px] font-bold text-bible-gold uppercase tracking-widest px-2">Em Alta na Comunidade</div>
                                                    <FeedPostCard
                                                        post={item.data}
                                                        currentUser={currentUser}
                                                        onInteraction={(_, type) => handleInteraction(item.data, type)}
                                                        showNotification={showNotification}
                                                    />
                                                </div>
                                            );
                                        }
                                        if (item.type === 'flash_quiz') {
                                            return (
                                                <div key={item.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:border-purple-200 transition-colors">
                                                    <div className="flex items-center gap-2 mb-4 text-purple-600">
                                                        <Zap size={18} />
                                                        <span className="text-xs font-black uppercase tracking-widest">Flash Quiz</span>
                                                    </div>
                                                    <p className="font-bold text-gray-900 dark:text-white mb-4 text-lg">{item.data.question}</p>
                                                    <div className="space-y-2">
                                                        {item.data.options.map((opt: string, i: number) => (
                                                            <button key={i} onClick={() => navigate('/quiz')} className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 transition-colors">
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (item.type === 'creative_challenge') {
                                            return (
                                                <div key={item.id} onClick={() => navigate('/?tab=criar')} className="bg-pink-50 dark:bg-pink-900/10 p-6 rounded-[2rem] border border-pink-100 dark:border-pink-800/30 cursor-pointer hover:shadow-md transition-all flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-pink-700 dark:text-pink-300 mb-1 flex items-center gap-2"><Sparkles size={16} /> Desafio Criativo</h4>
                                                        <p className="text-xs text-pink-600 dark:text-pink-400 mb-3">Crie uma arte para Salmos 23 e compartilhe.</p>
                                                        <span className="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-black/20 text-pink-500 px-3 py-1 rounded-full">Criar Agora</span>
                                                    </div>
                                                    <div className="w-16 h-16 bg-white dark:bg-pink-900/20 rounded-full flex items-center justify-center text-pink-400">
                                                        <Sparkles size={24} />
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT COLUMN (Sidebar Widgets - Desktop Only) */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6">

                        {/* Profile Stats Widget */}
                        {(config?.sections?.profileWidget?.active !== false) && (
                            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        {userProfile?.photoURL ? (
                                            <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">{userProfile?.displayName?.substring(0, 2)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{userProfile?.displayName}</h3>
                                        <p className="text-xs text-gray-500">@{userProfile?.username}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl text-center">
                                        <span className="block text-xl font-black text-purple-600">{userProfile?.lifetimeXp || 0}</span>
                                        <span className="text-[9px] font-bold text-purple-400 uppercase">Maná</span>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl text-center">
                                        <span className="block text-xl font-black text-orange-600">{userProfile?.stats?.daysStreak || 0}</span>
                                        <span className="text-[9px] font-bold text-orange-400 uppercase">Dias Seq.</span>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/perfil')} className="w-full py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    Ver Perfil Completo
                                </button>
                                <div className="mt-4">
                                    <ManaNudge profile={userProfile || null} compact />
                                </div>
                            </div>
                        )}

                        {/* MODERN CTA - ATIVIDADES RECENTES */}
                        <div onClick={() => navigate('/historico')} className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden group">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] group-hover:scale-110 transition-transform duration-[20s] ease-linear"></div>

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                                    <History size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg leading-tight">Minhas Atividades</h3>

                                </div>
                                <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Quick Shortcuts */}
                        {(config?.sections?.quickAccess?.active !== false) && (
                            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Acesso Rápido</h3>
                                <div className="space-y-2">
                                    <button onClick={() => navigate('/estudos')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg"><BookMarked size={16} /></div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Meus Estudos</span>
                                        </div>
                                        <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                    <button onClick={() => navigate('/quiz')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 rounded-lg"><Trophy size={16} /></div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Ranking Global</span>
                                        </div>
                                        <ArrowRight size={14} className="text-gray-300 group-hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                    <button onClick={() => navigate('/?tab=criar')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-pink-100 dark:bg-pink-900/20 text-pink-600 rounded-lg"><Sparkles size={16} /></div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Estúdio Criativo</span>
                                        </div>
                                        <ArrowRight size={14} className="text-gray-300 group-hover:text-pink-500 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Removes previous prayer alert location, now it's in the bento grid */}

                        {/* Footer Links */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] text-gray-400 font-medium">
                            <button onClick={() => navigate('/termos')} className="hover:text-bible-gold">Termos</button>
                            <button onClick={() => navigate('/privacidade')} className="hover:text-bible-gold">Privacidade</button>
                            <button onClick={() => navigate('/suporte')} className="hover:text-bible-gold">Suporte</button>
                            <span>© 2024 BíbliaLM</span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeDashboard;
