"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Sparkles, Loader2, BookOpenCheck, ArrowRight, Save, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';

import { ChatMessage } from '../types';
import { sendMessageToGeminiStream } from '../services/pastorAgent';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';

const AIChat: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recordActivity, currentUser, openLogin, checkFeatureAccess, incrementUsage, openSubscription } = useAuth();
  const { context: initialContext } = (location.state as { context?: string }) || {};
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Graça e paz! Sou seu conselheiro espiritual. Como posso ajudar seu estudo bíblico hoje?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialContext) {
      setInputText(`Gostaria de estudar sobre: "${initialContext}"`);
    }
  }, [initialContext]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || isLoading) return;

    const canChat = checkFeatureAccess('aiChatAccess');
    if (!canChat) {
        if (!currentUser) openLogin();
        else setShowLimitModal(true);
        return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: textToSend };
    const aiMsgId = (Date.now() + 1).toString();
    const placeholderAiMsg: ChatMessage = { id: aiMsgId, role: 'model', content: '' };

    setMessages(prev => [...prev, userMsg, placeholderAiMsg]);
    setInputText('');
    setIsLoading(true);

    let accumulatedResponse = "";
    try {
        await sendMessageToGeminiStream(
            [...messages, userMsg], 
            (chunk) => {
              accumulatedResponse += chunk;
              setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, content: accumulatedResponse } : msg));
            },
            initialContext
        );
        await incrementUsage('chat');
        if (currentUser) await recordActivity('use_chat', 'Conversa com IA');
    } catch (e) {}
    
    setIsLoading(false);
  };

  const handleAction = (action: { type: string, [key: string]: any }) => {
      if (!currentUser) {
          openLogin();
          return;
      }
      switch(action.type) {
          case 'save_study': navigate('/estudo', { state: { text: messages[messages.length-1].content, source: 'chat' } }); break;
          case 'open_devotional': navigate('/devocional'); break;
          case 'create_plan': navigate('/plano'); break;
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    const suggestionsMatch = msg.content.match(/<<<SUGGESTIONS:(.*?)>>>/);
    const actionMatch = msg.content.match(/<<<ACTION:(.*?)>>>/);
    let displayContent = msg.content.replace(/<<<SUGGESTIONS:.*?>>>/g, '').replace(/<<<ACTION:.*?>>>/g, '').trim();
    let suggestions: string[] = [];
    let actionData: any = null;
    if (suggestionsMatch) try { suggestions = JSON.parse(suggestionsMatch[1]); } catch(e) {}
    if (actionMatch) try { actionData = JSON.parse(actionMatch[1]); } catch(e) {}
    const isLastModelMessage = msg.role === 'model' && msg.id === messages[messages.length - 1].id;

    return (
      <div className="flex flex-col gap-3" data-testid="chat-message">
          <div className={`rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-tr-none' : 'bg-white dark:bg-bible-darkPaper border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>
            <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed" data-testid="message-content">{displayContent}{isLoading && isLastModelMessage && <span className="inline-block w-1.5 h-4 ml-1 bg-bible-gold animate-pulse align-middle" />}</div>
            {msg.role === 'model' && msg.content.length > 0 && !isLoading && (
              <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-start gap-2 opacity-60"><ShieldAlert size={12} className="mt-0.5 shrink-0" /><p className="text-[10px] leading-tight italic">Esta é uma reflexão auxiliada por IA. Sempre examine as Escrituras (Atos 17:11) e consulte sua liderança.</p></div>
            )}
          </div>
          {!isLoading && isLastModelMessage && actionData && (<button onClick={() => handleAction(actionData)} className="flex items-center justify-center gap-2 w-full py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800 rounded-xl text-xs font-bold transition-all hover:bg-green-100">{actionData.type === 'save_study' ? <Save size={14}/> : actionData.type === 'create_plan' ? <Calendar size={14}/> : <Sparkles size={14}/>}{actionData.type === 'save_study' ? 'Salvar Estudo com IA' : 'Realizar Ação Recomendada'}</button>)}
          {!isLoading && isLastModelMessage && suggestions.length > 0 && (<div className="flex flex-wrap gap-2 mt-1 animate-in fade-in slide-in-from-bottom-2">{suggestions.map((s, i) => (<button key={i} onClick={() => handleSend(s)} className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-[10px] font-bold border border-gray-200 dark:border-gray-700 hover:border-bible-gold hover:text-bible-gold transition-colors flex items-center gap-1.5 group">{s} <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /></button>))}</div>)}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black/50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-bible-darkPaper flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-bible-gold/20 flex items-center justify-center text-bible-gold"><Sparkles size={20} /></div><div><h2 className="font-semibold text-gray-900 dark:text-gray-100">Conselheiro Virtual</h2><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estudo • Entendimento • Fé</p></div></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg) => ((msg.content || msg.role === 'user') ? (<div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}><div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600' : 'bg-bible-gold text-white'}`}>{msg.role === 'user' ? <User size={16} /> : <BookOpenCheck size={16} />}</div><div className="max-w-[85%] flex flex-col items-start gap-1">{renderMessageContent(msg)}</div></div>) : null))}
        <div ref={messagesEndRef} className="h-10" />
      </div>
      {!currentUser && (
        <div className="px-4 py-2 bg-bible-gold/10 text-center border-t border-bible-gold/20">
          <p className="text-[10px] font-black uppercase text-bible-leather dark:text-bible-gold tracking-widest">
            Acesse sua conta para histórico ilimitado e ganhos de Maná!
          </p>
        </div>
      )}
      <div className="p-4 bg-white dark:bg-bible-darkPaper border-t border-gray-200 dark:border-gray-800"><div className="max-w-4xl mx-auto">{initialContext && messages.length < 3 && (<div className="mb-3 text-[10px] font-bold bg-bible-gold/10 text-bible-leather dark:text-bible-gold px-3 py-1.5 rounded-lg w-fit max-w-full truncate border border-bible-gold/20 flex items-center gap-2"><CheckCircle2 size={12}/> Contexto: {initialContext}</div>)}<div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-[1.5rem] p-2 focus-within:ring-2 ring-bible-gold/30 transition-all border border-transparent focus-within:bg-white dark:focus-within:bg-gray-900"><textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} data-testid="chat-input" placeholder="Pergunte sobre um versículo ou tema..." className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium" rows={1}/><button onClick={() => handleSend()} data-testid="chat-send" disabled={!inputText.trim() || isLoading} className="p-3 bg-bible-gold hover:bg-yellow-600 text-white rounded-xl disabled:opacity-50 transition-all shadow-md active:scale-95 flex-shrink-0">{isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}</button></div></div></div>
      
      <ConfirmationModal 
            isOpen={showLimitModal} 
            onClose={() => setShowLimitModal(false)} 
            onConfirm={() => openSubscription()} 
            title="Limite Diário de Chat" 
            message="Sua cota de mensagens do plano gratuito esgotou por hoje. Assine para continuar conversando sem limites." 
            confirmText="Conhecer Planos Premium" 
            variant="warning" 
      />
    </div>
  );
};

export default AIChat;