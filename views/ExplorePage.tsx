"use client";
import { useNavigate, useLocation } from '../utils/router';
import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Church, User, Loader2, ArrowRight,
    Compass, BookOpen, Layout, Sparkles, Globe, HandHeart,
    Plus, MoreVertical, GraduationCap, FolderOpen, Users
} from 'lucide-react';
import { dbService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { INSPIRATIONAL_VERSES, BIBLE_BOOKS_LIST } from '../constants';
import { searchMatch } from '../utils/textUtils';
import { resolveBibleSearchNavigation } from '../utils/bibleSearchNavigation';
import SEO from '../components/SEO';
import { CustomPlan, StudyModule, GuidedPrayer, CustomQuiz } from '../types';

type ResultType = 'bible' | 'user' | 'church' | 'plan' | 'track' | 'prayer' | 'quiz';
interface SearchResult { id: string; type: ResultType; title: string; subtitle: string; icon: React.ReactNode; action: () => void; meta?: any; }

const ExplorePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { setTitle, resetHeader } = useHeader();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [userPlans, setUserPlans] = useState<CustomPlan[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const debounceRef = useRef<any>(null);
    const isSocialMode = location.pathname.startsWith('/social');

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
        <div data-module="kingdom" className="flex h-full flex-col overflow-hidden bg-[#fdfbf7] text-[#2d2a26] dark:bg-[#0b0b0c] dark:text-gray-100">
            <SEO title="Explorar o Reino | Culto+" />

            <div ref={containerRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
                <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12">
                    <section className="module-gradient relative overflow-hidden rounded-[1.5rem] px-5 py-4 text-white shadow-[0_12px_35px_rgba(91,42,134,0.16)] sm:px-6">
                        <div aria-hidden="true" className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10" />
                        <div aria-hidden="true" className="absolute -bottom-24 right-24 h-52 w-52 rounded-full bg-orange-200/15 blur-2xl" />
                        <div className="relative max-w-2xl">
                            <h1 className="text-xl font-black tracking-[-0.03em] sm:text-2xl">Explorar</h1>
                        </div>
                        <nav aria-label="Atalhos do Reino" className="relative mt-3 flex gap-1.5 overflow-x-auto border-t border-white/10 pt-3 no-scrollbar">
                            <button type="button" onClick={() => navigate('/social')} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold text-white/90 transition hover:bg-white/10"><Users size={15} /> Feed</button>
                            <button type="button" onClick={() => navigate('/social/igrejas')} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold text-white/90 transition hover:bg-white/10"><Church size={15} /> Igrejas</button>
                            <span aria-current="page" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-black text-[#5b2a86]"><Search size={15} /> Explorar</span>
                        </nav>
                    </section>

            <section aria-label="Busca global" className={`sticky top-0 z-30 mt-5 rounded-[1.5rem] border border-[#eadde8] bg-white/95 p-4 shadow-[0_8px_30px_rgba(91,42,134,0.07)] backdrop-blur transition-all dark:border-white/10 dark:bg-[#151515]/95 sm:p-5 ${isScrolled ? 'lg:-translate-y-2' : ''}`}>
                <div className="mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-700 dark:text-fuchsia-300">Busca global</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight">O que você deseja encontrar?</h2>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fuchsia-700/60" size={18} />
                    <input
                        type="text" value={query} onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Busque uma passagem, igreja, pessoa, sala ou oração..."
                        className="min-h-12 w-full rounded-xl border border-[#e9e1e8] bg-[#fbf8fa] pl-12 pr-12 text-sm font-semibold outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-200 dark:border-white/10 dark:bg-white/5 dark:focus:ring-fuchsia-500/20"
                    />
                    {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 size={16} className="animate-spin text-fuchsia-700" /></div>}
                </div>
            </section>

                <div className="mt-6 space-y-8">
                    {query.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {results.map(item => (
                                <button type="button" key={item.id} onClick={item.action} className="group flex min-h-[82px] items-center gap-3 rounded-[1.25rem] border border-[#eadde8] bg-white p-4 text-left shadow-[0_8px_25px_rgba(91,42,134,0.04)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 dark:border-white/10 dark:bg-[#151515]">
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ${item.type === 'bible' ? 'bg-amber-50 text-amber-700' : 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300'}`}>
                                        {item.meta?.photo ? <img src={item.meta.photo} alt="" className="h-full w-full object-cover" /> : item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{item.title}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">{item.subtitle}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-fuchsia-300 transition group-hover:translate-x-0.5 group-hover:text-fuchsia-700" />
                                </button>
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
                            <div className="flex items-center gap-3">
                                <div className="module-icon flex h-11 w-11 items-center justify-center rounded-xl">
                                    <Compass size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-700 dark:text-fuchsia-300">Caminhos do Reino</p>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Descubra novas conexões</h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                <button onClick={() => navigate('/social/artigos')} className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-[#eadde8] bg-white p-4 shadow-[0_8px_30px_rgba(91,42,134,0.05)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 dark:border-white/10 dark:bg-[#151515]">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center"><Globe size={20} /></div>
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Biblioteca Global</span>
                                    <span className="text-[11px] text-gray-500">Artigos da Comunidade</span>
                                </button>
                                <button onClick={() => navigate('/social/igrejas')} className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-[#eadde8] bg-white p-4 shadow-[0_8px_30px_rgba(91,42,134,0.05)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 dark:border-white/10 dark:bg-[#151515]">
                                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg flex items-center justify-center"><Church size={20} /></div>
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Igrejas</span>
                                    <span className="text-[11px] text-gray-500">Comunidades no Reino</span>
                                </button>
                                <button onClick={() => navigate('/social/oracao')} className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-[#eadde8] bg-white p-4 shadow-[0_8px_30px_rgba(91,42,134,0.05)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 dark:border-white/10 dark:bg-[#151515]">
                                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg flex items-center justify-center"><HandHeart size={20} /></div>
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Sala de Oração</span>
                                    <span className="text-[11px] text-gray-500">Intercessão & Pedidos</span>
                                </button>
                            </div>

                            {/* ESPAÇO + SECTION */}
                            <section className="space-y-4 rounded-[1.75rem] border border-[#eadde8] bg-white p-5 shadow-[0_8px_30px_rgba(91,42,134,0.05)] dark:border-white/10 dark:bg-[#151515] sm:p-6">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="module-icon flex h-10 w-10 items-center justify-center rounded-xl"><BookOpen size={18} /></span>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Espaço +</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-700 dark:text-fuchsia-300">Crescimento em comunidade</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/acervo')}
                                        className="flex min-h-10 items-center gap-1.5 rounded-xl border border-fuchsia-200 px-3 text-xs font-bold text-fuchsia-700 transition hover:bg-fuchsia-50 dark:border-fuchsia-500/20 dark:text-fuchsia-300"
                                    >
                                        <FolderOpen size={14} />
                                        Acervo
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                    {/* NEW ROOM CTA */}
                                    <div
                                        onClick={() => navigate('/criar-sala')}
                                        className="group flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-fuchsia-300 bg-fuchsia-50/50 transition hover:bg-fuchsia-50 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/[0.06]"
                                    >
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-700 transition-transform group-hover:scale-105 dark:bg-fuchsia-500/15 dark:text-fuchsia-300">
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
                            </section>
                        </>
                    )}
                </div>
                </main>
            </div>
        </div>
    );
};

export default ExplorePage;
