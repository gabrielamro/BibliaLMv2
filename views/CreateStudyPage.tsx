"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { bibleService } from '../services/bibleService';
import { generateStructuredStudy } from '../services/pastorAgent';
import { 
  Save, ArrowLeft, Loader2, Sparkles, LayoutTemplate, 
  Target, Search, Quote, Info,
  Brain, Zap, GraduationCap, PenTool, Layers, CheckCircle2,
  X, Layout
} from 'lucide-react';
import { BibleCategory, StudySource } from '../types';
import SEO from '../components/SEO';
import { BIBLE_BOOKS_LIST } from '../constants';
import { searchMatch } from '../utils/textUtils';
import RichTextEditor from '../components/RichTextEditor';

const DEFAULT_TEMPLATE = `
<h1>Título do Estudo</h1>
<p><b>Texto Base:</b> Inserir Referência</p>
<blockquote>"Cole aqui o versículo chave..."</blockquote>

<h2>1. Introdução</h2>
<p>Escreva aqui o contexto histórico, o problema abordado e o objetivo da mensagem.</p>

<h2>2. Exposição do Texto</h2>
<p><b>Ponto A:</b> Explicação teológica...</p>
<p><b>Ponto B:</b> Explicação teológica...</p>

<h2>3. Aplicação Prática</h2>
<p>Como podemos aplicar esta verdade em nossa vida hoje?</p>

<h2>Conclusão</h2>
<p>Fechamento e oração final.</p>
`;

