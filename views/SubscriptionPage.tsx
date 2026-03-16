"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useMemo } from 'react';

import { Check, Crown, ShieldCheck, CreditCard, Zap, Star, ArrowLeft, Loader2, Info, Heart, Gift } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/paymentService';
import { SubscriptionTier, PlanFeatures } from '../types';
import SEO from '../components/SEO';

const FEATURE_DESCRIPTIONS: Record<keyof PlanFeatures, string> = {
    aiChatAccess: "Chat IA com Conselheiro Pastoral",
    aiImageGen: "Geração de Artes Sacras com IA",
    aiPodcastGen: "Criação de Podcasts Bíblicos",
    aiDeepAnalysis: "Análise Profunda NotebookLM",
    aiSermonBuilder: "Criador Estruturado de Sermões",
    aiNoteImprovement: "Melhoria de Anotações via IA",
    aiSocialCaptions: "Legendas Inteligentes para Social",
    churchFoundation: "Fundar e Gerir uma Igreja",
    churchAdminPanel: "Painel Administrativo da Igreja",
    cellCreation: "Criar e Gerenciar Células",
    muralPosting: "Postar no Mural da Comunidade",
    teamCompetition: "Participar de Gincanas",
    socialFeedRead: "Acesso ao Feed Social Global",
    socialFeedPost: "Publicar no Feed da Comunidade",
    globalHighlight: "Destaque nos Posts Globais",
    followingSystem: "Seguir outros Membros",
    profileCustomization: "Personalização de Perfil",
    readingPlans: "Acesso a Planos de Leitura",
    audioNarration: "Narração de Capítulos por Voz",
    unlimitedNotes: "Anotações Bíblicas Ilimitadas",
    achievementBadges: "Desbloquear Medalhas e Selos",
    advancedSearch: "Busca Bíblica por Termos",
    focusMode: "Modo de Leitura Foco",
    customThemes: "Temas Visuais Customizados",
    noAds: "Experiência Sem Anúncios"
};

