"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Download, LayoutGrid, Loader2, Search, Send, Smartphone, Sparkles } from 'lucide-react';

import SEO from '../../components/SEO';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';
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
import { kingdomPublishingService } from '../../services/kingdomPublishingService';
import { composeImageWithText, CompositionOptions } from '../../utils/imageCompositor';
import { base64ToBlob, optimizeImage } from '../../utils/imageOptimizer';
import { useLocation, useNavigate } from '../../utils/router';
import {
  FONT_SCALE_LIMITS,
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
  const [verseSearchVersion, setVerseSearchVersion] = useState(0);
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
  const [activeControlTab, setActiveControlTab] = useState<EditorControlTab>(null);
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
        const result = await bibleService.getTextByReference(ref);
        if (!result) {
          setFoundVerse(null);
          return;
        }

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
  }, [refInput, verseSearchVersion]);

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

  const handleGenerateIA = async (verse = foundVerse) => {
    setIsGeneratingImg(true);
    try {
      const styleLabel =
        selectedStyle === 'custom'
          ? customPrompt
          : STYLES.find((style) => style.id === selectedStyle)?.label || 'Realista';
      const contextText = verse ? verse.text : customPrompt.trim();
      const contextRef = verse ? verse.ref : refInput || 'Arte IA';

      if (!contextText) {
        showNotification('Pesquise um versiculo ou descreva a arte que deseja criar.', 'info');
        return;
      }

      const result = await generateVerseImage(contextText, contextRef, styleLabel);
      if (!result?.data) {
        showNotification('Não foi possível gerar a imagem pelos provedores disponíveis.', 'error');
        return;
      }

      const cleanedData = result.data.replace(/\s/g, '');
      const raw = `data:${result.mimeType};base64,${cleanedData}`;
      setRawGeneratedBase64(raw);

      if (!verse) {
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

  const handleCreateClick = async () => {
    if (isSearchingVerse) {
      showNotification('Aguarde a pesquisa do versiculo terminar.', 'info');
      return;
    }

    let verse = foundVerse;
    if (!verse && refInput.trim()) {
      setIsSearchingVerse(true);
      try {
        const result = await bibleService.getTextByReference(refInput);
        if (!result) {
          showNotification('Nao encontramos essa referencia. Confira o livro, capitulo e versiculo.', 'info');
          return;
        }
        verse = { ref: result.formattedRef, text: result.text };
        setFoundVerse(verse);
      } catch (error) {
        console.error('Erro ao pesquisar versiculo antes da geracao:', error);
        showNotification('Nao foi possivel pesquisar o versiculo agora. Tente novamente.', 'error');
        return;
      } finally {
        setIsSearchingVerse(false);
      }
    }

    if (!verse && !customPrompt.trim()) {
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

    await handleGenerateIA(verse);
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
    link.download = `CultoMais_${editOptions.aspectRatio}_${Date.now()}.png`;
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
      const aspectRatio = editOptions.aspectRatio ?? 'feed';
      const blob = finalImg.startsWith('data:')
        ? await base64ToBlob(finalImg)
        : await fetch(finalImg).then((response) => response.blob());
      const imageUrl = await uploadBlob(blob, `posts/${currentUser.uid}/${aspectRatio}/${Date.now()}.webp`);

      const caption = foundVerse
        ? `📖 ${foundVerse.ref}\n\n"${foundVerse.text}"`
        : customPrompt || 'Arte sacra criada no Culto+';

      const post = await kingdomPublishingService.publish({
        publisher: {
          userId: currentUser.uid,
          displayName: userProfile.displayName,
          username: userProfile.username,
          photoURL: userProfile.photoURL,
        },
        type: 'image',
        content: caption,
        imageUrl,
        sourceType: 'sacred_art',
        sourceId: `sacred_art:${aspectRatio}`,
        metadata: {
          ...(foundVerse ? { verseReference: foundVerse.ref } : {}),
          aspectRatio,
          imageAlt: foundVerse
            ? `Arte sacra com ${foundVerse.ref}`
            : 'Arte sacra criada no Culto+',
        },
      });

      try {
        await recordActivity('social_post', 'Postou uma arte sacra no Reino');
      } catch (activityError) {
        console.warn('Arte publicada, mas a atividade não foi registrada.', activityError);
      }

      showNotification('Arte publicada no Reino!', 'success');
      navigate('/social', { state: { refreshFeed: true, highlightPostId: post.id } });
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

  const sharedDrawerProps = {
    activeControlTab,
    setActiveControlTab,
    galleryImages,
    currentUser: currentUser ? { uid: currentUser.uid } : null,
    setGalleryImages,
    setRawGeneratedBase64,
    editOptions,
    setEditOptions,
    selectedStyle,
    setSelectedStyle,
    customPrompt,
    setCustomPrompt,
    handleCreateClick,
    isGeneratingImg,
    fileInputRef,
    resetText,
    fontSizePx: currentTextLayout.verseFontSizePx,
    onFontSizePxChange: handleFontSizePxChange,
    styles: STYLES,
    fonts: FONTS,
    colors: COLORS,
    filters: FILTERS,
    fallbackImages: HARDCODED_FREE_IMAGES,
  };
  const studioStep = !foundVerse ? 1 : !rawGeneratedBase64 ? 2 : selectedLayer ? 3 : 4;

  return (
    <CultoPlusPageShell compactDesktop>
    <div className="relative flex h-[calc(100dvh-89px)] min-h-0 flex-col overflow-hidden bg-[#f4efe7] text-[#17211f] dark:bg-[#0b0b0c] dark:text-gray-100 lg:h-[100dvh]">
      <SEO title="Criar Arte Sacra | Culto+" />

      <header className="relative z-50 shrink-0 border-b border-[#ddd5ca] bg-[#fffdf9]/95 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-[#111113]/95 md:px-5">
        <div className="mx-auto flex max-w-[1920px] items-center gap-3">
          <button type="button" onClick={() => navigate('/newhome?tab=criar')} aria-label="Voltar ao estúdio criativo" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#ddd5ca] bg-white text-gray-600 transition hover:border-[#c5a059] hover:text-[#8b611b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5148] dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
            <ArrowLeft size={19} />
          </button>
          <div className="min-w-0 border-l border-[#e6dfd5] pl-3 dark:border-white/10">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b611b]">Criar · Arte Sacra</p>
            <h1 className="truncate font-serif text-lg font-bold text-[#14253a] dark:text-white md:text-xl">Estúdio de Arte Sacra</h1>
          </div>

          <ol className="mx-auto hidden min-w-[420px] max-w-[560px] flex-1 items-center justify-center lg:flex" aria-label="Etapas da criação">
            {['Palavra', 'Criar', 'Ajustar', 'Publicar'].map((label, index) => {
              const step = index + 1;
              const complete = studioStep > step;
              const active = studioStep === step;
              return <li key={label} className="flex flex-1 items-center last:flex-none"><span className="flex flex-col items-center gap-1"><span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black ${complete ? 'border-[#0b5148] bg-[#0b5148] text-white' : active ? 'border-[#c5a059] bg-[#c5a059] text-[#17211f]' : 'border-[#d8d0c5] bg-white text-gray-400 dark:bg-white/5'}`}>{complete ? <Check size={14} /> : step}</span><small className={`text-[9px] font-bold ${active ? 'text-[#8b611b]' : 'text-gray-500'}`}>{label}</small></span>{step < 4 && <span className={`mx-2 h-px flex-1 ${complete ? 'bg-[#0b5148]' : 'bg-[#d8d0c5] dark:bg-white/10'}`} />}</li>;
            })}
          </ol>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button type="button" onClick={handleDownload} disabled={!finalImg} className="hidden min-h-11 items-center gap-2 rounded-xl border border-[#d8d0c5] bg-white px-4 text-xs font-black text-[#26342f] transition hover:border-[#c5a059] disabled:cursor-not-allowed disabled:opacity-40 sm:flex dark:border-white/10 dark:bg-white/5 dark:text-white"><Download size={16} /> Baixar</button>
            <button type="button" onClick={handlePostToFeed} disabled={!finalImg || isPostingToFeed} className="flex min-h-11 items-center gap-2 rounded-xl bg-[#0b5148] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#073f38] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"><Send size={16} /> <span className="hidden sm:inline">Publicar no Reino</span><span className="sm:hidden">Publicar</span></button>
          </div>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-2 md:p-3">
        <section className="mb-2 shrink-0 rounded-2xl border border-[#ded7cd] bg-[#fffdf9] p-2.5 shadow-sm dark:border-white/10 dark:bg-[#151515] xl:hidden" aria-label="Escolher Palavra">
          <div className="flex items-center gap-2">
            <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#d9d1c6] bg-white px-3 focus-within:border-[#0b5148] dark:border-white/10 dark:bg-white/5">
              <BookOpen size={16} className="shrink-0 text-[#0b5148]" />
              <input type="text" value={refInput} onChange={(event) => setRefInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); setVerseSearchVersion((version) => version + 1); } }} aria-label="Versículo ou referência" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="Ex.: Filipenses 4:6–7" />
              {isSearchingVerse && <Loader2 size={15} className="animate-spin text-[#c5a059]" />}
              <button type="button" onClick={() => setVerseSearchVersion((version) => version + 1)} disabled={isSearchingVerse} aria-label="Pesquisar versículo" title="Pesquisar versículo" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#0b5148] hover:bg-[#0b5148]/10 disabled:opacity-50"><Search size={16} /></button>
            </div>
            <button type="button" onClick={() => setActiveControlTab('ai')} aria-label="Criar com inteligência artificial" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c5a059] text-[#17211f]"><Sparkles size={18} /></button>
          </div>
          {foundVerse && <p className="mt-1.5 min-w-0 truncate px-1 font-serif text-[11px] text-gray-600 dark:text-gray-300">{foundVerse.ref} · “{foundVerse.text}”</p>}
        </section>
        <div className="mx-auto grid min-h-0 w-full max-w-[1920px] flex-1 grid-cols-1 gap-3 xl:grid-cols-[310px_minmax(420px,1fr)_330px]">
          <aside className="hidden min-h-0 flex-col gap-3 overflow-hidden xl:flex" aria-label="Origem e criação da arte">
            <section data-testid="sacred-art-word-panel" className="shrink-0 rounded-[20px] border border-[#ded7cd] bg-[#fffdf9] p-3 shadow-sm dark:border-white/10 dark:bg-[#151515]">
              <div className="flex items-center gap-2"><BookOpen size={16} className="text-[#0b5148]" /><div><p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#8b611b]">Etapa 1</p><h2 className="font-serif text-base font-bold">Comece pela Palavra</h2></div></div>
              <label htmlFor="sacred-art-verse" className="mt-2.5 block text-[8px] font-black uppercase tracking-[0.14em] text-gray-500">Versículo ou referência</label>
              <div className="mt-1.5 flex min-h-10 items-center gap-2 rounded-xl border border-[#d9d1c6] bg-white px-3 focus-within:border-[#0b5148] focus-within:ring-2 focus-within:ring-[#0b5148]/10 dark:border-white/10 dark:bg-white/5">
                <BookOpen size={16} className="shrink-0 text-[#0b5148]" />
                <input id="sacred-art-verse" type="text" value={refInput} onChange={(event) => setRefInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); setVerseSearchVersion((version) => version + 1); } }} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="Ex.: Filipenses 4:6–7" />
                {isSearchingVerse && <Loader2 size={15} className="animate-spin text-[#c5a059]" />}
                <button type="button" onClick={() => setVerseSearchVersion((version) => version + 1)} disabled={isSearchingVerse} aria-label="Pesquisar versículo" title="Pesquisar versículo" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#0b5148] hover:bg-[#0b5148]/10 disabled:opacity-50"><Search size={16} /></button>
              </div>
              {foundVerse ? <div className="mt-2 rounded-xl border border-emerald-900/10 bg-[#eef7f2] p-2.5 dark:bg-emerald-950/20"><p className="line-clamp-2 font-serif text-[11px] leading-4 text-[#33473f] dark:text-emerald-50">“{foundVerse.text}”</p><strong className="mt-1.5 block text-[8px] uppercase tracking-[0.14em] text-[#0b5148]">{foundVerse.ref}</strong></div> : <p className="mt-2 text-[10px] leading-4 text-gray-500">Digite uma referência e encontre o texto automaticamente.</p>}
            </section>
            <div className="min-h-0 flex-1"><SacredArtDrawer {...sharedDrawerProps} desktopInline mode="creation" /></div>
          </aside>

          <section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[26px] border border-black/10 bg-[#171a19] shadow-[0_24px_60px_-32px_rgba(0,0,0,0.55)]" aria-label="Canvas da arte">
            <div data-testid="sacred-art-canvas-toolbar" className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 text-white/70 sm:px-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Salvo automaticamente</span>
              <div className="flex shrink-0 rounded-xl bg-white/5 p-1" role="group" aria-label="Formato da arte">
                <button data-testid="sacred-art-format-feed" type="button" onClick={() => setEditOptions((current) => ({ ...current, aspectRatio: 'feed' }))} aria-pressed={editOptions.aspectRatio === 'feed'} className={`flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-black uppercase transition sm:px-3 ${editOptions.aspectRatio === 'feed' ? 'bg-[#0b5148] text-white shadow-sm' : 'text-white/55 hover:bg-white/10 hover:text-white'}`}><LayoutGrid size={13} /> Feed <span className="hidden sm:inline">1:1</span></button>
                <button data-testid="sacred-art-format-story" type="button" onClick={() => setEditOptions((current) => ({ ...current, aspectRatio: 'story' }))} aria-pressed={editOptions.aspectRatio === 'story'} className={`flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-black uppercase transition sm:px-3 ${editOptions.aspectRatio === 'story' ? 'bg-[#0b5148] text-white shadow-sm' : 'text-white/55 hover:bg-white/10 hover:text-white'}`}><Smartphone size={13} /> Story <span className="hidden sm:inline">9:16</span></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
              <div className="flex min-h-full items-center justify-center">
                <SacredArtCanvas
                  canvasContainerRef={canvasContainerRef}
                  rawGeneratedBase64={rawGeneratedBase64}
                  foundVerse={foundVerse}
                  editOptions={editOptions}
                  selectedLayer={selectedLayer}
                  setSelectedLayer={setSelectedLayer}
                  onBgDragEnd={handleBgDragEnd}
                  onTextDragEnd={handleDragEnd}
                  onCanvasResize={setCanvasSize}
                  onFontSizeScaleChange={(newScale) => setEditOptions((previous) => ({ ...previous, fontSizeScale: Math.max(0.01, newScale) }))}
                  onBgScaleChange={(newScale) => setEditOptions((previous) => ({ ...previous, bgScale: Math.max(1, Math.min(5, newScale)) }))}
                  getCSSFilters={getCSSFilters}
                />
              </div>
            </div>
            <div className="hidden min-h-14 shrink-0 items-center justify-center gap-2 border-t border-white/10 px-3 text-white/65 md:flex">
              <button type="button" onClick={() => setSelectedLayer('bg')} className={`min-h-9 rounded-lg px-3 text-[10px] font-bold ${selectedLayer === 'bg' ? 'bg-[#c5a059] text-black' : 'bg-white/5 hover:bg-white/10'}`}>Imagem</button>
              <button type="button" onClick={() => { setSelectedLayer('text'); setActiveControlTab('text'); }} className={`min-h-9 rounded-lg px-3 text-[10px] font-bold ${selectedLayer === 'text' ? 'bg-[#c5a059] text-black' : 'bg-white/5 hover:bg-white/10'}`}>Texto</button>
              <span className="mx-1 h-5 w-px bg-white/10" />
              <span className="text-[9px] uppercase tracking-[0.12em]">Arraste os elementos diretamente na arte</span>
            </div>
          </section>

          <aside className="hidden min-h-0 flex-col gap-3 overflow-hidden xl:flex" aria-label="Ajustes e publicação">
            <div className="min-h-0 flex-1"><SacredArtDrawer {...sharedDrawerProps} desktopInline mode="inspector" /></div>
            <section className="shrink-0 rounded-[24px] border border-[#ded7cd] bg-[#fffdf9] p-3 shadow-sm dark:border-white/10 dark:bg-[#151515]">
              <button type="button" onClick={handleDownload} disabled={!finalImg} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d8d0c5] bg-white text-xs font-black disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5"><Download size={16} /> Baixar PNG</button>
              <button type="button" onClick={handlePostToFeed} disabled={!finalImg || isPostingToFeed} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b5148] text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /> {isPostingToFeed ? 'Publicando...' : 'Publicar no Reino'}</button>
            </section>
          </aside>
        </div>

        <div className="xl:hidden"><SacredArtDock activeControlTab={activeControlTab} setActiveControlTab={setActiveControlTab} onDownload={handleDownload} onPostToFeed={handlePostToFeed} canPostToFeed={!!finalImg && !isPostingToFeed} /></div>
        <div className="xl:hidden"><SacredArtDrawer {...sharedDrawerProps} /></div>
      </main>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
    </div>
    </CultoPlusPageShell>
  );
}
