"use client";

import React, { useState } from 'react';
import { X, Lock, Check, AlertTriangle, Loader2, Save } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Verifica se o usuário fez login via OAuth (Google/Apple)
  const isSocialLogin = currentUser?.app_metadata?.provider !== 'email';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newPassword.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError("Por segurança, faça login novamente antes de alterar a senha.");
        // Opcional: Forçar logout após um tempo ou oferecer botão
      } else {
        setError("Erro ao alterar senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Alterar Senha</h2>
        </div>

        {isSocialLogin ? (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800 flex items-start gap-3">
            <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-orange-800 dark:text-orange-200">Conta Social</p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                Você faz login usando Google ou Apple. Para alterar sua senha, gerencie as configurações diretamente no seu provedor de e-mail.
              </p>
            </div>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-8 text-green-600 animate-in zoom-in">
            <Check size={48} className="mb-4" />
            <p className="font-bold">Senha alterada com sucesso!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm"
                placeholder="Repita a nova senha"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              Salvar Nova Senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;