import React from 'react';
import { Play, Pause, Loader2, X } from 'lucide-react';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  isGenerating: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onStop: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying, isGenerating, currentTime, duration, onTogglePlay, onStop
}) => {
  if (!isPlaying && !isGenerating) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-bible-darkPaper border-t border-bible-gold/20 p-4 shadow-lg z-20 flex items-center gap-4 animate-in slide-in-from-bottom-full">
      <button onClick={onTogglePlay} disabled={isGenerating} title={isPlaying ? "Pausar Leitura" : "Continuar Leitura"} className="w-12 h-12 bg-bible-gold text-white rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors shadow-md flex-shrink-0">
        {isGenerating ? <Loader2 className="animate-spin" size={24} /> : isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>
      <div className="flex-1">
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
          <span>{isGenerating ? 'Gerando áudio...' : 'Leitura em Voz Alta'}</span>
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-bible-gold transition-all duration-300" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
        </div>
      </div>
      <button onClick={onStop} title="Fechar Leitura" className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
    </div>
  );
};

export default AudioPlayerBar;