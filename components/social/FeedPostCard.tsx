"use client";


import React, { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, 
  Edit2, Trash2, Quote, MapPin, HandHeart, Sparkles, 
  Smile, Users, Trophy, Headphones, Image as ImageIcon, BookOpen
} from 'lucide-react';
import { Post, MoodType } from '../../types';
import SmartText from '../reader/SmartText';

interface FeedPostCardProps {
  post: Post;
  currentUser: any;
  onInteraction: (postId: string, type: 'like' | 'comment' | 'share' | 'save') => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  showNotification: (msg: string, type: any) => void;
}

const MOOD_EMOJIS: Record<MoodType, string> = {
    'feliz': '😄', 'grato': '🙏', 'paz': '🕊️', 'cansado': '😫', 
    'ansioso': '😰', 'triste': '😢', 'blessed': '😇', 
    'thoughtful': '🤔', 'help': '🆘', 'fire': '🔥'
};

const MOOD_LABELS: Record<MoodType, string> = {
    'feliz': 'Feliz', 'grato': 'Grato', 'paz': 'Em Paz', 'cansado': 'Cansado',
    'ansioso': 'Ansioso', 'triste': 'Triste', 'blessed': 'Abençoado',
    'thoughtful': 'Reflexivo', 'help': 'Preciso de Ajuda', 'fire': 'Fervoroso'
};

const TYPE_IDENTITY: Record<string, { label: string, icon: React.ElementType, color: string, bg: string, border: string }> = {
    prayer: { 
        label: 'Pedido de Oração', 
        icon: HandHeart, 
        color: 'text-indigo-500', 
        bg: 'bg-indigo-50 dark:bg-indigo-900/10', 
        border: 'border-indigo-100 dark:border-indigo-900/30' 
    },
    reflection: { 
        label: 'Sabedoria', 
        icon: Sparkles, 
        color: 'text-amber-600', 
        bg: 'bg-amber-50 dark:bg-amber-900/10', 
        border: 'border-amber-100 dark:border-amber-900/30' 
    },
    feeling: { 
        label: 'Sentimento', 
        icon: Smile, 
        color: 'text-sky-500', 
        bg: 'bg-sky-50 dark:bg-sky-900/10', 
        border: 'border-sky-100 dark:border-sky-900/30' 
    },
    cell_meeting: { 
        label: 'Comunhão', 
        icon: Users, 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50 dark:bg-emerald-900/10', 
        border: 'border-emerald-100 dark:border-emerald-900/30' 
    },
    quiz: { 
        label: 'Conquista', 
        icon: Trophy, 
        color: 'text-orange-500', 
        bg: 'bg-orange-50 dark:bg-orange-900/10', 
        border: 'border-orange-100 dark:border-orange-900/30' 
    },
    podcast: { 
        label: 'Podcast IA', 
        icon: Headphones, 
        color: 'text-pink-500', 
        bg: 'bg-pink-50 dark:bg-pink-900/10', 
        border: 'border-pink-100 dark:border-pink-900/30' 
    },
    image: { 
        label: 'Arte Sacra', 
        icon: ImageIcon, 
        color: 'text-purple-500', 
        bg: 'bg-purple-50 dark:bg-purple-900/10', 
        border: 'border-purple-100 dark:border-purple-900/30' 
    },
    devotional: { 
        label: 'Devocional', 
        icon: BookOpen, 
        color: 'text-blue-500', 
        bg: 'bg-blue-50 dark:bg-blue-900/10', 
        border: 'border-blue-100 dark:border-blue-900/30' 
    },
    default: {
        label: 'Postagem',
        icon: MessageCircle,
        color: 'text-gray-500',
        bg: 'bg-gray-50 dark:bg-gray-900/50',
        border: 'border-gray-100 dark:border-gray-800'
    }
};

