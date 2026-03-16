"use client";
import { useNavigate } from '../../utils/router';


import React, { useState, useRef, useEffect } from 'react';
import { Headphones, Share2, X, PenLine, Sparkles, Brain, Check, Image as ImageIcon, BookOpen, ChevronUp } from 'lucide-react';
import { generateShareLink } from '../../utils/shareUtils';

import { useAuth } from '../../contexts/AuthContext';

interface FloatingSelectionMenuProps {
  selectedVerses: number[];
  setSelectedVerses: (verses: number[]) => void;
  getSelectedContent: () => { text: string; ref: string };
  onGeneratePodcast: () => void;
  onAddNote: () => void;
  onGenerateImage: () => void;
  bookId: string;
  chapter: number;
  onMarkRead?: () => void;
}

const FloatingSelectionMenu: React.FC<FloatingSelectionMenuProps> = ({
  selectedVerses,
  setSelectedVerses,
  getSelectedContent,
  onGeneratePodcast,
  onAddNote,
  onGenerateImage,
  bookId,
  chapter,
  onMarkRead
}) => {
  const navigate = useNavigate();
  const { recordActivity, currentUser } = useAuth();
  const [showAiMenu, setShowAiMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAiMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeepStudy = () => {
    const { text } = getSelectedContent();
    navigate('/estudo', { state: { text, source: 'leitura' } });
    setShowAiMenu(false);
    setSelectedVerses([]);
  };

  const handleShare = async () => {
    const { text, ref } = getSelectedContent();
    const deepLink = generateShareLink('verse', {
        bookId,
        chapter,
        verse: selectedVerses[0] 
    });
    const shareText = `📖 ${ref}\n\n"${text}"\n\nLeia completo em: ${deepLink}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: ref, text: shareText, url: deepLink });
        if (currentUser) await recordActivity('share_content', `Compartilhou: ${ref}`);
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(shareText);
      if (currentUser) await recordActivity('share_content', `Compartilhou Link: ${ref}`);
      alert("Link copiado!");
    }
    setSelectedVerses([]);
  };

  // --- RENDERIZAR GHOST MENU (Estado Inativo) ---
  if (selectedVerses.length === 0) {
      return (
        <div className="fixed bottom-20 left-0 right-0 z-[50] flex justify-center px-4 pointer-events-none pb-safe">
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-3 flex items-center gap-4 opacity-60 scale-95 transition-all duration-500">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">
                    Selecione para ativar a IA
                </span>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
                <div className="flex gap-3 text-gray-400">
                    <Sparkles size={16} />
                    <PenLine size={16} />
                    <Headphones size={16} />
                </div>
            </div>
        </div>
      );
  }

  // --- RENDERIZAR ACTIVE MENU (Estado Ativo) ---
  return (
    <div className="fixed bottom-20 left-0 right-0 z-[60] flex justify-center pointer-events-none px-4 pb-safe animate-in slide-in-from-bottom-8 duration-300">
      <div className="bg-gray-900/95 dark:bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 dark:border-gray-200 pointer-events-auto flex items-center p-2 gap-1 ring-1 ring-black/5">
          
          {/* Contador de Seleção */}
          <div className="pl-3 pr-2 flex flex-col justify-center border-r border-white/10 dark:border-gray-200/50 mr-1">
              <span className="text-[10px] font-black text-white dark:text-black leading-none">{selectedVerses.length}</span>
              <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">vs</span>
          </div>

          {/* Ações Principais */}
          <button onClick={() => { if(onMarkRead) onMarkRead(); setSelectedVerses([]); }} className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-white dark:text-gray-900 hover:bg-white/10 dark:hover:bg-black/5 transition-colors">
              <Check size={20} strokeWidth={2.5} className="text-green-400 dark:text-green-600" />
              <span className="text-[8px] font-black uppercase mt-1">Lido</span>
          </button>

          <button onClick={onAddNote} className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-white dark:text-gray-900 hover:bg-white/10 dark:hover:bg-black/5 transition-colors">
              <PenLine size={20} />
              <span className="text-[8px] font-black uppercase mt-1">Nota</span>
          </button>

          <button onClick={handleShare} className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-white dark:text-gray-900 hover:bg-white/10 dark:hover:bg-black/5 transition-colors">
              <Share2 size={20} />
              <span className="text-[8px] font-black uppercase mt-1">Link</span>
          </button>

          <div className="w-px h-8 bg-white/20 dark:bg-black/10 mx-1"></div>

          {/* AI Expandable Menu */}
          <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setShowAiMenu(!showAiMenu)}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${showAiMenu ? 'bg-bible-gold text-white shadow-lg scale-105' : 'text-bible-gold hover:bg-white/10 dark:hover:bg-black/5'}`}
            >
                <Sparkles size={20} fill="currentColor" />
                <span className="text-[8px] font-black uppercase mt-1">IA</span>
            </button>

            {showAiMenu && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-2 flex flex-col gap-1 w-56 animate-in slide-in-from-bottom-4 zoom-in-95 origin-bottom">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                        Ferramentas Inteligentes
                    </div>
                    <button onClick={onGenerateImage} className="flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 text-left transition-colors group">
                        <div className="p-1.5 bg-pink-100 text-pink-600 rounded-lg group-hover:scale-110 transition-transform"><ImageIcon size={16} /></div>
                        <div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 block">Criar Arte Sacra</span>
                            <span className="text-[9px] text-gray-400">Visualizar versículo</span>
                        </div>
                    </button>
                    <button onClick={onGeneratePodcast} className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 text-left transition-colors group">
                        <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform"><Headphones size={16} /></div>
                        <div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 block">Gerar Podcast</span>
                            <span className="text-[9px] text-gray-400">Áudio explicativo</span>
                        </div>
                    </button>
                    <button onClick={handleDeepStudy} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors group">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><Brain size={16} /></div>
                        <div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 block">Estudo Profundo</span>
                            <span className="text-[9px] text-gray-400">Exegese e contexto</span>
                        </div>
                    </button>
                </div>
            )}
          </div>

          <button onClick={() => setSelectedVerses([])} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors ml-1">
              <X size={18} />
          </button>
      </div>
    </div>
  );
};

export default FloatingSelectionMenu;
