"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';

import { 
  ArrowRight, Sparkles, Users, Crown, 
  BookOpen, Zap, Play, Star, ChevronDown, 
  MessageCircle, Layout, Image as ImageIcon
} from 'lucide-react';
import SEO from '../components/SEO';
import { LogoIcon } from '../components/LogoIcon';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/LoginModal';

// --- COMPONENTES VISUAIS ---

const GlowingOrb = ({ color = "bg-bible-gold", size = "w-96 h-96", opacity = "opacity-20" }) => (
  <div className={`absolute rounded-full blur-[128px] ${color} ${size} ${opacity} pointer-events-none animate-pulse-slow`} />
);

interface FeatureScrollItemProps {
  title: string;
  desc: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}

const FeatureScrollItem: React.FC<FeatureScrollItemProps> = ({ 
    title, desc, icon: Icon, active, onClick 
}) => (
    <div 
        onClick={onClick}
        className={`cursor-pointer border-l-4 pl-6 py-4 transition-all duration-500 ${
            active 
            ? 'border-bible-gold opacity-100' 
            : 'border-white/10 opacity-40 hover:opacity-70'
        }`}
    >
        <h3 className={`text-2xl font-serif font-bold mb-2 flex items-center gap-3 ${active ? 'text-white' : 'text-gray-400'}`}>
            <Icon size={24} className={active ? 'text-bible-gold' : 'text-gray-500'} />
            {title}
        </h3>
        <p className="text-gray-400 leading-relaxed text-sm max-w-md">
            {desc}
        </p>
    </div>
);

