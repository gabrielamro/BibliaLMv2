"use client";

import React, { useState } from 'react';
import { Headphones, Loader2, Pause, Play, RotateCcw, RotateCw, X } from 'lucide-react';

interface AudioPlayerBarProps {
  title: string;
  isPlaying: boolean;
  isGenerating: boolean;
  onTogglePlayPause: () => void;
  onClose?: () => void;
}

export default function AudioPlayerBar({
  title,
  isPlaying,
  isGenerating,
  onTogglePlayPause,
  onClose,
}: AudioPlayerBarProps) {
  const [speed, setSpeed] = useState<number>(1.0);

  const toggleSpeed = () => {
    if (speed === 1.0) setSpeed(1.25);
    else if (speed === 1.25) setSpeed(1.5);
    else if (speed === 1.5) setSpeed(2.0);
    else setSpeed(1.0);
  };

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-[#edad2c]/40 bg-[#1f1d1a]/95 px-5 py-3 text-white shadow-2xl backdrop-blur sm:bottom-6 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edad2c]/20 text-[#edad2c]">
          <Headphones size={18} />
        </span>
        <div className="hidden sm:block max-w-[200px]">
          <p className="truncate text-xs font-bold text-white">{title}</p>
          <p className="text-[10px] text-gray-400">Áudio do Pão Diário</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {}}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white"
          title="Retroceder 10 segundos"
        >
          <RotateCcw size={15} />
        </button>

        <button
          type="button"
          onClick={onTogglePlayPause}
          disabled={isGenerating}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edad2c] text-white shadow-md transition hover:bg-[#d99c22]"
        >
          {isGenerating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-0.5 fill-white" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {}}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white"
          title="Avançar 10 segundos"
        >
          <RotateCw size={15} />
        </button>

        <button
          type="button"
          onClick={toggleSpeed}
          className="ml-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black text-[#edad2c] transition hover:bg-white/20"
        >
          {speed}x
        </button>
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
