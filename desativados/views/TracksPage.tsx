"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { Track } from '../types';
import { generateThematicTrack } from '../services/geminiService';
import { AI_SUGGESTED_TRACKS } from '../constants';
import {
    Map, Sparkles, Plus, Loader2, ArrowRight, BookOpen, Layers, Compass, CheckCircle
} from 'lucide-react';
import SEO from '../components/SEO';
import { BIBLE_BOOKS_LIST } from '../constants';
import { searchMatch } from '../utils/textUtils';

const TracksPage: React.FC = () => {
    const { currentUser, checkFeatureAccess, openSubscription } = useAuth();
    const { setTitle, setIcon, resetHeader } = useHeader();
    const navigate = useNavigate();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    // AI State
    const [theme, setTheme] = useState('');
    const [mood, setMood] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setTitle('Trilhas de Estudo');
        setIcon(<Compass size={20} />);
        return () => resetHeader();
    }, [setTitle, setIcon, resetHeader]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await dbService.getPublicTracks();
                // Mescla trilhas do banco com as estáticas sugeridas pela IA
                setTracks([...(AI_SUGGESTED_TRACKS as unknown as Track[]), ...data]);
            } catch (e) {
                setTracks(AI_SUGGESTED_TRACKS as unknown as Track[]);
            }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handleGenerate = async () => {
        if (!theme.trim() || !mood.trim()) return;
        if (currentUser && !checkFeatureAccess('aiDeepAnalysis')) {
            openSubscription();
            return;
        }

        setIsGenerating(true);
        try {
            const trackData = await generateThematicTrack(theme, mood);
            if (trackData && trackData.steps) {
                const newTrack = {
                    ...trackData,
                    id: `gen-${Date.now()}`,
                    authorId: currentUser?.uid || 'anonymous',
                    authorName: 'Obreiro IA',
                    scope: 'personal',
                    createdAt: new Date().toISOString(),
                    tags: [theme, mood]
                };
                if (currentUser) await dbService.createTrack(newTrack);
                setTracks(prev => [newTrack as unknown as Track, ...prev]);
                setTheme(''); setMood('');
            }
        } catch (e) { console.error(e); }
        finally { setIsGenerating(false); }
    };

    const handleStartTrack = (track: any) => {
        const trackSteps = track.steps || track.items || [];
        if (trackSteps && trackSteps.length > 0) {
            const firstStep = trackSteps[0];
            let bookId = firstStep.bookId;
            let chapter = firstStep.chapter;

            // Tratamento especial para "items" de Pastor que podem ser estudos. 
            // Na Fase 2 nós exigimos 'reading' steps para ler Bíblia.
            if (!bookId && firstStep.type !== 'reading') {
                // Se o pastor incluiu um item que não é livro de leitura mas é plan/study
                // Por hora podemos apenas ir para Genesis para evitar travamento.
            }

            // Redireciona para o Player/Guia da trilha em vez de jogar direto na bíblia
            navigate(`/trilhas/${track.id}`);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
            <SEO title="Trilhas de Leitura" />
            <div className="max-w-6xl mx-auto space-y-8 pb-24">

                {/* AI Generator */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Sparkles size={180} /></div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Sparkles size={20} /> Criar Trilha Personalizada com IA
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-70">O que deseja estudar?</label>
                                <input type="text" value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ex: Paciência, Perdão..." className="w-full p-3 rounded-xl bg-white/10 border border-white/30 placeholder-white/70 text-white outline-none focus:bg-white/20 transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Como você se sente?</label>
                                <input type="text" value={mood} onChange={e => setMood(e.target.value)} placeholder="Ex: Cansado, Grato..." className="w-full p-3 rounded-xl bg-white/10 border border-white/30 placeholder-white/70 text-white outline-none focus:bg-white/20 transition-all" />
                            </div>
                            <div className="flex items-end">
                                <button onClick={handleGenerate} disabled={isGenerating || !theme} className="w-full py-3 bg-white text-blue-600 font-black uppercase text-xs tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50">
                                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : "Gerar Trilha"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracks List */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                        <Compass size={18} className="text-bible-gold" />
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Trilhas em Destaque</h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-bible-gold" size={40} /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tracks.map(track => {
                                const progStr = currentUser ? localStorage.getItem(`track_progress_${currentUser.uid}`) : null;
                                const prog = progStr ? JSON.parse(progStr) : {};
                                const trackProgress = prog[track.id];
                                const isCompleted = trackProgress === 'completed';
                                const stepsCount = track.items?.length || (track as any).steps?.length || 0;
                                const currentStepValue = typeof trackProgress === 'number' ? trackProgress : null;

                                return (
                                    <div key={track.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:border-bible-gold transition-all group flex flex-col justify-between relative overflow-hidden">
                                        {isCompleted && (
                                            <div className="absolute top-0 right-0 p-3">
                                                <CheckCircle size={24} className="text-green-500" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                                    <Layers size={20} />
                                                </div>
                                                <div className="flex gap-1">
                                                    {(track.tags || []).slice(0, 2).map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[8px] font-black uppercase rounded-full text-gray-500">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">{track.title}</h3>
                                            <p className="text-xs text-gray-500 mb-6 line-clamp-2">{track.description}</p>
                                        </div>

                                        <button
                                            onClick={() => handleStartTrack(track)}
                                            className={`w-full py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${isCompleted
                                                ? 'bg-green-50 dark:bg-green-900/10 text-green-600 hover:bg-green-100'
                                                : currentStepValue !== null
                                                    ? 'bg-amber-50 dark:bg-amber-900/10 text-bible-gold hover:bg-amber-100'
                                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-bible-gold hover:text-white'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <>Refazer Trilha <CheckCircle size={14} /></>
                                            ) : currentStepValue !== null ? (
                                                <>Continuar Passo {currentStepValue + 1}/{stepsCount} <ArrowRight size={14} /></>
                                            ) : (
                                                <>Iniciar Trilha <ArrowRight size={14} /></>
                                            )}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TracksPage;