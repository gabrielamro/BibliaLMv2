"use client";


import React, { useState } from 'react';
import { X, Heart, Copy, Check, ExternalLink } from 'lucide-react';
import { DONATION_CONFIG } from '../constants';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(DONATION_CONFIG.pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-md rounded-2xl shadow-2xl border border-bible-gold/30 overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-bible-gold to-yellow-600 p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-bible-gold">
            <Heart size={32} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-1">Seja um Doador</h2>
          <p className="text-white/90 text-sm">Ajude a manter a Palavra acessível a todos</p>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed text-sm">
            Este projeto é mantido por ofertas voluntárias. Sua contribuição ajuda a cobrir custos de servidor e desenvolvimento, permitindo que a BíbliaLM continue abençoando vidas gratuitamente.
          </p>

          {/* Pix Section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chave PIX (Oferta)</span>
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo%E2%80%94pix_powered_by_Banco_Central_%28Brazil%2C_2020%29.svg" alt="Pix" className="h-4 opacity-70" />
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-black p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-mono truncate text-gray-700 dark:text-gray-300">
                {DONATION_CONFIG.pixKey}
              </code>
              <button 
                onClick={handleCopyPix}
                className={`p-3 rounded-lg transition-all flex-shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-bible-leather dark:bg-bible-gold text-white hover:opacity-90'}`}
                title="Copiar Chave"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">
              Banco: {DONATION_CONFIG.bankName} <br/> 
              <span className="opacity-75">Titular: {DONATION_CONFIG.pixName}</span>
            </p>
          </div>

          {/* External Link */}
          {DONATION_CONFIG.supportLink && (
            <a 
              href={DONATION_CONFIG.supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-bible-gold/10 text-bible-gold dark:text-yellow-400 rounded-xl font-bold hover:bg-bible-gold/20 transition-colors"
            >
              Outras formas de apoiar
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
