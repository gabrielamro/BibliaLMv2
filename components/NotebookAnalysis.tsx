"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Loader2, Mic, Save, Headphones, 
  Share2, Globe, Edit3, Trash2, Zap, Quote, 
  MessageSquareHeart, ArrowRight, X, Crown, Settings2, Check,
  PenLine, Play, PlusCircle, FileText, ArrowLeft
} from 'lucide-react';

import Link from "next/link";
import { analyzeUnderstanding } from '../services/geminiService';
import { SavedStudy } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { PodcastPlayer } from './reader/PodcastPlayer';
import usePodcastGenerator from '../hooks/usePodcastGenerator';
import ConfirmationModal from './ConfirmationModal';
import SEO from './SEO';
import { BIBLE_BOOKS_LIST } from '../constants';
import { bibleService } from '../services/bibleService';
import { searchMatch } from '../utils/textUtils';
import SmartText from './reader/SmartText';

const NotebookAnalysis: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, checkFeatureAccess, incrementUsage, earnMana, openLogin, openSubscription, showNotification } = useAuth();
  
  const state = location.state as any;
  
  const [bibleText, setBibleText] = useState(state?.sourceText || state?.text || '');
  const [userInterpretation, setUserInterpretation] = useState(state?.userThoughts || '');
  const [analysisResult, setAnalysisResult] = useState<string | null>(state?.analysis || state?.analysisResult || null);
  const [studyId, setStudyId] = useState<string | null>(state?.id || null);
  const [studyOwnerId, setStudyOwnerId] = useState<string | null>(state?.userId || null); 
  
  const [refInput, setRefInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(!state?.analysis && !state?.analysisResult); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(state?.isPublic || false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { 
    isPlayerOpen, isGenerating: isGeneratingPodcast, isPlaying: isPodcastPlaying, 
    podcastData, generationPhase, playerState, generatePodcast, stopAndClosePodcast, 
    togglePlayPause: togglePodcastPlayPause, seek: seekPodcast, skip: skipPodcast, 
    setPlaybackRate: setPodcastPlaybackRate, savePodcast: savePodcastInternal 
  } = usePodcastGenerator();

  useEffect(() => {
      if (!studyId && currentUser) {
          setStudyOwnerId(currentUser.uid);
      } else if (state?.userId) {
          setStudyOwnerId(state.userId);
      }
  }, [studyId, currentUser, state]);

  const isOwner = currentUser && studyOwnerId === currentUser.uid;

  useEffect(() => {
      if (state?.bookId && state?.chapter) {
          const book = BIBLE_BOOKS_LIST.find(b => b.id === state.bookId);
          if (book) setRefInput(`${book.name} ${state.chapter}`);
      }
  }, [state]);

  const handleGeneratePodcastClick = () => {
    const title = bibleText.split('\n')[0].substring(0, 30) || 'Estudo Bíblico';
    generatePodcast(title, analysisResult || bibleText, state?.audioScript || podcastData?.script || undefined);
  };

  const handleImportContent = async (mode: 'chapter' | 'verse') => {
      let inputToUse = refInput.trim();
      
      if (!inputToUse && state?.bookId && state?.chapter) {
          const book = BIBLE_BOOKS_LIST.find(b => b.id === state.bookId);
          if (book) inputToUse = `${book.name} ${state.chapter}`;
      }

      if (!inputToUse) {
          showNotification("Digite uma referência (ex: João 3).", "info");
          return;
      }
      
      setIsImporting(true);
      try {
          if (mode === 'chapter') {
              const match = inputToUse.match(/^([1-3]?\s?[a-zà-ú\ç\ã\õ\s]+)\s+(\d+)$/i) || inputToUse.match(/^([1-3]?\s?[a-zà-ú\ç\ã\õ\s]+)\s+(\d+)[:\.]/i);
              
              if (match) {
                  const bookName = match[1].trim();
                  const chapterNum = parseInt(match[2]);
                  const book = BIBLE_BOOKS_LIST.find(b => searchMatch(bookName, b.name, b.id));

                  if (book) {
                      const data = await bibleService.getChapter(book.id, chapterNum);
                      if (data) {
                          const header = `📖 LEITURA: ${book.name} ${chapterNum}\n\n`;
                          const body = data.verses.map(v => `[${v.number}] ${v.text}`).join(' ');
                          setBibleText(header + body);
                          showNotification("Capítulo importado com sucesso!", "success");
                          setRefInput(''); 
                      } else {
                          showNotification("Capítulo não encontrado.", "error");
                      }
                  } else {
                      showNotification("Livro não encontrado.", "error");
                  }
              } else {
                  if (!isNaN(parseInt(inputToUse)) && state?.bookId) {
                       const data = await bibleService.getChapter(state.bookId, parseInt(inputToUse));
                       if (data) {
                           const book = BIBLE_BOOKS_LIST.find(b => b.id === state.bookId);
                           const header = `📖 LEITURA: ${book?.name} ${inputToUse}\n\n`;
                           const body = data.verses.map(v => `[${v.number}] ${v.text}`).join(' ');
                           setBibleText(header + body);
                           showNotification("Capítulo importado!", "success");
                       }
                  } else {
                      showNotification("Formato inválido. Use 'Livro Capítulo' (ex: Salmos 23)", "error");
                  }
              }
          } 
          else {
              const result = await bibleService.getVerseText(inputToUse);
              if (result) {
                  const newText = `${result.formattedRef}\n"${result.text}"`;
                  setBibleText((prev: string) => prev ? prev + '\n\n' + newText : newText);
                  showNotification("Versículo adicionado!", "success");
                  setRefInput('');
              } else {
                  showNotification("Versículo não encontrado. Tente 'Livro Cap:Ver'.", "error");
              }
          }
      } catch (e) {
          console.error(e);
          showNotification("Erro ao buscar conteúdo.", "error");
      } finally {
          setIsImporting(false);
      }
  };

  const handleAnalyzeAndRender = async () => {
      if (!bibleText.trim()) return;
      
      if (currentUser) {
          const canAccess = checkFeatureAccess('aiDeepAnalysis');
          if (!canAccess) { openSubscription(); return; }
      }

      setIsAnalyzing(true);
      try {
          const result = await analyzeUnderstanding(userInterpretation, bibleText);
          if (result && result !== "Erro na análise.") {
              if (currentUser) {
                  await incrementUsage('analysis');
              }
              setAnalysisResult(result);
              setIsEditModalOpen(false); 
              
              if (studyId && currentUser && isOwner) {
                  await dbService.update(currentUser.uid, 'studies', studyId, {
                      sourceText: bibleText,
                      userThoughts: userInterpretation,
                      analysis: result
                  });
                  showNotification("Landing Page atualizada!", "success");
              }
          } else {
              showNotification("Erro ao conectar com a IA.", "error");
          }
      } catch(e) {
          console.error(e);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleSaveStudy = async () => {
    if (!currentUser) { 
        openLogin(); 
        return; 
    }
    if (!analysisResult) return;

    setIsSaving(true);
    try {
      const studyData = {
        title: bibleText.split('\n')[0].substring(0, 40) || 'Estudo Bíblico', 
        sourceText: bibleText, 
        userThoughts: userInterpretation, 
        analysis: analysisResult, 
        audioScript: state?.audioScript || podcastData?.script || undefined, 
        source: state?.source || 'geral',
        isPublic: isPublic
      };

      if (studyId && isOwner) {
          await dbService.update(currentUser.uid, 'studies', studyId, studyData);
          showNotification("Página salva!", "success");
      } else {
          const docRef = await dbService.add(currentUser.uid, 'studies', studyData);
          setStudyId(docRef.id);
          setStudyOwnerId(currentUser.uid); 
          await earnMana('deep_study'); 
          showNotification("Estudo salvo na sua biblioteca!", "success");
      }
    } catch (error) { 
        console.error(error);
        showNotification("Erro ao salvar.", "error");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
      if (!studyId || !currentUser || !isOwner) return;
      try {
          await dbService.delete(currentUser.uid, 'studies', studyId);
          showNotification("Estudo excluído.", "info");
          navigate('/estudos/planos');
      } catch (e) {
          showNotification("Erro ao excluir.", "error");
      }
  };

  const handlePublish = async () => {
      if (!studyId || !currentUser || !userProfile || !isOwner) return;
      setIsPublishing(true);
      try {
          await dbService.publishStudy(currentUser.uid, studyId, userProfile, {
              id: studyId,
              title: bibleText.split('\n')[0].substring(0, 40) || 'Estudo Bíblico', 
              sourceText: bibleText, 
              analysis: analysisResult || '',
              userThoughts: userInterpretation,
              source: 'geral',
              createdAt: new Date().toISOString()
          });
          setIsPublic(true);
          showNotification("Estudo publicado no Reino!", "success");
      } catch (e) {
          showNotification("Erro ao publicar.", "error");
      } finally {
          setIsPublishing(false);
      }
  };

  const handleShareLink = () => {
      if (!studyId) return;
      const url = `${window.location.origin}/#/v/${studyId}`;
      if (navigator.share) {
          navigator.share({ title: 'Meu Estudo Bíblico', url });
      } else {
          navigator.clipboard.writeText(url);
          showNotification("Link copiado!", "success");
      }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
        <SEO title="NotebookLM Bíblico" />
        <div className="max-w-6xl mx-auto pb-32">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-bible-gold transition-colors font-bold text-xs uppercase tracking-widest">
                    <ArrowLeft size={18} /> Voltar
                </button>
                
                {studyId && (
                    <div className="flex gap-2">
                        {isPublic ? (
                            <button onClick={handleShareLink} className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-bold hover:bg-green-200 transition-colors">
                                <Globe size={16} /> Link Público
                            </button>
                        ) : isOwner && (
                            <button onClick={handlePublish} disabled={isPublishing} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} Publicar
                            </button>
                        )}
                        
                        {isOwner && (
                            <button onClick={() => setShowDeleteModal(true)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {(isEditModalOpen || isOwner) && (
                    <div className="lg:col-span-1 space-y-6">
                        
                        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <BookOpen size={18} className="text-bible-gold" /> Fontes de Estudo
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={refInput}
                                        onChange={(e) => setRefInput(e.target.value)}
                                        placeholder="Ex: Romanos 8"
                                        className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-bible-gold/30"
                                        onKeyDown={(e) => e.key === 'Enter' && handleImportContent('chapter')}
                                    />
                                    <button 
                                        onClick={() => handleImportContent('chapter')}
                                        disabled={isImporting || !refInput.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-bible-gold transition-colors disabled:opacity-50"
                                    >
                                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                                    </button>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button onClick={() => handleImportContent('chapter')} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Capítulo</button>
                                    <button onClick={() => handleImportContent('verse')} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Versículo</button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[400px]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <FileText size={18} className="text-blue-500" /> Texto Base
                                </h3>
                                <button onClick={() => setBibleText('')} className="text-xs text-gray-400 hover:text-red-500">Limpar</button>
                            </div>
                            <textarea 
                                value={bibleText}
                                onChange={(e) => setBibleText(e.target.value)}
                                className="flex-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm leading-relaxed resize-none outline-none focus:ring-2 ring-bible-gold/30 font-serif"
                                placeholder="O texto bíblico ou suas anotações aparecerão aqui..."
                            />
                        </div>

                        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <MessageSquareHeart size={18} className="text-pink-500" /> Minha Interpretação
                            </h3>
                            <textarea 
                                value={userInterpretation}
                                onChange={(e) => setUserInterpretation(e.target.value)}
                                className="w-full h-32 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm resize-none outline-none focus:ring-2 ring-bible-gold/30"
                                placeholder="O que você entendeu? (Opcional, ajuda a IA a personalizar)"
                            />
                        </div>

                        <button 
                            onClick={handleAnalyzeAndRender}
                            disabled={isAnalyzing || !bibleText.trim()}
                            className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} fill="currentColor" />}
                            {analysisResult ? 'Regerar Análise' : 'Gerar Notebook'}
                        </button>
                    </div>
                )}

                <div className={isEditModalOpen || isOwner ? "lg:col-span-2" : "lg:col-span-3"}>
                    {analysisResult ? (
                        <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 min-h-[800px] flex flex-col relative animate-in fade-in slide-in-from-bottom-8 duration-700">
                            
                            {isOwner && (
                                <div className="absolute top-6 right-6 flex gap-2 z-10">
                                    <button onClick={() => setIsEditModalOpen(!isEditModalOpen)} className={`p-2 backdrop-blur-md rounded-full shadow-sm transition-colors ${isEditModalOpen ? 'bg-bible-gold text-white' : 'bg-white/80 dark:bg-black/50 text-gray-500 hover:text-bible-gold'}`}>
                                        <Edit3 size={18} />
                                    </button>
                                    <button onClick={handleSaveStudy} disabled={isSaving} className="p-2 bg-bible-gold text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    </button>
                                </div>
                            )}

                            <div className="bg-bible-leather dark:bg-black text-white p-12 text-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
                                        <Sparkles size={12} /> NotebookLM Analysis
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4 leading-tight">
                                        <SmartText text={bibleText.split('\n')[0].substring(0, 50) + '...'} enabled={true} />
                                    </h1>
                                    <div className="flex justify-center gap-4 mt-6">
                                        <button onClick={handleGeneratePodcastClick} className="bg-white text-black px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center gap-2">
                                            <Headphones size={16} /> Ouvir Podcast
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:p-12 space-y-8 flex-1">
                                {isEditModalOpen && isOwner ? (
                                    <textarea 
                                        value={analysisResult} 
                                        onChange={(e) => setAnalysisResult(e.target.value)} 
                                        className="w-full h-[600px] p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-serif text-lg leading-relaxed resize-none"
                                    />
                                ) : (
                                    <div 
                                        className="prose dark:prose-invert prose-lg max-w-none font-serif text-gray-700 dark:text-gray-300 leading-loose"
                                        dangerouslySetInnerHTML={{ __html: analysisResult }}
                                    />
                                )}
                            </div>

                            <div className="bg-gray-50 dark:bg-black/40 p-6 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800">
                                Gerado por BíbliaLM • {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] bg-gray-50 dark:bg-bible-darkPaper/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <Zap size={40} className="text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500 mb-2">Seu Notebook está vazio</h3>
                            <p className="text-gray-400 max-w-md">
                                Adicione um texto bíblico ao lado e clique em "Gerar Notebook" para receber uma análise teológica profunda, devocional e podcast automático.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>

        <PodcastPlayer 
            isOpen={isPlayerOpen} 
            isGenerating={isGeneratingPodcast} 
            isPlaying={isPodcastPlaying} 
            data={podcastData} 
            generationPhase={generationPhase} 
            playerState={playerState} 
            onClose={stopAndClosePodcast} 
            onTogglePlay={togglePodcastPlayPause} 
            onSeek={seekPodcast} 
            onSkip={skipPodcast} 
            onSetPlaybackRate={setPodcastPlaybackRate} 
            onSave={savePodcastInternal} 
        />

        <ConfirmationModal 
            isOpen={showDeleteModal} 
            onClose={() => setShowDeleteModal(false)} 
            onConfirm={handleDelete} 
            title="Excluir Estudo" 
            message="Tem certeza que deseja apagar este notebook? Esta ação não pode ser desfeita." 
            confirmText="Sim, Excluir" 
            variant="danger" 
        />
    </div>
  );
};

export default NotebookAnalysis;
