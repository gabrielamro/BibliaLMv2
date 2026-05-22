"use client";
import { useNavigate, useLocation } from '../utils/router';
import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Church, User, Trophy, Loader2, ArrowRight,
    Compass, BookOpen, Layout, X, Sparkles, Globe, HandHeart,
    Plus, MoreVertical, Calendar, GraduationCap, FolderOpen
} from 'lucide-react';
import { dbService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { INSPIRATIONAL_VERSES, BIBLE_BOOKS_LIST } from '../constants';
import { searchMatch } from '../utils/textUtils';
import { resolveBibleSearchNavigation } from '../utils/bibleSearchNavigation';
import SEO from '../components/SEO';
import SocialNavigation from '../components/SocialNavigation';
import { CustomPlan, StudyModule, GuidedPrayer, CustomQuiz } from '../types';

type ResultType = 'bible' | 'user' | 'church' | 'plan' | 'track' | 'prayer' | 'quiz';
interface SearchResult { id: string; type: ResultType; title: string; subtitle: string; icon: React.ReactNode; action: () => void; meta?: any; }

const ExplorePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { setTitle, resetHeader } = useHeader();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [userPlans, setUserPlans] = useState<CustomPlan[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const debounceRef = useRef<any>(null);
    const isSocialMode = window.location.hash.includes('/social');

    // Scroll States
    const [isScrolled, setIsScrolled] = useState(false);
    const lastScrollYList = useRef(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        if (currentScrollY > lastScrollYList.current && currentScrollY > 50) {
            setIsScrolled(true);
        } else if (currentScrollY < lastScrollYList.current) {
            setIsScrolled(false);
        }
        lastScrollYList.current = currentScrollY;
    };

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTitle('Explorar');

        const handleScrollToTop = () => {
            if (containerRef.current) {
                containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('biblialm-scroll-top', handleScrollToTop);

        return () => {
            resetHeader();
            window.removeEventListener('biblialm-scroll-top', handleScrollToTop);
        };
    }, [setTitle, resetHeader]);

    useEffect(() => {
        if (currentUser) {
            setIsLoadingPlans(true);
            dbService.getUserCustomPlans(currentUser.uid).then(plans => {
                setUserPlans(plans);
                setIsLoadingPlans(false);
            });
        }
    }, [currentUser]);

    const handleSearch = (text: string) => {
        setQuery(text);
        if (text.length < 2) {
            setResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            const lowerText = text.toLowerCase().trim();
            const newResults: SearchResult[] = [];

            // 1. Bible Books
            const bibleResult = await resolveBibleSearchNavigation(lowerText);
            if (bibleResult) {
                newResults.push({
                    id: `bible-${bibleResult.routeState.bookId}-${bibleResult.routeState.chapter}`,
                    type: 'bible',
                    title: `Ler ${bibleResult.formattedRef}`,
                    subtitle: 'Escrituras',
                    icon: <BookOpen size={16} />,
                    action: () => navigate('/biblia', { state: bibleResult.routeState })
                });
            }

            try {
                // 2. Users & Churches
                const [users, churches] = await Promise.all([
                    dbService.searchUsersByName(text),
                    dbService.searchGlobalChurches(text)
                ]);
                churches.forEach(c => newResults.push({ id: `ch-${c.id}`, type: 'church', title: c.name, subtitle: `${c.location?.city || 'Igreja'}`, icon: <Church size={16} />, action: () => navigate(`/igreja/${c.slug}`) }));
                users.forEach(u => newResults.push({ id: `u-${u.uid}`, type: 'user', title: u.displayName, subtitle: `@${u.username}`, icon: <User size={16} />, action: () => navigate(`/u/${u.username}`), meta: { photo: u.photoURL } }));

                // 3. Global Plans, Tracks, Prayers, Quizzes (Basic Search)
                const [plans, tracks, prayers] = await Promise.all([
                    dbService.getPublicPlans(),
                    dbService.getPublicTracks(),
                    dbService.getGuidedPrayers()
                ]);

                plans.filter(p => searchMatch(text, p.title, "")).forEach(p => newResults.push({ id: `p-${p.id}`, type: 'plan', title: p.title, subtitle: 'Sala de Estudo', icon: <Layout size={16} />, action: () => navigate(`/jornada/${p.id}`) }));
                tracks.filter(t => searchMatch(text, t.title, "")).forEach(t => newResults.push({ id: `t-${t.id}`, type: 'track', title: t.title, subtitle: 'Trilha de Crescimento', icon: <GraduationCap size={16} />, action: () => navigate(`/estudo/modulo/${t.id}`) }));
                prayers.filter(pr => searchMatch(text, pr.title, "")).forEach(pr => newResults.push({ id: `pr-${pr.id}`, type: 'prayer', title: pr.title, subtitle: 'Oração Guiada', icon: <HandHeart size={16} />, action: () => navigate(`/social/oracao`, { state: { prayerId: pr.id } }) }));

            } catch (e) { }

            setResults(newResults);
            setIsSearching(false);
        }, 400);
    };

    const getStatusLabel = (plan: CustomPlan) => {
        if (plan.status !== 'published') return { text: 'RASCUNHO', class: 'bg-gray-100 text-gray-500 border-gray-200' };
        return { text: 'EM ANDAMENTO', class: 'bg-green-50 text-green-600 border-green-100' };
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-black flex flex-col overflow-hidden">
            <SEO title="Explorar" />

            <div className={`px-4 py-3 sm:px-6 lg:px-8 bg-white dark:bg-bible-darkPaper border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[60] transition-all duration-300 ${isScrolled ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                <div className="w-full max-w-7xl mx-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Buscar versículo, igreja ou irmão..."
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 focus:border-bible-gold/50 rounded-xl outline-none text-sm font-semibold transition-all"
                    />
                    {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 size={14} className="animate-spin text-bible-gold" /></div>}
                </div>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-5 pb-24 mobile-bottom-nav-offset sm:px-6 lg:px-8 md:pb-24" onScroll={handleScroll}>
                <div className="w-full max-w-7xl mx-auto space-y-8">
                    {query.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {results.map(item => (
                                <div key={item.id} onClick={item.action} className="flex items-center gap-3 p-3 bg-white dark:bg-bible-darkPaper rounded-xl border border-gray-100 dark:border-gray-800 hover:border-bible-gold/50 active:scale-[0.99] transition-all cursor-pointer">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'bible' ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-500'} overflow-hidden`}>
                                        {item.meta?.photo ? <img src={item.meta.photo} className="w-full h-full object-cover" /> : item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{item.title}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">{item.subtitle}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-gray-300" />
                                </div>
                            ))}
                            {results.length === 0 && !isSearching && (
                                <div className="md:col-span-2 xl:col-span-3 py-12 text-center text-sm font-semibold text-gray-400">
                                    Nenhum resultado encontrado.
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* DESCUBRA O REINO SECTION */}
                            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-bible-darkPaper border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                                    <Compass size={20} className="text-bible-gold" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Descubra o Reino</p>
                                    <h2 className="text-xl font-serif font-black text-gray-900 dark:text-white">Explorar</h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                <button onClick={() => navigate('/social/artigos')} className="bg-white dark:bg-bible-darkPaper p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-2 hover:border-bible-gold/60 transition-all active:scale-[0.99]">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center"><Globe size={20} /></div>
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Biblioteca Global</span>
                                    <span className="text-[11px] text-gray-500">Artigos da Comunidade</span>
                                </button>
                                <button onClick={() => navigate('/social/igrejas')} className="bg-white dark:bg-bible-darkPaper p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-2 hover:border-bible-gold/60 transition-all active:scale-[0.99]">
                                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg flex items-center justify-center"><Church size={20} /></div>
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Igrejas</span>
                                    <span className="text-[11px] text-gray-500">Comunidades no Reino</span>
                                </button>
                                <button onClick={() => navigate('/social/oracao')} className="bg-white dark:bg-bible-darkPaper p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-2 hover:border-bible-gold/60 transition-all active:scale-[0.99]">
                                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg flex items-center justify-center"><HandHeart size={20} /></div>
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Sala de Oração</span>
                                    <span className="text-[11px] text-gray-500">Intercessão & Pedidos</span>
                                </button>
                            </div>

                            {/* ESPAÇO + SECTION */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={18} className="text-bible-gold" />
                                        <div>
                                            <h3 className="text-lg font-serif font-black text-gray-900 dark:text-white">Espaço +</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Espaço do pastor e Igreja</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/acervo')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-bible-gold/10 hover:bg-bible-gold/20 rounded-lg text-bible-gold text-xs font-bold transition-colors"
                                    >
                                        <FolderOpen size={14} />
                                        Acervo
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                    {/* NEW ROOM CTA */}
                                    <div
                                        onClick={() => navigate('/criar-sala')}
                                        className="min-h-[168px] flex flex-col items-center justify-center border border-dashed border-bible-gold/40 rounded-xl bg-bible-gold/5 hover:bg-bible-gold/10 transition-colors cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 bg-bible-gold/15 text-bible-gold rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <Plus size={20} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest text-center px-4">Nova Sala</span>
                                        <p className="text-[11px] text-gray-500 text-center mt-2 px-6">Crie uma sala nova exclusiva para sua igreja.</p>
                                    </div>

                                    {/* USER PLANS */}
                                    {userPlans.map(plan => {
                                        const status = getStatusLabel(plan);
                                        return (
                                            <div
                                                key={plan.id}
                                                onClick={() => navigate(`/jornada/${plan.id}`)}
                                                className="bg-white dark:bg-bible-darkPaper p-4 rounded-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group cursor-pointer hover:border-bible-gold/60 transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold border ${status.class}`}>
                                                        {status.text}
                                                    </span>
                                                    <button className="text-gray-300 hover:text-gray-600"><MoreVertical size={14} /></button>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Criação: {new Date(plan.createdAt || '').toLocaleDateString('pt-BR')}</p>
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate mb-4">{plan.title}</h4>
                                                <div className="space-y-1 mb-6">
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500"><User size={10} /> 0 alunos inscritos</div>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500"><BookOpen size={10} /> {plan.weeks?.length || 0} módulos selecionados</div>
                                                </div>
                                                <button
                                                    className="w-full py-2.5 bg-gray-50 dark:bg-black/40 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-bible-gold group-hover:text-white transition-all"
                                                >
                                                    Gerenciar Sala <ArrowRight size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {isLoadingPlans && [1, 2].map(i => <div key={i} className="h-[168px] bg-gray-100 dark:bg-bible-darkPaper/50 animate-pulse rounded-xl" />)}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {isSocialMode && <SocialNavigation activeTab="explore" />}
        </div>
    );
};

export default ExplorePage;
