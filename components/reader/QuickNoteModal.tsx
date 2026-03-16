"use client";
import { useNavigate } from '../../utils/router';


import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Quote, Trash2, Wand2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../services/supabase';
import { improveNote } from '../../services/geminiService';

import { Note } from '../../types';
import ConfirmationModal from '../ConfirmationModal';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVerses: number[];
  bookId: string;
  bookName: string;
  chapter: number;
  getSelectedContent: () => { text: string; ref: string };
  onSuccess: () => void;
  existingNotes?: Note[]; // Novas notas existentes
}

const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
  isOpen,
  onClose,
  selectedVerses,
  bookId,
  bookName,
  chapter,
  getSelectedContent,
  onSuccess,
  existingNotes = []
}) => {
  const { currentUser, earnMana, showNotification, markChapterCompleted } = useAuth();
  const navigate = useNavigate();
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  
  // Modals state
  const [showLoginConfirm, setShowLoginConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Reset content when opening new verse
  useEffect(() => {
      if (isOpen) setNoteContent('');
  }, [isOpen, selectedVerses]);

  if (!isOpen) return null;

  const { text: verseText, ref: verseRef } = getSelectedContent();

  const handleSave = async () => {
    if (!currentUser) {
      setShowLoginConfirm(true);
      return;
    }

    if (!noteContent.trim()) return;

    setIsSaving(true);
    try {
      await dbService.add(currentUser.uid, 'notes', {
        bookId,
        chapter,
        verse: selectedVerses[0], // Mantido para compatibilidade legado
        verses: selectedVerses,   // Grava todos os versículos selecionados
        content: noteContent,
        sourceText: verseText,
        title: `Nota em ${verseRef}`,
        userThoughts: noteContent 
      });

      // INTEGRAÇÃO UNIVERSO DE LEITURA
      // Ao criar uma nota, consideramos que o usuário interagiu profundamente com o capítulo
      if (bookId !== 'geral') {
         await markChapterCompleted(bookId, chapter);
      }

      await earnMana('create_note');
      
      setNoteContent('');
      onSuccess();
      onClose(); // Fecha o modal para continuar a leitura
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      showNotification("Erro ao salvar sua anotação. Tente novamente.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
      if (!currentUser || !deleteId) return;
      setIsDeleting(deleteId);
      setDeleteId(null); // Close modal immediately
      try {
          await dbService.delete(currentUser.uid, 'notes', deleteId);
          onSuccess();
          showNotification("Nota excluída.", "success");
      } catch (e) {
          console.error(e);
          showNotification("Erro ao excluir nota.", "error");
      } finally {
          setIsDeleting(null);
      }
  };

  const handleAIImprove = async () => {
    if (!noteContent.trim()) return;
    setIsImproving(true);
    try {
      const improved = await improveNote(noteContent);
      if (improved) setNoteContent(improved);
    } catch (e) {
      console.error("AI Error", e);
      showNotification("Erro ao conectar com a IA.", "error");
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="bg-white dark:bg-bible-darkPaper w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white">Anotações</h3>
            <p className="text-xs text-gray-500">{verseRef}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          
          <div className="bg-bible-gold/10 p-4 rounded-xl border border-bible-gold/20">
            <div className="flex gap-2">
              <Quote size={16} className="text-bible-gold shrink-0 mt-1" />
              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 italic line-clamp-4 leading-relaxed font-serif">
                {verseText}
              </p>
            </div>
          </div>

          {existingNotes.length > 0 && (
              <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notas Salvas</h4>
                  {existingNotes.map((note) => (
                      <div key={note.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 group relative">
                          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.content}</p>
                          <div className="mt-2 flex justify-between items-center">
                              <span className="text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                              <button 
                                onClick={() => setDeleteId(note.id)}
                                disabled={isDeleting === note.id}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                              >
                                  {isDeleting === note.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />}
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                {existingNotes.length > 0 ? 'Adicionar outra nota' : 'Nova Anotação'}
            </label>
            <div className="relative">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Escreva sua análise, oração ou insight..."
                  className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-base resize-none"
                  autoFocus={existingNotes.length === 0}
                />
                {noteContent.length > 10 && (
                    <button 
                        onClick={handleAIImprove}
                        disabled={isImproving}
                        className="absolute bottom-3 right-3 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                        {isImproving ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />} 
                        {isImproving ? 'Melhorando...' : 'Melhorar com IA'}
                    </button>
                )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-black/20 rounded-b-3xl shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            Fechar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !noteContent.trim()}
            className="px-6 py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Salvando...' : 'Salvar e Concluir'}
          </button>
        </div>

      </div>

      <ConfirmationModal
        isOpen={showLoginConfirm}
        onClose={() => setShowLoginConfirm(false)}
        onConfirm={() => navigate('/login', {
            state: {
                from: {
                    pathname: '/',
                    state: { bookId, chapter, scrollToVerse: selectedVerses[0] }
                }
            }
        })}
        title="Salvar na Nuvem"
        message="Para acessar suas notas em qualquer dispositivo e não perdê-las, entre em sua conta."
        confirmText="Fazer Login"
        cancelText="Agora não"
        variant="info"
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Nota"
        message="Tem certeza que deseja apagar esta anotação?"
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default QuickNoteModal;