const LandingPageV2: React.FC = () => {
  const navigate = useNavigate();
  const { openLogin, currentUser, isLoginModalOpen, closeLogin } = useAuth();
  
  const [activeFeature, setActiveFeature] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-rotate features
  useEffect(() => {
      const interval = setInterval(() => {
          setActiveFeature(prev => (prev + 1) % 3);
      }, 5000);
      return () => clearInterval(interval);
  }, []);

  const features = [
      {
          id: 0,
          title: "Inteligência Teológica",
          desc: "Não é apenas um chat. É um conselheiro treinado em hermenêutica, história e teologia para responder suas dúvidas mais profundas.",
          icon: MessageCircle,
          image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop", // Placeholder abstrato
          color: "from-blue-500 to-purple-600"
      },
      {
          id: 1,
          title: "Estúdio de Arte Sacra",
          desc: "Transforme versículos em obras de arte visual. Materialize sua fé e compartilhe o evangelho com beleza nas redes sociais.",
          icon: ImageIcon,
          image: "https://images.unsplash.com/photo-1627163439134-7a8c47e08208?q=80&w=1000&auto=format&fit=crop",
          color: "from-pink-500 to-rose-600"
      },
      {
          id: 2,
          title: "Gestão Pastoral",
          desc: "Ferramentas poderosas para líderes. Crie séries de sermões, gerencie células e acompanhe o crescimento espiritual da sua igreja.",
          icon: Layout,
          image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1000&auto=format&fit=crop",
          color: "from-amber-500 to-orange-600"
      }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-bible-gold selection:text-black overflow-x-hidden">
      <SEO title="BíbliaLM - O Futuro do Estudo Bíblico" />

      {/* BACKGROUND NOISE TEXTURE */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* --- NAV FLUTUANTE --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-6 px-6 md:px-12 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <LogoIcon className="w-8 h-8 text-bible-gold group-hover:scale-110 transition-transform duration-500" />
            <span className="font-serif font-bold text-xl tracking-tight">Bíblia<span className="text-bible-gold">LM</span></span>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/intro')} className="text-xs font-bold text-gray-500 hover:text-white transition-colors hidden md:block">
                Versão Clássica
            </button>
            {!currentUser ? (
                 <button onClick={() => openLogin()} data-testid="landing-login-btn" className="bg-white text-black px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-bible-gold hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    Entrar
                 </button>
            ) : (
                 <button onClick={() => navigate('/')} className="bg-bible-gold/20 border border-bible-gold/50 text-bible-gold px-6 py-2.5 rounded-full text-xs font-bold hover:bg-bible-gold hover:text-black transition-all">
                    Dashboard
                 </button>
            )}
        </div>
      </nav>

      {/* --- HERO: CINEMATIC --- */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-4 pt-20">
          {/* Luzes de Fundo */}
          <GlowingOrb color="bg-blue-600" size="w-[500px] h-[500px]" opacity="opacity-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-bible-gold/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 max-w-4xl space-y-8 animate-in fade-in zoom-in duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                  <Sparkles size={12} className="text-bible-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">Nova Era da Fé Digital</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black leading-[0.9] tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
                    Aprofunde sua<br/>Conexão Divina.
                  </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
                  A primeira plataforma que une <b>Inteligência Artificial</b>, <b>Arte Sacra</b> e <b>Comunidade</b> para expandir seu entendimento das Escrituras.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <button 
                    onClick={() => openLogin()}
                    className="group relative px-8 py-4 bg-bible-gold text-black rounded-full font-black uppercase tracking-widest overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(197,160,89,0.4)]"
                  >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                      <span className="relative flex items-center gap-2">Começar Jornada <ArrowRight size={16} /></span>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/biblia')}
                    className="px-8 py-4 border border-white/20 text-white rounded-full font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                      <BookOpen size={16} /> Apenas Ler
                  </button>
              </div>
          </div>

          {/* Scroll Down Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
              <ChevronDown className="text-gray-500" />
          </div>
      </section>

      {/* --- STATS STRIP --- */}
      <div className="border-y border-white/5 bg-black/40 backdrop-blur-sm py-8 relative z-20">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                  { label: "Usuários Ativos", val: "+1.2k" },
                  { label: "Capítulos Lidos", val: "+85k" },
                  { label: "Artes Geradas", val: "+4.5k" },
                  { label: "Igrejas", val: "+120" }
              ].map((stat, i) => (
                  <div key={i}>
                      <p className="text-2xl md:text-3xl font-black text-white mb-1">{stat.val}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
              ))}
          </div>
      </div>

      {/* --- FEATURE SHOWCASE (SCROLL-TELLING) --- */}
      <section className="py-32 px-6 relative overflow-hidden" ref={scrollRef}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Left: Interactive Menu */}
              <div className="space-y-12 relative z-10 order-2 lg:order-1">
                  <div className="mb-12">
                      <h2 className="text-4xl font-serif font-bold mb-4">Um ecossistema completo<br/>para sua fé.</h2>
                      <p className="text-gray-400">Tudo o que você precisa para estudar, criar e liderar, em um único lugar.</p>
                  </div>

                  <div className="space-y-2">
                      {features.map((feature, idx) => (
                          <FeatureScrollItem 
                              key={feature.id}
                              title={feature.title}
                              desc={feature.desc}
                              icon={feature.icon}
                              active={activeFeature === idx} 
                              onClick={() => setActiveFeature(idx)}
                          />
                      ))}
                  </div>
              </div>

              {/* Right: Dynamic Visual */}
              <div className="relative order-1 lg:order-2 h-[500px] lg:h-[700px] flex items-center justify-center perspective-1000">
                  {/* Dynamic Glow Background based on feature */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${features[activeFeature].color} opacity-20 blur-[100px] transition-all duration-1000`}></div>
                  
                  {/* The "Card" */}
                  <div className="relative w-full max-w-md aspect-[4/5] bg-gray-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden transition-all duration-700 transform rotate-y-12 hover:rotate-y-0 group">
                      
                      {/* Fake UI Header */}
                      <div className="absolute top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-md z-20 border-b border-white/5 flex items-center px-6 justify-between">
                          <div className="flex gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                          </div>
                          <div className="text-[10px] font-mono text-gray-500">BIBLIA_OS_V1.5</div>
                      </div>

                      {/* Content Transition */}
                      <div className="absolute inset-0 pt-16 flex items-center justify-center bg-[#0a0a0a]">
                          {activeFeature === 0 && (
                              <div className="w-full h-full p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8">
                                  <div className="self-end bg-blue-600/20 border border-blue-500/30 text-blue-100 p-4 rounded-2xl rounded-tr-sm text-sm">
                                      Explique a trindade de forma simples.
                                  </div>
                                  <div className="self-start bg-gray-800 border border-white/5 text-gray-300 p-4 rounded-2xl rounded-tl-sm text-sm">
                                      <Sparkles size={14} className="text-bible-gold mb-2" />
                                      Imagine a água: ela pode ser gelo, líquido ou vapor, mas sempre é H2O. Assim é Deus: Pai, Filho e Espírito Santo...
                                  </div>
                                  <div className="mt-auto relative">
                                      <input disabled placeholder="Pergunte algo ao Teólogo..." className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs" />
                                      <div className="absolute right-3 top-3 text-blue-500"><Zap size={14}/></div>
                                  </div>
                              </div>
                          )}

                          {activeFeature === 1 && (
                              <div className="w-full h-full relative animate-in fade-in zoom-in duration-700">
                                  <img src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover opacity-60" alt="Lion" />
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/20">
                                      <h3 className="font-serif text-3xl font-bold text-white mb-2 drop-shadow-lg">"Sê forte e corajoso"</h3>
                                      <span className="text-bible-gold font-black tracking-widest text-xs uppercase bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Josué 1:9</span>
                                  </div>
                                  <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 flex justify-between items-center">
                                      <div className="flex gap-2">
                                          <div className="w-8 h-8 rounded-full bg-purple-500"></div>
                                          <div className="w-8 h-8 rounded-full bg-blue-500"></div>
                                      </div>
                                      <button className="bg-white text-black px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase">Gerar</button>
                                  </div>
                              </div>
                          )}

                          {activeFeature === 2 && (
                              <div className="w-full h-full p-6 animate-in fade-in slide-in-from-right-8">
                                  <div className="grid grid-cols-2 gap-4 mb-6">
                                      <div className="bg-gray-800/50 p-4 rounded-xl border border-white/5">
                                          <div className="text-2xl font-bold text-white">124</div>
                                          <div className="text-[10px] text-gray-500 uppercase">Membros</div>
                                      </div>
                                      <div className="bg-gray-800/50 p-4 rounded-xl border border-white/5">
                                          <div className="text-2xl font-bold text-amber-500">85%</div>
                                          <div className="text-[10px] text-gray-500 uppercase">Engajamento</div>
                                      </div>
                                  </div>
                                  <div className="space-y-3">
                                      {[1,2,3].map(i => (
                                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-white/5">
                                              <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                                              <div className="flex-1">
                                                  <div className="h-2 w-24 bg-gray-600 rounded mb-1"></div>
                                                  <div className="h-1.5 w-16 bg-gray-700 rounded"></div>
                                              </div>
                                              <div className="text-green-500"><Play size={12}/></div>
                                          </div>
                                      ))}
                                  </div>
                                  <button className="mt-6 w-full py-3 bg-amber-600/20 text-amber-500 border border-amber-600/30 rounded-xl text-xs font-bold uppercase tracking-widest">
                                      Acessar Painel
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- TESTIMONIALS (MASONRY STYLE) --- */}
      <section className="py-24 bg-gradient-to-b from-black to-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-center text-3xl font-serif font-bold mb-16">Vozes do Reino</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                      { name: "Pr. Ricardo", role: "Líder de Jovens", text: "Mudou completamente como preparo meus estudos. A IA me dá insights que levariam horas para encontrar em livros.", star: 5 },
                      { name: "Ana Clara", role: "Estudante", text: "A arte sacra me ajuda a visualizar o que estou lendo. É inspirador compartilhar no Instagram!", star: 5 },
                      { name: "Marcos V.", role: "Membro", text: "O sistema de gamificação me fez ler a Bíblia todos os dias há 3 meses. Incrível.", star: 5 }
                  ].map((t, i) => (
                      <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex gap-1 mb-4 text-bible-gold">
                              {[...Array(t.star)].map((_, si) => <Star key={si} size={14} fill="currentColor" />)}
                          </div>
                          <p className="text-gray-300 italic mb-6">"{t.text}"</p>
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600"></div>
                              <div>
                                  <h4 className="font-bold text-sm">{t.name}</h4>
                                  <p className="text-[10px] text-gray-500 uppercase">{t.role}</p>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-32 px-6 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-bible-gold/20 to-transparent pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl">
              <Crown size={64} className="text-bible-gold mx-auto mb-6 animate-pulse-slow" />
              <h2 className="text-4xl md:text-6xl font-serif font-black mb-6">Sua jornada começa agora.</h2>
              <p className="text-gray-400 mb-10 text-lg">Junte-se a milhares de cristãos que estão redescobrindo a Palavra através da tecnologia.</p>
              
              <button 
                onClick={() => openLogin()}
                className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.3)]"
              >
                  Criar Conta Gratuita
              </button>
              <p className="mt-6 text-xs text-gray-500">Sem cartão de crédito necessário • Plano gratuito disponível</p>
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
    </div>
  );
};

export default LandingPageV2;