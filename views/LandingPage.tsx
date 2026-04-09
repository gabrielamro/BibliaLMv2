"use client";
import { useNavigate } from '../utils/router';


import React, { useState, useEffect, useRef } from 'react';

import { 
  Search, BookOpen, Mic2, Image as ImageIcon, 
  Crown, Sparkles, Heart, Trophy, LogIn, 
  PenTool, CheckCircle2, Layout, 
  MessageCircle, Wand2, Palette, Users, Loader2, Brain, XCircle, RefreshCw, Settings, Rocket, ArrowRight
} from 'lucide-react';
import SEO from '../components/SEO';
import { LogoIcon } from '../components/LogoIcon';
import { bibleService } from '../services/bibleService';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { LandingPageConfig } from '../types';
import LoginModal from '../components/LoginModal';
import SupportModal from '../components/SupportModal';
import { useSettings } from '../contexts/SettingsContext';

// --- LIVE UI MOCKUPS (INTERATIVOS) ---

const ReaderUiPreview = () => (
  <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative h-[450px] w-full max-w-sm mx-auto animate-in slide-in-from-bottom-8 duration-1000">
    {/* Header */}
    <div className="bg-white dark:bg-[#1a1a1a] p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center z-10 relative">
       <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-gray-900 dark:text-white">Salmos 23</span>
          <span className="text-xs text-gray-400">ARC</span>
       </div>
       <div className="flex gap-2">
          <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800"><Mic2 size={14} className="text-gray-400"/></div>
       </div>
    </div>
    
    {/* Content */}
    <div className="p-6 space-y-4 relative">
       <div className="absolute top-0 right-0 p-20 bg-bible-gold/5 blur-3xl rounded-full"></div>
       <p className="font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-300 relative z-10">
         <sup className="text-[10px] text-gray-400 mr-1 font-sans">1</sup>
         O Senhor é o meu pastor, nada me faltará.
       </p>
       <div className="relative group cursor-pointer">
         <p className="font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg -mx-2 border-l-4 border-bible-gold transition-all">
           <sup className="text-[10px] text-gray-400 mr-1 font-sans">2</sup>
           Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.
         </p>
         
         {/* Popover Inteligente */}
         <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-purple-100 dark:border-purple-900/30 z-20 animate-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2">
               <Sparkles size={12} className="text-purple-600"/> 
               <span className="text-[10px] font-black uppercase text-purple-600 tracking-widest">Insight IA</span>
            </div>
            <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">
               "Águas tranquilas" (Menuhot) refere-se a águas de descanso, onde as ovelhas podem beber sem medo da correnteza.
            </p>
         </div>
       </div>
       <p className="font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-300 opacity-50">
         <sup className="text-[10px] text-gray-400 mr-1 font-sans">3</sup>
         Refrigera a minha alma; guia-me pelas veredas da justiça...
       </p>
    </div>
  </div>
);

