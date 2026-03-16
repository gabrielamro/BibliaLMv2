"use client";
import { useNavigate } from '../utils/router';


import React, { useState } from 'react';
import { ArrowLeft, MessageSquareHeart, Send, Loader2, Mail, User, HelpCircle } from 'lucide-react';

import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';

const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, showNotification } = useAuth();
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !email.trim()) return;

    setIsSending(true);
    try {
        await dbService.createSupportTicket(
            currentUser?.uid || 'anonymous',
            email,
            userProfile?.displayName || 'Visitante',
            subject,
            message
        );
        setSent(true);
        setSubject('');
        setMessage('');
        showNotification("Chamado aberto com sucesso!", "success");
    } catch (e) {
        showNotification("Erro ao enviar mensagem.", "error");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto p-6 md:p-12">
      <SEO title="Suporte e Ajuda" />
      <div className="max-w-2xl mx-auto">
        
        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto mb-4 border border-blue-100 dark:border-blue-800">
              <MessageSquareHeart size={40} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">Central de Ajuda</h1>
            <p className="text-gray-500">Estamos aqui para servir. Envie sua dúvida, sugestão ou reporte um problema.</p>
          </div>

          {sent ? (
              <div className="text-center py-12 bg-green-50 dark:bg-green-900/10 rounded-3xl border border-green-100 dark:border-green-800 animate-in zoom-in">
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">Mensagem Enviada!</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xs mx-auto">Nossa equipe recebeu seu chamado e responderá em breve no e-mail: <strong>{email}</strong></p>
                  <button onClick={() => setSent(false)} className="mt-6 text-green-700 font-bold underline text-sm">Enviar nova mensagem</button>
              </div>
          ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Seu E-mail</label>
                      <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="w-full pl-12 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 font-medium" 
                            placeholder="seu@email.com"
                            required
                          />
                      </div>
                  </div>

                  <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Assunto</label>
                      <div className="relative">
                          <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="text" 
                            value={subject} 
                            onChange={e => setSubject(e.target.value)} 
                            className="w-full pl-12 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 font-medium" 
                            placeholder="Ex: Problema no pagamento, Dúvida..."
                            required
                          />
                      </div>
                  </div>

                  <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Mensagem</label>
                      <textarea 
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 text-base min-h-[150px] resize-none" 
                        placeholder="Descreva detalhadamente como podemos ajudar..."
                        required
                      />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSending}
                    className="w-full py-5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                      {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} Enviar Solicitação
                  </button>
              </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
