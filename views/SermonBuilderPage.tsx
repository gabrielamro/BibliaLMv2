"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { bibleService } from '../services/bibleService';
import { generateSermonOutline, generateVerseImage } from '../services/pastorAgent';
import { useSettings } from '../contexts/SettingsContext';
import {
    Mic2, Save, Plus, Trash2, Loader2, BookOpen, Clock, FileText,
    Sparkles, ArrowLeft, Quote, MonitorPlay, Maximize2, Type, Move,
    X, Calendar, Target, PenTool, Layers, Layout, Bookmark
} from 'lucide-react';
import { Note, SavedStudy } from '../types';
import { composeImageWithText } from '../utils/imageCompositor';

interface SermonVerse {
    id: string;
    ref: string;
    text: string;
}

const HolyTimer: React.FC<{ initialMinutes: number, onFinish: () => void }> = ({ initialMinutes, onFinish }) => {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            onFinish();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, onFinish]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = (timeLeft / (initialMinutes * 60)) * 100;
    let color = 'bg-green-500';
    if (progress < 50) color = 'bg-yellow-500';
    if (progress < 20) color = 'bg-red-500';

    return (
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-700" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                        className={`${color} transition-all duration-1000`}
                        strokeDasharray={175}
                        strokeDashoffset={175 - (175 * progress) / 100}
                    />
                </svg>
                <span className={`absolute text-sm font-bold ${color.replace('bg-', 'text-')}`}>{formatTime(timeLeft)}</span>
            </div>
            <div className="flex flex-col gap-1">
                {!isActive && !isPaused && <button onClick={() => setIsActive(true)} className="px-3 py-1 bg-green-600 text-white text-[10px] font-bold rounded uppercase">Iniciar</button>}
                {isActive && <button onClick={() => { setIsActive(false); setIsPaused(true); }} className="px-3 py-1 bg-yellow-600 text-white text-[10px] font-bold rounded uppercase">Pausar</button>}
                {isPaused && <button onClick={() => { setIsActive(true); setIsPaused(false); }} className="px-3 py-1 bg-green-600 text-white text-[10px] font-bold rounded uppercase">Retomar</button>}
                <button onClick={() => { setIsActive(false); setIsPaused(false); setTimeLeft(initialMinutes * 60); }} className="px-3 py-1 bg-gray-600 text-white text-[10px] font-bold rounded uppercase">Reset</button>
            </div>
        </div>
    );
};

const SlideProjectorModal: React.FC<{ isOpen: boolean, onClose: () => void, imageUrl: string | null, title: string, verse: string }> = ({ isOpen, onClose, imageUrl, title, verse }) => {
    if (!isOpen || !imageUrl) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-50 p-2"><X size={32} /></button>
            <div className="w-full h-full flex items-center justify-center relative">
                <img src={imageUrl} className="max-w-full max-h-full object-contain" />
            </div>
        </div>
    );
};

interface EditorState {
    id?: string;
    title?: string;
    ref?: string;
    text?: string;
    existingContent?: string;
    presentationDate?: string;
    estimatedDuration?: number;
    occasion?: string;
    mainVerse?: string;
    prefill?: any;
}

