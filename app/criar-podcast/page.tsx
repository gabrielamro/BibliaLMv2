"use client";
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from '../../utils/router';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import usePodcastGenerator from '../../hooks/usePodcastGenerator';
import { PodcastPlayer } from '../../components/reader/PodcastPlayer';
import { dbService } from '../../services/supabase';
import { 
  Mic2, Loader2, ArrowLeft, History, PlayCircle, BookOpen, Plus, FileText, CheckCircle2, Zap
} from 'lucide-react';

export default function CriarPodcastPage() {
    const { currentUser, checkFeatureAccess, openSubscription, openLogin } = useAuth();
    const { setTitle, setBreadcrumbs } = useHeader();
    const navigate = useNavigate();
    const location = useLocation();

    // Initial State from Navigation
    const state = location.state as { 
        verseText?: string, 
        verseRef?: string,
    } || {};

    // Form State
    const [title, setTitleInput] = useState(state.verseRef || '');
    const [verseText, setVerseText] = useState(state.verseText || '');
    const [pastoralContext, setPastoralContext] = useState('');

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const { 
        isPlayerOpen, isGenerating, isPlaying, 
        podcastData, generationPhase, playerState, generatePodcast, 
        stopAndClosePodcast, togglePlayPause, seek, skip, 
        setPlaybackRate, savePodcast, downloadAudio 
    } = usePodcastGenerator();

    useEffect(() => {
        setTitle('Criar Podcast');
        setBreadcrumbs([
            { label: 'Início', onClick: () => navigate('/') },
            { label: 'Podcast IA' }
        ]);

        // Load History
        const loadHistory = async () => {
            if (currentUser) {
                try {
                    const studies = await dbService.getAll(currentUser.uid, 'studies');
                    const podcasts = studies.filter((s: any) => s.source === 'podcast' || (s.title && s.title.toLowerCase().includes('podcast')));
                    setHistory(podcasts);
                } catch (e) {
                    console.error("Erro ao carregar histórico", e);
                } finally {
                    setLoadingHistory(false);
                }
            } else {
                setLoadingHistory(false);
            }
        };

        loadHistory();
    }, [currentUser, navigate, setTitle, setBreadcrumbs]);

    const handleGenerate = () => {
        if (!title.trim() && !verseText.trim()) {
            alert('Por favor, informe um título ou texto base.');
            return;
        }

        if (currentUser) {
            const canAccess = checkFeatureAccess('aiPodcastGen');
            if (!canAccess) { openSubscription(); return; }
        } else {
            openLogin();
            return;
        }

        let combinedText = verseText;
        if (pastoralContext.trim()) {
            combinedText += `\n\n[Contexto Pastoral / Pregação Anexada]:\n${pastoralContext}`;
        }
        
        generatePodcast(title || 'Podcast IA', combinedText || 'Inspiração diária.');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pt-6 px-4 md:px-8 pb-32 animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
                
                {/* Left Form Column */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 md:p-8 flex-[2] border border-gray-100 dark:border-[#2A2A2A] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl -z-10 rounded-full" />
                    
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center">
                            <Mic2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Estúdio de Áudio</h2>
                            <p className="text-xs text-gray-500 font-bold tracking-wider mt-1">GERAÇÃO DE PODCAST COM IA</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                <BookOpen size={14} /> Tema ou Referência
                            </label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={e => setTitleInput(e.target.value)}
                                placeholder="Ex: Salmos 23, ou 'O poder da Oração'"
                                className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                <FileText size={14} /> Tópico ou Versículos Auxiliares
                            </label>
                            <textarea 
                                value={verseText}
                                onChange={e => setVerseText(e.target.value)}
                                placeholder="Cole ou digite os versículos que formarão a base do episódio."
                                className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-serif"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                <Zap size={14} /> Estudo ou Pregação Anexada (Opcional)
                            </label>
                            <div className="relative">
                                <textarea 
                                    value={pastoralContext}
                                    onChange={e => setPastoralContext(e.target.value)}
                                    placeholder="Anexe aqui anotações, esboços do pastor ou direcionamentos para a IA. O podcast será altamente guiado por este conteúdo."
                                    className="w-full bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/40 text-gray-900 dark:text-white rounded-xl px-4 py-4 text-sm h-40 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 relative z-10"
                                />
                                <div className="absolute top-4 right-4 text-purple-300 dark:text-purple-800 z-0 opacity-50">
                                    <FileText size={48} />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed bg-purple-600 text-white`}
                        >
                            {isGenerating ? (
                                <Loader2 size={18} className="animate-spin"/>
                            ) : (
                                <Mic2 size={18} fill="currentColor"/>
                            )}
                            {isGenerating ? 'Gerando Diálogo...' : 'Gerar Episódio agora'}
                        </button>
                    </div>
                </div>

                {/* Right History Column */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 md:p-8 flex-[1] border border-gray-100 dark:border-[#2A2A2A] shadow-xl flex flex-col h-[700px]">
                    <div className="flex items-center gap-3 mb-8">
                        <History size={20} className="text-gray-400" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Seu Acervo de Áudio</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-4">
                        {loadingHistory ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                                <Mic2 size={32} className="mb-4 opacity-20" />
                                <span className="text-xs font-bold uppercase tracking-wider mb-2">Sem gravações ainda</span>
                                <span className="text-[10px] opacity-70">Gere seus primeiros estudos em áudio e eles aparecerão aqui.</span>
                            </div>
                        ) : (
                            history.map((h, i) => (
                                <div key={i} className="group p-4 bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-purple-500/50 transition-colors cursor-pointer flex items-center gap-4">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <PlayCircle size={20} className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{h.title || 'Sem Título'}</h4>
                                        <span className="text-[10px] text-gray-500 font-bold tracking-wider">PODCAST IA</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <PodcastPlayer 
                isOpen={isPlayerOpen} 
                isGenerating={isGenerating} 
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
}

