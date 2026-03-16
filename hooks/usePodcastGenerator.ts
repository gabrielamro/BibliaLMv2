"use client";
import { useNavigate } from '../utils/router';


import { useState, useRef, useCallback, useEffect } from 'react';

import { generatePodcastScript, generatePodcastAudio, generatePodcastCover } from '../services/geminiService';
import { decodeBase64, pcmToWav } from '../utils/audioUtils';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';

interface PodcastData {
  title: string;
  sourceText: string;
  coverUrl: string | null;
  script: string | null;
}

interface PlayerState {
  duration: number;
  currentTime: number;
  playbackRate: number;
}

export type GenerationPhase = 'idle' | 'scripting' | 'audio' | 'success' | 'error';

const usePodcastGenerator = () => {
  const { currentUser, checkFeatureAccess, openBuyCredits } = useAuth();
  const navigate = useNavigate();

  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [podcastData, setPodcastData] = useState<PodcastData | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    duration: 0,
    currentTime: 0,
    playbackRate: 1.0,
  });
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const checkAllowance = (): boolean => {
    if (!currentUser) {
        navigate('/login');
        return false;
    }
    
    const allowed = checkFeatureAccess('aiPodcastGen');
    if (!allowed) {
        if (confirm("Você atingiu o limite diário de Podcasts do seu plano. Deseja fazer um upgrade para o ilimitado?")) {
            openBuyCredits();
        }
        return false;
    }
    return true;
  };

  const setupAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.playbackRate = playerState.playbackRate;

    audio.onloadedmetadata = () => {
      setPlayerState(prev => ({ ...prev, duration: audio.duration }));
    };

    audio.ontimeupdate = () => {
      setPlayerState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    audio.onended = () => {
      setIsPlaying(false);
      setPlayerState(prev => ({ ...prev, currentTime: 0 }));
    };

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = (e) => {
        console.error("Audio Playback Error", e);
        alert("Erro ao reproduzir áudio. Tente novamente.");
    };

    audioRef.current = audio;
  };

  const generatePodcast = useCallback(async (title: string, sourceText: string, existingScript?: string) => {
    if (!checkAllowance()) return;

    // Reset UI
    setIsPlayerOpen(true);
    setIsGenerating(true);
    setGenerationPhase('scripting');
    isCancelledRef.current = false;
    setPodcastData(null);
    setPlayerState({ duration: 0, currentTime: 0, playbackRate: 1.0 });
    
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
    }

    try {
      // 1. Generate Script (if not provided)
      let script: string | null = existingScript || null;
      let coverUrl: string | null = null;

      // Start Cover generation in background immediately (it doesn't depend on script)
      const coverPromise = generatePodcastCover(title);

      if (!script) {
          // Phase 1: Scripting
          script = await generatePodcastScript(sourceText, title);
          if (!script || isCancelledRef.current) throw new Error("Falha ao gerar roteiro.");
      }

      // Phase 2: Audio
      setGenerationPhase('audio');
      const audioBase64 = await generatePodcastAudio(script);
      
      // Wait for cover
      const coverResult = await coverPromise;
      if (coverResult) {
          coverUrl = `data:${coverResult.mimeType};base64,${coverResult.data}`;
      }

      if (isCancelledRef.current) return;
      if (!audioBase64) throw new Error("Falha ao gerar áudio.");

      const pcmBytes = decodeBase64(audioBase64);
      const wavBlob = pcmToWav(pcmBytes, 24000, 1); 
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);

      setPodcastData({
        title,
        sourceText,
        coverUrl,
        script,
      });

      // Update Usage in DB
      if (currentUser) {
          await dbService.updateUserProfile(currentUser.uid, { 
              'usageToday.podcastsCount': (currentUser.usageToday?.podcastsCount || 0) + 1 
          } as any);
      }

      setupAudio(url);
      
      setIsGenerating(false);
      setGenerationPhase('success');
      
      try { await audioRef.current?.play(); } catch (e) { /* Auto-play blocked */ }
      
    } catch (error) {
      console.error("Erro no Podcast:", error);
      setGenerationPhase('error');
      setIsGenerating(false);
    }
  }, [currentUser, navigate, audioUrl]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime = time;
        setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    if (audioRef.current) {
        const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), audioRef.current.duration);
        audioRef.current.currentTime = newTime;
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
        audioRef.current.playbackRate = rate;
    }
    setPlayerState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  const stopAndClosePodcast = useCallback(() => {
    isCancelledRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayerOpen(false);
    setIsGenerating(false);
    setIsPlaying(false);
    setGenerationPhase('idle');
    setPodcastData(null);
    setIsSaved(false);
  }, []);

  const savePodcast = async () => {
    if (!currentUser || !podcastData) return;
    try {
        await dbService.add(currentUser.uid, 'studies', {
            title: `Podcast: ${podcastData.title}`,
            sourceText: podcastData.sourceText,
            analysis: "Podcast IA.",
            audioScript: podcastData.script,
            source: 'podcast'
        });
        setIsSaved(true);
    } catch (e) { console.error(e); }
  };

  const downloadAudio = useCallback(() => {
      if (audioUrl && podcastData) {
          const a = document.createElement('a');
          a.href = audioUrl;
          a.download = `Podcast_BibliaLM_${podcastData.title.substring(0, 20)}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  }, [audioUrl, podcastData]);

  return {
    isPlayerOpen,
    isGenerating,
    isPlaying,
    podcastData,
    generationPhase, // Use specific phase instead of generic state
    playerState,
    generatePodcast,
    stopAndClosePodcast,
    togglePlayPause,
    seek,
    skip,
    setPlaybackRate,
    savePodcast,
    downloadAudio
  };
};

export default usePodcastGenerator;
