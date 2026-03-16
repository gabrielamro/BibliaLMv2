"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect, useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useFeatures } from '../contexts/FeatureContext';
import { dbService } from '../services/supabase';
import { SavedStudy, StudyStatus, StudySource } from '../types';
import { 
  PlusCircle, GraduationCap, Clock, FileText, CheckCircle2, 
  Trash2, Search, ChevronRight, Loader2, BookOpen, Layers,
  Filter, LayoutGrid, List, Sparkles, PenTool, Bookmark, MessageSquare, Coffee
} from 'lucide-react';
import SEO from '../components/SEO';

interface CategoryInfo {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
}

const SOURCE_MAP: Record<string, CategoryInfo> = {
    'sermon': { label: 'Novo', color: 'text-bible-leather dark:text-bible-gold', bgColor: 'bg-bible-gold/10', borderColor: 'border-bible-gold', icon: <PenTool size={12} /> },
    'geral': { label: 'Novo', color: 'text-bible-leather dark:text-bible-gold', bgColor: 'bg-bible-gold/10', borderColor: 'border-bible-gold', icon: <PenTool size={12} /> },
    'modulo': { label: 'Trilha IA', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-500', icon: <Sparkles size={12} /> },
    'plano': { label: 'Workspace', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-500', icon: <Layers size={12} /> },
    'leitura': { label: 'Anotação', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-500', icon: <Bookmark size={12} /> },
    'devocional': { label: 'Anotação', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-500', icon: <Coffee size={12} /> },
    'chat': { label: 'Anotação', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-500', icon: <MessageSquare size={12} /> },
    'podcast': { label: 'Podcast', color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-900/20', borderColor: 'border-pink-500', icon: <Sparkles size={12} /> }
};

const DEFAULT_CATEGORY: CategoryInfo = { label: 'Outros', color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300', icon: <FileText size={12} /> };

const FeatureDisabled = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black animate-in fade-in">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
            <PenTool className="text-gray-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Em Breve</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            O Estúdio do Autor está sendo preparado para você criar estudos profundos.
        </p>
    </div>
);

const StudyPlansPage: React.FC = () => {
  const { currentUser, showNotification } = useAuth();
  const { setTitle, setIcon, resetHeader } = useHeader();
  const { isFeatureEnabled } = useFeatures();
  const navigate = useNavigate();
  
  if (!isFeatureEnabled('module_study')) {
      return <FeatureDisabled />;
  }
  
  const [studies, setStudies] = useState<SavedStudy[]>([]);
  const [activeTabFilter, setActiveTabFilter] = useState<'drafts' | 'published'>('drafts');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle('Estúdio do Autor');
    setIcon(<PenTool size={20} />);
    return () => resetHeader();
  }, [setTitle, setIcon, resetHeader]);

  useEffect(() => {
    const fetchStudies = async () => {
        if (!currentUser) return;
        try {
            const data = await dbService.getAll(currentUser.uid, 'studies');
            setStudies(data as SavedStudy[]);
        } catch (e) { 
            console.error(e); 
            showNotification("Erro ao carregar estudos.", "error");
        }
        finally { setLoading(false); }
    };
    fetchStudies();
  }, [currentUser]);

  const filteredStudies = useMemo(() => {
      let filtered = studies;
      
      if (activeTabFilter === 'drafts') {
          filtered = filtered.filter(s => !s.status || s.status === 'draft');
      } else if (activeTabFilter === 'published') {
          filtered = filtered.filter(s => s.status === 'published');
      }

      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          filtered = filtered.filter(s => 
            s.title.toLowerCase().includes(lower) || 
            s.sourceText?.toLowerCase().includes(lower)
          );
      }
      return filtered;
  }, [studies, activeTabFilter, searchTerm]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Excluir este estudo?") || !currentUser) return;
      try {
          await dbService.delete(currentUser.uid, 'studies', id);
          setStudies(prev => prev.filter(s => s.id !== id));
          showNotification("Estudo excluído.");
      } catch (e) { console.error(e); }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
        <SEO title="Estúdio do Autor" />
        
        <div className="max-w-6xl mx-auto pb-32">
            
            {/* Header Clean */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex w-full md:w-auto gap-2 flex-1">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar estudos..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-bible-darkPaper border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 ring-bible-gold/30"
                        />
                    </div>
                </div>
                <div className="flex w-full md:w-auto justify-end">
                    <button 
                        onClick={() => navigate('/criar-estudo')} 
                        className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
                    >
                        <PlusCircle size={16} /> Novo
                    </button>
                </div>
            </div>

            {/* Filter Tabs - Estúdio do Autor */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar border-b border-gray-100 dark:border-gray-800">
                {[
                    { id: 'drafts', label: 'Rascunhos', icon: <PenTool size={14}/> },
                    { id: 'published', label: 'Publicados', icon: <Sparkles size={14}/> }
                ].map(f => (
                    <button 
                        key={f.id} 
                        onClick={() => setActiveTabFilter(f.id as any)} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-2 ${
                            activeTabFilter === f.id 
                            ? 'bg-bible-gold text-white border-bible-gold shadow-md' 
                            : 'bg-white dark:bg-bible-darkPaper border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200'
                        }`}
                    >
                        {f.icon} {f.label}
                        <span className="ml-1 px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded-full text-[10px]">
                            {f.id === 'drafts' 
                                ? studies.filter(s => !s.status || s.status === 'draft').length 
                                : studies.filter(s => s.status === 'published').length}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Loader2 className="animate-spin text-bible-gold mb-4" size={32} />
                    <p className="text-gray-400 font-serif italic text-sm">Carregando biblioteca...</p>
                </div>
            ) : filteredStudies.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-bible-darkPaper rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-4">Nenhum estudo em {activeTabFilter}</p>
                    <button onClick={() => { setActiveTabFilter('drafts'); setSearchTerm(''); }} className="text-bible-gold font-bold text-sm hover:underline">Limpar Filtros</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                    {filteredStudies.map(study => {
                        const cat = SOURCE_MAP[study.source] || DEFAULT_CATEGORY;
                        const date = new Date(study.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                        
                        return (
                            <div 
                                key={study.id} 
                                onClick={() => navigate('/estudo', { state: { ...study } })}
                                className={`bg-white dark:bg-bible-darkPaper rounded-3xl p-6 shadow-sm border-2 border-gray-100 dark:border-gray-800 flex flex-col justify-between hover:shadow-xl hover:scale-[1.02] transition-all group cursor-pointer relative overflow-hidden border-l-[8px] ${cat.borderColor}`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none -mr-4 -mt-4">
                                    <div className="scale-[2]">{cat.icon}</div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${cat.bgColor} ${cat.color}`}>
                                            {cat.icon}
                                            {cat.label}
                                        </div>
                                        <button 
                                            onClick={(e) => handleDelete(study.id!, e)} 
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                    
                                    <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-bible-gold transition-colors leading-tight">
                                        {study.title}
                                    </h3>
                                    
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed">
                                        {study.analysis ? study.analysis.replace(/<[^>]*>/g, '').substring(0, 150) : study.sourceText}
                                    </p>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                            {date.substring(0,2)}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                            {study.category || 'Geral'} • {date}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-bible-gold text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        Abrir <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

export default StudyPlansPage;