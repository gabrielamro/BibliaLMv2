import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pause, Play, X } from 'lucide-react';

interface AudioPlayerBarProps {
  isOpen: boolean;
  isPlaying: boolean;
  isGenerating: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  error?: string | null;
  verseNumber: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onTogglePlay: () => void;
  onPreviousVerse: () => void;
  onNextVerse: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onClose: () => void;
}

const PLAYBACK_RATES = [1, 1.25, 1.5, 2];

const formatTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isOpen,
  isPlaying,
  isGenerating,
  currentTime,
  duration,
  playbackRate,
  error,
  verseNumber,
  canGoPrevious,
  canGoNext,
  onTogglePlay,
  onPreviousVerse,
  onNextVerse,
  onPlaybackRateChange,
  onClose,
}) => {
  if (!isOpen) return null;

  const progress = Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100));
  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    onPlaybackRateChange(PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length]);
  };

  return (
    <section
      data-testid="bible-audio-player"
      aria-label="Reprodutor da Bíblia"
      className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#d8c7a7] bg-white p-3.5 text-[#3f2b1e] shadow-[0_18px_45px_rgba(42,28,14,0.22)] dark:border-[#c9a45c]/30 dark:bg-[#171411] dark:text-[#f6ead4]"
    >
      <span aria-hidden="true" className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-[#d8c7a7] bg-white dark:border-[#c9a45c]/30 dark:bg-[#171411]" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9a6a31] dark:text-[#d9b66f]">Leitura em voz alta</p>
          <p className="truncate text-xs font-bold">A partir do versículo {verseNumber}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar reprodutor" className="module-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white">
          <X size={15} />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button type="button" onClick={onPreviousVerse} disabled={!canGoPrevious || isGenerating} aria-label="Versículo anterior" className="module-focus flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfc9] disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10">
          <ChevronLeft size={17} />
        </button>
        <button type="button" onClick={onTogglePlay} disabled={isGenerating} aria-label={isGenerating ? 'Preparando áudio' : isPlaying ? 'Pausar leitura' : 'Continuar leitura'} className="module-focus flex h-11 w-11 items-center justify-center rounded-full bg-[#7c461d] text-white shadow-md disabled:cursor-wait dark:bg-[#d0aa61] dark:text-black">
          {isGenerating ? <Loader2 className="animate-spin" size={19} /> : isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
        </button>
        <button type="button" onClick={onNextVerse} disabled={!canGoNext || isGenerating} aria-label="Próximo versículo" className="module-focus flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfc9] disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10">
          <ChevronRight size={17} />
        </button>
        <button type="button" onClick={cyclePlaybackRate} aria-label={`Velocidade ${playbackRate} vezes`} className="module-focus ml-1 min-h-9 rounded-full border border-[#eadfc9] px-2.5 text-[11px] font-black dark:border-white/10">
          {playbackRate}x
        </button>
      </div>

      <div className="mt-3" aria-live="polite">
        {error ? <p role="status" className="mb-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">{error}</p> : null}
        <div className="mb-1.5 flex justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400">
          <span>{isGenerating ? 'Preparando áudio…' : formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div role="progressbar" aria-label="Andamento da leitura" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="h-1.5 overflow-hidden rounded-full bg-[#eee4d2] dark:bg-white/10">
          <div className="h-full rounded-full bg-[#b97935] transition-[width] duration-300 dark:bg-[#d0aa61]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
};

export default AudioPlayerBar;
