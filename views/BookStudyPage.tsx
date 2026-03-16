"use client";
import { useNavigate, useParams } from '../utils/router';


import React, { useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { BIBLE_BOOKS_LIST } from '../constants';
import { 
  ArrowLeft, CheckCircle2, Lock, Play, BookOpen, 
  ChevronRight, Check
} from 'lucide-react';

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

const BookStudyPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const bookMeta = useMemo(() => BIBLE_BOOKS_LIST.find(b => b.id === bookId), [bookId]);
  const totalChapters = bookMeta ? (BOOK_CHAPTER_COUNTS[bookMeta.id] || 1) : 0;
  
  const readChapters = userProfile?.progress?.readChapters?.[bookId || ''] || [];
  const progressPercent = Math.round((readChapters.length / totalChapters) * 100);

  // Navega para a Bíblia Sagrada (ReaderPage) com o capítulo selecionado
  const handleOpenChapter = (chapter: number) => {
      navigate('/biblia', { 
          state: { 
              bookId: bookId, 
              chapter: chapter,
              source: 'course' // Marca que veio de um curso para potencial UI feedback
          } 
      });
  };

  if (!bookMeta) return <div>Livro não encontrado</div>;

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto pb-20">
            
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">{bookMeta.name}</h1>
                    <p className="text-sm text-gray-500">Curso Bíblico Interativo</p>
                </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white dark:bg-bible-darkPaper rounded-[2rem] p-8 shadow-md border border-gray-100 dark:border-gray-800 mb-8 relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center mb-4">
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progresso Total</span>
                        <h2 className="text-4xl font-black text-bible-gold">{progressPercent}%</h2>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-bold text-gray-800 dark:text-gray-200">{readChapters.length}/{totalChapters}</span>
                        <span className="text-xs text-gray-500">Capítulos</span>
                    </div>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative z-10">
                    <div className="h-full bg-bible-gold transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                    <BookOpen size={200} />
                </div>
            </div>

            {/* Chapter List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map(chapter => {
                    const isRead = readChapters.includes(chapter);
                    return (
                        <button 
                            key={chapter}
                            onClick={() => handleOpenChapter(chapter)}
                            className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                                isRead 
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                                : 'bg-white dark:bg-bible-darkPaper border-gray-100 dark:border-gray-800 hover:border-bible-gold hover:shadow-md'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className={`text-lg font-bold ${isRead ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                    Capítulo {chapter}
                                </span>
                                {isRead ? <CheckCircle2 size={20} className="text-green-500" /> : <Play size={20} className="text-gray-300 group-hover:text-bible-gold"/>}
                            </div>
                            {isRead ? (
                                <span className="text-[10px] font-black uppercase text-green-600/60 mt-1 block">Concluído</span>
                            ) : (
                                <span className="text-[10px] font-black uppercase text-gray-400 mt-1 block group-hover:text-bible-gold">Ler na Bíblia</span>
                            )}
                        </button>
                    );
                })}
            </div>

        </div>
    </div>
  );
};

export default BookStudyPage;
