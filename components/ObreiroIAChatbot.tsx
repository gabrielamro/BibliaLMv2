"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageCircle, X, Send, Loader2, Sparkles, User,
    BookOpenCheck, Minimize2, Maximize2, ShieldAlert,
    ArrowRight, RotateCcw, ChevronDown, PenLine, ImageIcon, Mic2, Brain
} from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGeminiStream } from '../services/pastorAgent';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLocation, useNavigate } from '../utils/router';

const WELCOME_MESSAGE: ChatMessage = {
    id: 'welcome',
    role: 'model',
    content: 'Graça e paz! 🙏\n\nSou o **Obreiro IA**, seu assistente espiritual. Enquanto você cria conteúdo, estou aqui para ajudar com:\n\n• Pesquisas bíblicas rápidas\n• Contexto histórico e teológico\n• Referências cruzadas\n• Perguntas de exegese\n\nComo posso ajudar?'
};

const SUGGESTIONS = [
    'Explique João 3:16',
    'Contexto histórico do Êxodo',
    'Diferença entre graça e misericórdia',
    'Versículos sobre fé',
];

const ObreiroIAChatbot: React.FC = () => {
    const { currentUser, checkFeatureAccess, incrementUsage, recordActivity, openLogin, openSubscription } = useAuth();
    const { isFocusMode } = useSettings();
    const location = useLocation();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    // Entrance animation
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, messages, scrollToBottom]);

    // Pulse badge when closed and AI responds
    useEffect(() => {
        if (!isOpen && messages.length > 1) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'model' && lastMsg.content.length > 0) {
                setHasNewMessage(true);
            }
        }
    }, [messages, isOpen]);

    const handleOpen = () => {
        setIsOpen(true);
        setHasNewMessage(false);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

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

        let accumulatedResponse = '';
        try {
            await sendMessageToGeminiStream(
                [...messages, userMsg],
                (chunk) => {
                    accumulatedResponse += chunk;
                    setMessages(prev =>
                        prev.map(msg => msg.id === aiMsgId ? { ...msg, content: accumulatedResponse } : msg)
                    );
                },
                'Responda de forma concisa e objetiva para uso em pesquisa rápida durante criação de conteúdo ministerial.'
            );
            await incrementUsage('chat');
            if (currentUser) await recordActivity('use_chat', 'Pesquisa via Obreiro IA Popup');
        } catch (e) {
            setMessages(prev =>
                prev.map(msg => msg.id === aiMsgId ? { ...msg, content: 'Desculpe, tive um problema momentâneo. Tente novamente.' } : msg)
            );
        }
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReset = () => {
        setMessages([WELCOME_MESSAGE]);
    };

    const handleAction = (type: 'note' | 'image' | 'podcast' | 'quiz', content: string) => {
        if (type === 'note') {
            navigate('/notes', { state: { initialContent: content } });
        } else if (type === 'image') {
            navigate('/estudio-criativo', { state: { tool: 'image', initialPrompt: content } });
        } else if (type === 'podcast') {
            navigate('/estudio-criativo', { state: { tool: 'podcast', initialText: content } });
        } else if (type === 'quiz') {
            navigate('/quiz', { state: { initialTopic: content } });
        }
        setIsOpen(false);
    };

    const renderMessageContent = (msg: ChatMessage, isLast: boolean) => {
        // Simple markdown-like rendering
        const formatted = msg.content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');

        return (
            <div className="flex flex-col gap-2">
                <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                            ? 'bg-amber-600 text-white rounded-tr-none ml-6'
                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none mr-6'
                        }`}
                >
                    <div
                        className="whitespace-pre-wrap font-sans"
                        dangerouslySetInnerHTML={{ __html: formatted }}
                    />
                    {isLoading && isLast && msg.role === 'model' && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-amber-500 animate-pulse align-middle rounded-sm" />
                    )}
                    {msg.role === 'model' && msg.content.length > 0 && !isLoading && (
                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-start gap-1.5 opacity-50">
                            <ShieldAlert size={10} className="mt-0.5 shrink-0" />
                            <p className="text-[9px] leading-tight italic">Reflexão auxiliada por IA. Examine as Escrituras (At 17:11).</p>
                        </div>
                    )}
                    {msg.role === 'model' && msg.content.length > 0 && !isLoading && isLast && msg.id !== 'welcome' && (
                        <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <button
                                onClick={() => handleAction('note', msg.content)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold border border-amber-100 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                            >
                                <PenLine size={12} /> Criar Nota
                            </button>
                            <button
                                onClick={() => handleAction('image', msg.content)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold border border-blue-100 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                <ImageIcon size={12} /> Gerar Imagem
                            </button>
                            <button
                                onClick={() => handleAction('podcast', msg.content)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg text-[10px] font-bold border border-purple-100 dark:border-purple-800/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                            >
                                <Mic2 size={12} /> Podcast
                            </button>
                            <button
                                onClick={() => handleAction('quiz', msg.content)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold border border-blue-100 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                <Brain size={12} /> Quiz
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const chatWidth = isExpanded ? 'w-[calc(100vw-32px)] md:w-[520px]' : 'w-[calc(100vw-32px)] md:w-[380px]';
    const chatHeight = isExpanded ? 'h-[calc(100svh-140px)] md:h-[680px]' : 'h-[500px] md:h-[520px]';

    const isKingdomMode = location.pathname.startsWith('/social');

    if (!isVisible || isKingdomMode || isFocusMode) return null;

    return (
        <>
            {/* Floating Button */}
            <div
                className={`fixed ${isFocusMode ? 'bottom-4' : 'bottom-[90px]'} md:bottom-6 right-4 md:right-6 z-[200] flex flex-col items-end gap-3 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
            >
                {/* Chat Popup */}
                {isOpen && (
                    <div
                        ref={chatRef}
                        className={`${chatWidth} ${chatHeight} bg-white dark:bg-[#111] rounded-[1.75rem] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 origin-bottom-right`}
                        style={{
                            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(197,160,89,0.15)'
                        }}
                    >
                        {/* Chat Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-700 to-amber-600 rounded-t-[1.75rem] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm leading-none">Obreiro IA</h3>
                                    <p className="text-[10px] text-amber-200 font-medium mt-0.5">Pesquisa Bíblica Rápida</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleReset}
                                    title="Nova conversa"
                                    className="p-2 rounded-xl text-amber-200 hover:text-white hover:bg-white/15 transition-all"
                                >
                                    <RotateCcw size={15} />
                                </button>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    title={isExpanded ? 'Minimizar' : 'Expandir'}
                                    className="p-2 rounded-xl text-amber-200 hover:text-white hover:bg-white/15 transition-all"
                                >
                                    {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                                </button>
                                <button
                                    onClick={handleClose}
                                    title="Fechar"
                                    className="p-2 rounded-xl text-amber-200 hover:text-white hover:bg-white/15 transition-all"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gray-50 dark:bg-black/40">
                            {messages.map((msg, idx) => {
                                const isLast = idx === messages.length - 1;
                                if (!msg.content && msg.role !== 'user') return null;
                                return (
                                    <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user'
                                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                : 'bg-amber-600 text-white'
                                            }`}>
                                            {msg.role === 'user' ? <User size={13} /> : <BookOpenCheck size={13} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {renderMessageContent(msg, isLast)}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Quick Suggestions (only at start) */}
                            {messages.length === 1 && (
                                <div className="flex flex-wrap gap-2 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {SUGGESTIONS.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(s)}
                                            className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-[11px] font-semibold border border-gray-200 dark:border-gray-700 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 group shadow-sm"
                                        >
                                            {s}
                                            <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div ref={messagesEndRef} className="h-2" />
                        </div>

                        {/* Input area */}
                        <div className="shrink-0 px-4 py-3 bg-white dark:bg-[#0f0f0f] border-t border-gray-100 dark:border-gray-800">
                            {!currentUser && (
                                <div className="mb-2.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl text-[10px] font-bold text-center border border-amber-100 dark:border-amber-800/30">
                                    Faça login para histórico ilimitado e Maná!
                                </div>
                            )}
                            <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800/80 rounded-2xl p-2 focus-within:ring-2 ring-amber-500/30 transition-all border border-transparent focus-within:bg-white dark:focus-within:bg-gray-900">
                                <textarea
                                    ref={inputRef}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Pergunte sobre um versículo ou tema..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-24 min-h-[36px] py-2 px-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium outline-none"
                                    rows={1}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!inputText.trim() || isLoading}
                                    className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl disabled:opacity-40 transition-all shadow-md active:scale-95 flex-shrink-0"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                            <p className="text-center text-[9px] text-gray-400 mt-2 font-medium">
                                Enter para enviar • Shift+Enter para nova linha
                            </p>
                        </div>
                    </div>
                )}

                {/* FAB Button */}
                <button
                    onClick={isOpen ? handleClose : handleOpen}
                    className={`relative w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 group ${isOpen
                            ? 'bg-gray-700 dark:bg-gray-600 hover:bg-gray-800'
                            : 'bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 hover:scale-110'
                        }`}
                    style={{
                        boxShadow: isOpen
                            ? '0 8px 25px rgba(0,0,0,0.3)'
                            : '0 8px 25px rgba(197,117,0,0.4), 0 0 0 0 rgba(197,117,0,0.4)'
                    }}
                    title={isOpen ? 'Fechar Obreiro IA' : 'Abrir Obreiro IA'}
                >
                    {/* Pulsing ring (when closed) */}
                    {!isOpen && (
                        <span className="absolute inset-0 rounded-2xl animate-ping bg-amber-500/30 pointer-events-none" style={{ animationDuration: '2.5s' }} />
                    )}

                    {/* Badge */}
                    {hasNewMessage && !isOpen && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                        </span>
                    )}

                    {/* Icon */}
                    <div className="transition-transform duration-300 group-hover:scale-110">
                        {isOpen ? (
                            <ChevronDown size={22} className="text-white" />
                        ) : (
                            <Sparkles size={22} className="text-white" />
                        )}
                    </div>
                </button>
            </div>

            {/* Limit Modal */}
            {showLimitModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles size={28} className="text-amber-600" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Limite Diário Atingido</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Sua cota de mensagens gratuitas esgotou. Assine para pesquisar sem limites.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLimitModal(false)}
                                    className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Entendido
                                </button>
                                <button
                                    onClick={() => { openSubscription(); setShowLimitModal(false); }}
                                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
                                >
                                    Ver Planos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ObreiroIAChatbot;
