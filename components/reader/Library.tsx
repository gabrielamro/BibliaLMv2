"use client";
import { useNavigate } from '../../utils/router';

import React, { useState, useMemo, useRef } from 'react';
import { Search, X, BookOpen, ChevronRight, Sparkles, GraduationCap, Target, Coffee, Palette, Bookmark } from 'lucide-react';
import { BIBLE_BOOKS_LIST } from '../../constants';
import { searchMatch } from '../../utils/textUtils';
import { resolveBibleSearchNavigation } from '../../utils/bibleSearchNavigation';

import { useAuth } from '../../contexts/AuthContext';
import { bibleService } from '../../services/bibleService';

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

interface LibraryProps {
    onSelectBook: (bookId: string, chapter?: number, verse?: number | null, highlightVerses?: number[]) => void;
}

const Library: React.FC<LibraryProps> = ({ onSelectBook }) => {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'old' | 'new' | 'apocryphal'>('old');
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const { bibleMatch, filteredBooks } = useMemo(() => {
        const trimmed = searchTerm.trim();
        if (trimmed === '') {
            return {
                bibleMatch: null,
                filteredBooks: BIBLE_BOOKS_LIST.filter(b => b.testament === activeTab),
            };
        }

        return {
            bibleMatch: bibleService.parseReference(trimmed),
            filteredBooks: BIBLE_BOOKS_LIST.filter(b => searchMatch(trimmed.toLowerCase(), b.name, b.id)),
        };
    }, [activeTab, searchTerm]);

    const getBookProgress = (bookId: string) => {
        if (!userProfile?.progress?.readChapters) return 0;
        const readCount = (userProfile.progress.readChapters[bookId] || []).length;
        const total = BOOK_CHAPTER_COUNTS[bookId] || 1;
        return Math.min(100, Math.round((readCount / total) * 100));
    };

    const quickActions = [
        { label: 'Pão Diário', icon: <Coffee size={14} />, path: '/devocional', color: 'text-orange-500' },
        { label: 'Minhas Notas', icon: <Bookmark size={14} />, path: '/notes', color: 'text-yellow-600' },
        { label: 'Metas', icon: <Target size={14} />, path: '/plano', color: 'text-green-500' },
        { label: 'Salas', icon: <GraduationCap size={14} />, path: '/aluno', color: 'text-blue-500' },
        { label: 'Artes', icon: <Palette size={14} />, path: '/estudio-criativo', color: 'text-pink-500' },
    ];

    const handleDirectBibleSelection = async () => {
        if (!bibleMatch) return;

        const navigationResult = await resolveBibleSearchNavigation(searchTerm);
        if (navigationResult) {
            onSelectBook(
                navigationResult.routeState.bookId,
                navigationResult.routeState.chapter,
                navigationResult.routeState.scrollToVerse ?? null,
                navigationResult.routeState.highlightVerses ?? [],
            );
            return;
        }

        onSelectBook(bibleMatch.bookId, bibleMatch.chapter, bibleMatch.startVerse);
    };

    return (
        <div data-testid="bible-library" className="h-full bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar border-b border-gray-50 dark:border-gray-800/50">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.path)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95 border border-transparent hover:border-bible-gold/20"
                        >
                            <span className={action.color}>{action.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-tight text-gray-600 dark:text-gray-300">{action.label}</span>
                        </button>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto p-4 space-y-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-bible-gold transition-colors" size={18} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Buscar livro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-bible-gold/50 transition-all text-gray-900 dark:text-white"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {searchTerm === '' && (
                        <div className="flex bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
                            <button onClick={() => setActiveTab('old')} className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-widest transition-all ${activeTab === 'old' ? 'bg-white dark:bg-gray-800 text-bible-leather dark:text-bible-gold shadow-sm' : 'text-gray-400'}`}>ANTIGO</button>
                            <button onClick={() => setActiveTab('new')} className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-widest transition-all ${activeTab === 'new' ? 'bg-white dark:bg-gray-800 text-bible-leather dark:text-bible-gold shadow-sm' : 'text-gray-400'}`}>NOVO</button>
                            <button onClick={() => setActiveTab('apocryphal')} className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-widest transition-all ${activeTab === 'apocryphal' ? 'bg-white dark:bg-gray-800 text-bible-leather dark:text-bible-gold shadow-sm' : 'text-gray-400'}`}>APÓCRIFOS</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-4xl mx-auto w-full p-4 md:p-6 pb-32 space-y-8">
                    {bibleMatch && (
                        <div className="animate-in slide-in-from-top-4 duration-300">
                            <button
                                onClick={handleDirectBibleSelection}
                                className="w-full flex items-center justify-between p-6 bg-bible-gold text-white dark:text-black rounded-[2.5rem] hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative shadow-xl"
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-[10px] font-black text-white/60 dark:text-black/60 uppercase tracking-widest block mb-0.5">Acesso Direto</span>
                                        <h3 className="text-2xl font-serif font-bold">Ler {bibleMatch.formatted}</h3>
                                    </div>
                                </div>
                                <ChevronRight className="relative z-10 group-hover:translate-x-2 transition-transform" />
                                <div className="absolute top-0 right-0 p-10 opacity-10 -rotate-12 translate-x-1/4 -translate-y-1/4 pointer-events-none">
                                    <BookOpen size={160} fill="currentColor" />
                                </div>
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 animate-in fade-in duration-500">
                        {filteredBooks.map((book) => {
                            const progress = getBookProgress(book.id);
                            return (
                                <button
                                    key={book.id}
                                    onClick={() => onSelectBook(book.id)}
                                    className="group relative flex flex-col items-center justify-center aspect-square bg-white dark:bg-[#1a1a1a] rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:border-bible-gold hover:shadow-xl transition-all active:scale-95 overflow-hidden p-2"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-bible-gold/0 to-bible-gold/5 group-hover:to-bible-gold/10 transition-colors"></div>

                                    <span className="text-[10px] md:text-sm font-bold text-gray-800 dark:text-white leading-tight z-10 text-center px-1">
                                        {book.name}
                                    </span>

                                    <div className="absolute -bottom-2 -right-2 opacity-5 font-black text-5xl group-hover:opacity-10 transition-opacity pointer-events-none uppercase">
                                        {book.id.substring(0, 2)}
                                    </div>

                                    {progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 dark:bg-gray-800">
                                            <div
                                                className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-bible-gold'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    )}

                                    {progress === 100 && (
                                        <div className="absolute top-2 right-2 text-green-500">
                                            <Sparkles size={10} fill="currentColor" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {filteredBooks.length === 0 && (
                        <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm animate-in zoom-in">
                            <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Nenhum livro encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Library;
