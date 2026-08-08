"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, BookOpen, Heart, Sparkles, MapPin, 
  Users, Church, Globe, Loader2, Search, Quote, 
  Smile, Flame, Zap, HelpCircle, Check, HandHeart,
  PenLine, ChevronDown, ListFilter, ImageIcon, Trash2, Camera, Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { bibleService } from '../../services/bibleService';
import { dbService, uploadBlob } from '../../services/supabase';
import { kingdomPublishingService } from '../../services/kingdomPublishingService';
import { findNearbyChurches, NearbyPlace } from '../../services/pastorAgent';
import { MoodType, PostVisibility } from '../../types';
import { base64ToBlob } from '../../utils/imageOptimizer';
import { extractMentionUsernames } from '../../utils/kingdomHomeFeed';
import { encodeMoodContent } from '../../utils/socialPostMood';

interface KingdomComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSuccess: (postId?: string) => void;
  prefilledImage?: string | null;
  prefilledCaption?: string;
  initialTab?: 'reflection' | 'prayer' | 'feeling' | 'checkin';
  initialVisibility?: PostVisibility;
}

type PostTabType = 'reflection' | 'prayer' | 'feeling' | 'checkin';
type Destination = 'global' | 'cell' | 'church';

const MOODS: { id: MoodType; label: string; emoji: string }[] = [
    { id: 'feliz', label: 'Feliz', emoji: '😄' },
    { id: 'blessed', label: 'Abençoado', emoji: '😇' },
    { id: 'grato', label: 'Grato', emoji: '🙏' },
    { id: 'paz', label: 'Em Paz', emoji: '🕊️' },
    { id: 'thoughtful', label: 'Reflexivo', emoji: '🤔' },
    { id: 'help', label: 'Preciso de Oração', emoji: '🆘' },
    { id: 'fire', label: 'Fervoroso', emoji: '🔥' },
    { id: 'cansado', label: 'Cansado', emoji: '😫' },
    { id: 'ansioso', label: 'Ansioso', emoji: '😰' },
    { id: 'triste', label: 'Triste', emoji: '😢' },
];

const YOUNG_SUGGESTIONS: Record<string, string[]> = {
    prayer: [
        "Pela minha faculdade e futuro profissional...",
        "Intercedam pela saúde da minha família...",
        "Sabedoria para lidar com ansiedade...",
        "Pelos jovens da minha igreja que estão afastados."
    ],
    reflection: [
        "O que aprendi hoje no meu devocional foi...",
        "Este versículo mudou minha perspectiva sobre...",
        "Deus tem sido fiel mesmo em meio às provas.",
        "Como aplicar a Palavra no meu dia a dia agitado?"
    ],
    feeling: [
        "Me sentindo renovado após o retiro!",
        "Hoje a paz de Deus inundou meu coração no trabalho.",
        "Cansado da rotina, mas confiando no descanso do Senhor.",
        "Grato por novas amizades cristãs este mês."
    ],
    checkin: [
        "Culto abençoado hoje!",
        "Visitando esta igreja maravilhosa.",
        "Tempo de comunhão com os irmãos.",
        "Ouvindo uma palavra poderosa aqui."
    ]
};

