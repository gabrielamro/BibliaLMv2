"use client";


import React, { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, EyeOff, Flag,
  Edit2, Trash2, Quote, MapPin, HandHeart, Sparkles, 
  Smile, Users, Trophy, Headphones, Image as ImageIcon, BookOpen, Church, DoorOpen, Eye, CalendarDays
} from 'lucide-react';
import { Post, MoodType } from '../../types';
import SmartText from '../reader/SmartText';
import { getPostImageSource } from '../../utils/socialPostMedia';
import { normalizeBiblialmInternalUrl } from '../../utils/internalLinks';
import DevotionalFeedCardContent from '../DevotionalFeedCardContent';

interface FeedPostCardProps {
  post: Post;
  currentUser: any;
  onInteraction: (postId: string, type: 'like' | 'comment' | 'share' | 'save') => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onHide?: (postId: string) => void;
  onReport?: (post: Post) => void;
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
    checkin: {
        label: 'Check-in',
        icon: MapPin,
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
        label: 'Pão Diário',
        icon: BookOpen, 
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 dark:bg-emerald-900/10',
        border: 'border-emerald-100 dark:border-emerald-900/30'
    },
    study: {
        label: 'Estudo Premium',
        icon: BookOpen,
        color: 'text-bible-gold',
        bg: 'bg-bible-gold/10',
        border: 'border-bible-gold/30'
    },
    room: {
        label: 'Sala do Reino',
        icon: DoorOpen,
        color: 'text-purple-700 dark:text-violet-300',
        bg: 'bg-purple-50 dark:bg-purple-950/20',
        border: 'border-purple-200 dark:border-purple-800/50'
    },
    default: {
        label: 'Postagem',
        icon: MessageCircle,
        color: 'text-gray-500',
        bg: 'bg-gray-50 dark:bg-gray-900/50',
        border: 'border-gray-100 dark:border-gray-800'
    }
};

const FEED_REASON_LABEL: Record<string, string> = {
    following: 'Seguindo',
    same_church: 'Sua igreja',
    same_group: 'Seu grupo',
    public_discovery: 'Sugerido',
    global_public: 'Publico',
};

const PostMenu = ({ post, isOwner, onEdit, onDelete, onHide, onReport }: { post: Post, isOwner: boolean, onEdit?: (p: Post) => void, onDelete?: (id: string) => void, onHide?: (id: string) => void, onReport?: (post: Post) => void }) => {
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
                    {!isOwner && onHide && <button onClick={() => { onHide(post.id); setIsOpen(false); }} className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"><EyeOff size={14} /> Ocultar publicação</button>}
                    {!isOwner && onReport && <button onClick={() => { onReport(post); setIsOpen(false); }} className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-xs font-bold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"><Flag size={14} /> Denunciar</button>}
                </div>
            )}
        </div>
    );
};

