"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, ImageIcon, Headphones, Sparkles, Plus, 
  Search, Palette, Mic2, Loader2, ArrowRight, 
  CheckCircle2, Share2, Info, LayoutTemplate, Download,
  Type, MoveVertical, AlignCenter, AlignLeft, AlignRight,
  Aperture, Droplets, Sun, Upload, Camera, Layers, ArrowLeft, Rss, X, Sliders, Home,
  Brain, Gamepad2, History, MessageSquareQuote, MonitorPlay, Zap, Image
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import { useHeader } from '../contexts/HeaderContext';
import { bibleService } from '../services/bibleService';
import { generateVerseImage } from '../services/pastorAgent';
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

interface ImageAsset {
    id: string;
    label: string;
    category: string;
    url?: string;
    isAi?: boolean;
}

const STOCK_TEMPLATES: ImageAsset[] = [
    { id: '1504179064232-1eb10a4f6507', label: 'Cruz no Monte', category: 'bíblia' },
    { id: '1501281668939-2d12ff98f121', label: 'Escrituras', category: 'bíblia' },
    { id: '1438761681033-6461f8090fc2', label: 'Oração', category: 'espiritual' },
    { id: '1470071459604-3b5ec3a7da05', label: 'Natureza Épica', category: 'natureza' },
    { id: '1507525428034-b723cf961d3e', label: 'Céu Estrelado', category: 'natureza' },
    { id: '1519834785169-98be25ec3f84', label: 'Templo Antigo', category: 'bíblia' },
    { id: '1464822759023-fed622ff2c3b', label: 'Montanhas', category: 'natureza' },
    { id: '1490730141103-6ca27a9f0042', label: 'Pôr do Sol', category: 'natureza' },
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
    const state = location.state as { 
        fromReader?: boolean, 
        bookId?: string, 
        chapter?: number, 
        verseText?: string, 
        verseRef?: string, 
        tool?: 'image' | 'podcast',
        initialPrompt?: string,
        initialText?: string
    };

    // Mode & Workflow State
    const [activeTool, setActiveTool] = useState<'image' | 'podcast' | 'quiz'>(state?.tool || 'image');
    const [viewMode, setViewMode] = useState<'hub' | 'setup' | 'editor'>(state?.tool ? 'setup' : 'hub'); 
    
    // Content Data
    const [refInput, setRefInput] = useState(state?.verseRef || '');
    const [foundVerse, setFoundVerse] = useState<{ref: string, text: string} | null>(
        (state?.verseText && state?.verseRef) ? { ref: state.verseRef, text: state.verseText } : 
        (state?.initialText) ? { ref: 'Obreiro IA', text: state.initialText } : null
    );
    const [isSearching, setIsSearching] = useState(false);
    
    // Image Generation State
    const [selectedStyle, setSelectedStyle] = useState(state?.initialPrompt ? 'custom' : 'realistic');
    const [customPrompt, setCustomPrompt] = useState(state?.initialPrompt || '');
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);
    const [stockSearchQuery, setStockSearchQuery] = useState('');
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [currentStockImages, setCurrentStockImages] = useState<ImageAsset[]>(STOCK_TEMPLATES);
    const [imageSourceTab, setImageSourceTab] = useState<'stock' | 'ai'>('stock');
    const [allImageAssets, setAllImageAssets] = useState<ImageAsset[]>(STOCK_TEMPLATES);

    useEffect(() => {
        const loadBankImages = async () => {
            try {
                const bankImages = await dbService.getImageBank(40);
                if (bankImages.length > 0) {
                    const formatted = bankImages.map(img => ({
                        id: img.id,
                        label: img.label || 'Arte IA',
                        category: img.category || 'IA',
                        url: img.image_url,
                        isAi: true
                    }));
                    const combined = [...STOCK_TEMPLATES, ...formatted];
                    setAllImageAssets(combined);
                    setCurrentStockImages(combined);
                }
            } catch (e) { console.error("Erro ao carregar banco de imagens", e); }
        };
        loadBankImages();
    }, []);


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
        if (state?.initialPrompt || state?.initialText || state?.tool) {
            setViewMode('setup');
        }
        if (state?.initialPrompt) {
            setSelectedStyle('custom');
            setCustomPrompt(state.initialPrompt);
        }
        if (state?.initialText) {
            setFoundVerse({ ref: 'Obreiro IA', text: state.initialText });
            setRefInput('Obreiro IA');
        }
    }, [state]);

    useEffect(() => {
        if (state?.verseText && state?.verseRef && !state?.initialText) {
            setFoundVerse({ ref: state.verseRef, text: state.verseText });
            setRefInput(state.verseRef);
        }
    }, [state]);

    // Update global header title and breadcrumbs
    useEffect(() => {
        if (viewMode === 'hub') {
            setTitle('Hub de Criação');
            setBreadcrumbs([]);
        } else if (viewMode === 'setup') {
            const labels = { image: 'Artes Sacras', podcast: 'Podcast IA', quiz: 'Arena Quiz' };
            setTitle(labels[activeTool]);
            setBreadcrumbs([{ label: 'Estúdio', onClick: () => setViewMode('hub') }]);
        } else {
            setTitle('Editando Arte');
            setBreadcrumbs([
                { label: 'Estúdio', onClick: () => setViewMode('hub') },
                { label: 'Ferramenta', onClick: () => setViewMode('setup') },
                { label: foundVerse?.ref || 'Arte' }
            ]);
        }
    }, [viewMode, activeTool, foundVerse, setTitle, setBreadcrumbs]);

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
            if (result && result.data) {
                const cleanedData = result.data.replace(/\s/g, '');
                const raw = `data:${result.mimeType};base64,${cleanedData}`;
                setRawGeneratedBase64(raw); 
                setViewMode('editor'); // Transição para o modo Editor
                
                // Salvar no banco (Acervo)
                const newAsset: ImageAsset = {
                    id: Math.random().toString(36).substr(2, 9),
                    label: `Arte IA: ${foundVerse?.ref || 'Desconhecido'}`,
                    category: 'IA',
                    url: raw,
                    isAi: true
                };

                dbService.saveToImageBank({
                    imageUrl: raw,
                    prompt: styleLabel,
                    style: selectedStyle,
                    reference: foundVerse?.ref || '',
                    label: newAsset.label,
                    category: 'IA',
                    userId: currentUser?.uid
                });

                setAllImageAssets(prev => [newAsset, ...prev]);

                if (currentUser) {
                    await incrementUsage('images');
                    await recordActivity('create_image', `Arte gerada no estúdio: ${foundVerse!.ref}`);
                }
            } else {
                showNotification("A IA não conseguiu gerar a imagem. Tente outro estilo ou verifique sua conexão.", "warning");
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

    const handleSelectStockPhoto = async (photoId: string, customUrl?: string) => {
        setIsLoadingStock(true);
        try {
            const imageUrl = customUrl || `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&q=80&w=1200`;
            
            if (imageUrl.startsWith('data:')) {
                setRawGeneratedBase64(imageUrl);
                setEditOptions(prev => ({...prev, filter: 'none', overlayOpacity: 0.4}));
                if (foundVerse) setViewMode('editor');
                else showNotification("Selecione um versículo primeiro.", "info");
            } else if (imageUrl.startsWith('http')) {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setRawGeneratedBase64(reader.result as string);
                    setEditOptions(prev => ({...prev, filter: 'none', overlayOpacity: 0.4}));
                    if (foundVerse) setViewMode('editor');
                    else showNotification("Selecione um versículo primeiro.", "info");
                };
                reader.readAsDataURL(blob);
            }
        } catch (e) {
            showNotification("Erro ao carregar imagem do banco.", "error");
        } finally {
            setIsLoadingStock(false);
        }
    };

    const handleSearchStock = async (manualQuery?: string) => {
        const query = manualQuery !== undefined ? manualQuery : stockSearchQuery;
        
        if (!query.trim()) {
            setCurrentStockImages(allImageAssets);
            return;
        }

        setIsLoadingStock(true);
        try {
            // Local filter first
            const localFiltered = allImageAssets.filter(p => 
                p.label.toLowerCase().includes(query.toLowerCase()) || 
                p.category.toLowerCase().includes(query.toLowerCase())
            );

            // Fetch from Unsplash (Public Bridge/Search)
            // Using a set of curated IDs or a search simulation if no API key
            // For now, we'll try to use a few quality Unsplash IDs for common bible terms
            // In a real app, this would call a server-side proxy to Unsplash API
            
            const bibleTerms = ['bible', 'cross', 'church', 'prayer', 'nature', 'landscape', 'spirit', 'faith', 'holy', 'ancient'];
            const isBibleQuery = bibleTerms.some(term => query.toLowerCase().includes(term) || query.toLowerCase().includes('bíblia') || query.toLowerCase().includes('fé'));

            if (isBibleQuery && query.length > 3) {
                // Mocking additional results with Unsplash IDs if local is small
                const unsplashMockIds = [
                    '1438761681033-6461f8090fc2', '1501281668939-2d12ff98f121', 
                    '1519834785169-98be25ec3f84', '1490730141103-6ca27a9f0042',
                    '1464822759023-fed622ff2c3b', '1507525428034-b723cf961d3e'
                ];
                
                const unsplashResults: ImageAsset[] = unsplashMockIds.map(id => ({
                    id: id + '_' + Math.random(),
                    label: `Unsplash: ${query}`,
                    category: 'Unsplash',
                    url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=800`
                }));
                
                setCurrentStockImages([...localFiltered, ...unsplashResults]);
            } else {
                setCurrentStockImages(localFiltered);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingStock(false);
        }
    };

    // Auto-suggest stock photos based on verse theme
    useEffect(() => {
        if (foundVerse) {
            const text = foundVerse.text.toLowerCase();
            let theme = 'bíblia';
            
            if (text.match(/monte|natureza|sol|mar|terra|céu|estrela/i)) theme = 'natureza';
            else if (text.match(/oração|fé|espírito|paz|alma/i)) theme = 'espiritual';
            
            setStockSearchQuery(theme);
            handleSearchStock(theme);
        }
    }, [foundVerse]);



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
    };

    // --- RENDERERS ---

    // 0. HUB VIEW (Dashboard Premium)
    const renderHubView = () => (
        <div className="flex flex-col h-full p-4 md:p-8 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-6 overflow-y-auto no-scrollbar">
            
            <div className="text-center mb-10 mt-4 px-4 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-bible-gold/5 blur-3xl -z-10 rounded-full"></div>
                
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-bible-gold/10 text-bible-gold rounded-full text-[11px] font-black uppercase tracking-widest mb-6 border border-bible-gold/20 shadow-sm animate-pulse">
                    <Sparkles size={14} className="animate-spin-slow" fill="currentColor"/> Estúdio de Criação Pro
                </div>
                
                <h2 className="text-3xl md:text-5xl font-serif font-black text-gray-900 dark:text-white mb-4 leading-tight">
                    Transforme Inspiração <br className="hidden md:block"/> em <span className="text-bible-gold bg-clip-text">Arte Viva</span>
                </h2>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                    Combine o poder das Escrituras com Inteligência Artificial para criar ferramentas ministeriais impactantes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* TOOL: IMAGE */}
                <div 
                    onClick={() => { setActiveTool('image'); setViewMode('setup'); }}
                    className="group bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-bible-gold hover:shadow-2xl hover:shadow-bible-gold/20 transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center"
                >
                    <div className="absolute top-0 right-0 p-4">
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[8px] font-black uppercase rounded-full border border-green-500/20">Ativa</span>
                    </div>
                    <div className="w-20 h-20 bg-bible-gold/10 text-bible-gold rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                        <ImageIcon size={40} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Artes Sacras</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-medium">
                        Geração cinematográfica em 4K. Ideal para redes sociais, boletins e apresentações em telão.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-bible-gold text-[10px] font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                        Produzir <ArrowRight size={14} />
                    </div>
                </div>

                {/* TOOL: PODCAST */}
                <div 
                    onClick={() => { setActiveTool('podcast'); setViewMode('setup'); }}
                    className="group bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center"
                >
                    <div className="absolute top-0 right-0 p-4">
                        <span className="px-2 py-0.5 bg-bible-gold/10 text-bible-gold text-[8px] font-black uppercase rounded-full border border-bible-gold/20">Premium</span>
                    </div>
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-inner">
                        <Mic2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Podcast IA</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-medium">
                        Narrações ultra-realistas. Converta seus estudos em áudio-devocionais poderosos para o pastorado.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                        Gravar <ArrowRight size={14} />
                    </div>
                </div>

                {/* TOOL: QUIZ */}
                <div 
                    onClick={() => navigate('/quiz')}
                    className="group bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center"
                >
                    <div className="absolute top-0 right-0 p-4 flex gap-1">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase rounded-full border border-blue-500/20">Comunidade</span>
                    </div>
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                        <Brain size={40} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Arena Quiz</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-medium">
                        Engaje sua comunidade com desafios bíblicos. Ideal para escolas dominicais e grupos de estudo.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                        Desafiar <ArrowRight size={14} />
                    </div>
                </div>
            </div>

            {/* QUICK INSPIRATION SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-gradient-to-br from-bible-leather to-[#2a1a0a] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl border border-white/10 group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <LayoutTemplate size={120} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-bible-gold opacity-80">Sugestão de Hoje</h4>
                    <p className="text-xl font-serif italic mb-6 leading-relaxed">
                        "E conhecereis a verdade, e a verdade vos libertará."
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] font-bold opacity-60">JOÃO 8:32</span>
                        <button 
                            onClick={() => { setRefInput('João 8:32'); handleSearch(); setActiveTool('image'); setViewMode('setup'); }}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Gerar Arte agora
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-bible-darkPaper rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-lg group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-bible-gold/10 text-bible-gold rounded-full flex items-center justify-center">
                            <History size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Histórico Recente</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Acesse suas criações</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-br from-bible-gold/20 to-bible-leather/20"></div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase">Salmos 23:1</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase">Arte Sacra • 2h atrás</p>
                                </div>
                            </div>
                            <Plus size={14} className="text-gray-300" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed">
                            <span className="text-[10px] font-black text-gray-300 uppercase italic">Nenhuma outra produção recente...</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECONDARY SECTION: PUBLISHED WORKS */}
            <div className="bg-gray-100 dark:bg-gray-900/50 rounded-[3rem] p-8 border border-gray-200 dark:border-gray-800 mb-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Minhas Produções</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Histórico de Criação</p>
                    </div>
                    <button onClick={() => navigate('/workspace')} className="p-3 bg-white dark:bg-gray-800 rounded-2xl text-gray-500 hover:text-bible-gold shadow-sm transition-all">
                        <Layers size={20} />
                    </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Placeholder for recent works - could be dynamic */}
                    <div className="aspect-square bg-white dark:bg-bible-darkPaper rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <Plus size={24} className="text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase">Nova Arte</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // 1. SETUP VIEW (O Formulário Inicial OTIMIZADO)
    const renderSetupView = () => (
        <div className="flex flex-col h-full p-4 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 overflow-y-auto no-scrollbar">
            
            <button onClick={() => setViewMode('hub')} className="w-fit flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-8 hover:text-bible-gold transition-colors">
                <ArrowLeft size={16} /> Voltar ao Hub
            </button>

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

            {/* Image Source Selection Tabs - NEW */}
            {activeTool === 'image' && (
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl mb-6">
                    <button 
                        onClick={() => setImageSourceTab('stock')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${imageSourceTab === 'stock' ? 'bg-white dark:bg-bible-darkPaper text-bible-gold shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Image size={14} /> Banco de Imagens
                        </div>
                        <span className="text-[7px] block mt-0.5 text-green-500">Grátis & Rápido</span>
                    </button>
                    <button 
                        onClick={() => setImageSourceTab('ai')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${imageSourceTab === 'ai' ? 'bg-white dark:bg-bible-darkPaper text-bible-gold shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles size={14} /> Imagem com IA
                        </div>
                        <span className="text-[7px] block mt-0.5 text-bible-gold/70">Premium IA</span>
                    </button>
                </div>
            )}

            {/* Tab Content 1: Stock Photo Bank */}
            {activeTool === 'image' && imageSourceTab === 'stock' && (
                <div className="bg-white dark:bg-bible-darkPaper p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-lg mb-6 group text-left animate-in fade-in slide-in-from-left-4">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Escolha um Fundo</label>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={stockSearchQuery}
                                    onChange={(e) => setStockSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchStock()}
                                    placeholder="Buscar no banco..."
                                    className="pl-3 pr-8 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg text-[10px] outline-none w-32 focus:w-48 transition-all"
                                />
                                <button onClick={() => handleSearchStock()} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-bible-gold">
                                    <Search size={12}/>
                                </button>
                            </div>

                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {currentStockImages.map((photo: ImageAsset) => (
                            <button 
                                key={photo.id}
                                onClick={() => handleSelectStockPhoto(photo.id, photo.url)}
                                disabled={isLoadingStock}
                                className="aspect-square rounded-xl overflow-hidden relative group/btn hover:ring-2 hover:ring-bible-gold transition-all disabled:opacity-50"
                            >
                                <img 
                                    src={photo.url || `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&q=60&w=200`} 
                                    className="w-full h-full object-cover group-hover/btn:scale-110 transition-transform duration-500"
                                    alt={photo.label}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/btn:opacity-100 transition-opacity flex items-center justify-center text-center p-1">
                                    <span className="text-[7px] font-black text-white uppercase leading-tight">{photo.label}</span>
                                    {photo.isAi && (
                                        <div className="absolute top-1 right-1 bg-bible-gold text-white rounded-full p-0.5">
                                            <Sparkles size={8} />
                                        </div>
                                    )}
                                </div>
                                {isLoadingStock && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Loader2 size={12} className="text-white animate-spin" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab Content 2: AI Image Creation */}
            {activeTool === 'image' && imageSourceTab === 'ai' && (
                <div className="bg-white dark:bg-bible-darkPaper p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-lg mb-6 text-left animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Estilo Visual (IA)</label>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-bible-gold/10 text-bible-gold rounded-full border border-bible-gold/20 flex items-center gap-1">
                            <Sparkles size={8} fill="currentColor"/> MODO ARTESANAL
                        </span>
                    </div>
                    
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
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeTool === 'image' && imageSourceTab === 'stock' 
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-500' 
                    : 'bg-bible-leather dark:bg-bible-gold text-white dark:text-black'
                }`}
            >
                {isGeneratingImg || isGeneratingPod ? (
                    <Loader2 size={18} className="animate-spin"/>
                ) : (
                    imageSourceTab === 'ai' || activeTool !== 'image' ? <Sparkles size={18} fill="currentColor"/> : <Zap size={18} />
                )}
                {activeTool === 'image' 
                    ? (imageSourceTab === 'stock' ? 'Ou Criar com IA Premium' : 'Gerar Arte Sacra (IA)') 
                    : 'Gerar Podcast IA'}
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
            {viewMode === 'hub' && renderHubView()}
            {viewMode === 'setup' && renderSetupView()}
            {viewMode === 'editor' && renderEditorView()}
            
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