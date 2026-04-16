"use client";

import React, { useState } from 'react';
import { BookOpen, ChevronUp, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from '../../../utils/router';

interface ReferencesChainBlockProps {
  data: {
    title: string;
    description: string;
    references: Array<{
      reference: string;
      text: string;
      summary: string;
    }>;
    showExpandAll: boolean;
    padding: number;
  };
  isEditing?: boolean;
  onUpdate?: (data: any) => void;
}

const VerseModal = ({ 
  reference, 
  text, 
  onClose, 
  onLogin 
}: { 
  reference: string; 
  text: string; 
  onClose: () => void;
  onLogin: () => void;
}) => {
  const { currentUser } = useAuth();
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
          <X size={18} />
        </button>
        
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-bible-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} className="text-bible-gold" />
          </div>
          <div>
            <p className="text-xs font-bold text-bible-gold uppercase tracking-wider">{reference}</p>
            {!currentUser && (
              <button onClick={onLogin} className="text-[10px] text-violet-600 hover:underline">
                Cadastre-se para ver mais versículos
              </button>
            )}
          </div>
        </div>
        
        <blockquote className="text-xl font-serif italic text-bible-ink dark:text-white leading-relaxed mb-4">
          "{text}"
        </blockquote>
        
        {!currentUser && (
          <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl">
            <p className="text-sm text-violet-700 dark:text-violet-300 mb-3">
              Acesse a biblioteca completa da BíbliaLM
            </p>
            <button
              onClick={onLogin}
              className="w-full py-2 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors"
            >
              Criar Conta Gratuita
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ReferencesChainBlock: React.FC<ReferencesChainBlockProps> = ({ data, isEditing = false, onUpdate }) => {
  const [expandedRefs, setExpandedRefs] = useState<Set<number>>(new Set());
  const [selectedVerse, setSelectedVerse] = useState<{ reference: string; text: string } | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const references = data.references || [];
  
  const toggleExpand = (index: number) => {
    setExpandedRefs(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  
  const handleVerseClick = (ref: { reference: string; text: string }, index: number) => {
    if (!currentUser) {
      setSelectedVerse(ref);
    } else {
      toggleExpand(index);
    }
  };
  
  if (isEditing) {
    return (
      <section className="rounded-[28px] border-2 border-dashed border-[#e2ceb0] dark:border-gray-700 bg-white/50 dark:bg-bible-darkPaper/50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c] mb-2">
          {data.title || 'Referências Encadeadas'}
        </p>
        <p className="text-sm text-[#7b6c5e] mb-4">
          {data.description || 'Lista de versículos conectados ao tema'}
        </p>
        
        <div className="space-y-3">
          {references.length > 0 ? references.map((ref, i) => (
            <div key={i} className="p-4 bg-[#fcfaf7] rounded-xl border border-[#eee2d2]">
              <p className="text-sm font-bold text-[#b3874c]">{ref.reference}</p>
            </div>
          )) : (
            <p className="text-xs text-[#8c6b3e] italic">
              Adicione versículos no painel lateral
            </p>
          )}
        </div>
      </section>
    );
  }
  
  return (
    <>
      {selectedVerse && (
        <VerseModal
          reference={selectedVerse.reference}
          text={selectedVerse.text}
          onClose={() => setSelectedVerse(null)}
          onLogin={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
        />
      )}
      
      <section className="rounded-[28px] border border-[#eadfcf] bg-white/82 p-5 shadow-[0_22px_60px_rgba(59,44,25,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b3874c]">
              {data.title || 'Referências'}
            </p>
            <p className="text-sm text-[#7b6c5e]">{data.description}</p>
          </div>
          {!currentUser && (
            <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
              Cadastre-se
            </span>
          )}
        </div>
        
        {references.length === 0 ? (
          <p className="text-sm text-[#7b6c5e] italic">Nenhuma referência adicionada.</p>
        ) : (
          <div className="relative pl-4">
            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#c5a059] via-[#c5a059] to-transparent" />
            
            <div className="space-y-4">
              {references.map((ref, index) => {
                const isExpanded = expandedRefs.has(index);
                const isLocked = !currentUser && !isExpanded;
                
                return (
                  <div key={index} className="relative">
                    <div className={`absolute -left-4 top-4 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all ${
                      isExpanded 
                        ? 'bg-[#c5a059] border-[#c5a059] text-white' 
                        : 'bg-white border-[#c5a059] text-[#c5a059]'
                    }`}>
                      {isExpanded ? <ChevronUp size={12} /> : <BookOpen size={10} />}
                    </div>
                    
                    <div className={`rounded-2xl border transition-all ${
                      isExpanded
                        ? 'border-[#c5a059] bg-[#fffbf0] p-4'
                        : 'border-[#efe3d3] bg-[#fcfaf7] p-4 hover:border-[#c5a059]/50 cursor-pointer'
                    } ${isLocked ? 'opacity-75' : ''}`}
                    onClick={() => handleVerseClick(ref, index)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#b3874c]">{ref.reference}</h3>
                        {isLocked && (
                          <span className="text-[10px] text-violet-600 flex items-center gap-1">
                            <ExternalLink size={10} />
                            Login
                          </span>
                        )}
                      </div>
                      
                      {isExpanded && (
                        <>
                          <p className="mt-3 text-sm leading-7 text-[#66594c] italic">"{ref.text}"</p>
                          {ref.summary && (
                            <p className="mt-2 text-xs text-[#8c6b3e]">{ref.summary}</p>
                          )}
                        </>
                      )}
                      
                      {!isExpanded && (
                        <p className="mt-1 text-xs text-[#8c6b3e]">{ref.summary}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {!currentUser && references.length > 0 && (
          <button
            onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
            className="w-full mt-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
          >
            Ver todos os versículos na biblioteca
          </button>
        )}
      </section>
    </>
  );
};
