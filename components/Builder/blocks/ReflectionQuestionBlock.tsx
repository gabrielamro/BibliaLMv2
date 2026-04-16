"use client";
import React, { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle, Heart, MessageCircle, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { dbService } from '../../../services/supabase';
import { useNavigate } from '../../../utils/router';

interface ReflectionQuestionBlockProps {
  data: any;
  isEditable?: boolean;
  studyId?: string;
  studyTitle?: string;
  onUpdate?: (data: any) => void;
}

const ConversionModal = ({ isOpen, onClose, onLogin }: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-bible-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-bible-gold" />
          </div>
          
          <h3 className="text-xl font-bold text-bible-ink dark:text-white mb-2">
            Suas reflexões merecem ser guardadas
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Crie uma conta gratuita para salvar suas reflexões, acessar de qualquer lugar e acompanhar sua jornada espiritual.
          </p>
          
          <div className="space-y-3 mb-6 text-left">
            {['Salve reflexões sem limites', 'Acesse de qualquer dispositivo', 'Receba inspiração diária'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-left">
                <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
          
          <button
            onClick={onLogin}
            className="w-full py-4 bg-gradient-to-r from-bible-gold to-amber-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Criar Conta Gratuita
          </button>
          
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            Agora não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
};

export const ReflectionQuestionBlock: React.FC<ReflectionQuestionBlockProps> = ({ 
  data, 
  isEditable = true,
  studyId,
  studyTitle,
  onUpdate
}) => {
  const navigate = useNavigate();
  const { currentUser, earnMana, showNotification } = useAuth();
  const [reflection, setReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedReflections, setSavedReflections] = useState<any[]>([]);
  const [showReflections, setShowReflections] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);

  // Carregar reflexões existentes deste estudo
  useEffect(() => {
    const loadReflections = async () => {
      if (!currentUser || isEditable) return;
      try {
        const allNotes = await dbService.getAll(currentUser.uid, 'notes') as any[];
        const studyReflections = allNotes.filter(
          (n: any) => n.bookId === `study:${studyId}` && n.chapter === 0
        );
        setSavedReflections(studyReflections);
      } catch (e) {
        console.error('Erro ao carregar reflexões:', e);
      }
    };
    loadReflections();
  }, [currentUser, studyId, isEditable]);

  const handleSaveReflection = async () => {
    if (!reflection.trim()) return;

    if (!currentUser) {
      setShowConversionModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const noteData = {
        bookId: `study:${studyId || 'unknown'}`,
        chapter: 0,
        verse: 0,
        content: reflection,
        title: `Reflexão: ${data.question?.substring(0, 60) || 'Pergunta ao Coração'}`,
        sourceText: `📖 ${studyTitle || 'Estudo Bíblico'}\n❓ ${data.question || ''}`,
      };

      const docRef = await dbService.add(currentUser.uid, 'notes', noteData);
      
      // Atualizar estado local
      setSavedReflections(prev => [{
        id: docRef.id,
        ...noteData,
        createdAt: new Date().toISOString()
      }, ...prev]);

      try {
        await earnMana?.('create_note');
      } catch (e) { /* não-crítico */ }

      setIsSaved(true);
      setReflection('');
      showNotification?.('✨ Reflexão salva nas suas Notas!', 'success');

      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: any) {
      console.error('Erro ao salvar reflexão:', e);
      showNotification?.(`Erro ao salvar: ${e.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Modo edição (para o Autor configurar a pergunta)
  if (isEditable) {
    return (
      <section className="rounded-[32px] border-2 border-dashed border-[#e2ceb0] dark:border-gray-700 bg-white/50 dark:bg-bible-darkPaper/50 p-6 md:p-8 w-full h-full relative group">
        <div className="absolute top-4 right-4 text-[10px] font-bold text-[#b3874c] uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
          Configuração de Reflexão
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-[#b3874c] uppercase mb-1 block">Título do Bloco</label>
            <input 
              type="text"
              value={data.title || 'Pergunta ao Coração'}
              onChange={(e) => onUpdate?.({ ...data, title: e.target.value })}
              className="w-full bg-transparent border-b border-[#e2ceb0]/40 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c] focus:outline-none focus:border-[#b3874c]"
              placeholder="Ex: Pausa para Reflexão"
            />
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-[#b3874c] uppercase mb-1 block">Sua Pergunta</label>
            <textarea 
              value={data.question || ''}
              onChange={(e) => onUpdate?.({ ...data, question: e.target.value })}
              className="w-full bg-transparent border-none py-1 font-serif text-2xl text-[#5e4634] dark:text-[#e8d5c0] leading-snug focus:outline-none resize-none p-0"
              placeholder="Digite aqui a pergunta que deseja fazer ao leitor..."
              rows={2}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#b3874c] uppercase mb-1 block">Texto de Apoio (Opcional)</label>
            <textarea 
              value={data.support || ''}
              onChange={(e) => onUpdate?.({ ...data, support: e.target.value })}
              className="w-full bg-transparent border-none py-1 text-[14px] text-[#6b5849] dark:text-gray-400 focus:outline-none resize-none p-0 italic"
              placeholder="Adicione um contexto ou incentivo para a reflexão..."
              rows={1}
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#e2ceb0]/40">
           <div className="flex items-center gap-3 text-[#c39b5a]/60">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#faf7f3] dark:bg-white/5 border border-[#e2ceb0] dark:border-gray-700">
                 <Heart size={18} />
              </div>
              <span className="text-xs italic">O leitor poderá escrever a reflexão dele aqui no modo de visualização.</span>
           </div>
        </div>
      </section>
    );
  }

  // Modo leitura (preview / publicado — interativo com textarea)
  return (
    <>
      <ConversionModal
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        onLogin={() => {
          setShowConversionModal(false);
          navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
        }}
      />
      <section className="rounded-[32px] border border-gray-100 dark:border-white/5 bg-white dark:bg-bible-darkPaper p-6 md:p-8 shadow-lg w-full h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c]">
            {data.title || 'Pergunta ao Coração'}
          </p>
          <h3 className="mt-3 font-serif text-2xl md:text-3xl text-[#5e4634] dark:text-[#e8d5c0] leading-snug">
            {data.question}
          </h3>
        </div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e2ceb0] bg-white/80 dark:bg-white/10 text-[#c39b5a] shrink-0">
          <Heart size={20} />
        </div>
      </div>

      {/* Texto de apoio */}
      {data.support && (
        <p className="mt-4 text-[15px] leading-8 text-[#6b5849] dark:text-gray-400">
          {data.support}
        </p>
      )}

      {/* Campo de reflexão */}
      <div className="mt-6 space-y-3">
        <div className="relative">
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Escreva sua reflexão pessoal aqui... Suas palavras serão salvas como nota."
            className="w-full min-h-[120px] p-4 bg-[#faf7f3] dark:bg-gray-900/50 border border-[#e8dccd] dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#c39b5a]/50 focus:border-[#c39b5a] text-[15px] leading-7 text-[#5e4634] dark:text-gray-200 resize-none placeholder:text-[#b3a08d] placeholder:italic transition-all duration-300"
            disabled={isSaving}
          />

          {/* Contador de caracteres */}
          {reflection.length > 0 && (
            <span className="absolute bottom-3 left-4 text-[10px] font-mono text-[#b3a08d]">
              {reflection.length} caracteres
            </span>
          )}
        </div>

        {/* Botão salvar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowReflections(!showReflections)}
            className="text-xs text-[#b3874c] hover:text-[#8a6832] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <MessageCircle size={14} />
            {savedReflections.length > 0
              ? `${savedReflections.length} reflexão(ões) salva(s)`
              : 'Minhas reflexões'}
          </button>

          <button
            onClick={handleSaveReflection}
            disabled={isSaving || !reflection.trim() || isSaved}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSaved 
                ? 'bg-green-500 text-white' 
                : 'bg-gradient-to-r from-[#b3874c] to-[#8a6832] text-white hover:shadow-lg hover:brightness-110'
            }`}
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaved && <CheckCircle size={16} />}
            {!isSaving && !isSaved && <Send size={16} />}
            {isSaving ? 'Salvando...' : isSaved ? 'Salvo!' : 'Salvar Reflexão'}
          </button>
        </div>
      </div>

      {/* Reflexões salvas */}
      {showReflections && savedReflections.length > 0 && (
        <div className="mt-6 space-y-3 pt-5 border-t border-[#e8dccd] dark:border-gray-700">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b3874c]">
            Suas reflexões anteriores
          </p>
          {savedReflections.map((note: any) => (
            <div
              key={note.id}
              className="bg-[#faf7f3] dark:bg-gray-900/30 p-4 rounded-xl border border-[#e8dccd]/50 dark:border-gray-700/50"
            >
              <p className="text-sm text-[#5e4634] dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-[#b3a08d]">
                  {new Date(note.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className="text-[10px] text-[#b3874c] font-semibold">
                  📝 Salvo em Notas
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicador de origem */}
      {!isEditable && (
        <div className="mt-4 text-center">
          <p className="text-[10px] text-[#b3a08d] italic">
            💡 Suas reflexões ficam salvas em Minhas Notas → com referência a este estudo
          </p>
        </div>
      )}
    </section>
    </>
  );
};