const CreateStudyPage: React.FC = () => {
  const { currentUser, earnMana, incrementUsage, showNotification } = useAuth();
  const { setTitle: setHeaderTitle, setBreadcrumbs, resetHeader } = useHeader();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSearchingVerse, setIsSearchingVerse] = useState(false);
  
  // Controle de Abas da Sidebar e Modo de Estudo
  const [sidebarTab, setSidebarTab] = useState<'ai' | 'manual'>('manual');
  const [studyMode, setStudyMode] = useState<'quick' | 'deep'>('deep');
  
  const searchTimeoutRef = useRef<any>(null);

  // Inputs Comuns
  const [mainVerse, setMainVerse] = useState('');
  const [verseText, setVerseText] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BibleCategory>('Geral');
  const [source, setSource] = useState<StudySource>('sermon'); // Default source

  // Inputs IA
  const [theme, setTheme] = useState('');
  const [audience, setAudience] = useState('');

  // Inputs Manuais (Estrutura Homilética)
  const [manualIntro, setManualIntro] = useState('');
  const [manualContext, setManualContext] = useState('');
  const [manualApplication, setManualApplication] = useState('');
  const [manualPrayer, setManualPrayer] = useState('');
  
  // Conteúdo do Editor
  const [editorContent, setEditorContent] = useState('');

  // Publish Modal
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishFrequency, setPublishFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [publishVisibility, setPublishVisibility] = useState<'public' | 'private_invite' | 'private'>('private');

  // --- HEADER MANAGEMENT ---
  useEffect(() => {
      setHeaderTitle(title || 'Novo Estudo');
      setBreadcrumbs([
          { label: 'Estudos', path: '/estudos/planos' },
          { label: title || 'Novo Estudo' }
      ]);
      return () => resetHeader();
  }, [title, setHeaderTitle, setBreadcrumbs, resetHeader]);

  // Inicialização baseada no estado de navegação
  useEffect(() => {
      if (state?.prefill) {
          const { title: pTitle, mainVerse: pVerse, verseText: pText, textAnalysis, theme: pTheme, source: pSource } = state.prefill;
          setTitle(pTitle || '');
          setMainVerse(pVerse || '');
          setVerseText(pText || '');
          setTheme(pTheme || '');
          if (pSource) setSource(pSource); // Captura a origem (ex: 'modulo' ou 'devocional')
          
          if (textAnalysis) {
              const html = typeof textAnalysis === 'string' ? textAnalysis : JSON.stringify(textAnalysis); 
              setEditorContent(html);
          }
      } else if (state?.source) {
          // Fallback se o source estiver fora do prefill
          setSource(state.source);
          setEditorContent(DEFAULT_TEMPLATE);
      } else {
          setEditorContent(DEFAULT_TEMPLATE);
      }
  }, [state]);

  // Busca automática do versículo
  useEffect(() => {
      const ref = mainVerse.trim();
      if (ref.length > 2 && !verseText) {
          if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
          
          searchTimeoutRef.current = setTimeout(async () => {
              setIsSearchingVerse(true);
              try {
                  const verseMatch = ref.match(/^([1-3]?\s?[a-zà-ú\ç\ã\õ\s]+)\s+(\d+)[:\.;\s](\d+)$/i);
                  const chapterMatch = ref.match(/^([1-3]?\s?[a-zà-ú\ç\ã\õ\s]+)\s+(\d+)$/i);

                  if (verseMatch) {
                      const result = await bibleService.getVerseText(ref);
                      if (result) {
                          setVerseText(result.text);
                          if (!title) setTitle(`Estudo em ${result.formattedRef}`);
                      }
                  } else if (chapterMatch) {
                      const chapterRes = await bibleService.getTextByReference(ref);
                      if (chapterRes) {
                          setVerseText(chapterRes.text);
                          if (!title) setTitle(`Estudo em ${chapterRes.formattedRef}`);
                      }
                  }
              } catch (e) {
                  console.error(e);
              } finally {
                  setIsSearchingVerse(false);
              }
          }, 1000);
      }
      return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [mainVerse]);

  const handleAiFill = async () => {
      if (!mainVerse) {
          showNotification("Informe o versículo principal primeiro.", "info");
          return;
      }
      setIsGeneratingAI(true);
      try {
          const generatedHtml = await generateStructuredStudy(theme || 'Geral', mainVerse, audience || 'Geral', studyMode);
          
          if (generatedHtml) {
              setEditorContent(generatedHtml);
              
              if (!title) {
                  // Extração segura do título
                  try {
                      const match = generatedHtml.match(/<h1>(.*?)<\/h1>/);
                      if (match && match[1]) setTitle(match[1].replace(/<[^>]*>/g, '').trim());
                  } catch (e) {
                      // Silencioso se falhar regex
                  }
              }
              
              await incrementUsage('analysis');
              showNotification("Manuscrito gerado com sucesso!", "success");
          } else {
              showNotification("A IA não pôde gerar o conteúdo agora. Tente novamente.", "error");
          }
      } catch (e) {
          console.error("AI Error:", e);
          showNotification("Erro ao conectar com o Obreiro IA.", "error");
      } finally {
          setIsGeneratingAI(false);
      }
  };

  const handleManualAssemble = () => {
      if (!manualIntro && !manualContext) {
          showNotification("Preencha pelo menos a introdução ou contextualização.", "info");
          return;
      }

      const html = `
        <h1>${title || 'Novo Estudo'}</h1>
        <p><b>Texto Base:</b> ${mainVerse}</p>
        <blockquote>"${verseText}"</blockquote>

        <h2>1. Introdução</h2>
        <p>${manualIntro.replace(/\n/g, '<br/>')}</p>

        <h2>2. Contextualização</h2>
        <p>${manualContext.replace(/\n/g, '<br/>')}</p>

        <h2>3. Aplicação</h2>
        <p>${manualApplication.replace(/\n/g, '<br/>')}</p>

        ${manualPrayer ? `<h2>4. Oração</h2><p>${manualPrayer.replace(/\n/g, '<br/>')}</p>` : ''}
      `;
      
      setEditorContent(html);
      showNotification("Estrutura montada no editor!", "success");
  };

  const handleSave = async (targetStatus: 'draft' | 'published' = 'draft') => {
      if (!title) { showNotification("O título é obrigatório.", "error"); return; }
      if (!editorContent || editorContent === '<br>') { showNotification("O manuscrito está vazio.", "error"); return; }
      if (!currentUser) return;

      setIsLoading(true);
      try {
          const studyData = {
              title: title,
              sourceText: mainVerse || title,
              analysis: editorContent,
              source: source, 
              category: category,
              status: targetStatus,
              frequency: publishFrequency,
              visibility: publishVisibility,
              publishedAt: targetStatus === 'published' ? new Date().toISOString() : undefined,
              createdAt: new Date().toISOString()
          };
          await dbService.add(currentUser.uid, 'studies', studyData);
          await earnMana('create_sermon');
          showNotification(targetStatus === 'draft' ? "Rascunho salvo." : "Estudo publicado com sucesso!", "success");
          navigate('/estudos/planos');
      } catch (e) {
          console.error(e);
          showNotification("Erro ao salvar projeto.", "error");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="h-full bg-gray-100 dark:bg-[#121212] overflow-y-auto mobile-bottom-nav-offset md:pb-8">
        <SEO title="Editor de Manuscrito Bíblico" />
        
        {/* Header Fixo (Removido para usar o global) */}
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-end items-center shadow-sm">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                <button onClick={() => handleSave('draft')} disabled={isLoading} className="w-full sm:w-auto px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-xs hover:text-bible-gold transition-colors border border-gray-200 dark:border-gray-700 rounded-lg md:border-transparent">Salvar Rascunho</button>
                <button onClick={() => setShowPublishModal(true)} disabled={isLoading} className="w-full sm:w-auto px-5 py-2 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    {isLoading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>} 
                    <span className="hidden md:inline">Publicar</span>
                    <span className="md:hidden">Publicar</span>
                </button>
            </div>
        </div>

        {/* Publish Modal */}
        {showPublishModal && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="font-serif font-bold text-xl text-gray-900 dark:text-white">Publicar Estudo</h3>
                        <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24}/></button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Frequência do Estudo</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setPublishFrequency('daily')} className={`p-3 rounded-xl border-2 text-center transition-all ${publishFrequency === 'daily' ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-300'}`}>
                                    <div className="font-bold text-sm">Diário</div>
                                    <div className="text-[9px] uppercase tracking-widest mt-1">Devocional</div>
                                </button>
                                <button onClick={() => setPublishFrequency('weekly')} className={`p-3 rounded-xl border-2 text-center transition-all ${publishFrequency === 'weekly' ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-300'}`}>
                                    <div className="font-bold text-sm">Semanal</div>
                                    <div className="text-[9px] uppercase tracking-widest mt-1">Célula/Culto</div>
                                </button>
                                <button onClick={() => setPublishFrequency('monthly')} className={`p-3 rounded-xl border-2 text-center transition-all ${publishFrequency === 'monthly' ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-300'}`}>
                                    <div className="font-bold text-sm">Mensal</div>
                                    <div className="text-[9px] uppercase tracking-widest mt-1">Série/Módulo</div>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Visibilidade</label>
                            <div className="space-y-2">
                                <button onClick={() => setPublishVisibility('public')} className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${publishVisibility === 'public' ? 'border-bible-gold bg-bible-gold/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}>
                                    <div className={`p-2 rounded-full ${publishVisibility === 'public' ? 'bg-bible-gold text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}><Sparkles size={16}/></div>
                                    <div>
                                        <div className={`font-bold ${publishVisibility === 'public' ? 'text-bible-gold' : 'text-gray-700 dark:text-gray-300'}`}>Público (Global)</div>
                                        <div className="text-[10px] text-gray-500">Disponível para toda a comunidade. Gera autoridade.</div>
                                    </div>
                                </button>
                                <button onClick={() => setPublishVisibility('private_invite')} className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${publishVisibility === 'private_invite' ? 'border-bible-gold bg-bible-gold/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}>
                                    <div className={`p-2 rounded-full ${publishVisibility === 'private_invite' ? 'bg-bible-gold text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}><Layout size={16}/></div>
                                    <div>
                                        <div className={`font-bold ${publishVisibility === 'private_invite' ? 'text-bible-gold' : 'text-gray-700 dark:text-gray-300'}`}>Apenas Convidados</div>
                                        <div className="text-[10px] text-gray-500">Apenas quem tiver o link ou for da sua igreja.</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex gap-3">
                        <button onClick={() => setShowPublishModal(false)} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
                        <button onClick={() => { setShowPublishModal(false); handleSave('published'); }} className="flex-1 py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] transition-transform">Confirmar Publicação</button>
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
            
            {/* LADO ESQUERDO: Painel de Controle (Inputs) */}
            <aside className="w-full lg:w-[380px] flex-shrink-0 space-y-6">
                
                {/* Switcher de Modo */}
                <div className="bg-white dark:bg-[#1a1a1a] p-1 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex">
                    <button 
                        onClick={() => setSidebarTab('manual')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${sidebarTab === 'manual' ? 'bg-bible-leather text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <PenTool size={14} /> Estrutura Manual
                    </button>
                    <button 
                        onClick={() => setSidebarTab('ai')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${sidebarTab === 'ai' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <Brain size={14} /> Assistente IA
                    </button>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target size={18} className="text-bible-gold" /> Dados Básicos
                    </h2>
                    
                    <div className="space-y-4 mb-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Referência Bíblica</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={mainVerse} 
                                    onChange={e => setMainVerse(e.target.value)} 
                                    placeholder="Ex: João 3:16" 
                                    className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-bible-gold font-bold text-sm" 
                                />
                                {isSearchingVerse && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 size={16} className="animate-spin text-bible-gold" /></div>}
                            </div>
                        </div>
                        {verseText && (
                            <div className="p-3 bg-bible-gold/5 border border-bible-gold/20 rounded-xl text-xs italic text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto custom-scrollbar">
                                <Quote size={12} className="text-bible-gold mb-1" />
                                {verseText}
                            </div>
                        )}
                    </div>

                    {/* MODO MANUAL */}
                    {sidebarTab === 'manual' && (
                        <div className="space-y-4 animate-in slide-in-from-left-4">
                            
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800">
                                <label className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest ml-1 block">Estrutura do Estudo</label>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">
                                    1. Introdução
                                </label>
                                <textarea 
                                    value={manualIntro}
                                    onChange={e => setManualIntro(e.target.value)}
                                    placeholder="Introduza o tema..."
                                    className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-bible-gold text-sm h-20 resize-none"
                                />
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">
                                    2. Contextualização
                                </label>
                                <textarea 
                                    value={manualContext}
                                    onChange={e => setManualContext(e.target.value)}
                                    placeholder="Contexto histórico, pontos, tópicos e temas..."
                                    className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-bible-gold text-sm h-32 resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">
                                    3. Aplicação
                                </label>
                                <textarea 
                                    value={manualApplication}
                                    onChange={e => setManualApplication(e.target.value)}
                                    placeholder="Como aplicar isso na vida prática..."
                                    className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-bible-gold text-sm h-24 resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">
                                    4. Oração (Opcional)
                                </label>
                                <textarea 
                                    value={manualPrayer}
                                    onChange={e => setManualPrayer(e.target.value)}
                                    placeholder="Uma oração final..."
                                    className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-bible-gold text-sm h-20 resize-none"
                                />
                            </div>

                            <button 
                                onClick={handleManualAssemble} 
                                className="w-full py-4 bg-bible-leather hover:bg-bible-gold text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all"
                            >
                                <Layers size={16} /> Montar Manuscrito
                            </button>
                        </div>
                    )}

                    {/* MODO IA */}
                    {sidebarTab === 'ai' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800">
                                <label className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest ml-1 mb-2 block">Tipo de Estudo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setStudyMode('quick')}
                                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 transition-all ${studyMode === 'quick' ? 'border-purple-500 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-sm' : 'border-transparent bg-transparent text-gray-400 hover:bg-white/50'}`}
                                    >
                                        <Zap size={18} />
                                        <span className="text-[10px] font-black uppercase">Rápido</span>
                                    </button>
                                    <button 
                                        onClick={() => setStudyMode('deep')}
                                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 transition-all ${studyMode === 'deep' ? 'border-purple-500 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-sm' : 'border-transparent bg-transparent text-gray-400 hover:bg-white/50'}`}
                                    >
                                        <GraduationCap size={18} />
                                        <span className="text-[10px] font-black uppercase">Profundo</span>
                                    </button>
                                </div>
                                <p className="text-[9px] text-center mt-2 text-purple-400">
                                    {studyMode === 'quick' ? '7 Perguntas Essenciais (Ex: Devocional/PG)' : '11 Seções Completas (Ex: Sermão/Aula)'}
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Tema Central (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={theme} 
                                    onChange={e => setTheme(e.target.value)} 
                                    placeholder="Ex: Amor, Perdão..." 
                                    className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-purple-500 text-sm" 
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Público-Alvo</label>
                                <input 
                                    type="text" 
                                    value={audience} 
                                    onChange={e => setAudience(e.target.value)} 
                                    placeholder="Ex: Jovens, Casais..." 
                                    className="w-full p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-purple-500 text-sm" 
                                />
                            </div>

                            <button 
                                onClick={handleAiFill} 
                                disabled={isGeneratingAI || !mainVerse}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                            >
                                {isGeneratingAI ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>} 
                                Gerar Automaticamente
                            </button>
                            
                            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                                O Obreiro IA irá criar uma estrutura completa baseada no versículo selecionado.
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 text-blue-800 dark:text-blue-200 text-xs leading-relaxed flex gap-3">
                    <Info size={24} className="shrink-0" />
                    <p>O <strong>Editor de Manuscrito</strong> à direita é livre. Use o painel ao lado para estruturar suas ideias ou peça ajuda à IA, depois refine o texto final como preferir.</p>
                </div>

            </aside>

            {/* LADO DIREITO: O EDITOR (Papel) */}
            <main className="flex-1 w-full min-w-0 flex flex-col items-center">
                
                {/* Título do Documento */}
                <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Título do seu Estudo..." 
                    className="w-full max-w-[210mm] px-2 text-center text-2xl md:text-3xl font-serif font-bold bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-700 text-gray-800 dark:text-white mb-6"
                />

                {/* Editor Padronizado */}
                <div className="w-full max-w-[210mm] min-h-[70vh] md:min-h-[297mm] shadow-2xl rounded-sm relative flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
                    <RichTextEditor
                        content={editorContent}
                        onChange={setEditorContent}
                        placeholder="Comece a escrever..."
                        className="flex-1"
                    />
                    
                    {/* Marca d'água discreta */}
                    <div className="absolute bottom-4 right-8 opacity-10 pointer-events-none select-none flex items-center gap-2">
                        <LayoutTemplate size={20} /> BíbliaLM Editor
                    </div>
                </div>

                <p className="mt-6 text-gray-400 text-xs text-center">
                    Dica: Use a estrutura sugerida para criar estudos profundos e organizados.
                </p>

            </main>
        </div>
    </div>
  );
};

export default CreateStudyPage;
