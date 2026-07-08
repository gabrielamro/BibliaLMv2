"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, LayoutGrid, Loader2, Smartphone, Sparkles } from 'lucide-react';

import SEO from '../../components/SEO';
import dynamic from 'next/dynamic';

const SacredArtCanvas = dynamic(() => import('../../components/sacred-art-editor/SacredArtCanvas'), { 
  ssr: false,
  loading: () => <div className="aspect-square h-[45vh] md:h-[70vh] bg-gray-900 rounded-[28px] animate-pulse flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">Carregando Estúdio...</div>
});
import SacredArtDock from '../../components/sacred-art-editor/SacredArtDock';
import SacredArtDrawer from '../../components/sacred-art-editor/SacredArtDrawer';
import type {
  EditorControlTab,
  EditorLayer,
  SacredArtGalleryItem,
} from '../../components/sacred-art-editor/types';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { bibleService } from '../../services/bibleService';
import { generateVerseImage } from '../../services/pastorAgent';
import { dbService, uploadBlob } from '../../services/supabase';
import { composeImageWithText, CompositionOptions } from '../../utils/imageCompositor';
import { base64ToBlob, optimizeImage } from '../../utils/imageOptimizer';
import { useLocation, useNavigate } from '../../utils/router';
import {
  EDITOR_LAYER_Z_INDEX,
  FONT_SCALE_LIMITS,
  TOP_SEARCH_BAR_WIDTH_CLASS,
  VERSE_FONT_PX_LIMITS,
  getFontScaleFromVersePx,
  getResponsiveTextLayout,
} from './editorLayout';

