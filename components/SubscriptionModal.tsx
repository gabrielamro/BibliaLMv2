"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';

import React, { useState } from 'react';

import { X, Check, Loader2, Crown, ShieldCheck, CreditCard, ExternalLink, Zap } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/paymentService';
import { SubscriptionTier } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, systemSettings, showNotification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionTier>('gold');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const activePlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[3];
  
  const getPrice = (planId: string, cycle: 'monthly' | 'yearly') => {
      const prices = systemSettings.subscription?.prices;
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

  const currentPrice = getPrice(selectedPlanId, billingCycle);

  const handleSubscribe = async () => {
    if (!currentUser) {
        onClose(); 
        navigate('/login', { 
            state: { 
                from: location,
                openSubscription: true 
            } 
        });
        return;
    }

    setLoading(true);
    try {
        const title = `Assinatura ${billingCycle === 'yearly' ? 'Anual' : 'Mensal'} BíbliaLM - ${activePlan.name}`;
        // O Mercado Pago gerencia os métodos de pagamento (Pix, Cartão) dentro do init_point
        const sub = await paymentService.createSubscription(
            currentPrice, 
            title,
            currentUser.email
        );
        
        if (sub.initPoint) {
            // Redireciona para o checkout seguro do Mercado Pago
            window.location.href = sub.initPoint;
        } else {
            throw new Error("Não foi possível gerar o link de pagamento.");
        }
    } catch (e: any) {
      console.error("Subscription Error:", e);
      showNotification("Erro ao iniciar checkout. Tente novamente mais tarde.", "error");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 dark:border-gray-800 relative">
        
        {/* Lado Esquerdo: Planos e Vantagens */}
        <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-2xl font-serif font-bold mb-6 text-gray-900 dark:text-white">Escolha seu Plano</h2>
            
            <div className="space-y-3">
                {SUBSCRIPTION_PLANS.filter(p => p.price > 0).map(plan => (
                    <div 
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id as SubscriptionTier)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedPlanId === plan.id ? 'border-bible-gold bg-white dark:bg-black shadow-md' : 'border-transparent bg-white dark:bg-gray-800 opacity-60'}`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${plan.id === 'gold' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                                <span className="font-bold text-gray-900 dark:text-white">{plan.name}</span>
                            </div>
                            <span className="font-black text-bible-gold text-lg">R$ {getPrice(plan.id, billingCycle).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center">
                <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-xl flex">
                    <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-gray-700 shadow-sm text-bible-leather dark:text-white' : 'text-gray-500'}`}>Mensal</button>
                    <button onClick={() => setBillingCycle('yearly')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-gray-700 shadow-sm text-bible-leather dark:text-white' : 'text-gray-500'}`}>Anual (-17%)</button>
                </div>
            </div>
        </div>

        {/* Lado Direito: Checkout */}
        <div className="w-full md:w-[320px] p-8 flex flex-col justify-between bg-white dark:bg-bible-darkPaper">
            <div className="text-center">
                <div className="w-16 h-16 bg-bible-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-bible-gold">
                    <Crown size={32} />
                </div>
                <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-white">{activePlan.name}</h3>
                <p className="text-3xl font-black text-bible-gold mb-6">R$ {currentPrice.toFixed(2)}</p>
                
                <ul className="text-left space-y-3 mb-8">
                    {activePlan.benefits.slice(0, 4).map((b, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><Check size={14} className="text-green-500 shrink-0"/> {b}</li>
                    ))}
                </ul>
            </div>

            <div className="space-y-4">
                {/* Ícones de pagamento para clareza */}
                <div className="flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                    <img src="https://logodownload.org/wp-content/uploads/2016/10/visa-logo.png" alt="Visa" className="h-2" />
                    <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo.png" alt="Mastercard" className="h-3" />
                    <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-logo-2.png" alt="Pix" className="h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-tighter">Boleto</span>
                </div>

                <button 
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 flex flex-col items-center justify-center gap-1 disabled:opacity-50 transition-all"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            <span>Processando...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <CreditCard size={18}/> 
                            <span>Assinar Agora</span>
                        </div>
                    )}
                    {!loading && <span className="text-[8px] opacity-70">Redirecionamento Seguro</span>}
                </button>
                
                <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                    <ShieldCheck size={12} /> Pagamento Seguro via Mercado Pago
                </div>
            </div>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500"><X size={24}/></button>
      </div>
    </div>
  );
};

export default SubscriptionModal;