export const FeedPostCard: React.FC<FeedPostCardProps> = ({ post, currentUser, onInteraction, onEdit, onDelete, onHide, onReport }) => {
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
    const postImage = getPostImageSource(post);
    const feedReasonLabel = post.feedReason && !isOwner ? FEED_REASON_LABEL[post.feedReason] : '';

    const renderContent = () => {
        if (post.type === 'devotional' && post.devotionalId && post.devotionalVerse && post.devotionalReference) {
            return (
                <div className="px-4 pb-5 sm:px-5">
                    <DevotionalFeedCardContent
                        title={post.devotionalTitle || post.title || 'Pão Diário'}
                        verseText={post.devotionalVerse}
                        verseReference={post.devotionalReference}
                        message={post.content}
                        href={normalizeBiblialmInternalUrl(post.devotionalUrl) || '/devocional'}
                    />
                </div>
            );
        }

        if (post.type === 'study' || post.type === 'room') {
            const isRoomShare = post.type === 'room';
            const cover = post.studyCoverUrl || postImage;
            const href = normalizeBiblialmInternalUrl(post.studyUrl) || (post.studyId ? (isRoomShare ? `/jornada/${post.studyId}` : `/v/${post.studyId}`) : '#');
            const shellClass = isRoomShare
                ? 'border-purple-300/60 bg-gradient-to-br from-[#2b174f] via-purple-800 to-violet-600 shadow-purple-900/20'
                : 'border-bible-gold/30 bg-gradient-to-br from-[#1f1710] via-[#2c2117] to-black shadow-bible-gold/10';
            const chipClass = isRoomShare
                ? 'border-purple-200/40 bg-white/10 text-violet-100'
                : 'border-bible-gold/30 bg-black/50 text-bible-gold';
            const sourceClass = isRoomShare ? 'text-violet-100/90' : 'text-bible-gold/90';
            const ctaClass = isRoomShare ? 'bg-white text-purple-900' : 'bg-bible-gold text-black';
            return (
                <div className="px-4 pb-5">
                    <Link
                        href={href}
                        className={`block overflow-hidden rounded-[1.75rem] border shadow-2xl transition-transform hover:scale-[1.01] active:scale-[0.99] ${shellClass}`}
                    >
                        <div className="relative h-56 bg-black">
                            {cover ? (
                                <img
                                    src={cover}
                                    className="h-full w-full object-cover opacity-80 transition-transform duration-700 hover:scale-105"
                                    loading="lazy"
                                    alt={post.studyTitle || (isRoomShare ? 'Capa da sala' : 'Capa do estudo')}
                                />
                            ) : (
                                <div className={`h-full w-full flex items-center justify-center ${isRoomShare ? 'bg-purple-950/40' : 'bg-bible-gold/10'}`}>
                                    {isRoomShare ? <DoorOpen className="text-violet-100/50" size={52} /> : <BookOpen className="text-bible-gold/40" size={52} />}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                            <div className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] backdrop-blur-md ${chipClass}`}>
                                {isRoomShare ? <DoorOpen size={12} /> : <Sparkles size={12} />} {isRoomShare ? 'Sala publicada' : 'Estudo em destaque'}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                <p className={`mb-2 text-[10px] font-black uppercase tracking-[0.24em] ${sourceClass}`}>
                                    {post.studySourceLabel || (isRoomShare ? 'Sala do Reino' : 'Estudo')}
                                </p>
                                <h3 className="font-serif text-2xl font-black leading-tight text-white line-clamp-2">
                                    {post.studyTitle || (isRoomShare ? 'Sala compartilhada' : 'Estudo compartilhado')}
                                </h3>
                            </div>
                        </div>
                        <div className="space-y-4 p-5">
                            {post.content && (
                                <p className="text-sm font-medium leading-relaxed text-amber-50/85">
                                    <SmartText text={post.content} enabled={true} />
                                </p>
                            )}
                            <div className="flex items-center justify-between border-t border-white/10 pt-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">{isRoomShare ? 'Comunidade de ensino' : 'Biblioteca do Reino'}</span>
                                <span className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest ${ctaClass}`}>
                                    {isRoomShare ? 'Entrar na sala' : 'Abrir estudo'}
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            );
        }

        if (postImage) {
            return (
                <div className="w-full bg-gray-50 dark:bg-black/20 mt-3 mb-2">
                    <img 
                        src={postImage}
                        className="w-full h-auto object-cover max-h-[75vh]" 
                        loading="lazy" 
                        alt={typeof post.metadata?.imageAlt === 'string' && post.metadata.imageAlt.trim() ? post.metadata.imageAlt : `Publicação de ${post.userDisplayName}`}
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
            const score = typeof post.metadata?.score === 'number' ? post.metadata.score : null;
            const xp = typeof post.metadata?.xp === 'number' ? post.metadata.xp : null;
            const topic = typeof post.metadata?.topic === 'string' ? post.metadata.topic : null;
            return (
                <div className="px-6 py-4">
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/10 dark:to-yellow-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-800/30 text-center">
                        <Trophy className="mx-auto text-orange-500 mb-2" size={32} />
                        <h3 className="font-bold text-gray-900 dark:text-white">Desafio Completado!</h3>
                        {topic && <p className="mt-1 text-xs font-black uppercase tracking-widest text-orange-600">{topic}</p>}
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-4">{post.content}</p>
                        {(score !== null || xp !== null) && (
                            <div className="mx-auto flex max-w-xs justify-center gap-2">
                                {score !== null && <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700 shadow-sm dark:bg-black/20">{score} pontos</span>}
                                {xp !== null && <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700 shadow-sm dark:bg-black/20">+{xp} Maná</span>}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (post.type === 'checkin') {
            const place = post.metadata?.place as { name?: string; address?: string } | undefined;
            return (
                <div className="px-6 py-4">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                        <div className="mb-3 flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white"><MapPin size={19} /></span>
                            <div>
                                <p className="font-black text-emerald-950 dark:text-emerald-100">{place?.name || post.location || 'Check-in'}</p>
                                {place?.address && <p className="text-xs text-emerald-700 dark:text-emerald-300">{place.address}</p>}
                            </div>
                        </div>
                        {post.content && <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200"><SmartText text={post.content} enabled={true} /></p>}
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
        <article data-testid="feed-post" data-post-id={post.id} className={`group/card relative mb-4 rounded-[1.35rem] border bg-white shadow-[0_10px_35px_rgba(56,35,64,0.06)] transition-all duration-300 after:absolute after:-bottom-2.5 after:right-8 after:h-5 after:w-5 after:rotate-45 after:border-b after:border-r after:bg-white hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(56,35,64,0.11)] dark:bg-[#1a1620] dark:after:bg-[#1a1620] ${post.destination === 'church' ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/50 via-white to-white ring-1 ring-emerald-500/10 after:border-emerald-300 dark:border-emerald-700 dark:from-emerald-900/15 dark:via-[#1a1620] dark:to-[#1a1620] dark:after:border-emerald-700' : 'border-[#dfd3df] after:border-[#dfd3df] dark:border-fuchsia-300/15 dark:after:border-fuchsia-300/15'}`}>
            
            {post.destination === 'church' && (
                <>
                    <div className="absolute top-0 right-0 p-2 z-10">
                        <div className="bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-2xl rounded-tr-xl flex items-center gap-1.5 shadow-xl border border-white/30 animate-pulse">
                            <Church size={10} fill="currentColor" /> Oficial
                        </div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-10">
                        <Church size={300} className="absolute -right-20 -top-20 text-blue-500 rotate-12" />
                    </div>
                </>
            )}

            <div className={`h-1 w-full rounded-t-[1.35rem] opacity-80 ${post.destination === 'church' ? 'bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400'}`}></div>

            <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={`/u/${post.userUsername}`} className="shrink-0 relative" aria-label={`Abrir perfil de ${post.userDisplayName}`}>
                        <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border-2 ${post.destination === 'church' ? 'border-blue-500/40' : 'border-gray-100 dark:border-gray-800'}`}>
                            {post.userPhotoURL ? (
                                <img src={post.userPhotoURL} className="w-full h-full object-cover" alt={post.userDisplayName} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-bible-gold/10 text-bible-gold text-[10px] font-black uppercase">
                                    {post.userDisplayName?.substring(0,2)}
                                </div>
                            )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-bible-darkPaper ${post.destination === 'church' ? 'bg-blue-600 text-white shadow-sm' : `${identity.bg} ${identity.color}`}`}>
                            {post.destination === 'church' ? <Church size={10} strokeWidth={3} /> : <IdentityIcon size={10} strokeWidth={3} />}
                        </div>
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Link href={`/u/${post.userUsername}`} className="text-base font-black text-gray-900 dark:text-white leading-none hover:underline">
                                {post.userDisplayName}
                            </Link>
                            {post.destination === 'cell' && <span className="bg-indigo-100 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1"><Users size={8} /> Célula</span>}
                            {post.destination === 'church' && <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-md"><Church size={8} /> Mural da Igreja</span>}
                            {post.serviceId && <span className="max-w-[150px] overflow-hidden whitespace-nowrap bg-bible-gold/15 text-bible-leather dark:text-bible-gold text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase inline-flex items-center gap-1 border border-bible-gold/30"><CalendarDays size={8} className="shrink-0" /> <span className="truncate">{post.serviceTitle || 'Culto+'}</span></span>}
                            {post.alsoShowOnChurch && post.destination === 'cell' && <span className="bg-blue-100 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 border border-blue-200/50"><Church size={8} /> + Mural</span>}
                            {post.type === 'cell_meeting' && <span className="bg-green-100 text-green-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Encontro</span>}
                            {feedReasonLabel && <span className="bg-gray-100 text-gray-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 dark:bg-gray-800 dark:text-gray-300"><Eye size={8} /> {feedReasonLabel}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
                            <span>{postDate}</span>
                            <span>•</span>
                            <span className={identity.color}>{identity.label}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    {((isOwner && (onEdit || onDelete)) || (!isOwner && (onHide || onReport))) && <PostMenu post={post} isOwner={Boolean(isOwner)} onEdit={isOwner && post.type !== 'study' && post.type !== 'devotional' ? onEdit : undefined} onDelete={isOwner ? onDelete : undefined} onHide={onHide} onReport={onReport} />}
                </div>
            </div>

            {renderContent()}

            {post.location && !postImage && (
                <div className="px-6 pb-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <MapPin size={12} className="text-bible-gold" /> {post.location}
                    </div>
                </div>
            )}

            <div className="mx-5 flex items-center justify-between border-t border-fuchsia-950/10 px-0 py-3 dark:border-white/10">
                <div className="flex min-w-0 items-center gap-1 sm:gap-3">
                    <button 
                        onClick={() => onInteraction(post.id, 'like')} 
                        aria-label={isLiked ? 'Descurtir publicação' : 'Curtir publicação'}
                        aria-pressed={isLiked}
                        className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl transition-all active:scale-110 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200'}`}
                    >
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
                        <span className="hidden text-xs font-bold lg:inline">Curtir</span>
                        <span className="text-xs font-black">{post.likesCount || 0}</span>
                    </button>
                    
                    <button 
                        onClick={() => onInteraction(post.id, 'comment')} 
                        aria-label="Comentar na publicação"
                        className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700 active:scale-110 dark:hover:bg-white/5 dark:hover:text-gray-200"
                    >
                        <MessageCircle size={20} />
                        <span className="hidden text-xs font-bold lg:inline">Comentar</span>
                        <span className="text-xs font-black">{post.commentsCount || 0}</span>
                    </button>

                    <button 
                        onClick={() => onInteraction(post.id, 'share')} 
                        aria-label="Compartilhar publicação"
                        className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl text-gray-500 transition-all hover:bg-violet-50 hover:text-violet-700 active:scale-110 dark:hover:bg-violet-500/10"
                    >
                        <Share2 size={18} />
                        <span className="hidden text-xs font-bold lg:inline">Compartilhar</span>
                        <span className="text-xs font-black">{post.shares || 0}</span>
                    </button>

                    <span className="hidden items-center gap-1.5 text-gray-400 sm:flex">
                        <Eye size={18} />
                        <span className="text-xs font-black">{post.viewsCount || 0}</span>
                    </span>
                </div>

                <button onClick={() => onInteraction(post.id, 'save')} aria-label={post.saved ? 'Remover dos salvos' : 'Salvar publicação'} aria-pressed={post.saved} className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2 transition-colors ${post.saved ? 'text-violet-700 dark:text-violet-300' : 'text-gray-400 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10'}`}><Bookmark size={20} fill={post.saved ? 'currentColor' : 'none'} /><span className="hidden text-xs font-bold lg:inline">Salvar</span></button>
            </div>
        </article>
    );
};
