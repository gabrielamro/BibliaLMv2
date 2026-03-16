"use client";
import { useNavigate, useParams } from '../utils/router';

import React, { useEffect, useState } from 'react';

import { decodeShareToken, SharedContentType } from '../utils/shareUtils';
import { Loader2, BookOpen, Mic2, Sparkles, ArrowRight, Download, Share2, Quote, Play } from 'lucide-react';
import { LogoIcon } from '../components/LogoIcon';

const SharedResolverPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ type: SharedContentType, params: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const decoded = decodeShareToken(token);
    if (!decoded) {
      navigate('/');
      return;
    }

    setData(decoded);
    setLoading(false);
  }, [token, navigate]);

  const handleOpenInApp = () => {
    if (!data) return;

    // Lógica de Redirecionamento Baseada no Tipo
    switch (data.type) {
      case 'verse':
        navigate('/', { 
          state: { 
            bookId: data.params.bookId, 
            chapter: data.params.chapter, 
            scrollToVerse: data.params.verse 
          } 
        });
        break;
      
      case 'devotional':
        navigate('/devocional', { state: { targetDate: data.params.date } });
        break;

      case 'study':
      case 'podcast':
        navigate('/estudo', { 
          state: { 
            sourceText: data.params.text, // Fix: use sourceText for consistency
            source: data.type,
            analysisResult: data.params.analysis,
            script: data.params.script
          } 
        });
        break;

      default:
        navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bible-paper dark:bg-bible-darkPaper text-bible-leather dark:text-bible-gold">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-serif italic">Carregando conteúdo...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-bible-gold/20 to-transparent pointer-events-none"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        
        {/* Brand Header */}
        <div className="mb-8 text-center">
           <div className="w-16 h-16 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg transform rotate-3">
              <LogoIcon className="w-10 h-10" />
           </div>
           <h1 className="text-2xl font-serif font-bold tracking-wide">
             <span className="text-bible-leather dark:text-bible-gold">Bíblia</span>
             <span className="text-bible-gold">LM</span>
           </h1>
           <p className="text-xs text-gray-500 uppercase tracking-widest">Inteligência Artificial Teológica</p>
        </div>

        {/* Content Card */}
        <div className="w-full max-w-md bg-white dark:bg-bible-darkPaper rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-8 duration-700">
           
           {/* Header do Card baseado no tipo */}
           <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              {data.type === 'podcast' && <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full"><Mic2 size={20} /></div>}
              {data.type === 'study' && <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full"><Sparkles size={20} /></div>}
              {data.type === 'verse' && <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-full"><Quote size={20} /></div>}
              {data.type === 'devotional' && <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full"><Share2 size={20} /></div>}
              
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Conteúdo Compartilhado</span>
                <h2 className="font-bold text-gray-900 dark:text-white leading-tight">
                  {data.type === 'podcast' ? 'Podcast IA' : data.type === 'study' ? 'Estudo Profundo' : data.type === 'verse' ? 'Versículo Bíblico' : 'Devocional'}
                </h2>
              </div>
           </div>

           {/* Preview Body */}
           <div className="p-8">
              {data.type === 'podcast' && (
                <div className="space-y-4">
                   <h3 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100">{data.params.title}</h3>
                   <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30 relative overflow-hidden">
                      <div className="absolute top-2 right-2 opacity-10"><Mic2 size={40} /></div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 italic line-clamp-4 relative z-10">
                        {data.params.script ? `"${data.params.script.substring(0, 150)}..."` : "Clique para ouvir o episódio completo gerado por Inteligência Artificial."}
                      </p>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                      <Play size={12} fill="currentColor" /> Preview do Roteiro
                   </div>
                </div>
              )}

              {data.type === 'study' && (
                <div className="space-y-4">
                   <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Análise Teológica</h3>
                   <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-6 leading-relaxed">
                     {data.params.analysis ? data.params.analysis.substring(0, 300) : data.params.text}
                     ...
                   </p>
                </div>
              )}

              {(data.type === 'verse' || data.type === 'devotional') && (
                 <div className="text-center space-y-6">
                    <Quote size={32} className="mx-auto text-bible-gold opacity-50" />
                    {data.type === 'devotional' && <h3 className="font-bold text-lg">{data.params.title}</h3>}
                    <p className="text-xl font-serif text-gray-800 dark:text-gray-200 leading-relaxed">
                      "{data.params.text || 'Conteúdo bíblico'}"
                    </p>
                    {data.params.ref && (
                      <div className="inline-block px-4 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500">
                        {data.params.ref}
                      </div>
                    )}
                 </div>
              )}
           </div>

           {/* Footer Action */}
           <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={handleOpenInApp}
                className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                {data.type === 'podcast' ? 'Ouvir no App' : 'Ler Completo no App'} <ArrowRight size={18} />
              </button>
              <p className="text-center text-[10px] text-gray-400 mt-3">
                Acesse gratuitamente na BíbliaLM
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SharedResolverPage;