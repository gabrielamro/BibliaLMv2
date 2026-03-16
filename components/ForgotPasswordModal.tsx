"use client";


import React, { useState, useEffect } from 'react';
import { X, Mail, Send, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, initialEmail = '' }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('E-mail não encontrado no sistema.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else {
        setError('Erro ao enviar email. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={24} />
        </button>

        {success ? (
          <div className="flex flex-col items-center text-center py-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2">E-mail Enviado!</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
              Verifique sua caixa de entrada (e spam) em <strong>{email}</strong>. Enviamos um link para você redefinir sua senha.
            </p>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-all"
            >
              Voltar ao Login
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-bible-gold/10 text-bible-gold rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Mail size={24} />
              </div>
              <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">Recuperar Acesso</h2>
              <p className="text-sm text-gray-500 mt-1">
                Digite seu e-mail para receber o link de redefinição.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in shake">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  placeholder="Seu e-mail cadastrado"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                  required
                  autoFocus
                />
              </div>

              <button 
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Enviar Link
              </button>
            </form>

            <button 
              onClick={onClose}
              className="w-full mt-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-widest flex items-center justify-center gap-1"
            >
              <ArrowLeft size={12} /> Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
