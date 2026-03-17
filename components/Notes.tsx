import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from '../utils/router';
import { Save, Wand2, Download, Trash2, Plus, Bookmark, PenTool, Lock, Instagram, Sparkles, Edit2, Brain, Loader2 } from 'lucide-react';
import { Note } from '../types';
import { improveNote, summarizeNoteForSocial } from '../services/geminiService';
import { BIBLE_BOOKS_LIST } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';

import SocialShareModal from './SocialShareModal';
import ConfirmationModal from './ConfirmationModal';

const Notes: React.FC = () => {
  const { currentUser, earnMana, openLogin, showNotification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');

  // Handle initial content from navigation state
  useEffect(() => {
    const state = location.state as { initialContent?: string };
    if (state?.initialContent) {
      setCurrentNote(state.initialContent);
      showNotification("Conteúdo do Obreiro IA importado!", "success");
    }
  }, [location.state]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [generatingShareId, setGeneratingShareId] = useState<string | null>(null);
  const [sharingData, setSharingData] = useState<{ text: string; ref: string } | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      if (currentUser) {
        try {
          const fetched = await dbService.getAll(currentUser.uid, 'notes');
          setNotes(fetched as Note[]);
        } catch (e) { console.error(e); }
      }
    };
    fetchNotes();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) {
      openLogin();
      return;
    }
    if (!currentNote.trim()) return;
    
    setIsSaving(true);
    const newNoteData = { bookId: 'geral', chapter: 0, content: currentNote };

    try {
      const docRef = await dbService.add(currentUser.uid, 'notes', newNoteData);
      await earnMana('create_note'); 
      setNotes(prev => [{ id: docRef.id, ...newNoteData, createdAt: new Date().toISOString() } as Note, ...prev]);
      setCurrentNote('');
      showNotification("Nota salva com sucesso!", "success");
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  const confirmDeleteNote = async () => {
    if (!currentUser || !noteToDelete) return;
    try {
      await dbService.delete(currentUser.uid, 'notes', noteToDelete);
      setNotes(prev => prev.filter(n => n.id !== noteToDelete));
      showNotification("Anotação removida.", "info");
    } catch (error) { console.error("Erro ao deletar", error); } 
    finally { setNoteToDelete(null); }
  };

  const handleAIImprove = async () => {
    if (!currentNote.trim()) return;
    setIsProcessing(true);
    const improved = await improveNote(currentNote);
    setCurrentNote(improved);
    setIsProcessing(false);
  };

  const handleExport = () => {
    const text = notes.map(n => {
      const bookName = BIBLE_BOOKS_LIST.find(b => b.id === n.bookId)?.name || 'Geral';
      const ref = n.bookId !== 'geral' ? `[${bookName} ${n.chapter}${n.verse ? ':'+n.verse : ''}]` : '[Geral]';
      return `${ref} (${new Date(n.createdAt).toLocaleDateString()})\n${n.content}`;
    }).join('\n\n-------------------\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minhas-anotacoes-biblicas.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenShare = (e: React.MouseEvent, note: Note) => {
      e.stopPropagation();
      const bookMeta = BIBLE_BOOKS_LIST.find(b => b.id === note.bookId);
      let reference = 'Nota Pessoal';
      if (note.bookId !== 'geral') reference = `${bookMeta?.name || 'Livro'} ${note.chapter}${note.verse ? ':' + note.verse : ''}`;
      else if (note.title) reference = note.title;
      setSharingData({ text: note.content, ref: reference });
  };

  const handleAISmartShare = async (e: React.MouseEvent, note: Note) => {
      e.stopPropagation();
      setGeneratingShareId(note.id);
      try {
          const bookMeta = BIBLE_BOOKS_LIST.find(b => b.id === note.bookId);
          const result = await summarizeNoteForSocial(note.content, bookMeta?.name || 'Geral', note.chapter);
          if (result) setSharingData({ text: result.summary, ref: result.ref });
      } catch (e) { console.error(e); } 
      finally { setGeneratingShareId(null); }
  };

  if (!currentUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-black/20 text-center">
         <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6"><Lock size={48} className="text-gray-400" /></div>
         <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-2">Área Restrita</h2>
         <p className="text-gray-500 mb-6 max-w-md">Faça login para criar e sincronizar suas anotações.</p>
         <button onClick={() => openLogin()} className="bg-bible-gold text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all">Entrar Agora</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-gray-50 dark:bg-black/20">
      <div className="flex-1 flex flex-col p-6 bg-white dark:bg-bible-darkPaper">
        <div className="flex justify-end mb-4">
            <button onClick={handleExport} className="p-2 text-gray-500 hover:text-bible-leather dark:hover:text-bible-gold" title="Exportar Notas"><Download size={20} /></button>
        </div>
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col mb-4 shadow-inner"><textarea className="flex-1 bg-transparent resize-none focus:outline-none text-gray-700 dark:text-gray-300 leading-relaxed p-2 font-sans" placeholder="Escreva seus pensamentos, orações ou estudos aqui..." value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} /><div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-800"><button onClick={handleAIImprove} disabled={!currentNote.trim() || isProcessing} className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 transition-colors font-semibold"><Wand2 size={16} />{isProcessing ? 'Melhorando...' : 'Melhorar com IA'}</button><button onClick={handleSave} disabled={!currentNote.trim() || isSaving} className="flex items-center gap-2 bg-bible-leather dark:bg-bible-gold text-white px-6 py-2 rounded-full hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-30"><Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar'}</button></div></div>
      </div>
      <div className="w-full md:w-96 bg-gray-50 dark:bg-bible-darkPaper/50 border-l border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-transparent"><h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Bookmark size={18} className="text-bible-gold" />Recentes</h3></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">{notes.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-gray-400"><PenTool size={48} className="opacity-20 mb-4" /><p className="text-center text-sm">Nenhuma reflexão ainda.<br/>Que tal registrar seu primeiro insight?</p></div>) : (notes.map(note => {const bookMeta = BIBLE_BOOKS_LIST.find(b => b.id === note.bookId); return (<div key={note.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 group transition-all hover:shadow-md relative overflow-hidden"><div className="flex justify-between items-start mb-3"><div className="flex flex-col gap-1 max-w-[65%]"><span className="text-[10px] font-bold text-bible-gold uppercase tracking-wider">{new Date(note.createdAt).toLocaleDateString()}</span>{note.bookId !== 'geral' && (<span className="text-xs font-serif font-bold text-bible-leather dark:text-bible-gold truncate">{bookMeta?.name} {note.chapter}{note.verse ? ':' + note.verse : ''}</span>)}</div><div className="flex items-center gap-1 z-20 shrink-0"><button onClick={(e) => handleAISmartShare(e, note)} className="p-2 text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors" title="Resumir com IA e Criar Imagem" disabled={generatingShareId === note.id}>{generatingShareId === note.id ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}</button><button onClick={(e) => handleOpenShare(e, note)} className="p-2 text-pink-600 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/40 rounded-lg transition-colors" title="Criar Imagem (Texto Completo)"><Instagram size={16} /></button><button onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); }} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors" title="Excluir Nota"><Trash2 size={16} /></button></div></div><p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed line-clamp-3">{note.content}</p></div>); }))}</div>
      </div>
      <SocialShareModal isOpen={!!sharingData} onClose={() => setSharingData(null)} verseText={sharingData?.text || ''} verseReference={sharingData?.ref || ''} />
      <ConfirmationModal isOpen={!!noteToDelete} onClose={() => setNoteToDelete(null)} onConfirm={confirmDeleteNote} title="Excluir Anotação" message="Tem certeza que deseja apagar esta nota permanentemente?" confirmText="Sim, Excluir" variant="danger" />
    </div>
  );
};

export default Notes;