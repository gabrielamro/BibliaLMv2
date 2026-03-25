"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';

import React, { useState, useMemo, useEffect } from 'react';
import { BookmarkCheck, Brain, Coffee, MessageCircle, BookOpen, Trash2, Calendar as CalendarIcon, ChevronRight, Sparkles, PenTool, BookMarked, History, Plus, Headphones, Play, Lock, Edit2, Share2, Save, X, Quote, LayoutGrid, List, Mic2, Search, PlusCircle, GraduationCap } from 'lucide-react';

import { SavedStudy, StudySource, Note } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { BIBLE_BOOKS_LIST } from '../constants';
import ConfirmationModal from './ConfirmationModal';

const SavedStudies: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [studies, setStudies] = useState<SavedStudy[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'user' | 'ia' | 'podcasts'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Edit State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const studiesData = await dbService.getAll(currentUser.uid, 'studies');
        const notesData = await dbService.getAll(currentUser.uid, 'notes');
        setStudies(studiesData as SavedStudy[]);
        setNotes(notesData as Note[]);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const confirmDeleteStudy = async () => {
    if (!currentUser || !studyToDelete) return;
    try {
        await dbService.delete(currentUser.uid, 'studies', studyToDelete);
        setStudies(prev => prev.filter(s => s.id !== studyToDelete));
    } finally {
        setStudyToDelete(null);
    }
  };

  const confirmDeleteNote = async () => {
    if (!currentUser || !noteToDelete) return;
    try {
        await dbService.delete(currentUser.uid, 'notes', noteToDelete);
        setNotes(prev => prev.filter(n => n.id !== noteToDelete));
    } finally {
        setNoteToDelete(null);
    }
  };

  const handleEditNote = (note: Note) => {
      setEditingNoteId(note.id);
      setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
      if (!currentUser || !editContent.trim()) return;
      setIsSavingEdit(true);
      try {
          await dbService.update(currentUser.uid, 'notes', noteId, { content: editContent });
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: editContent } : n));
          setEditingNoteId(null);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSavingEdit(false);
      }
  };

  const handleNavigateToContext = (bookId: string, chapter: number, verse?: number) => {
      if (bookId === 'geral') return;
      navigate('/biblia', { 
          state: { 
              bookId, 
              chapter, 
              scrollToVerse: verse 
          } 
      });
  };

  const getSourceIcon = (source: StudySource) => {
    switch (source) {
      case 'leitura': return <BookOpen size={16} />;
      case 'devocional': return <Coffee size={16} />;
      case 'chat': return <MessageCircle size={16} />;
      case 'podcast': return <Headphones size={16} />;
      case 'sermon': return <Mic2 size={16} />;
      default: return <Brain size={16} />;
    }
  };

  // Filter Logic
  const filteredContent = useMemo(() => {
      let content = [...studies, ...notes];
      
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          content = content.filter(item => {
              if ('analysis' in item) { // SavedStudy
                  return item.title.toLowerCase().includes(lower) || item.sourceText?.toLowerCase().includes(lower);
              } else { // Note
                  return item.content.toLowerCase().includes(lower) || item.title?.toLowerCase().includes(lower);
              }
          });
      }

      if (activeTab === 'all') return content.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (activeTab === 'user') return content.filter(i => !('analysis' in i)); // Notes only
      if (activeTab === 'ia') return content.filter(i => 'analysis' in i && i.source !== 'podcast');
      if (activeTab === 'podcasts') return content.filter(i => 'analysis' in i && i.source === 'podcast');
      return [];
  }, [activeTab, studies, notes, searchTerm]);

  const renderContentItem = (item: SavedStudy | Note) => {
      const isNote = !('analysis' in item);
      
      if (isNote) {
          const note = item as Note;
          const bookMeta = BIBLE_BOOKS_LIST.find(b => b.id === note.bookId);
          const refDisplay = note.bookId !== 'geral' ? `${bookMeta?.name || 'Livro'} ${note.chapter}${note.verse ? ':' + note.verse : ''}` : (note.title || 'Nota Geral');

          return (
              <div key={note.id} className="bg-white dark:bg-bible-darkPaper p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-bible-gold/30 transition-all group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg"><PenTool size={14} /></div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Anotação</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditNote(note)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-bible-gold"><Edit2 size={14}/></button>
                          <button onClick={() => setNoteToDelete(note.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                  </div>
                  
                  {editingNoteId === note.id ? (
                      <div className="flex-1 flex flex-col gap-2">
                          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 p-2 rounded-lg text-sm" rows={4} />
                          <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingNoteId(null)} className="text-xs text-gray-500">Cancelar</button>
                              <button onClick={() => handleSaveEdit(note.id)} className="text-xs bg-bible-gold text-white px-3 py-1 rounded-lg">Salvar</button>
                          </div>
                      </div>
                  ) : (
                      <>
                        <h3 className="font-serif font-bold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-bible-gold transition-colors" onClick={() => handleNavigateToContext(note.bookId, note.chapter, note.verse)}>
                            {refDisplay}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-4 flex-1">
                            {note.content}
                        </p>
                      </>
                  )}
                  
                  <div className="mt-auto pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400 uppercase font-medium">
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      {note.bookId !== 'geral' && (
                          <button onClick={() => handleNavigateToContext(note.bookId, note.chapter, note.verse)} className="flex items-center gap-1 hover:text-bible-gold transition-colors">
                              Ler Contexto <ChevronRight size={12} />
                          </button>
                      )}
                  </div>
              </div>
          );
      } else {
          const study = item as SavedStudy;
          const isPodcast = study.source === 'podcast';
          
          return (
              <div key={study.id} className="bg-white dark:bg-bible-darkPaper p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-bible-gold/30 transition-all group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isPodcast ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                              {getSourceIcon(study.source)}
                          </div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                              {isPodcast ? 'Podcast' : study.source === 'sermon' ? 'Sermão' : 'Landing Page'}
                          </span>
                      </div>
                      <button onClick={() => setStudyToDelete(study.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                  </div>

                  <h3 className="font-serif font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {study.title}
                  </h3>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                      {study.analysis ? study.analysis.replace(/#/g, '').substring(0, 150) : study.sourceText}
                  </p>

                  <button 
                    onClick={() => navigate('/estudo', { state: { ...study } })} 
                    className="w-full py-2 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-bible-gold hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                      {isPodcast ? <Play size={14} fill="currentColor"/> : <BookOpen size={14} />}
                      {isPodcast ? 'Ouvir Agora' : 'Abrir Página'}
                  </button>
              </div>
          );
      }
  };

  if (!currentUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-black/20 text-center">
         <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6"><Lock size={48} className="text-gray-400" /></div>
         <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-2">Área de Membros</h2>
         <p className="text-gray-500 mb-6 max-w-md">Faça login para acessar seus estudos salvos, podcasts e anotações sincronizadas.</p>
         <button onClick={() => navigate('/login', { state: { from: location } })} className="bg-bible-gold text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all">Entrar Agora</button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto pb-20">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex w-full md:w-auto gap-2">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar estudos e notas..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-bible-darkPaper border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 ring-bible-gold/30"
                    />
                </div>
                <button 
                    onClick={() => navigate('/criar-conteudo')} 
                    className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
                >
                    <PlusCircle size={16} /> Novo
                </button>
            </div>

            <div className="flex p-1 bg-white dark:bg-bible-darkPaper rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar w-full md:w-auto">
                <button onClick={() => setActiveTab('all')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-gray-100 dark:bg-gray-800 text-bible-gold' : 'text-gray-400'}`}>Tudo</button>
                <button onClick={() => setActiveTab('user')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'user' ? 'bg-gray-100 dark:bg-gray-800 text-bible-gold' : 'text-gray-400'}`}>Minhas Notas</button>
                <button onClick={() => setActiveTab('ia')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'ia' ? 'bg-gray-100 dark:bg-gray-800 text-bible-gold' : 'text-gray-400'}`}>Estudos IA</button>
                <button onClick={() => setActiveTab('podcasts')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'podcasts' ? 'bg-gray-100 dark:bg-gray-800 text-bible-gold' : 'text-gray-400'}`}>Podcasts</button>
            </div>
        </div>

        {isLoading ? (
            <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-bible-gold border-t-transparent rounded-full animate-spin"></div></div> 
        ) : filteredContent.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2rem] border border-gray-100 dark:border-gray-800">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Nenhum conteúdo encontrado.</p>
                <div className="flex justify-center gap-3 mt-6">
                    <button onClick={() => navigate('/biblia')} className="px-6 py-2 bg-bible-gold text-white rounded-xl text-xs font-bold">Ler Bíblia</button>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
                {filteredContent.map(renderContentItem)}
            </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!studyToDelete}
        onClose={() => setStudyToDelete(null)}
        onConfirm={confirmDeleteStudy}
        title="Excluir Estudo"
        message="Tem certeza que deseja apagar este estudo permanentemente?"
        confirmText="Excluir"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDeleteNote}
        title="Excluir Anotação"
        message="Deseja apagar esta nota?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
};

export default SavedStudies;