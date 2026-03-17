"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { BookOpen } from 'lucide-react';
import { Chapter, Note } from '../types';
import { BIBLE_BOOKS_LIST } from '../constants';
import { bibleService } from '../services/bibleService';
import { dbService } from '../services/supabase';

import Library from './reader/Library';
import ReaderView from './reader/ReaderView';
import AudioPlayerBar from './reader/AudioPlayerBar';
import { PodcastPlayer } from './reader/PodcastPlayer';
import FloatingSelectionMenu from './reader/FloatingSelectionMenu';
import QuickNoteModal from './reader/QuickNoteModal';

import useAudioNarration from '../hooks/useAudioNarration';
import usePodcastGenerator from '../hooks/usePodcastGenerator';

type ViewMode = 'library' | 'reader';

const Reader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { currentUser, userProfile, recordActivity, markChapterCompleted } = useAuth();
  const { setTitle, setSubtitle, setIcon, setBreadcrumbs, isHeaderHidden, setIsHeaderHidden, resetHeader } = useHeader();

  const [currentBookId, setCurrentBookId] = useState<string>('gn');
  const [currentChapterNum, setCurrentChapterNum] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [chapterContent, setChapterContent] = useState<Chapter | null>(null);
  const [chapterNotes, setChapterNotes] = useState<Note[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Track Session Context (Fases 3 e 4)
  const [activeTrack, setActiveTrack] = useState<any>(null);
  const [currentTrackStepIndex, setCurrentTrackStepIndex] = useState<number>(-1);

  const currentBookMetadata = useMemo(() =>
    BIBLE_BOOKS_LIST.find(b => b.id === currentBookId) || BIBLE_BOOKS_LIST[0],
    [currentBookId]
  );

  // --- HEADER MANAGEMENT ---
  useEffect(() => {
    if (viewMode === 'library') {
      setTitle('Bíblia Sagrada');
      setIcon(<BookOpen size={20} />);
      setBreadcrumbs([]);
      setIsHeaderHidden(false);
    } else {
      setTitle(`${currentBookMetadata.name} ${currentChapterNum}`);
      setSubtitle(undefined);
      setIcon(undefined);
      setBreadcrumbs([{ label: 'Bíblia', onClick: () => setViewMode('library') }]);
      setIsHeaderHidden(true); // Hide global header to avoid duplication with ReaderView toolbar
    }
    return () => resetHeader();
  }, [viewMode, currentBookMetadata, currentChapterNum, setTitle, setSubtitle, setIcon, setBreadcrumbs, setIsHeaderHidden, resetHeader]);

  const loadData = useCallback(async () => {
    if (viewMode !== 'reader') return;

    setIsLoadingContent(true);
    setError(null);
    try {
      const data = await bibleService.getChapter(currentBookId, currentChapterNum);
      if (data) {
        setChapterContent(data);
        if (currentUser) {
          const notes = await dbService.getNotesByChapter(currentUser.uid, currentBookId, currentChapterNum);
          setChapterNotes(notes as Note[]);
        }
        localStorage.setItem('biblia_last_read', JSON.stringify({ bookId: currentBookId, chapter: currentChapterNum }));

        // Check if there is a Track Session to load Devotional (Fase 3/4)
        // DESATIVADO: Funcionalidade de Trilhas está em backlog
        /*
        const state = location.state as { trackId?: string };
        if (state?.trackId) {
          const trackSnapshot = await dbService.getTracks(currentUser?.uid || 'anonymous');
          const matchedTrack = trackSnapshot.find((t: any) => t.id === state.trackId);

          if (matchedTrack) {
            const steps = matchedTrack.items || [];
            // Find which step index matches the CURRENT Bible chapter view
            const stepIdx = steps.findIndex((s: any) => s.bookId === currentBookId && Number(s.chapter) === currentChapterNum);

            setActiveTrack(matchedTrack);
            setCurrentTrackStepIndex(stepIdx);
          }
        }
        */
      }
    } catch (e) {
      setError("Erro de conexão.");
      console.error("Reader load error:", e);
    }
    finally { setIsLoadingContent(false); }
  }, [currentBookId, currentChapterNum, viewMode, currentUser, location.state]);

  useEffect(() => {
    const state = location.state as { bookId?: string, chapter?: number, scrollToVerse?: number, trackId?: string, reset?: boolean };

    // 1. Check for Reset (Mobile Nav Double Click)
    if (state?.reset) {
      setActiveTrack(null);
      setViewMode('library');
      return;
    }

    // 2. Check for Track Start
    // DESATIVADO
    /*
    if (state?.trackId) {
      dbService.getPublicTracks().then(publicTracks => {
        // Mock temporary pra achar local tracks também
      }).catch(() => { });
    }
    */

    // 3. Process Book/Chapter Navigation
    if (state?.bookId) {
      setCurrentBookId(state.bookId);
      setCurrentChapterNum(state.chapter || 1);
      if (state.scrollToVerse) setTargetVerse(state.scrollToVerse);
      setViewMode('reader');
    } else if (!initialLoadDone) {
      // 4. Fallback to Last Read (Only on initial load)
      const saved = localStorage.getItem('biblia_last_read');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentBookId(parsed.bookId);
          setCurrentChapterNum(parsed.chapter);
          setViewMode('reader');
        } catch (e) { }
      }
    }

    if (!initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [location.state, initialLoadDone]);

  useEffect(() => {
    loadData();
    if (viewMode === 'reader') {
      setSelectedVerses([]);
    }
  }, [loadData, viewMode]);

  const {
    isPlaying: isNarrationPlaying,
    isGenerating: isNarrationGenerating,
    duration: narrationDuration,
    currentTime: narrationCurrentTime,
    togglePlayPause: toggleNarrationPlayPause,
    stopAudio: stopNarration,
  } = useAudioNarration(chapterContent?.verses.map(v => v.text).join(' ') || '');

  const {
    isPlayerOpen: isPodcastPlayerOpen,
    isGenerating: isGeneratingPodcast,
    isPlaying: isPodcastPlaying,
    podcastData,
    generationPhase,
    playerState,
    generatePodcast,
    stopAndClosePodcast,
    togglePlayPause: togglePodcastPlayPause,
    seek: seekPodcast,
    skip: skipPodcast,
    setPlaybackRate: setPodcastPlaybackRate,
    savePodcast
  } = usePodcastGenerator();

  const getSelectedContent = () => {
    if (!chapterContent || selectedVerses.length === 0) return { text: '', ref: '' };
    const verses = chapterContent.verses.filter(v => selectedVerses.includes(v.number));
    const text = verses.map(v => v.text).join(' ');
    const ref = `${currentBookMetadata.name} ${currentChapterNum}:${selectedVerses.join(',')}`;
    return { text, ref };
  };

  const handleNavigateToStudio = () => {
    const { text, ref } = getSelectedContent();
    navigate('/estudio-criativo', {
      state: {
        fromReader: true,
        bookId: currentBookId,
        chapter: currentChapterNum,
        verseText: text,
        verseRef: ref
      }
    });
  };

  const handleSelectBook = (id: string, cap: number = 1, ver: number | null = null) => {
    setCurrentBookId(id);
    setCurrentChapterNum(cap);
    if (ver) setTargetVerse(ver);
    setViewMode('reader');
  };

  // MOCK: Heatmap de versículos populares (Simula que os versículos 1, 4 e 7 são muito lidos/marcados)
  const popularVersesMock = [1, 4, 7];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {viewMode === 'library' ? (
        <Library onSelectBook={handleSelectBook} />
      ) : (
        <ReaderView
          isLoading={isLoadingContent}
          chapterContent={chapterContent}
          chapterNotes={chapterNotes}
          bookMetadata={currentBookMetadata}
          currentChapterNum={currentChapterNum}
          setCurrentChapterNum={setCurrentChapterNum}
          selectedVerses={selectedVerses}
          setSelectedVerses={setSelectedVerses}
          onBackToLibrary={() => {
            setActiveTrack(null);
            setViewMode('library');
          }}
          onToggleNarration={toggleNarrationPlayPause}
          isNarrationPlaying={isNarrationPlaying}
          onGenerateChapterPodcast={() => generatePodcast(currentBookMetadata.name, chapterContent?.verses.map(v => v.text).join(' ') || '')}
          activeTrack={activeTrack}
          currentTrackStepIndex={currentTrackStepIndex}
          onNavigateTrackNext={() => {
            if (activeTrack) {
              const steps = activeTrack.items || [];
              const nextStep = steps[currentTrackStepIndex + 1];
              if (nextStep) {
                setCurrentBookId(nextStep.bookId || 'gn');
                setCurrentChapterNum(nextStep.chapter || 1);
              }
            }
          }}
          onMarkAsRead={(v) => recordActivity('mark_verse', `Lido: ${currentBookMetadata.name} ${currentChapterNum}:${v}`)}
          onChapterComplete={() => markChapterCompleted(currentBookId, currentChapterNum)}
          lastReadVerse={userProfile?.lastReadingPosition?.verse || null}
          userIsLogged={!!currentUser}
          onNavigate={(id, cap) => { setCurrentBookId(id); setCurrentChapterNum(cap); }}
          highlightedVerse={targetVerse}
          popularVerses={popularVersesMock} // Heatmap Mock
        />
      )}

      {viewMode === 'reader' && (
        <FloatingSelectionMenu
          selectedVerses={selectedVerses}
          setSelectedVerses={setSelectedVerses}
          getSelectedContent={getSelectedContent}
          onGeneratePodcast={() => generatePodcast(currentBookMetadata.name, getSelectedContent().text)}
          onAddNote={() => setIsNoteModalOpen(true)}
          onGenerateImage={handleNavigateToStudio}
          bookId={currentBookId}
          chapter={currentChapterNum}
          onMarkRead={() => recordActivity('mark_verse', `Lidos: ${getSelectedContent().ref}`)}
        />
      )}

      <QuickNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        selectedVerses={selectedVerses}
        bookId={currentBookId}
        bookName={currentBookMetadata.name}
        chapter={currentChapterNum}
        getSelectedContent={getSelectedContent}
        onSuccess={() => { loadData(); }}
        existingNotes={chapterNotes.filter(n => selectedVerses.includes(n.verse || -1))}
      />

      <AudioPlayerBar isPlaying={isNarrationPlaying} isGenerating={isNarrationGenerating} currentTime={narrationCurrentTime} duration={narrationDuration} onTogglePlay={toggleNarrationPlayPause} onStop={() => stopNarration(true)} />

      <PodcastPlayer
        isOpen={isPodcastPlayerOpen}
        isGenerating={isGeneratingPodcast}
        isPlaying={isPodcastPlaying}
        data={podcastData}
        generationPhase={generationPhase}
        playerState={playerState}
        onClose={stopAndClosePodcast}
        onTogglePlay={togglePodcastPlayPause}
        onSeek={seekPodcast}
        onSkip={skipPodcast}
        onSetPlaybackRate={setPodcastPlaybackRate}
        onSave={savePodcast}
      />
    </div>
  );
};

export default Reader;
