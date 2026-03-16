"use client";
import { useNavigate } from '../../utils/router';


import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Volume2, ChevronRight, ChevronLeft, Loader2, ArrowLeft, Moon, Sun, Headphones, CheckCircle2, BookOpen, Sparkles, X, MousePointerClick, Flame, Users, PenLine, Bookmark, Maximize2, Minimize2 } from 'lucide-react';
import { Chapter, Note } from '../../types';
import SettingsModal from '../SettingsModal';
import { useSettings } from '../../contexts/SettingsContext';

import SmartText from './SmartText';

const BOOK_CHAPTER_COUNTS: { [key: string]: number } = {
    'gn': 50, 'ex': 40, 'lv': 27, 'nm': 36, 'dt': 34, 'js': 24, 'jz': 21, 'rt': 4,
    '1sm': 31, '2sm': 24, '1rs': 22, '2rs': 25, '1cr': 29, '2cr': 36, 'ed': 10, 'ne': 13, 'et': 10,
    'jo': 42, 'sl': 150, 'pv': 31, 'ec': 12, 'ct': 8, 'is': 66, 'jr': 52, 'lm': 5, 'ez': 48,
    'dn': 12, 'os': 14, 'jl': 3, 'am': 9, 'ob': 1, 'jn': 4, 'mq': 7, 'na': 3, 'hc': 3,
    'sf': 3, 'ag': 2, 'zc': 14, 'ml': 4,
    'mt': 28, 'mc': 16, 'lc': 24, 'joao': 21, 'at': 28, 'rm': 16, '1co': 16, '2co': 13,
    'gl': 6, 'ef': 6, 'fp': 4, 'cl': 4, '1ts': 5, '2ts': 3, '1tm': 6, '2tm': 4, 'tt': 3,
    'fm': 1, 'hb': 13, 'tg': 5, '1pe': 5, '2pe': 3, '1jo': 5, '2jo': 1, '3jo': 1, 'jd': 1, 'ap': 22,
    'tb': 14, 'jdt': 16, 'sab': 19, 'eclo': 51, 'br': 6, '1mc': 16, '2mc': 15
};

export interface ReaderViewProps {
    isLoading: boolean;
    chapterContent: Chapter | null;
    chapterNotes?: Note[];
    bookMetadata: { id: string; name: string };
    currentChapterNum: number;
    setCurrentChapterNum: React.Dispatch<React.SetStateAction<number>>;
    selectedVerses: number[];
    setSelectedVerses: React.Dispatch<React.SetStateAction<number[]>>;
    onBackToLibrary: () => void;
    onToggleNarration: () => void;
    isNarrationPlaying: boolean;
    onGenerateChapterPodcast: () => void;
    onMarkAsRead: (verse: number) => void;
    onChapterComplete: () => void;
    isChapterRead?: boolean;
    lastReadVerse: number | null;
    userIsLogged: boolean;
    highlightedVerse?: number | null;
    onViewNotes?: (verseNum: number) => void;
    onNavigate: (bookId: string, chapter: number, verse?: number) => void;
    popularVerses?: number[];
    activeTrack?: any;
    currentTrackStepIndex?: number;
    onNavigateTrackNext?: () => void;
}

