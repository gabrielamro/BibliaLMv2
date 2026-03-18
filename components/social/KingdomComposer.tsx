"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, BookOpen, Heart, Sparkles, MapPin, 
  Users, Church, Globe, Loader2, Search, Quote, 
  Smile, Flame, Zap, HelpCircle, Check, HandHeart,
  PenLine, ChevronDown, ListFilter, ImageIcon, Trash2, Camera
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { bibleService } from '../../services/bibleService';
import { dbService, uploadBlob } from '../../services/supabase';
import { findNearbyChurches, NearbyPlace } from '../../services/pastorAgent';
import { MoodType } from '../../types';
import { base64ToBlob } from '../../utils/imageOptimizer';

interface KingdomComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSuccess: () => void;
  prefilledImage?: string | null;
  prefilledCaption?: string;
  initialTab?: 'reflection' | 'prayer' | 'feeling' | 'checkin';
}

type PostTabType = 'reflection' | 'prayer' | 'feeling' | 'checkin';
type Destination = 'global' | 'cell' | 'church';

const MOODS: { id: MoodType; label: string; emoji: string }[] = [
    { id: 'blessed', label: 'Abençoado', emoji: '😇' },
    { id: 'grato', label: 'Grato', emoji: '🙏' },
    { id: 'thoughtful', label: 'Reflexivo', emoji: '🤔' },
    { id: 'help', label: 'Preciso de Oração', emoji: '🆘' },
    { id: 'fire', label: 'Fervoroso', emoji: '🔥' },
    { id: 'paz', label: 'Em Paz', emoji: '🕊️' },
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
  prefilledImage, prefilledCaption, initialTab
}) => {
  const { currentUser, userProfile, showNotification, recordActivity } = useAuth();
  
  const [activeTab, setActiveTab] = useState<PostTabType>(initialTab || 'reflection');
  const [content, setContent] = useState('');
  const [destination, setDestination] = useState<Destination>('global');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  
  // Image and Bible Search
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [verseRef, setVerseRef] = useState('');
  const [isSearchingVerse, setIsSearchingVerse] = useState(false);
  const [foundVerse, setFoundVerse] = useState<{ref: string, text: string} | null>(null);
  
  // Check-in State
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPosting, setIsPosting] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
        if (prefilledImage) {
            setAttachedImage(prefilledImage);
            // Default to reflection tab if image is present unless forced
            if (!initialTab) setActiveTab('reflection');
        }
        if (prefilledCaption) {
            setContent(prefilledCaption);
        }
        if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, prefilledImage, prefilledCaption, initialTab]);

  useEffect(() => {
    if (activeTab === 'reflection' && verseRef.length > 3) {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearchingVerse(true);
            const res = await bibleService.getTextByReference(verseRef);
            if (res) {
                setFoundVerse({ ref: res.formattedRef, text: res.text });
            }
            setIsSearchingVerse(false);
        }, 800);
    } else if (verseRef.length === 0) {
        setFoundVerse(null);
    }
  }, [verseRef, activeTab]);

  // Geolocation Effect
  useEffect(() => {
    if (activeTab === 'checkin' && !selectedPlace && nearbyPlaces.length === 0) {
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
    }
  }, [activeTab]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !attachedImage && !selectedPlace) return;
    if (!currentUser || !userProfile) return;
    
    setIsPosting(true);
    try {
        // Upload Image if it's base64
        let finalImageUrl = attachedImage;
        if (attachedImage && attachedImage.startsWith('data:')) {
            try {
                const blob = await base64ToBlob(attachedImage);
                finalImageUrl = await uploadBlob(blob, `posts/${currentUser.uid}/${Date.now()}.webp`);
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

        const postData: any = {
            userId: currentUser.uid,
            userDisplayName: userProfile.displayName,
            userUsername: userProfile.username,
            userPhotoURL: userProfile.photoURL,
            type: attachedImage ? 'image' : (activeTab === 'reflection' ? 'reflection' : activeTab === 'prayer' ? 'prayer' : activeTab === 'checkin' ? 'reflection' : 'feeling'),
            content: finalContent,
            image: finalImageUrl,
            createdAt: new Date().toISOString(),
            likesCount: 0,
            commentsCount: 0,
            shares: 0,
            likes: 0,
            comments: 0,
            saved: false,
            likedBy: [],
            location: selectedPlace ? selectedPlace.name : (userProfile.city || 'Reino'),
            destination: destination,
            time: 'Agora'
        };

        if (activeTab === 'feeling' && selectedMood) {
            postData.mood = selectedMood;
        }

        if (destination === 'cell') {
            postData.cellId = userProfile.churchData?.groupId;
            postData.cellName = userProfile.churchData?.groupName;
        } else if (destination === 'church') {
            postData.churchId = userProfile.churchData?.churchId;
        }

        await dbService.createPost(postData);
        await recordActivity('social_post', 'Fez uma publicação no Reino');
        showNotification("Publicado com sucesso!", "success");
        resetForm();
        onPostSuccess();
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
      setVerseRef('');
      setFoundVerse(null);
      setSelectedMood(null);
      setSelectedPlace(null);
      setNearbyPlaces([]);
      setDestination('global');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-10">
        
        {/* Header com Abas Dinâmicas */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
            <div className="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('reflection')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'reflection' ? 'bg-bible-gold text-white' : 'text-gray-400 hover:text-bible-gold'}`}
                >
                    <PenLine size={14} /> Reflexão
                </button>
                <button 
                    onClick={() => setActiveTab('prayer')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'prayer' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-orange-500'}`}
                >
                    <HandHeart size={14} /> Oração
                </button>
                <button 
                    onClick={() => setActiveTab('checkin')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'checkin' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-green-600'}`}
                >
                    <MapPin size={14} /> Check-in
                </button>
                <button 
                    onClick={() => setActiveTab('feeling')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'feeling' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-purple-500'}`}
                >
                    <Smile size={14} /> Sentir
                </button>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* Image Preview Area */}
            {attachedImage && (
                <div className="relative rounded-2xl overflow-hidden shadow-lg group border border-gray-200 dark:border-gray-800">
                    <img src={attachedImage} alt="Preview" className="w-full h-auto max-h-60 object-cover" />
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
            )}

            {/* Contexto de Check-in */}
            {activeTab === 'checkin' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest ml-1">Onde você está?</label>
                         <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-gray-500 hover:text-green-600 flex items-center gap-1">
                             <Camera size={12}/> Adicionar Foto
                         </button>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>

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
                <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={
                        activeTab === 'prayer' ? "Escreva seu clamor ou gratidão..." : 
                        activeTab === 'feeling' ? "Fale mais sobre como você se sente..." :
                        activeTab === 'checkin' ? "Compartilhe sobre este momento..." :
                        "Compartilhe o que Deus falou ao seu coração..."
                    }
                    className="w-full h-40 bg-transparent text-lg font-medium text-gray-800 dark:text-white outline-none resize-none placeholder-gray-300 dark:placeholder-gray-700 leading-relaxed"
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
                                    onClick={() => setContent(s)}
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
        <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 pb-safe">
            <div className="max-w-md mx-auto space-y-4">
                
                {/* Seletor de Destino */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publicar em:</span>
                        <span className="text-[9px] text-bible-gold font-bold">
                            {destination === 'global' ? 'Feed Público' : destination === 'cell' ? `Célula: ${userProfile?.churchData?.groupName}` : `Igreja: ${userProfile?.churchData?.churchName}`}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setDestination('global')}
                            className={`p-3 rounded-xl border-2 transition-all ${destination === 'global' ? 'border-bible-gold bg-bible-gold/10 text-bible-gold shadow-md' : 'border-transparent text-gray-400 hover:bg-gray-100'}`}
                            title="Global"
                        >
                            <Globe size={18} />
                        </button>
                        
                        {userProfile?.churchData?.groupId && (
                            <button 
                                onClick={() => setDestination('cell')}
                                className={`p-3 rounded-xl border-2 transition-all ${destination === 'cell' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-md' : 'border-transparent text-gray-400 hover:bg-gray-100'}`}
                                title="Célula"
                            >
                                <Users size={18} />
                            </button>
                        )}

                        {userProfile?.churchData?.churchId && (
                            <button 
                                onClick={() => setDestination('church')}
                                className={`p-3 rounded-xl border-2 transition-all ${destination === 'church' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-md' : 'border-transparent text-gray-400 hover:bg-gray-100'}`}
                                title="Igreja"
                            >
                                <Church size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={(!content.trim() && !attachedImage && !selectedPlace) || isPosting}
                    className="w-full py-5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPosting ? <Loader2 className="animate-spin" size={20}/> : <Zap size={18} fill="currentColor"/>}
                    {destination === 'global' ? 'Publicar no Reino' : 'Enviar para Comunidade'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default KingdomComposer;