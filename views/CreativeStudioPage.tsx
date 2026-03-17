"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, ImageIcon, Headphones, Sparkles, Plus, 
  Search, Palette, Mic2, Loader2, ArrowRight, 
  CheckCircle2, Share2, Info, LayoutTemplate, Download,
  Type, MoveVertical, AlignCenter, AlignLeft, AlignRight,
  Aperture, Droplets, Sun, Upload, Camera, Layers, ArrowLeft, Rss, X, Sliders, Home
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import { useHeader } from '../contexts/HeaderContext';
import { bibleService } from '../services/bibleService';
import { generateVerseImage } from '../services/geminiService';
import usePodcastGenerator from '../hooks/usePodcastGenerator';
import { PodcastPlayer } from '../components/reader/PodcastPlayer';
import SEO from '../components/SEO';
import { composeImageWithText, CompositionOptions } from '../utils/imageCompositor';
import { optimizeImage } from '../utils/imageOptimizer';

import { dbService } from '../services/supabase';

// --- CONFIGURATION CONSTANTS ---
const STYLES = [
  { id: 'realistic', label: 'Realista', icon: '📸' },
  { id: 'oil_painting', label: 'Óleo', icon: '🎨' },
  { id: 'cinematic', label: 'Cine', icon: <ImageIcon size={16}/> },
  { id: 'watercolor', label: 'Aquarela', icon: '💧' },
  { id: 'sketch', label: 'Esboço', icon: '✏️' },
  { id: 'custom', label: 'Manual', icon: <Wand2 size={16}/> },
];

const COLORS = [
    { id: 'white', value: '#ffffff', label: 'Branco' },
    { id: 'black', value: '#000000', label: 'Preto' },
    { id: 'gold', value: '#c5a059', label: 'Dourado' },
    { id: 'red', value: '#ef4444', label: 'Carmim' },
    { id: 'blue', value: '#3b82f6', label: 'Real' },
];

const FONTS = [
    { id: 'Lora', label: 'Clássica', style: { fontFamily: 'Lora, serif' } },
    { id: 'Great Vibes', label: 'Cursiva', style: { fontFamily: '"Great Vibes", cursive' } },
    { id: 'Oswald', label: 'Moderna', style: { fontFamily: 'Oswald, sans-serif', fontWeight: 'bold' } },
    { id: 'Cinzel', label: 'Épica', style: { fontFamily: 'Cinzel, serif' } },
    { id: 'Playfair Display', label: 'Elegante', style: { fontFamily: '"Playfair Display", serif' } },
];

const FILTERS = [
    { id: 'none', label: 'Normal' },
    { id: 'darken', label: 'Escuro' },
    { id: 'bw', label: 'P&B' },
    { id: 'sepia', label: 'Sépia' },
    { id: 'warm', label: 'Quente' },
    { id: 'cool', label: 'Frio' },
    { id: 'blur', label: 'Desfocar' },
];

const FeatureDisabled = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black animate-in fade-in">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
            <Wand2 className="text-gray-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Em Breve</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            O Estúdio Criativo está sendo preparado para você criar artes incríveis.
        </p>
    </div>
);