const KingdomComposer: React.FC<KingdomComposerProps> = ({ 
  isOpen, onClose, onPostSuccess, 
  prefilledImage, prefilledCaption, initialTab, initialVisibility
}) => {
  const { currentUser, userProfile, showNotification, recordActivity } = useAuth();
  const { settings } = useSettings();
  
  const [activeTab, setActiveTab] = useState<PostTabType>(initialTab || 'reflection');
  const [content, setContent] = useState('');
  const [destination, setDestination] = useState<Destination>('global');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [alsoShowOnChurch, setAlsoShowOnChurch] = useState(false);
  
  // Image and Bible Search
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [isSearchingVerse, setIsSearchingVerse] = useState(false);
  const [foundVerse, setFoundVerse] = useState<{ref: string, text: string} | null>(null);
  
  // Check-in State
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const hasDraftRef = useRef(false);

  const [isPosting, setIsPosting] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const verseRequestRef = useRef(0);
  hasDraftRef.current = Boolean(content.trim() || attachedImage || foundVerse || selectedPlace);

  const setPostVisibility = (nextVisibility: PostVisibility) => {
    setVisibility(nextVisibility);
    if (nextVisibility === 'group') {
      setDestination('cell');
      setAlsoShowOnChurch(false);
      return;
    }
    if (nextVisibility === 'church') {
      setDestination('church');
      setAlsoShowOnChurch(false);
      return;
    }
    setDestination('global');
    setAlsoShowOnChurch(false);
  };

  useEffect(() => {
    if (isOpen) {
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
        if (!prefilledCaption && !prefilledImage) {
            try {
                const draft = JSON.parse(localStorage.getItem(`cultoplus:kingdom-draft:${currentUser?.uid || 'guest'}`) || 'null');
                if (draft?.content) setContent(draft.content);
                if (draft?.activeTab) setActiveTab(draft.activeTab);
                if (draft?.visibility) setPostVisibility(draft.visibility);
            } catch {
                setDraftStatus('error');
            }
        }
        if (prefilledImage) {
            setAttachedImage(prefilledImage);
            // Default to reflection tab if image is present unless forced
            if (!initialTab) setActiveTab('reflection');
        }
        if (prefilledCaption) {
            setContent(prefilledCaption);
        }
        if (initialTab) setActiveTab(initialTab);
        if (initialVisibility) setPostVisibility(initialVisibility);
    }
  }, [isOpen, prefilledImage, prefilledCaption, initialTab, initialVisibility]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            if (hasDraftRef.current) setShowDiscardConfirmation(true);
            else onClose();
            return;
        }
        if (event.key !== 'Tab' || !dialogRef.current) return;
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
        previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !currentUser?.uid) return;
    setDraftStatus('saving');
    const timeout = window.setTimeout(() => {
        try {
            localStorage.setItem(`cultoplus:kingdom-draft:${currentUser.uid}`, JSON.stringify({ content, activeTab, visibility }));
            setDraftStatus('saved');
        } catch {
            setDraftStatus('error');
        }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [activeTab, content, currentUser?.uid, isOpen, visibility]);

  useEffect(() => {
    if (activeTab === 'reflection' && verseRef.length > 3) {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(async () => {
            const requestId = ++verseRequestRef.current;
            setIsSearchingVerse(true);
            try {
              const res = await bibleService.getTextByReference(verseRef, settings.bibleVersion || 'ara');
              if (requestId !== verseRequestRef.current) return;
              setFoundVerse(res ? { ref: res.formattedRef, text: res.text } : null);
            } finally {
              if (requestId === verseRequestRef.current) setIsSearchingVerse(false);
            }
        }, 800);
    } else if (verseRef.length === 0) {
        verseRequestRef.current += 1;
        setFoundVerse(null);
        setIsSearchingVerse(false);
    }
  }, [verseRef, activeTab, settings.bibleVersion]);

  const findPlacesFromCurrentLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const places = await findNearbyChurches(latitude, longitude);
                    setNearbyPlaces(places);
                } catch (e) {
                    showNotification("Erro ao buscar locais.", "error");
                } finally {
                    setIsLocating(false);
                }
            }, (err) => {
                console.error(err);
                setIsLocating(false);
                showNotification("Permissão de localização necessária.", "warning");
            });
        } else {
            setIsLocating(false);
            showNotification("Geolocalização não suportada.", "error");
        }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showNotification('Use uma imagem JPG, PNG ou WebP.', 'warning');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        showNotification('A imagem deve ter no máximo 8 MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCloseRequest = () => {
      if (content.trim() || attachedImage || foundVerse || selectedPlace) {
          setShowDiscardConfirmation(true);
          return;
      }
      onClose();
  };

  const discardDraft = () => {
      if (currentUser?.uid) localStorage.removeItem(`cultoplus:kingdom-draft:${currentUser.uid}`);
      resetForm();
      setShowDiscardConfirmation(false);
      onClose();
  };

  const insertSuggestion = (suggestion: string) => {
      const textarea = textareaRef.current;
      if (!textarea) { setContent(previous => `${previous}${previous ? '\n' : ''}${suggestion}`); return; }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      setContent(previous => `${previous.slice(0, start)}${suggestion}${previous.slice(end)}`);
      window.setTimeout(() => textarea.focus(), 0);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !attachedImage && !selectedPlace) return;
    if (!currentUser || !userProfile) return;
    if (activeTab === 'feeling' && !selectedMood) {
        showNotification("Escolha como você está se sentindo.", "warning");
        return;
    }
    
    setIsPosting(true);
    try {
        // Upload Image if it's base64
        let finalImageUrl = attachedImage;
        if (attachedImage && attachedImage.startsWith('data:')) {
            try {
                const blob = await base64ToBlob(attachedImage);
                const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
                finalImageUrl = await uploadBlob(blob, `posts/${currentUser.uid}/${crypto.randomUUID()}.${extension}`);
            } catch (err) {
                console.error("Image upload failed", err);
                showNotification("Falha ao enviar imagem. Tente novamente.", "error");
                setIsPosting(false);
                return;
            }
        }

        let finalContent = content;
        if (activeTab === 'reflection' && foundVerse) {
            finalContent = `📖 ${foundVerse.ref}: "${foundVerse.text}"\n\n${content}`;
        }
        if (activeTab === 'checkin' && selectedPlace) {
            finalContent = `📍 Check-in em **${selectedPlace.name}**\n${selectedPlace.address}\n\n${content}`;
        }

        const publishedPost = await kingdomPublishingService.publish({
            publisher: {
                userId: currentUser.uid,
                displayName: userProfile.displayName,
                username: userProfile.username,
                photoURL: userProfile.photoURL,
            },
            type: activeTab,
            content: activeTab === 'feeling' ? encodeMoodContent(finalContent, selectedMood) : finalContent,
            imageUrl: finalImageUrl,
            mood: activeTab === 'feeling' ? selectedMood : null,
            audience: {
                destination,
                visibility,
                churchId: destination === 'church' ? userProfile.churchData?.churchId : null,
                cellId: destination === 'cell' ? userProfile.churchData?.groupId : null,
                alsoShowOnChurch,
            },
            sourceType: activeTab === 'checkin' ? 'place_checkin' : activeTab,
            sourceId: activeTab === 'checkin' && selectedPlace
                ? `${selectedPlace.name}:${selectedPlace.address}`
                : null,
            metadata: {
                ...(foundVerse ? {
                    scripture: {
                        reference: foundVerse.ref,
                        text: foundVerse.text,
                    },
                } : {}),
                ...(selectedPlace ? {
                    place: {
                        name: selectedPlace.name,
                        address: selectedPlace.address,
                    },
                } : {}),
                ...(attachedImage && imageAlt.trim() ? { imageAlt: imageAlt.trim() } : {}),
            },
        });
        try {
            const mentionedUsernames = extractMentionUsernames(finalContent);
            if (mentionedUsernames.length > 0) {
                const mentionedUsers = (await Promise.all(mentionedUsernames.map(username => dbService.getUserByUsername(username))))
                    .filter((user): user is NonNullable<typeof user> => Boolean(user && user.uid !== currentUser.uid));

                await Promise.all(mentionedUsers.map(user => dbService.sendUserNotification(
                    user.uid,
                    'Menção no Reino',
                    `${userProfile.displayName} mencionou @${user.username} em uma publicação.`,
                    'social',
                    `/p/${publishedPost.id}`
                )));
            }
        } catch (mentionError) {
            console.warn("Post publicado, mas as menções não foram notificadas.", mentionError);
        }
        try {
            await recordActivity('social_post', 'Fez uma publicação no Reino');
        } catch (activityError) {
            console.warn("Post publicado, mas a atividade não foi registrada.", activityError);
        }
        showNotification("Publicado com sucesso!", "success");
        localStorage.removeItem(`cultoplus:kingdom-draft:${currentUser.uid}`);
        resetForm();
        onPostSuccess(publishedPost.id);
        onClose();
    } catch (e) {
        console.error(e);
        showNotification("Erro ao publicar no Reino.", "error");
    } finally {
        setIsPosting(false);
    }
  };

  const resetForm = () => {
      setContent('');
      setAttachedImage(null);
      setImageAlt('');
      setVerseRef('');
      setFoundVerse(null);
      setSelectedMood(null);
      setSelectedPlace(null);
      setNearbyPlaces([]);
      setDestination('global');
      setVisibility('public');
      setAlsoShowOnChurch(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[320] flex items-end justify-center overflow-hidden bg-[#100a18]/85 p-0 backdrop-blur-md animate-in fade-in duration-300 md:items-center md:p-5">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kingdom-composer-title"
        className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[920px] flex-col overflow-hidden bg-[#fffdf9] shadow-[0_30px_100px_rgba(8,4,16,0.55)] animate-in slide-in-from-bottom-10 dark:bg-[#17131d] md:h-[min(880px,92vh)] md:max-h-[92vh] md:rounded-[2rem] md:border md:border-fuchsia-300/30"
      >
        {/* Header com Abas Dinâmicas */}
        <div className="border-b border-[#e9dfd7] bg-[#fffdf9] p-4 dark:border-white/10 dark:bg-[#17131d] md:px-8 md:pt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-violet-700 dark:text-fuchsia-300">Culto+</span>
              <h2 id="kingdom-composer-title" className="font-serif text-2xl font-black text-[#24182d] dark:text-white md:text-3xl">Nova partilha</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">{draftStatus === 'saving' ? 'Salvando rascunho…' : draftStatus === 'saved' ? 'Rascunho salvo neste dispositivo' : draftStatus === 'error' ? 'Não foi possível salvar o rascunho' : 'Escreva com calma; você revisará antes de publicar.'}</p>
            </div>
            <button type="button" onClick={handleCloseRequest} aria-label="Fechar compositor" className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"><X size={20}/></button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div role="tablist" aria-label="Tipo da partilha" className="flex gap-1 overflow-x-auto rounded-2xl border border-[#eee4dc] bg-white p-1 shadow-sm no-scrollbar dark:border-white/10 dark:bg-white/5">
                <button 
                    onClick={() => setActiveTab('reflection')}
                    role="tab" aria-selected={activeTab === 'reflection'} className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-black transition-all ${activeTab === 'reflection' ? 'bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white' : 'text-gray-500 hover:text-violet-700 dark:text-gray-300'}`}
                >
                    <PenLine size={14} /> Reflexão
                </button>
                <button 
                    onClick={() => setActiveTab('prayer')}
                    role="tab" aria-selected={activeTab === 'prayer'} className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-black transition-all ${activeTab === 'prayer' ? 'bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white' : 'text-gray-500 hover:text-violet-700 dark:text-gray-300'}`}
                >
                    <HandHeart size={14} /> Oração
                </button>
                <button 
                    onClick={() => setActiveTab('checkin')}
                    role="tab" aria-selected={activeTab === 'checkin'} className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-black transition-all ${activeTab === 'checkin' ? 'bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white' : 'text-gray-500 hover:text-violet-700 dark:text-gray-300'}`}
                >
                    <MapPin size={14} /> Check-in
                </button>
                <button 
                    onClick={() => setActiveTab('feeling')}
                    role="tab" aria-selected={activeTab === 'feeling'} className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-black transition-all ${activeTab === 'feeling' ? 'bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white' : 'text-gray-500 hover:text-violet-700 dark:text-gray-300'}`}
                >
                    <Smile size={14} /> Sentir
                </button>
            </div>
          </div>
        </div>

        <div data-testid="kingdom-composer-scroll" className="grid min-h-0 flex-1 touch-pan-y grid-cols-1 overflow-y-auto overscroll-contain md:grid-cols-[1.15fr_0.85fr] md:overflow-hidden">
        <div className="min-h-0 space-y-6 p-5 custom-scrollbar md:overflow-y-auto md:p-7 md:pr-8">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} />

            <div className="grid grid-cols-3 gap-2" aria-label="Enriquecer partilha">
              <button type="button" onClick={() => setActiveTab('reflection')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-3 text-xs font-bold text-amber-800 transition hover:bg-amber-50 dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-300"><BookOpen size={16} /> Passagem</button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3 text-xs font-bold text-violet-800 transition hover:bg-violet-50 dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-300"><ImageIcon size={16} /> Imagem</button>
              <button type="button" onClick={() => { setActiveTab('checkin'); if (!selectedPlace && nearbyPlaces.length === 0) findPlacesFromCurrentLocation(); }} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50 dark:border-rose-400/20 dark:bg-white/5 dark:text-rose-300"><MapPin size={16} /> Local</button>
            </div>
            
            {/* Image Preview Area */}
            {attachedImage && (
                <div className="space-y-3 rounded-2xl border border-gray-200 p-3 shadow-lg dark:border-gray-800">
                  <div className="relative overflow-hidden rounded-xl group">
                    <img src={attachedImage} alt={imageAlt || 'Prévia da imagem anexada'} className="w-full h-auto max-h-60 object-cover" />
                    <button 
                        onClick={() => setAttachedImage(null)}
                        className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <Trash2 size={16} />
                    </button>
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                        <ImageIcon size={10} className="inline mr-1" /> Imagem Anexada
                    </div>
                  </div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Descrição da imagem
                    <input value={imageAlt} onChange={event => setImageAlt(event.target.value)} maxLength={180} placeholder="Descreva para quem não consegue ver a imagem" className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-900" />
                  </label>
                </div>
            )}

            {/* Contexto de Check-in */}
            {activeTab === 'checkin' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest ml-1">Onde você está?</label>
                         <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-gray-500 hover:text-green-600 flex items-center gap-1">
                             <Camera size={12}/> Adicionar Foto
                         </button>
                    </div>

                    {!isLocating && !selectedPlace && nearbyPlaces.length === 0 && (
                        <button type="button" onClick={findPlacesFromCurrentLocation} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                            <MapPin size={17} /> Usar minha localização
                        </button>
                    )}

                    {isLocating ? (
                        <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-green-500" size={24} />
                            <span className="text-xs font-bold uppercase tracking-widest">Buscando locais próximos...</span>
                        </div>
                    ) : selectedPlace ? (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl relative flex justify-between items-center animate-in zoom-in">
                            <div>
                                <h4 className="font-bold text-green-800 dark:text-green-200">{selectedPlace.name}</h4>
                                <p className="text-xs text-green-600 dark:text-green-300 line-clamp-1">{selectedPlace.address}</p>
                            </div>
                            <button onClick={() => setSelectedPlace(null)} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded-full"><X size={16}/></button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {nearbyPlaces.length > 0 ? nearbyPlaces.map((place, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setSelectedPlace(place)}
                                    className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-all flex items-center gap-3"
                                >
                                    <div className="p-2 bg-white dark:bg-black rounded-full text-green-500"><MapPin size={16} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{place.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{place.address}</p>
                                    </div>
                                </button>
                            )) : (
                                <div className="p-4 text-center text-xs text-gray-400 italic">
                                    Nenhum local encontrado ou permissão negada.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Contexto de Reflexão: Busca Bíblica */}
            {activeTab === 'reflection' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                            type="text" 
                            value={verseRef}
                            onChange={e => setVerseRef(e.target.value)}
                            placeholder="Citar passagem... (ex: João 3:16)"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-bible-gold/30 font-bold text-sm"
                        />
                        {isSearchingVerse && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" size={16}/>}
                    </div>

                    {foundVerse && (
                        <div className="p-4 bg-bible-gold/5 border border-bible-gold/20 rounded-2xl relative animate-in zoom-in-95 group">
                            <Quote size={14} className="text-bible-gold mb-2 opacity-50" />
                            <p className="text-sm italic text-gray-700 dark:text-gray-300 font-serif leading-relaxed line-clamp-3">"{foundVerse.text}"</p>
                            <span className="text-[10px] font-black text-bible-gold uppercase mt-2 block tracking-widest">{foundVerse.ref}</span>
                            <button onClick={() => setFoundVerse(null)} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                        </div>
                    )}
                </div>
            )}

            {/* Contexto de Sentimento: Mood Picker */}
            {activeTab === 'feeling' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Como você está agora?</label>
                    <div className="flex flex-wrap gap-2">
                        {MOODS.map(mood => (
                            <button 
                                key={mood.id}
                                onClick={() => setSelectedMood(mood.id)}
                                className={`px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-2 ${selectedMood === mood.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <span className="text-xl">{mood.emoji}</span>
                                <span className="text-xs font-bold">{mood.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Editor de Texto Principal */}
            <div className="relative group">
                <label htmlFor="kingdom-partilha-text" className="mb-3 block text-sm font-black text-gray-900 dark:text-white">O que deseja compartilhar?</label>
                <textarea 
                    id="kingdom-partilha-text"
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={
                        activeTab === 'prayer' ? "Escreva seu clamor ou gratidão..." : 
                        activeTab === 'feeling' ? "Fale mais sobre como você se sente..." :
                        activeTab === 'checkin' ? "Compartilhe sobre este momento..." :
                        "Compartilhe o que Deus falou ao seu coração..."
                    }
                    className="h-48 w-full resize-none rounded-2xl border border-[#e5d9cf] bg-white p-4 font-serif text-lg font-medium leading-relaxed text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                    autoFocus={!prefilledImage}
                />
                
                {/* Sugestões Criativas de Roadmap */}
                {YOUNG_SUGGESTIONS[activeTab] && (
                    <div className="mt-4 animate-in fade-in duration-700">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] w-full mb-3 block">Sugestões para o Reino:</span>
                        <div className="flex flex-wrap gap-2">
                            {YOUNG_SUGGESTIONS[activeTab].map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => insertSuggestion(s)}
                                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-[10px] font-bold text-gray-500 hover:bg-bible-gold/10 hover:text-bible-gold transition-colors border border-transparent hover:border-bible-gold/20"
                                >
                                    {s.length > 30 ? s.substring(0, 30) + '...' : s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Rodapé: Destino e Botão de Ação */}
        <div className="flex min-h-0 flex-col border-t border-[#e9dfd7] bg-[#fcf8f2] p-4 pb-safe dark:border-white/10 dark:bg-black/10 md:overflow-y-auto md:border-l md:border-t-0 md:border-[#e9dfd7] md:p-7 md:pl-8 dark:md:border-white/10">
            <div className="mx-auto flex w-full flex-1 flex-col space-y-4">
                <div>
                    <h3 className="font-serif text-xl font-black text-gray-950 dark:text-white">Destino e prévia</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Confirme quem verá antes de publicar.</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quem pode ver</span>
                            <p className="text-[10px] font-bold text-bible-gold">
                                {visibility === 'public' ? 'Publico e descoberta' : visibility === 'followers' ? 'Apenas seguidores' : visibility === 'group' ? `Grupo: ${userProfile?.churchData?.groupName}` : visibility === 'church' ? `Igreja: ${userProfile?.churchData?.churchName}` : 'Somente voce'}
                            </p>
                        </div>
                        <Lock size={16} className="text-gray-300" />
                    </div>
                    <div role="radiogroup" aria-label="Audiência da publicação" className="grid gap-2 sm:grid-cols-2">
                        {([
                            { value: 'public', label: 'Público', detail: 'Pode aparecer na descoberta', icon: Globe, enabled: true },
                            { value: 'followers', label: 'Seguidores', detail: 'Somente quem segue você', icon: Users, enabled: true },
                            { value: 'group', label: 'Meu grupo', detail: userProfile?.churchData?.groupName || 'Vincule-se a um grupo', icon: ListFilter, enabled: Boolean(userProfile?.churchData?.groupId) },
                            { value: 'church', label: 'Minha igreja', detail: userProfile?.churchData?.churchName || 'Vincule-se a uma igreja', icon: Church, enabled: Boolean(userProfile?.churchData?.churchId) },
                            { value: 'private', label: 'Somente eu', detail: 'Fica privado no seu acervo', icon: Lock, enabled: true },
                        ] as const).map(option => {
                            const Icon = option.icon;
                            const selected = visibility === option.value;
                            return (
                                <button key={option.value} type="button" role="radio" aria-checked={selected} disabled={!option.enabled} onClick={() => option.enabled && setPostVisibility(option.value)} className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-violet-500 bg-violet-50 text-violet-900 ring-1 ring-violet-500 dark:bg-violet-500/10 dark:text-violet-100' : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'}`}>
                                    <Icon size={18} className="shrink-0" />
                                    <span><span className="block text-sm font-bold">{option.label}</span><span className="block text-xs opacity-70">{option.detail}</span></span>
                                    {selected && <Check size={16} className="ml-auto shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <section aria-labelledby="partilha-preview-title" className="rounded-2xl border border-[#dfd1c5] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <h4 id="partilha-preview-title" className="mb-3 text-sm font-black text-gray-900 dark:text-white">Prévia</h4>
                    <div className="rounded-xl border border-[#eee4dc] p-4 dark:border-white/10">
                        <div className="mb-3 flex items-center gap-3">
                            {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">{(userProfile?.displayName || 'Você').slice(0, 2).toUpperCase()}</span>}
                            <div><strong className="block text-sm text-gray-900 dark:text-white">{userProfile?.displayName || 'Você'}</strong><span className="text-xs text-gray-500">Agora mesmo · {activeTab === 'reflection' ? 'Reflexão' : activeTab === 'prayer' ? 'Oração' : activeTab === 'checkin' ? 'Encontro' : 'Testemunho'}</span></div>
                        </div>
                        <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-700 dark:text-gray-200">{content.trim() || 'Sua partilha aparecerá aqui enquanto você escreve.'}</p>
                        {foundVerse && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-400/20 dark:bg-amber-500/5"><strong className="text-sm text-amber-800 dark:text-amber-300">{foundVerse.ref}</strong><p className="mt-1 line-clamp-3 font-serif text-xs italic text-gray-600 dark:text-gray-300">{foundVerse.text}</p></div>}
                        {attachedImage && <img src={attachedImage} alt={imageAlt || 'Prévia do anexo'} className="mt-3 max-h-36 w-full rounded-xl object-cover" />}
                    </div>
                </section>
                 
                {/* Seletor de Destino */}
                <div className="hidden">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publicar em:</span>
                        <span className="text-[9px] text-bible-gold font-bold">
                            {destination === 'global' ? 'Feed Público' : destination === 'cell' ? `Célula: ${userProfile?.churchData?.groupName}` : `Igreja: ${userProfile?.churchData?.churchName}`}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setPostVisibility('public')}
                            className={`p-3 rounded-xl border-2 transition-all ${destination === 'global' ? 'border-bible-gold bg-bible-gold/10 text-bible-gold shadow-md' : 'border-transparent text-gray-400 hover:bg-gray-100'}`}
                            title="Global"
                        >
                            <Globe size={18} />
                        </button>
                        
                        {userProfile?.churchData?.groupId && (
                            <button 
                                onClick={() => setPostVisibility('group')}
                                className={`p-3 rounded-xl border-2 transition-all ${destination === 'cell' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-md' : 'border-transparent text-gray-400 hover:bg-gray-100'}`}
                                title="Célula"
                            >
                                <Users size={18} />
                            </button>
                        )}

                        {userProfile?.churchData?.churchId && (
                            <button 
                                onClick={() => setPostVisibility('church')}
                                className={`p-3 rounded-xl border-2 transition-all ${destination === 'church' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-md' : 'border-transparent text-gray-400 hover:bg-gray-100'}`}
                                title="Igreja"
                            >
                                <Church size={18} />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Opção de Cross-posting para Igreja */}
                {visibility === 'group' && userProfile?.churchData?.churchId && (
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-xl text-blue-600 shadow-sm">
                                <Church size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Mural da Igreja</span>
                                <span className="text-[9px] text-gray-500 font-bold italic">Também mostrar na página da igreja</span>
                            </div>
                        </div>
                        <button 
                            type="button"
                            role="switch"
                            aria-checked={alsoShowOnChurch}
                            aria-label="Também mostrar no mural da igreja"
                            onClick={() => setAlsoShowOnChurch(!alsoShowOnChurch)}
                            className={`relative min-h-11 w-12 rounded-full transition-colors ${alsoShowOnChurch ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <div className={`absolute top-3.5 h-4 w-4 rounded-full bg-white transition-all ${alsoShowOnChurch ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                )}

                <button 
                    onClick={handleSubmit}
                    disabled={(!content.trim() && !attachedImage && !selectedPlace) || isPosting}
                    className="mt-auto w-full py-5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPosting ? <Loader2 className="animate-spin" size={20}/> : <Zap size={18} fill="currentColor"/>}
                    {visibility === 'private' ? 'Salvar privado' : visibility === 'followers' ? 'Publicar para seguidores' : destination === 'global' ? 'Publicar no Reino' : 'Enviar para Comunidade'}
                </button>
            </div>
        </div>
        </div>
      </div>
      {showDiscardConfirmation && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="discard-draft-title" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900">
            <h3 id="discard-draft-title" className="text-lg font-bold text-gray-900 dark:text-white">Descartar esta partilha?</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">O texto salvo neste dispositivo também será removido.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" autoFocus onClick={() => setShowDiscardConfirmation(false)} className="min-h-11 flex-1 rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-700 dark:border-gray-700 dark:text-gray-200">Continuar escrevendo</button>
              <button type="button" onClick={discardDraft} className="min-h-11 flex-1 rounded-xl bg-red-600 px-4 text-sm font-bold text-white">Descartar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KingdomComposer;
