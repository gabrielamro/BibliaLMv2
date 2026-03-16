"use client";


import React, { useState, useEffect } from 'react';
import { ChevronDown, ImageIcon, Loader2, RotateCcw, RotateCw, Pause, Play, Check, Headphones, Heart, Sparkles, Instagram, CalendarRange, PenTool, X, Share2, ScrollText, Subtitles, Minimize2, Download, Mic2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { generateShareLink } from '../../utils/shareUtils';
import { GenerationPhase } from '../../hooks/usePodcastGenerator';

interface PodcastPlayerProps {
  isOpen: boolean;
  isGenerating: boolean;
  isBuffering?: boolean;
  isPlaying: boolean;
  data: { title: string; sourceText: string; coverUrl: string | null; script?: string | null } | null;
  generationState?: any; // Deprecated prop type compatibility
  generationPhase: GenerationPhase; // New granular phase
  playerState: { duration: number; currentTime: number; playbackRate: number };
  onClose: () => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkip: (seconds: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSave: () => void;
  onDownload?: () => void;
}

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const LOADING_TIPS = [
    { icon: <Instagram size={32} className="text-pink-500" />, title: "Crie Artes Sacras", text: "Transforme versículos em imagens lindas para suas redes sociais." },
    { icon: <CalendarRange size={32} className="text-green-500" />, title: "Plano de Leitura", text: "Siga nossa meta anual e acompanhe seu progresso diário." },
    { icon: <PenTool size={32} className="text-blue-500" />, title: "Anotações Inteligentes", text: "Faça notas e peça para a IA melhorá-las automaticamente." },
    { icon: <Sparkles size={32} className="text-purple-500" />, title: "Ganhe Maná", text: "Acumule pontos lendo e desbloqueie recursos exclusivos." },
];

export const PodcastPlayer: React.FC<PodcastPlayerProps> = ({
  isOpen, isGenerating, isPlaying, data, generationPhase, playerState, onClose, onTogglePlay, onSeek, onSkip, onSetPlaybackRate, onSave, onDownload
}) => {
  const { currentUser } = useAuth();
  const [currentTip, setCurrentTip] = useState(0);
  const [showScript, setShowScript] = useState(false);

  useEffect(() => {
    if (isOpen) {
        // Reset script view unless we want to persist it
        // setShowScript(false); 
    }
  }, [isOpen]);

  useEffect(() => {
    if (isGenerating) {
        const interval = setInterval(() => {
            setCurrentTip(prev => (prev + 1) % LOADING_TIPS.length);
        }, 3500);
        return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleShare = async () => {
    if (!data) return;

    // Truncate script to avoid URL length limits causing "Invalid URL"
    const safeScript = data.script && data.script.length > 300 ? data.script.substring(0, 300) + '...' : data.script;

    // Fix: Also truncate sourceText as it can be very long (full chapter), causing share errors
    const safeSourceText = data.sourceText && data.sourceText.length > 500 ? data.sourceText.substring(0, 500) + '...' : data.sourceText;

    const link = generateShareLink('podcast', {
        text: safeSourceText,
        title: data.title,
        script: safeScript, 
        analysis: "Podcast Compartilhado"
    });

    const shareText = `🎧 Ouça este Podcast Bíblico criado com IA sobre: "${data.title}"`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Podcast: ${data.title}`,
                text: shareText,
                url: link
            });
        } catch (e) {
            console.log("Compartilhamento cancelado ou erro:", e);
        }
    } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${link}`);
        alert("Link do podcast copiado para a área de transferência!");
    }
  };
  
  const handleRateChange = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextRate = rates[(rates.indexOf(playerState.playbackRate) + 1) % rates.length];
    onSetPlaybackRate(nextRate);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center sm:p-4 pointer-events-none">
       
       {/* Backdrop Blur */}
       <div 
         className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
         onClick={onClose}
       ></div>

       {/* Main Player Card */}
       <div className="bg-bible-paper dark:bg-bible-darkPaper w-full md:max-w-5xl h-[85vh] md:h-[80vh] rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col md:flex-row overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 border-t border-white/10">
          
          <div className="md:hidden absolute top-0 left-0 right-0 h-6 flex justify-center pt-2 z-20 pointer-events-none">
             <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full opacity-50"></div>
          </div>

          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-black/5 dark:bg-white/10 hover:bg-red-100 hover:text-red-500 rounded-full z-50 transition-colors"
            title="Fechar"
          >
            <ChevronDown size={24} className="md:hidden" />
            <X size={24} className="hidden md:block" />
          </button>

          <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row w-full h-full">

            {/* LEFT SIDE: Visuals / Loading */}
            <div className="w-full md:w-1/2 bg-gray-100 dark:bg-black/20 p-4 pt-10 md:p-12 flex flex-col items-center justify-center relative shrink-0">
                
                {isGenerating ? (
                   <div className="flex flex-col items-center max-w-sm w-full text-center">
                      <div className="relative w-32 h-32 mb-8">
                          <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-bible-gold border-t-transparent rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-bible-gold">
                              {generationPhase === 'scripting' ? <PenTool size={32} className="animate-bounce" /> : <Mic2 size={32} className="animate-pulse" />}
                          </div>
                      </div>
                      
                      <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                          {generationPhase === 'scripting' ? 'Escrevendo Roteiro...' : 'Gravando Vozes...'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-8">
                          {generationPhase === 'scripting' ? 'A IA está preparando o diálogo.' : 'Gerando áudio de alta qualidade (isso pode demorar um pouco).'}
                      </p>
      
                      {/* Tips Section */}
                      <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 w-full animate-in fade-in slide-in-from-right-4 duration-500 key={currentTip}">
                          <div className="flex flex-col items-center gap-3">
                              <div className="p-3 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                                  {LOADING_TIPS[currentTip].icon}
                              </div>
                              <h4 className="font-bold text-gray-800 dark:text-white text-sm">{LOADING_TIPS[currentTip].title}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                  {LOADING_TIPS[currentTip].text}
                              </p>
                          </div>
                          <div className="flex justify-center gap-1 mt-4">
                              {LOADING_TIPS.map((_, idx) => (
                                  <div key={idx} className={`h-1 rounded-full transition-all ${idx === currentTip ? 'w-4 bg-bible-gold' : 'w-1 bg-gray-300 dark:bg-gray-600'}`} />
                              ))}
                          </div>
                      </div>
                   </div>
                ) : generationPhase === 'error' ? (
                   <div className="text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100">
                     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-3xl">⚠️</div>
                     <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Erro na Geração</h3>
                     <p className="text-sm text-red-600/80 mb-4">Não foi possível criar o podcast agora. Tente novamente.</p>
                     <button onClick={onClose} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Fechar</button>
                   </div>
                ) : (
                  // SUCCESS STATE - VISUALS
                  <div className="relative w-full max-w-[260px] md:max-w-sm aspect-square rounded-[2rem] shadow-2xl overflow-hidden bg-gray-900 border border-gray-200 dark:border-gray-800 group mx-auto">
                      {showScript ? (
                          <div className="absolute inset-0 bg-white dark:bg-gray-900 p-6 overflow-y-auto text-left animate-in fade-in zoom-in-95 scrollbar-thin">
                              <h4 className="font-bold mb-4 text-bible-gold uppercase text-[10px] tracking-widest sticky top-0 bg-white dark:bg-gray-900 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 z-10">
                                  <Subtitles size={14} /> Transcrição do Episódio
                              </h4>
                              <div className="space-y-4 font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-300 pb-8">
                                  {data?.script?.split('\n').map((line, i) => {
                                      const parts = line.split(':');
                                      if (parts.length > 1 && parts[0].length < 20) {
                                          return (
                                              <p key={i}>
                                                  <span className="font-bold text-bible-leather dark:text-bible-gold">{parts[0]}:</span>
                                                  {parts.slice(1).join(':')}
                                              </p>
                                          );
                                      }
                                      return <p key={i}>{line}</p>;
                                  })}
                              </div>
                          </div>
                      ) : (
                          <>
                              {data?.coverUrl ? (
                                  <img src={data.coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-[20s] ease-linear transform hover:scale-110" />
                              ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                      <ImageIcon size={64} className="mb-4 opacity-20" />
                                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">Sem Capa</span>
                                  </div>
                              )}
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 pointer-events-none"></div>
  
                              {isPlaying && (
                                  <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center pb-8 gap-1.5 px-8">
                                      {[...Array(12)].map((_,i) => (
                                          <div 
                                              key={i} 
                                              className="w-2 bg-white/80 rounded-full animate-pulse" 
                                              style={{ 
                                                  height: `${20 + Math.random() * 60}%`, 
                                                  animationDuration: `${0.4 + Math.random() * 0.5}s` 
                                              }}
                                          ></div>
                                      ))}
                                  </div>
                              )}
                          </>
                      )}
                      
                      {/* Script Toggle Button */}
                      {data?.script && (
                          <button 
                              onClick={() => setShowScript(!showScript)} 
                              className={`absolute top-4 left-4 p-2.5 rounded-full text-white transition-all z-20 backdrop-blur-md shadow-lg ${showScript ? 'bg-bible-gold' : 'bg-black/40 hover:bg-black/60'}`}
                              title={showScript ? "Ver Capa" : "Ler Transcrição"}
                          >
                              {showScript ? <ImageIcon size={18} /> : <ScrollText size={18} />}
                          </button>
                      )}
                  </div>
                )}
            </div>
  
            {/* RIGHT SIDE: Controls & Info */}
            <div className="w-full md:w-1/2 p-4 md:p-12 flex flex-col justify-center bg-white dark:bg-bible-darkPaper relative shrink-0">
                
                {!isGenerating && generationPhase === 'success' && (
                    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                        
                        <div className="text-center md:text-left">
                            <span className="inline-block px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest mb-3">
                                Podcast IA
                            </span>
                            <h2 className="text-xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2">
                                {data?.title || "Título do Episódio"}
                            </h2>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {data?.sourceText ? `Baseado em: ${data.sourceText.substring(0, 100)}...` : "Analisando as Escrituras..."}
                            </p>
                        </div>
  
                        <div className="space-y-2">
                            <input 
                                type="range" 
                                min="0" 
                                max={playerState.duration || 100} 
                                value={playerState.currentTime} 
                                onChange={(e) => onSeek(parseFloat(e.target.value))} 
                                className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer accent-bible-gold hover:h-3 transition-all"
                            />
                            <div className="flex justify-between text-xs font-bold text-gray-400 font-mono">
                                <span>{formatTime(playerState.currentTime)}</span>
                                <span>{formatTime(playerState.duration)}</span>
                            </div>
                        </div>
  
                        <div className="flex items-center justify-center md:justify-between gap-4">
                            <button onClick={handleRateChange} className="text-xs font-black text-gray-500 hover:text-bible-gold transition-colors w-10">
                                {playerState.playbackRate}x
                            </button>
  
                            <div className="flex items-center gap-6">
                                <button onClick={() => onSkip(-10)} className="p-3 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                                    <RotateCcw size={24} />
                                </button>
                                
                                <button 
                                  onClick={onTogglePlay} 
                                  className="w-16 h-16 md:w-20 md:h-20 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-[2rem] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                                </button>
  
                                <button onClick={() => onSkip(10)} className="p-3 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                                    <RotateCw size={24} />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {onDownload && (
                                    <button onClick={onDownload} className="text-gray-400 hover:text-bible-gold transition-colors" title="Baixar Áudio">
                                        <Download size={20} />
                                    </button>
                                )}

                                <button onClick={handleShare} className="text-gray-400 hover:text-bible-gold transition-colors w-10" title="Compartilhar">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>

       </div>
    </div>
  );
};
