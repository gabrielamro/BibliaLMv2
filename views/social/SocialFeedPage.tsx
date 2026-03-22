"use client";
import { useNavigate, useLocation, useSearchParams } from '../../utils/router';


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, Plus, Zap, Heart, Sparkles, Quote, Users, PenLine, ImageIcon, Mic2, X, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatures, FeatureGuard } from '../../contexts/FeatureContext';
import { useHeader } from '../../contexts/HeaderContext';

import { dbService } from '../../services/supabase';
import { Post } from '../../types';
import { getMockPosts } from '../../data/mockFeedData';
import SEO from '../../components/SEO';
import SocialNavigation from '../../components/SocialNavigation';
import { generateShareLink } from '../../utils/shareUtils';
import ConfirmationModal from '../../components/ConfirmationModal';
import PromptModal from '../../components/PromptModal';
import { FeedPostCard } from '../../components/social/FeedPostCard';
import KingdomComposer from '../../components/social/KingdomComposer';
import FeatureCard, { FeatureCardType } from '../../components/social/FeatureCard';
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

const FeatureDisabled = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black animate-in fade-in">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="text-gray-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Em Breve</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            Estamos preparando algo especial para o Reino. Esta funcionalidade estará disponível em breve.
        </p>
    </div>
);

const SocialFeedPage: React.FC = () => {
    const { currentUser, userProfile, openLogin, showNotification } = useAuth();
    const { isFeatureEnabled } = useFeatures();
    const { setIsHeaderHidden } = useHeader();
    const navigate = useNavigate();
    const location = useLocation();

    if (!isFeatureEnabled('module_social')) {
        return <FeatureDisabled />;
    }

    const [posts, setPosts] = useState<Post[]>([]);
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

    // State for prefilled content from other pages (e.g. Creative Studio)
    const [composerProps, setComposerProps] = useState<{ image?: string | null, caption?: string, initialTab?: 'reflection' | 'checkin' }>({});

    // Handle navigation state (e.g. coming from Studio with an image)
    useEffect(() => {
        const state = location.state as any;
        if (state?.openCreate) {
            setComposerProps({
                image: state.prefilledImage,
                caption: state.prefilledCaption
            });
            setIsKingdomComposerOpen(true);
            // Clear state to avoid reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const loadFeed = async (isPull = false) => {
        if (!isPull) setIsLoading(true);
        setError(null);
        try {
            const fetchedPosts = await dbService.getGlobalFeed(50);
            if (fetchedPosts && fetchedPosts.length > 0) {
                setPosts(fetchedPosts);
            } else {
                setPosts(getMockPosts());
            }
        } catch (e: any) {
            console.warn("Feed Error - usando dados mock:", e?.message);
            setPosts(getMockPosts());
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

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
    }, []);

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
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    const newLikes = isLiked ? (p.likesCount - 1) : (p.likesCount + 1);
                    const newLikedBy = isLiked ? p.likedBy.filter(uid => uid !== currentUser.uid) : [...(p.likedBy || []), currentUser.uid];
                    return { ...p, likesCount: newLikes, likedBy: newLikedBy };
                }
                return p;
            }));
            await dbService.togglePostLike(postId, currentUser.uid, !!isLiked);
        } else if (type === 'share') {
            const shareUrl = generateShareLink('post', { postId });
            if (navigator.share) {
                await navigator.share({ title: 'BíbliaLM', url: shareUrl });
            } else {
                navigator.clipboard.writeText(shareUrl);
                showNotification("Link copiado!", "success");
            }
        } else if (type === 'comment') {
            navigate(`/p/${postId}`);
        }
    };

    const handleActionClick = (action: 'write' | 'image' | 'podcast' | 'checkin') => {
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
                navigate('/estudio-criativo', { state: { tool: 'image' } });
                break;
            case 'podcast':
                navigate('/estudio-criativo', { state: { tool: 'podcast' } });
                break;
        }
    };

    const onPostSuccess = () => {
        setIsKingdomComposerOpen(false);
        setComposerProps({});
        // Delay maior para garantir que o Firestore processou a escrita e o índice
        setTimeout(() => loadFeed(), 1000);
    };

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

        posts.forEach((post, idx) => {
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
    }, [posts]);

    return (
        <div
            ref={containerRef}
            className="h-full overflow-hidden bg-white dark:bg-black flex flex-col"
        >
            <SEO title="Reino" />

            <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none">
                <div
                    className="h-full bg-bible-gold shadow-[0_0_10px_rgba(197,160,89,0.8)] transition-all duration-300 ease-out"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            <SocialNavigation activeTab="feed" />

            <div
                data-testid="feed-container"
                className="flex-1 overflow-y-auto no-scrollbar relative scroll-smooth"
                onScroll={handleScroll}
                onTouchStart={e => { if (containerRef.current?.scrollTop === 0) setPullStartY(e.touches[0].clientY); }}
                onTouchMove={e => { if (pullStartY > 0 && !isRefreshing) setPullMoveY(Math.min((e.touches[0].clientY - pullStartY) * 0.5, 100)); }}
                onTouchEnd={() => { if (pullMoveY > 60) { setIsRefreshing(true); loadFeed(true); } setPullMoveY(0); setPullStartY(0); }}
            >
                {/* Pull to Refresh Indicator */}
                <div className="absolute left-0 right-0 flex justify-center pointer-events-none transition-transform duration-200 z-10" style={{ top: '15px', transform: `translateY(${pullMoveY > 0 ? pullMoveY - 40 : -100}px)` }}>
                    <div className="bg-bible-gold text-white p-2.5 rounded-full shadow-xl">
                        <Loader2 className="animate-spin" size={20} />
                    </div>
                </div>

                <div className="max-w-xl mx-auto pb-24 transition-transform duration-200 w-full" style={{ transform: `translateY(${pullMoveY}px)` }}>

                    <div className="px-6 pt-6 pb-2">
                        <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                <Users size={12} className="inline mr-1" /> O Reino está em movimento
                            </span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 space-y-6">
                            <div className="w-12 h-12 border-4 border-bible-gold/10 border-t-bible-gold rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em] animate-pulse">Sintonizando o Reino...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-40 px-8 text-center space-y-4">
                            <AlertCircle size={48} className="text-red-500 opacity-50" />
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">{error}</p>
                            <button onClick={() => loadFeed()} className="text-xs font-black uppercase text-bible-gold tracking-widest hover:underline">Tentar Recarregar</button>
                        </div>
                    ) : (
                        mixedFeed.map((item) => {
                            if (item.type === 'feature') {
                                return <FeatureCard key={item.id} type={item.featureType} />;
                            }

                            if (item.type === 'meditation') {
                                return (
                                    <div key={item.id} className="px-6 py-12 my-4 bg-gradient-to-br from-gray-50 to-white dark:from-bible-darkPaper dark:to-black text-center border-y border-gray-50 dark:border-gray-900 relative overflow-hidden animate-in fade-in">
                                        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #c5a059 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                        <Quote size={24} className="mx-auto text-bible-gold/20 mb-6" />
                                        <p className="font-serif italic text-2xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6 px-4">
                                            "{item.verse.text}"
                                        </p>
                                        <span className="text-[10px] font-black text-bible-gold uppercase tracking-[0.3em]">
                                            {item.verse.ref}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <FeedPostCard
                                    key={item.id}
                                    post={item as Post}
                                    currentUser={currentUser}
                                    onInteraction={handleInteraction}
                                    onEdit={setPostToEdit}
                                    onDelete={setPostToDelete}
                                    showNotification={showNotification}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            <div className="fixed bottom-20 right-6 z-[110] flex flex-col items-center gap-4">
                {isPlusMenuOpen && (
                    <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex flex-col items-end gap-3 pr-2">
                            <div className="flex items-center gap-3 group">
                                <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">Escrever</span>
                                <button onClick={() => handleActionClick('write')} className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 text-bible-gold shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-gray-100 dark:border-gray-700"><PenLine size={22} /></button>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">Check-in</span>
                                <button onClick={() => handleActionClick('checkin')} className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 text-green-500 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-gray-100 dark:border-gray-700"><MapPin size={22} /></button>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">Criar Arte</span>
                                <button onClick={() => handleActionClick('image')} className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 text-pink-50 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-gray-100 dark:border-gray-700"><ImageIcon size={22} /></button>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">Podcast</span>
                                <button onClick={() => handleActionClick('podcast')} className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 text-purple-500 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-gray-100 dark:border-gray-700"><Mic2 size={22} /></button>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                    className={`w-14 h-14 rounded-full bg-bible-leather dark:bg-bible-gold text-white dark:text-black shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-black ${isPlusMenuOpen ? 'rotate-45' : ''}`}
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
        </div>
    );
};

export default SocialFeedPage;
