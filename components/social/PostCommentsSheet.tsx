import React, { useEffect, useState } from 'react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import { Post, PostComment, UserProfile } from '../../types';
import { dbService } from '../../services/supabase';

interface PostCommentsSheetProps {
  isOpen: boolean;
  post: Post | null;
  currentUser: any;
  userProfile: UserProfile | null;
  onClose: () => void;
  onCommentAdded?: (postId: string) => void;
  showNotification: (message: string, type: any) => void;
}

const QUICK_EMOJIS = ['❤️', '🙏', '🔥', '😂', '😢'];

const formatTime = (createdAt: string) => {
  try {
    return new Date(createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

const PostCommentsSheet: React.FC<PostCommentsSheetProps> = ({
  isOpen,
  post,
  currentUser,
  userProfile,
  onClose,
  onCommentAdded,
  showNotification,
}) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const loadComments = async () => {
      if (!isOpen || !post?.id) return;
      setIsLoading(true);
      try {
        const data = await dbService.getPostComments(post.id);
        setComments(data);
      } catch (error) {
        console.error(error);
        showNotification('Não foi possível carregar comentários.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadComments();
  }, [isOpen, post?.id, showNotification]);

  if (!isOpen || !post) return null;

  const submitComment = async (content: string) => {
    const text = content.trim();
    if (!text || !currentUser?.uid || !post?.id || isSending) return;

    setIsSending(true);
    try {
      const newComment = await dbService.addPostComment({
        postId: post.id,
        userId: currentUser.uid,
        userDisplayName: userProfile?.displayName || currentUser.displayName || 'Usuário',
        userPhotoURL: userProfile?.photoURL || currentUser.photoURL || null,
        content: text,
      });
      setComments(prev => [...prev, newComment]);
      setDraft('');
      onCommentAdded?.(post.id);
    } catch (error) {
      console.error(error);
      showNotification('Erro ao enviar comentário.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitComment(draft);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />

      <div
        className="relative w-full max-w-xl h-[82vh] bg-white dark:bg-gray-950 rounded-t-[28px] shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-3 pb-2 px-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Comentários {comments.length > 0 ? `(${comments.length})` : ''}
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-bible-gold" />
            </div>
          ) : comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <MessageCircle size={28} className="mb-2 opacity-60" />
              <p className="text-sm">Nenhum comentário ainda</p>
              <p className="text-xs">Seja o primeiro a comentar.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0">
                  {comment.userPhotoURL ? (
                    <img src={comment.userPhotoURL} alt={comment.userDisplayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                      {getInitials(comment.userDisplayName || 'U')}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl px-3 py-2">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{comment.userDisplayName}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{formatTime(comment.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 p-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-white dark:bg-gray-950 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
          <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => submitComment(emoji)}
                disabled={isSending}
                className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-base shrink-0 disabled:opacity-60"
              >
                {emoji}
              </button>
            ))}
          </div>
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 h-11 px-4 rounded-full bg-gray-100 dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none border border-transparent focus:border-bible-gold"
              maxLength={400}
            />
            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              className="h-11 px-4 rounded-full bg-bible-gold text-white font-bold disabled:opacity-50 flex items-center gap-2"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostCommentsSheet;