const CreativeStudioPage: React.FC = () => {
    const { currentUser, userProfile, checkFeatureAccess, incrementUsage, recordActivity, showNotification, openSubscription, openLogin } = useAuth();
    const { isFeatureEnabled } = useFeatures();
    const { setTitle, setBreadcrumbs } = useHeader();
    const navigate = useNavigate();
    const location = useLocation();
    
    if (!isFeatureEnabled('module_studio')) {
        return <FeatureDisabled />;
    }

    // Initial State from Navigation
    const state = location.state as { fromReader?: boolean, bookId?: string, chapter?: number, verseText?: string, verseRef?: string, tool?: 'image' | 'podcast' };

    // Mode & Workflow State
    const [activeTool, setActiveTool] = useState<'image' | 'podcast'>(state?.tool || 'image');
    const [viewMode, setViewMode] = useState<'setup' | 'editor'>('setup'); // 'setup' = Form, 'editor' = Canvas + Controls
    
    // Content Data
    const [refInput, setRefInput] = useState('');
    const [foundVerse, setFoundVerse] = useState<{ref: string, text: string} | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    
    // Image Generation State
    const [selectedStyle, setSelectedStyle] = useState('realistic');
    const [customPrompt, setCustomPrompt] = useState('');
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);
    const [rawGeneratedBase64, setRawGeneratedBase64] = useState<string | null>(null);
    const [finalImg, setFinalImg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Editor UI State
    const [activeControlTab, setActiveControlTab] = useState<'text' | 'style' | 'adjust'>('text');
    const [editOptions, setEditOptions] = useState<CompositionOptions>({
        textColor: '#ffffff',
        fontSizeScale: 1,
        verticalPosition: 50,
        alignment: 'center',
        fontFamily: 'Lora',
        filter: 'none',
        overlayOpacity: 0.4
    });
    
    // Podcast State
    const [isPostingPodcast, setIsPostingPodcast] = useState(false);
    const { 
        isPlayerOpen, isGenerating: isGeneratingPod, isPlaying, 
        podcastData, generationPhase, playerState, generatePodcast, 
        stopAndClosePodcast, togglePlayPause, seek, skip, 
        setPlaybackRate, savePodcast 
    } = usePodcastGenerator();

    // --- EFFECTS ---
    useEffect(() => {
        if (state?.verseText && state?.verseRef) {
            setFoundVerse({ ref: state.verseRef, text: state.verseText });
            setRefInput(state.verseRef);
        }
    }, [state]);

    // Update global header title and breadcrumbs
    useEffect(() => {
        if (viewMode === 'setup') {
            setTitle('Estúdio Criativo');
            setBreadcrumbs([]);
        } else {
            setTitle('Editando Arte');
            setBreadcrumbs([
                { label: 'Estúdio', onClick: () => setViewMode('setup') },
                { label: foundVerse?.ref || 'Arte' }
            ]);
        }
    }, [viewMode, foundVerse, setTitle, setBreadcrumbs]);

    // Live Compositor Preview
    useEffect(() => {
        const updatePreview = async () => {
            if (rawGeneratedBase64 && foundVerse) {
                try {
                    const composed = await composeImageWithText(
                        rawGeneratedBase64, 
                        foundVerse.text, 
                        foundVerse.ref, 
                        editOptions
                    );
                    setFinalImg(composed);
                } catch (e) { console.error("Erro ao compor preview", e); }
            }
        };
        // Debounce para performance
        const timeout = setTimeout(updatePreview, 50); 
        return () => clearTimeout(timeout);
    }, [editOptions, rawGeneratedBase64, foundVerse]);

    // --- HANDLERS ---
    const handleSearch = async () => {
        if (!refInput.trim()) return;
        setIsSearching(true);
        try {
            const res = await bibleService.getVerseText(refInput);
            if (res) setFoundVerse({ ref: res.formattedRef, text: res.text });
            else showNotification("Referência não encontrada.", "error");
        } finally { setIsSearching(false); }
    };

    const handleCreateArt = async () => {
        // STRATEGY: Hook Model (Isca)
        // 1. Se logado, checa limite.
        // 2. Se não logado, PERMITE gerar (mas bloqueará o download depois).
        
        if (currentUser) {
            const canAccess = checkFeatureAccess('aiImageGen');
            if (!canAccess) { openSubscription(); return; }
        }
        
        if (!foundVerse && activeTool === 'image') { showNotification("Escolha um versículo.", "info"); return; }

        setIsGeneratingImg(true);
        try {
            const styleLabel = selectedStyle === 'custom' ? customPrompt : STYLES.find(s => s.id === selectedStyle)?.label || 'Realista';
            const result = await generateVerseImage(foundVerse!.text, foundVerse!.ref, styleLabel);
            if (result) {
                const raw = `data:${result.mimeType};base64,${result.data}`;
                setRawGeneratedBase64(raw); 
                setViewMode('editor'); // Transição para o modo Editor
                
                if (currentUser) {
                    await incrementUsage('images');
                    await recordActivity('create_image', `Arte gerada no estúdio: ${foundVerse!.ref}`);
                }
            }
        } catch (e) {
            showNotification("Erro ao criar arte. Tente novamente.", "error");
        } finally { setIsGeneratingImg(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const optimized = await optimizeImage(file);
                setRawGeneratedBase64(optimized.base64);
                setEditOptions(prev => ({...prev, filter: 'none', overlayOpacity: 0.3}));
                if(foundVerse) setViewMode('editor');
                else showNotification("Selecione um versículo primeiro.", "info");
            } catch (err) {
                showNotification("Erro ao carregar imagem.", "error");
            }
        }
    };

    const handlePostArtToFeed = () => {
        if (!currentUser) {
            openLogin(); // BLOCK: Apenas usuários logados podem postar
            return;
        }

        if (!finalImg) return;
        navigate('/social', { 
            state: { 
                openCreate: 'image',
                prefilledImage: finalImg,
                prefilledCaption: `Meditando em ${foundVerse?.ref}... #BibliaLM`
            }
        });
    };

    const handleGeneratePodcast = () => {
        if (foundVerse) {
            // STRATEGY: Hook Model (Isca)
            if (currentUser) {
                 const canAccess = checkFeatureAccess('aiPodcastGen');
                 if (!canAccess) { openSubscription(); return; }
            }
            // Guest: Permite gerar. O componente Player bloqueará o "Salvar".
            generatePodcast(foundVerse.ref, foundVerse.text);
        }
    };

    const handleDownload = () => {
        if (!currentUser) {
            openLogin(); // BLOCK: Apenas usuários logados podem baixar
            return;
        }
        if (finalImg) {
            const link = document.createElement('a');
            link.href = finalImg;
            link.download = `BibliaLM_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification("Imagem salva!", "success");
        }
    };
    
    const handleExit = () => {
        if (currentUser) navigate('/');
        else navigate('/intro');
    };

    // --- RENDERERS ---

    // 1. SETUP VIEW (O Formulário Inicial OTIMIZADO)
    const renderSetupView = () => (
        <div className="flex flex-col h-full p-4 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 overflow-y-auto no-scrollbar">
            
            {/* Top Toggle Switch - Cleaner */}
            <div className="flex justify-center mb-6">
                <div className="bg-white dark:bg-bible-darkPaper p-1 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm flex">
                    <button onClick={() => setActiveTool('image')} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${activeTool === 'image' ? 'bg-bible-leather dark:bg-bible-gold text-white dark:text-black shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                        <ImageIcon size={14}/> Artes
                    </button>
                    <button onClick={() => setActiveTool('podcast')} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${activeTool === 'podcast' ? 'bg-bible-leather dark:bg-bible-gold text-white dark:text-black shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                        <Headphones size={14}/> Podcast
                    </button>
                </div>
            </div>

            {/* Input Verse - Compact */}
            <div className="bg-white dark:bg-bible-darkPaper p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-lg mb-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">1. Passagem Bíblica</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={refInput}
                            onChange={(e) => setRefInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Ex: Salmos 23" 
                            className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold/50"
                        />
                        <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-bible-gold transition-colors">
                            {isSearching ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                        </button>
                    </div>
                </div>
                {foundVerse && (
                    <div className="mt-3 p-3 bg-bible-gold/10 border border-bible-gold/20 rounded-xl">
                        <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">"{foundVerse.text}"</p>
                    </div>
                )}
            </div>

            {/* Image Controls - Only if Image Tool */}
            {activeTool === 'image' && (
                <div className="bg-white dark:bg-bible-darkPaper p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-lg mb-6">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3 block">2. Estilo Visual</label>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                        {STYLES.map(style => (
                            <button 
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedStyle === style.id ? 'border-bible-gold bg-bible-gold/5' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <span className="text-xl mb-1">{typeof style.icon === 'string' ? style.icon : style.icon}</span>
                                <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">{style.label}</span>
                            </button>
                        ))}
                    </div>

                    {selectedStyle === 'custom' && (
                        <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                             <input 
                                type="text" 
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Descreva o estilo (ex: Cyberpunk, Vitral Gótico...)" 
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-bible-gold/50"
                            />
                        </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                        <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1"></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">OU</span>
                        <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1"></div>
                    </div>

                    <div className="mt-3 text-center">
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-bible-gold hover:underline flex items-center justify-center gap-2">
                            <Upload size={14}/> Carregar minha foto
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>
                </div>
            )}

            {/* Main Action Button */}
            <button 
                onClick={activeTool === 'image' ? handleCreateArt : handleGeneratePodcast}
                disabled={isGeneratingImg || isGeneratingPod || !foundVerse}
                className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGeneratingImg || isGeneratingPod ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} fill="currentColor"/>}
                {activeTool === 'image' ? 'Gerar Arte Sacra' : 'Gerar Podcast IA'}
            </button>
        </div>
    );

    // 2. EDITOR VIEW (O Canvas de Edição)
    const renderEditorView = () => (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-black relative">
            
            {/* Canvas Area - Centralized */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
                {/* Floating Actions on Canvas Area */}
                <div className="absolute top-4 right-4 z-30 flex gap-2">
                    <button onClick={handleDownload} className="p-2.5 bg-white/90 dark:bg-bible-darkPaper/90 backdrop-blur rounded-full text-gray-600 dark:text-gray-300 shadow-lg hover:text-bible-gold transition-all" title="Baixar">
                        <Download size={20} />
                    </button>
                    <button onClick={handlePostArtToFeed} className="flex items-center gap-2 px-5 py-2.5 bg-bible-gold text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg hover:bg-yellow-600 transition-all">
                        <Rss size={16} /> Postar
                    </button>
                </div>
                {/* Background Pattern for transparency feeling */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#999 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {finalImg ? (
                   <img src={finalImg} alt="Composition" className="max-h-full max-w-full object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-300" />
                ) : (
                   <Loader2 className="animate-spin text-bible-gold" size={40} />
                )}
            </div>

            {/* Bottom Controls */}
            <div className="bg-white dark:bg-bible-darkPaper border-t border-gray-100 dark:border-gray-800 z-20 shrink-0 pb-safe">
                
                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-800">
                    {[
                        { id: 'text', icon: <Type size={18} />, label: 'Texto' },
                        { id: 'style', icon: <Palette size={18} />, label: 'Cores' },
                        { id: 'adjust', icon: <Sliders size={18} />, label: 'Ajustes' },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveControlTab(tab.id as any)}
                            className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeControlTab === tab.id ? 'text-bible-gold border-b-2 border-bible-gold' : 'text-gray-400'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Controls Content */}
                <div className="p-4 h-40 overflow-y-auto custom-scrollbar">
                    
                    {activeControlTab === 'text' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Fonte</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {FONTS.map(font => (
                                        <button 
                                            key={font.id} 
                                            onClick={() => setEditOptions(p => ({...p, fontFamily: font.id}))}
                                            className={`px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap ${editOptions.fontFamily === font.id ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                                            style={font.style}
                                        >
                                            {font.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Alinhamento</label>
                                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
                                    <button onClick={() => setEditOptions(p => ({...p, alignment: 'left'}))} className={`p-2 rounded ${editOptions.alignment === 'left' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400'}`}><AlignLeft size={16}/></button>
                                    <button onClick={() => setEditOptions(p => ({...p, alignment: 'center'}))} className={`p-2 rounded ${editOptions.alignment === 'center' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400'}`}><AlignCenter size={16}/></button>
                                    <button onClick={() => setEditOptions(p => ({...p, alignment: 'right'}))} className={`p-2 rounded ${editOptions.alignment === 'right' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400'}`}><AlignRight size={16}/></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeControlTab === 'style' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cor do Texto</label>
                                <div className="flex gap-3">
                                    {COLORS.map(color => (
                                        <button 
                                            key={color.id}
                                            onClick={() => setEditOptions(p => ({...p, textColor: color.value}))}
                                            className={`w-8 h-8 rounded-full border-2 ${editOptions.textColor === color.value ? 'border-bible-gold scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color.value }}
                                        />
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Filtro de Imagem</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {FILTERS.map(f => (
                                        <button 
                                            key={f.id}
                                            onClick={() => setEditOptions(p => ({...p, filter: f.id as any}))}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold border ${editOptions.filter === f.id ? 'bg-bible-gold text-white border-bible-gold' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeControlTab === 'adjust' && (
                        <div className="space-y-4">
                             <div className="flex items-center gap-4">
                                <MoveVertical size={16} className="text-gray-400" />
                                <input 
                                    type="range" min="0" max="100" 
                                    value={editOptions.verticalPosition} 
                                    onChange={(e) => setEditOptions(p => ({...p, verticalPosition: parseInt(e.target.value)}))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-bible-gold"
                                />
                             </div>
                             <div className="flex items-center gap-4">
                                <Type size={16} className="text-gray-400" />
                                <input 
                                    type="range" min="0.5" max="2" step="0.1"
                                    value={editOptions.fontSizeScale} 
                                    onChange={(e) => setEditOptions(p => ({...p, fontSizeScale: parseFloat(e.target.value)}))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-bible-gold"
                                />
                             </div>
                             <div className="flex items-center gap-4">
                                <Sun size={16} className="text-gray-400" />
                                <input 
                                    type="range" min="0" max="0.9" step="0.1"
                                    value={editOptions.overlayOpacity} 
                                    onChange={(e) => setEditOptions(p => ({...p, overlayOpacity: parseFloat(e.target.value)}))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-bible-gold"
                                />
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-gray-50 dark:bg-black/20 flex flex-col relative overflow-hidden">
            <SEO title="Estúdio Criativo" />
            {viewMode === 'setup' ? renderSetupView() : renderEditorView()}
            
            <PodcastPlayer 
                isOpen={isPlayerOpen} 
                isGenerating={isGeneratingPod} 
                isPlaying={isPlaying} 
                data={podcastData} 
                generationPhase={generationPhase} 
                playerState={playerState} 
                onClose={stopAndClosePodcast} 
                onTogglePlay={togglePlayPause} 
                onSeek={seek} 
                onSkip={skip} 
                onSetPlaybackRate={setPlaybackRate} 
                onSave={savePodcast} 
            />
        </div>
    );
};

export default CreativeStudioPage;