"use client";
import Link from 'next/link';
import { useNavigate, useLocation } from '../../utils/router';


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, BookOpen, Bookmark, CalendarDays, ChevronRight, Church, HandHeart, HeartPulse, ImageIcon, Loader2, MapPin, PenLine, Plus, Quote, Search, Sparkles, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatures } from '../../contexts/FeatureContext';
import { useHeader } from '../../contexts/HeaderContext';

import { dbService } from '../../services/supabase';
import { postInteractionService } from '../../services/postInteractionService';
import { Post } from '../../types';
import SEO from '../../components/SEO';
import { generateShareLink } from '../../utils/shareUtils';
import ConfirmationModal from '../../components/ConfirmationModal';
import PromptModal from '../../components/PromptModal';
import { FeedPostCard } from '../../components/social/FeedPostCard';
import KingdomComposer from '../../components/social/KingdomComposer';
import FeatureCard, { FeatureCardType } from '../../components/social/FeatureCard';
import PostCommentsSheet from '../../components/social/PostCommentsSheet';
import KingdomPathRailV2 from '../../components/social/KingdomPathRail';
import { kingdomPathService, type KingdomPathData } from '../../services/kingdomPathService';
import { INSPIRATIONAL_VERSES } from '../../constants';

interface FeatureItem {
    id: string;
    type: 'feature';
    featureType: FeatureCardType;
}

interface MeditationItem {
    id: string;
    type: 'meditation';
    verse: { text: string, ref: string };
}

type FeedItem = Post | FeatureItem | MeditationItem;
type FeedFilter = 'all' | 'following' | 'church' | 'groups' | 'saved';

const FeatureDisabled = () => (
    <div className="flex h-full flex-col items-center justify-center bg-[#fdfbf7] p-8 text-center animate-in fade-in dark:bg-[#0b0b0c]">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-500/10">
            <Sparkles className="text-emerald-700 dark:text-emerald-300" size={32} />
        </div>
        <h2 className="mb-2 text-2xl font-black text-gray-900 dark:text-white">Em breve</h2>
        <p className="max-w-xs text-gray-500 dark:text-gray-400">
            Estamos preparando algo especial para o Reino. Esta funcionalidade estará disponível em breve.
        </p>
    </div>
);

const KingdomPulse = ({ posts }: { posts: Post[] }) => {
    const churchPosts = posts.filter(post => post.destination === 'church' || post.feedReason === 'same_church').length;
    const groupPosts = posts.filter(post => post.destination === 'cell' || post.feedReason === 'same_group').length;
    const conversations = posts.reduce((total, post) => total + (post.commentsCount || 0), 0);
    const signals = [
        { label: 'partilhas recentes', value: posts.length },
        { label: 'da sua igreja', value: churchPosts },
        { label: 'dos seus grupos', value: groupPosts },
        { label: 'conversas abertas', value: conversations },
    ].filter(signal => signal.value > 0).slice(0, 3);

    if (!signals.length) return null;
    return (
        <section aria-labelledby="kingdom-pulse-title" className="mb-5 hidden overflow-hidden rounded-2xl border border-violet-200/70 bg-white/80 shadow-[0_10px_35px_rgba(75,35,108,0.06)] dark:border-fuchsia-400/15 dark:bg-[#17131d] sm:block">
            <div className="flex flex-col md:flex-row md:items-stretch">
                <div className="flex min-h-14 items-center gap-2 border-b border-violet-100 px-4 text-violet-800 dark:border-white/10 dark:text-fuchsia-300 md:min-w-48 md:border-b-0 md:border-r">
                    <HeartPulse size={20} aria-hidden="true" />
                    <h2 id="kingdom-pulse-title" className="text-sm font-black">Pulso do Reino</h2>
                </div>
                <div className="grid flex-1 grid-cols-1 divide-y divide-violet-100 dark:divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    {signals.map(signal => <div key={signal.label} className="flex min-h-14 items-center gap-2 px-4 text-sm"><span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400" /><strong className="text-gray-900 dark:text-white">{signal.value}</strong><span className="text-gray-500 dark:text-gray-400">{signal.label}</span></div>)}
                </div>
            </div>
        </section>
    );
};

