"use client";
import { useNavigate } from '../utils/router';


import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, Share2, Instagram, Loader2, Copy, Image as ImageIcon, Palette, Zap, Lock, Download, Eye, EyeOff, PenTool, Maximize2, Minimize2, Sparkles, Type, LayoutTemplate, Edit3, Rss } from 'lucide-react';
import { generateSocialPostDesign, generateVerseImage, generateSocialCaption } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

import { generateShareLink } from '../utils/shareUtils';
import ConfirmationModal from './ConfirmationModal';
import { composeImageWithText } from '../utils/imageCompositor';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseText: string;
  verseReference: string;
}

const IMAGE_STYLES = [
  { id: 'none', label: 'Texto', icon: <Copy size={16} /> },
  { id: 'realistic', label: 'Real', icon: <ImageIcon size={16} /> },
  { id: 'oil_painting', label: 'Óleo', icon: <Palette size={16} /> },
  { id: 'watercolor', label: 'Água', icon: <Palette size={16} /> },
  { id: 'cinematic', label: 'Cine', icon: <ImageIcon size={16} /> },
  { id: 'minimalist', label: 'Minim', icon: <Palette size={16} /> },
  { id: 'custom', label: 'Custom', icon: <PenTool size={16} /> },
];

const PreviewCard: React.FC<{
  imageData: string | null;
  design: any;
  text: string;
  reference: string;
  loading: boolean;
  onClick?: () => void;
}> = ({ imageData, design, text, reference, loading, onClick }) => {
  
  const fontStyle = useMemo(() => {
      if (design?.fontStyle === 'cursive') return '"Brush Script MT", cursive';
      if (design?.fontStyle === 'serif') return 'serif';
      return 'sans-serif';
  }, [design?.fontStyle]);

  const fontSize = useMemo(() => {
      const len = text.length;
      if (len < 100) return 'text-xl md:text-2xl';
      if (len < 250) return 'text-lg md:text-xl';
      if (len < 500) return 'text-base md:text-lg';
      return 'text-xs md:text-sm';
  }, [text]);

  return (
    <div 
        onClick={onClick}
        className={`w-full h-full relative overflow-hidden bg-gray-900 flex flex-col items-center justify-center text-center p-6 transition-all duration-500 ${imageData ? 'cursor-zoom-in' : ''}`}
    >
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500"
            style={{ 
                backgroundImage: imageData ? `url(${imageData})` : (design?.gradient || 'linear-gradient(135deg, #1a1a1a, #333)'),
            }}
        />
        
        {/* Mostra overlay de texto APENAS se não tiver imagem (modo texto puro) ou se estiver carregando. 
            Se tiver imagem, o texto já foi "queimado" nela pelo compositor. 
        */}
        {!imageData && (
            <div className="absolute inset-0 bg-black/40 z-10" />
        )}

        <div className={`relative z-20 flex flex-col items-center justify-center w-full h-full transition-opacity duration-300`}>
            {loading ? (
                <div className="flex flex-col items-center animate-pulse text-white bg-black/20 p-4 rounded-2xl backdrop-blur-sm">
                    <Loader2 className="animate-spin text-bible-gold mb-2" size={32} />
                    <span className="font-bold text-xs">Criando arte sacra...</span>
                </div>
            ) : !imageData && ( // Só mostra HTML se não tiver imagem queimada
                <>
                    <span className="text-4xl text-white/30 font-serif leading-none mb-2 select-none">"</span>
                    <p 
                        className={`text-white font-bold leading-relaxed drop-shadow-xl line-clamp-[12] px-2 ${fontSize}`}
                        style={{ fontFamily: fontStyle, textShadow: '0 2px 10px rgba(0,0,0,1)' }}
                    >
                        {text}
                    </p>
                    <div className="mt-4 flex items-center gap-3 opacity-90 text-white">
                        <div className="h-px w-4 bg-current"></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] drop-shadow-md">
                            {reference}
                        </p>
                        <div className="h-px w-4 bg-current"></div>
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

const SocialShareModal: React.FC<SocialShareModalProps> = ({ isOpen, onClose, verseText, verseReference }) => {
  const { currentUser, recordActivity, checkFeatureAccess, incrementUsage, showNotification, openLogin, openSubscription } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'visual' | 'caption'>('visual');
  const [design, setDesign] = useState<{ gradient: string; textColor: string; fontStyle: string; caption: string; hashtags: string[] } | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [displayText, setDisplayText] = useState(verseText);

  // Lógica de continuidade: Detectar quando o usuário loga e processar automaticamente
  useEffect(() => {
    if (isOpen && currentUser && showLoginModal) {
      setShowLoginModal(false);
      handleGenerate(false);
    }
  }, [currentUser, isOpen, showLoginModal]);

  useEffect(() => {
    if (isOpen) {
      setDisplayText(verseText);
      const canAccess = checkFeatureAccess('aiImageGen');
      
      if (!canAccess) {
          if (!currentUser) setShowLoginModal(true);
          else setShowLimitModal(true);
      } else {
          handleGenerate(false); 
      }
    }
  }, [isOpen, verseText]);

  const handleGenerate = async (forceTextOnly = false) => {
    const isImageMode = !forceTextOnly && selectedStyle !== 'none';
    
    if (isImageMode) {
        const canAccess = checkFeatureAccess('aiImageGen');
        if (!canAccess) {
            if (!currentUser) setShowLoginModal(true);
            else setShowLimitModal(true);
            return;
        }
    }

    setLoading(true);
    if (isImageMode) setImageData(null); 

    try {
        const designPromise = generateSocialPostDesign(displayText, verseReference);
        
        const styleLabel = IMAGE_STYLES.find(s => s.id === selectedStyle)?.label || 'Realista';
        const imagePromise = isImageMode ? generateVerseImage(displayText, verseReference, styleLabel) : Promise.resolve(null);
        
        const [newDesign, newImage] = await Promise.all([designPromise, imagePromise]);

        if (newDesign) setDesign(newDesign);
        
        if (newImage) {
            const rawBase64 = `data:${newImage.mimeType};base64,${newImage.data}`;
            
            // QUEIMA O TEXTO NA IMAGEM (Server-side rendering feeling on client)
            const composedBase64 = await composeImageWithText(rawBase64, displayText, verseReference);
            
            setImageData(composedBase64);
            await incrementUsage('images');
            if (currentUser) {
                await recordActivity('create_image', `Arte IA gerada para: ${verseReference}`);
            }
        }
    } catch (e) { 
        showNotification("Erro ao criar arte.", "error"); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleManualShare = async () => {
      if (imageData) {
          // Cria um link temporário para download
          const link = document.createElement('a');
          link.href = imageData;
          link.download = `BibliaLM_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
      
      if (currentUser) {
          await recordActivity('share_content', `Baixou Arte de ${verseReference}`);
      }
      showNotification("Imagem baixada com sucesso!", "success");
  };

  const handlePostToFeed = () => {
      onClose();
      // Passa a legenda editada (do input) ou o texto original se não houver legenda
      const captionToUse = design?.caption || displayText;
      
      navigate('/social', { 
          state: { 
              openCreate: 'image',
              prefilledImage: imageData,
              prefilledCaption: captionToUse
          }
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
        <div className="bg-white dark:bg-bible-darkPaper w-full max-w-md h-[100dvh] md:h-auto md:max-h-[90vh] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 z-20">
                <h2 className="text-lg font-serif font-bold flex items-center gap-2 text-gray-900 dark:text-white"><Instagram className="text-pink-500" /> Arte IA</h2>
                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="w-full bg-black p-6 flex flex-col items-center justify-center relative">
                    <div className="w-full max-w-[280px] aspect-[4/5] rounded-xl overflow-hidden relative shadow-2xl border border-gray-800">
                        <PreviewCard imageData={imageData} design={design} text={displayText} reference={verseReference} loading={loading} />
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button onClick={() => setActiveTab('visual')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'visual' ? 'bg-white dark:bg-black text-bible-gold shadow-sm' : 'text-gray-500'}`}>Estilo Visual</button>
                        <button onClick={() => setActiveTab('caption')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'caption' ? 'bg-white dark:bg-black text-bible-gold shadow-sm' : 'text-gray-500'}`}>Legenda Post</button>
                    </div>

                    <div className="space-y-4">
                        {activeTab === 'visual' ? (
                            <div className="grid grid-cols-4 gap-2">
                                {IMAGE_STYLES.map(style => (
                                    <button key={style.id} onClick={() => { setSelectedStyle(style.id); handleGenerate(); }} className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all aspect-square ${selectedStyle === style.id ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 bg-white dark:bg-gray-800'}`}>
                                        {style.icon}
                                        <span className="text-[9px] font-bold">{style.label}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Texto da Publicação</label>
                                <textarea 
                                    value={design?.caption || ''} 
                                    onChange={(e) => setDesign(prev => prev ? { ...prev, caption: e.target.value } : null)} 
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm h-32 outline-none resize-none focus:ring-2 focus:ring-bible-gold/50" 
                                    placeholder="Escreva a legenda do seu post aqui..." 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 pb-safe">
                <button onClick={handlePostToFeed} disabled={loading || !imageData} className="flex-1 py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all uppercase tracking-widest text-xs">
                    <Rss size={18} /> Postar no Feed
                </button>
                <button onClick={handleManualShare} disabled={loading || !imageData} className="w-14 h-14 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 shadow-sm active:scale-90 transition-transform disabled:opacity-50"><Download size={20}/></button>
            </div>
        </div>

        <ConfirmationModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)} 
            onConfirm={() => openLogin()} 
            title="Degustação Diária Concluída" 
            message="Como convidado, você tem um limite diário de criação. Entre em sua conta para criar mais artes e salvar no seu perfil!" 
            confirmText="Entrar Agora" 
            variant="info" 
        />
        
        <ConfirmationModal 
            isOpen={showLimitModal} 
            onClose={() => setShowLimitModal(false)} 
            onConfirm={() => openSubscription()} 
            title="Limite Diário Atingido" 
            message="Você atingiu o limite de artes do seu plano hoje. Que tal fazer um upgrade para o plano Ouro e ter criações ilimitadas?" 
            confirmText="Ver Planos Premium" 
            variant="warning" 
        />
    </div>
  );
};

export default SocialShareModal;
