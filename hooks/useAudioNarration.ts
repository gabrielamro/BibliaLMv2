"use client";


import { useState, useRef, useEffect, useCallback } from 'react';
import { generateChapterAudioStream } from '../services/pastorAgent';
import { decodeAudioData } from '../utils/audioUtils';

const useAudioNarration = (chapterText: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);
  const streamStartTimeRef = useRef<number>(0);

  const stopAudio = useCallback((resetAll = false) => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
    setIsGenerating(false);
    if (resetAll) {
      nextStartTimeRef.current = 0;
      totalDurationRef.current = 0;
      setDuration(0);
      setCurrentTime(0);
    }
  }, []);
  
  const updateProgress = useCallback(() => {
    if (audioContextRef.current && isPlaying) {
      const elapsed = audioContextRef.current.currentTime - streamStartTimeRef.current;
      setCurrentTime(elapsed);
      if (elapsed < totalDurationRef.current || isGenerating) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else if (!isGenerating && elapsed >= totalDurationRef.current) {
        setIsPlaying(false);
      }
    }
  }, [isPlaying, isGenerating]);

  const startNarration = useCallback(async () => {
    if (!chapterText) return;
    stopAudio(true);
    setIsGenerating(true);

    try {
      const stream = await generateChapterAudioStream(chapterText);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      
      nextStartTimeRef.current = ctx.currentTime;
      streamStartTimeRef.current = ctx.currentTime;
      totalDurationRef.current = 0;
      let isFirstChunk = true;

      for await (const base64 of stream) {
        if (base64) {
          const buffer = await decodeAudioData(base64, ctx, 24000, 1);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = playbackRate;
          source.connect(ctx.destination);
          
          const playTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
          source.start(playTime);
          
          activeSourcesRef.current.add(source);
          source.onended = () => activeSourcesRef.current.delete(source);
          
          nextStartTimeRef.current = playTime + buffer.duration;
          totalDurationRef.current += buffer.duration;
          setDuration(totalDurationRef.current);
          
          if (isFirstChunk) {
            isFirstChunk = false;
            setIsGenerating(false); 
            setIsPlaying(true);
            animationFrameRef.current = requestAnimationFrame(updateProgress);
          }
        }
      }
    } catch (error) {
      console.error("Narration Stream Error:", error);
      setIsGenerating(false);
    } finally {
        setIsGenerating(false);
    }
  }, [chapterText, playbackRate, stopAudio, updateProgress]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.suspend();
        setIsPlaying(false);
      }
    } else {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        startNarration();
      }
    }
  }, [isPlaying, startNarration, updateProgress]);

  useEffect(() => {
    activeSourcesRef.current.forEach(source => {
      try { source.playbackRate.value = playbackRate; } catch(e) {}
    });
  }, [playbackRate]);

  return {
    isPlaying,
    isGenerating,
    duration,
    currentTime,
    playbackRate,
    togglePlayPause,
    stopAudio,
    setPlaybackRate,
  };
};

export default useAudioNarration;
