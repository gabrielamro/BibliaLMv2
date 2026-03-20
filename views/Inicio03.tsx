"use client";
import React, { useState, useEffect } from 'react';
import { useNavigate } from '../utils/router';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { 
  BookOpen, ChevronRight, Share2, Bookmark, Flame, Zap, 
  Search, Bell, Settings, Home, Wand2, User, Play, Pause, 
  Plus, FileText, Image, Mic, History, Trophy, Crown, Target, Heart, ArrowRight
} from 'lucide-react';

const SanctuaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, showNotification } = useAuth();
  const { resetHeader, setIsHeaderHidden } = useHeader();
  
  const [activeTab, setActiveTab] = useState<'inicio' | 'criar' | 'reino'>('inicio');

  useEffect(() => {
    // Esconder o header padrão do Layout.tsx para usar este customizado da imagem
    setIsHeaderHidden(true);
    return () => {
      setIsHeaderHidden(false);
      resetHeader();
    };
  }, [setIsHeaderHidden, resetHeader]);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white selection:bg-[#c5a059]/30 font-sans pb-24">
      <main className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6 space-y-6">
        
        {/* ========================================================= */}
        {/* CABEÇALHO EXATO DO ANEXO */}
        {/* ========================================================= */}
        <div className="space-y-5">
          {/* Usuário e Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://i.pravatar.cc/150?img=5" 
                alt="Maria Silva" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent"
              />
              <div className="flex flex-col">
                <span className="text-gray-400 text-[11px] font-medium leading-tight">Bem-vindo de volta</span>
                <span className="text-white font-bold text-[15px] leading-tight">Maria Silva</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#1A1A1A] rounded-full px-3 py-1.5">
                  <Zap size={14} className="text-[#c5a059]" fill="currentColor" />
                  <span className="text-white font-bold text-xs">3.420</span>
                  <span className="text-gray-500 text-[10px] font-medium">Mana</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1A1A1A] rounded-full px-3 py-1.5">
                  <Flame size={14} className="text-red-500" fill="currentColor" />
                  <span className="text-white font-bold text-xs">7</span>
                  <span className="text-gray-500 text-[10px] font-medium">dias</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <button className="hover:text-white transition-colors">
                  <Bell size={20} />
                </button>
                <button className="hover:text-white transition-colors">
                  <Settings size={20} />
                </button>
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
              placeholder="Buscar versículos, estudos, pessoas..."
              className="w-full bg-[#161616] border-none rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-[#c5a059]/50 transition-all outline-none"
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
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'criar' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Wand2 size={16} />
              <span className="text-sm font-semibold">Criar</span>
              {activeTab === 'criar' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white" />}
            </button>
            <button 
              onClick={() => setActiveTab('reino')}
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'reino' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
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
            
            {/* 1. HERO - VERSÍCULO DO DIA */}
            <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden min-h-[320px] md:min-h-[400px] flex flex-col justify-end p-6 md:p-10 group cursor-pointer" onClick={() => navigate('/devocional')}>
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
                
                <h2 className="text-2xl md:text-[32px] font-bold text-white leading-tight mb-8 max-w-3xl">
                  "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."
                </h2>
                
                <div className="flex items-center justify-between">
                  <span className="text-[#c5a059] font-bold text-lg md:text-xl">— João 3:16</span>
                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white" onClick={(e) => { e.stopPropagation(); showNotification('Compartilhamento em breve', 'info'); }}>
                      <Share2 size={18} />
                    </button>
                    <button className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white" onClick={(e) => { e.stopPropagation(); showNotification('Salvo em favoritos', 'success'); }}>
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
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" className="stroke-[#222] fill-none" strokeWidth="6" />
                    <circle cx="32" cy="32" r="28" className="stroke-blue-500 fill-none" strokeWidth="6" strokeDasharray="175" strokeDashoffset={175 - (175 * 67) / 100} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-white font-black text-xs">67%</span>
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
                    <span className="text-[9px] font-black tracking-widest uppercase">VERSÍCULO DO DIA</span>
                  </div>
                  <p className="text-white text-xs font-serif italic mb-2 leading-snug pr-4">
                    "Alegrem-se sempre no Senhor. Novamente direi: Alegrem-se!"
                  </p>
                  <span className="text-[#c5a059] font-bold text-[9px] uppercase tracking-widest">FILIPENSES 4:4</span>
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
                  className="min-w-[160px] h-[190px] rounded-2xl border border-dashed border-[#c5a059]/40 bg-transparent flex flex-col items-center justify-center gap-4 hover:bg-[#c5a059]/5 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-[#c5a059] rounded-xl flex items-center justify-center text-black">
                    <Plus size={24} />
                  </div>
                  <span className="text-white font-bold text-[11px] uppercase tracking-wider">NOVA SALA</span>
                </button>

                {/* Deus e Seu Amor */}
                <div 
                  className="min-w-[200px] h-[190px] rounded-2xl p-5 bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-between cursor-pointer hover:border-[#4A4A4A] transition-colors"
                  onClick={() => navigate('/jornada/deus-e-seu-amor')}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-[#1a4a35] text-emerald-400 font-bold text-[8px] px-2 py-1 rounded tracking-widest">EM ANDAMENTO</span>
                      <span className="text-gray-500 font-bold text-[9px]">16/03/26</span>
                    </div>
                    <h3 className="text-white font-bold text-sm">Deus e Seu Amor</h3>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mb-1">
                      <User size={12} /> 0 INSCRITOS
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mb-4">
                      <BookOpen size={12} /> 4 MÓDULOS
                    </div>
                    <button className="w-full bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors text-white font-bold text-[10px] py-2 rounded-lg flex items-center justify-center gap-2">
                      GERENCIAR SALA <ArrowRight size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Vida de Oração */}
                <div 
                  className="min-w-[200px] h-[190px] rounded-2xl p-5 bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-between cursor-pointer hover:border-[#4A4A4A] transition-colors"
                  onClick={() => navigate('/jornada/vida-de-oracao')}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-[#1a4a35] text-emerald-400 font-bold text-[8px] px-2 py-1 rounded tracking-widest">EM ANDAMENTO</span>
                      <span className="text-gray-500 font-bold text-[9px]">08/03/26</span>
                    </div>
                    <h3 className="text-white font-bold text-sm">Vida de Oração</h3>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mb-1">
                      <User size={12} /> 0 INSCRITOS
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mb-4">
                      <BookOpen size={12} /> 1 MÓDULOS
                    </div>
                    <button className="w-full bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors text-white font-bold text-[10px] py-2 rounded-lg flex items-center justify-center gap-2">
                      GERENCIAR SALA <ArrowRight size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. CRIAR ESTUDO E CARDS */}
            <div className="flex flex-col md:flex-row gap-4 h-[240px]">
              {/* Box Criar Estudo */}
              <div 
                className="w-full md:w-[35%] bg-[#1A1E24] rounded-2xl p-6 border border-[#2A2A2A] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-blue-500/30 transition-colors"
                onClick={() => navigate('/criar-estudo')}
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
                <div className="flex-1 bg-[#121212] rounded-2xl p-6 border border-[#202020] flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-medium text-sm">Deus e Seu Amor</h3>
                    <span className="text-gray-500 text-[10px] font-bold">16/03/26</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <User size={14} /> <span className="text-xs font-bold">0</span>
                  </div>
                </div>

                <div className="flex-1 bg-[#121212] rounded-2xl p-6 border border-[#202020] flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-medium text-sm">Vida de Oração</h3>
                    <span className="text-gray-500 text-[10px] font-bold">08/03/26</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <User size={14} /> <span className="text-xs font-bold">0</span>
                  </div>
                </div>
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
                  onClick={() => navigate('/estudio-criativo')}
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
                  onClick={() => navigate('/estudio-criativo')}
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
                  { icon: <BookOpen size={16} />, label: 'Meus Estudos', color: 'text-blue-500', route: '/estudos/planos' },
                  { icon: <Trophy size={16} />, label: 'Ranking Global', color: 'text-yellow-500', route: '/quiz' },
                  { icon: <Wand2 size={16} />, label: 'Estúdio Criativo', color: 'text-pink-500', route: '/estudio-criativo' }
                ].map((item, i) => (
                  <button key={`top-${i}`} onClick={() => navigate(item.route)} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-[#1A1A1A] rounded-xl transition-colors">
                    <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-[#151515] border border-[#252525]">
                      <div className={item.color}>{item.icon}</div>
                    </div>
                    <span className="text-[13px] text-white font-bold">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="h-[1px] bg-[#202020] w-full mb-6" />

              <div className="space-y-1 mb-6">
                {/* Conforme o mockup, repete os itens */}
                {[
                  { icon: <BookOpen size={16} />, label: 'Meus Estudos', color: 'text-blue-500', route: '/estudos/planos' },
                  { icon: <Trophy size={16} />, label: 'Ranking Global', color: 'text-yellow-500', route: '/quiz' },
                  { icon: <Wand2 size={16} />, label: 'Estúdio Criativo', color: 'text-pink-500', route: '/estudio-criativo' }
                ].map((item, i) => (
                  <button key={`bottom-${i}`} onClick={() => navigate(item.route)} className="w-full flex items-center gap-4 py-3 px-2 hover:bg-[#1A1A1A] rounded-xl transition-colors">
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
