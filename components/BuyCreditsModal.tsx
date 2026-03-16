"use client";


import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, QrCode, Loader2, ShieldCheck, Heart, ChevronLeft, ArrowRight } from 'lucide-react';
import { CREDIT_PACKAGES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/paymentService';
import { BlmCoinIcon } from './BlmCoinIcon';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose }) => {
  const { buyCredits, currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('gold'); // Default selection
  const [extraDonation, setExtraDonation] = useState<string>(''); 
  
  // Payment State
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [qrCodePayload, setQrCodePayload] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved'>('idle');

  const activePackage = CREDIT_PACKAGES.find(p => p.id === selectedPackage) || CREDIT_PACKAGES[2];
  const pollIntervalRef = useRef<any>(null);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      setStatus('idle');
      setExtraDonation('');
      setIsLoadingQr(false);
    }
  }, [isOpen]);

  const stopPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  const getNumericDonation = () => {
    const val = parseFloat(extraDonation.replace(',', '.'));
    return isNaN(val) ? 0 : val;
  };

  const totalAmount = activePackage.price + getNumericDonation();

  const initiatePayment = async () => {
    setIsLoadingQr(true);
    setQrCodePayload('');
    setQrCodeImage('');
    
    try {
      const email = currentUser?.email || 'user@biblialm.com';
      const description = getNumericDonation() > 0 
        ? `BíbliaLM - ${activePackage.name} (+ Oferta)`
        : `BíbliaLM - ${activePackage.name}`;

      const payment = await paymentService.createPayment(
        totalAmount,
        description,
        email
      );

      setQrCodePayload(payment.qrCode || '');
      
      if (payment.qrCodeBase64) {
        setQrCodeImage(`data:image/png;base64,${payment.qrCodeBase64}`);
      } else {
        setQrCodeImage(`https://quickchart.io/qr?size=300&text=${encodeURIComponent(payment.qrCode || '')}&margin=1&ecLevel=M`);
      }

      setStatus('pending');
      startPolling(payment.id);

    } catch (e) {
      console.error("Erro ao criar pagamento", e);
      alert("Não foi possível gerar o Pix no momento. Tente mais tarde.");
    } finally {
      setIsLoadingQr(false);
    }
  };

  const resetSelection = () => {
    stopPolling();
    setStatus('idle');
  };

  const startPolling = (pid: string) => {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      const currentStatus = await paymentService.checkStatus(pid);
      if (currentStatus === 'approved') {
        handleApproved();
      }
    }, 3000);
  };

  const handleApproved = async () => {
    stopPolling();
    setStatus('approved');
    await buyCredits(activePackage.credits, 0); 
    // Auto close after 3 seconds
    setTimeout(() => {
      onClose();
      // Reset state after closing animation
      setTimeout(() => {
          setStatus('idle');
          setExtraDonation('');
      }, 500);
    }, 3000);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(qrCodePayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header Fixo */}
        <div className="flex-shrink-0 p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-bible-darkPaper z-10 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BlmCoinIcon className="text-bible-gold" size={24} />
                    Adquirir Moedas
                </h2>
                {status === 'idle' && <p className="text-xs text-gray-500 dark:text-gray-400">Escolha o melhor pacote para você</p>}
                {status === 'pending' && <p className="text-xs text-gray-500 dark:text-gray-400">Finalize o pagamento via Pix</p>}
            </div>
            <button 
                onClick={onClose}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <X size={20} className="text-gray-500" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
            
            {/* --- TELA 1: SELEÇÃO --- */}
            {status === 'idle' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                    
                    {/* Lista de Pacotes */}
                    <div className="space-y-3">
                        {CREDIT_PACKAGES.map(pkg => (
                            <div 
                                key={pkg.id}
                                onClick={() => setSelectedPackage(pkg.id)}
                                className={`relative cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                                    selectedPackage === pkg.id 
                                    ? 'border-bible-gold bg-bible-gold/5 dark:bg-yellow-900/10 shadow-md ring-1 ring-bible-gold/50' 
                                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-gray-300 dark:hover:border-gray-700'
                                }`}
                            >
                                {pkg.popular && (
                                    <span className="absolute -top-2 left-4 bg-yellow-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 uppercase tracking-wide">
                                        Mais Popular
                                    </span>
                                )}
                                
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPackage === pkg.id ? 'border-bible-gold' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {selectedPackage === pkg.id && <div className="w-3 h-3 bg-bible-gold rounded-full" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-base ${selectedPackage === pkg.id ? 'text-bible-leather dark:text-bible-gold' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {pkg.name}
                                        </h3>
                                        <p className="text-xs text-gray-500">{pkg.credits} Moedas</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="block text-lg font-bold text-gray-900 dark:text-white">R$ {pkg.price.toFixed(0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Oferta Extra */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                            <Heart size={16} className="text-red-500 fill-current" /> 
                            Oferta Extra (Opcional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                            <input 
                                type="number" 
                                value={extraDonation}
                                onChange={(e) => setExtraDonation(e.target.value)}
                                placeholder="0,00"
                                className="w-full pl-10 p-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-bible-gold outline-none font-bold text-lg"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 leading-tight">
                            Esta oferta ajuda a manter os servidores da BíbliaLM ativos para todos.
                        </p>
                    </div>

                </div>
            )}

            {/* --- TELA 2: PAGAMENTO (QR CODE) --- */}
            {status === 'pending' && (
                <div className="flex flex-col items-center animate-in slide-in-from-right-4 fade-in duration-300 py-2">
                    
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 relative">
                        {qrCodeImage ? (
                            <img src={qrCodeImage} alt="QR Code Pix" className="w-56 h-56 object-contain mix-blend-multiply" />
                        ) : (
                            <div className="w-56 h-56 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                Carregando QR Code...
                            </div>
                        )}
                        {/* Ping Animation */}
                        <div className="absolute -top-1 -right-1">
                            <span className="relative flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                            </span>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Valor Total</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">R$ {totalAmount.toFixed(2).replace('.', ',')}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Pix Copia e Cola</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white dark:bg-black p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-600 dark:text-gray-300 break-all line-clamp-2">
                                    {qrCodePayload}
                                </div>
                                <button 
                                    onClick={handleCopyPix}
                                    className={`self-stretch px-4 rounded-lg font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 ${copied ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300'}`}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? 'Copiado' : 'Copiar'}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900/50 py-2 rounded-lg">
                            <Loader2 size={12} className="animate-spin" /> Aguardando confirmação do pagamento...
                        </div>
                    </div>
                </div>
            )}

            {/* --- TELA 3: SUCESSO --- */}
            {status === 'approved' && (
                <div className="flex flex-col items-center justify-center h-full py-10 animate-in zoom-in fade-in duration-500">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/20">
                        <Check className="text-green-600 dark:text-green-400 w-12 h-12" strokeWidth={3} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center">Pagamento Confirmado!</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
                        Seus créditos foram adicionados com sucesso.<br/>Obrigado por apoiar este projeto!
                    </p>
                    <div className="flex items-center gap-2 text-bible-gold font-bold text-lg bg-bible-gold/10 px-6 py-3 rounded-full">
                        <BlmCoinIcon size={20} /> +{activePackage.credits} Moedas
                    </div>
                </div>
            )}

        </div>

        {/* Footer Actions (Sticky) */}
        {status !== 'approved' && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-bible-darkPaper z-10">
                {status === 'idle' ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm text-gray-500">Total:</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <button 
                            onClick={initiatePayment}
                            disabled={isLoadingQr}
                            className="w-full py-4 bg-gradient-to-r from-bible-gold to-yellow-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoadingQr ? <Loader2 className="animate-spin" /> : <QrCode size={20} />}
                            Gerar Pix
                        </button>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                            <ShieldCheck size={12} /> Pagamento seguro via Mercado Pago
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={resetSelection}
                        className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <ChevronLeft size={18} /> Voltar / Alterar Pacote
                    </button>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default BuyCreditsModal;
