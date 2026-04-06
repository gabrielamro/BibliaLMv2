"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '../../utils/router';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { generateVerseImage } from '../../services/pastorAgent';
import { bibleService } from '../../services/bibleService';
import { dbService } from '../../services/supabase';
import { optimizeImage } from '../../utils/imageOptimizer';
import { composeImageWithText, CompositionOptions } from '../../utils/imageCompositor';
import { 
  ImageIcon, Loader2, Download, Type, Palette, Sliders, AlignLeft, AlignCenter, AlignRight, Sun, Upload, Zap, Sparkles, Search, Move, X, Check
} from 'lucide-react';
import SEO from '../../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [viewMode, setViewMode] = useState<'setup' | 'editor'>('setup');
    const [activeControlTab, setActiveControlTab] = useState<'text' | 'style' | 'adjust' | 'templates'>('templates');
    const [galleryImages, setGalleryImages] = useState<any[]>([]);
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    
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
        textY: 50
    });

    useEffect(() => {
        setTitle('Estúdio de Arte Sacra');
        setBreadcrumbs([
            { label: 'Galeria', onClick: () => navigate('/artes-sacras') },
            { label: viewMode === 'editor' ? 'Editor' : 'Criar' }
        ]);
        
        const loadGallery = async () => {
            if (currentUser) {
                const data = await dbService.getSacredArtGallery(currentUser.uid);
                setGalleryImages(data);
            } else {
                const data = await dbService.getImageBank(20);
                setGalleryImages(data);
            }
        };
        loadGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, currentUser]);

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
        setShowChoiceModal(false);
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
                setViewMode('editor');
                
                // Salva na galeria de artes sacras (Acervo) - Bloco isolado para não travar a UI se o banco falhar
                if (currentUser) {
                    try {
                        await dbService.saveSacredArtImage(currentUser.uid, {
                            url: raw,
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
                        showNotification('Arte gerada com sucesso, mas houve um erro ao salvar no seu acervo (verifique se a tabela existe).', 'warning');
                    }
                }
            } else {
                showNotification('Não foi possível gerar a imagem pelos provedores disponíveis.', 'error');
            }
        } catch (e: any) {
            console.error('handleCreateArt unexpected error:', e);
            const errorMsg = e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
            showNotification(`Erro inesperado ao criar arte: ${errorMsg}`, 'error');
        } finally { setIsGeneratingImg(false); }
    };

    const handleSelectGallery = () => {
        setShowChoiceModal(false);
        setViewMode('editor');
        setActiveControlTab('templates');
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

        setShowChoiceModal(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const optimized = await optimizeImage(file);
                setRawGeneratedBase64(optimized.base64);
                setViewMode('editor');
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

    // Função para lidar com o Arrastre (Drag) do texto
    const handleDragEnd = (_: any, info: any) => {
        if (!canvasContainerRef.current) return;
        
        const container = canvasContainerRef.current;
        const rect = container.getBoundingClientRect();
        
        // Calcula a nova posição relativa (%)
        const relativeX = ((info.point.x - rect.left) / rect.width) * 100;
        const relativeY = ((info.point.y - rect.top) / rect.height) * 100;
        
        setEditOptions(prev => ({
            ...prev,
            textX: Math.max(5, Math.min(95, relativeX)),
            textY: Math.max(5, Math.min(95, relativeY))
        }));
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-black/40 flex flex-col relative overflow-hidden">
            <SEO title="Criar Arte Sacra | Estúdio" />
            
            {viewMode === 'setup' ? (
                <div className="flex-1 flex flex-col md:flex-row h-full">
                    {/* Setup Sidebar */}
                    <div className="w-full md:w-80 bg-white dark:bg-bible-darkPaper md:border-r border-gray-100 dark:border-gray-800 p-6 overflow-y-auto shrink-0 z-10">
                        <div className="flex items-center gap-3 mb-8">
                             <div className="w-10 h-10 bg-bible-gold rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Sparkles size={20} />
                             </div>
                             <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Estúdio IA</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Formato da Arte</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setEditOptions(p => ({...p, aspectRatio: 'feed'}))}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${editOptions.aspectRatio === 'feed' ? 'border-bible-gold bg-bible-gold/5 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}
                                    >
                                        <div className="w-6 h-6 border-2 border-current rounded-sm" />
                                        <span className="text-[9px] font-bold uppercase">Feed 1:1</span>
                                    </button>
                                    <button 
                                        onClick={() => setEditOptions(p => ({...p, aspectRatio: 'story'}))}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${editOptions.aspectRatio === 'story' ? 'border-bible-gold bg-bible-gold/5 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}
                                    >
                                        <div className="w-4 h-7 border-2 border-current rounded-sm" />
                                        <span className="text-[9px] font-bold uppercase">Story 9:16</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Mensagem Bíblica</label>
                                <div className="relative mb-3">
                                    <input 
                                        type="text" value={refInput} onChange={e => setRefInput(e.target.value)}
                                        className="w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-black/50 border border-transparent focus:border-bible-gold text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:outline-none transition-colors"
                                        placeholder="Ex: João 3:16"
                                    />
                                    {isSearchingVerse ? <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" /> : <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                                </div>
                                {foundVerse?.text && (
                                    <textarea 
                                        value={foundVerse.text} onChange={e => setFoundVerse({ ...foundVerse, text: e.target.value })}
                                        className="w-full bg-gray-100 dark:bg-black/50 border border-transparent focus:border-bible-gold text-gray-900 dark:text-white rounded-xl px-4 py-3 text-xs h-24 focus:outline-none transition-colors resize-none mb-4"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Estilo da IA</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {STYLES.map(style => (
                                        <button 
                                            key={style.id} onClick={() => setSelectedStyle(style.id)}
                                            className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${selectedStyle === style.id ? 'bg-bible-gold/10 border-bible-gold text-bible-gold' : 'border-transparent bg-gray-50 dark:bg-black/30'}`}
                                        >
                                            <span className="text-lg">{style.icon}</span>
                                            <span className="text-[8px] font-bold uppercase truncate w-full text-center">{style.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
                            <button 
                                onClick={handleCreateClick} disabled={isGeneratingImg}
                                className="w-full py-4 bg-bible-gold text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-bible-gold/80 transition-all disabled:opacity-50 shadow-lg shadow-bible-gold/20"
                            >
                                {isGeneratingImg ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16}/>}
                                {isGeneratingImg ? 'Gerando...' : 'Criar Arte'}
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 text-gray-500 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:text-bible-gold transition-colors">
                                <Upload size={14} /> Ou carregar imagem
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-50 dark:bg-black/20 p-4 md:p-12 flex items-center justify-center relative overflow-hidden">
                        <div className="relative z-0 flex flex-col items-center max-w-lg text-center">
                            <ImageIcon size={64} className="text-gray-200 dark:text-gray-800 mb-6" />
                            <h3 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-2">Seu Canvas Sagrado</h3>
                            <p className="text-gray-400 text-sm">Configure o versículo e o estilo na barra lateral para começar a criar sua obra.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                    <div className="w-full md:w-80 bg-white dark:bg-bible-darkPaper md:border-r border-gray-100 dark:border-gray-800 flex flex-col z-20">
                        <div className="flex border-b border-gray-100 dark:border-gray-800 shrink-0">
                            {[
                                { id: 'templates', icon: <ImageIcon size={18} />, label: 'Fundos' },
                                { id: 'text', icon: <Type size={18} />, label: 'Texto' },
                                { id: 'style', icon: <Palette size={18} />, label: 'Cores' },
                                { id: 'adjust', icon: <Sliders size={18} />, label: 'Ajustes' },
                            ].map(tab => (
                                <button 
                                    key={tab.id} onClick={() => setActiveControlTab(tab.id as any)}
                                    className={`flex-1 py-4 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeControlTab === tab.id ? 'text-bible-gold bg-bible-gold/5 border-b-2 border-bible-gold' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-black/20'}`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
                            {activeControlTab === 'templates' && (
                                <div className="space-y-4">
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                        {['Todas', 'Luz', 'Vida', 'Cruz', 'Paz', 'Amor', 'Geral'].map(cat => (
                                            <button 
                                                key={cat} 
                                                onClick={async () => {
                                                    if (currentUser) {
                                                        const filtered = await dbService.getSacredArtGallery(currentUser.uid, cat);
                                                        setGalleryImages(filtered);
                                                    }
                                                }}
                                                className="px-3 py-1 bg-gray-100 dark:bg-black/40 rounded-full text-[10px] font-bold text-gray-500 whitespace-nowrap hover:bg-bible-gold/20 hover:text-bible-gold transition-colors"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {galleryImages.map((img, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => setRawGeneratedBase64(img.url || img.image_url)}
                                                className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-all"
                                            >
                                                <img src={img.url || img.image_url} alt="Template" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-[8px] font-black text-white uppercase tracking-tighter bg-bible-gold/80 px-2 py-1 rounded-sm">{img.category || 'Geral'}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeControlTab === 'text' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Estilo de Fonte</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {FONTS.map(font => (
                                                <button 
                                                    key={font.id} onClick={() => setEditOptions(p => ({...p, fontFamily: font.id}))} 
                                                    className={`w-full px-4 py-3 rounded-xl border text-sm text-left transition-all ${editOptions.fontFamily === font.id ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400'}`} style={font.style}
                                                >
                                                    {font.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Alinhamento</label>
                                        <div className="flex bg-gray-100 dark:bg-black/50 rounded-xl p-1 gap-1">
                                            <button onClick={() => setEditOptions(p => ({...p, alignment: 'left'}))} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${editOptions.alignment === 'left' ? 'bg-white dark:bg-gray-800 shadow-sm text-bible-gold' : 'text-gray-400'}`}><AlignLeft size={18}/></button>
                                            <button onClick={() => setEditOptions(p => ({...p, alignment: 'center'}))} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${editOptions.alignment === 'center' ? 'bg-white dark:bg-gray-800 shadow-sm text-bible-gold' : 'text-gray-400'}`}><AlignCenter size={18}/></button>
                                            <button onClick={() => setEditOptions(p => ({...p, alignment: 'right'}))} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${editOptions.alignment === 'right' ? 'bg-white dark:bg-gray-800 shadow-sm text-bible-gold' : 'text-gray-400'}`}><AlignRight size={18}/></button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeControlTab === 'style' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Cores do Texto</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {COLORS.map(color => (
                                                <button key={color.id} onClick={() => setEditOptions(p => ({...p, textColor: color.value}))} className={`aspect-square rounded-full border-2 transition-transform ${editOptions.textColor === color.value ? 'border-bible-gold scale-110 shadow-lg' : 'border-transparent shadow-sm'}`} style={{ backgroundColor: color.value }}/>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Efeito de Filtro</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {FILTERS.map(f => (
                                                <button key={f.id} onClick={() => setEditOptions(p => ({...p, filter: f.id as any}))} className={`py-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all ${editOptions.filter === f.id ? 'border-bible-gold bg-bible-gold/5 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500'}`}>{f.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeControlTab === 'adjust' && (
                                <div className="space-y-6 pt-2">
                                     <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tamanho da Fonte</label>
                                        <input type="range" min="0.5" max="2.5" step="0.1" value={editOptions.fontSizeScale} onChange={(e) => setEditOptions(p => ({...p, fontSizeScale: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-gray-100 dark:bg-black/50 rounded-lg appearance-none cursor-pointer accent-bible-gold" />
                                     </div>
                                     <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escurecimento</label>
                                        <input type="range" min="0" max="0.9" step="0.05" value={editOptions.overlayOpacity} onChange={(e) => setEditOptions(p => ({...p, overlayOpacity: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-gray-100 dark:bg-black/50 rounded-lg appearance-none cursor-pointer accent-bible-gold" />
                                     </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-black/20">
                             <button onClick={handleDownload} className="w-full py-4 bg-bible-gold text-black font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-bible-gold/20">
                                <Download size={16} /> Baixar Arte
                             </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-black/60 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-10 bg-white/50 dark:bg-black/50 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setViewMode('setup')} className="p-2 text-gray-400 hover:text-bible-gold transition-colors">
                                    <Sparkles size={20} />
                                </button>
                                <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{editOptions.aspectRatio === 'story' ? 'Canvas Story (9:16)' : 'Canvas Feed (1:1)'}</span>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-auto custom-scrollbar pt-20">
                            <div 
                                ref={canvasContainerRef}
                                className={`relative bg-black shadow-2xl rounded-sm overflow-hidden flex items-center justify-center animate-in zoom-in-95 duration-500 ${editOptions.aspectRatio === 'story' ? 'aspect-[9/16] h-[75vh]' : 'aspect-square h-[60vh] md:h-[70vh]'}`}
                            >
                                {finalImg ? (
                                   <>
                                      <img src={finalImg} alt="Arte Final" className="w-full h-full object-contain pointer-events-none" />
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
                                            padding: '1rem',
                                            width: '80%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: editOptions.alignment === 'center' ? 'center' : editOptions.alignment === 'left' ? 'flex-start' : 'flex-end',
                                            zIndex: 50
                                        }}
                                        className="group"
                                      >
                                        <div className="absolute top-0 left-0 right-0 bottom-0 border-2 border-dashed border-bible-gold/30 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none" />
                                        <div className="absolute -top-4 -right-4 opacity-0 group-hover:opacity-100 bg-bible-gold text-black p-1 rounded-full shadow-lg transition-opacity pointer-events-none">
                                            <Move size={12} />
                                        </div>
                                        <p 
                                            className="font-bold leading-relaxed text-transparent select-none whitespace-pre-wrap"
                                            style={{ 
                                                fontFamily: editOptions.fontFamily,
                                                fontSize: `${2.2 * editOptions.fontSizeScale}vw`,
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            “{foundVerse?.text}”
                                        </p>
                                        <span 
                                            className="mt-2 font-black uppercase text-transparent select-none"
                                            style={{ 
                                                fontSize: `${1.4 * editOptions.fontSizeScale}vw`,
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            {foundVerse?.ref}
                                        </span>
                                      </motion.div>
                                   </>
                                ) : (
                                   <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-600">
                                      <Loader2 className="animate-spin text-bible-gold" size={40} />
                                   </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Escolha de Fundo */}
            <AnimatePresence>
                {showChoiceModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-bible-darkPaper w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800"
                        >
                            <div className="p-8">
                                <h3 className="text-2xl font-serif font-black text-gray-900 dark:text-white mb-2 leading-tight">Escolha o Fundo da Arte</h3>
                                <p className="text-sm text-gray-400 mb-8">Como você deseja começar sua obra sagrada?</p>
                                
                                <div className="space-y-4">
                                    <button 
                                        onClick={handleGenerateIA}
                                        className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-bible-gold/20 bg-bible-gold/5 hover:bg-bible-gold/10 hover:border-bible-gold transition-all text-left group"
                                    >
                                        <div className="w-14 h-14 bg-bible-gold rounded-xl flex items-center justify-center text-black shadow-lg group-hover:scale-110 transition-transform">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-1">Fundo Gerado IA</span>
                                            <span className="block text-xs text-gray-400">Gera uma imagem inédita baseada no contexto do versículo.</span>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={handleSelectGallery}
                                        className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-bible-gold/40 hover:bg-gray-50 dark:hover:bg-black/20 transition-all text-left group"
                                    >
                                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-bible-gold transition-colors">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-1">Selecionar da Galeria</span>
                                            <span className="block text-xs text-gray-400">Use uma arte profissional já existente em nosso acervo.</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-gray-50 dark:bg-black/20 flex justify-center border-t border-gray-100 dark:border-gray-800">
                                <button 
                                    onClick={() => setShowChoiceModal(false)}
                                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors py-2"
                                >
                                    Cancelar Operação
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
