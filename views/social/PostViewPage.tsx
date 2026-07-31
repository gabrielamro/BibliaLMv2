"use client";

import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { useNavigate, useParams } from '../../utils/router';
import { dbService } from '../../services/supabase';
import { postInteractionService } from '../../services/postInteractionService';
import { Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/SEO';
import SocialNavigation from '../../components/SocialNavigation';
import { FeedPostCard } from '../../components/social/FeedPostCard';
import PostCommentsSheet from '../../components/social/PostCommentsSheet';
import { generateShareLink } from '../../utils/shareUtils';

const PostViewPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile, openLogin, showNotification, recordActivity } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const loadPost = async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const found = await dbService.getPost(postId, userProfile);
      setPost(found);
      if (found) {
        void dbService.incrementMetric('posts', postId, 'views').then((viewsCount) => {
          if (viewsCount !== null) setPost(current => current ? { ...current, viewsCount } : current);
        });
      }
    } catch {
      setError('Não foi possível abrir esta publicação agora.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPost(); }, [postId, userProfile?.uid]);

  const handleInteraction = async (id: string, type: 'like' | 'comment' | 'share' | 'save') => {
    if (!post) return;
    if (type === 'share') {
      const url = generateShareLink('post', { postId: id });
      if (navigator.share) await navigator.share({ title: 'Culto+', url });
      else { await navigator.clipboard.writeText(url); showNotification('Link copiado!', 'success'); }
      return;
    }
    if (!currentUser) { openLogin(); return; }
    if (type === 'comment') { setCommentsOpen(true); return; }
    const previous = post;
    try {
      if (type === 'like') {
        const desired = !post.likedBy?.includes(currentUser.uid);
        setPost({ ...post, likedBy: desired ? [...(post.likedBy || []), currentUser.uid] : (post.likedBy || []).filter(uid => uid !== currentUser.uid), likesCount: Math.max(0, post.likesCount + (desired ? 1 : -1)) });
        setPost(await postInteractionService.setLiked(post, currentUser.uid, desired));
      } else {
        setPost({ ...post, saved: !post.saved });
        setPost(await postInteractionService.setSaved(post, !post.saved));
      }
    } catch {
      setPost(previous);
      showNotification('A alteração não pôde ser sincronizada.', 'error');
    }
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/social');
  };

  return (
    <div data-module="kingdom" className="flex h-full min-h-0 flex-col bg-[#fdfbf7] dark:bg-[#0b0b0c]">
      <SEO title={post ? `${post.userDisplayName} no Reino` : 'Publicação | Culto+'} description={post?.content?.slice(0, 150)} image={post?.imageUrl} />
      <SocialNavigation activeTab="feed" />
      <main id="post-main-content" className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6">
        <div className="mx-auto w-full max-w-[720px]">
          <button type="button" onClick={goBack} className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition hover:bg-white dark:text-gray-300 dark:hover:bg-white/5"><ArrowLeft size={18} /> Voltar</button>
          {loading ? (
            <div className="space-y-4" aria-label="Carregando publicação"><div className="h-32 animate-pulse rounded-[1.5rem] bg-gray-200 dark:bg-white/10" /><div className="h-72 animate-pulse rounded-[1.5rem] bg-gray-200 dark:bg-white/10" /></div>
          ) : error ? (
            <div role="alert" className="rounded-[1.5rem] border border-red-200 bg-white p-8 text-center dark:border-red-500/20 dark:bg-[#151515]"><AlertCircle className="mx-auto text-red-600" /><p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{error}</p><button type="button" onClick={() => void loadPost()} className="mt-4 min-h-11 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white">Tentar novamente</button></div>
          ) : !post ? (
            <div className="rounded-[1.5rem] border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#151515]"><h1 className="text-xl font-bold text-gray-900 dark:text-white">Publicação indisponível</h1><p className="mt-2 text-sm text-gray-500">Ela pode ter sido removida, ser privada ou não estar disponível para sua conta.</p><button type="button" onClick={() => navigate('/social')} className="mt-5 min-h-11 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white">Voltar ao Reino</button></div>
          ) : (
            <>
              <FeedPostCard post={post} currentUser={currentUser} onInteraction={handleInteraction} onEdit={undefined} onDelete={undefined} showNotification={showNotification} />
              <button type="button" onClick={() => currentUser ? setCommentsOpen(true) : openLogin()} className="mb-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white text-sm font-bold text-violet-800 dark:border-violet-500/20 dark:bg-[#151515] dark:text-violet-200"><MessageCircle size={18} /> Abrir conversa ({post.commentsCount || 0})</button>
            </>
          )}
        </div>
      </main>
      <PostCommentsSheet isOpen={commentsOpen} post={post} currentUser={currentUser} userProfile={userProfile || null} onClose={() => setCommentsOpen(false)} onCommentAdded={() => setPost(current => current ? { ...current, commentsCount: current.commentsCount + 1 } : current)} onCommentRemoved={() => setPost(current => current ? { ...current, commentsCount: Math.max(0, current.commentsCount - 1) } : current)} showNotification={showNotification} recordActivity={recordActivity} />
    </div>
  );
};

export default PostViewPage;
