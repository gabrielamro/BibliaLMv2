"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '../../utils/router';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { generateVerseImage } from '../../services/pastorAgent';
import { bibleService } from '../../services/bibleService';
import { dbService, uploadBlob } from '../../services/supabase';
import { optimizeImage } from '../../utils/imageOptimizer';
import { composeImageWithText, CompositionOptions } from '../../utils/imageCompositor';
import { 
  ImageIcon, Loader2, Download, Type, Palette, Sliders, AlignLeft, AlignCenter, AlignRight, Upload, Zap, Sparkles, Search, Move, Maximize
} from 'lucide-react';
import SEO from '../../components/SEO';
import { motion } from 'framer-motion';

const HARDCODED_FREE_IMAGES = [
    { url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400', category: 'Luz', prompt: 'Criação e Luz' },
    { url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400', category: 'Geral', prompt: 'Mar Vermelho' },
    { url: 'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=400', category: 'Paz', prompt: 'Jerusalém e Paz' },
    { url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400', category: 'Vida', prompt: 'Homem de fé' },
    { url: 'https://images.unsplash.com/photo-1548625361-ec85d51eb9dc?w=400', category: 'Cruz', prompt: 'Cruz iluminada' }
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

export default function CriarArteSacraPage() {
    const { currentUser, checkFeatureAccess, incrementUsage, recordActivity, showNotification, openSubscription, openLogin } = useAuth();
    const { setTitle, setBreadcrumbs } = useHeader();
    const navigate = useNavigate();
    const location = useLocation();

    // Refs para o Canvas
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    // Navigation State
    const state = location.state || {};

    const [refInput, setRefInput] = useState(state.verseRef || '');
    const [isSearchingVerse, setIsSearchingVerse] = useState(false);
    const searchTimeoutRef = useRef<any>(null);
    const [foundVerse, setFoundVerse] = useState<{ref: string, text: string} | null>(
        (state.verseText && state.verseRef) ? { ref: state.verseRef, text: state.verseText } : null
    );

    const [selectedStyle, setSelectedStyle] = useState(state.initialPrompt ? 'custom' : 'realistic');
    const [customPrompt, setCustomPrompt] = useState(state.initialPrompt || '');
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);

    const [rawGeneratedBase64, setRawGeneratedBase64] = useState<string | null>(null);
    const [finalImg, setFinalImg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeControlTab, setActiveControlTab] = useState<'text' | 'style' | 'templates' | 'ai' | null>(null);
    const [selectedLayer, setSelectedLayer] = useState<'text' | 'bg' | null>(null);
    const [galleryImages, setGalleryImages] = useState<any[]>(HARDCODED_FREE_IMAGES);
    
    const [editOptions, setEditOptions] = useState<CompositionOptions>({
        textColor: '#ffffff',
        fontSizeScale: 1,
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
        bgScale: 1
    });

    useEffect(() => {
        setTitle('Estúdio de Arte Sacra');
        setBreadcrumbs([
            { label: 'Galeria', onClick: () => navigate('/artes-sacras') },
            { label: 'Editor' }
        ]);
        
        const loadGallery = async () => {
            try {
                const userGal = currentUser ? await dbService.getSacredArtGallery(currentUser.uid) : [];
                const freeGal = await dbService.getImageBank(24);

                const mappedFree = freeGal.length > 0 ? freeGal.map((img: any) => ({
                    ...img,
                    url: img.image_url || img.url,
                    prompt: img.prompt || img.label || 'Arte Sacra'
                })).filter((img: any) => img.url) : HARDCODED_FREE_IMAGES;

                setGalleryImages([...userGal, ...mappedFree]);
            } catch (err) {
                console.error("Erro ao carregar galeria:", err);
                setGalleryImages(HARDCODED_FREE_IMAGES);
            }
        };
        loadGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    useEffect(() => {
        if (state.tool === 'image' && state.verseText) {
            setFoundVerse({ ref: state.verseRef || '', text: state.verseText });
            setRefInput(state.verseRef || '');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Busca automática do versículo ao digitar referência
    useEffect(() => {
        const ref = refInput.trim();
        if (ref.length > 2) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(async () => {
                setIsSearchingVerse(true);
                try {
                    const result = await bibleService.getVerseText(ref);
                    if (result) {
                        setFoundVerse({ ref: result.formattedRef, text: result.text });
                        // Alimenta a sugestão de prompt da IA caso esteja vazio ou seja o padrão
                        setCustomPrompt((prev: string) => {
                            if (!prev || prev.trim() === '') {
                                return `Uma representação artística e sagrada de ${result.formattedRef}: ${result.text.substring(0, 100)}... estilo cinematográfico, luz divina, 8k`;
                            }
                            return prev;
                        });
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearchingVerse(false);
                }
            }, 900);
        }
    }, [refInput]);

    // Live Preview
    useEffect(() => {
        const updatePreview = async () => {
            if (rawGeneratedBase64 && (foundVerse || customPrompt)) {
                try {
                    const text = foundVerse?.text || '';
                    const ref = foundVerse?.ref || '';
                    const composed = await composeImageWithText(rawGeneratedBase64, text, ref, editOptions);
                    setFinalImg(composed);
                } catch (e) {
                    console.error("Erro no preview", e);
                }
            }
        };
        const timeout = setTimeout(updatePreview, 150); 
        return () => clearTimeout(timeout);
    }, [editOptions, rawGeneratedBase64, foundVerse]);

    const handleGenerateIA = async () => {
        setIsGeneratingImg(true);
        try {
            const styleLabel = selectedStyle === 'custom' ? customPrompt : STYLES.find(s => s.id === selectedStyle)?.label || 'Realista';
            const contextText = foundVerse ? foundVerse.text : customPrompt;
            const contextRef = foundVerse ? foundVerse.ref : refInput || 'Arte IA';
            
            const result = await generateVerseImage(contextText, contextRef, styleLabel);
            if (result && result.data) {
                const cleanedData = result.data.replace(/\s/g, '');
                const raw = `data:${result.mimeType};base64,${cleanedData}`;
                setRawGeneratedBase64(raw); 
                if (!foundVerse) setFoundVerse({ ref: contextRef, text: contextText });
                
                // Salva na galeria de artes sacras (Acervo)
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
                            metadata: { generatedAt: new Date().toISOString() }
                        });

                        await incrementUsage('images');
                        await recordActivity('create_image', `Arte gerada e salva no acervo: ${contextRef}`);
                        
                        // Recarrega galeria interna
                        const updatedGallery = await dbService.getSacredArtGallery(currentUser.uid);
                        setGalleryImages(updatedGallery);
                    } catch (dbError: any) {
                        console.error('Erro ao salvar no banco (Acervo):', dbError);
                        showNotification('Arte gerada com sucesso, mas houve um erro ao salvar no seu acervo.', 'warning');
                    }
                }
            } else {
                showNotification('Não foi possível gerar a imagem pelos provedores disponíveis.', 'error');
            }
        } catch (e: any) {
            console.error('handleCreateArt unexpected error:', e);
            showNotification(`Erro inesperado ao criar arte.`, 'error');
        } finally { setIsGeneratingImg(false); }
    };

    const handleCreateClick = () => {
        if (!foundVerse && !refInput) {
            showNotification("Escolha um versículo ou referência bíblica!", "info");
            return;
        }

        if (currentUser) {
            const canAccess = checkFeatureAccess('aiImageGen');
            if (!canAccess) { openSubscription(); return; }
        } else {
            openLogin(); return;
        }

        handleGenerateIA();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const optimized = await optimizeImage(file);
                setRawGeneratedBase64(optimized.base64);
            } catch (err) { alert("Erro ao carregar imagem."); }
        }
    };

    const handleDownload = () => {
         if (!currentUser) { openLogin(); return; }
         if (finalImg) {
             const link = document.createElement('a');
             link.href = finalImg;
             link.download = `BibliaLM_${editOptions.aspectRatio}_${Date.now()}.png`;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
         }
    };

    const handleDragEnd = (_: any, info: any) => {
        if (!canvasContainerRef.current) return;
        const rect = canvasContainerRef.current.getBoundingClientRect();
        // Normaliza de 0 a 100 baseado no container
        const newX = Math.max(0, Math.min(100, ((info.point.x - rect.left) / rect.width) * 100));
        const newY = Math.max(0, Math.min(100, ((info.point.y - rect.top) / rect.height) * 100));
        
        setEditOptions(p => ({
            ...p,
            textX: newX,
            textY: newY
        }));
    };

    const handleBgDragEnd = (_: any, info: any) => {
        if (!canvasContainerRef.current) return;
        const rect = canvasContainerRef.current.getBoundingClientRect();
        
        // Movimento direto 1:1 baseado no delta em pixels convertido para %
        setEditOptions(p => ({
            ...p,
            bgX: Math.max(0, Math.min(100, (p.bgX ?? 50) + (info.delta.x / rect.width) * 100)),
            bgY: Math.max(0, Math.min(100, (p.bgY ?? 50) + (info.delta.y / rect.height) * 100))
        }));
    };

    // Função de Redimensionamento via Handle (Simples: Distância do centro)
    const handleResize = (type: 'text' | 'bg', delta: number) => {
        setEditOptions(p => {
            if (type === 'text') {
                const newScale = Math.max(0.5, Math.min(2.5, p.fontSizeScale + delta));
                return { ...p, fontSizeScale: newScale };
            } else {
                const newScale = Math.max(1, Math.min(3, (p.bgScale ?? 1) + delta));
                return { ...p, bgScale: newScale };
            }
        });
    };

    const resetText = () => {
        setEditOptions(p => ({
            ...p,
            textX: 50,
            textY: 50,
            fontSizeScale: 1,
            alignment: 'center'
        }));
    };

    const getCSSFilters = () => {
        switch (editOptions.filter) {
            case 'bw': return { filter: 'grayscale(100%)' };
            case 'sepia': return { filter: 'sepia(80%)' };
            case 'darken': return { filter: 'brightness(60%)' };
            case 'blur': return { filter: 'blur(4px)' };
            case 'warm': return { filter: 'sepia(30%) saturate(140%) hue-rotate(-10deg)' };
            case 'cool': return { filter: 'saturate(80%) hue-rotate(20deg) contrast(110%)' };
            default: return {};
        }
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-black flex flex-col relative overflow-hidden">
            <SEO title="Criar Arte Sacra | Estúdio" />
            
            {/* Floating Top Header (Canva Style) */}
            <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 md:px-8 z-50 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button 
                        onClick={() => navigate('/artes-sacras')}
                        className="p-2 bg-white/80 dark:bg-black/60 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:text-bible-gold transition-all"
                    >
                        <Search size={20} className="rotate-180" />
                    </button>
                    
                    {/* Compact Verse Search in Header */}
                    <div className="hidden md:flex items-center bg-white/80 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 shadow-lg">
                        <span className="text-[10px] font-black text-bible-gold uppercase tracking-widest mr-2">{foundVerse?.ref || 'Ref'}</span>
                        <input 
                            type="text" value={refInput} onChange={e => setRefInput(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-[10px] font-bold text-gray-900 dark:text-white w-24"
                            placeholder="João 3:16"
                        />
                        {isSearchingVerse && <Loader2 size={12} className="animate-spin text-bible-gold ml-2" />}
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Desktop Zoom Stats */}
                    <div className="hidden md:flex items-center px-4 py-1.5 bg-black/20 rounded-full backdrop-blur-sm border border-white/5 mr-4">
                        <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">{rawGeneratedBase64 ? 'Imagem Pronta' : 'Aguardando Fundo'}</span>
                    </div>

                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-5 py-2.5 bg-bible-gold text-black font-black uppercase tracking-widest text-[10px] rounded-full shadow-xl shadow-bible-gold/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Download size={16} /> <span className="hidden sm:inline">Baixar</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 relative flex flex-col items-center justify-center pt-20 pb-28 md:pb-0 overflow-hidden">
                {/* Mobile Verse Search - Floating Bar */}
                <div className="md:hidden absolute top-20 left-1/2 -translate-x-1/2 w-[90%] z-40">
                   <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl p-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input 
                                type="text" value={refInput} onChange={e => setRefInput(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 bg-gray-100 dark:bg-white/5 border-none focus:outline-none text-gray-900 dark:text-white rounded-xl text-[11px] font-bold"
                                placeholder="Ref: João 3:16"
                            />
                            {isSearchingVerse ? <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" /> : <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                        </div>
                        {foundVerse?.text && (
                            <button 
                                onClick={() => setActiveControlTab('text')}
                                className="p-2 bg-bible-gold/10 text-bible-gold rounded-xl border border-bible-gold/20"
                            >
                                <Type size={16} />
                            </button>
                        )}
                   </div>
                </div>

                {/* Centered Canvas Container */}
                    <div 
                        onClick={() => setSelectedLayer(null)}
                        className="flex-1 w-full flex items-center justify-center p-4 md:p-12 overflow-auto custom-scrollbar"
                    >

                        <div 
                            ref={canvasContainerRef}
                            className={`relative bg-bible-gold/10 shadow-2xl rounded-sm overflow-hidden flex items-center justify-center animate-in zoom-in-95 duration-500 select-none ${editOptions.aspectRatio === 'story' ? 'aspect-[9/16] h-[55vh] md:h-[75vh]' : 'aspect-square h-[45vh] md:h-[70vh]'}`}
                        >
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #c5a059 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            {rawGeneratedBase64 ? (
                                <div className="absolute inset-0 overflow-hidden group/canvas">
                                    {/* Layer 1: Background Draggable & Scalable */}
                                    <motion.div 
                                        drag
                                        dragMomentum={false}
                                        onDragEnd={handleBgDragEnd}
                                        onClick={(e) => { e.stopPropagation(); setSelectedLayer('bg'); }}
                                        className="absolute cursor-move group/bg"
                                        style={{ 
                                            width: `${100 * (editOptions.bgScale ?? 1)}%`,
                                            height: `${100 * (editOptions.bgScale ?? 1)}%`,
                                            left: `${(editOptions.bgX ?? 50) - (50 * (editOptions.bgScale ?? 1))}%`,
                                            top: `${(editOptions.bgY ?? 50) - (50 * (editOptions.bgScale ?? 1))}%`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 10
                                        }}
                                    >
                                        {/* Contextual Toolbar (BG) */}
                                        {selectedLayer === 'bg' && (
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-black/80 backdrop-blur-md px-2 py-1 rounded-full shadow-2xl border border-gray-200 dark:border-white/10 z-[60] pointer-events-auto">
                                                <button onClick={() => setActiveControlTab('templates')} className="p-1.5 hover:text-bible-gold transition-colors"><ImageIcon size={14} /></button>
                                                <button onClick={() => setActiveControlTab('ai')} className="p-1.5 hover:text-bible-gold transition-colors"><Zap size={14} /></button>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
                                                <button onClick={() => setEditOptions(p => ({ ...p, bgX: 50, bgY: 50, bgScale: 1 }))} className="p-1.5 hover:text-red-500 transition-colors"><Maximize size={14} className="rotate-45" /></button>
                                            </div>
                                        )}
                                        
                                        <img 
                                            src={rawGeneratedBase64} 
                                            alt="Preview Base" 
                                            className="w-full h-full object-cover pointer-events-none border border-white/20 shadow-2xl" 
                                            style={getCSSFilters()}
                                        />
                                        {/* BG Resize Handle (Canva-style Corner) */}
                                        <div 
                                           onClick={(e) => { e.stopPropagation(); setSelectedLayer('bg'); }}
                                           onMouseDown={(e) => {
                                               e.stopPropagation();
                                               setSelectedLayer('bg');
                                               const startX = e.clientX;
                                               const onMove = (me: MouseEvent) => {
                                                   const diff = (me.clientX - startX) / 400;
                                                   handleResize('bg', diff);
                                               };
                                               const onUp = () => {
                                                   window.removeEventListener('mousemove', onMove);
                                                   window.removeEventListener('mouseup', onUp);
                                               };
                                               window.addEventListener('mousemove', onMove);
                                               window.addEventListener('mouseup', onUp);
                                           }}
                                           onTouchStart={(e) => {
                                               e.stopPropagation();
                                               const startX = e.touches[0].clientX;
                                               const onMove = (te: TouchEvent) => {
                                                   const diff = (te.touches[0].clientX - startX) / 400;
                                                   handleResize('bg', diff);
                                               };
                                               const onUp = () => {
                                                   window.removeEventListener('touchmove', onMove);
                                                   window.removeEventListener('touchend', onUp);
                                               };
                                               window.addEventListener('touchmove', onMove);
                                               window.addEventListener('touchend', onUp);
                                           }}
                                           className="absolute bottom-2 right-2 w-7 h-7 md:w-6 md:h-6 bg-bible-gold rounded-full flex items-center justify-center cursor-nwse-resize opacity-0 group-hover/bg:opacity-100 transition-opacity z-50 shadow-lg border-2 border-white/40"
                                        >
                                           <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                        </div>
                                    </motion.div>

                                    {/* Layer 2: Overlay Gradient */}
                                    <div 
                                        className="absolute inset-0 pointer-events-none" 
                                        style={{ 
                                            background: `linear-gradient(to bottom, rgba(0,0,0,${Math.max(0, editOptions.overlayOpacity - 0.2)}), rgba(0,0,0,${editOptions.overlayOpacity}), rgba(0,0,0,${Math.min(1, editOptions.overlayOpacity + 0.2)}))` 
                                        }} 
                                    />
                                    
                                    {/* Layer 3: Text Draggable & Scalable */}
                                    {foundVerse?.text && (
                                        <motion.div 
                                            drag
                                            dragMomentum={false}
                                            onDragEnd={handleDragEnd}
                                            initial={false}
                                            style={{ 
                                                position: 'absolute',
                                                left: `${editOptions.textX}%`,
                                                top: `${editOptions.textY}%`,
                                                x: '-50%',
                                                y: '-50%',
                                                cursor: 'move',
                                                textAlign: editOptions.alignment as any,
                                                padding: '1.5rem',
                                                width: '85%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: editOptions.alignment === 'center' ? 'center' : editOptions.alignment === 'left' ? 'flex-start' : 'flex-end',
                                                zIndex: 50
                                            }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedLayer('text'); }}
                                            className="group/text"
                                        >
                                            {/* Contextual Toolbar (Text) */}
                                            {selectedLayer === 'text' && (
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-black/80 backdrop-blur-md px-2 py-1 rounded-full shadow-2xl border border-gray-200 dark:border-white/10 z-[60] pointer-events-auto">
                                                    <button onClick={() => setActiveControlTab('text')} className="p-1.5 hover:text-bible-gold transition-colors"><Type size={14} /></button>
                                                    <button onClick={() => setActiveControlTab('style')} className="p-1.5 hover:text-bible-gold transition-colors"><Palette size={14} /></button>
                                                    <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
                                                    <button onClick={resetText} className="p-1.5 hover:text-red-500 transition-colors"><Maximize size={14} className="rotate-45" /></button>
                                                </div>
                                            )}

                                            {/* Selection Box */}
                                            <div className="absolute inset-0 border border-bible-gold/60 rounded-xl opacity-0 group-hover/text:opacity-100 transition-opacity pointer-events-none">
                                                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-bible-gold rounded-full" />
                                                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-bible-gold rounded-full" />
                                                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-bible-gold rounded-full" />
                                            </div>

                                            {/* Resize Handle Text */}
                                            <div 
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLayer('text');
                                                    const startX = e.clientX;
                                                    const onMove = (me: MouseEvent) => {
                                                        const diff = (me.clientX - startX) / 300;
                                                        handleResize('text', diff);
                                                    };
                                                    const onUp = () => {
                                                        window.removeEventListener('mousemove', onMove);
                                                        window.removeEventListener('mouseup', onUp);
                                                    };
                                                    window.addEventListener('mousemove', onMove);
                                                    window.addEventListener('mouseup', onUp);
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    const startX = e.touches[0].clientX;
                                                    const onMove = (te: TouchEvent) => {
                                                        const diff = (te.touches[ te.touches.length - 1 ].clientX - startX) / 300;
                                                        handleResize('text', diff);
                                                    };
                                                    const onUp = () => {
                                                        window.removeEventListener('touchmove', onMove);
                                                        window.removeEventListener('touchend', onUp);
                                                    };
                                                    window.addEventListener('touchmove', onMove);
                                                    window.addEventListener('touchend', onUp);
                                                }}
                                                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 md:w-5 md:h-5 bg-bible-gold rounded-full opacity-0 group-hover/text:opacity-100 cursor-nwse-resize z-50 flex items-center justify-center shadow-lg border-2 border-white/40"
                                            >
                                                <div className="w-1 h-1 bg-black rounded-full" />
                                            </div>

                                            <p 
                                                className="font-bold leading-tight select-none whitespace-pre-wrap drop-shadow-2xl"
                                                style={{ 
                                                    fontFamily: editOptions.fontFamily,
                                                    fontSize: `${2.4 * editOptions.fontSizeScale}vw`,
                                                    color: editOptions.textColor,
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                “{foundVerse?.text}”
                                            </p>
                                            <span 
                                                className="mt-3 font-black uppercase text-bible-gold select-none tracking-widest drop-shadow-md"
                                                style={{ 
                                                    fontSize: `${1.2 * editOptions.fontSizeScale}vw`,
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                {foundVerse?.ref}
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-12 space-y-6">
                                    <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-800 border border-gray-800 animate-pulse">
                                        <ImageIcon size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-serif font-bold text-gray-400">Monte seu Canvas</h3>
                                        <p className="text-sm text-gray-500 max-w-xs">Escolha um fundo na galeria ao lado ou use a IA para gerar algo novo.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => setActiveControlTab('templates')} className="px-4 py-2 bg-gray-900 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-800 hover:text-bible-gold hover:border-bible-gold transition-all">Ver Galeria</button>
                                        <button onClick={() => setActiveControlTab('ai')} className="px-4 py-2 bg-bible-gold/10 text-bible-gold rounded-xl text-[10px] font-black uppercase tracking-widest border border-bible-gold/20 hover:bg-bible-gold/20 transition-all">Criar com IA</button>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>

                {/* Floating Bottom Dock (Canva Style) */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-[95%] z-50">
                    <div className="bg-white/80 dark:bg-black/60 backdrop-blur-2xl px-2 py-2 rounded-full border border-gray-200/50 dark:border-white/10 shadow-2xl flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'templates', icon: <ImageIcon size={18} />, label: 'Substituir' },
                            { id: 'ai', icon: <Sparkles size={18} />, label: 'IA' },
                            { id: 'text', icon: <Type size={18} />, label: 'Texto' },
                            { id: 'style', icon: <Palette size={18} />, label: 'Estilo' },
                        ].map(item => (
                            <button 
                                key={item.id}
                                onClick={() => setActiveControlTab(p => p === item.id ? null : item.id as any)}
                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${activeControlTab === item.id ? 'bg-bible-gold text-black font-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                {item.icon}
                                <span className="text-[7px] uppercase tracking-tighter font-black">{item.label}</span>
                            </button>
                        ))}
                        
                        {/* Final Check/Pronto Button */}
                        <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />
                        <button 
                            onClick={handleDownload}
                            className="bg-white dark:bg-white/10 p-3 rounded-full text-bible-gold hover:scale-110 transition-transform shadow-sm"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* Tool Drawer (Slide Up - Positioned above the dock) */}
                {activeControlTab && (
                    <motion.div 
                        initial={{ y: "20%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "20%", opacity: 0 }}
                        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[450px] z-40 bg-white/95 dark:bg-black/90 backdrop-blur-2xl rounded-[32px] border border-gray-200 dark:border-white/10 shadow-2xl max-h-[50vh] overflow-hidden flex flex-col"
                    >
                        {/* Drawer Handle */}
                        <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0" onClick={() => setActiveControlTab(null)} />
                        
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-bible-gold">
                                    {activeControlTab === 'templates' && 'Galeria de Fundos'}
                                    {activeControlTab === 'ai' && 'Gerador de Arte IA'}
                                    {activeControlTab === 'text' && 'Formatação de Texto'}
                                    {activeControlTab === 'style' && 'Estilo e Filtros'}
                                </h3>
                                <button onClick={() => setActiveControlTab(null)} className="text-gray-400 hover:text-white uppercase font-black text-[8px] tracking-widest">Fechar</button>
                            </div>

                            {activeControlTab === 'templates' && (
                                <div className="space-y-6">
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                        {['Todas', 'Luz', 'Vida', 'Cruz', 'Paz', 'Amor', 'Geral'].map(cat => (
                                            <button 
                                                key={cat} 
                                                onClick={async () => {
                                                    try {
                                                        const userGal = currentUser ? await dbService.getSacredArtGallery(currentUser.uid, cat === 'Todas' ? undefined : cat) : [];
                                                        const freeGal = await dbService.getImageBank(50);
                                                        const mappedFree = freeGal.length > 0 ? freeGal.map((img: any) => ({
                                                            ...img,
                                                            url: img.image_url || img.url,
                                                            prompt: img.prompt || img.label || 'Arte Sacra'
                                                        })).filter((img: any) => img.url) : HARDCODED_FREE_IMAGES;
                                                        
                                                        const filteredFree = cat === 'Todas' ? mappedFree : mappedFree.filter((img: any) => img.category === cat);
                                                        setGalleryImages([...userGal, ...filteredFree]);
                                                    } catch (e) { console.error(e); }
                                                }}
                                                className="px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-[9px] font-black text-gray-400 whitespace-nowrap hover:text-bible-gold transition-colors"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-6 gap-1 md:grid-cols-8 lg:grid-cols-10">
                                        {galleryImages.map((img, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => {
                                                    setRawGeneratedBase64(img.url || img.image_url);
                                                    setEditOptions(p => ({ ...p, bgX: 50, bgY: 50, bgScale: 1 }));
                                                }}
                                                className="aspect-square rounded-lg overflow-hidden border border-transparent hover:border-bible-gold transition-all shadow-sm group relative"
                                            >
                                                <img src={img.url || img.image_url} alt="Template" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl flex flex-col items-center gap-2 text-gray-500 hover:text-bible-gold hover:border-bible-gold transition-all"
                                    >
                                        <Upload size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Enviar do Dispositivo</span>
                                    </button>
                                </div>
                            )}

                            {activeControlTab === 'ai' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                                        {STYLES.map(style => (
                                            <button 
                                                key={style.id} onClick={() => setSelectedStyle(style.id)}
                                                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${selectedStyle === style.id ? 'bg-bible-gold/10 border-bible-gold text-bible-gold' : 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-500'}`}
                                            >
                                                <span className="text-xl">{style.icon}</span>
                                                <span className="text-[8px] font-black uppercase text-center leading-none">{style.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <textarea 
                                        value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-bible-gold text-gray-900 dark:text-white rounded-2xl p-4 text-[11px] h-24 focus:outline-none transition-all resize-none"
                                        placeholder="Descreva a imagem que você deseja criar..."
                                    />
                                    <button 
                                        onClick={handleCreateClick} disabled={isGeneratingImg}
                                        className="w-full py-4 bg-bible-gold text-black font-black uppercase tracking-widest text-[11px] rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-bible-gold/30 disabled:opacity-50 active:scale-95 transition-all"
                                    >
                                        {isGeneratingImg ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16}/>}
                                        {isGeneratingImg ? 'IA Gerando Imagem...' : 'Gerar Fundo Inédito'}
                                    </button>
                                </div>
                            )}

                            {activeControlTab === 'text' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tipografia</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {FONTS.map(font => (
                                                    <button 
                                                        key={font.id} onClick={() => setEditOptions(p => ({...p, fontFamily: font.id}))} 
                                                        className={`px-4 py-3 rounded-xl border text-[11px] text-left transition-all ${editOptions.fontFamily === font.id ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400'}`} style={font.style}
                                                    >
                                                        {font.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Alinhamento</label>
                                            <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1.5 gap-2">
                                                {['left', 'center', 'right'].map(align => (
                                                    <button 
                                                        key={align}
                                                        onClick={() => setEditOptions(p => ({...p, alignment: align as any}))} 
                                                        className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${editOptions.alignment === align ? 'bg-white dark:bg-gray-800 shadow-md text-bible-gold' : 'text-gray-400'}`}
                                                    >
                                                        {align === 'left' && <AlignLeft size={18}/>}
                                                        {align === 'center' && <AlignCenter size={18}/>}
                                                        {align === 'right' && <AlignRight size={18}/>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={resetText} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl text-[9px] font-black uppercase text-gray-400 hover:text-bible-gold transition-colors flex items-center justify-center gap-2">
                                            <Maximize size={16} /> Resetar Posição
                                        </button>
                                        <button onClick={() => setEditOptions(p => ({...p, fontSizeScale: 1}))} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl text-[9px] font-black uppercase text-gray-400 hover:text-bible-gold transition-colors flex items-center justify-center gap-2">
                                            <Type size={16} /> Escala Padrão
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeControlTab === 'style' && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cores do Texto</label>
                                        <div className="flex gap-4">
                                            {COLORS.map(color => (
                                                <button 
                                                    key={color.id} 
                                                    onClick={() => setEditOptions(p => ({...p, textColor: color.value}))} 
                                                    className={`w-10 h-10 rounded-full border-4 transition-transform ${editOptions.textColor === color.value ? 'border-bible-gold scale-110 shadow-lg' : 'border-transparent opacity-60'}`} 
                                                    style={{ backgroundColor: color.value }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Opacidade Fundo</label>
                                                <span className="text-[10px] font-black text-bible-gold">{Math.round(editOptions.overlayOpacity * 100)}%</span>
                                            </div>
                                            <input type="range" min="0" max="0.9" step="0.05" value={editOptions.overlayOpacity} onChange={(e) => setEditOptions(p => ({...p, overlayOpacity: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-bible-gold" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Filtros de Cor</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {FILTERS.map(f => (
                                                    <button key={f.id} onClick={() => setEditOptions(p => ({...p, filter: f.id as any}))} className={`py-2 rounded-xl border text-[8px] font-black uppercase transition-all ${editOptions.filter === f.id ? 'border-bible-gold text-bible-gold bg-bible-gold/5' : 'border-gray-200 dark:border-white/5 text-gray-500'}`}>{f.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </main>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
    );
}
