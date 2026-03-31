"use client";
import { useNavigate } from '../utils/router';
import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, Coffee, MessageCircle, Mic2, 
  Image as ImageIcon, Users, Church, Trophy, 
  Layout, PenTool, Search, ArrowRight, Sparkles, 
  Map, GraduationCap, Crown, Target, Heart, 
  ChevronRight
} from 'lucide-react';
import { INSPIRATIONAL_VERSES } from '../constants';
import SEO from '../components/SEO';

interface FeatureItem {
  title: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  bgGradient: string;
  badge?: string;
}

const categoryConfig = {
  fundamentos: {
    title: "Fundamentos",
    subtitle: "Crescimento diário",
    gradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400"
  },
  comunidade: {
    title: "Comunidade",
    subtitle: "Conexão",
    gradient: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
    border: "border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400"
  },
  ia: {
    title: "Inteligência",
    subtitle: "IA Avançada",
    gradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    border: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400"
  },
  pastoral: {
    title: "Pastoral",
    subtitle: "Liderança",
    gradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400"
  }
};

const MobileCategorySection: React.FC<{ 
  title: string; 
  subtitle: string; 
  items: FeatureItem[];
  config: typeof categoryConfig.fundamentos;
  onNavigate: (path: string) => void;
}> = ({ title, subtitle, items, config, onNavigate }) => (
  <div className={`rounded-3xl p-4 mb-4 bg-gradient-to-br ${config.gradient} border ${config.border}`}>
    <div className="flex items-center gap-2 mb-4">
      <div className={`p-2 rounded-xl ${config.iconBg}`}>
        <Map className={`w-4 h-4 ${config.iconColor}`} />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          onClick={() => onNavigate(item.path)}
          className="group bg-white dark:bg-black/40 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 hover:border-bible-gold/50 hover:shadow-lg transition-all duration-300 active:scale-95 cursor-pointer"
        >
          <div className={`w-8 h-8 rounded-xl ${item.bgGradient} flex items-center justify-center mb-2`}>
            {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: `w-4 h-4 ${item.color}` })}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.title}</span>
            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-bible-gold transition-colors" />
          </div>
          {item.badge && (
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-bible-gold text-white text-[9px] font-black">{item.badge}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

const MobileFeatureItem: React.FC<{ item: FeatureItem; onClick: () => void }> = ({ item, onClick }) => (
  <div 
    onClick={onClick}
    className="group bg-white dark:bg-bible-darkPaper p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-bible-gold/50 flex items-center gap-3 cursor-pointer active:scale-95 transition-all"
  >
    <div className={`w-10 h-10 rounded-xl ${item.bgGradient} flex items-center justify-center shrink-0`}>
      {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 ${item.color}` })}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</h3>
        {item.badge && <span className="px-2 py-0.5 rounded-full bg-bible-gold text-white text-[9px] font-black">{item.badge}</span>}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.desc}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-bible-gold transition-colors shrink-0" />
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

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, colorClass, badge, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-bible-gold/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
  >
    <div className={`absolute top-0 right-0 p-24 opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${colorClass.replace('text-', 'bg-')}`} style={{ borderRadius: '50%' }}></div>
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} dark:opacity-80`}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-7 h-7 ${colorClass}` })}
        </div>
        {badge && (
          <span className="px-3 py-1 rounded-full bg-bible-gold text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
            {badge}
          </span>
        )}
      </div>
      
      <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2 group-hover:text-bible-gold transition-colors">
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
      id: "fundamentos",
      items: [
        { 
          title: "Bíblia Sagrada", 
          desc: "Leitura fluida, versões, marcação e modo foco.", 
          icon: <BookOpen />, 
          path: "/biblia", 
          color: "text-blue-600", 
          bgGradient: "bg-blue-100 dark:bg-blue-900/50"
        },
        { 
          title: "Pão Diário", 
          desc: "Devocionais diários com IA baseados no calendário.", 
          icon: <Coffee />, 
          path: "/devocional", 
          color: "text-orange-600",
          bgGradient: "bg-orange-100 dark:bg-orange-900/50",
          badge: "Novo"
        },
        { 
          title: "Meta de Leitura", 
          desc: "Acompanhe seu progresso anual e defina metas.", 
          icon: <Target />, 
          path: "/plano", 
          color: "text-green-600",
          bgGradient: "bg-green-100 dark:bg-green-900/50"
        },
      ]
    },
    {
      id: "comunidade",
      items: [
        { 
          title: "Feed do Reino", 
          desc: "Compartilhe orações e reflexões com a comunidade.", 
          icon: <Users />, 
          path: "/", 
          color: "text-purple-600",
          bgGradient: "bg-purple-100 dark:bg-purple-900/50"
        },
        { 
          title: "Minha Igreja", 
          desc: "Encontre sua igreja e interaja com líderes.", 
          icon: <Church />, 
          path: "/social/explore", 
          color: "text-yellow-600",
          bgGradient: "bg-yellow-100 dark:bg-yellow-900/50"
        },
        { 
          title: "Desafio da Sabedoria", 
          desc: "Teste seus conhecimentos no Quiz bíblico.", 
          icon: <Trophy />, 
          path: "/quiz", 
          color: "text-red-500",
          bgGradient: "bg-red-100 dark:bg-red-900/50"
        },
      ]
    },
    {
      id: "ia",
      items: [
        { 
          title: "Conselheiro IA", 
          desc: "Tire dúvidas teológicas com orientação bíblica.", 
          icon: <MessageCircle />, 
          path: "/chat", 
          color: "text-indigo-600",
          bgGradient: "bg-indigo-100 dark:bg-indigo-900/50"
        },
        { 
          title: "Estúdio Criativo", 
          desc: "Crie imagens sacras e podcasts automaticamente.", 
          icon: <Sparkles />, 
          path: "/estudio-criativo", 
          color: "text-pink-600",
          bgGradient: "bg-pink-100 dark:bg-pink-900/50",
          badge: "Premium"
        },
      ]
    },
    {
      id: "pastoral",
      items: [
        { 
          title: "Workspace Pastoral", 
          desc: "Crie jornadas de discipulado e estudos.", 
          icon: <Layout />, 
          path: "/workspace-pastoral", 
          color: "text-emerald-600",
          bgGradient: "bg-emerald-100 dark:bg-emerald-900/50"
        },
        { 
          title: "Meus Estudos", 
          desc: "Biblioteca pessoal com notas e sermões salvos.", 
          icon: <GraduationCap />, 
          path: "/estudos", 
          color: "text-amber-600",
          bgGradient: "bg-amber-100 dark:bg-amber-900/50"
        },
      ]
    }
  ];

  return (
    <div className="h-full bg-bible-paper dark:bg-black/20 overflow-y-auto">
      <SEO title="Navegar" description="Todas as funcionalidades do BíbliaLM." />
      
      <div className="max-w-7xl mx-auto pb-32">
        
        {/* MOBILE: Header elegante */}
        <div className="md:hidden bg-gradient-to-br from-bible-leather via-bible-leather/90 to-black p-5 pt-6 pb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur">
              <Map className="w-5 h-5 text-bible-gold" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-black text-white">Navegar</h1>
              <p className="text-xs text-gray-300">Todas as funcionalidades</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <p className="text-xs text-gray-300 italic">"{randomVerse.text}"</p>
            <p className="text-[10px] text-bible-gold font-bold uppercase mt-1">{randomVerse.ref}</p>
          </div>
        </div>

        {/* MOBILE: Categorias organizadas */}
        <div className="md:hidden px-3 pt-4 -mt-4">
          {sections.map((section) => (
            <MobileCategorySection
              key={section.id}
              title={categoryConfig[section.id as keyof typeof categoryConfig].title}
              subtitle={categoryConfig[section.id as keyof typeof categoryConfig].subtitle}
              items={section.items}
              config={categoryConfig[section.id as keyof typeof categoryConfig]}
              onNavigate={(path) => navigate(path)}
            />
          ))}
        </div>

        {/* DESKTOP: Hero Banner */}
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

        {/* DESKTOP: Seções */}
        <div className="hidden md:block p-8 space-y-16">
          {sections.map((section, idx) => (
            <section key={idx} className="animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="mb-8 pl-4 border-l-4 border-bible-gold">
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-1">
                  {categoryConfig[section.id as keyof typeof categoryConfig].title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {categoryConfig[section.id as keyof typeof categoryConfig].subtitle}
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
        <div className="mx-3 md:mx-8 bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-8 md:p-10 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <Crown size={40} className="text-bible-gold mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-serif font-bold mb-4">Apoie o Projeto</h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-6 text-sm">
              Torne-se um assinante Visionário e desbloqueie o potencial ilimitado de todas as ferramentas de IA.
            </p>
            <button 
              onClick={() => navigate('/planos')}
              className="bg-bible-gold text-bible-leather px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg"
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