const KingdomPathRail = ({ churchHref, hasChurch, savedCount, onShowSaved }: { churchHref: string; hasChurch: boolean; savedCount: number; onShowSaved: () => void }) => (
    <aside aria-labelledby="kingdom-path-title" className="sticky top-5 hidden self-start rounded-[1.5rem] border border-[#e4ded5] bg-white p-5 shadow-[0_14px_45px_rgba(30,20,45,0.07)] dark:border-white/10 dark:bg-[#17131d] xl:block">
        <div className="mb-4 flex items-center gap-3 border-b border-[#eee8e0] pb-4 dark:border-white/10">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400" />
            <h2 id="kingdom-path-title" className="text-lg font-black text-gray-950 dark:text-white">Seu caminho</h2>
        </div>
        <nav aria-label="Continuidade no Culto+" className="space-y-3">
            <Link href="/meus-cultos" className="group flex min-h-20 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 transition hover:border-emerald-300 dark:border-emerald-400/10 dark:bg-emerald-500/5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm dark:bg-white/5 dark:text-emerald-300"><CalendarDays size={20} /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm text-gray-900 dark:text-white">Seus cultos</strong><span className="block text-xs text-gray-500 dark:text-gray-400">Agenda, notas e continuidade</span></span><ChevronRight size={17} className="text-gray-400 transition group-hover:translate-x-0.5" />
            </Link>
            <Link href={churchHref} className="group flex min-h-20 items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-3 transition hover:border-violet-300 dark:border-violet-400/10 dark:bg-violet-500/5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm dark:bg-white/5 dark:text-violet-300"><Church size={20} /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm text-gray-900 dark:text-white">{hasChurch ? 'Minha igreja' : 'Encontrar uma igreja'}</strong><span className="block text-xs text-gray-500 dark:text-gray-400">Mural, cultos, grupos e membros</span></span><ChevronRight size={17} className="text-gray-400 transition group-hover:translate-x-0.5" />
            </Link>
            <Link href="/estudos" className="group flex min-h-20 items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3 transition hover:border-amber-300 dark:border-amber-400/10 dark:bg-amber-500/5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm dark:bg-white/5 dark:text-amber-300"><BookOpen size={20} /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm text-gray-900 dark:text-white">Continuar estudando</strong><span className="block text-xs text-gray-500 dark:text-gray-400">Retome a Palavra de onde parou</span></span><ChevronRight size={17} className="text-gray-400 transition group-hover:translate-x-0.5" />
            </Link>
            <button type="button" onClick={onShowSaved} className="group flex min-h-16 w-full items-center gap-3 rounded-2xl border border-[#eee8e0] p-3 text-left transition hover:border-fuchsia-200 dark:border-white/10">
                <Bookmark size={19} className="text-fuchsia-700 dark:text-fuchsia-300" /><span className="flex-1 text-sm font-bold text-gray-800 dark:text-gray-200">Salvos {savedCount > 0 ? `(${savedCount})` : ''}</span><ChevronRight size={17} className="text-gray-400" />
            </button>
            <Link href="/oracoes" className="group flex min-h-16 items-center gap-3 rounded-2xl border border-[#eee8e0] p-3 transition hover:border-fuchsia-200 dark:border-white/10">
                <HandHeart size={19} className="text-fuchsia-700 dark:text-fuchsia-300" /><span className="flex-1 text-sm font-bold text-gray-800 dark:text-gray-200">Pedidos de oração</span><ChevronRight size={17} className="text-gray-400" />
            </Link>
        </nav>
    </aside>
);

