"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '../../utils/router';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { generateVerseImage } from '../../services/pastorAgent';
import { dbService } from '../../services/supabase';
import { optimizeImage } from '../../utils/imageOptimizer';
import { composeImageWithText, CompositionOptions } from '../../utils/imageCompositor';
import { 
  ImageIcon, Loader2, Download, Rss, Type, Palette, Sliders, AlignLeft, AlignCenter, AlignRight, Sun, MoveVertical, Upload, Zap, Sparkles, CheckCircle2
} from 'lucide-react';
import SEO from '../../components/SEO';

const STYLES = [
  { id: 'realistic', label: 'Realista', icon: '📸' },
  { id: 'oil_painting', label: 'Óleo', icon: '🎨' },
  { id: 'cinematic', label: 'Cine', icon: <ImageIcon size={16}/> },
  { id: 'watercolor', label: 'Aquarela', icon: '💧' },
  { id: 'custom', label: 'Manual', icon: <Sparkles size={16}/> },
];

const COLORS = [
    { id: 'white', value: '#ffffff', label: 'Branco' },
    { id: 'black', value: '#000000', label: 'Preto' },
    { id: 'gold', value: '#c5a059', label: 'Dourado' },
];

const FONTS = [
    { id: 'Lora', label: 'Clássica', style: { fontFamily: 'Lora, serif' } },
    { id: 'Cinzel', label: 'Épica', style: { fontFamily: 'Cinzel, serif' } },
];

const FILTERS = [
    { id: 'none', label: 'Normal' },
    { id: 'darken', label: 'Escuro' },
    { id: 'bw', label: 'P&B' },
];