const StudioUiPreview = () => {
  const [mode, setMode] = useState<'text' | 'image'>('image');
  
  return (
    <div className="relative w-full h-64 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl group cursor-pointer">
      {/* Layer Imagem */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${mode === 'image' ? 'opacity-100' : 'opacity-0'}`}
      >
        <img 
            src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=600" 
            className="w-full h-full object-cover opacity-60" 
            alt="Leão"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <p className="font-serif text-2xl text-white font-bold mb-2 drop-shadow-lg">"Sê forte e corajoso"</p>
            <span className="text-[10px] font-black text-bible-gold uppercase tracking-[0.3em]">Josué 1:9</span>
        </div>
      </div>

      {/* Layer Texto (Editor) */}
      <div 
        className={`absolute inset-0 bg-white dark:bg-gray-800 p-6 flex flex-col justify-center items-center transition-opacity duration-1000 ${mode === 'text' ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="w-full space-y-3">
             <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-1/3 mx-auto mb-4"></div>
             <p className="font-serif text-xl text-gray-400 text-center">Josué 1:9</p>
             <div className="flex justify-center gap-2 mt-4">
                 <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Palette size={14}/></div>
                 <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center"><ImageIcon size={14}/></div>
             </div>
             <button className="mt-4 bg-bible-gold text-white px-4 py-2 rounded-lg text-xs font-bold w-full">Gerar Arte</button>
        </div>
      </div>
      
      {/* Floating Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="flex gap-2">
             <div className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white"><ImageIcon size={14}/></div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setMode(prev => prev === 'image' ? 'text' : 'image'); }}
            className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-white/30 transition-colors"
          >
             {mode === 'image' ? 'Ver Editor' : 'Ver Resultado'} <RefreshCw size={10} className="inline ml-1"/>
          </button>
      </div>
    </div>
  );
};

const PastoralUiPreview = () => {
    const [typedText, setTypedText] = useState('');
    const fullText = "A graça irresistível é o conceito teológico de que a graça salvadora de Deus é efetivamente aplicada àqueles a quem Ele determinou salvar...";
    
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setTypedText(fullText.substring(0, i));
            i++;
            if (i > fullText.length) {
                // Pause at end then restart
                if (i > fullText.length + 50) i = 0;
            }
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm flex h-64 relative">
         {/* Sidebar Mockup */}
         <div className="w-16 bg-gray-50 dark:bg-black/20 border-r border-gray-100 dark:border-gray-800 flex flex-col items-center py-4 gap-4">
            <div className="w-8 h-8 rounded-lg bg-bible-leather text-white flex items-center justify-center"><PenTool size={16}/></div>
            <div className="w-8 h-8 rounded-lg text-gray-400 flex items-center justify-center"><BookOpen size={16}/></div>
            <div className="w-8 h-8 rounded-lg text-gray-400 flex items-center justify-center"><Users size={16}/></div>
         </div>
         {/* Editor Mockup */}
         <div className="flex-1 p-6 relative overflow-hidden">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
            <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2">Sermão: Graça</h3>
            
            <div className="text-xs text-gray-500 font-mono leading-relaxed">
                {typedText}
                <span className="inline-block w-1.5 h-3 bg-bible-gold animate-pulse ml-0.5"></span>
            </div>
            
            {/* AI Assistant Overlay */}
            <div className="absolute bottom-4 right-4 bg-purple-600 text-white p-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce-slow cursor-pointer">
               <Sparkles size={16} />
               <div className="text-left">
                  <p className="text-[10px] font-bold uppercase opacity-80">Obreiro IA</p>
                  <p className="text-xs font-bold">Escrevendo...</p>
               </div>
            </div>
         </div>
      </div>
    );
};

const QuizUiPreview = () => {
    const [selected, setSelected] = useState<number | null>(null);
    const correct = 0; // Index A

    const handleSelect = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelected(idx);
        setTimeout(() => setSelected(null), 2500); // Reset after 2.5s
    };

    return (
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-6 text-white h-64 flex flex-col justify-between relative overflow-hidden shadow-lg group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700"><Trophy size={100} /></div>
          
          <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Ranked</span>
              <div className="flex gap-1">
                 {[1,2,3].map(i => <Heart key={i} size={12} className="fill-red-400 text-red-400" />)}
              </div>
          </div>
          
          <div className="relative z-10">
              <p className="font-bold text-lg mb-4">Quem foi o sucessor do profeta Elias?</p>
              <div className="space-y-2">
                  {[
                      { idx: 0, text: 'A. Eliseu' },
                      { idx: 1, text: 'B. Geazi' }
                  ].map((opt) => {
                      let bgClass = 'bg-white/10 hover:bg-white/20 border-white/20';
                      let icon = null;
                      
                      if (selected !== null) {
                          if (opt.idx === correct) {
                              bgClass = 'bg-green-500 border-green-400 text-white';
                              icon = <CheckCircle2 size={14} />;
                          } else if (opt.idx === selected) {
                              bgClass = 'bg-red-500 border-red-400 text-white';
                              icon = <XCircle size={14} />;
                          } else {
                              bgClass = 'bg-white/5 opacity-50';
                          }
                      }

                      return (
                          <div 
                            key={opt.idx}
                            onClick={(e) => handleSelect(opt.idx, e)}
                            className={`p-2 rounded-lg text-xs font-bold flex justify-between items-center border cursor-pointer transition-all ${bgClass}`}
                          >
                              <span>{opt.text}</span>
                              {icon}
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    );
};


const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { openLogin, currentUser, closeLogin, isLoginModalOpen } = useAuth();
  const { toggleTheme, settings } = useSettings();
  
  // Search State
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  
  // Content State (CMS)
  const [config, setConfig] = useState<LandingPageConfig>({
      heroTitle: 'Sua leitura, profundamente expandida.',
      heroSubtitle: 'Do devocional diário à preparação do sermão de domingo. Tudo integrado em um só lugar com Inteligência Artificial.',
      heroButtonText: 'Entrar',
      featureSectionTitle: 'Ecossistema Completo',
      featureSectionDesc: 'Ferramentas que antes exigiam 5 apps diferentes, agora unificadas.',
      ctaTitle: 'Comece sua jornada hoje.',
      ctaDesc: 'Crie sua conta gratuita e tenha acesso ao Pão Diário, Leitura Inteligente e Comunidade.',
      ctaButtonText: 'Criar Conta Grátis'
  });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const loadConfig = async () => {
          const remote = await dbService.getLandingPageConfig();
          if (remote) {
              setConfig(prev => ({ ...prev, ...remote }));
          }
      };
      loadConfig();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError('');

    try {
        const verseData = await bibleService.getTextByReference(query);
        
        if (verseData) {
            navigate('/biblia', { 
              state: { 
                bookId: verseData.meta?.bookId || 'gn', 
                chapter: verseData.meta?.chapter || 1,
                highlightVerses: verseData.meta?.verses
              } 
            });
        } else {
            setError("Referência não encontrada. Tente 'Salmos 23' ou 'João 3:16'.");
        }
    } catch (err) {
        setError("Erro ao buscar. Tente novamente.");
    } finally {
        setIsSearching(false);
    }
  };

  const handleSmartAction = (path: string) => {
      if (!currentUser) {
          openLogin(); 
      } else {
          navigate(path);
      }
  };

  return (
    <div className="h-screen w-full bg-[#fcfbf9] dark:bg-black text-bible-ink font-sans overflow-y-auto scroll-smooth selection:bg-bible-gold selection:text-white transition-colors duration-300">
      <SEO title="BíbliaLM - Inteligência Bíblica" description="Uma plataforma completa para estudo, criação e gestão pastoral com Inteligência Artificial." />

      {/* BUTTON TO V2 (BETA) */}
      <button 
        onClick={() => navigate('/intro-v2')} 
        className="fixed bottom-6 right-6 z-[120] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 border border-white/20 animate-bounce-slow"
      >
         <Rocket size={16} /> Ver Início V2 (Beta)
      </button>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[100] py-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
                <LogoIcon className="w-8 h-8 text-bible-gold" />
                <span className="font-serif font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                    Bíblia<span className="text-bible-gold">LM</span>
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/biblia')} className="hidden md:block text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-bible-gold uppercase tracking-widest">
                    Ler Bíblia
                </button>
                {!currentUser ? (
                    <button 
                        data-testid="landing-login-btn"
                        onClick={() => openLogin()} 
                        className="bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-bible-gold dark:hover:bg-gray-200 transition-all shadow-lg flex items-center gap-2"
                    >
                        <LogIn size={14} /> <span className="hidden md:inline">{config.heroButtonText || 'Entrar'}</span>
                    </button>
                ) : (
                    <button 
                        onClick={() => navigate('/')} 
                        className="bg-bible-gold text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg"
                    >
                        Abrir App
                    </button>
                )}
                
                {/* MENU / CONFIGURAÇÕES (Para deslogados acessarem tema, suporte, etc) */}
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-bible-gold transition-colors">
                        <Settings size={20} />
                    </button>
                    
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right z-50">
                             <button onClick={() => { toggleTheme(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800">
                                 {settings.theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                             </button>
                             <button onClick={() => { setIsSupportOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                                 Suporte / Doar
                             </button>
                             {!currentUser && (
                                 <button onClick={() => { openLogin(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-bible-gold hover:bg-gray-50 dark:hover:bg-gray-800">
                                     Fazer Login
                                 </button>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             
             {/* Left: Value Prop & Search */}
             <div className="z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-bible-gold/10 text-bible-gold rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-bible-gold/20 animate-in fade-in slide-in-from-bottom-4">
                     <Crown size={12} fill="currentColor" /> Plataforma Cristã All-in-One
                 </div>
                 
                 <h1 className="text-5xl md:text-7xl font-serif font-black text-gray-900 dark:text-white leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 delay-100">
                    <span dangerouslySetInnerHTML={{ __html: config.heroTitle.replace(/\n/g, '<br/>') }} />
                 </h1>
                 
                 <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-8 delay-200">
                     {config.heroSubtitle}
                 </p>

                 {/* SEARCH BAR (Functional & Prominent) */}
                 <div className="w-full max-w-lg relative z-30 animate-in fade-in zoom-in delay-300 group">
                    
                    {/* Visual Callout / Hook */}
                    <div className="flex justify-center lg:justify-start mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                         <span className="bg-bible-gold text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                             ✨ Experimente a Inteligência
                         </span>
                    </div>

                    {/* Glow Effect Background */}
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-bible-gold via-yellow-500 to-orange-400 rounded-[1.2rem] blur-md opacity-40 group-hover:opacity-80 transition duration-500"></div>
                    
                    <form 
                        onSubmit={handleSearch} 
                        className="relative flex items-center bg-white dark:bg-[#1a1a1a] rounded-2xl p-2 shadow-[0_15px_40px_rgba(197,160,89,0.25)] border border-bible-gold/30 transition-all focus-within:ring-4 focus-within:ring-bible-gold/20"
                    >
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Digite um versículo (ex: Salmos 23)..." 
                            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white text-xl p-4 font-serif placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                            autoComplete="off"
                        />
                        <button 
                            type="submit"
                            disabled={isSearching || !query}
                            className="bg-bible-gold hover:bg-yellow-600 text-white p-4 rounded-xl transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center min-w-[3.5rem]"
                        >
                            {isSearching ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
                        </button>
                    </form>
                 </div>
                 {error && <p className="mt-4 text-red-500 text-sm font-bold flex items-center gap-2"><CheckCircle2 size={14} className="rotate-45"/> {error}</p>}
             </div>

             {/* Right: Live UI Composition */}
             <div className="relative flex justify-center lg:justify-end z-10 h-[550px] lg:h-[600px] w-full">
                 <div className="absolute top-10 right-0 w-[90%] h-full opacity-40 scale-90 blur-[1px] -z-10 origin-bottom-right hidden lg:block">
                     <PastoralUiPreview />
                 </div>
                 <div className="relative z-20 transform hover:-translate-y-2 transition-transform duration-500">
                     <ReaderUiPreview />
                     <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-left-4 delay-700">
                         <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-xl"><Brain size={20}/></div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Tecnologia</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-white">Gemini Pro 1.5</p>
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* 2. FEATURE SHOWCASE (Grid Bento) */}
      <section className="py-24 px-6 bg-white dark:bg-[#121212]">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">{config.featureSectionTitle}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{config.featureSectionDesc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
                  
                  {/* Card: Estúdio Criativo (Large Vertical) */}
                  <div 
                    onClick={() => handleSmartAction('/?tab=criar')}
                    className="md:col-span-1 md:row-span-2 bg-gray-900 rounded-[2.5rem] p-6 text-white flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-xl relative overflow-hidden"
                  >
                      <div className="relative z-10">
                          <div className="p-3 bg-white/10 w-fit rounded-xl mb-4 backdrop-blur-md"><Wand2 size={24}/></div>
                          <h3 className="text-2xl font-bold mb-2">Estúdio Criativo</h3>
                          <p className="text-gray-400 text-sm">Transforme versículos em artes visuais e podcasts com um clique.</p>
                      </div>
                      <div className="mt-6 flex-1 relative rounded-2xl overflow-hidden border border-white/10">
                          <StudioUiPreview />
                      </div>
                      <button className="mt-4 w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-bible-gold hover:text-white transition-colors">
                          Criar Agora
                      </button>
                  </div>

                  {/* Card: Workspace Pastoral (Wide) */}
                  <div 
                    onClick={() => handleSmartAction('/workspace-pastoral')}
                    className="md:col-span-2 md:row-span-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-8 cursor-pointer hover:shadow-lg transition-all flex flex-col md:flex-row gap-6 overflow-hidden"
                  >
                      <div className="flex-1 space-y-4">
                          <div className="p-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black w-fit rounded-xl"><Layout size={24}/></div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Workspace Pastoral</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                             Editor de sermões assistido por IA, gestão de membros e criação de jornadas de estudo para sua igreja.
                          </p>
                          <div className="flex gap-2">
                             <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300">Esboços Homiléticos</span>
                             <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300">Exegese</span>
                          </div>
                      </div>
                      <div className="w-full md:w-1/2 relative">
                           <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                               <PastoralUiPreview />
                           </div>
                      </div>
                  </div>

                  {/* Card: Gamificação (Small) */}
                  <div 
                    onClick={() => handleSmartAction('/quiz')}
                    className="md:col-span-1 md:row-span-1 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800 rounded-[2.5rem] p-6 cursor-pointer hover:shadow-md transition-all flex flex-col"
                  >
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-xl"><Trophy size={24}/></div>
                          <span className="text-[10px] font-black uppercase bg-white dark:bg-black/40 px-2 py-1 rounded-full text-indigo-400">Ranked</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Desafio da Sabedoria</h3>
                      <div className="mt-auto">
                          <QuizUiPreview />
                      </div>
                  </div>

                  {/* Card: Chat IA (Small) */}
                  <div 
                    onClick={() => handleSmartAction('/chat')}
                    className="md:col-span-1 md:row-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-6 cursor-pointer hover:border-bible-gold transition-all flex flex-col justify-center text-center items-center group"
                  >
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <MessageCircle size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Conselheiro IA</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Tire dúvidas teológicas complexas como se conversasse com um pastor.</p>
                  </div>

              </div>
          </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6 bg-bible-leather dark:bg-black text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
              <Crown size={64} className="text-bible-gold mx-auto mb-8 animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-serif font-black mb-6">{config.ctaTitle}</h2>
              <p className="text-gray-300 mb-10 text-lg">
                  {config.ctaDesc}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => openLogin()} className="bg-bible-gold text-bible-leather px-10 py-4 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl hover:shadow-bible-gold/20">
                      {config.ctaButtonText}
                  </button>
                  <button onClick={() => navigate('/biblia')} className="bg-transparent border border-white/20 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                      Apenas Ler
                  </button>
              </div>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-black py-12 text-center text-gray-600 text-xs">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
              <LogoIcon className="w-6 h-6" />
              <span className="font-serif font-bold">BíbliaLM</span>
          </div>
          <p className="mb-4">"Porque dele, e por ele, e para ele são todas as coisas."</p>
          <div className="flex justify-center gap-6 uppercase font-bold tracking-widest">
              <button onClick={() => navigate('/termos')} className="hover:text-white">Termos</button>
              <button onClick={() => navigate('/privacidade')} className="hover:text-white">Privacidade</button>
          </div>
      </footer>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
};

export default LandingPage;