const SocialFeedPage: React.FC = () => {
    const { currentUser, userProfile, openLogin, showNotification, recordActivity } = useAuth();
    const { isFeatureEnabled } = useFeatures();
    const { setIsHeaderHidden } = useHeader();
    const navigate = useNavigate();
    const location = useLocation();

    const [posts, setPosts] = useState<Post[]>([]);
    const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    const [pullStartY, setPullStartY] = useState(0);
    const [pullMoveY, setPullMoveY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const [postToEdit, setPostToEdit] = useState<Post | null>(null);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [isKingdomComposerOpen, setIsKingdomComposerOpen] = useState(false);
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [commentsPost, setCommentsPost] = useState<Post | null>(null);
    const [postToReport, setPostToReport] = useState<Post | null>(null);
    const [pathData, setPathData] = useState<KingdomPathData>({ nextService: null, prayerInvitation: null, savedStudy: null, scaleInvitation: null, hasPartialFailure: false });
    const [isPathLoading, setIsPathLoading] = useState(false);

    // State for prefilled content from other pages (e.g. Creative Studio)
    const [composerProps, setComposerProps] = useState<{ image?: string | null, caption?: string, initialTab?: 'reflection' | 'prayer' | 'feeling' | 'checkin' }>({});
    const highlightPostIdRef = useRef<string | null>(null);

    // Handle navigation state (e.g. coming from Studio with an image)
    useEffect(() => {
        const state = location.state as any;
        if (state?.openCreate) {
            setComposerProps({
                image: state.prefilledImage,
                caption: state.prefilledCaption,
                initialTab: state.initialTab || 'reflection'
            });
            setIsKingdomComposerOpen(true);
            // Clear state to avoid reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        let mounted = true;
        const userId = currentUser?.uid || currentUser?.id;
        setIsPathLoading(Boolean(userId));
        void kingdomPathService.load({ userId, churchId: userProfile?.churchData?.churchId })
            .then((data) => {
                if (mounted) setPathData(data);
            })
            .catch(() => {
                if (mounted) setPathData({ nextService: null, prayerInvitation: null, savedStudy: null, scaleInvitation: null, hasPartialFailure: true });
            })
            .finally(() => {
                if (mounted) setIsPathLoading(false);
            });
        return () => { mounted = false; };
    }, [currentUser?.id, currentUser?.uid, userProfile?.churchData?.churchId]);

    const loadFeed = async (isPull = false) => {
        if (!isPull) setIsLoading(true);
        setError(null);
        try {
            const fetchedPosts = await dbService.getGlobalFeed(50, userProfile);
            setPosts(fetchedPosts ?? []);
        } catch (e: any) {
            console.warn("Feed Error:", e?.message);
            setError('Não foi possível carregar as publicações agora. Seu conteúdo não foi substituído por dados de demonstração.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            if (highlightPostIdRef.current) {
                const postId = highlightPostIdRef.current;
                highlightPostIdRef.current = null;
                window.setTimeout(() => {
                    document.querySelector(`[data-post-id="${postId}"]`)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }, 120);
            }
        }
    };

    useEffect(() => {
        const state = location.state as any;
        if (!state?.refreshFeed) return;
        highlightPostIdRef.current = state.highlightPostId ?? null;
        void loadFeed();
        window.history.replaceState({}, document.title);
    }, [location]);

    useEffect(() => {
        loadFeed();

        const handleScrollToTop = () => {
            if (containerRef.current) {
                containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('biblialm-scroll-top', handleScrollToTop);

        return () => {
            setIsHeaderHidden(false);
            window.removeEventListener('biblialm-scroll-top', handleScrollToTop);
        };
    }, [userProfile?.churchData?.churchId, userProfile?.churchData?.groupId]);

    const lastScrollYList = useRef(0);
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const currentScrollY = target.scrollTop;

        if (currentScrollY > lastScrollYList.current && currentScrollY > 20) {
            setIsHeaderHidden(true);
        } else if (currentScrollY < lastScrollYList.current) {
            setIsHeaderHidden(false);
        }
        lastScrollYList.current = currentScrollY;

        const progress = (currentScrollY / (target.scrollHeight - target.clientHeight)) * 100;
        setScrollProgress(progress);
    };

    const handleInteraction = async (postId: string, type: 'like' | 'comment' | 'share' | 'save') => {
        if (!currentUser) { openLogin(); return; }
        const targetPost = posts.find(p => p.id === postId);
        if (!targetPost) return;

        if (type === 'like') {
            const isLiked = targetPost.likedBy?.includes(currentUser.uid);
            const previousPost = targetPost;
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    const newLikes = isLiked ? (p.likesCount - 1) : (p.likesCount + 1);
                    const newLikedBy = isLiked ? p.likedBy.filter(uid => uid !== currentUser.uid) : [...(p.likedBy || []), currentUser.uid];
                    return { ...p, likesCount: newLikes, likedBy: newLikedBy };
                }
                return p;
            }));
            try {
                const persisted = await postInteractionService.setLiked(targetPost, currentUser.uid, !isLiked);
                setPosts(prev => prev.map(post => post.id === postId ? persisted : post));
            } catch {
                setPosts(prev => prev.map(post => post.id === postId ? previousPost : post));
                showNotification('Não foi possível atualizar a curtida.', 'error');
            }
        } else if (type === 'share') {
            const shareUrl = generateShareLink('post', { postId });
            if (navigator.share) {
                await navigator.share({ title: 'Culto+', url: shareUrl });
            } else {
                navigator.clipboard.writeText(shareUrl);
                showNotification("Link copiado!", "success");
            }
        } else if (type === 'comment') {
            setCommentsPost(targetPost);
        } else if (type === 'save') {
            const desired = !targetPost.saved;
            setPosts(prev => prev.map(post => post.id === postId ? { ...post, saved: desired } : post));
            try {
                const persisted = await postInteractionService.setSaved(targetPost, desired);
                setPosts(prev => prev.map(post => post.id === postId ? persisted : post));
                showNotification(desired ? 'Publicação salva.' : 'Removida dos salvos.', 'success');
            } catch {
                setPosts(prev => prev.map(post => post.id === postId ? targetPost : post));
                showNotification('Não foi possível atualizar os salvos.', 'error');
            }
        }
    };

    const handleHidePost = async (postId: string) => {
        if (!currentUser) { openLogin(); return; }
        const previous = posts;
        setPosts(current => current.filter(post => post.id !== postId));
        try {
            await postInteractionService.hide(postId, currentUser.uid);
            showNotification('Publicação ocultada do seu feed.', 'success');
        } catch {
            setPosts(previous);
            showNotification('Não foi possível ocultar a publicação.', 'error');
        }
    };

    const handleCommentAdded = (postId: string) => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
    };

    const handleActionClick = (action: 'write' | 'image' | 'checkin') => {
        setIsPlusMenuOpen(false);
        if (!currentUser) { openLogin(); return; }

        switch (action) {
            case 'write':
                setComposerProps({});
                setIsKingdomComposerOpen(true);
                break;
            case 'checkin':
                setComposerProps({ initialTab: 'checkin' });
                setIsKingdomComposerOpen(true);
                break;
            case 'image':
                navigate('/criar-arte-sacra');
                return;
        }
    };

    const onPostSuccess = (postId?: string) => {
        setIsKingdomComposerOpen(false);
        setComposerProps({});
        // Delay maior para garantir que o Firestore processou a escrita e o índice
        highlightPostIdRef.current = postId ?? null;
        void loadFeed();
    };

    const filteredPosts = useMemo(() => posts.filter(post => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'following') return post.feedReason === 'following';
        if (activeFilter === 'church') return post.destination === 'church' || post.feedReason === 'same_church';
        if (activeFilter === 'saved') return Boolean(post.saved);
        return post.destination === 'cell' || post.feedReason === 'same_group';
    }), [activeFilter, posts]);

    const mixedFeed = useMemo(() => {
        const result: FeedItem[] = [];
        const hour = new Date().getHours();

        // Estratégia de Features
        const featuresByTime: FeatureCardType[] = [];
        if (hour >= 5 && hour <= 10) featuresByTime.push('plan', 'devotional', 'chat');
        else if (hour >= 18 && hour <= 23) featuresByTime.push('studio', 'quiz');
        else featuresByTime.push('devotional', 'studio', 'chat', 'quiz', 'plan');

        let featIdx = 0;
        let medIdx = 0;

        filteredPosts.forEach((post, idx) => {
            result.push(post);

            // Injeção de Features (a cada 5 posts)
            if (idx > 0 && (idx + 1) % 5 === 0 && featIdx < featuresByTime.length) {
                result.push({
                    id: `feat-${idx}-${featuresByTime[featIdx]}`,
                    type: 'feature',
                    featureType: featuresByTime[featIdx]
                });
                featIdx++;
            }

            // Injeção de Meditação (a cada 8 posts)
            if (idx > 0 && (idx + 1) % 8 === 0) {
                const verse = INSPIRATIONAL_VERSES[medIdx % INSPIRATIONAL_VERSES.length];
                result.push({
                    id: `med-${idx}`,
                    type: 'meditation',
                    verse: verse
                });
                medIdx++;
            }
        });

        return result;
    }, [filteredPosts]);

    const churchHref = userProfile?.churchData?.churchSlug
        ? `/igreja/${userProfile.churchData.churchSlug}`
        : '/social/igrejas';
    const displayName = userProfile?.displayName || userProfile?.username || 'Você';
    const savedCount = posts.filter(post => post.saved).length;

    if (!isFeatureEnabled('module_social')) {
        return <FeatureDisabled />;
    }

    return (
        <div
            data-module="kingdom"
            className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fdfbf7] text-[#17211f] dark:bg-[#0b0b0c] dark:text-gray-100"
        >
            <SEO title="Reino | Culto+" />

            <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] lg:left-[256px]">
                <div
                    className="h-full bg-[var(--module-primary)] transition-all duration-300 ease-out"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>


            <div
                ref={containerRef}
                data-testid="feed-container"
                className="relative flex-1 overflow-y-auto scroll-smooth no-scrollbar"
                onScroll={handleScroll}
                onTouchStart={e => { if (containerRef.current?.scrollTop === 0) setPullStartY(e.touches[0].clientY); }}
                onTouchMove={e => { if (pullStartY > 0 && !isRefreshing) setPullMoveY(Math.min((e.touches[0].clientY - pullStartY) * 0.5, 100)); }}
                onTouchEnd={() => { if (pullMoveY > 60) { setIsRefreshing(true); loadFeed(true); } setPullMoveY(0); setPullStartY(0); }}
            >
                {/* Pull to Refresh Indicator */}
                <div className="pointer-events-none absolute left-0 right-0 z-20 flex justify-center transition-transform duration-200" style={{ top: '15px', transform: `translateY(${pullMoveY > 0 ? pullMoveY - 40 : -100}px)` }}>
                    <div className="module-accent-bg rounded-full p-2.5 shadow-xl">
                        <Loader2 className="animate-spin" size={20} />
                    </div>
                </div>

                <div
                    data-testid="kingdom-feed-column"
                    className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-4 transition-transform duration-200 sm:px-6 sm:pt-6 lg:px-7"
                    style={{ transform: `translateY(${pullMoveY}px)` }}
                >
                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main id="kingdom-main-content" className="min-w-0">

                    <section data-testid="kingdom-hero" className="relative px-1 pb-2 pt-1 sm:px-2">
                        <div className="relative flex items-center justify-between gap-4">
                            <div className="max-w-xl">
                                <h1 className="font-serif text-4xl font-black tracking-[-0.035em] text-[#2b1937] dark:text-[#f3e7f5] sm:text-5xl">Reino</h1>
                                <p className="mt-1 text-sm font-medium text-[#886f89] dark:text-[#bb9fba] sm:text-base">Fé compartilhada. Vínculos que continuam.</p>
                            </div>
                        </div>
                    </section>

                    <section data-testid="kingdom-composer-shortcut" aria-label="Criar publicação" className="relative mb-5 mt-5 rounded-[1.35rem] border border-fuchsia-300/60 bg-white p-3 shadow-[0_10px_35px_rgba(86,37,111,0.08)] after:absolute after:-bottom-3 after:right-8 after:h-6 after:w-6 after:rotate-45 after:border-b after:border-r after:border-fuchsia-300/60 after:bg-white dark:border-fuchsia-400/35 dark:bg-[#1a1520] dark:after:border-fuchsia-400/35 dark:after:bg-[#1a1520] sm:p-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-fuchsia-400/60 bg-fuchsia-500/5 text-fuchsia-700 dark:text-fuchsia-300 sm:hidden"><PenLine size={22} aria-hidden="true" /></span>
                            {userProfile?.photoURL ? (
                                <img src={userProfile.photoURL} alt={displayName} className="hidden h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-[var(--module-border)] sm:block" />
                            ) : (
                                <span className="module-icon hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-black sm:flex">{displayName.slice(0, 2).toUpperCase()}</span>
                            )}
                            <button type="button" onClick={() => handleActionClick('write')} className="module-focus flex min-h-12 min-w-0 flex-1 items-center rounded-xl px-2 text-left text-base font-medium text-gray-500 transition hover:text-fuchsia-800 dark:text-gray-300 dark:hover:text-fuchsia-200">
                                Abrir uma partilha
                            </button>
                        </div>
                        <div className="mt-2 hidden grid-cols-3 gap-2 border-t border-[#eee8e0] pt-3 dark:border-white/10 sm:grid">
                            <button type="button" onClick={() => handleActionClick('write')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-[#4c2a72] transition hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:text-violet-300 dark:hover:bg-violet-500/10"><PenLine size={16} /><span className="hidden sm:inline">Reflexão</span><span className="sm:hidden">Publicar</span></button>
                            <button type="button" onClick={() => handleActionClick('checkin')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10"><MapPin size={16} /> Check-in</button>
                            <button type="button" onClick={() => handleActionClick('image')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-fuchsia-700 transition hover:bg-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-600 dark:text-fuchsia-300 dark:hover:bg-fuchsia-500/10"><ImageIcon size={16} /><span className="hidden sm:inline">Criar arte</span><span className="sm:hidden">Arte</span></button>
                        </div>
                    </section>

                    <nav data-testid="kingdom-mobile-context-nav" aria-label="Áreas do Reino" className="relative mb-5 grid grid-cols-3 divide-x divide-fuchsia-300/20 rounded-2xl border border-fuchsia-300/35 bg-white/90 p-1 shadow-[0_8px_28px_rgba(86,37,111,0.08)] dark:bg-[#17131d] sm:hidden">
                        <button type="button" aria-pressed={activeFilter === 'all'} onClick={() => setActiveFilter('all')} className={`module-focus relative flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold ${activeFilter === 'all' ? 'text-fuchsia-800 dark:text-fuchsia-200' : 'text-gray-500 dark:text-gray-400'}`}><Bookmark size={17} aria-hidden="true" />Comunidade{activeFilter === 'all' ? <span aria-hidden="true" className="absolute -bottom-1 h-0.5 w-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400" /> : null}</button>
                        <button type="button" aria-pressed={activeFilter === 'church'} onClick={() => setActiveFilter('church')} className={`module-focus relative flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold ${activeFilter === 'church' ? 'text-fuchsia-800 dark:text-fuchsia-200' : 'text-gray-500 dark:text-gray-400'}`}><Church size={17} aria-hidden="true" />Minha igreja{activeFilter === 'church' ? <span aria-hidden="true" className="absolute -bottom-1 h-0.5 w-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400" /> : null}</button>
                        <Link href="/social/oracao" className="module-focus flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold text-gray-500 dark:text-gray-400"><HandHeart size={17} aria-hidden="true" />Orações</Link>
                    </nav>

                    <KingdomPulse posts={filteredPosts} />

                    <KingdomPathRailV2 variant="mobile" data={pathData} isLoading={isPathLoading} churchHref={churchHref} hasChurch={Boolean(userProfile?.churchData)} savedPostsCount={savedCount} onShowSaved={() => setActiveFilter('saved')} />

                    <div className="mb-4 hidden overflow-x-auto no-scrollbar sm:block" role="tablist" aria-label="Filtrar publicações do Reino">
                        <div className="inline-flex min-w-full gap-1 rounded-2xl border border-[#e4ded5] bg-white p-1 dark:border-white/10 dark:bg-[#151515] sm:min-w-0">
                            {([
                                ['all', 'Para você'],
                                ['following', 'Seguindo'],
                                ['church', 'Minha igreja'],
                                ['groups', 'Grupos'],
                            ] as const).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeFilter === value}
                                    onClick={() => setActiveFilter(value)}
                                    className={`min-h-11 flex-1 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${activeFilter === value ? 'bg-[#5b2a86] text-white shadow-sm' : 'text-gray-600 hover:bg-violet-50 dark:text-gray-300 dark:hover:bg-white/5'}`}
                                >
                                    {label}
                                </button>
                            ))}
                            {activeFilter === 'saved' && (
                                <button type="button" role="tab" aria-selected="true" onClick={() => setActiveFilter('saved')} className="min-h-11 flex-1 whitespace-nowrap rounded-xl bg-[#5b2a86] px-4 text-sm font-semibold text-white shadow-sm">Salvos</button>
                            )}
                        </div>
                    </div>

                    <div className="mb-4 flex items-end justify-between gap-4 px-1">
                        <div>
                            <span className="mb-2 block h-0.5 w-16 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600" />
                            <h2 className="font-serif text-2xl font-black text-[#302037] dark:text-[#f2e8f3]">Agora na sua comunidade</h2>
                        </div>
                        <Link href="/social/explore" className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-white/5 sm:inline-flex"><Search size={16} /> Explorar</Link>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-5 rounded-[1.5rem] border border-[#e4ded5] bg-white py-24 dark:border-white/10 dark:bg-[#151515]">
                            <div className="h-11 w-11 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700 dark:border-emerald-500/10 dark:border-t-emerald-400" />
                            <p className="animate-pulse text-[10px] font-black uppercase tracking-[0.25em] text-emerald-800 dark:text-emerald-300">Preparando o Reino...</p>
                        </div>
                    ) : error ? (
                        <div role="alert" className="flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-red-100 bg-white px-8 py-20 text-center dark:border-red-500/20 dark:bg-[#151515]">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"><AlertCircle size={24} /></span>
                            <p className="max-w-sm text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">{error}</p>
                            <button type="button" onClick={() => loadFeed()} className="inline-flex min-h-11 items-center rounded-xl bg-[#082f2b] px-5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Tentar novamente</button>
                        </div>
                    ) : mixedFeed.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-violet-200 bg-white px-6 py-16 text-center dark:border-violet-500/20 dark:bg-[#151515]">
                            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><Users size={22} /></span>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nada por aqui neste filtro</h2>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">Escolha outro filtro ou inicie uma partilha que fortaleça a comunidade.</p>
                            <button type="button" onClick={() => handleActionClick('write')} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#5b2a86] px-5 text-sm font-bold text-white"><PenLine size={16} /> Criar publicação</button>
                        </div>
                    ) : (
                        mixedFeed.map((item) => {
                            if (item.type === 'feature') {
                                return <FeatureCard key={item.id} type={item.featureType} />;
                            }

                            if (item.type === 'meditation') {
                                return (
                                    <article key={item.id} className="relative my-4 overflow-hidden rounded-[1.5rem] border border-emerald-900/10 bg-gradient-to-br from-[#f1f8f3] to-white px-6 py-9 text-center shadow-[0_8px_30px_rgba(30,41,35,0.04)] animate-in fade-in dark:border-emerald-400/10 dark:from-emerald-950/30 dark:to-[#151515]">
                                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(circle, #087052 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                        <Quote size={22} className="relative mx-auto mb-5 text-emerald-700/35 dark:text-emerald-300/35" />
                                        <p className="relative px-2 font-serif text-xl italic leading-relaxed text-slate-700 dark:text-slate-200 sm:text-2xl">“{item.verse.text}”</p>
                                        <span className="relative mt-5 inline-block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-800 dark:text-emerald-300">{item.verse.ref}</span>
                                    </article>
                                );
                            }

                            return (
                                <div key={item.id} className="relative pl-10 before:absolute before:bottom-[-1rem] before:left-[1.1rem] before:top-0 before:block before:w-px before:bg-gradient-to-b before:from-violet-500 before:via-fuchsia-500 before:to-orange-400">
                                <Link href={`/u/${(item as Post).userUsername}`} aria-label={`Abrir perfil de ${(item as Post).userDisplayName}`} className="absolute left-0 top-5 z-20 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#0b0b0c] bg-[#241a2b] text-[9px] font-black text-white ring-2 ring-fuchsia-500/60 md:hidden">{(item as Post).userPhotoURL ? <img src={(item as Post).userPhotoURL} alt="" className="h-full w-full object-cover" /> : (item as Post).userDisplayName?.slice(0, 2).toUpperCase()}</Link>
                                <span aria-hidden="true" className="absolute left-[0.78rem] top-8 z-10 hidden h-3 w-3 rounded-full border-2 border-[#fdfbf7] bg-fuchsia-500 shadow-[0_0_0_3px_rgba(192,38,211,0.15)] dark:border-[#0b0b0c] md:block" />
                                <FeedPostCard
                                    post={item as Post}
                                    currentUser={currentUser}
                                    onInteraction={handleInteraction}
                                    onEdit={setPostToEdit}
                                    onDelete={setPostToDelete}
                                    onHide={handleHidePost}
                                    onReport={(post) => currentUser ? setPostToReport(post) : openLogin()}
                                    showNotification={showNotification}
                                />
                                </div>
                            );
                        })
                    )}
                    </main>
                    <KingdomPathRailV2 data={pathData} isLoading={isPathLoading} churchHref={churchHref} hasChurch={Boolean(userProfile?.churchData)} savedPostsCount={savedCount} onShowSaved={() => setActiveFilter('saved')} />
                    </div>
                </div>
            </div>

            <div className="hidden" aria-hidden="true">
                {isPlusMenuOpen && (
                    <div id="kingdom-mobile-actions" className="flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-2">
                                <span className="rounded-lg border border-[#e4ded5] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-xl dark:border-white/10 dark:bg-[#1a1a1c] dark:text-white">Escrever</span>
                                <button type="button" aria-label="Escrever publicação" onClick={() => handleActionClick('write')} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-100 bg-white text-violet-700 shadow-2xl transition-all active:scale-95 dark:border-violet-500/20 dark:bg-[#1a1a1c] dark:text-violet-300"><PenLine size={21} /></button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-lg border border-[#e4ded5] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-xl dark:border-white/10 dark:bg-[#1a1a1c] dark:text-white">Check-in</span>
                                <button type="button" aria-label="Criar check-in" onClick={() => handleActionClick('checkin')} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-2xl transition-all active:scale-95 dark:border-emerald-500/20 dark:bg-[#1a1a1c] dark:text-emerald-300"><MapPin size={21} /></button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-lg border border-[#e4ded5] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-xl dark:border-white/10 dark:bg-[#1a1a1c] dark:text-white">Criar arte</span>
                                <button type="button" aria-label="Criar arte" onClick={() => handleActionClick('image')} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-100 bg-white text-fuchsia-700 shadow-2xl transition-all active:scale-95 dark:border-fuchsia-500/20 dark:bg-[#1a1a1c] dark:text-fuchsia-300"><ImageIcon size={21} /></button>
                            </div>
                    </div>
                )}

                <button
                    type="button"
                    aria-label={isPlusMenuOpen ? 'Fechar ações de publicação' : 'Abrir ações de publicação'}
                    aria-expanded={isPlusMenuOpen}
                    aria-controls="kingdom-mobile-actions"
                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#087052] text-white shadow-xl transition-all active:scale-95 dark:border-[#0b0b0c] ${isPlusMenuOpen ? 'rotate-45' : ''}`}
                >
                    {isPlusMenuOpen ? <X size={28} /> : <Plus size={28} />}
                </button>
            </div>

            <KingdomComposer
                isOpen={isKingdomComposerOpen}
                onClose={() => { setIsKingdomComposerOpen(false); setComposerProps({}); }}
                onPostSuccess={onPostSuccess}
                prefilledImage={composerProps.image}
                prefilledCaption={composerProps.caption}
                initialTab={composerProps.initialTab}
            />

            <PromptModal
                isOpen={!!postToEdit}
                onClose={() => setPostToEdit(null)}
                onConfirm={async (newContent) => {
                    await dbService.updatePost(postToEdit!.id, { content: newContent });
                    loadFeed();
                }}
                title="Editar Reflexão"
                label="Legenda"
                defaultValue={postToEdit?.content}
            />

            <ConfirmationModal
                isOpen={!!postToDelete}
                onClose={() => setPostToDelete(null)}
                onConfirm={async () => {
                    await dbService.deletePost(postToDelete!);
                    setPosts(prev => prev.filter(p => p.id !== postToDelete));
                    showNotification("Post removido.", "info");
                }}
                title="Remover Post"
                message="Deseja apagar esta postagem permanentemente?"
                confirmText="Remover"
                variant="danger"
            />

            <PostCommentsSheet
                isOpen={!!commentsPost}
                post={commentsPost}
                currentUser={currentUser}
                userProfile={userProfile || null}
                onClose={() => setCommentsPost(null)}
                onCommentAdded={handleCommentAdded}
                showNotification={showNotification}
                recordActivity={recordActivity}
            />

            {postToReport && (
                <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 p-4 md:items-center" role="dialog" aria-modal="true" aria-labelledby="report-post-title">
                    <div className="w-full max-w-md rounded-[1.5rem] bg-white p-5 shadow-2xl dark:bg-[#18181b]">
                        <h2 id="report-post-title" className="text-lg font-bold text-gray-900 dark:text-white">Por que deseja denunciar?</h2>
                        <p className="mt-1 text-sm text-gray-500">A publicação será enviada para análise e permanecerá oculta para você.</p>
                        <div className="mt-4 grid gap-2">
                            {([['spam', 'Spam ou conteúdo repetitivo'], ['abuse', 'Abuso ou assédio'], ['misinformation', 'Informação enganosa'], ['privacy', 'Exposição de privacidade'], ['other', 'Outro motivo']] as const).map(([reason, label]) => <button key={reason} type="button" onClick={async () => { const target = postToReport; setPostToReport(null); try { await postInteractionService.report(target.id, currentUser!.uid, reason); await handleHidePost(target.id); showNotification('Denúncia enviada para análise.', 'success'); } catch { showNotification('Não foi possível enviar a denúncia.', 'error'); } }} className="min-h-11 rounded-xl border border-gray-200 px-4 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">{label}</button>)}
                        </div>
                        <button type="button" onClick={() => setPostToReport(null)} className="mt-3 min-h-11 w-full rounded-xl text-sm font-bold text-gray-500">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialFeedPage;
