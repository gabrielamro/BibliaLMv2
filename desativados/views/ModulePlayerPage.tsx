"use client";
import { useNavigate, useParams } from '../utils/router';


import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { generateModuleDayContent } from '../../services/pastorAgent';
import {
    ArrowLeft, CheckCircle2, Loader2, Sparkles,
    Quote, Calendar, Target, PenLine, Save,
    BookOpen, ChevronRight, LayoutTemplate, Edit3, FileText
} from 'lucide-react';
import { StudyModule, StudyModuleDay } from '../types';
import SEO from '../components/SEO';
import SmartText from '../components/reader/SmartText';

const ModulePlayerPage: React.FC = () => {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const { currentUser, recordActivity, showNotification } = useAuth();

    const [module, setModule] = useState<StudyModule | null>(null);
    const [currentDay, setCurrentDay] = useState<StudyModuleDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userNote, setUserNote] = useState('');

    const [isEditingContent, setIsEditingContent] = useState(false);
    const [editableContent, setEditableContent] = useState('');

    useEffect(() => {
        const fetchModule = async () => {
            if (!moduleId || !currentUser) return;
            try {
                const modules = await dbService.getAll(currentUser.uid, 'study_modules');
                const found = modules.find(m => m.id === moduleId) as StudyModule;
                if (found) {
                    setModule(found);
                    const day = found.days.find(d => d.day === found.currentDay) || found.days[0];
                    setCurrentDay(day);
                    setEditableContent(day.fullContent || '');
                    if (!day.fullContent) loadDayContent(found, day);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchModule();
    }, [moduleId, currentUser]);

    const loadDayContent = async (mod: StudyModule, day: StudyModuleDay) => {
        setIsGenerating(true);
        try {
            const content = await generateModuleDayContent(mod.theme, day.title, day.baseVerses);
            if (content) {
                const updatedDays = mod.days.map(d => d.day === day.day ? { ...d, fullContent: content } : d);
                await dbService.update(currentUser!.uid, 'study_modules', mod.id, { days: updatedDays });
                setCurrentDay({ ...day, fullContent: content });
                setEditableContent(content);
            }
        } catch (e) { showNotification("Erro ao carregar conteúdo.", "error"); }
        finally { setIsGenerating(false); }
    };

    const handleSaveContent = async () => {
        if (!module || !currentDay || !currentUser) return;
        const updatedDays = module.days.map(d => d.day === currentDay.day ? { ...d, fullContent: editableContent } : d);
        try {
            await dbService.update(currentUser.uid, 'study_modules', module.id, { days: updatedDays });
            setModule({ ...module, days: updatedDays });
            setCurrentDay({ ...currentDay, fullContent: editableContent });
            setIsEditingContent(false);
            showNotification("Conteúdo atualizado!", "success");
        } catch (e) {
            showNotification("Erro ao salvar edição.", "error");
        }
    };

    const handleLeverageStudy = () => {
        if (!currentDay || !module) return;

        navigate('/criar-estudo', {
            state: {
                prefill: {
                    title: currentDay.title,
                    mainVerse: currentDay.baseVerses[0],
                    textAnalysis: currentDay.fullContent || editableContent,
                    theme: module.theme,
                    source: 'modulo'
                }
            }
        });
    };

    const handleCompleteDay = async () => {
        if (!module || !currentDay || !currentUser) return;

        const isLastDay = module.currentDay === module.durationDays;
        const nextDay = module.currentDay + 1;

        const updatedDays = module.days.map(d => d.day === module.currentDay ? { ...d, isCompleted: true } : d);
        const updates: any = { days: updatedDays };

        if (!isLastDay) updates.currentDay = nextDay;
        else updates.status = 'completed';

        try {
            await dbService.update(currentUser.uid, 'study_modules', module.id, updates);
            await recordActivity('reading_chapter', `Completou dia ${module.currentDay} de: ${module.title}`);

            if (userNote) {
                await dbService.add(currentUser.uid, 'notes', {
                    bookId: 'modulo',
                    chapter: module.currentDay,
                    content: userNote,
                    title: `Reflexão: ${module.title}`
                });
            }

            if (isLastDay) {
                showNotification("Módulo concluído com sucesso!", "success");
                navigate('/estudo/tematico');
            } else {
                window.scrollTo(0, 0);
                const nextDayObj = updatedDays.find(d => d.day === nextDay);
                setModule({ ...module, currentDay: nextDay, days: updatedDays });
                setCurrentDay(nextDayObj!);
                setUserNote('');
                setEditableContent('');
                if (!nextDayObj!.fullContent) loadDayContent(module, nextDayObj!);
                else setEditableContent(nextDayObj!.fullContent || '');
            }
        } catch (e) { console.error(e); }
    };

    if (loading || !module || !currentDay) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-bible-gold" size={40} /></div>;

    const progress = module ? (module.currentDay / module.durationDays) * 100 : 0;

    return (
        <div className="h-full bg-bible-paper dark:bg-bible-darkPaper overflow-y-auto">
            <SEO title={`${module.title} - Dia ${module.currentDay}`} />

            {/* Glassmorphism Progress Bar */}
            <div className="fixed top-0 left-0 w-full z-[100] h-1.5 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                <div
                    className="h-full bg-gradient-to-r from-bible-gold to-yellow-600 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(197,160,89,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <style>{`
            .editor-content h2 {
                font-family: 'Lora', serif;
                font-size: 1.5rem;
                line-height: 2rem;
                font-weight: 700;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                color: #c5a059;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 0.25em;
            }
            .dark .editor-content h2 { 
                border-bottom-color: #374151;
            }

            .editor-content h3 {
                font-family: 'Lora', serif;
                font-size: 1.25rem;
                font-weight: 700;
                margin-top: 1.25em;
                margin-bottom: 0.5em;
                color: #4b5563;
            }
            .dark .editor-content h3 { color: #d1d5db; }

            .editor-content blockquote {
                border-left: 4px solid #c5a059;
                padding-left: 1em;
                color: #666;
                font-style: italic;
                margin: 1.5em 0;
                background-color: rgba(197, 160, 89, 0.1);
                padding: 1em;
                border-radius: 0 0.5em 0.5em 0;
            }
            .dark .editor-content blockquote { color: #9ca3af; }

            .editor-content p {
                margin-bottom: 1em;
                line-height: 1.8;
            }
            
            .editor-content ul {
                list-style-type: disc;
                padding-left: 1.5em;
                margin-bottom: 1em;
            }
            
            .editor-content li {
                margin-bottom: 0.5em;
            }
            
            .editor-content b, .editor-content strong {
                font-weight: 700;
                color: #2d2a26;
            }
            .dark .editor-content b, .dark .editor-content strong {
                color: #e5e7eb;
            }
        `}</style>

            <div className="max-w-4xl mx-auto px-4 pt-8 pb-32">

                <div className="space-y-12">

                    <header className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 bg-bible-gold/10 text-bible-gold px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Calendar size={14} /> Dia {module.currentDay} de {module.durationDays}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-serif font-black text-gray-900 dark:text-white leading-tight">
                            {currentDay.title}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto italic">
                            "{currentDay.shortDescription}"
                        </p>
                    </header>

                    <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-inner">
                        <h3 className="text-xs font-black text-bible-gold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <BookOpen size={16} /> Alicerce Bíblico
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentDay.baseVerses.map(v => (
                                <div key={v} className="bg-white dark:bg-bible-darkPaper p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-800 flex items-center justify-between group cursor-pointer hover:border-bible-gold transition-all" onClick={() => navigate('/biblia', { state: { search: v } })}>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{v}</span>
                                    <ChevronRight className="text-gray-300 group-hover:text-bible-gold" size={18} />
                                </div>
                            ))}
                        </div>
                    </section>

                    <article className="prose dark:prose-invert prose-lg max-w-none space-y-8 relative group/article">
                        <div className="absolute -top-10 right-0 flex gap-2 opacity-0 group-hover/article:opacity-100 transition-opacity">
                            {!isEditingContent ? (
                                <button onClick={() => setIsEditingContent(true)} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-bible-gold bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Edit3 size={14} /> Editar Texto
                                </button>
                            ) : (
                                <button onClick={handleSaveContent} className="flex items-center gap-2 text-xs font-bold text-green-600 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-green-200">
                                    <Save size={14} /> Salvar Alterações
                                </button>
                            )}
                        </div>

                        {isGenerating ? (
                            <div className="py-20 flex flex-col items-center gap-4 text-center">
                                <Loader2 className="animate-spin text-bible-gold" size={48} />
                                <p className="text-bible-gold font-serif italic animate-pulse">O Obreiro IA está preparando seu estudo profundo...</p>
                            </div>
                        ) : isEditingContent ? (
                            <textarea
                                value={editableContent}
                                onChange={(e) => setEditableContent(e.target.value)}
                                className="w-full h-[600px] p-6 bg-white dark:bg-gray-900 border border-bible-gold rounded-2xl outline-none text-lg leading-relaxed font-sans resize-none shadow-inner"
                            />
                        ) : (
                            <div
                                className="editor-content whitespace-pre-wrap leading-loose text-gray-800 dark:text-gray-300 font-sans"
                                dangerouslySetInnerHTML={{ __html: currentDay.fullContent || '' }}
                            />
                        )}
                    </article>

                    <section className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl">
                        <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <PenLine size={20} className="text-purple-500" /> O que Deus falou com você?
                        </h3>
                        <textarea
                            value={userNote}
                            onChange={e => setUserNote(e.target.value)}
                            placeholder="Anote suas impressões ou uma oração pessoal..."
                            className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 ring-purple-500/20 text-base"
                        />
                    </section>

                    <div className="flex flex-col gap-4 pt-8">
                        <button
                            onClick={handleCompleteDay}
                            className="w-full py-5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                        >
                            Concluir Estudo de Hoje <CheckCircle2 size={24} />
                        </button>

                        <button
                            onClick={handleLeverageStudy}
                            className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-bible-gold hover:text-white transition-all text-xs"
                        >
                            <FileText size={18} /> Aproveitar estudo de hoje
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ModulePlayerPage;
