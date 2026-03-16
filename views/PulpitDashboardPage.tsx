"use client";
import { useNavigate } from '../utils/router';


import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { SavedStudy } from '../types';
import { 
  Plus, Calendar, Clock, Mic2, Archive, ArrowRight, Loader2, ArrowLeft,
  LayoutGrid, List, Search
} from 'lucide-react';
import SEO from '../components/SEO';
import SermonSetupModal from '../components/SermonSetupModal';

const PulpitDashboardPage: React.FC = () => {
    const { currentUser, showNotification } = useAuth();
    const { setTitle, setSubtitle, setIcon, resetHeader } = useHeader();
    const navigate = useNavigate();

    const [sermons, setSermons] = useState<SavedStudy[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setTitle('Púlpito Digital');
        setIcon(<Mic2 size={20} />);
        return () => resetHeader();
    }, [setTitle, setIcon, resetHeader]);

    useEffect(() => {
        const fetchSermons = async () => {
            if (!currentUser) return;
            try {
                const allStudies = await dbService.getAll(currentUser.uid, 'studies');
                // Filtrar apenas sermões
                const sermonList = (allStudies as SavedStudy[]).filter(s => s.source === 'sermon');
                setSermons(sermonList);
            } catch(e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSermons();
    }, [currentUser]);

    const handleCreateSermon = (data: { title: string, presentationDate: string, duration: number, occasion: string, mainVerse: string }) => {
        setIsSetupOpen(false);
        navigate('/pulpito/editor', {
            state: {
                prefill: {
                    title: data.title,
                    mainVerse: data.mainVerse,
                    presentationDate: data.presentationDate,
                    estimatedDuration: data.duration,
                    occasion: data.occasion
                }
            }
        });
    };

    const filteredSermons = sermons.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
        const sermonDate = s.presentationDate ? new Date(s.presentationDate) : new Date(0); // Sermões sem data vão para histórico
        const now = new Date();
        // Remove time component for comparison (optional, keeping simple)
        const isUpcoming = sermonDate >= now;

        if (activeTab === 'upcoming') return matchesSearch && isUpcoming;
        return matchesSearch && !isUpcoming;
    }).sort((a, b) => {
        const dateA = new Date(a.presentationDate || 0).getTime();
        const dateB = new Date(b.presentationDate || 0).getTime();
        // Upcoming: Ascending (Soonest first)
        // History: Descending (Recent first)
        return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
    });

    const formatDate = (isoString?: string) => {
        if (!isoString) return 'Sem Data';
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto p-4 md:p-8">
            <SEO title="Púlpito Digital" />
            <div className="max-w-6xl mx-auto pb-24">
                
                {/* Header Actions */}
                <div className="flex justify-end mb-8">
                    <button onClick={() => setIsSetupOpen(true)} className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <Plus size={16}/> Novo Sermão
                    </button>
                </div>

                {/* Tabs & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex bg-white dark:bg-bible-darkPaper p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <button onClick={() => setActiveTab('upcoming')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'upcoming' ? 'bg-bible-gold text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                            <Calendar size={14}/> Próximos Cultos
                        </button>
                        <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-bible-gold text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                            <Archive size={14}/> Arquivo
                        </button>
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Buscar sermão..." 
                            className="w-full pl-12 p-3 bg-white dark:bg-bible-darkPaper border border-gray-100 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 ring-bible-gold"
                        />
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-bible-gold" size={40}/></div>
                ) : filteredSermons.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Mic2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Nenhum sermão encontrado</h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                            {activeTab === 'upcoming' ? "Você não tem pregações agendadas." : "Seu histórico está vazio."}
                        </p>
                        {activeTab === 'upcoming' && (
                             <button onClick={() => setIsSetupOpen(true)} className="text-bible-gold font-bold hover:underline">Agendar Agora</button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                        {filteredSermons.map(sermon => (
                            <div 
                                key={sermon.id} 
                                onClick={() => navigate('/pulpito/editor', { state: { ...sermon } })}
                                className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:border-bible-gold transition-all cursor-pointer group flex flex-col h-full"
                            >
                                <div className="mb-4">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${activeTab === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {sermon.occasion || 'Geral'}
                                    </span>
                                    <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-bible-gold transition-colors">
                                        {sermon.title}
                                    </h3>
                                </div>
                                
                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span className="capitalize">{formatDate(sermon.presentationDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <Clock size={14} className="text-gray-400" />
                                        <span>{sermon.estimatedDuration || 40} min estimados</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sermon.status === 'published' ? 'Pronto' : 'Rascunho'}</span>
                                    <div className="flex items-center gap-1 text-bible-gold text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        Abrir <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
            
            <SermonSetupModal 
                isOpen={isSetupOpen} 
                onClose={() => setIsSetupOpen(false)} 
                onConfirm={handleCreateSermon} 
            />
        </div>
    );
};

export default PulpitDashboardPage;