const HARDCODED_FREE_IMAGES: SacredArtGalleryItem[] = [
  { url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400', category: 'Luz', prompt: 'Criação e Luz' },
  { url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400', category: 'Geral', prompt: 'Mar Vermelho' },
  { url: 'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=400', category: 'Paz', prompt: 'Jerusalém e Paz' },
  { url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400', category: 'Vida', prompt: 'Homem de fé' },
  { url: 'https://images.unsplash.com/photo-1548625361-ec85d51eb9dc?w=400', category: 'Cruz', prompt: 'Cruz iluminada' },
];

const STYLES = [
  { id: 'realistic', label: 'Realista', icon: '📸' },
  { id: 'oil_painting', label: 'Óleo', icon: '🎨' },
  { id: 'cinematic', label: 'Cine', icon: '🎬' },
  { id: 'watercolor', label: 'Aquarela', icon: '💧' },
  { id: 'custom', label: 'Manual', icon: '✨' },
];

const COLORS = [
  { id: 'white', value: '#ffffff', label: 'Branco' },
  { id: 'black', value: '#000000', label: 'Preto' },
  { id: 'gold', value: '#c5a059', label: 'Dourado' },
  { id: 'cream', value: '#F5F5DC', label: 'Creme' },
];

const FONTS = [
  { id: 'Lora', label: 'Clássica Lora', style: { fontFamily: 'Lora, serif' } },
  { id: 'Cinzel', label: 'Épica Cinzel', style: { fontFamily: 'Cinzel, serif' } },
  { id: 'Inter', label: 'Moderna Inter', style: { fontFamily: 'Inter, sans-serif' } },
];

const FILTERS = [
  { id: 'none', label: 'Normal' },
  { id: 'darken', label: 'Escuro' },
  { id: 'bw', label: 'P&B' },
  { id: 'sepia', label: 'Sépia' },
];

interface RouteState {
  verseRef?: string;
  verseText?: string;
  initialPrompt?: string;
  tool?: string;
}

export default function CriarArteSacraPage() {
  const {
    currentUser,
    checkFeatureAccess,
    incrementUsage,
    openLogin,
    openSubscription,
    recordActivity,
    showNotification,
    userProfile,
  } = useAuth();
  const { setBreadcrumbs, setTitle } = useHeader();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as RouteState;

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [refInput, setRefInput] = useState(state.verseRef || '');
  const [isSearchingVerse, setIsSearchingVerse] = useState(false);
  const [foundVerse, setFoundVerse] = useState<{ ref: string; text: string } | null>(
    state.verseText && state.verseRef ? { ref: state.verseRef, text: state.verseText } : null
  );
  const [selectedStyle, setSelectedStyle] = useState(state.initialPrompt ? 'custom' : 'realistic');
  const [customPrompt, setCustomPrompt] = useState(state.initialPrompt || '');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isPostingToFeed, setIsPostingToFeed] = useState(false);
  const [rawGeneratedBase64, setRawGeneratedBase64] = useState<string | null>(null);
  const [finalImg, setFinalImg] = useState<string | null>(null);
  const [activeControlTab, setActiveControlTab] = useState<EditorControlTab>('templates');
  const [selectedLayer, setSelectedLayer] = useState<EditorLayer>(null);
  const [galleryImages, setGalleryImages] = useState<SacredArtGalleryItem[]>(HARDCODED_FREE_IMAGES);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [editOptions, setEditOptions] = useState<CompositionOptions>({
    textColor: '#ffffff',
    fontSizeScale: getFontScaleFromVersePx({
      aspectRatio: 'feed',
      containerWidth: 380,
      containerHeight: 380,
      targetVerseFontPx: VERSE_FONT_PX_LIMITS.default,
    }),
    verticalPosition: 50,
    alignment: 'center',
    fontFamily: 'Lora',
    filter: 'none',
    overlayOpacity: 0.4,
    aspectRatio: 'feed',
    textX: 50,
    textY: 50,
    bgX: 50,
    bgY: 50,
    bgScale: 1,
  });

  useEffect(() => {
    setTitle('Estúdio de Arte Sacra');
    setBreadcrumbs([
      { label: 'Estúdio Criativo', onClick: () => navigate('/estudio-criativo') },
      { label: 'Editor' },
    ]);

    const loadGallery = async () => {
      try {
        const userGal = currentUser ? await dbService.getSacredArtGallery(currentUser.uid) : [];
        const freeGal = await dbService.getImageBank(24);
        const mappedFree = freeGal.length > 0
          ? freeGal
              .map((img: SacredArtGalleryItem) => ({
                ...img,
                url: img.url || img.image_url,
                prompt: img.prompt || img.label || 'Arte Sacra',
              }))
              .filter((img: SacredArtGalleryItem) => img.url)
          : HARDCODED_FREE_IMAGES;

        setGalleryImages([...userGal, ...mappedFree]);
      } catch (error) {
        console.error('Erro ao carregar galeria:', error);
        setGalleryImages(HARDCODED_FREE_IMAGES);
      }
    };

    loadGallery();
  }, [currentUser, navigate, setBreadcrumbs, setTitle]);

  useEffect(() => {
    if (state.tool === 'image' && state.verseText) {
      setFoundVerse({ ref: state.verseRef || '', text: state.verseText });
      setRefInput(state.verseRef || '');
    }
  }, [state.tool, state.verseRef, state.verseText]);

  useEffect(() => {
    const ref = refInput.trim();
    if (ref.length <= 2) return;

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingVerse(true);
      try {
        const result = await bibleService.getVerseText(ref);
        if (!result) return;

        setFoundVerse({ ref: result.formattedRef, text: result.text });
        setCustomPrompt((previous) => {
          if (previous && previous.trim() !== '') return previous;
          return `Uma representação artística e sagrada de ${result.formattedRef}: ${result.text.substring(0, 100)}... estilo cinematográfico, luz divina, 8k`;
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearchingVerse(false);
      }
    }, 900);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [refInput]);

  useEffect(() => {
    const updatePreview = async () => {
      if (!rawGeneratedBase64 || (!foundVerse && !customPrompt)) return;

      try {
        const text = foundVerse?.text || '';
        const ref = foundVerse?.ref || '';
        const composed = await composeImageWithText(rawGeneratedBase64, text, ref, editOptions);
        setFinalImg(composed);
      } catch (error) {
        console.error('Erro no preview', error);
      }
    };

    const timeout = setTimeout(updatePreview, 150);
    return () => clearTimeout(timeout);
  }, [customPrompt, editOptions, foundVerse, rawGeneratedBase64]);

  const handleGenerateIA = async () => {
    setIsGeneratingImg(true);
    try {
      const styleLabel =
        selectedStyle === 'custom'
          ? customPrompt
          : STYLES.find((style) => style.id === selectedStyle)?.label || 'Realista';
      const contextText = foundVerse ? foundVerse.text : customPrompt;
      const contextRef = foundVerse ? foundVerse.ref : refInput || 'Arte IA';

      const result = await generateVerseImage(contextText, contextRef, styleLabel);
      if (!result?.data) {
        showNotification('Não foi possível gerar a imagem pelos provedores disponíveis.', 'error');
        return;
      }

      const cleanedData = result.data.replace(/\s/g, '');
      const raw = `data:${result.mimeType};base64,${cleanedData}`;
      setRawGeneratedBase64(raw);

      if (!foundVerse) {
        setFoundVerse({ ref: contextRef, text: contextText });
      }

      if (currentUser) {
        try {
          const response = await fetch(raw);
          const blob = await response.blob();
          const fileName = `artes_sacras/${currentUser.uid}/${Date.now()}.jpg`;
          const uploadedUrl = await uploadBlob(blob, fileName);

          await dbService.saveSacredArtImage(currentUser.uid, {
            url: uploadedUrl,
            prompt: styleLabel,
            category: result.category || 'Geral',
            style: selectedStyle,
            verseText: contextText,
            verseReference: contextRef,
            metadata: { generatedAt: new Date().toISOString() },
          });

          await incrementUsage('images');
          await recordActivity('create_image', `Arte gerada e salva no acervo: ${contextRef}`);

          const updatedUserGal = await dbService.getSacredArtGallery(currentUser.uid);
          setGalleryImages((previous) => {
            const freeOnly = previous.filter((img) => !img.userId);
            return [...updatedUserGal, ...freeOnly];
          });
        } catch (dbError) {
          console.error('Erro ao salvar no banco (Acervo):', dbError);
          showNotification('Arte gerada com sucesso, mas houve um erro ao salvar no seu acervo.', 'warning');
        }
      }
    } catch (error) {
      console.error('handleCreateArt unexpected error:', error);
      showNotification('Erro inesperado ao criar arte.', 'error');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleCreateClick = () => {
    if (!foundVerse && !refInput) {
      showNotification('Escolha um versículo ou referência bíblica!', 'info');
      return;
    }

    if (currentUser) {
      const canAccess = checkFeatureAccess('aiImageGen');
      if (!canAccess) {
        openSubscription();
        return;
      }
    } else {
      openLogin();
      return;
    }

    handleGenerateIA();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    try {
      const optimized = await optimizeImage(event.target.files[0]);
      setRawGeneratedBase64(optimized.base64);
    } catch {
      alert('Erro ao carregar imagem.');
    }
  };

  const handleDownload = () => {
    if (!finalImg) return;

    if (!currentUser) {
      const guestUsage = parseInt(localStorage.getItem('guest_sacred_art_usage') || '0', 10);
      if (guestUsage >= 2) {
        showNotification('Você atingiu o limite de 2 artes gratuitas. Faça login para continuar criando!', 'info');
        openLogin();
        return;
      }
      // Incrementar uso do convidado ao baixar
      localStorage.setItem('guest_sacred_art_usage', (guestUsage + 1).toString());
    }

    const link = document.createElement('a');
    link.href = finalImg;
    link.download = `BibliaLM_${editOptions.aspectRatio}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (!currentUser) {
      const guestUsage = parseInt(localStorage.getItem('guest_sacred_art_usage') || '0', 10);
      const remaining = 2 - guestUsage;
      if (remaining > 0) {
        showNotification(`Você ainda tem ${remaining} arte gratuita ${remaining === 1 ? 'restante' : 'restantes'} como convidado.`, 'success');
      }
    }
  };

  const handlePostToFeed = async () => {
    if (!finalImg) {
      showNotification('Gere ou selecione uma arte antes de publicar no Reino.', 'info');
      return;
    }

    if (!currentUser) {
      openLogin();
      return;
    }

    if (!userProfile) {
      showNotification('Carregando seu perfil. Tente novamente em instantes.', 'info');
      return;
    }

    setIsPostingToFeed(true);
    try {
      const blob = finalImg.startsWith('data:')
        ? await base64ToBlob(finalImg)
        : await fetch(finalImg).then((response) => response.blob());
      const imageUrl = await uploadBlob(blob, `posts/${currentUser.uid}/${Date.now()}.webp`);

      const caption = foundVerse
        ? `📖 ${foundVerse.ref}\n\n"${foundVerse.text}"`
        : customPrompt || 'Arte sacra criada no BíbliaLM';

      await dbService.createPost({
        userId: currentUser.uid,
        userDisplayName: userProfile.displayName,
        userUsername: userProfile.username,
        userPhotoURL: userProfile.photoURL,
        type: 'image',
        content: caption,
        image: imageUrl,
        destination: 'global',
      });

      try {
        await recordActivity('social_post', 'Postou uma arte sacra no Reino');
      } catch (activityError) {
        console.warn('Arte publicada, mas a atividade não foi registrada.', activityError);
      }

      showNotification('Arte publicada no Reino!', 'success');
      navigate('/social', { state: { refreshFeed: true } });
    } catch (error) {
      console.error('Erro ao publicar arte no Reino:', error);
      showNotification('Erro ao publicar no Reino. Tente novamente.', 'error');
    } finally {
      setIsPostingToFeed(false);
    }
  };

  const handleDragEnd = (_event: unknown, info: { point: { x: number; y: number } }) => {
    if (!canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(100, ((info.point.x - rect.left) / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, ((info.point.y - rect.top) / rect.height) * 100));

    setEditOptions((previous) => ({
      ...previous,
      textX: newX,
      textY: newY,
    }));
  };

  const handleBgDragEnd = (_event: unknown, info: { delta: { x: number; y: number } }) => {
    if (!canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    setEditOptions((previous) => ({
      ...previous,
      bgX: Math.max(0, Math.min(100, (previous.bgX ?? 50) + (info.delta.x / rect.width) * 100)),
      bgY: Math.max(0, Math.min(100, (previous.bgY ?? 50) + (info.delta.y / rect.height) * 100)),
      textX: Math.max(8, Math.min(92, (previous.textX ?? 50) + (info.delta.x / rect.width) * 18)),
      textY: Math.max(12, Math.min(88, (previous.textY ?? 50) + (info.delta.y / rect.height) * 18)),
    }));
  };

  const resetText = () => {
    setEditOptions((previous) => ({
      ...previous,
      textX: 50,
      textY: 50,
      fontSizeScale: 1,
      alignment: 'center',
    }));
  };

  const getCSSFilters = (): React.CSSProperties => {
    switch (editOptions.filter) {
      case 'bw':
        return { filter: 'grayscale(100%)' };
      case 'sepia':
        return { filter: 'sepia(80%)' };
      case 'darken':
        return { filter: 'brightness(60%)' };
      case 'blur':
        return { filter: 'blur(4px)' };
      case 'warm':
        return { filter: 'sepia(30%) saturate(140%) hue-rotate(-10deg)' };
      case 'cool':
        return { filter: 'saturate(80%) hue-rotate(20deg) contrast(110%)' };
      default:
        return {};
    }
  };

  const currentTextLayout = getResponsiveTextLayout({
    aspectRatio: editOptions.aspectRatio ?? 'feed',
    containerWidth: canvasSize.width || 380,
    containerHeight: canvasSize.height || (editOptions.aspectRatio === 'story' ? 640 : 380),
    fontSizeScale: editOptions.fontSizeScale,
  });

  const handleFontSizePxChange = (value: number) => {
    if (!Number.isFinite(value)) return;

    const scale = getFontScaleFromVersePx({
      aspectRatio: editOptions.aspectRatio ?? 'feed',
      containerWidth: canvasSize.width || 380,
      containerHeight: canvasSize.height || (editOptions.aspectRatio === 'story' ? 640 : 380),
      targetVerseFontPx: value,
    });

    setEditOptions((current) => ({
      ...current,
      fontSizeScale: Math.min(FONT_SCALE_LIMITS.max, Math.max(FONT_SCALE_LIMITS.min, scale)),
    }));
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-black flex flex-col relative overflow-hidden">
      <SEO title="Criar Arte Sacra | Estúdio" />

      <header
        className="relative shrink-0 flex items-start justify-between gap-2 px-3 sm:px-4 md:px-8 pt-3 pb-3 pointer-events-none"
        style={{ zIndex: EDITOR_LAYER_Z_INDEX.header }}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => navigate('/estudio-criativo')}
            className="p-3 bg-white/80 dark:bg-black/60 shadow-lg rounded-full text-gray-400 hover:text-bible-gold transition-all backdrop-blur-md border border-gray-200 dark:border-white/5"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="min-w-0 flex-1 flex justify-center pointer-events-auto">
          <div className="flex flex-col items-center gap-2 group">
            <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 md:gap-3">
              {/* Search Bar (Text Entry Style) */}
              <div className={`min-w-0 flex items-center gap-3 bg-[#101010]/95 py-3 px-4 sm:px-5 rounded-2xl border border-white/12 shadow-2xl transition-all focus-within:border-bible-gold/70 focus-within:ring-4 focus-within:ring-bible-gold/10 ${TOP_SEARCH_BAR_WIDTH_CLASS}`}>
                <div className="w-1 h-5 bg-bible-gold rounded-full shrink-0" />
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  className="min-w-0 w-full bg-transparent border-none focus:outline-none text-sm md:text-base font-semibold text-white caret-bible-gold placeholder:text-white/55"
                  placeholder="Adicione o versículo..."
                />
              </div>

              {/* Aspect Ratio Controls (Fora) */}
              <div className="flex shrink-0 items-center justify-center gap-1 bg-[#101010]/85 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-xl">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditOptions((current) => ({ ...current, aspectRatio: 'feed' }));
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${editOptions.aspectRatio === 'feed' ? 'bg-bible-gold text-black shadow-lg shadow-bible-gold/20' : 'text-white/65 hover:text-white hover:bg-white/10'}`}
                >
                  <LayoutGrid size={12} /> Feed
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditOptions((current) => ({ ...current, aspectRatio: 'story' }));
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${editOptions.aspectRatio === 'story' ? 'bg-bible-gold text-black shadow-lg shadow-bible-gold/20' : 'text-white/65 hover:text-white hover:bg-white/10'}`}
                >
                  <Smartphone size={12} /> Story
                </button>
              </div>

              {/* AI Button (Fora) */}
              <div className="flex items-center shrink-0">
                {isSearchingVerse ? (
                  <div className="p-2.5 bg-black/40 rounded-full border border-white/10">
                    <Loader2 size={16} className="animate-spin text-bible-gold" />
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveControlTab('ai')}
                    className="p-3 bg-bible-gold text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg shadow-bible-gold/30 hover:shadow-bible-gold/40"
                    title="Gerar com IA"
                  >
                    <Sparkles size={18} />
                  </button>
                )}
              </div>
            </div>

            {foundVerse && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300 mt-1">
                <p className="text-xs md:text-sm text-white/62 font-serif italic text-center max-w-[620px] line-clamp-2 px-4 leading-relaxed">
                  “{foundVerse.text}”
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="hidden md:flex items-center px-4 py-2 bg-black/40 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
            <div className="w-2 h-2 bg-bible-gold rounded-full animate-pulse mr-2" />
            <span className="text-[8px] font-black text-white/80 uppercase tracking-widest">Estúdio Vivo</span>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 relative flex flex-col pb-24 md:pb-4 overflow-hidden">
        <div className="min-h-0 flex-1 w-full grid grid-cols-1 md:grid-cols-[auto_132px_minmax(300px,390px)] items-stretch justify-center gap-3 px-4 md:px-6 pb-4 overflow-hidden">
          <div className="min-h-0 flex items-center justify-center overflow-hidden">
            <SacredArtCanvas
              canvasContainerRef={canvasContainerRef}
              rawGeneratedBase64={rawGeneratedBase64}
              foundVerse={foundVerse}
              editOptions={editOptions}
              selectedLayer={selectedLayer}
              setSelectedLayer={setSelectedLayer}
              onBgDragEnd={handleBgDragEnd}
              onTextDragEnd={handleDragEnd}
              onOpenAi={() => setActiveControlTab('ai')}
              onOpenTemplates={() => setActiveControlTab('templates')}
              onCanvasResize={setCanvasSize}
              onFontSizeScaleChange={(newScale) => {
                setEditOptions(prev => ({ ...prev, fontSizeScale: Math.max(0.01, newScale) }));
              }}
              onBgScaleChange={(newScale) => {
                setEditOptions(prev => ({ ...prev, bgScale: Math.max(1, Math.min(5, newScale)) }));
              }}
              getCSSFilters={getCSSFilters}
            />
          </div>

          {/* Dock Desktop (Ao lado da imagem) */}
          <div className="hidden md:flex min-h-0 items-center justify-center animate-in slide-in-from-right-4 duration-500">
              <SacredArtDock
                activeControlTab={activeControlTab}
                setActiveControlTab={setActiveControlTab}
                onDownload={handleDownload}
                onPostToFeed={handlePostToFeed}
                canPostToFeed={!!finalImg && !isPostingToFeed}
                isStatic
              />
          </div>

          <div className="hidden md:block min-h-0">
            <SacredArtDrawer
              activeControlTab={activeControlTab}
              setActiveControlTab={setActiveControlTab}
              galleryImages={galleryImages}
              currentUser={currentUser ? { uid: currentUser.uid } : null}
              setGalleryImages={setGalleryImages}
              setRawGeneratedBase64={setRawGeneratedBase64}
              editOptions={editOptions}
              setEditOptions={setEditOptions}
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              handleCreateClick={handleCreateClick}
              isGeneratingImg={isGeneratingImg}
              fileInputRef={fileInputRef}
              resetText={resetText}
              fontSizePx={currentTextLayout.verseFontSizePx}
              onFontSizePxChange={handleFontSizePxChange}
              styles={STYLES}
              fonts={FONTS}
              colors={COLORS}
              filters={FILTERS}
              fallbackImages={HARDCODED_FREE_IMAGES}
              desktopInline
            />
          </div>
        </div>

        {/* Dock Mobile (Rodapé) */}
        <div className="md:hidden">
          <SacredArtDock
            activeControlTab={activeControlTab}
            setActiveControlTab={setActiveControlTab}
            onDownload={handleDownload}
            onPostToFeed={handlePostToFeed}
            canPostToFeed={!!finalImg && !isPostingToFeed}
          />
        </div>

        <div className="md:hidden">
          <SacredArtDrawer
            activeControlTab={activeControlTab}
            setActiveControlTab={setActiveControlTab}
            galleryImages={galleryImages}
            currentUser={currentUser ? { uid: currentUser.uid } : null}
            setGalleryImages={setGalleryImages}
            setRawGeneratedBase64={setRawGeneratedBase64}
            editOptions={editOptions}
            setEditOptions={setEditOptions}
            selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            handleCreateClick={handleCreateClick}
            isGeneratingImg={isGeneratingImg}
            fileInputRef={fileInputRef}
            resetText={resetText}
            fontSizePx={currentTextLayout.verseFontSizePx}
            onFontSizePxChange={handleFontSizePxChange}
            styles={STYLES}
            fonts={FONTS}
            colors={COLORS}
            filters={FILTERS}
            fallbackImages={HARDCODED_FREE_IMAGES}
          />
        </div>
      </main>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
    </div>
  );
}
