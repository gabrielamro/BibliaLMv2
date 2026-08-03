"use client";
import { useNavigate, useLocation } from '../utils/router';


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
  const [targetVerses, setTargetVerses] = useState<number[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isNarrationPlayerOpen, setIsNarrationPlayerOpen] = useState(false);
  const [narrationStartVerse, setNarrationStartVerse] = useState(1);
  const chapterCacheRef = React.useRef(new Map<string, Chapter>());
  const activeLoadRequestRef = React.useRef(0);

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

    const requestId = ++activeLoadRequestRef.current;
    const bibleVersion = settings.bibleVersion || 'ara';
    const cacheKey = `${bibleVersion}:${currentBookId}:${currentChapterNum}`;
    const cachedChapter = chapterCacheRef.current.get(cacheKey) ?? null;

    setIsLoadingContent(!cachedChapter);
    setError(null);
    if (cachedChapter) {
      setChapterContent(cachedChapter);
    } else {
      // Não mantenha versículos do livro anterior enquanto o novo capítulo é resolvido.
      setChapterContent(null);
    }

    try {
      const data = cachedChapter ?? await bibleService.getChapter(currentBookId, currentChapterNum, bibleVersion);
      if (requestId !== activeLoadRequestRef.current) return;

      if (data) {
        chapterCacheRef.current.set(cacheKey, data);
        setChapterContent(data);
        if (currentUser) {
          const notes = await dbService.getNotesByChapter(currentUser.uid, currentBookId, currentChapterNum);
          if (requestId !== activeLoadRequestRef.current) return;
          setChapterNotes(notes as Note[]);
        } else {
          setChapterNotes([]);
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
      if (requestId !== activeLoadRequestRef.current) return;
      setError("Erro de conexão.");
      console.error("Reader load error:", e);
    }
    finally {
      if (requestId === activeLoadRequestRef.current) setIsLoadingContent(false);
    }
  }, [currentBookId, currentChapterNum, viewMode, currentUser, location.state, settings.bibleVersion]);

  useEffect(() => {
    // 1. Check for URL parameters (book, cap, vs)
    // Note: we use window.location.search here because the Next.js App Router
    // useSearchParams requires Suspense and may return stale/empty values.
    // Reading it inside the effect after pathname change is always accurate.
    const urlParams = new URLSearchParams(window.location.search);
    let bookParam = urlParams.get('book');
    const capParam = urlParams.get('cap');
    const vsParam = urlParams.get('vs');

    // Suporte ao formato shorthand ?gn&cap=2
    if (!bookParam) {
      for (const [key] of urlParams.entries()) {
        if (BIBLE_BOOKS_LIST.some(b => b.id === key)) {
          bookParam = key;
          break;
        }
      }
    }

    if (bookParam) {
      setCurrentBookId(bookParam);
      if (capParam) {
        setCurrentChapterNum(parseInt(capParam, 10));
      }
      if (vsParam) {
        setTargetVerses([parseInt(vsParam, 10)]);
      } else {
        setTargetVerses([]);
      }
      setViewMode('reader');
      if (!initialLoadDone) setInitialLoadDone(true);
      return;
    }

    const state = location.state as {
      bookId?: string;
      chapter?: number;
      scrollToVerse?: number;
      highlightVerses?: number[];
      trackId?: string;
      reset?: boolean;
    };

    // 2. Check for Reset (Mobile Nav Double Click)
    if (state?.reset) {
      setActiveTrack(null);
      setTargetVerses([]);
      setViewMode('library');
      if (!initialLoadDone) setInitialLoadDone(true);
      return;
    }

    // 3. Process Book/Chapter Navigation via state
    if (state?.bookId) {
      setCurrentBookId(state.bookId);
      setCurrentChapterNum(state.chapter || 1);
      const nextTargetVerses = state.highlightVerses?.length
        ? state.highlightVerses
        : state.scrollToVerse
          ? [state.scrollToVerse]
          : [];
      setTargetVerses(nextTargetVerses);
      setViewMode('reader');
    } else if (!initialLoadDone) {
      // 4. Iniciar sempre na Biblioteca (conforme solicitado pelo usuário)
      setTargetVerses([]);
      setViewMode('library');
    }

    if (!initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [location.pathname, location.search, location.state, initialLoadDone]);

  // Mantém o endereço fiel à leitura atual, inclusive ao selecionar um versículo.
  useEffect(() => {
    if (!initialLoadDone || viewMode !== 'reader' || !currentBookId) return;
    const params = new URLSearchParams();
    params.set(currentBookId, '');
    params.set('cap', String(currentChapterNum));
    if (selectedVerses.length === 1) params.set('vs', String(selectedVerses[0]));

    const url = `/bibliasagrada?${params.toString().replace(`${currentBookId}=`, currentBookId)}`;
    if (`${window.location.pathname}${window.location.search}` !== url) {
      window.history.replaceState(null, '', url);
    }
  }, [viewMode, currentBookId, currentChapterNum, selectedVerses, initialLoadDone]);


  useEffect(() => {
    loadData();
    if (viewMode === 'reader') {
      setSelectedVerses([]);
    }
  }, [loadData, viewMode]);

  const narrationText = useMemo(() => chapterContent?.verses
    .filter((verse) => verse.number >= narrationStartVerse)
    .map((verse) => verse.text)
    .join(' ') || '', [chapterContent, narrationStartVerse]);

  const {
    isPlaying: isNarrationPlaying,
    isGenerating: isNarrationGenerating,
    duration: narrationDuration,
    currentTime: narrationCurrentTime,
    playbackRate: narrationPlaybackRate,
    error: narrationError,
    togglePlayPause: toggleNarrationPlayPause,
    stopAudio: stopNarration,
    setPlaybackRate: setNarrationPlaybackRate,
  } = useAudioNarration(narrationText);

  const shouldRestartNarrationRef = React.useRef(false);

  useEffect(() => {
    if (!shouldRestartNarrationRef.current) return;
    shouldRestartNarrationRef.current = false;
    toggleNarrationPlayPause();
  }, [narrationStartVerse, toggleNarrationPlayPause]);

  useEffect(() => {
    stopNarration(true);
    setIsNarrationPlayerOpen(false);
    setNarrationStartVerse(chapterContent?.verses[0]?.number ?? 1);
  }, [currentBookId, currentChapterNum]);

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
    navigate('/criar-podcast', {
      state: {
        fromReader: true,
        bookId: currentBookId,
        chapter: currentChapterNum,
        verseText: text,
        verseRef: ref
      }
    });
  };

  const handleNavigateToImage = () => {
    const { text, ref } = getSelectedContent();
    navigate('/criar-arte-sacra', {
      state: {
        fromReader: true,
        bookId: currentBookId,
        chapter: currentChapterNum,
        verseText: text,
        verseRef: ref
      }
    });
  };

  const handleSelectBook = (
    id: string,
    cap: number = 1,
    ver: number | null = null,
    highlightVerses: number[] = [],
  ) => {
    setCurrentBookId(id);
    setCurrentChapterNum(cap);
    setTargetVerses(highlightVerses.length > 0 ? highlightVerses : ver ? [ver] : []);
    setViewMode('reader');
  };

  const handleBackToLibrary = () => {
    stopNarration(true);
    setIsNarrationPlayerOpen(false);
    setActiveTrack(null);
    setTargetVerses([]);
    setSelectedVerses([]);
    setViewMode('library');
    // O livro e o capítulo identificam somente o leitor; a biblioteca usa sua URL canônica.
    navigate('/bibliasagrada', { replace: true });
  };

  const handleNarrationToggle = () => {
    setIsNarrationPlayerOpen(true);
  };

  const handleNarrationVerseChange = (direction: -1 | 1) => {
    const verses = chapterContent?.verses ?? [];
    const currentIndex = verses.findIndex((verse) => verse.number === narrationStartVerse);
    const target = verses[currentIndex + direction];
    if (!target) return;

    const shouldResume = isNarrationPlaying || isNarrationGenerating;
    stopNarration(true);
    shouldRestartNarrationRef.current = shouldResume;
    setNarrationStartVerse(target.number);
    setSelectedVerses([target.number]);
    document.getElementById(`verse-${target.number}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // MOCK: Heatmap de versículos populares (Simula que os versículos 1, 4 e 7 são muito lidos/marcados)
  const popularVersesMock = [1, 4, 7];

  const handleQuickNote = (verseNum?: number) => {
    if (verseNum) {
      setSelectedVerses([verseNum]);
    }
    setIsNoteModalOpen(true);
  };

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
          onBackToLibrary={handleBackToLibrary}
          onToggleNarration={handleNarrationToggle}
          isNarrationPlaying={isNarrationPlaying}
          narrationPlayer={{
            isOpen: isNarrationPlayerOpen,
            isPlaying: isNarrationPlaying,
            isGenerating: isNarrationGenerating,
            currentTime: narrationCurrentTime,
            duration: narrationDuration,
            playbackRate: narrationPlaybackRate,
            error: narrationError,
            verseNumber: narrationStartVerse,
            canGoPrevious: (chapterContent?.verses[0]?.number ?? 1) < narrationStartVerse,
            canGoNext: (chapterContent?.verses.at(-1)?.number ?? 1) > narrationStartVerse,
            onTogglePlay: toggleNarrationPlayPause,
            onPreviousVerse: () => handleNarrationVerseChange(-1),
            onNextVerse: () => handleNarrationVerseChange(1),
            onPlaybackRateChange: setNarrationPlaybackRate,
            onClose: () => {
              stopNarration(true);
              setIsNarrationPlayerOpen(false);
            },
          }}
          onGenerateChapterPodcast={() => generatePodcast(currentBookMetadata.name, chapterContent?.verses.map(v => v.text).join(' ') || '')}
          onMarkAsRead={(v) => recordActivity('mark_verse', `Lido: ${currentBookMetadata.name} ${currentChapterNum}:${v}`)}
          onChapterComplete={() => markChapterCompleted(currentBookId, currentChapterNum)}
          lastReadVerse={userProfile?.lastReadingPosition?.verse || null}
          userIsLogged={!!currentUser}
          onNavigate={(id, cap) => {
            setCurrentBookId(id);
            setCurrentChapterNum(cap);
            setSelectedVerses([]);
            setTargetVerses([]);
          }}
          highlightedVerses={targetVerses}
          onQuickNote={handleQuickNote}
          popularVerses={popularVersesMock} // Heatmap Mock
        />
      )}

      {viewMode === 'reader' && (
        <FloatingSelectionMenu
          selectedVerses={selectedVerses}
          setSelectedVerses={setSelectedVerses}
          getSelectedContent={getSelectedContent}
          onGeneratePodcast={handleNavigateToStudio}
          onGenerateImage={handleNavigateToImage}
          onAddNote={() => handleQuickNote()}
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
