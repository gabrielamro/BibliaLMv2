"use client";
import { useNavigate } from '../utils/router';


import React, { useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { BIBLE_BOOKS_LIST } from '../constants';
import { 
  BookOpen, Search, Play, CheckCircle2,
  BookMarked, GraduationCap, LayoutDashboard, Star, Flame, Trophy
} from 'lucide-react';
import SEO from '../components/SEO';

const BOOK_CHAPTER_COUNTS: { [key: string]: number } = {
  'gn': 50, 'ex': 40, 'lv': 27, 'nm': 36, 'dt': 34, 'js': 24, 'jz': 21, 'rt': 4,
  '1sm': 31, '2sm': 24, '1rs': 22, '2rs': 25, '1cr': 29, '2cr': 36, 'ed': 10, 'ne': 13, 'et': 10,
  'jo': 42, 'sl': 150, 'pv': 31, 'ec': 12, 'ct': 8, 'is': 66, 'jr': 52, 'lm': 5, 'ez': 48,
  'dn': 12, 'os': 14, 'jl': 3, 'am': 9, 'ob': 1, 'jn': 4, 'mq': 7, 'na': 3, 'hc': 3,
  'sf': 3, 'ag': 2, 'zc': 14, 'ml': 4,
  'mt': 28, 'mc': 16, 'lc': 24, 'joao': 21, 'at': 28, 'rm': 16, '1co': 16, '2co': 13,
  'gl': 6, 'ef': 6, 'fp': 4, 'cl': 4, '1ts': 5, '2ts': 3, '1tm': 6, '2tm': 4, 'tt': 3,
  'fm': 1, 'hb': 13, 'tg': 5, '1pe': 5, '2pe': 3, '1jo': 5, '2jo': 1, '3jo': 1, 'jd': 1, 'ap': 22
};

const BibleDashboardPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const bookProgress = useMemo(() => {
      const progress: Record<string, { read: number, total: number, percentage: number, isComplete: boolean }> = {};
      const readData = userProfile?.progress?.readChapters || {};

      BIBLE_BOOKS_LIST.forEach(book => {
          const total = BOOK_CHAPTER_COUNTS[book.id] || 1;
          const readCount = (readData[book.id] || []).length;
          const percentage = Math.min(100, Math.round((readCount / total) * 100));
          progress[book.id] = { read: readCount, total, percentage, isComplete: percentage === 100 };
      });
      return progress;
  }, [userProfile]);

  const lastActiveBook = useMemo(() => {
      const lastId = userProfile?.progress?.lastActiveBookId;
      return lastId ? BIBLE_BOOKS_LIST.find(b => b.id === lastId) : BIBLE_BOOKS_LIST[0]; 
  }, [userProfile]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
        <SEO title="Dashboard Bíblico" />
        <div className="max-w-6xl mx-auto space-y-8 pb-24">
            <header>
                <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <LayoutDashboard className="text-bible-gold" /> Dashboard Bíblico
                </h1>
                <p className="text-gray-500 font-medium">Seu avanço nas Escrituras Sagradas.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Capítulos Lidos', val: userProfile?.stats?.totalChaptersRead || 0, icon: <BookOpen />, color: 'text-blue-600', bg: 'bg-blue-50' },
                    // Fix: Casting Object.values to resolve 'unknown' type error
                    { label: 'Livros Concluídos', val: (Object.values(bookProgress) as { isComplete: boolean }[]).filter(p => p.isComplete).length, icon: <Trophy />, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Maná Acumulado', val: userProfile?.lifetimeXp || 0, icon: <Star />, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Constância', val: (userProfile?.stats?.daysStreak || 1) + 'd', icon: <Flame />, color: 'text-orange-600', bg: 'bg-orange-50' }
                ].map((s, i) => (
                    <div key={i} className="p-6 rounded-[2rem] bg-white dark:bg-bible-darkPaper border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center">
                        <div className={`p-2 rounded-xl mb-2 ${s.color} ${s.bg} dark:bg-opacity-10`}>{s.icon}</div>
                        <span className={`text-3xl font-black ${s.color}`}>{s.val}</span>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] p-6 md:p-10 border border-gray-100 dark:border-gray-800 shadow-md flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 pointer-events-none"><BookMarked size={180} /></div>
                <div className="w-40 h-40 rounded-3xl bg-bible-leather dark:bg-black flex items-center justify-center relative z-10 shadow-lg">
                    <span className="text-4xl font-serif font-bold text-bible-gold">{lastActiveBook?.id.substring(0,2).toUpperCase()}</span>
                </div>
                <div className="flex-1 space-y-4 w-full relative z-10">
                    <div>
                        <span className="text-[10px] font-black text-bible-gold uppercase tracking-widest mb-1 block">Último Acesso</span>
                        <h3 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">{lastActiveBook?.name}</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                            <span>Progresso</span>
                            <span>{lastActiveBook ? bookProgress[lastActiveBook.id].percentage : 0}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-bible-gold transition-all duration-1000" style={{ width: `${lastActiveBook ? bookProgress[lastActiveBook.id].percentage : 0}%` }}></div>
                        </div>
                    </div>
                    <button onClick={() => navigate('/', { state: { bookId: lastActiveBook?.id, chapter: userProfile?.progress?.lastActiveChapter } })} className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all">
                        <Play size={14} fill="currentColor" /> Continuar Lendo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BIBLE_BOOKS_LIST.map(book => {
                    const p = bookProgress[book.id];
                    return (
                        <div key={book.id} onClick={() => navigate(`/estudos/livro/${book.id}`)} className="bg-white dark:bg-bible-darkPaper p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-all cursor-pointer group">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-bible-gold transition-colors">{book.name}</h4>
                                {p.isComplete && <CheckCircle2 className="text-green-500" size={16} />}
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-bible-gold transition-all duration-500" style={{ width: `${p.percentage}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase">
                                <span>{p.read}/{p.total} Caps</span>
                                <span>{p.percentage}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default BibleDashboardPage;
