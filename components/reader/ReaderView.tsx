import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Settings as SettingsIcon, Volume2, ChevronRight, ChevronLeft, Loader2, ArrowLeft, Moon, Sun, Headphones, CheckCircle2, BookOpen, Sparkles, X, MousePointerClick, Flame, Users, PenLine, Bookmark, Maximize2, Minimize2, Search } from 'lucide-react';
import { Chapter, Note } from '../../types';
import SettingsModal from '../SettingsModal';
import { useSettings } from '../../contexts/SettingsContext';
import SmartText from './SmartText';
import { extractVerseLead } from '../../utils/verseTypography';
import { BIBLE_BOOKS_LIST } from '../../constants';

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
    highlightedVerses?: number[];
    onViewNotes?: (verseNum: number) => void;
    onNavigate: (bookId: string, chapter: number, verse?: number) => void;
    onQuickNote?: (verseNum: number) => void;
    popularVerses?: number[];
}

const ReaderView: React.FC<ReaderViewProps> = ({
    isLoading, chapterContent, chapterNotes = [], bookMetadata, currentChapterNum, selectedVerses, setSelectedVerses, onBackToLibrary, onToggleNarration, isNarrationPlaying, onChapterComplete, isChapterRead, lastReadVerse, highlightedVerses = [], onNavigate, onGenerateChapterPodcast, onQuickNote, popularVerses = []
}) => {
    const { settings, updateSettings, isFocusMode, setIsFocusMode } = useSettings();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [expandedVerseStart, setExpandedVerseStart] = useState<number | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const highlightedVersesKey = highlightedVerses.join(',');
    const firstHighlightedVerse = highlightedVerses[0] ?? null;

    // Smart Header: hide on scroll down, show on scroll up
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [searchBarVisible, setSearchBarVisible] = useState(true);
    const lastScrollY = useRef(0);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const handleScroll = () => {
            const currentY = el.scrollTop;
            const scrollingUp = currentY < lastScrollY.current;
            const scrolledEnough = Math.abs(currentY - lastScrollY.current) > 5;
            if (scrolledEnough) {
                setSearchBarVisible(scrollingUp || currentY < 60);
            }
            lastScrollY.current = currentY;
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, []);

    // Filter books for search
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().trim();
        // Parse "João 3" or "salmos" patterns
        const parts = q.split(/\s+/);
        const namePart = parts.slice(0, parts.length > 1 && !isNaN(Number(parts[parts.length - 1])) ? -1 : undefined).join(' ');
        const chapterPart = parts.length > 1 && !isNaN(Number(parts[parts.length - 1])) ? Number(parts[parts.length - 1]) : null;

        return BIBLE_BOOKS_LIST
            .filter(b => b.name.toLowerCase().includes(namePart))
            .slice(0, 5)
            .map(b => ({ book: b, chapter: chapterPart }));
    }, [searchQuery]);

    const handleSearchNavigate = (bookId: string, chapter: number) => {
        onNavigate(bookId, chapter);
        setSearchQuery('');
        setShowSearchBar(false);
        if (searchInputRef.current) searchInputRef.current.blur();
    };

    const maxChapters = BOOK_CHAPTER_COUNTS[bookMetadata.id] || 1;
    const isLastChapter = currentChapterNum >= maxChapters;

    // 1. Efeito de Scroll Inicial e Mudança de Conteúdo
    useEffect(() => {
        if (chapterContent && !isLoading && contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [currentChapterNum, bookMetadata.id, isLoading, chapterContent]);

    // 2. Efeito de Scroll para Versículos Destacados
    useEffect(() => {
        if (chapterContent && highlightedVerses.length > 0 && firstHighlightedVerse) {
            setSelectedVerses(highlightedVerses);
            const timer = setTimeout(() => {
                const el = document.getElementById(`verse-${firstHighlightedVerse}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [highlightedVersesKey, firstHighlightedVerse, chapterContent, setSelectedVerses]);

    // 3. Efeito de Scroll ao Expandir/Trocar Modo (Garantir Topo)
    useEffect(() => {
        if (isFocusMode && contentRef.current) {
            // Tentativa instantânea de zerar
            contentRef.current.scrollTop = 0;
            // Delay de segurança maior para assegurar pós-renderização em mobile
            const timer = setTimeout(() => {
                if (contentRef.current) {
                    contentRef.current.scrollTop = 0;
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isFocusMode, expandedVerseStart]);

    const getFontSizeClass = (size: number) => {
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
    const notesCountByVerse = useMemo(() => {
        const map = new Map<number, number>();
        chapterNotes.forEach(note => {
            if (note.verse) {
                map.set(note.verse, (map.get(note.verse) || 0) + 1);
            }
        });
        return map;
    }, [chapterNotes]);

    return (
        <div className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors duration-700 ${isFocusMode ? 'bg-black' : 'bg-bible-paper dark:bg-[#0f0d0b]'}`}>
            {isFocusMode ? (
                <div className="sticky top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-black/90 backdrop-blur-sm border-b border-white/10 select-none">
                    <div className="flex items-center gap-2 text-lg md:text-xl font-serif animate-in fade-in slide-in-from-top-2 text-gray-400">
                        <span className="font-bold text-bible-gold">{bookMetadata.name}</span>
                        <span className="text-gray-600 mx-1">/</span>
                        <span className="font-bold text-gray-400">{currentChapterNum}</span>
                    </div>

                    <button
                        onClick={() => {
                            setIsFocusMode(false);
                            setExpandedVerseStart(null);
                        }}
                        className="p-3 bg-bible-gold hover:bg-bible-gold/80 rounded-full text-black transition-all shadow-xl shadow-bible-gold/20"
                        title="Sair do Modo Foco"
                    >
                        <X size={20} />
                    </button>
                </div>
            ) : (
                <div className="sticky top-0 z-40 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#0a0a0a]/95 flex flex-col transition-all">
                    <div className="h-12 px-4 md:px-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                            <button onClick={onBackToLibrary} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-bible-gold/40 hover:text-bible-gold dark:border-gray-700 dark:text-gray-300" title="Voltar"><ArrowLeft size={14} /></button>
                            <span className="hover:text-bible-gold cursor-pointer transition-colors" onClick={onBackToLibrary}>{bookMetadata.name.toUpperCase()}</span>
                            <ChevronRight size={10} className="text-gray-300" />
                            <span className="text-gray-600 dark:text-gray-300">CAP. {currentChapterNum}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {isLoading && <Loader2 size={14} className="animate-spin text-bible-gold" />}
                            {/* Botão de busca: apenas mobile */}
                            <button
                                onClick={() => { setShowSearchBar(v => !v); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                                className="md:hidden text-gray-400 hover:text-bible-gold transition-colors"
                                title="Buscar"
                            >
                                <Search size={18} />
                            </button>
                            <button onClick={() => onGenerateChapterPodcast()} className="hidden md:block text-gray-400 hover:text-purple-500 transition-colors" title="Podcast"><Headphones size={18} /></button>
                            <button onClick={onToggleNarration} className={`transition-colors ${isNarrationPlaying ? 'text-bible-gold' : 'text-gray-400 hover:text-bible-gold'}`} title="Ouvir"><Volume2 size={18} /></button>
                            <button onClick={() => setIsFocusMode(true)} className="text-gray-400 hover:text-bible-gold transition-colors" title="Expandir"><Maximize2 size={18} /></button>
                            <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-bible-gold transition-colors" title="Aparência"><SettingsIcon size={18} /></button>
                        </div>
                    </div>

                    {/* Smart Search Bar — visível apenas no mobile, desliza com o scroll */}
                    <div
                        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                            showSearchBar && searchBarVisible ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                    >
                        <div className="px-4 pb-2 pt-1 relative">
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
                                <Search size={14} className="text-bible-gold flex-shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Ex: João 3, Salmos 23..."
                                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            {/* Resultados da busca */}
                            {searchResults.length > 0 && (
                                <div className="absolute left-4 right-4 top-full mt-0.5 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                                    {searchResults.map(({ book, chapter }) => {
                                        const bookChapters = BOOK_CHAPTER_COUNTS[book.id] || 1;
                                        const targetChapter = chapter && chapter >= 1 && chapter <= bookChapters ? chapter : 1;
                                        return (
                                            <button
                                                key={book.id}
                                                onClick={() => handleSearchNavigate(book.id, targetChapter)}
                                                className="w-full px-4 py-3 text-left hover:bg-bible-gold/10 dark:hover:bg-bible-gold/10 transition-colors flex items-center justify-between border-b border-gray-50 dark:border-gray-800 last:border-0"
                                            >
                                                <div>
                                                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{book.name}</span>
                                                    {chapter && <span className="ml-2 text-xs text-bible-gold font-bold">Cap. {targetChapter}</span>}
                                                </div>
                                                <ChevronRight size={14} className="text-gray-400" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-0.5 w-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full bg-bible-gold transition-all duration-500" style={{ width: `${bookProgress}%` }}></div>
                    </div>
                </div>
            )}

            <div ref={contentRef} className="flex-1 overflow-y-auto">
                <div className={`mx-auto transition-all duration-500 ${isFocusMode ? 'max-w-3xl px-8 py-12' : 'max-w-2xl md:max-w-3xl xl:max-w-4xl px-6 py-10 md:py-16 pb-40'}`}>
                    {isLoading && !chapterContent ? (
                        <div className="flex flex-col items-center justify-center py-40">
                            <Loader2 size={40} className="animate-spin text-bible-gold mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Inspirando conteúdo...</p>
                        </div>
                    ) : (
                        <div className={`space-y-6 ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
                            {!isFocusMode && (
                                <div className="flex items-center justify-center gap-6 md:gap-12 mb-12 select-none group/chapterNav">
                                    <button 
                                        onClick={() => currentChapterNum > 1 && onNavigate(bookMetadata.id, currentChapterNum - 1)}
                                        disabled={currentChapterNum === 1}
                                        className="p-3 rounded-full hover:bg-bible-leather/5 dark:hover:bg-bible-gold/5 text-gray-300 hover:text-bible-leather dark:hover:text-bible-gold transition-all disabled:opacity-0"
                                        title="Capítulo Anterior"
                                    >
                                        <ChevronLeft size={32} strokeWidth={2.5} />
                                    </button>

                                    <div className="text-center flex flex-col items-center">
                                        <span className="text-[10px] font-black uppercase text-bible-gold tracking-[0.3em] mb-2 block">Capítulo</span>
                                        <h2 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white opacity-[0.08] transition-opacity group-hover/chapterNav:opacity-10">{currentChapterNum}</h2>
                                        <div className="h-1 w-12 bg-bible-gold/30 -mt-4 rounded-full"></div>
                                    </div>

                                    <button 
                                        onClick={() => !isLastChapter ? onNavigate(bookMetadata.id, currentChapterNum + 1) : onChapterComplete()}
                                        className="p-3 rounded-full hover:bg-bible-leather/5 dark:hover:bg-bible-gold/5 text-gray-300 hover:text-bible-leather dark:hover:text-bible-gold transition-all"
                                        title="Próximo Capítulo"
                                    >
                                        <ChevronRight size={32} strokeWidth={2.5} />
                                    </button>
                                </div>
                            )}
                            <div className={`leading-relaxed ${getFontSizeClass(settings.fontSize)} ${isFocusMode ? 'space-y-12 text-gray-300' : 'space-y-4 text-gray-800 dark:text-gray-200'}`}>
                                {chapterContent?.verses
                                    .filter(v => !isFocusMode || !expandedVerseStart || v.number >= expandedVerseStart)
                                    .map((verse) => {
                                    const isSelected = selectedVerses.includes(verse.number);
                                    const isPopular = popularVerses.includes(verse.number);
                                    const hasNote = versesWithNotes.includes(verse.number);
                                    const hasFriendNote = verse.number % 7 === 0;
                                    const verseLead = !isFocusMode ? extractVerseLead(verse.text) : null;
                                    return (
                                        <div key={verse.number} className={`relative group ${isFocusMode ? 'transition-opacity duration-500' : ''}`}>
                                            {hasFriendNote && !isFocusMode && (
                                                <div className="absolute -left-6 top-1.5 opacity-50 group-hover:opacity-100 transition-opacity" title="Anotação de amigo">
                                                    <div className="w-4 h-4 rounded-full bg-purple-500 border border-white dark:border-black flex items-center justify-center text-[6px] text-white font-bold">AB</div>
                                                </div>
                                            )}
                                            <span id={`verse-${verse.number}`} onClick={(e) => handleVerseClick(e, verse.number)} className={`inline-block rounded-lg transition-all duration-300 cursor-pointer select-none ${isFocusMode ? 'hover:text-white' : `${isSelected ? 'bg-bible-gold/20 ring-1 ring-bible-gold/30' : 'hover:bg-bible-gold/5 active:bg-bible-gold/10'} p-1 mb-1`} ${isPopular && !isFocusMode ? 'decoration-red-300/50 dark:decoration-red-900/50 underline decoration-dotted underline-offset-4 decoration-2' : ''} ${hasNote && !isFocusMode ? 'border-l-4 border-yellow-500 pl-2 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                                                <sup className={`text-[10px] font-sans font-black mr-2.5 select-none flex items-center gap-1.5 inline-flex ${isPopular ? 'text-red-400' : 'text-bible-gold/60'}`}>
                                                    {verse.number}
                                                    {hasNote && !isFocusMode && <PenLine size={8} className="text-yellow-600 dark:text-yellow-400" />}
                                                </sup>
                                                {verseLead ? (
                                                    <>
                                                        {verseLead.prefix && <span>{verseLead.prefix}</span>}
                                                        <span className="text-bible-gold/75 dark:text-bible-gold/85 text-[1.4em] md:text-[1.55em] leading-none md:leading-none align-[-0.03em] md:align-[-0.06em] mr-0.5 md:mr-0.5 font-serif font-black">{verseLead.initial}</span>
                                                        {verseLead.rest ? <SmartText text={verseLead.rest} enabled={settings.smartReadingMode || false} /> : null}
                                                    </>
                                                ) : (
                                                    <SmartText text={verse.text} enabled={settings.smartReadingMode || false} />
                                                )}
                                                {!isFocusMode && (
                                                    <span className="ml-2 inline-flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-all">
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                onQuickNote?.(verse.number);
                                                            }} 
                                                            className="relative inline-flex items-center justify-center p-2 rounded-full bg-bible-leather/5 dark:bg-bible-gold/5 text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all" 
                                                            title={notesCountByVerse.get(verse.number) ? `Ver nota (${notesCountByVerse.get(verse.number)})` : 'Criar nota'}
                                                        >
                                                            <PenLine size={16} />
                                                            {notesCountByVerse.get(verse.number) && (
                                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 dark:bg-yellow-400 text-black text-[8px] font-black rounded-full flex items-center justify-center">
                                                                    {notesCountByVerse.get(verse.number)}
                                                                </span>
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setExpandedVerseStart(verse.number); 
                                                                setIsFocusMode(true);
                                                            }} 
                                                            className="inline-flex items-center justify-center p-2 rounded-full bg-bible-leather/5 dark:bg-bible-gold/5 text-bible-gold hover:bg-bible-gold/20 transition-all" 
                                                            title="Expandir a partir deste versículo"
                                                        >
                                                            <Maximize2 size={16} />
                                                        </button>
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {!isFocusMode && popularVerses.length > 0 && (
                                <div className="flex items-center justify-center gap-2 mt-8 opacity-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <Flame size={12} className="text-red-400" /> Versículos Populares na Comunidade
                                </div>
                            )}
                            <div className={`pt-20 flex flex-col items-center gap-8 ${isFocusMode ? 'opacity-30 hover:opacity-100 transition-opacity' : ''}`}>
                                <div className="flex items-center gap-4 w-full">
                                    <button onClick={() => currentChapterNum > 1 && onNavigate(bookMetadata.id, currentChapterNum - 1)} disabled={currentChapterNum === 1} className={`flex-1 py-4 border rounded-2xl disabled:opacity-30 transition-all flex items-center justify-center gap-2 ${isFocusMode ? 'border-white/10 text-white hover:bg-white/10' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:text-bible-gold'}`}>
                                        <ChevronLeft size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Anterior</span>
                                    </button>
                                    <button onClick={() => !isLastChapter ? onNavigate(bookMetadata.id, currentChapterNum + 1) : onChapterComplete()} className="flex-[2] py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                        {isLastChapter ? 'Concluir Livro' : 'Próximo Capítulo'} <ChevronRight size={20} />
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
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} updateSettings={updateSettings} isFocusMode={isFocusMode} onToggleFocus={() => setIsFocusMode(!isFocusMode)} />

            {/* Floating Exit Focus Button */}
            {isFocusMode && (
                <button
                    onClick={() => {
                        setIsFocusMode(false);
                        setExpandedVerseStart(null);
                    }}
                    className="fixed bottom-10 right-6 z-[100] w-14 h-14 bg-bible-gold hover:bg-bible-gold/90 text-black rounded-full shadow-2xl shadow-bible-gold/30 hover:scale-110 active:scale-90 transition-all flex items-center justify-center border-4 border-black animate-in fade-in zoom-in duration-300"
                    title="Sair do Modo Foco"
                >
                    <Minimize2 size={24} strokeWidth={3} />
                </button>
            )}
        </div>
    );
};

export default ReaderView;