const PostMenu = ({ post, onEdit, onDelete }: { post: Post, onEdit?: (p: Post) => void, onDelete?: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }} className="text-gray-300 hover:text-gray-500 p-2 transition-colors"><MoreHorizontal size={20}/></button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95">
                    {onEdit && (
                        <button onClick={() => { onEdit(post); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors">
                            <Edit2 size={14} className="text-bible-gold" /> Editar Legenda
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={() => { onDelete(post.id); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-xs font-bold text-red-500 transition-colors">
                            <Trash2 size={14} /> Excluir Post
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export const FeedPostCard: React.FC<FeedPostCardProps> = ({ post, currentUser, onInteraction, onEdit, onDelete }) => {
    if (!post) return null;

    const isLiked = post.likedBy?.includes(currentUser?.uid || '');
    const isOwner = currentUser?.uid === post.userId;
    
    let postDate = 'Data desconhecida';
    try {
        if (post.createdAt) {
            postDate = new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        }
    } catch (e) { }
    
    const identity = TYPE_IDENTITY[post.type] || TYPE_IDENTITY['default'];
    const IdentityIcon = identity.icon;

    const renderContent = () => {
        if (post.image) {
            return (
                <div className="w-full bg-gray-50 dark:bg-black/20 mt-3 mb-2">
                    <img 
                        src={post.image} 
                        className="w-full h-auto object-cover max-h-[75vh]" 
                        loading="lazy" 
                        alt="Conteúdo espiritual" 
                    />
                    {post.content && (
                        <div className="px-6 py-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                <span className="font-bold mr-2 text-gray-900 dark:text-white">{post.userDisplayName}</span>
                                <SmartText text={post.content} enabled={true} />
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        if (post.type === 'reflection') {
            return (
                <div className="px-6 py-6 relative overflow-hidden">
                    <Quote className={`absolute top-4 left-4 ${identity.color} opacity-10`} size={48} />
                    <div className="text-gray-800 dark:text-gray-100 text-lg md:text-xl leading-relaxed font-serif whitespace-pre-wrap relative z-10 text-center italic">
                        "<SmartText text={post.content} enabled={true} />"
                    </div>
                </div>
            );
        }

        if (post.type === 'prayer') {
            return (
                <div className="px-6 py-4">
                    <div className={`p-5 rounded-2xl ${identity.bg} ${identity.border} border`}>
                        <div className="text-gray-800 dark:text-gray-200 text-base leading-relaxed font-medium whitespace-pre-wrap">
                            <SmartText text={post.content} enabled={true} />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase ${identity.color} bg-white dark:bg-black/20 px-2 py-1 rounded-lg`}>
                                🙏 Interceder
                            </span>
                        </div>
                    </div>
                </div>
            );
        }

        if (post.type === 'feeling') {
            const emoji = post.mood ? MOOD_EMOJIS[post.mood] : '😊';
            const label = post.mood ? MOOD_LABELS[post.mood] : 'bem';
            return (
                <div className="px-6 py-8 text-center flex flex-col items-center">
                    <div className="text-5xl mb-4 animate-in zoom-in duration-500">{emoji}</div>
                    <p className="text-gray-800 dark:text-gray-100 text-lg font-bold">
                        está se sentindo <span className={identity.color}>{label || 'bem'}</span>
                    </p>
                    {post.content && <p className="text-gray-500 text-sm mt-2 max-w-xs">"{post.content}"</p>}
                </div>
            );
        }

        if (post.type === 'quiz') {
            return (
                <div className="px-6 py-4">
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/10 dark:to-yellow-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-800/30 text-center">
                        <Trophy className="mx-auto text-orange-500 mb-2" size={32} />
                        <h3 className="font-bold text-gray-900 dark:text-white">Desafio Completado!</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-4">{post.content}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="px-6 py-4">
                <div className="text-gray-800 dark:text-gray-200 text-base leading-relaxed whitespace-pre-wrap font-sans">
                    <SmartText text={post.content} enabled={true} />
                </div>
            </div>
        );
    };

    return (
        <div data-testid="feed-post" className="bg-white dark:bg-bible-darkPaper md:rounded-3xl border-b md:border border-gray-100 dark:border-gray-800/50 mb-4 md:mb-8 overflow-hidden transition-all duration-500 hover:shadow-lg relative">
            
            <div className={`h-1 w-full opacity-50 ${identity.bg}`}></div>

            <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={`/social/u/${post.userUsername}`} className="shrink-0 relative">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-100 dark:border-gray-800">
                            {post.userPhotoURL ? (
                                <img src={post.userPhotoURL} className="w-full h-full object-cover" alt={post.userDisplayName} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-bible-gold/10 text-bible-gold text-[10px] font-black uppercase">
                                    {post.userDisplayName?.substring(0,2)}
                                </div>
                            )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-bible-darkPaper ${identity.bg} ${identity.color}`}>
                            <IdentityIcon size={10} strokeWidth={3} />
                        </div>
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Link href={`/social/u/${post.userUsername}`} className="text-sm font-bold text-gray-900 dark:text-white leading-none hover:underline">
                                {post.userDisplayName}
                            </Link>
                            {post.type === 'cell_meeting' && <span className="bg-green-100 text-green-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Célula</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
                            <span>{postDate}</span>
                            <span>•</span>
                            <span className={identity.color}>{identity.label}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    {isOwner && <PostMenu post={post} onEdit={onEdit} onDelete={onDelete} />}
                </div>
            </div>

            {renderContent()}

            {post.location && !post.image && (
                <div className="px-6 pb-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <MapPin size={12} className="text-bible-gold" /> {post.location}
                    </div>
                </div>
            )}

            <div className="px-6 py-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => onInteraction(post.id, 'like')} 
                        className={`flex items-center gap-1.5 transition-all active:scale-125 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
                        <span className="text-xs font-black">{post.likesCount || 0}</span>
                    </button>
                    
                    <button 
                        onClick={() => onInteraction(post.id, 'comment')} 
                        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all active:scale-110"
                    >
                        <MessageCircle size={20} />
                        <span className="text-xs font-black">{post.commentsCount || 0}</span>
                    </button>

                    <button 
                        onClick={() => onInteraction(post.id, 'share')} 
                        className="text-gray-400 hover:text-bible-gold transition-all active:scale-110"
                    >
                        <Share2 size={18} />
                    </button>
                </div>

                <button 
                    onClick={() => onInteraction(post.id, 'save')} 
                    className={`transition-colors ${post.saved ? 'text-bible-gold' : 'text-gray-300 hover:text-bible-gold'}`}
                >
                    <Bookmark size={20} fill={post.saved ? "currentColor" : "none"} />
                </button>
            </div>
        </div>
    );
};
