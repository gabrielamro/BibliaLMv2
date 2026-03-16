"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { bibleService } from '../services/bibleService';
import { AI_SUGGESTED_TRACKS, BIBLE_BOOKS_LIST } from '../constants';
import { Track } from '../types';
import { useNavigate } from '../utils/router';
import { Loader2, ArrowRight, ArrowLeft, BookOpen, CheckCircle, Sparkles, Compass, Volume2, Music, PauseCircle } from 'lucide-react';
import SEO from '../components/SEO';

interface TrackReaderProps {
    trackId: string;
}

const TrackReaderPage: React.FC<TrackReaderProps> = ({ trackId }) => {
    const { setTitle, setIcon, resetHeader } = useHeader();
    const { currentUser, earnMana, showNotification } = useAuth();
    const navigate = useNavigate();

    const [track, setTrack] = useState<Track | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [verses, setVerses] = useState<{ number: number; text: string }[]>([]);
    const [loadingVerses, setLoadingVerses] = useState(false);

    // Imersão & Mídia
    const [isPlayingMusic, setIsPlayingMusic] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Setup Início (Lofi mode)
        audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/10/25/audio_9bdfc836dd.mp3?filename=lofi-study-112191.mp3');
        if (audioRef.current) {
            audioRef.current.loop = true;
            audioRef.current.volume = 0.15;
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        }
    }, []);

    useEffect(() => {
        const fetchTrack = async () => {
            setLoading(true);
            try {
                let foundTrack = AI_SUGGESTED_TRACKS.find(t => t.id === trackId) as unknown as Track;
                if (!foundTrack) {
                    foundTrack = await dbService.getTrackById(trackId) as Track;
                }
                setTrack(foundTrack);

                // Carrega persistência se houver
                if (currentUser && foundTrack) {
                    const progStr = localStorage.getItem(`track_progress_${currentUser.uid}`) || '{}';
                    const prog = JSON.parse(progStr);
                    if (prog[foundTrack.id] !== undefined && prog[foundTrack.id] !== 'completed') {
                        setCurrentStepIndex(prog[foundTrack.id]);
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar a trilha", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrack();
    }, [trackId, currentUser]);

    useEffect(() => {
        if (track) {
            setTitle(track.title);
            setIcon(<Compass size={20} />);
        }
        return () => resetHeader();
    }, [track, setTitle, setIcon, resetHeader]);

    useEffect(() => {
        const fetchStepContent = async () => {
            if (!track) return;
            const steps = track.items || (track as any).steps || [];
            const currentStep = steps[currentStepIndex];
            if (!currentStep) return;

            if (currentStep.bookId && currentStep.chapter) {
                setLoadingVerses(true);
                try {
                    const chapterData = await bibleService.getChapter(currentStep.bookId, currentStep.chapter);
                    if (chapterData && chapterData.verses) {
                        // Deduplicar e ordenar
                        const uniqueVerses = Array.from(new Map(chapterData.verses.map(v => [v.number, v])).values())
                            .sort((a, b) => a.number - b.number);

                        // Filtrar pelo intervalo de versículos se definido (ex: "1-6", "6-7", "17")
                        const versesStr: string = currentStep.verses || (currentStep as any).verses || '';
                        if (versesStr) {
                            const allowed = new Set<number>();
                            // Suporta ranges como "1-6,31-39" ou "17"
                            versesStr.split(',').forEach((part: string) => {
                                const range = part.trim().match(/^(\d+)(?:-(\d+))?$/);
                                if (range) {
                                    const start = parseInt(range[1]);
                                    const end = range[2] ? parseInt(range[2]) : start;
                                    for (let i = start; i <= end; i++) allowed.add(i);
                                }
                            });
                            setVerses(uniqueVerses.filter(v => allowed.has(v.number)));
                        } else {
                            setVerses(uniqueVerses);
                        }
                    } else {
                        setVerses([]);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoadingVerses(false);
                }
            } else {
                setVerses([]);
            }
        };
        fetchStepContent();
    }, [track, currentStepIndex]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <Loader2 className="animate-spin text-bible-gold mb-4" size={48} />
                <p className="text-gray-500 font-medium">Preparando seu guia...</p>
            </div>
        );
    }

    if (!track) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
                <Compass className="text-gray-300 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Trilha não encontrada</h2>
                <p className="text-gray-500 mt-2 mb-6">Parece que esta trilha foi removida ou o link é inválido.</p>
                <button onClick={() => navigate('/trilhas')} className="px-6 py-2 bg-bible-gold text-white rounded-xl font-bold">
                    Voltar às Trilhas
                </button>
            </div>
        );
    }

    const steps = track.items || (track as any).steps || [];
    const totalSteps = steps.length;
    const currentStep = steps[currentStepIndex];

    const bookMeta = currentStep?.bookId ? BIBLE_BOOKS_LIST.find(b => b.id === currentStep.bookId) : null;
    const versesRange = currentStep?.verses ? ` • versículos ${currentStep.verses}` : '';
    const referenceTitle = bookMeta ? `${bookMeta.name} ${currentStep.chapter}${versesRange}` : '';

    const handleNext = async () => {
        // Para TTS se estiver rodando
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        if (currentStepIndex < totalSteps - 1) {
            const nextIdx = currentStepIndex + 1;
            setCurrentStepIndex(nextIdx);
            window.scrollTo(0, 0);

            // Persistência
            if (currentUser && track.id) {
                const progStr = localStorage.getItem(`track_progress_${currentUser.uid}`) || '{}';
                const prog = JSON.parse(progStr);
                prog[track.id] = nextIdx;
                localStorage.setItem(`track_progress_${currentUser.uid}`, JSON.stringify(prog));
            }
        } else {
            // Finalizou (Gamificação + Persistência Completa)
            if (currentUser && track.id) {
                const progStr = localStorage.getItem(`track_progress_${currentUser.uid}`) || '{}';
                const prog = JSON.parse(progStr);

                if (prog[track.id] !== 'completed') {
                    prog[track.id] = 'completed';
                    localStorage.setItem(`track_progress_${currentUser.uid}`, JSON.stringify(prog));
                    await earnMana('finish_track', track.title);
                    showNotification("Jornada concluída! Você ganhou XP e cresceu no espírito.", "success");
                }
            }
            navigate('/trilhas');
        }
    };

    const handlePrev = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
            window.scrollTo(0, 0);
        }
    };

    const toggleMusic = () => {
        if (isPlayingMusic) {
            audioRef.current?.pause();
            setIsPlayingMusic(false);
        } else {
            audioRef.current?.play();
            setIsPlayingMusic(true);
        }
    };

    const playTTS = () => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        let text = "";
        if (currentStep?.devotionalHtml || (currentStep as any)?.content || (currentStep as any)?.comment) {
            const div = document.createElement('div');
            div.innerHTML = currentStep.devotionalHtml || (currentStep as any)?.content || (currentStep as any)?.comment;
            text = div.textContent || div.innerText || "";
        }

        if (text) {
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'pt-BR';
            msg.rate = 0.95;
            window.speechSynthesis.speak(msg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black/20 pb-24">
            <SEO title={track.title} />

            {/* Hero Header do Passo */}
            <div className="bg-white dark:bg-bible-darkPaper pt-8 pb-12 rounded-b-[3rem] shadow-sm border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Sparkles size={14} /> Mensagem de Reflexão
                            </div>
                            <div className="text-sm font-bold text-gray-400">
                                Passo {currentStepIndex + 1} de {totalSteps}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={playTTS} title="Ouvir Devocional" className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-bible-gold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all">
                                <Volume2 size={16} />
                            </button>
                            <button onClick={toggleMusic} title="Modo Início (Som Ambiente)" className={`p-2 rounded-full transition-all ${isPlayingMusic ? 'bg-bible-gold text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                {isPlayingMusic ? <PauseCircle size={16} /> : <Music size={16} />}
                            </button>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-8">
                        {currentStep?.title || track.title}
                    </h1>

                    {/* O Texto "Terapêutico" / Devocional */}
                    {(currentStep?.devotionalHtml || (currentStep as any)?.content || (currentStep as any)?.comment) ? (
                        <div className="prose prose-lg dark:prose-invert prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300">
                            <div dangerouslySetInnerHTML={{ __html: currentStep.devotionalHtml || (currentStep as any)?.content || (currentStep as any)?.comment || '' }} />
                        </div>
                    ) : (
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Medite profundamente sobre este trecho da bíblia. Procure a voz de Deus nas palavras.
                        </p>
                    )}

                    {/* Vídeo / Mídia Adicional (Fase 3) */}
                    {currentStep?.videoUrl && (
                        <div className="mt-8 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                            {currentStep.videoUrl.includes('youtube.com') || currentStep.videoUrl.includes('youtu.be') ? (
                                <iframe
                                    className="w-full aspect-video"
                                    src={`https://www.youtube.com/embed/${currentStep.videoUrl.split('v=')[1] || currentStep.videoUrl.split('/').pop()}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <video className="w-full aspect-video outline-none" controls>
                                    <source src={currentStep.videoUrl} type="video/mp4" />
                                    Seu navegador não suporta vídeos.
                                </video>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Conteúdo Bíblico Referente ao Passo */}
            {
                currentStep?.bookId && (
                    <div className="max-w-3xl mx-auto px-6 mt-12 mb-12">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl mt-1">
                                <BookOpen className="text-bible-gold" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {referenceTitle}
                                </h2>
                                {currentStep?.verses && (
                                    <p className="text-xs text-gray-400 font-medium mt-1">
                                        Trecho selecionado para este momento da sua jornada
                                    </p>
                                )}
                            </div>
                        </div>

                        {loadingVerses ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-bible-gold" size={32} /></div>
                        ) : verses.length > 0 ? (
                            <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                                {verses.map((v) => (
                                    <p key={v.number} className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                                        <sup className="text-xs text-bible-gold font-bold mr-2 select-none">{v.number}</sup>
                                        {v.text}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500 italic p-6 text-center border border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                                Passagem não encontrada ou indisponível no momento.
                            </div>
                        )}
                    </div>
                )
            }

            {/* Navegação Inferior Fixa ou Flutuante */}
            <div className="max-w-3xl mx-auto px-6 mt-8 flex items-center justify-between gap-4">
                <button
                    onClick={handlePrev}
                    disabled={currentStepIndex === 0}
                    className="px-6 py-4 flex items-center gap-2 font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition disabled:opacity-30"
                >
                    <ArrowLeft size={18} /> Anterior
                </button>

                <button
                    onClick={handleNext}
                    className={`flex-1 max-w-[200px] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl transition-transform hover:scale-105 ${currentStepIndex === totalSteps - 1 ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' : 'bg-bible-gold hover:bg-amber-500 shadow-amber-500/20'}`}
                >
                    {currentStepIndex === totalSteps - 1 ? (
                        <>Concluir <CheckCircle size={18} /></>
                    ) : (
                        <>Próximo <ArrowRight size={18} /></>
                    )}
                </button>
            </div>

        </div >
    );
};

export default TrackReaderPage;
