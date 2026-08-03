"use client";
import { useNavigate } from '../utils/router';
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/supabase';
import { SavedStudy, CustomPlan, Track } from '../types';
import { Loader2, TrendingUp, Clock, Globe, ArrowLeft, BookOpen, Layers, Map } from 'lucide-react';
import StandardCard from '../components/ui/StandardCard';
import SEO from '../components/SEO';
import { useHeader } from '../contexts/HeaderContext';

type ContentType = 'all' | 'article' | 'plan' | 'track';
type SortFilter = 'recent' | 'popular';

interface LibraryItem {
    id: string;
    type: 'article' | 'plan' | 'track';
    title: string;
    subtitle: string;
    author: string;
    createdAt: string;
    engagement: number; // Used for popular sort: views_count, subscribersCount, etc
    original: SavedStudy | CustomPlan | Track;
}

const CommunityArticlesPage: React.FC = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortFilter, setSortFilter] = useState<SortFilter>('recent');
    const [typeFilter, setTypeFilter] = useState<ContentType>('all');
    const { setTitle, setSubtitle, setIcon, resetHeader } = useHeader();

    useEffect(() => {
        setTitle('Biblioteca Global');
        setIcon(<Layers size={20} className="text-bible-gold" />);
        return () => resetHeader();
    }, [setTitle, setIcon, resetHeader]);

    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            try {
                // Fetch all content types concurrently
                // For articles, we fetch based on the sort filter directly via dbService optionally
                const [articles, plans, tracks] = await Promise.all([
                    dbService.getCommunityArticles(sortFilter),
                    dbService.getPublicPlans(),
                    dbService.getPublicTracks(30)
                ]);

                const normalizedItems: LibraryItem[] = [
                    ...articles.map((a: SavedStudy): LibraryItem => ({
                        id: a.id,
                        type: 'article',
                        title: a.title || 'Estudo sem título',
                        subtitle: a.sourceText || 'Estudo Bíblico',
                        author: (a as any).userName || 'Comunidade', // userName is joined in getCommunityArticles
                        createdAt: a.createdAt,
                        engagement: a.viewsCount || a.metrics?.views || 0,
                        original: {
                            ...a,
                            metrics: {
                                views: a.viewsCount || a.metrics?.views || 0,
                                shares: a.metrics?.shares || 0,
                                completions: a.metrics?.completions,
                                likes: a.metrics?.likes,
                            },
                        }
                    })),
                    ...plans.map((p: CustomPlan): LibraryItem => ({
                        id: p.id,
                        type: 'plan',
                        title: p.title,
                        subtitle: p.description || 'Sala de Estudo',
                        author: p.authorName ?? 'Comunidade',
                        createdAt: p.createdAt,
                        engagement: p.viewsCount || p.subscribersCount || 0,
                        original: {
                            ...p,
                            metrics: {
                                views: p.viewsCount || p.metrics?.views || 0,
                                shares: p.metrics?.shares || 0,
                                completions: p.metrics?.completions,
                                likes: p.metrics?.likes,
                            },
                        }
                    })),
                    ...tracks.map((t: Track): LibraryItem => ({
                        id: t.id,
                        type: 'track',
                        title: t.title,
                        subtitle: t.description || 'Trilha de Leitura',
                        author: t.generatedBy === 'ai' ? 'Culto+ IA' : 'Comunidade',
                        createdAt: t.createdAt,
                        engagement: 0, // Tracks might not have an engagement metric yet
                        original: t
                    }))
                ];

                setItems(normalizedItems);
            } catch (e) {
                console.error("Error loading library content", e);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, [sortFilter]); // Re-fetch on sortFilter change so DB queries map the order natively if supported

    const filteredAndSortedItems = useMemo(() => {
        let result = [...items];

        // 1. Filter by Content Type
        if (typeFilter !== 'all') {
            result = result.filter(item => item.type === typeFilter);
        }

        // 2. Local Sort by SortFilter
        // (Even though the DB query sorted some items, the merged list needs a holistic sort)
        if (sortFilter === 'recent') {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortFilter === 'popular') {
            result.sort((a, b) => b.engagement - a.engagement);
        }

        return result;
    }, [items, typeFilter, sortFilter]);

    const handleItemClick = (item: LibraryItem) => {
        switch (item.type) {
            case 'article': navigate(`/v/${item.id}`); break;
            case 'plan': navigate(`/jornada/${item.id}`); break;
            case 'track': navigate(`/trilha/${item.id}`); break;
        }
    };

    const getBadgeConfig = (type: string) => {
        switch (type) {
            case 'article': return { label: 'Artigo', color: 'bg-blue-50 text-blue-600' };
            case 'plan': return { label: 'Sala', color: 'bg-purple-50 text-purple-600' };
            case 'track': return { label: 'Trilha', color: 'bg-emerald-50 text-emerald-600' };
            default: return { label: 'Conteúdo', color: 'bg-gray-50 text-gray-600' };
        }
    };

    const tabs = [
        { id: 'all', label: 'Tudo' },
        { id: 'article', label: 'Artigos' },
        { id: 'plan', label: 'Salas' },
        { id: 'track', label: 'Trilhas' }
    ];

    return (
        <div data-testid="kingdom-library" className="module-soft-surface flex h-full flex-col overflow-y-auto">
            <SEO title="Biblioteca Global" />

            {/* Header / Filtros */}
            <div className="relative z-10 shrink-0 border-b border-[var(--module-border)] bg-white/90 px-6 pb-4 pt-6 backdrop-blur md:px-12 dark:bg-[#171219]/90">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col gap-4">
                        {/* Content Type Tabs */}
                        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar hide-scrollbar">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTypeFilter(tab.id as ContentType)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${typeFilter === tab.id
                                        ? 'module-gradient text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Sort Filter Pills */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSortFilter('recent')}
                                className={`module-focus flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${sortFilter === 'recent' ? 'module-gradient text-white shadow-md' : 'border border-[var(--module-border)] bg-transparent text-gray-500'}`}
                            >
                                <Clock size={14} /> Recentes
                            </button>
                            <button
                                onClick={() => setSortFilter('popular')}
                                className={`module-focus flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${sortFilter === 'popular' ? 'module-gradient text-white shadow-md' : 'border border-[var(--module-border)] bg-transparent text-gray-500'}`}
                            >
                                <TrendingUp size={14} /> Populares
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 md:p-12 overflow-y-auto w-full relative">
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="module-accent-text animate-spin" size={40} /></div>
                    ) : filteredAndSortedItems.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhum conteúdo encontrado.</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Tente ajustar seus filtros para descobrir novos conteúdos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                            {filteredAndSortedItems.map(item => (
                                <StandardCard
                                    key={`${item.type}-${item.id}`}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    author={item.author}
                                    badges={[getBadgeConfig(item.type)]}
                                    metrics={(item.original as any).metrics} // Ensure metrics map over if present
                                    actionLabel={item.type === 'article' ? "Ler Artigo" : item.type === 'plan' ? "Ver Sala" : "Ver Trilha"}
                                    onAction={() => handleItemClick(item)}
                                    imageUrl={(item.original as any).coverUrl || undefined}
                                    onClick={() => handleItemClick(item)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Space for bottom nav on mobile */}
                <div className="h-24 md:h-12"></div>
            </div>

        </div>
    );
};

export default CommunityArticlesPage;