const ReaderView: React.FC<ReaderViewProps> = ({
    isLoading, chapterContent, chapterNotes = [], bookMetadata, currentChapterNum, selectedVerses, setSelectedVerses, onBackToLibrary, onToggleNarration, isNarrationPlaying, onChapterComplete, isChapterRead, lastReadVerse, highlightedVerse, onNavigate, onGenerateChapterPodcast, popularVerses = [],
    activeTrack, currentTrackStepIndex, onNavigateTrackNext
}) => {
    const { settings, updateSettings, isFocusMode, setIsFocusMode } = useSettings();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const maxChapters = BOOK_CHAPTER_COUNTS[bookMetadata.id] || 1;
    const isLastChapter = currentChapterNum >= maxChapters;

    useEffect(() => {
        if (chapterContent && highlightedVerse) {
            setSelectedVerses([highlightedVerse]);
            setTimeout(() => {
                const el = document.getElementById(`verse-${highlightedVerse}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        } else if (chapterContent && !isLoading && contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [currentChapterNum, bookMetadata.id, highlightedVerse, chapterContent, isLoading]);

    const getFontSizeClass = (size: number) => {
        // Escala de fontes ajustada para o modo foco
        if (isFocusMode) {
            const sizes = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
            return sizes[size - 1] || 'text-2xl';
        }
        const sizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
        return sizes[size - 1] || 'text-lg';
    };

    const handleVerseClick = (e: React.MouseEvent, verseNum: number) => {
        if (isFocusMode) return;
        e.stopPropagation();

        setSelectedVerses(prev =>
            prev.includes(verseNum) ? prev.filter(v => v !== verseNum) : [...prev, verseNum].sort((a, b) => a - b)
        );
    };

    const bookProgress = (currentChapterNum / maxChapters) * 100;
    const versesWithNotes = chapterNotes.map(n => n.verse);

    return (
        <div data-testid="reader-view" className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors duration-700 ${isFocusMode ? 'bg-black' : 'bg-bible-paper dark:bg-[#0f0d0b]'}`}>

            {/* 
        HEADER AREA 
        - Standard: Toolbar com controles completos.
        - Focus: Minimalista e Sólido (sem sobreposição).
      */}
            {isFocusMode ? (
                <div className="w-full z-50 px-6 py-4 flex justify-between items-center bg-black border-b border-white/10 select-none">
                    <div className="flex items-center gap-2 text-lg md:text-xl font-serif animate-in fade-in slide-in-from-top-2 text-gray-400">
                        <span className="font-bold text-bible-gold">{bookMetadata.name}</span>
                        <span className="text-gray-600 mx-1">/</span>
                        <span className="font-bold text-gray-400">{currentChapterNum}</span>
                    </div>

                    <button
                        onClick={() => setIsFocusMode(false)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-all border border-white/5"
                        title="Sair do Modo Foco"
                    >
                        <Minimize2 size={20} />
                    </button>
                </div>
            ) : (
                <div className="sticky top-0 z-40 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#1a1a1a]/95 flex flex-col transition-all">
                    <div className="h-12 px-6 flex items-center justify-between">
                        {/* Breadcrumbs Left */}
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                            <span className="hover:text-bible-gold cursor-pointer transition-colors" onClick={onBackToLibrary}>{bookMetadata.name.toUpperCase()}</span>
                            <ChevronRight size={10} className="text-gray-300" />
                            <span className="text-gray-600 dark:text-gray-300">CAPÍTULO {currentChapterNum}</span>
                        </div>

                        {/* Actions Right */}
                        <div className="flex items-center gap-4">
                            {isLoading && <Loader2 size={14} className="animate-spin text-bible-gold" />}

                            <button onClick={() => onGenerateChapterPodcast()} className="text-gray-400 hover:text-purple-500 transition-colors" title="Podcast">
                                <Headphones size={18} />
                            </button>

                            <button onClick={onToggleNarration} className={`transition-colors ${isNarrationPlaying ? 'text-bible-gold' : 'text-gray-400 hover:text-bible-gold'}`} title="Ouvir">
                                <Volume2 size={18} />
                            </button>

                            <button onClick={() => setIsFocusMode(true)} className="text-gray-400 hover:text-bible-gold transition-colors" title="Expandir">
                                <Maximize2 size={18} />
                            </button>

                            <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-bible-gold transition-colors" title="Aparência">
                                <SettingsIcon size={18} />
                            </button>
                        </div>
                    </div>
                    {/* Progress line */}
                    <div className="h-0.5 w-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full bg-bible-gold transition-all duration-500" style={{ width: `${bookProgress}%` }}></div>
                    </div>
                </div>
            )}

            {/* CONTENT AREA */}
            <div ref={contentRef} className="flex-1 overflow-y-auto scroll-smooth">
                <div className={`mx-auto transition-all duration-500 ${isFocusMode ? 'max-w-3xl px-8 py-12' : 'max-w-2xl px-6 py-10 md:py-16 pb-40'}`}>

                    {isLoading && !chapterContent ? (
                        <div className="flex flex-col items-center justify-center py-40">
                            <Loader2 size={40} className="animate-spin text-bible-gold mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Inspirando conteúdo...</p>
                        </div>
                    ) : (
                        <div className={`space-y-6 ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>

                            {/* Chapter Header Card - Only in Standard Mode */}
                            {!isFocusMode && (
                                <div className="text-center mb-12">
                                    <span className="text-[10px] font-black uppercase text-bible-gold tracking-[0.3em] mb-2 block">Capítulo</span>
                                    <h2 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white opacity-10">{currentChapterNum}</h2>
                                    <div className="h-1 w-12 bg-bible-gold/30 mx-auto -mt-4 rounded-full"></div>
                                </div>
                            )}

                            {/* Devotional Advice from Track (Fase 3) */}
                            {activeTrack && currentTrackStepIndex !== undefined && currentTrackStepIndex >= 0 && (
                                <div className="mb-12 p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                                    <div className="flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-500">
                                        <Sparkles size={20} />
                                        <span className="text-xs font-black uppercase tracking-widest">
                                            {(activeTrack.items || activeTrack.steps)[currentTrackStepIndex]?.commentAuthor === 'ai' ? 'Consolador de IA' : 'Mensagem do Pastor'}
                                        </span>
                                    </div>

                                    <div className="relative z-10 text-amber-900 dark:text-amber-100 font-serif italic text-lg leading-relaxed">
                                        "{(activeTrack.items || activeTrack.steps)[currentTrackStepIndex]?.devotionalHtml || (activeTrack.items || activeTrack.steps)[currentTrackStepIndex]?.comment || 'Deus abençoe sua leitura e fale poderosamente ao seu coração.'}"
                                    </div>
                                </div>
                            )}

                            {/* Verses */}
                            <div className={`leading-relaxed ${getFontSizeClass(settings.fontSize)} ${isFocusMode ? 'space-y-8 text-gray-300' : 'space-y-4 text-gray-800 dark:text-gray-200'}`}>
                                {chapterContent?.verses.map((verse) => {
                                    const isSelected = selectedVerses.includes(verse.number);
                                    const isPopular = popularVerses.includes(verse.number);
                                    const hasNote = versesWithNotes.includes(verse.number);
                                    const hasFriendNote = verse.number % 7 === 0;

                                    return (
                                        <div key={verse.number} className={`relative group ${isFocusMode ? 'transition-opacity duration-500' : ''}`}>
                                            {/* Social Avatar (Phase 3) - Only Standard Mode */}
                                            {hasFriendNote && !isFocusMode && (
                                                <div className="absolute -left-6 top-1.5 opacity-50 group-hover:opacity-100 transition-opacity" title="Anotação de amigo">
                                                    <div className="w-4 h-4 rounded-full bg-purple-500 border border-white dark:border-black flex items-center justify-center text-[6px] text-white font-bold">AB</div>
                                                </div>
                                            )}

                                            <span
                                                id={`verse-${verse.number}`}
                                                data-verse={verse.number}
                                                onClick={(e) => handleVerseClick(e, verse.number)}
                                                className={`
                                            inline-block rounded-lg transition-all duration-300 cursor-pointer select-none
                                            ${isFocusMode
                                                        ? 'hover:text-white'
                                                        : `${isSelected ? 'bg-bible-gold/20 ring-1 ring-bible-gold/30' : 'hover:bg-bible-gold/5 active:bg-bible-gold/10'} p-1 mb-1`
                                                    }
                                            ${isPopular && !isFocusMode ? 'decoration-red-300/50 dark:decoration-red-900/50 underline decoration-dotted underline-offset-4 decoration-2' : ''}
                                            ${hasNote && !isFocusMode ? 'border-l-4 border-yellow-500 pl-2 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}
                                        `}
                                            >
                                                {!isFocusMode && (
                                                    <sup className={`text-[10px] font-sans font-black mr-1.5 select-none flex items-center gap-0.5 inline-flex ${isPopular ? 'text-red-400' : 'text-bible-gold/60'}`}>
                                                        {verse.number}
                                                        {hasNote && <PenLine size={8} className="text-yellow-600 dark:text-yellow-400" />}
                                                    </sup>
                                                )}

                                                <SmartText text={verse.text} enabled={settings.smartReadingMode || false} />
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Heatmap Legend - Only Standard Mode */}
                            {!isFocusMode && popularVerses.length > 0 && (
                                <div className="flex items-center justify-center gap-2 mt-8 opacity-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <Flame size={12} className="text-red-400" /> Versículos Populares na Comunidade
                                </div>
                            )}

                            {/* Navigation Footer */}
                            <div className={`pt-20 flex flex-col items-center gap-8 ${isFocusMode ? 'opacity-30 hover:opacity-100 transition-opacity' : ''}`}>
                                <div className="flex items-center gap-4 w-full">
                                    <button
                                        onClick={() => currentChapterNum > 1 && onNavigate(bookMetadata.id, currentChapterNum - 1)}
                                        disabled={currentChapterNum === 1}
                                        className={`flex-1 py-4 border rounded-2xl disabled:opacity-30 transition-all flex items-center justify-center gap-2 ${isFocusMode ? 'border-white/10 text-white hover:bg-white/10' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:text-bible-gold'}`}
                                    >
                                        <ChevronLeft size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Anterior</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (activeTrack && onNavigateTrackNext) {
                                                onNavigateTrackNext();
                                            } else {
                                                if (!isLastChapter) onNavigate(bookMetadata.id, currentChapterNum + 1);
                                                else onChapterComplete();
                                            }
                                        }}
                                        className="flex-[2] py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {activeTrack ? 'Próximo Passo da Trilha' : (isLastChapter ? 'Concluir Livro' : 'Próximo Capítulo')} <ChevronRight size={20} />
                                    </button>
                                </div>

                                {!isFocusMode && (
                                    <div className="flex items-center gap-3 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                        <BookOpen size={14} />
                                        <span>{bookMetadata.name} • Capítulo {currentChapterNum} de {maxChapters}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                updateSettings={updateSettings}
                isFocusMode={isFocusMode}
                onToggleFocus={() => setIsFocusMode(!isFocusMode)}
            />
        </div>
    );
};

export default ReaderView;