export default function CriarArteSacraPage() {
    const { currentUser, checkFeatureAccess, incrementUsage, recordActivity, showNotification, openSubscription, openLogin } = useAuth();
    const { setTitle, setBreadcrumbs } = useHeader();
    const navigate = useNavigate();
    const location = useLocation();

    // Navigation State
    const state = location.state as { 
        verseText?: string, 
        verseRef?: string,
        initialPrompt?: string,
        tool?: string
    } || {};

    const [refInput, setRefInput] = useState(state.verseRef || '');
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

    useEffect(() => {
        setTitle('Criar Arte Sacra');
        setBreadcrumbs([
            { label: 'Galeria', onClick: () => navigate('/artes-sacras') },
            { label: viewMode === 'editor' ? 'Editor' : 'Criar' }
        ]);
        
        if (state.tool === 'image' && state.verseText) {
             setFoundVerse({ ref: state.verseRef || '', text: state.verseText });
        }
    }, [viewMode, navigate, setTitle, setBreadcrumbs, state]);

    // Live Preview
    useEffect(() => {
        const updatePreview = async () => {
            if (rawGeneratedBase64 && foundVerse) {
                try {
                    const composed = await composeImageWithText(rawGeneratedBase64, foundVerse.text, foundVerse.ref, editOptions);
                    setFinalImg(composed);
                } catch (e) {
                    console.error("Erro", e);
                }
            }
        };
        const timeout = setTimeout(updatePreview, 50); 
        return () => clearTimeout(timeout);
    }, [editOptions, rawGeneratedBase64, foundVerse]);

    const handleCreateArt = async () => {
        if (!foundVerse && !customPrompt) {
            alert("Forneça um versículo ou um prompt detalhado!");
            return;
        }

        if (currentUser) {
            const canAccess = checkFeatureAccess('aiImageGen');
            if (!canAccess) { openSubscription(); return; }
        } else {
            openLogin(); return;
        }

        setIsGeneratingImg(true);
        try {
            const styleLabel = selectedStyle === 'custom' ? customPrompt : STYLES.find(s => s.id === selectedStyle)?.label || 'Realista';
            const contextText = foundVerse ? foundVerse.text : customPrompt;
            const contextRef = foundVerse ? foundVerse.ref : 'Arte IA';
            
            const result = await generateVerseImage(contextText, contextRef, styleLabel);
            if (result && result.data) {
                const cleanedData = result.data.replace(/\s/g, '');
                const raw = `data:${result.mimeType};base64,${cleanedData}`;
                setRawGeneratedBase64(raw); 
                if (!foundVerse) setFoundVerse({ ref: 'Obreiro IA', text: contextText });
                setViewMode('editor');
                
                dbService.saveToImageBank({
                    imageUrl: raw,
                    prompt: styleLabel,
                    style: selectedStyle,
                    reference: contextRef,
                    label: `Arte IA: ${contextRef}`,
                    category: 'IA',
                    userId: currentUser?.uid
                });

                if (currentUser) {
                    await incrementUsage('images');
                    await recordActivity('create_image', `Arte gerada no estúdio: ${contextRef}`);
                }
            }
        } catch (e) {
            alert("Erro ao criar arte. Tente novamente.");
        } finally { setIsGeneratingImg(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const optimized = await optimizeImage(file);
                setRawGeneratedBase64(optimized.base64);
                setEditOptions(prev => ({...prev, filter: 'none', overlayOpacity: 0.3}));
                setViewMode('editor');
            } catch (err) { alert("Erro ao carregar imagem."); }
        }
    };

    const handleDownload = () => {
         if (!currentUser) { openLogin(); return; }
         if (finalImg) {
             const link = document.createElement('a');
             link.href = finalImg;
             link.download = `BibliaLM_${Date.now()}.png`;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
         }
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-black/20 flex flex-col relative overflow-hidden">
            <SEO title="Criar Arte Sacra" />
            
            {viewMode === 'setup' && (
                <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto p-4 md:p-8 animate-in slide-in-from-right">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Criar Nova Arte</h2>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Versicle Text area */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Texto ou Versículo (obrigatório)</label>
                                <textarea 
                                    value={foundVerse?.text || ''}
                                    onChange={e => setFoundVerse({ ref: foundVerse?.ref || 'Texto', text: e.target.value })}
                                    className="w-full bg-gray-100 dark:bg-black/50 border border-transparent focus:border-bible-gold text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm h-28 focus:outline-none transition-colors resize-none"
                                    placeholder="Ex: No princípio, criou Deus os céus..."
                                />
                            </div>

                            {/* Reference Text */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Referência</label>
                                <input 
                                    type="text"
                                    value={foundVerse?.ref || ''}
                                    onChange={e => setFoundVerse({ text: foundVerse?.text || '', ref: e.target.value })}
                                    className="w-full bg-gray-100 dark:bg-black/50 border border-transparent focus:border-bible-gold text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                                    placeholder="Ex: Gênesis 1:1"
                                />
                            </div>
                            
                            {/* Grid de Estilos IA */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Estilo da Arte Base (IA)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {STYLES.map(style => (
                                        <button 
                                            key={style.id} onClick={() => setSelectedStyle(style.id)}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                                selectedStyle === style.id 
                                                ? 'bg-bible-gold/10 border-bible-gold text-bible-gold shadow-sm' 
                                                : 'bg-white dark:bg-black border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <span className="text-xl">{style.icon}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{style.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {selectedStyle === 'custom' && (
                                    <textarea 
                                        className="w-full bg-gray-100 dark:bg-black border border-transparent focus:border-bible-gold text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm mt-3 h-20 resize-none transition-colors"
                                        placeholder="Descreva exatamente como quer a imagem: 'Uma pomba branca voando sobre o mar calmo no fim do dia...'"
                                        value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                                    />
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 py-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Upload size={16} /> Enviar Imagem
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                
                                <button 
                                    onClick={handleCreateArt} disabled={isGeneratingImg}
                                    className="flex-[2] py-4 bg-[#c5a059] text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-[#d8b36c] transition-colors"
                                >
                                    {isGeneratingImg ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16}/>}
                                    {isGeneratingImg ? 'Gerando...' : 'Gerar Arte com IA'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'editor' && (
                <div className="flex flex-col h-full relative">
                    {/* View mode actions */}
                    <div className="absolute top-4 right-4 z-30 flex gap-2">
                        <button onClick={handleDownload} className="p-2.5 bg-white/90 dark:bg-black/90 backdrop-blur rounded-full text-gray-600 dark:text-gray-300 shadow-lg hover:text-bible-gold transition-all">
                            <Download size={20} />
                        </button>
                        <button onClick={() => navigate('/artes-sacras')} className="p-2.5 bg-white/90 dark:bg-black/90 backdrop-blur rounded-full text-gray-600 dark:text-gray-300 shadow-lg hover:text-bible-gold transition-all">
                            <CheckCircle2 size={20} /> Concluir
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
                        {finalImg ? (
                           <img src={finalImg} alt="Arte Final" className="max-h-full max-w-full object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-300" />
                        ) : (
                           <Loader2 className="animate-spin text-bible-gold" size={40} />
                        )}
                    </div>

                    <div className="bg-white dark:bg-[#1A1A1A] border-t border-gray-100 dark:border-gray-800 z-20 shrink-0 pb-safe">
                        <div className="flex border-b border-gray-100 dark:border-gray-800">
                            {[
                                { id: 'text', icon: <Type size={18} />, label: 'Texto' },
                                { id: 'style', icon: <Palette size={18} />, label: 'Cores' },
                                { id: 'adjust', icon: <Sliders size={18} />, label: 'Ajustes' },
                            ].map(tab => (
                                <button 
                                    key={tab.id} onClick={() => setActiveControlTab(tab.id as any)}
                                    className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeControlTab === tab.id ? 'text-bible-gold border-b-2 border-bible-gold' : 'text-gray-400'}`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 h-40 overflow-y-auto custom-scrollbar">
                            {activeControlTab === 'text' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Fonte</label>
                                        <div className="flex gap-2">
                                            {FONTS.map(font => (
                                                <button key={font.id} onClick={() => setEditOptions(p => ({...p, fontFamily: font.id}))} className={`px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap ${editOptions.fontFamily === font.id ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`} style={font.style}>{font.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
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
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cor</label>
                                        <div className="flex gap-3">
                                            {COLORS.map(color => (
                                                <button key={color.id} onClick={() => setEditOptions(p => ({...p, textColor: color.value}))} className={`w-8 h-8 rounded-full border-2 ${editOptions.textColor === color.value ? 'border-bible-gold scale-110' : 'border-transparent'}`} style={{ backgroundColor: color.value }}/>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeControlTab === 'adjust' && (
                                <div className="space-y-4">
                                     <div className="flex items-center gap-4">
                                        <MoveVertical size={16} className="text-gray-400" />
                                        <input type="range" min="0" max="100" value={editOptions.verticalPosition} onChange={(e) => setEditOptions(p => ({...p, verticalPosition: parseInt(e.target.value)}))} className="flex-1 h-2 bg-gray-200 rounded-lg" />
                                     </div>
                                     <div className="flex items-center gap-4">
                                        <Type size={16} className="text-gray-400" />
                                        <input type="range" min="0.5" max="2" step="0.1" value={editOptions.fontSizeScale} onChange={(e) => setEditOptions(p => ({...p, fontSizeScale: parseFloat(e.target.value)}))} className="flex-1 h-2 bg-gray-200 rounded-lg" />
                                     </div>
                                     <div className="flex items-center gap-4">
                                        <Sun size={16} className="text-gray-400" />
                                        <input type="range" min="0" max="0.9" step="0.1" value={editOptions.overlayOpacity} onChange={(e) => setEditOptions(p => ({...p, overlayOpacity: parseFloat(e.target.value)}))} className="flex-1 h-2 bg-gray-200 rounded-lg" />
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