const SermonBuilderPage: React.FC = () => {
    const { currentUser, earnMana, checkFeatureAccess, incrementUsage, openSubscription, showNotification } = useAuth();
    const { setTitle: setHeaderTitle, setBreadcrumbs, resetHeader } = useHeader();
    const { setIsFocusMode } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as EditorState | null;

    // Initialize State
    const [title, setTitle] = useState(state?.prefill?.title || state?.title || '');
    const [verses, setVerses] = useState<SermonVerse[]>([
        { id: '1', ref: state?.prefill?.mainVerse || state?.ref || '', text: state?.text || '' }
    ]);
    const [content, setContent] = useState(state?.existingContent || '');

    // New Metadata State
    const [presentationDate, setPresentationDate] = useState(state?.prefill?.presentationDate || state?.presentationDate || '');
    const [estimatedDuration, setEstimatedDuration] = useState(state?.prefill?.estimatedDuration || state?.estimatedDuration || 40);
    const [occasion, setOccasion] = useState(state?.prefill?.occasion || state?.occasion || '');

    const [activeTab, setActiveTab] = useState<'editor' | 'pulpit'>('editor');

    // Editor Sub-tabs
    const [editorMode, setEditorMode] = useState<'guided' | 'free' | 'ai'>('guided');

    // Guided Questions State
    const [manualIntro, setManualIntro] = useState('');
    const [manualContext, setManualContext] = useState('');
    const [manualApplication, setManualApplication] = useState('');
    const [manualPrayer, setManualPrayer] = useState('');

    // AI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiTheme, setAiTheme] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    // Pulpit Mode States
    const [fontSize, setFontSize] = useState(3); // 1-5
    const [isSlideGenerating, setIsSlideGenerating] = useState(false);
    const [generatedSlideUrl, setGeneratedSlideUrl] = useState<string | null>(null);
    const [showSlideModal, setShowSlideModal] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Note Import
    const [showNoteImport, setShowNoteImport] = useState(false);
    const [userNotes, setUserNotes] = useState<Note[]>([]);

    // Teleprompter
    const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = off

    // Publish Modal
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishFrequency, setPublishFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [publishVisibility, setPublishVisibility] = useState<'public' | 'private_invite' | 'private'>('private');

    useEffect(() => {
        setIsFocusMode(true);
        return () => {
            setIsFocusMode(false);
            resetHeader();
        };
    }, [setIsFocusMode, resetHeader]);

    useEffect(() => {
        let scrollInterval: any;
        if (activeTab === 'pulpit' && autoScrollSpeed > 0 && scrollContainerRef.current) {
            scrollInterval = setInterval(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop += autoScrollSpeed;
                }
            }, 50);
        }
        return () => clearInterval(scrollInterval);
    }, [activeTab, autoScrollSpeed]);

    useEffect(() => {
        if (showNoteImport && currentUser && userNotes.length === 0) {
            dbService.getAll(currentUser.uid, 'notes').then(res => setUserNotes(res as Note[]));
        }
    }, [showNoteImport, currentUser]);

    // Carregamento automático do texto bíblico
    useEffect(() => {
        const fetchInitialText = async () => {
            const initialRef = state?.prefill?.mainVerse || state?.ref;
            // Se tiver referência mas não texto, busca
            if (initialRef && !verses[0].text) {
                try {
                    const result = await bibleService.getTextByReference(initialRef);
                    if (result) {
                        setVerses(prev => prev.map(v =>
                            v.id === '1' ? { ...v, text: result.text, ref: result.formattedRef } : v
                        ));
                    }
                } catch (e) {
                    console.error("Erro ao carregar texto inicial:", e);
                }
            }
        };
        fetchInitialText();
    }, []);

    const handleAddVerse = () => setVerses([...verses, { id: Date.now().toString(), ref: '', text: '' }]);
    const handleUpdateVerse = (id: string, field: keyof SermonVerse, value: string) => setVerses(verses.map(v => v.id === id ? { ...v, [field]: value } : v));
    const handleRemoveVerse = (id: string) => setVerses(verses.filter(v => v.id !== id));

    const handleImportNote = (note: Note) => {
        if (note.sourceText) {
            const ref = note.title?.replace('Nota em ', '') || 'Referência Importada';
            setVerses(prev => [...prev, { id: Date.now().toString(), ref, text: note.sourceText || '' }]);
            if (note.userThoughts) setContent(prev => prev + `\n\n[Insight Importado]: ${note.userThoughts}`);
            setShowNoteImport(false);
            showNotification("Nota importada!", "success");
        } else {
            showNotification("Esta nota não tem texto bíblico associado.", "info");
        }
    };

    const handleGenerateOutline = async () => {
        if (!checkFeatureAccess('aiSermonBuilder')) { openSubscription(); return; }
        setIsGenerating(true);
        try {
            const contextText = verses.map(v => `${v.ref} ${v.text}`).join('\n');
            const outline = await generateSermonOutline(contextText, aiTheme, 'Geral', aiTheme);
            if (outline) {
                await incrementUsage('analysis');
                setContent(prev => prev + '\n\n' + outline);
                setEditorMode('free'); // Switch to free mode to see result
            }
        } catch (e) {
            showNotification("Erro na conexão com o Obreiro IA.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAssembleManual = () => {
        if (!manualIntro && !manualContext) {
            showNotification("Preencha pelo menos a introdução ou contextualização.", "warning");
            return;
        }

        const assembledHtml = `
        <h2>1. Introdução</h2>
        <p>${manualIntro.replace(/\n/g, '<br/>')}</p>
 
        <h2>2. Contextualização</h2>
        <p>${manualContext.replace(/\n/g, '<br/>')}</p>
 
        <h2>3. Aplicação</h2>
        <p>${manualApplication.replace(/\n/g, '<br/>')}</p>
 
        ${manualPrayer ? `<h2>4. Oração</h2><p>${manualPrayer.replace(/\n/g, '<br/>')}</p>` : ''}
      `;

        setContent(prev => prev + assembledHtml);
        setEditorMode('free');
        showNotification("Estrutura montada no editor!", "success");
    };

    const handleGenerateSlide = async () => {
        if (!title || verses.length === 0) {
            showNotification("Defina um título e pelo menos um versículo.", "warning");
            return;
        }
        if (!checkFeatureAccess('aiImageGen')) { openSubscription(); return; }

        setIsSlideGenerating(true);
        try {
            const prompt = `Background for sermon slide about "${title}". Theme: ${aiTheme || 'Biblical'}. Cinematic, spiritual, subtle, 16:9 aspect ratio, high resolution, no text.`;
            const bgImage = await generateVerseImage(prompt, 'Slide', 'cinematic');

            if (bgImage) {
                const base64Bg = `data:${bgImage.mimeType};base64,${bgImage.data}`;
                const slide = await composeImageWithText(
                    base64Bg,
                    title,
                    verses[0].ref,
                    { textColor: '#ffffff', fontSizeScale: 1.5, verticalPosition: 50, alignment: 'center', fontFamily: 'Cinzel', filter: 'darken', overlayOpacity: 0.5 }
                );
                setGeneratedSlideUrl(slide);
                await incrementUsage('images');
                showNotification("Slide gerado com sucesso!", "success");
            }
        } catch (e) {
            showNotification("Erro ao gerar slide.", "error");
        } finally {
            setIsSlideGenerating(false);
        }
    };

    const handleSave = async (status: 'draft' | 'published' = 'draft') => {
        if (!title.trim()) { showNotification("Título necessário.", "warning"); return; }
        try {
            const sourceText = verses.map(v => `${v.ref}: ${v.text}`).join('\n').substring(0, 500);
            const sermonData: Partial<SavedStudy> = {
                title,
                sourceText: sourceText || "Sermão",
                analysis: content,
                source: 'sermon',
                presentationDate,
                estimatedDuration,
                occasion,
                status,
                frequency: publishFrequency,
                visibility: publishVisibility,
                publishedAt: status === 'published' ? new Date().toISOString() : undefined
            };

            if (state?.id) {
                await dbService.update(currentUser!.uid, 'studies', state.id, sermonData);
            } else {
                await dbService.add(currentUser!.uid, 'studies', sermonData);
                await earnMana('create_sermon');
            }

            showNotification(status === 'published' ? "Estudo publicado com sucesso!" : "Rascunho salvo.");
            navigate('/workspace-pastoral');
        } catch (e) { console.error(e); }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-bible-paper dark:bg-black overflow-hidden">
            {/* HEADER */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 py-2 flex flex-col md:flex-row justify-between items-center shadow-sm gap-2 h-auto md:h-20 shrink-0">
                <div className="flex w-full items-center gap-4 md:w-auto">
                    <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-bible-gold transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex min-w-0 flex-col">

                        <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-full md:max-w-[200px] leading-tight">
                            {title || 'Novo Sermão'}
                        </h1>
                    </div>
                </div>

                <div className="flex w-full md:w-auto bg-gray-100 dark:bg-gray-900 p-1 rounded-xl overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('editor')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-500'}`}>Editor</button>
                    <button onClick={() => setActiveTab('pulpit')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'pulpit' ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-500'}`}>Púlpito</button>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <button onClick={() => handleSave('draft')} className="flex-1 md:flex-none px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                        <Save size={16} /> Salvar
                    </button>
                    <button onClick={() => setShowPublishModal(true)} className="flex-1 md:flex-none px-4 py-2 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <Sparkles size={16} /> Publicar
                    </button>
                </div>
            </div>

            {/* Publish Modal */}
            {showPublishModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-serif font-bold text-xl text-gray-900 dark:text-white">Publicar Estudo</h3>
                            <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Frequência do Estudo</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => setPublishFrequency('daily')} className={`p-3 rounded-xl border-2 text-center transition-all ${publishFrequency === 'daily' ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-300'}`}>
                                        <div className="font-bold text-sm">Diário</div>

                                    </button>
                                    <button onClick={() => setPublishFrequency('weekly')} className={`p-3 rounded-xl border-2 text-center transition-all ${publishFrequency === 'weekly' ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-300'}`}>
                                        <div className="font-bold text-sm">Semanal</div>

                                    </button>
                                    <button onClick={() => setPublishFrequency('monthly')} className={`p-3 rounded-xl border-2 text-center transition-all ${publishFrequency === 'monthly' ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-300'}`}>
                                        <div className="font-bold text-sm">Mensal</div>

                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Visibilidade</label>
                                <div className="space-y-2">
                                    <button onClick={() => setPublishVisibility('public')} className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${publishVisibility === 'public' ? 'border-bible-gold bg-bible-gold/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}>
                                        <div className={`p-2 rounded-full ${publishVisibility === 'public' ? 'bg-bible-gold text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}><Sparkles size={16} /></div>
                                        <div>
                                            <div className={`font-bold ${publishVisibility === 'public' ? 'text-bible-gold' : 'text-gray-700 dark:text-gray-300'}`}>Público (Global)</div>

                                        </div>
                                    </button>
                                    <button onClick={() => setPublishVisibility('private_invite')} className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${publishVisibility === 'private_invite' ? 'border-bible-gold bg-bible-gold/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}>
                                        <div className={`p-2 rounded-full ${publishVisibility === 'private_invite' ? 'bg-bible-gold text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}><Layout size={16} /></div>
                                        <div>
                                            <div className={`font-bold ${publishVisibility === 'private_invite' ? 'text-bible-gold' : 'text-gray-700 dark:text-gray-300'}`}>Apenas Convidados</div>

                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex gap-3">
                            <button onClick={() => setShowPublishModal(false)} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
                            <button onClick={() => { setShowPublishModal(false); handleSave('published'); }} className="flex-1 py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] transition-transform">Confirmar Publicação</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'editor' && (
                    <div className="h-full overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">

                        {/* Header Card */}
                        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-2">
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-2xl font-bold font-serif bg-transparent border-b-2 border-gray-100 dark:border-gray-800 focus:border-bible-gold transition-colors outline-none py-2 text-gray-900 dark:text-white placeholder-gray-400" placeholder="Título do Sermão..." />
                                <button onClick={() => setShowSettings(!showSettings)} className="text-gray-400 hover:text-bible-gold p-2"><Target size={18} /></button>
                            </div>

                            {!showSettings && (presentationDate || occasion) && (
                                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                                    {presentationDate && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(presentationDate).toLocaleDateString()}</span>}
                                    {occasion && <span className="flex items-center gap-1"><Target size={12} /> {occasion}</span>}
                                    {estimatedDuration && <span className="flex items-center gap-1"><Clock size={12} /> {estimatedDuration} min</span>}
                                </div>
                            )}

                            {showSettings && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-in slide-in-from-top-2">
                                    <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Data</label><input type="datetime-local" value={presentationDate} onChange={(e) => setPresentationDate(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white" /></div>
                                    <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Duração (min)</label><input type="number" value={estimatedDuration} onChange={(e) => setEstimatedDuration(parseInt(e.target.value))} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white" /></div>
                                    <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ocasião</label><input type="text" value={occasion} onChange={(e) => setOccasion(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white" placeholder="Ex: Culto de Jovens" /></div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold flex items-center gap-2"><FileText size={18} /> Corpo do Sermão</h3>

                                        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                                            <button onClick={() => setEditorMode('guided')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${editorMode === 'guided' ? 'bg-white dark:bg-gray-700 shadow text-bible-gold' : 'text-gray-500'}`}>Guiado</button>
                                            <button onClick={() => setEditorMode('free')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${editorMode === 'free' ? 'bg-white dark:bg-gray-700 shadow text-bible-gold' : 'text-gray-500'}`}>Livre</button>
                                            <button onClick={() => setEditorMode('ai')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${editorMode === 'ai' ? 'bg-white dark:bg-gray-700 shadow text-purple-600' : 'text-gray-500'}`}><Sparkles size={12} /></button>
                                        </div>
                                    </div>

                                    {/* EDITOR MODE: GUIDED */}
                                    {editorMode === 'guided' && (
                                        <div className="space-y-4 animate-in fade-in">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">1. Introdução</label>
                                                <textarea value={manualIntro} onChange={e => setManualIntro(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white h-20 resize-none outline-none focus:ring-2 ring-bible-gold/30 placeholder-gray-400 dark:placeholder-gray-600" placeholder="Introduza o tema..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">2. Contextualização</label>
                                                <textarea value={manualContext} onChange={e => setManualContext(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white h-32 resize-none outline-none focus:ring-2 ring-bible-gold/30 placeholder-gray-400 dark:placeholder-gray-600" placeholder="Contexto histórico, pontos, tópicos e temas..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">3. Aplicação</label>
                                                <textarea value={manualApplication} onChange={e => setManualApplication(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white h-24 resize-none outline-none focus:ring-2 ring-bible-gold/30 placeholder-gray-400 dark:placeholder-gray-600" placeholder="Como aplicar isso na vida prática..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">4. Oração (Opcional)</label>
                                                <textarea value={manualPrayer} onChange={e => setManualPrayer(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white h-20 resize-none outline-none focus:ring-2 ring-bible-gold/30 placeholder-gray-400 dark:placeholder-gray-600" placeholder="Uma oração final..." />
                                            </div>
                                            <button onClick={handleAssembleManual} className="w-full py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:opacity-90">
                                                <Layers size={16} /> Montar Manuscrito
                                            </button>
                                        </div>
                                    )}

                                    {/* EDITOR MODE: AI */}
                                    {editorMode === 'ai' && (
                                        <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in">
                                            <input type="text" placeholder="Tema (Fé, Perdão...)" value={aiTheme} onChange={(e) => setAiTheme(e.target.value)} className="w-full p-2 mb-3 rounded-lg border text-sm outline-none" />
                                            <button onClick={handleGenerateOutline} disabled={isGenerating} className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                                                {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Gerar Esboço Completo
                                            </button>
                                            <p className="text-[10px] text-purple-600 mt-2 text-center">A IA irá criar uma estrutura completa baseada nos versículos selecionados.</p>
                                        </div>
                                    )}

                                    {/* EDITOR MODE: FREE (Final Output) */}
                                    {editorMode === 'free' && (
                                        <div className="animate-in fade-in">
                                            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-[55vh] md:h-[600px] p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 outline-none resize-none text-base leading-relaxed font-serif text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600" placeholder="Escreva seu sermão livremente ou use o modo Guiado..." />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2"><BookOpen size={18} className="text-bible-gold" /> Referências</h3>
                                    <div className="space-y-4">
                                        {verses.map((verse, idx) => (
                                            <div key={verse.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 relative">
                                                <input type="text" value={verse.ref} onChange={(e) => handleUpdateVerse(verse.id, 'ref', e.target.value)} className="w-full bg-transparent font-bold text-sm mb-1 outline-none text-bible-gold" placeholder="Ref (João 3:16)" />
                                                <textarea value={verse.text} onChange={(e) => handleUpdateVerse(verse.id, 'text', e.target.value)} className="w-full bg-transparent text-xs resize-none outline-none italic text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600" rows={2} placeholder="Texto bíblico..." />
                                                {idx > 0 && <button onClick={() => handleRemoveVerse(verse.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>}
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <button onClick={handleAddVerse} className="flex-1 py-3 border-2 border-dashed border-gray-300 text-gray-400 rounded-xl text-xs font-bold hover:border-bible-gold hover:text-bible-gold transition-colors"><Plus size={14} className="mx-auto" /></button>
                                            <button onClick={() => setShowNoteImport(true)} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"><Bookmark size={14} className="mx-auto" /></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                                    <h3 className="font-bold mb-4 flex items-center gap-2"><Layout size={18} /> Visual</h3>
                                    <button onClick={handleGenerateSlide} disabled={isSlideGenerating} className="w-full py-3 bg-pink-50 text-pink-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-pink-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isSlideGenerating ? <Loader2 className="animate-spin" size={16} /> : <MonitorPlay size={16} />} Gerar Slide Capa
                                    </button>
                                    {generatedSlideUrl && (
                                        <div className="mt-4 relative group cursor-pointer" onClick={() => setShowSlideModal(true)}>
                                            <img src={generatedSlideUrl} className="w-full rounded-lg shadow-sm" alt="Slide" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 size={24} /></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pulpit' && (
                    <div className="h-full flex flex-col bg-black text-white">
                        {/* Pulpit Toolbar */}
                        <div className="p-4 bg-gray-900 border-b border-gray-800 flex flex-col xl:flex-row items-start xl:items-center justify-between shrink-0 gap-4">
                            <HolyTimer initialMinutes={estimatedDuration || 40} onFinish={() => showNotification("Tempo Esgotado!", "warning")} />

                            <div className="flex w-full xl:w-auto flex-wrap items-center gap-4">
                                <div className="flex bg-gray-800 rounded-lg p-1">
                                    <button onClick={() => setFontSize(Math.max(1, fontSize - 1))} className="p-2 hover:bg-gray-700 rounded text-gray-400"><Type size={16} /></button>
                                    <span className="px-3 py-2 text-sm font-bold">{fontSize}x</span>
                                    <button onClick={() => setFontSize(Math.min(5, fontSize + 1))} className="p-2 hover:bg-gray-700 rounded text-gray-400"><Type size={20} /></button>
                                </div>

                                <div className="flex bg-gray-800 rounded-lg p-1" title="Teleprompter Speed">
                                    <button onClick={() => setAutoScrollSpeed(0)} className={`p-2 rounded ${autoScrollSpeed === 0 ? 'bg-red-500 text-white' : 'text-gray-400'}`}><Move size={16} /></button>
                                    <button onClick={() => setAutoScrollSpeed(1)} className={`p-2 rounded ${autoScrollSpeed === 1 ? 'bg-green-500 text-white' : 'text-gray-400'}`}>1x</button>
                                    <button onClick={() => setAutoScrollSpeed(2)} className={`p-2 rounded ${autoScrollSpeed === 2 ? 'bg-green-500 text-white' : 'text-gray-400'}`}>2x</button>
                                </div>

                                {generatedSlideUrl && (
                                    <button onClick={() => setShowSlideModal(true)} className="p-2 bg-bible-gold text-black rounded-lg hover:scale-110 transition-transform" title="Projetar Slide">
                                        <Maximize2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 md:p-16 scroll-smooth">
                            <div className="max-w-4xl mx-auto space-y-12">
                                <h1 className="text-5xl md:text-7xl font-serif font-bold text-bible-gold text-center mb-12">{title}</h1>

                                {verses.map(v => (
                                    <div key={v.id} className="bg-white/5 border-l-4 border-bible-gold p-8 rounded-r-2xl my-8">
                                        <p className={`font-serif italic text-gray-300 mb-4 leading-relaxed transition-all duration-300`} style={{ fontSize: `${1.2 * fontSize}rem` }}>"{v.text}"</p>
                                        <p className="text-bible-gold font-black uppercase tracking-widest">{v.ref}</p>
                                    </div>
                                ))}

                                <div
                                    className={`font-sans text-gray-300 leading-loose whitespace-pre-wrap transition-all duration-300 editor-content`}
                                    style={{ fontSize: `${1 * fontSize}rem` }}
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />

                                <div className="h-40"></div> {/* Bottom padding for scroll */}
                            </div>
                        </div>

                        <SlideProjectorModal
                            isOpen={showSlideModal}
                            onClose={() => setShowSlideModal(false)}
                            imageUrl={generatedSlideUrl}
                            title={title}
                            verse={verses[0]?.ref || ''}
                        />
                    </div>
                )}
            </div>

            {/* Modal de Importação de Notas */}
            {showNoteImport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-bible-darkPaper w-full max-w-lg rounded-3xl p-6 shadow-2xl h-[70vh] flex flex-col">
                        <h3 className="text-xl font-bold mb-4">Importar de Anotações</h3>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {userNotes.map(note => (
                                <button key={note.id} onClick={() => handleImportNote(note)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-bible-gold">
                                    <p className="font-bold text-sm text-gray-800 dark:text-white mb-1">{note.title || 'Sem título'}</p>
                                    <p className="text-xs text-gray-500 line-clamp-2">{note.content}</p>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowNoteImport(false)} className="mt-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SermonBuilderPage;
