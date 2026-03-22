"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '../utils/router';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { 
  BookOpen, ChevronRight, Share2, Bookmark, Flame, Zap, 
  Search, Bell, Settings, Home, Wand2, User, Play, Pause, 
  Plus, FileText, Image, Mic, History, Trophy, Crown, Target, Heart, ArrowRight, Sun, Moon,
  Users, MessageSquare, Calendar, Sparkles, CreditCard, HelpCircle, Book, Layout,
  LifeBuoy, Scroll, ShieldCheck, Terminal, ShieldAlert, LogOut, UserCircle
} from 'lucide-react';

import { useSettings } from '../contexts/SettingsContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { dbService } from '../services/supabase';
import * as pastorAgent from '../services/pastorAgent';
import { bibleService } from '../services/bibleService';

const SanctuaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, notifications, unreadNotificationsCount, markNotificationsAsRead, openLogin, signOut } = useAuth();
  const { resetHeader, setIsHeaderHidden } = useHeader();
  const { settings, toggleTheme } = useSettings();
  const { plans } = useWorkspace();
  
  const [activeTab, setActiveTab] = useState<'inicio' | 'criar' | 'reino'>('inicio');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [dailyDevotional, setDailyDevotional] = useState<any>(null);
  const [loadingDevotional, setLoadingDevotional] = useState(true);
  const settingsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const userName = userProfile?.displayName || 'Visitante';
  const userAvatar = userProfile?.photoURL || currentUser?.user_metadata?.avatar_url || null;
  const userMana = userProfile?.lifetimeXp || 0;
  const userStreak = userProfile?.stats?.daysStreak || 1;
  const chaptersRead = userProfile?.stats?.totalChaptersRead || 0;
  const isAdmin = userProfile?.username === 'gabrielamaro' || currentUser?.email === 'gabrielamaro@live.com';
  const isLightTheme = settings.theme === 'light';
  const dailyReference = dailyDevotional?.reference || dailyDevotional?.verseReference || '';
  
  const readGoal = 365;
  const readPercent = Math.min(100, Math.round((chaptersRead / readGoal) * 100)) || 0;

  const openVerseOfDay = () => {
    const parsed = dailyReference ? bibleService.parseReference(dailyReference) : null;
    if (parsed) {
      navigate('/biblia', {
        state: {
          bookId: parsed.bookId,
          chapter: parsed.chapter,
          scrollToVerse: parsed.startVerse
        }
      });
      return;
    }
    navigate('/biblia');
  };

  useEffect(() => {
    setIsHeaderHidden(true);
    
    const loadData = async () => {
      try {
        setLoadingDevotional(true);
        let devotional = await dbService.getDailyDevotional();
        
        // Se não houver devocional hoje no banco, gera via IA e salva
        // para que os próximos usuários do dia não precisem gerar de novo.
        if (!devotional) {
          console.log('[Inicio03] Nenhum devocional para hoje. Gerando via IA...');
          const generated = await pastorAgent.generateDailyDevotional(true);
          if (generated) {
            const todayISO = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const payload = {
              date: todayISO,
              title: generated.title,
              verse: generated.verseText,
              reference: generated.verseReference,
              text: generated.content,
              prayer: generated.prayer,
            };
            // Salva silenciosamente — erro não bloqueia o display
            try {
              await dbService.saveAdminDevotional(payload);
              console.log('[Inicio03] Devocional salvo no banco com sucesso.');
              // Reatribui com shape compatível ao que o render espera
              devotional = { ...payload, id: todayISO };
            } catch (saveErr) {
              console.warn('[Inicio03] Não foi possível salvar devocional no banco:', saveErr);
              devotional = { ...payload, id: todayISO };
            }
          }
        }
        
        setDailyDevotional(devotional);

        // Registra acesso/amen do usuário corrente, se disponível
        if (currentUser && devotional?.id) {
          dbService.saveUserDevotionalAction(currentUser.uid, devotional.id, 'amen').catch(() => {});
        }
      } catch (error) {
        console.error('[Inicio03] Erro ao carregar devocional:', error);
      } finally {
        setLoadingDevotional(false);
      }
    };

    loadData();

    return () => {
      setIsHeaderHidden(false);
      resetHeader();
    };
  }, [setIsHeaderHidden, resetHeader, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`min-h-screen selection:bg-[#c5a059]/30 font-sans pb-24 ${isLightTheme ? 'bg-[#F6F3EE] text-[#111111]' : 'bg-[#0E0E0E] text-white'}`}>
      <main className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6 space-y-6">
        
        {/* ========================================================= */}
        {/* CABEÇALHO EXATO DO ANEXO */}
        {/* ========================================================= */}
        <div className="space-y-5">
          {/* Usuário e Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName} 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full ring-2 ring-transparent flex items-center justify-center font-bold text-xs ${isLightTheme ? 'bg-[#E2DBCD] text-[#5C4A2A]' : 'bg-[#1A1A1A] text-gray-300'}`}>
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-gray-400 text-[11px] font-medium leading-tight">Bem-vindo de volta</span>
                <span className={`font-bold text-[15px] leading-tight ${isLightTheme ? 'text-[#111111]' : 'text-white'}`}>{userName}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#1A1A1A] rounded-full px-3 py-1.5">
                  <Zap size={14} className="text-[#c5a059]" fill="currentColor" />
                  <span className="text-white font-bold text-xs">{userMana.toLocaleString('pt-BR')}</span>
                  <span className="text-gray-500 text-[10px] font-medium">Mana</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1A1A1A] rounded-full px-3 py-1.5">
                  <Flame size={14} className="text-red-500" fill="currentColor" />
                  <span className="text-white font-bold text-xs">{userStreak}</span>
                  <span className="text-gray-500 text-[10px] font-medium">dias</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <div className="relative" ref={notifRef}>
                  <button className="hover:text-white transition-colors relative" onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}>
                    <Bell size={20} />
                    {unreadNotificationsCount > 0 && (
                      <span className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isLightTheme ? 'border border-[#F6F3EE]' : 'border border-[#0E0E0E]'} bg-red-500`}></span>
                    )}
                  </button>
                  {isNotifDropdownOpen && (
                    <div className={`absolute right-0 top-full mt-3 w-72 rounded-xl shadow-xl overflow-hidden z-50 ${isLightTheme ? 'bg-white border border-[#E7E2D7]' : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}>
                      <div className={`p-3 flex items-center justify-between ${isLightTheme ? 'border-b border-[#EFE9DD]' : 'border-b border-[#2A2A2A]'}`}>
                        <span className={`font-bold text-xs ${isLightTheme ? 'text-[#111111]' : 'text-white'}`}>Notificações</span>
                        <button onClick={markNotificationsAsRead} className="text-[10px] text-[#c5a059] hover:underline font-bold uppercase">Marcar lidas</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-400 text-xs">Nenhuma notificação</div>
                        ) : (
                          notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => {
                                if (notif.link) navigate(notif.link);
                                setIsNotifDropdownOpen(false);
                              }}
                              className={`w-full text-left p-3 transition-colors ${isLightTheme ? 'border-b border-[#F2EEE5] hover:bg-[#F8F4EA]' : 'border-b border-[#2A2A2A] hover:bg-[#252525]'} ${!notif.read ? (isLightTheme ? 'bg-[#FFF8E8]' : 'bg-[#1F1A10]') : ''}`}
                            >
                              <p className={`text-xs font-bold line-clamp-1 ${isLightTheme ? 'text-[#111111]' : 'text-white'}`}>{notif.title}</p>
                              <p className="text-[10px] text-gray-500 line-clamp-2">{notif.message}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative" ref={settingsRef}>
                  <button className="hover:text-white transition-colors" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                    <Settings size={20} />
                  </button>
                  {isSettingsOpen && (
                    <div className={`absolute right-0 top-full mt-3 w-64 rounded-xl shadow-xl overflow-hidden z-50 py-2 ${isLightTheme ? 'bg-white border border-[#E7E2D7]' : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}>
                      {currentUser && (
                        <button onClick={() => { setIsSettingsOpen(false); navigate('/perfil'); }} className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-700 hover:bg-[#F8F4EA]' : 'text-gray-300 hover:bg-[#252525]'}`}>
                          <User size={16}/> Meu Perfil
                        </button>
                      )}
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/intro'); }} className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-700 hover:bg-[#F8F4EA]' : 'text-gray-300 hover:bg-[#252525]'}`}>
                        <Layout size={16} className="text-blue-500" /> Apresentação
                      </button>
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/regras'); }} className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-700 hover:bg-[#F8F4EA]' : 'text-gray-300 hover:bg-[#252525]'}`}>
                        <Zap size={16} className="text-purple-500" /> Manual do Maná
                      </button>
                      <button onClick={() => { toggleTheme(); setIsSettingsOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-700 hover:bg-[#F8F4EA]' : 'text-gray-300 hover:bg-[#252525]'}`}>
                        {settings.theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
                        {settings.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                      </button>
                      <div className={`h-px my-1 ${isLightTheme ? 'bg-[#EFE9DD]' : 'bg-[#2A2A2A]/50'}`} />
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/suporte'); }} className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-500 hover:bg-[#F8F4EA]' : 'text-gray-400 hover:bg-[#252525]'}`}>
                        <LifeBuoy size={16} /> Suporte / Doar
                      </button>
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/termos'); }} className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-400 hover:bg-[#F8F4EA]' : 'text-gray-400 hover:bg-[#252525]'}`}>
                        <Scroll size={16} /> Termos
                      </button>
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/privacidade'); }} className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-400 hover:bg-[#F8F4EA]' : 'text-gray-400 hover:bg-[#252525]'}`}>
                        <ShieldCheck size={16} /> Privacidade
                      </button>
                      {isAdmin && (
                        <>
                          <div className={`h-px my-1 ${isLightTheme ? 'bg-red-100' : 'bg-red-900/20'}`} />
                          <button onClick={() => { setIsSettingsOpen(false); navigate('/admin'); }} className={`w-full text-left px-4 py-2 text-xs font-black flex items-center gap-2 transition-colors ${isLightTheme ? 'text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-red-500/10'}`}>
                            <Terminal size={16} /> Painel Admin
                          </button>
                          <button onClick={() => { setIsSettingsOpen(false); navigate('/system-integrity'); }} className={`w-full text-left px-4 py-2 text-xs font-black flex items-center gap-2 transition-colors ${isLightTheme ? 'text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-red-500/10'}`}>
                            <ShieldAlert size={16} /> Integridade
                          </button>
                        </>
                      )}
                      <div className={`h-px my-1 ${isLightTheme ? 'bg-[#EFE9DD]' : 'bg-[#2A2A2A]/50'}`} />
                      {currentUser ? (
                        <button onClick={() => { signOut(); setIsSettingsOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${isLightTheme ? 'text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-red-500/10'}`}>
                          <LogOut size={16} /> Sair
                        </button>
                      ) : (
                        <button onClick={() => { openLogin(); setIsSettingsOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-[#c5a059] hover:bg-[#c5a059]/10 flex items-center gap-2 transition-colors">
                          <UserCircle size={16} /> Entrar na Conta
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  navigate(`/social/explore?q=${encodeURIComponent(searchTerm.trim())}`);
                }
              }}
              placeholder="Buscar versículos, estudos, pessoas..."
              className="w-full bg-[#161616] border border-transparent rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:border-[#c5a059]/30 transition-all outline-none"
            />
          </div>

          {/* Tabs Nav */}
          <div className="flex items-center gap-6 border-b border-[#2A2A2A] relative">
            <button 
              onClick={() => setActiveTab('inicio')}
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'inicio' ? 'text-[#c5a059]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Home size={16} />
              <span className="text-sm font-semibold">Início</span>
              {activeTab === 'inicio' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#c5a059]" />}
            </button>
            <button 
              onClick={() => setActiveTab('criar')}
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'criar' ? (isLightTheme ? 'text-[#111111]' : 'text-white') : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Wand2 size={16} />
              <span className="text-sm font-semibold">Criar</span>
              {activeTab === 'criar' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white" />}
            </button>
            <button 
              onClick={() => setActiveTab('reino')}
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'reino' ? (isLightTheme ? 'text-[#111111]' : 'text-white') : 'text-gray-500 hover:text-gray-300'}`}
            >
              <User size={16} />
              <span className="text-sm font-semibold">Reino</span>
              {activeTab === 'reino' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white" />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* GRID DO CONTEÚDO */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mt-6">
          
          {/* COLUNA ESQUERDA (Principal) - ocupa 8 colunas no grid baseado no anexo */}
          <div className="lg:col-span-8 space-y-4 lg:space-y-6">
            
            {activeTab === 'inicio' && (
              <>
            {/* 1. HERO - VERSÍCULO DO DIA */}
            <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden min-h-[320px] md:min-h-[400px] flex flex-col justify-end p-6 md:p-10 group cursor-pointer" onClick={openVerseOfDay}>
              <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1525286102666-b3281abadd14?auto=format&fit=crop&q=80&w=1600" alt="Background Adoração" className="w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/80 to-[#0E0E0E]/30" />
                <div className="absolute top-10 left-0 w-full text-center pointer-events-none opacity-80">
                  <h1 className="text-[120px] md:text-[180px] font-black text-white/10 tracking-tighter leading-none select-none">JESUS</h1>
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#c5a059] text-black font-bold text-[11px] rounded-lg mb-4 shadow-lg shadow-[#c5a059]/20">
                  <BookOpen size={14} /> Versículo do Dia
                </div>
                
                <h2 className="text-2xl md:text-[32px] font-bold text-white leading-tight mb-8 max-w-3xl line-clamp-3">
                  "{dailyDevotional?.verse || dailyDevotional?.verseText || 'Carregando palavra de vida...'}"
                </h2>
                
                <div className="flex items-center justify-between">
                  <span className="text-[#c5a059] font-bold text-lg md:text-xl">— {dailyReference}</span>
                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white" onClick={(e) => { e.stopPropagation(); openVerseOfDay(); }}>
                      <Share2 size={18} />
                    </button>
                    <button className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white" onClick={(e) => { e.stopPropagation(); openVerseOfDay(); }}>
                      <Bookmark size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. META LIDA & PÃO DIÁRIO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meta de Leitura */}
              <div className="bg-[#141414] rounded-2xl p-6 border border-[#2A2A2A] flex justify-between items-center cursor-pointer hover:border-[#3A3A3A] transition-colors" onClick={() => navigate('/plano')}>
                <div className="flex flex-col h-full justify-between">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                    <Target size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-[13px] mb-1">Meta de Leitura</h3>
                    <span className="text-gray-500 font-bold text-[10px] flex items-center gap-1 uppercase tracking-wider">RETOMAR <ChevronRight size={12} /></span>
                  </div>
                </div>
                <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#222" strokeWidth="6" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="6" 
                      strokeDasharray="163.36" 
                      strokeDashoffset={163.36 - (163.36 * (readPercent || 0)) / 100} 
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white font-black text-[10px] rotate-90">{readPercent}%</span>
                </div>
              </div>

              {/* Pão Diário */}
              <div className="bg-[#141414] rounded-2xl p-6 border border-[#2A2A2A] flex justify-between relative overflow-hidden cursor-pointer hover:border-[#3A3A3A] transition-colors" onClick={() => navigate('/devocional')}>
                <div className="absolute right-[-20%] top-[-20%] text-[180px] font-serif font-black text-white/5 leading-none select-none pointer-events-none">99</div>
                
                <div className="flex flex-col h-full justify-between relative z-10 w-1/3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
                    <Heart size={16} className="text-orange-500" fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-[13px] mb-1">Pão Diário</h3>
                    <span className="text-gray-500 font-bold text-[10px] flex items-center gap-1 uppercase tracking-wider">ACESSAR <ChevronRight size={12} /></span>
                  </div>
                </div>

                <div className="relative z-10 w-2/3 pl-4 flex flex-col justify-center border-l border-[#2A2A2A] ml-4 bg-gradient-to-r from-transparent to-[#141414]">
                  <div className="flex items-center gap-1 text-[#c5a059] mb-2">
                    <Zap size={10} fill="currentColor" />
                    <span className="text-[9px] font-black tracking-widest uppercase">DEVOCIONAL DO DIA</span>
                  </div>
                  <p className="text-white text-xs font-serif italic mb-2 leading-snug pr-4 line-clamp-3">
                    "{dailyDevotional?.verse || dailyDevotional?.verseText || 'Hoje, enquanto meditamos nas palavras do Senhor...'}"
                  </p>
                  <span className="text-[#c5a059] font-bold text-[9px] uppercase tracking-widest">{dailyReference}</span>
                </div>
              </div>
            </div>

            {/* 3. PLANOS & SALAS */}
            <div className="pt-2 border-t border-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white">
                  <BookOpen size={18} className="text-[#c5a059]" />
                  <h2 className="font-bold text-base">Planos & Salas</h2>
                </div>
                <button 
                  onClick={() => navigate('/workspace-pastoral')}
                  className="text-[#c5a059] font-black text-[10px] tracking-widest uppercase hover:text-white transition-colors"
                >
                  PAINEL DE CONTROLE
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {/* Nova Sala */}
                <button 
                  onClick={() => navigate('/criador-jornada')}
                  className="min-w-[160px] h-[190px] rounded-2xl border border-dashed border-[#c5a059]/40 bg-transparent flex flex-col items-center justify-center gap-4 hover:bg-[#c5a059]/5 transition-colors cursor-pointer shrink-0"
                >
                  <div className="w-12 h-12 bg-[#c5a059] rounded-xl flex items-center justify-center text-black">
                    <Plus size={24} />
                  </div>
                  <span className="text-white font-bold text-[11px] uppercase tracking-wider">NOVA SALA</span>
                </button>

                {plans.length > 0 ? plans.map(plan => (
                  <div 
                    key={plan.id}
                    className="min-w-[200px] h-[190px] rounded-2xl p-5 bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-between cursor-pointer hover:border-[#4A4A4A] transition-colors shrink-0"
                    onClick={() => navigate(`/plano/${plan.id}`)}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-[#1a4a35] text-emerald-400 font-bold text-[8px] px-2 py-1 rounded tracking-widest">EM ANDAMENTO</span>
                        <span className="text-gray-500 font-bold text-[9px]">{new Date(plan.createdAt || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                      </div>
                      <h3 className="text-white font-bold text-sm truncate">{plan.title}</h3>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mb-1">
                        <User size={12} /> {plan.teams && plan.teams.length > 0 ? 'SALA EM TIME' : 'SALA INDIVIDUAL'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mb-4">
                        <BookOpen size={12} /> {plan.planningFrequency === 'daily' ? 'DIÁRIO' : 'LIVRE'}
                      </div>
                      <button className="w-full bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors text-white font-bold text-[10px] py-2 rounded-lg flex items-center justify-center gap-2">
                        GERENCIAR SALA <ArrowRight size={14} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="min-w-[200px] h-[190px] rounded-2xl p-5 bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-center items-center text-center shrink-0">
                    <BookOpen size={24} className="text-gray-600 mb-3" />
                    <span className="text-gray-500 text-xs mb-2">Você ainda não tem salas ativas</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. CRIAR ESTUDO E CARDS */}
            <div className="flex flex-col md:flex-row gap-4 h-[240px]">
              {/* Box Criar Estudo */}
              <div 
                className="w-full md:w-[35%] bg-[#1A1E24] rounded-2xl p-6 border border-[#2A2A2A] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-blue-500/30 transition-colors"
                onClick={() => navigate('/criar-conteudo')}
              >
                <div className="w-12 h-12 bg-white flex items-center justify-center rounded-xl mb-4">
                  <FileText size={24} className="text-black" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Criar Estudo</h3>
                <p className="text-gray-400 text-xs">Análise profunda com IA</p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
              </div>

              {/* Box Cards Escuros */}
              <div className="w-full md:w-[65%] flex gap-4 h-full">
                {plans.length > 0 ? plans.slice(0, 2).map((plan, i) => (
                  <div key={`box-${plan.id || i}`} onClick={() => navigate(`/plano/${plan.id}`)} className="flex-1 bg-[#121212] rounded-2xl p-6 border border-[#202020] flex flex-col justify-between cursor-pointer hover:border-[#3A3A3A] transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-medium text-sm line-clamp-2">{plan.title}</h3>
                      <span className="text-gray-500 text-[10px] font-bold shrink-0">{new Date(plan.createdAt || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <BookOpen size={14} /> <span className="text-xs font-bold uppercase">{plan.planningFrequency === 'daily' ? 'Diário' : 'Leitura'}</span>
                    </div>
                  </div>
                )) : (
                  <>
                    <div onClick={() => navigate('/plano')} className="flex-1 bg-[#121212] rounded-2xl p-6 border border-[#202020] flex flex-col justify-center items-center cursor-pointer hover:border-[#3A3A3A] transition-colors text-center">
                      <span className="text-gray-500 text-xs">Nenhum estudo iniciado</span>
                    </div>
                    <div onClick={() => navigate('/plano')} className="flex-1 bg-[#121212] rounded-2xl p-6 border border-[#202020] flex flex-col justify-center items-center cursor-pointer hover:border-[#3A3A3A] transition-colors text-center">
                      <span className="text-gray-500 text-xs">Explore a biblioteca</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 5. ESTÚDIO CRIATIVO */}
            <div className="bg-[#1A1624] rounded-[2rem] p-6 md:p-8 border border-[#2A2A2A] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-3xl rounded-full" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 bg-[#c5a059] rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                  <Wand2 size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-[20px] leading-tight">Estúdio Criativo com IA</h2>
                  <p className="text-gray-400 text-[13px] mt-1 pr-4">Transforme sua fé em arte e áudio. Gere imagens sagradas e podcasts inspiradores com inteligência artificial.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <button 
                  onClick={() => navigate('/artes-sacras')}
                  className="bg-[#16131D] p-5 rounded-2xl border border-[#252525] text-left hover:border-green-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 rounded bg-green-500/10">
                      <Image size={18} className="text-green-500" />
                    </div>
                    <span className="text-white font-bold text-[15px]">Gerar Arte Sacra</span>
                  </div>
                  <p className="text-[#888] text-[11px] leading-relaxed mb-4 min-h-[34px]">Crie imagens inspiradas em versículos, cenas bíblicas ou reflexões espirituais.</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-gray-400">Realista</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-gray-400">Óleo</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-gray-400">Cinematográfico</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-gray-400">Aquarela</span>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/estudio-criativo', { state: { tool: 'podcast' } })}
                  className="bg-[#16131D] p-5 rounded-2xl border border-[#252525] text-left hover:border-pink-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 rounded bg-pink-500/10">
                      <Mic size={18} className="text-pink-500" />
                    </div>
                    <span className="text-white font-bold text-[15px]">Gerar Podcast</span>
                  </div>
                  <p className="text-[#888] text-[11px] leading-relaxed mb-4 min-h-[34px]">Transforme versículos e reflexões em episódios de podcast com narração IA.</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-gray-400">Devocional</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-gray-400">Estudo</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-gray-400">Pregação</span>
                  </div>
                </button>
              </div>
            </div>
            </>
            )}

            {/* ==================== ABA CRIAR ==================== */}
            {activeTab === 'criar' && (
              <div className="space-y-6">
                
                {/* 1. RESUMO IA / CRÉDITOS */}
                <div className="bg-[#1A1624] rounded-[2rem] p-6 md:p-8 border border-[#2A2A2A] relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-3xl rounded-full" />
                  <div className="w-16 h-16 bg-[#c5a059] rounded-2xl flex items-center justify-center border border-white/10 shadow-lg relative z-10 shrink-0">
                    <Sparkles size={32} className="text-white" />
                  </div>
                  <div className="relative z-10 flex-1">
                    <h2 className="text-white font-bold text-[24px] leading-tight mb-2">Seu Estúdio Criativo</h2>
                    <p className="text-gray-400 text-[14px] leading-relaxed">
                      Você pode gerar imagens bíblicas, criar episódios de podcast curtos e planejar esboços utilizando os assistentes de IA especializados.
                    </p>
                  </div>
                  <div className="relative z-10 bg-[#120F18] border border-[#2A2A2A] rounded-2xl p-4 shrink-0 flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Status</span>
                      <span className="text-green-500 font-bold text-sm flex items-center gap-1"><Zap size={14} /> Ativo</span>
                    </div>
                  </div>
                </div>

                {/* 2. FERRAMENTAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* ... cards artes sacras, podcast, criar conteudo ... */}
                  <button 
                    onClick={() => navigate('/artes-sacras')}
                    className="bg-[#1A1E24] p-5 rounded-2xl border border-[#2A2A2A] text-left hover:border-blue-500/30 transition-colors group relative overflow-hidden h-[180px] flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-auto">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                         <Image size={24} className="text-blue-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Gerar Imagens</h3>
                      <p className="text-gray-400 text-xs mt-1">Crie artes sacras com IA.</p>
                      <div className="mt-4 flex items-center text-blue-500 text-xs font-bold gap-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        INICIAR <ArrowRight size={12} />
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => navigate('/estudio-criativo', { state: { tool: 'podcast' } })}
                    className="bg-[#1A1E24] p-5 rounded-2xl border border-[#2A2A2A] text-left hover:border-pink-500/30 transition-colors group relative overflow-hidden h-[180px] flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-auto">
                      <div className="p-2 rounded-lg bg-pink-500/10">
                         <Mic size={24} className="text-pink-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Gerar Podcast</h3>
                      <p className="text-gray-400 text-xs mt-1">Narrativas e Devocionais gerados em áudio.</p>
                      <div className="mt-4 flex items-center text-pink-500 text-xs font-bold gap-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        INICIAR <ArrowRight size={12} />
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => navigate('/criar-conteudo')}
                    className="bg-[#1A1E24] p-5 rounded-2xl border border-[#2A2A2A] text-left hover:border-green-500/30 transition-colors group relative overflow-hidden h-[180px] flex flex-col md:col-span-2 lg:col-span-1"
                  >
                    <div className="flex items-center gap-2 mb-auto">
                      <div className="p-2 rounded-lg bg-green-500/10">
                         <Wand2 size={24} className="text-green-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Esboços de IA</h3>
                      <p className="text-gray-400 text-xs mt-1">Aprofundamento de textos.</p>
                      <div className="mt-4 flex items-center text-green-500 text-xs font-bold gap-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        INICIAR <ArrowRight size={12} />
                      </div>
                    </div>
                  </button>
                </div>

                {/* 3. HISTÓRICO RECENTE & DICAS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Historico */}
                  <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-white font-bold flex items-center gap-2"><History size={16} className="text-gray-400"/> Histórico Recente</h3>
                      <button className="text-[10px] text-[#c5a059] font-bold uppercase tracking-widest hover:text-white transition-colors">Ver Tudo</button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=200', title: 'Criação', type: 'image' },
                        { url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=200', title: 'Mar Vermelho', type: 'image' },
                        { url: 'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=200', title: 'Jerusalém', type: 'podcast' },
                        { url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=200', title: 'Daniel', type: 'podcast' },
                      ].map((item, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#1A1A1A] relative group cursor-pointer border border-[#2A2A2A] hover:border-[#c5a059]/50 transition-colors">
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute top-1 left-1 p-1 bg-black/50 backdrop-blur rounded-md">
                            {item.type === 'image' ? <Image size={10} className="text-white"/> : <Mic size={10} className="text-white"/>}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-[9px] font-bold truncate">{item.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dicas */}
                  <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-white font-bold flex items-center gap-2"><Book size={16} className="text-gray-400"/> Dicas de Prompt</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                        <span className="text-[10px] text-[#c5a059] font-bold uppercase mb-1 block">Imagens</span>
                        <p className="text-gray-400 text-xs">Para melhores resultados, seja descritivo com o estilo desejado. Ex: "Jesus caminhando sobre as águas, estilo pintura a óleo impressionista, luz dramática".</p>
                      </div>
                      <div className="p-3 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                        <span className="text-[10px] text-pink-500 font-bold uppercase mb-1 block">Podcasts</span>
                        <p className="text-gray-400 text-xs">Cole o versículo ou citação completa do devocional e defina o tom como "encorajador" ou "reflexivo" para a narração.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== ABA REINO ==================== */}
            {activeTab === 'reino' && (
              <div className="space-y-6">
                <div className="bg-[#1A1E24] rounded-2xl p-10 border border-[#2A2A2A] text-center">
                  <Users size={48} className="text-gray-500 mx-auto mb-4" />
                  <h2 className="text-white font-bold text-xl mb-2">Comunidade Reino</h2>
                  <p className="text-gray-400 text-sm max-w-md mx-auto relative cursor-pointer">
                    A aba Reino está em desenvolvimento. Em breve você poderá interagir com a comunidade, igrejas, enviar pedidos de oração e acompanhar atividades.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* ========================================================= */}
          {/* COLUNA DIREITA (Sidebar) - ocupa 4 colunas no grid baseado no anexo */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-4 lg:space-y-6">
            
            {/* Minhas Atividades Button */}
            <button 
              onClick={() => navigate('/historico')}
              className="w-full flex items-center justify-between bg-gradient-to-r from-[#9F5FFC] to-[#7D3CF3] rounded-2xl p-5 shadow-lg group hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center bg-transparent">
                  <History size={18} className="text-white" />
                </div>
                <span className="text-white font-bold text-[15px]">Minhas Atividades</span>
              </div>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <ChevronRight size={18} className="text-[#8A49F6]" />
              </div>
            </button>

            {/* Acesso Rápido Black Box */}
            <div className="bg-[#101010] border border-[#202020] rounded-[2rem] p-6 pb-2">
              <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-6 pl-2">ACESSO RÁPIDO</h4>
              
              <div className="space-y-1 mb-6">
                {[
                  { icon: <BookOpen size={16} />, label: 'Bíblia Sagrada', color: 'text-blue-500', route: '/biblia' },
                  { icon: <Target size={16} />, label: 'Planos de Leitura', color: 'text-red-500', route: '/plano' },
                  { icon: <Book size={16} />, label: 'Meus Estudos', color: 'text-orange-500', route: '/estudos/planos' },
                  { icon: <Plus size={16} />, label: 'Criar Estudo', color: 'text-green-500', route: '/criar-conteudo' },
                  { icon: <Trophy size={16} />, label: 'Ranking Global', color: 'text-yellow-500', route: '/quiz' },
                ].map((item, i) => (
                  <button key={`core-${i}`} onClick={() => navigate(item.route)} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-[#1A1A1A] rounded-xl transition-colors">
                    <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-[#151515] border border-[#252525]">
                      <div className={item.color}>{item.icon}</div>
                    </div>
                    <span className="text-[13px] text-white font-bold">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="h-[1px] bg-[#202020] w-full mb-6" />

              <div className="space-y-1 mb-6">
                {[
                  { icon: <Image size={16} />, label: 'Gerar Arte Sacra', color: 'text-pink-500', route: '/artes-sacras' },
                  { icon: <Mic size={16} />, label: 'Gerar Podcast', color: 'text-fuchsia-500', route: '/estudio-criativo', onClick: () => navigate('/estudio-criativo', { state: { tool: 'podcast' } }) },
                  { icon: <Zap size={16} />, label: 'FaithTech AI', color: 'text-purple-500', route: '/faith-tech' },
                  { icon: <Users size={16} />, label: 'Comunidade', color: 'text-cyan-500', route: '/social' },
                  { icon: <Heart size={16} />, label: 'Sala de Oração', color: 'text-rose-500', route: '/oracoes' },
                  { icon: <MessageSquare size={16} />, label: 'Pedidos de Oração', color: 'text-indigo-500', route: '/oracoes/gerenciar' },
                  { icon: <FileText size={16} />, label: 'Notas & Insights', color: 'text-amber-500', route: '/notes' },
                  { icon: <Calendar size={16} />, label: 'Minha Rotina', color: 'text-emerald-500', route: '/rotina' },
                  { icon: <CreditCard size={16} />, label: 'Assinatura PRO', color: 'text-slate-400', route: '/planos' },
                  { icon: <HelpCircle size={16} />, label: 'Ajuda & Suporte', color: 'text-gray-400', route: '/suporte' }
                ].map((item, i) => (
                  <button key={`tools-${i}`} onClick={() => item.onClick ? item.onClick() : navigate(item.route)} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-[#1A1A1A] rounded-xl transition-colors">
                    <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-[#151515] border border-[#252525]">
                      <div className={item.color}>{item.icon}</div>
                    </div>
                    <span className="text-[13px] text-white font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Descobertas / Flash Quiz Box */}
            <div className="bg-[#0A0A0A] border border-[#202020] rounded-[2rem] p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <Zap size={14} className="text-[#c5a059]" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">DESCOBERTAS</span>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-purple-500" />
                  <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">FLASH QUIZ</span>
                </div>
                
                <h3 className="text-white font-bold text-[15px] mb-5">Quem foi o sucessor de Moisés?</h3>

                <div className="space-y-2">
                  {['Josué', 'Calebe', 'Arão', 'Hur'].map((opt) => (
                    <button 
                      key={opt}
                      onClick={() => navigate('/quiz')}
                      className="w-full text-left bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded-xl py-3 px-4 text-[13px] text-gray-300 font-medium transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default SanctuaryPage;
