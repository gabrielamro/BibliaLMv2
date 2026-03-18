"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { generateSermonOutline } from '../services/pastorAgent';
import { Mic2, Save, Plus, Trash2, Loader2, BookOpen, Clock, FileText, Sparkles, Shield, ArrowLeft, CheckCircle2, AlertCircle, Quote, Crown } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

interface SermonVerse {
  id: string;
  ref: string;
  text: string;
  isLoading?: boolean;
}

interface ScheduleItem {
  id: string;
  type: 'prayer' | 'worship' | 'notice' | 'media' | 'preaching';
  title: string;
  durationMin: number;
  notes: string;
}

const SermonBuilderPage: React.FC = () => {
  const { currentUser, earnMana, checkFeatureAccess, incrementUsage, openSubscription, openLogin, showNotification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { text?: string, ref?: string, existingContent?: string, existingSchedule?: any[] } | null;

  const [title, setTitle] = useState(state?.ref ? `Sermão: ${state.ref}` : '');
  const [verses, setVerses] = useState<SermonVerse[]>([
      { id: '1', ref: state?.ref || '', text: state?.text || '', isLoading: false }
  ]);
  const [content, setContent] = useState(state?.existingContent || '');
  const [schedule, setSchedule] = useState<ScheduleItem[]>(state?.existingSchedule || [
      { id: '1', type: 'prayer', title: 'Oração Inicial', durationMin: 5, notes: '' },
      { id: '2', type: 'worship', title: 'Louvor', durationMin: 15, notes: '' },
      { id: '3', type: 'preaching', title: 'Pregação', durationMin: 40, notes: '' }
  ]);
  
  const [activeTab, setActiveTab] = useState<'editor' | 'outline' | 'pulpit'>('editor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTheme, setAiTheme] = useState('');
  const [aiAudience, setAiAudience] = useState('Geral');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void, variant?: any}>({
      isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  const handleAddVerse = () => {
      setVerses([...verses, { id: Date.now().toString(), ref: '', text: '' }]);
  };

  const handleUpdateVerse = (id: string, field: keyof SermonVerse, value: string) => {
      setVerses(verses.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleRemoveVerse = (id: string) => {
      setVerses(verses.filter(v => v.id !== id));
  };

  const openConfirmAISermon = () => {
    if (!aiTheme && !verses.some(v => v.text)) {
        setModalConfig({
            isOpen: true,
            title: "Dados Incompletos",
            message: "Defina um tema ou adicione versículos para que o Obreiro IA possa estruturar seu esboço.",
            onConfirm: () => setModalConfig(p => ({...p, isOpen: false})),
            variant: 'warning'
        });
        return;
    }

    const canAccess = checkFeatureAccess('aiSermonBuilder');
    if (!canAccess) {
        setShowLimitModal(true);
        return;
    }

    handleGenerateOutline();
  };

  const handleGenerateOutline = async () => {
    setModalConfig(p => ({...p, isOpen: false}));
    setIsGenerating(true);
    try {
        const contextText = verses.map(v => `${v.ref} ${v.text}`).join('\n');
        const outline = await generateSermonOutline(contextText, aiTheme, aiAudience, aiTheme);
        if (outline) {
            await incrementUsage('analysis');
            setContent(prev => prev + '\n\n' + outline);
            setShowAIPanel(false);
            setActiveTab('editor');
        }
    } catch (e) {
        showNotification("Erro na conexão com o Obreiro IA.", "error");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
        setModalConfig({
            isOpen: true,
            title: "Título Necessário",
            message: "Por favor, dê um título ao seu sermão antes de salvá-lo na nuvem.",
            onConfirm: () => setModalConfig(p => ({...p, isOpen: false})),
            variant: 'warning'
        });
        return;
    }

    try {
      const sourceText = verses.map(v => `${v.ref}: ${v.text}`).join('\n').substring(0, 500);
      await dbService.add(currentUser!.uid, 'studies', {
        title,
        sourceText: sourceText || "Sermão",
        analysis: content,
        source: 'sermon',
        serviceSchedule: schedule
      });
      await earnMana('create_sermon');
      navigate('/meus-estudos');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black/20 overflow-hidden">
        <div className="bg-white dark:bg-bible-darkPaper border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold font-serif text-gray-900 dark:text-white flex items-center gap-2">
                    <Mic2 size={24} className="text-bible-gold" /> Púlpito Digital
                </h1>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                <button onClick={() => setActiveTab('editor')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-500'}`}>Editor</button>
                <button onClick={() => setActiveTab('pulpit')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'pulpit' ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-500'}`}>Modo Púlpito</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
            {activeTab === 'editor' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Título do Sermão</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="w-full text-2xl font-bold font-serif bg-transparent border-b-2 border-gray-100 dark:border-gray-800 focus:border-bible-gold transition-colors outline-none py-2"
                            placeholder="Ex: O Poder da Oração"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"><FileText size={18} className="text-bible-gold"/> Conteúdo Homilético</h3>
                                    <button onClick={() => setShowAIPanel(!showAIPanel)} className="text-[10px] font-black uppercase tracking-widest bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full border border-purple-100 dark:border-purple-800 flex items-center gap-2 hover:bg-purple-100 transition-colors">
                                        <Sparkles size={14}/> {showAIPanel ? 'Fechar IA' : 'Esboço IA'}
                                    </button>
                                </div>

                                {showAIPanel && (
                                    <div className="mb-6 p-5 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/30 animate-in fade-in slide-in-from-top-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-purple-400 uppercase ml-1">Tema Principal</label>
                                                <input type="text" placeholder="Fé, Perdão, Família..." value={aiTheme} onChange={(e) => setAiTheme(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 text-sm outline-none focus:ring-2 ring-purple-500/20" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-purple-400 uppercase ml-1">Público-Alvo</label>
                                                <input type="text" placeholder="Jovens, Casais, Igreja..." value={aiAudience} onChange={(e) => setAiAudience(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 text-sm outline-none focus:ring-2 ring-purple-500/20" />
                                            </div>
                                        </div>
                                        <button onClick={openConfirmAISermon} disabled={isGenerating} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-purple-700 transition-all active:scale-[0.98] disabled:opacity-50">
                                            {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>} Gerar Esboço com IA
                                        </button>
                                    </div>
                                )}

                                <textarea 
                                    value={content} 
                                    onChange={(e) => setContent(e.target.value)} 
                                    className="w-full h-[500px] p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-bible-gold/30 outline-none resize-none text-base leading-relaxed font-sans"
                                    placeholder="Escreva seu sermão aqui. Use o modo Púlpito para pregar..."
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2"><BookOpen size={18} className="text-bible-gold"/> Referências</h3>
                                <div className="space-y-4">
                                    {verses.map((verse, idx) => (
                                        <div key={verse.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 relative group animate-in slide-in-from-right-2">
                                            <input 
                                                type="text" 
                                                value={verse.ref} 
                                                onChange={(e) => handleUpdateVerse(verse.id, 'ref', e.target.value)}
                                                className="w-full bg-transparent font-bold text-sm mb-2 outline-none text-bible-gold placeholder-gray-400"
                                                placeholder="João 3:16"
                                            />
                                            <textarea 
                                                value={verse.text}
                                                onChange={(e) => handleUpdateVerse(verse.id, 'text', e.target.value)}
                                                className="w-full bg-transparent text-xs text-gray-600 dark:text-gray-300 resize-none outline-none placeholder-gray-400 italic"
                                                rows={3}
                                                placeholder="Texto bíblico..."
                                            />
                                            {idx > 0 && (
                                                <button onClick={() => handleRemoveVerse(verse.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 p-1 transition-colors">
                                                    <Trash2 size={16}/>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={handleAddVerse} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-bible-gold hover:text-bible-gold transition-all flex items-center justify-center gap-2 group">
                                        <Plus size={16} className="group-hover:scale-110 transition-transform"/> Adicionar Texto
                                    </button>
                                </div>
                            </div>

                            <button onClick={handleSave} className="w-full py-5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-[0.1em] rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
                                <Save size={20}/> Salvar Sermão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'pulpit' && (
                <div className="max-w-4xl mx-auto pb-20 animate-in zoom-in-95 duration-500">
                    <div className="bg-bible-leather text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl min-h-[85vh] flex flex-col border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-5 pointer-events-none -mt-10 -mr-10"><Mic2 size={300} /></div>
                        <div className="border-b border-white/10 pb-6 mb-8 flex justify-between items-end relative z-10">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-serif font-bold text-bible-gold mb-2 leading-tight">{title || "Sem Título"}</h1>
                                <div className="flex items-center gap-4 text-white/50 text-xs font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Clock size={14}/> Modo Púlpito</span>
                                    <span className="flex items-center gap-1.5"><BookOpen size={14}/> {verses.length} Leituras</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-4 text-xl leading-relaxed space-y-10 custom-scrollbar relative z-10">
                            {verses.length > 0 && verses[0].text && (
                                <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border-l-8 border-bible-gold shadow-lg mb-10 group">
                                    <div className="flex items-center gap-2 mb-4 text-bible-gold opacity-50"><Quote size={20} /></div>
                                    {verses.map(v => v.text && (
                                        <div key={v.id} className="mb-6 last:mb-0">
                                            <p className="font-serif italic text-2xl text-white/90 mb-3 leading-relaxed">"{v.text}"</p>
                                            <p className="text-bible-gold font-black text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="h-px w-6 bg-bible-gold/30"></div> {v.ref}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="whitespace-pre-wrap font-sans text-white/80 selection:bg-bible-gold selection:text-black">
                                {content || "Escreva o conteúdo do sermão no editor..."}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <ConfirmationModal 
            isOpen={showLimitModal} 
            onClose={() => setShowLimitModal(false)} 
            onConfirm={() => openSubscription()} 
            title="Cota Atingida" 
            message="Você atingiu seu limite diário. Assine um plano premium para continuar." 
            confirmText="Ver Planos Premium" 
            variant="warning" 
        />

        <ConfirmationModal 
            isOpen={modalConfig.isOpen}
            onClose={() => setModalConfig(p => ({...p, isOpen: false}))}
            onConfirm={modalConfig.onConfirm}
            title={modalConfig.title}
            message={modalConfig.message}
            variant={modalConfig.variant}
        />
    </div>
  );
};

export default SermonBuilderPage;