const SubscriptionPage: React.FC = () => {
  const { currentUser, systemSettings, showNotification, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const getPrice = (planId: string, cycle: 'monthly' | 'yearly') => {
      const prices = systemSettings.subscription?.prices;
      if (planId === 'pastor') return cycle === 'monthly' ? 59.90 : 599.00;
      
      if (prices) {
          switch(planId) {
              case 'bronze': return cycle === 'monthly' ? prices.bronzeMonthly : prices.bronzeAnnual;
              case 'silver': return cycle === 'monthly' ? prices.silverMonthly : prices.silverAnnual;
              case 'gold': return cycle === 'monthly' ? prices.goldMonthly : prices.goldAnnual;
          }
      }
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      return cycle === 'monthly' ? (plan?.price || 0) : (plan?.priceAnnual || 0);
  };

  const getDynamicBenefits = (tierId: SubscriptionTier) => {
      if (!systemSettings.featuresMatrix || !systemSettings.featuresMatrix[tierId]) {
          return SUBSCRIPTION_PLANS.find(p => p.id === tierId)?.benefits || [];
      }
      
      const features = systemSettings.featuresMatrix[tierId];
      return (Object.keys(features) as Array<keyof PlanFeatures>)
          .filter(key => features[key])
          .map(key => FEATURE_DESCRIPTIONS[key])
          .slice(0, 8); 
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
        navigate('/');
        return;
    }

    if (!currentUser) {
        navigate('/login', { 
            state: { 
                from: location.pathname + location.search,
                openSubscription: true 
            } 
        });
        return;
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;

    setLoadingPlan(planId);
    try {
        const price = getPrice(planId, billingCycle);
        const title = `Apoio ${billingCycle === 'yearly' ? 'Anual' : 'Mensal'} BíbliaLM - ${plan.name}`;
        
        const sub = await paymentService.createSubscription(
            price, 
            title,
            currentUser.email
        );
        
        if (sub.initPoint) {
            window.location.href = sub.initPoint;
        } else {
            throw new Error("Erro ao gerar link.");
        }
    } catch (e: any) {
      showNotification("Não foi possível iniciar o checkout. Tente novamente.", "error");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-black/20 overflow-y-auto scroll-smooth">
      <SEO title="Seja um Apoiador" description="Invista na sua jornada espiritual e ajude a BíbliaLM a crescer." />
      
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 pb-32">
        
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-2 bg-bible-gold/10 text-bible-gold px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                <Heart size={14} fill="currentColor" /> Mantendo a Obra Digital
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-bible-leather dark:text-white mb-4">
                Seja um <span className="text-bible-gold">Apoiador</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                Escolha o nível de contribuição que melhor se adapta à sua busca por sabedoria. Seu apoio mantém nossos servidores ativos e a Palavra acessível.
            </p>
        </div>

        <div className="flex justify-center mb-16 animate-in fade-in duration-1000">
            <div className="bg-gray-200 dark:bg-gray-800 p-1.5 rounded-2xl flex items-center relative">
                <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all z-10 ${billingCycle === 'monthly' ? 'text-bible-leather dark:text-white' : 'text-gray-500'}`}
                >
                    Mensal
                </button>
                <button 
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all z-10 ${billingCycle === 'yearly' ? 'text-bible-leather dark:text-white' : 'text-gray-500'}`}
                >
                    Anual <span className="ml-1 text-[10px] text-green-500">-17%</span>
                </button>
                <div 
                    className={`absolute top-1.5 bottom-1.5 bg-white dark:bg-gray-700 rounded-xl shadow-md transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[50%] w-[calc(50%-6px)]'}`}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-20">
            {SUBSCRIPTION_PLANS.map((plan, idx) => {
                const price = getPrice(plan.id, billingCycle);
                const isCurrent = userProfile?.subscriptionTier === plan.id;
                const isGold = plan.id === 'gold';
                const isPastor = plan.id === 'pastor';
                const isFree = plan.id === 'free';
                const benefits = getDynamicBenefits(plan.id as SubscriptionTier);
                
                return (
                    <div 
                        key={plan.id}
                        className={`relative flex flex-col p-6 rounded-[2rem] border-2 transition-all duration-500 hover:scale-[1.02] ${
                            isGold || isPastor
                            ? 'bg-bible-leather dark:bg-bible-darkPaper border-bible-gold shadow-2xl text-white' 
                            : isFree
                                ? 'bg-white dark:bg-bible-darkPaper border-gray-100 dark:border-gray-800 shadow-lg opacity-90'
                                : 'bg-white dark:bg-bible-darkPaper border-gray-100 dark:border-gray-800 shadow-xl'
                        } animate-in fade-in slide-in-from-bottom-8`}
                        style={{ animationDelay: `${idx * 150}ms` }}
                    >
                        {(isGold || isPastor) && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-bible-gold text-bible-leather px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
                                {isPastor ? 'Liderança' : 'Recomendado'}
                            </div>
                        )}

                        <div className="mb-6 text-center md:text-left">
                            <h3 className={`text-lg font-black uppercase tracking-[0.2em] mb-4 ${isGold || isPastor ? 'text-bible-gold' : 'text-gray-400'}`}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline justify-center md:justify-start gap-1">
                                {isFree ? (
                                    <span className="text-3xl font-black text-gray-400">GRÁTIS</span>
                                ) : (
                                    <>
                                        <span className="text-xl font-bold">R$</span>
                                        <span className="text-4xl font-black">{price.toFixed(2).split('.')[0]}</span>
                                        <span className="text-lg font-bold">,{price.toFixed(2).split('.')[1]}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {benefits.map((benefit, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs leading-tight">
                                    <div className={`mt-0.5 p-0.5 rounded-full ${isGold || isPastor ? 'bg-bible-gold/20 text-bible-gold' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <span className={isGold || isPastor ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}>{benefit}</span>
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={loadingPlan !== null || isCurrent}
                            className={`w-full py-4 rounded-[1.2rem] font-black uppercase tracking-[0.1em] text-[10px] transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                                isCurrent 
                                ? 'bg-gray-100 text-gray-400 cursor-default' 
                                : isGold || isPastor
                                    ? 'bg-bible-gold text-bible-leather hover:bg-white' 
                                    : isFree
                                        ? 'bg-gray-50 text-gray-500 border border-gray-200'
                                        : 'bg-bible-leather dark:bg-bible-gold text-white dark:text-black hover:opacity-90'
                            }`}
                        >
                            {loadingPlan === plan.id ? (
                                <Loader2 className="animate-spin" size={14} />
                            ) : isCurrent ? (
                                'Seu Plano'
                            ) : isFree ? (
                                'Continuar'
                            ) : (
                                <>Apoiar <Gift size={14} /></>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>

        <div className="max-w-3xl mx-auto p-8 bg-white dark:bg-bible-darkPaper rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm text-center">
            <ShieldCheck size={48} className="mx-auto text-bible-gold mb-4 opacity-20" />
            <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2">Segurança em Primeiro Lugar</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
                Utilizamos o checkout seguro do Mercado Pago. Seus dados estão protegidos e você pode cancelar sua renovação a qualquer momento diretamente no painel de sua conta.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
