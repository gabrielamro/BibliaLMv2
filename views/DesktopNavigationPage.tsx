"use client";
import { useNavigate } from '../utils/router';

import React, { useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, Coffee, MessageCircle, Mic2, 
  Image as ImageIcon, Users, Church, Trophy, 
  Layout, PenTool, Search, ArrowRight, Sparkles, 
  Map, GraduationCap, Crown, Target, Heart
} from 'lucide-react';
import { INSPIRATIONAL_VERSES } from '../constants';
import SEO from '../components/SEO';

interface FeatureItem {
  title: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  badge?: string;
}

const MobileFeatureItem: React.FC<{ item: FeatureItem; onClick: () => void }> = ({ item, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white dark:bg-bible-darkPaper p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-bible-gold/50 flex items-center gap-3 cursor-pointer"
  >
    <div className={`p-2 rounded-xl ${item.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} dark:bg-opacity-10 shrink-0`}>
      {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 ${item.color}` })}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</h3>
        {item.badge && <span className="px-2 py-0.5 rounded-full bg-bible-gold text-white text-[9px] font-black">{item.badge}</span>}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.desc}</p>
    </div>
    <ArrowRight size={16} className="text-gray-300 shrink-0" />
  </div>
);

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  colorClass: string;
  badge?: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, path, colorClass, badge, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-bible-gold/50 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
  >
    <div className={`absolute top-0 right-0 p-20 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 ${colorClass.replace('text-', 'bg-')}`} style={{ borderRadius: '50%' }}></div>
    
    <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} dark:bg-opacity-10`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-6 h-6 ${colorClass}` })}
            </div>
            {badge && (
                <span className="px-3 py-1 rounded-full bg-bible-gold text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {badge}
                </span>
            )}
        </div>
        
        <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-2 group-hover:text-bible-gold transition-colors">
            {title}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 flex-1">
            {description}
        </p>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-bible-gold transition-colors uppercase tracking-widest">
            Acessar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
    </div>
  </div>
);

const DesktopNavigationPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const randomVerse = useMemo(() => {
    return INSPIRATIONAL_VERSES[Math.floor(Math.random() * INSPIRATIONAL_VERSES.length)];
  }, []);

  const sections = [
    {
      title: "Fundamentos da Fé",
      description: "As bases para o seu crescimento espiritual diário.",
      items: [
        { 
            title: "Bíblia Sagrada", 
            desc: "Leitura fluida, versões, marcação de versículos e modo foco para imersão total na Palavra.", 
            icon: <BookOpen />, 
            path: "/biblia", 
            color: "text-blue-600" 
        },
        { 
            title: "Pão Diário", 
            desc: "Devocionais gerados com IA baseados no calendário e temas relevantes para sua vida.", 
            icon: <Coffee />, 
            path: "/devocional", 
            color: "text-orange-600",
            badge: "Novo"
        },
        { 
            title: "Meta de Leitura", 
            desc: "Acompanhe seu progresso anual, defina metas e mantenha a constância na leitura.", 
            icon: <Target />, 
            path: "/plano", 
            color: "text-green-600" 
        },
      ]
    },
    {
      title: "Reino & Comunidade",
      description: "Conecte-se com o corpo de Cristo e compartilhe experiências.",
      items: [
        { 
            title: "Feed do Reino", 
            desc: "Compartilhe orações, testemunhos e reflexões com a comunidade global do BíbliaLM.", 
            icon: <Users />, 
            path: "/", 
            color: "text-purple-600" 
        },
        { 
            title: "Minha Igreja", 
            desc: "Encontre sua igreja, participe de gincanas e interaja com seus líderes locais.", 
            icon: <Church />, 
            path: "/social/explore", 
            color: "text-yellow-600" 
        },
        { 
            title: "Desafio da Sabedoria", 
            desc: "Teste seus conhecimentos bíblicos no Quiz e suba no ranking global.", 
            icon: <Trophy />, 
            path: "/quiz", 
            color: "text-red-500" 
        },
      ]
    },
    {
      title: "Ferramentas de Inteligência",
      description: "Tecnologia avançada para aprofundar seu entendimento.",
      items: [
        { 
            title: "Conselheiro IA", 
            desc: "Tire dúvidas teológicas, peça explicações de contexto e receba conselhos bíblicos.", 
            icon: <MessageCircle />, 
            path: "/chat", 
            color: "text-indigo-600" 
        },
        { 
            title: "Estúdio Criativo", 
            desc: "Crie imagens sacras baseadas em versículos e gere podcasts de estudo automaticamente.", 
            icon: <Sparkles />, 
            path: "/estudio-criativo", 
            color: "text-pink-600",
            badge: "Premium"
        },
      ]
    },
    {
      title: "Liderança & Pastoral",
      description: "Recursos para líderes, pastores e criadores de conteúdo.",
      items: [
        { 
            title: "Workspace Pastoral", 
            desc: "Crie jornadas de discipulado e séries de estudo para sua congregação.", 
            icon: <Layout />, 
            path: "/workspace-pastoral", 
            color: "text-emerald-600" 
        },
        { 
            title: "Meus Estudos", 
            desc: "Biblioteca pessoal com todas as suas notas, sermões e estudos salvos.", 
            icon: <GraduationCap />, 
            path: "/estudos/planos", 
            color: "text-amber-600" 
        },
      ]
    }
  ];

  return (
    <div className="h-full bg-bible-paper dark:bg-black/20 overflow-y-auto">
      <SEO title="Navegar" description="Todas as funcionalidades do BíbliaLM." />
      
      <div className="max-w-7xl mx-auto pb-32">
        
        {/* MOBILE: Header simples */}
        <div className="md:hidden bg-gradient-to-r from-bible-leather to-black p-4 pt-8">
          <h1 className="text-2xl font-serif font-black text-white mb-2">Navegar</h1>
          <p className="text-gray-300 text-sm">Todas as funcionalidades</p>
        </div>

        {/* DESKTOP: Hero Banner completo */}
        <div className="hidden md:block p-8">
          <div className="relative rounded-[3rem] overflow-hidden shadow-2xl bg-bible-leather dark:bg-black">
              <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-bible-leather/50 to-transparent"></div>
              
              <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="text-center md:text-left max-w-2xl">
                      <div className="inline-flex items-center gap-2 bg-bible-gold/20 text-bible-gold px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-bible-gold/30">
                          <Map size={14} /> Central de Navegação
                      </div>
                      <h1 className="text-4xl md:text-6xl font-serif font-black text-white mb-6 leading-tight">
                          Bem-vindo, <br/>
                          <span className="text-bible-gold">{userProfile?.displayName?.split(' ')[0] || 'Viajante'}</span>.
                      </h1>
                      <p className="text-gray-300 text-lg leading-relaxed mb-8">
                          Explore todas as ferramentas que preparamos para enriquecer sua jornada espiritual. 
                          Do estudo individual à liderança comunitária.
                      </p>
                  </div>

                  <div className="hidden md:block bg-white/10 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 max-w-md w-full">
                      <div className="flex items-start gap-4">
                          <Heart className="text-bible-gold shrink-0 mt-1" size={24} fill="currentColor" />
                          <div>
                              <p className="text-white font-serif italic text-xl leading-relaxed mb-4">
                                  "{randomVerse.text}"
                              </p>
                              <p className="text-bible-gold font-black text-xs uppercase tracking-widest">
                                  {randomVerse.ref}
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </div>

        {/* MOBILE: Grid 2 colunas */}
        <div className="md:hidden grid grid-cols-2 gap-3 p-3">
          {sections.flatMap((section, sIdx) => 
            section.items.map((item, iIdx) => (
              <MobileFeatureItem 
                key={`${sIdx}-${iIdx}`}
                item={item}
                onClick={() => navigate(item.path)}
              />
            ))
          )}
        </div>

        {/* DESKTOP: Sections com cards grandes */}
        <div className="hidden md:block p-8 space-y-16">
            {sections.map((section, idx) => (
                <section key={idx} className="animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="mb-8 pl-4 border-l-4 border-bible-gold">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-1">
                            {section.title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {section.description}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.items.map((item, itemIdx) => (
                            <FeatureCard 
                                key={itemIdx}
                                title={item.title}
                                description={item.desc}
                                icon={item.icon}
                                path={item.path}
                                colorClass={item.color}
                                badge={item.badge}
                                onClick={() => navigate(item.path)}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>

        {/* FOOTER CTA */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-10 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
                <Crown size={48} className="text-bible-gold mx-auto mb-4" />
                <h2 className="text-2xl font-serif font-bold mb-4">Apoie o Projeto</h2>
                <p className="text-gray-400 max-w-lg mx-auto mb-8 text-sm">
                    Torne-se um assinante Visionário e desbloqueie o potencial ilimitado de todas as ferramentas de Inteligência Artificial.
                </p>
                <button 
                    onClick={() => navigate('/planos')}
                    className="bg-bible-gold text-bible-leather px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg"
                >
                    Ver Planos Premium
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default DesktopNavigationPage;