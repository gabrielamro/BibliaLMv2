"use client";
import { useNavigate, useSearchParams } from '../utils/router';


import React, { useState, useEffect } from 'react';

import { dbService } from '../services/supabase';
import { Track, TrackItem, SavedStudy, CustomPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateStructuredStudy } from '../../services/pastorAgent';
import {
    Plus, Layers, Save, Trash2, ArrowLeft, Loader2,
    FileText, Layout, GripVertical, Wand2, Sparkles, X,
    PenTool, GraduationCap, Heart, Share2, Bot, User, ListFilter
} from 'lucide-react';
import { useHeader } from '../contexts/HeaderContext';
import { useSettings } from '../contexts/SettingsContext';
import SEO from '../components/SEO';
import ConfirmationModal from '../components/ConfirmationModal';
import { BIBLE_BOOKS_LIST } from '../constants';

const TracksManagerPage: React.FC = () => {
    const { currentUser, showNotification, incrementUsage, checkFeatureAccess, openSubscription } = useAuth();
    const { setTitle: setGlobalTitle, setBreadcrumbs, resetHeader } = useHeader();
    const { setIsFocusMode } = useSettings();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [currentTrack, setCurrentTrack] = useState<Partial<Track>>({
        title: '', description: '', items: [], tags: [], isPublic: false, generatedBy: 'pastor'
    });

    // Content Selection Modal
    const [showContentSelector, setShowContentSelector] = useState(false);
    const [availableContent, setAvailableContent] = useState<(SavedStudy | CustomPlan)[]>([]);
    const [contentTypeFilter, setContentTypeFilter] = useState<'study' | 'plan' | 'reading'>('study');

    // Leitura Rica (Fase 2)
    const [readingBookId, setReadingBookId] = useState('gn');
    const [readingChapter, setReadingChapter] = useState(1);
    const [readingVerses, setReadingVerses] = useState('');
    const [devotionalHtml, setDevotionalHtml] = useState('');

    // AI Conversion
    const [isConverting, setIsConverting] = useState(false);
    const [conversionType, setConversionType] = useState<'lesson' | 'outline' | null>(null);

    useEffect(() => {
        setIsFocusMode(true);
        return () => {
            setIsFocusMode(false);
            resetHeader();
        };
    }, [setIsFocusMode, resetHeader]);

    useEffect(() => {
        const titleText = currentTrack.title || 'Gerenciador de Trilhas';
        setGlobalTitle(titleText);
        setBreadcrumbs([
            { label: 'Workspace', path: '/workspace-pastoral' },
            { label: titleText }
        ]);
    }, [currentTrack.title, setGlobalTitle, setBreadcrumbs]);

    useEffect(() => {
        loadData();
    }, [currentUser, searchParams]);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await dbService.getTracks(currentUser.uid);
            const idToEdit = searchParams.get('id');

            if (idToEdit) {
                const track = data.find(t => t.id === idToEdit);
                if (track) {
                    setCurrentTrack({
                        id: track.id,
                        authorId: track.authorId,
                        title: track.title,
                        description: track.description,
                        items: track.items || [],
                        tags: track.tags || [],
                        isPublic: track.isPublic || false,
                        generatedBy: track.generatedBy
                    });
                }
            } else {
                setCurrentTrack({ title: '', description: '', items: [], tags: [], isPublic: false, generatedBy: 'pastor' });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSaveTrack = async () => {
        if (!currentTrack.title || !currentUser) return;

        try {
            const trackData: any = {
                ...currentTrack,
                authorId: currentUser.uid,
                updatedAt: new Date().toISOString()
            };

            delete trackData.id;
            Object.keys(trackData).forEach(key => trackData[key] === undefined && delete trackData[key]);

            if (currentTrack.id) {
                await dbService.updateTrack(currentTrack.id, trackData);
            } else {
                trackData.createdAt = new Date().toISOString();
                await dbService.createTrack(trackData);
            }

            showNotification("Trilha salva!", "success");
            navigate('/workspace-pastoral');
        } catch (e) {
            showNotification("Erro ao salvar.", "error");
        }
    };

    const handleOpenContentSelector = async () => {
        if (!currentUser) return;
        setShowContentSelector(true);
        // Load available content (Studies/Plans)
        try {
            if (contentTypeFilter === 'study') {
                const studies = await dbService.getAll(currentUser.uid, 'studies');
                setAvailableContent(studies as SavedStudy[]);
            } else {
                const plans = await dbService.getUserCustomPlans(currentUser.uid);
                setAvailableContent(plans);
            }
        } catch (e) { }
    };

    const handleAddItem = (item: SavedStudy | CustomPlan) => {
        const newItem: TrackItem = {
            id: Date.now().toString(),
            refId: item.id,
            type: contentTypeFilter as 'study' | 'plan' | 'post' | 'reading',
            title: item.title,
            // Simple preview extract
            contentPreview: 'sourceText' in item ? item.sourceText : item.description
        };
        setCurrentTrack(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }));
        setShowContentSelector(false);
    };

    const handleAddReadingStep = () => {
        const bookName = BIBLE_BOOKS_LIST.find(b => b.id === readingBookId)?.name || 'Livro';
        let stepTitle = `${bookName} ${readingChapter}`;
        if (readingVerses) stepTitle += `:${readingVerses}`;

        const newItem: TrackItem = {
            id: Date.now().toString(),
            type: 'reading',
            title: stepTitle,
            subtitle: 'Leitura Guiada',
            contentPreview: devotionalHtml ? devotionalHtml.substring(0, 100) + '...' : 'Trecho de Leitura',
            devotionalHtml: devotionalHtml,
            commentAuthor: 'pastor',
            bookId: readingBookId,
            chapter: readingChapter,
            verses: readingVerses
        };

        setCurrentTrack(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }));

        setShowContentSelector(false);
        setDevotionalHtml('');
        setReadingVerses('');
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...(currentTrack.items || [])];
        newItems.splice(index, 1);
        setCurrentTrack(prev => ({ ...prev, items: newItems }));
    };

    const handleConvert = async (type: 'lesson' | 'outline') => {
        if (!currentTrack.items || currentTrack.items.length === 0) return;

        // Permissões
        const feature = type === 'lesson' ? 'aiDeepAnalysis' : 'aiSermonBuilder';
        if (!checkFeatureAccess(feature)) {
            openSubscription();
            return;
        }

        setIsConverting(true);
        setConversionType(type);

        try {
            // Aggregate content from items
            let fullContext = `Título da Trilha: ${currentTrack.title}\n\n`;
            currentTrack.items.forEach((item, idx) => {
                fullContext += `Item ${idx + 1} (${item.title}): ${item.contentPreview || 'Conteúdo referenciado'}\n\n`;
            });

            // Call AI to synthesize
            // 'deep' = Aula Completa (Lesson)
            // 'quick' = Estrutura de Tópicos (Outline/Esboço)
            const mode = type === 'lesson' ? 'deep' : 'quick';

            const generatedHtml = await generateStructuredStudy(
                currentTrack.title || (type === 'lesson' ? 'Nova Aula' : 'Novo Esboço'),
                'Baseado em Curadoria de Trilha',
                'Estudantes',
                mode
            );

            if (generatedHtml) {
                await incrementUsage('analysis');
                navigate('/criar-estudo', {
                    state: {
                        prefill: {
                            title: `${type === 'lesson' ? 'Aula' : 'Esboço'}: ${currentTrack.title}`,
                            source: 'trilha',
                            textAnalysis: generatedHtml,
                            mainVerse: 'Conteúdo Curado da Trilha'
                        }
                    }
                });
            } else {
                showNotification(`Falha ao gerar ${type === 'lesson' ? 'aula' : 'esboço'}.`, "error");
            }
        } catch (e) {
            console.error(e);
            showNotification("Erro na conversão.", "error");
        } finally {
            setIsConverting(false);
            setConversionType(null);
        }
    };

    return (
        <div className="h-full bg-bible-paper dark:bg-black overflow-y-auto flex flex-col">
            <SEO title="Gestor de Trilhas" />

            {/* HEADER NOVO PADRÃO */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 py-2 flex flex-col md:flex-row justify-between items-center shadow-sm gap-2 h-auto md:h-20 shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-bible-gold transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Gestor de Trilhas</span>
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] leading-tight">{currentTrack.title || 'Nova Trilha'}</h1>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleSaveTrack} className="px-5 py-2.5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl shadow-sm active:scale-95 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-105">
                        <Save size={16} /> Salvar Trilha
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Layers size={16} /> Informações da Trilha
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Título da Trilha</label>
                            <input
                                type="text"
                                value={currentTrack.title}
                                onChange={e => setCurrentTrack({ ...currentTrack, title: e.target.value })}
                                placeholder="Ex: Fundamentos da Fé"
                                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-base outline-none focus:ring-2 ring-bible-gold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Descrição</label>
                            <textarea
                                value={currentTrack.description}
                                onChange={e => setCurrentTrack({ ...currentTrack, description: e.target.value })}
                                placeholder="Descrição breve..."
                                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-bible-gold resize-none h-24"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={16} /> Conteúdo ({currentTrack.items?.length || 0})
                        </h3>
                        <button onClick={handleOpenContentSelector} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <Plus size={14} /> Adicionar Item
                        </button>
                    </div>

                    <div className="space-y-2">
                        {currentTrack.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 group relative">
                                <span className="text-gray-400 font-mono text-xs">{idx + 1}</span>
                                <div className="flex-1 w-full overflow-hidden">
                                    <p className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1">{item.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.type === 'reading' ? 'bg-bible-gold text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                                            {item.type === 'reading' ? 'Leitura guiada' : item.type}
                                        </span>
                                        {item.devotionalHtml && (
                                            <span className="text-[10px] text-gray-400 line-clamp-1 italic">
                                                "{item.devotionalHtml}"
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveItem(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {(currentTrack.items?.length || 0) === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 text-sm">
                                Adicione estudos ou planos para compor esta trilha.
                            </div>
                        )}
                    </div>

                    {/* Conversion Tools */}
                    {(currentTrack.items?.length || 0) > 0 && (
                        <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                            <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
                                <Sparkles size={16} /> Laboratório de Criação IA
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleConvert('outline')}
                                    disabled={isConverting}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-purple-300"
                                >
                                    {isConverting && conversionType === 'outline' ? <Loader2 className="animate-spin text-purple-500" /> : <PenTool className="text-purple-500" />}
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Gerar Esboço</span>
                                    <span className="text-[9px] text-gray-400">Tópicos e Estrutura</span>
                                </button>

                                <button
                                    onClick={() => handleConvert('lesson')}
                                    disabled={isConverting}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-purple-300"
                                >
                                    {isConverting && conversionType === 'lesson' ? <Loader2 className="animate-spin text-purple-500" /> : <GraduationCap className="text-purple-500" />}
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Gerar Aula</span>
                                    <span className="text-[9px] text-gray-400">Conteúdo Completo</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Selector Modal */}
            {showContentSelector && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-white dark:bg-bible-darkPaper w-full max-w-lg rounded-2xl p-6 shadow-2xl h-[70vh] flex flex-col">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold">Selecionar Conteúdo</h3>
                            <button onClick={() => setShowContentSelector(false)}><X size={20} /></button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <button onClick={() => { setContentTypeFilter('study'); handleOpenContentSelector(); }} className={`px-4 py-2 rounded-lg text-xs font-bold ${contentTypeFilter === 'study' ? 'bg-bible-gold text-white shadow-md shadow-amber-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>Estudos</button>
                            <button onClick={() => { setContentTypeFilter('plan'); handleOpenContentSelector(); }} className={`px-4 py-2 rounded-lg text-xs font-bold ${contentTypeFilter === 'plan' ? 'bg-bible-gold text-white shadow-md shadow-amber-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>Planos</button>
                            <button onClick={() => setContentTypeFilter('reading')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 border ${contentTypeFilter === 'reading' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-gray-900 text-gray-600 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}>
                                <FileText size={12} />  Leitura Rica
                            </button>
                        </div>

                        {contentTypeFilter === 'reading' ? (
                            <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 no-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Livro</label>
                                        <select
                                            value={readingBookId}
                                            onChange={e => setReadingBookId(e.target.value)}
                                            className="w-full p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none text-sm dark:text-white"
                                        >
                                            {BIBLE_BOOKS_LIST.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400 line-clamp-1">Capítulo / Versículos</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                value={readingChapter}
                                                onChange={e => setReadingChapter(Number(e.target.value))}
                                                className="w-16 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none text-sm dark:text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Ex: 1-5"
                                                value={readingVerses}
                                                onChange={e => setReadingVerses(e.target.value)}
                                                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none text-sm dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400 flex items-center justify-between">
                                        <span>Conselho Pastoral (Texto Guiado)</span>
                                        <span className="text-gray-300">Opcional</span>
                                    </label>
                                    <textarea
                                        value={devotionalHtml}
                                        onChange={e => setDevotionalHtml(e.target.value)}
                                        placeholder="Escreva palavras de conforto ou foco para que o Leitor leia ANTES de abrir a Bíblia e começar..."
                                        className="w-full h-28 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none resize-none text-sm dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={handleAddReadingStep}
                                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold flex gap-2 justify-center items-center text-xs shadow-md active:scale-95 transition-all mt-4"
                                >
                                    <Plus size={16} /> Adicionar Etapa na Trilha
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                                {availableContent.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAddItem(item)}
                                        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 group"
                                    >
                                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-bible-gold transition-colors">{item.title}</p>
                                    </button>
                                ))}
                                {availableContent.length === 0 && (
                                    <div className="text-center py-10 opacity-50 dark:text-gray-300 text-sm">
                                        Nenhum conteúdo pronto encontrado nesta categoria.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TracksManagerPage;
