"use client";


import React, { useRef, useEffect, useState } from 'react';
import {
    Bold, Italic, List, Heading1, Heading2, Quote, Undo, Eraser,
    Image as ImageIcon, Sparkles, Loader2, Lock, Mic,
    Heart, BookOpen, Zap, Hand, LayoutTemplate, ChevronDown, Maximize2, Minimize2, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { generateVerseImage } from '../services/pastorAgent';
import { optimizeImage, base64ToBlob } from '../utils/imageOptimizer';
import { uploadBlob } from '../services/supabase';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    placeholder = "Comece a escrever...",
    className = ""
}) => {
    const { currentUser, userProfile, openSubscription, showNotification, checkFeatureAccess } = useAuth();
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const recognitionRef = useRef<any>(null);
    const templateRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Close templates dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (templateRef.current && !templateRef.current.contains(event.target as Node)) {
                setShowTemplates(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const insertTemplate = (type: string) => {
        let html = '';
        switch (type) {
            case 'hero':
                html = `
                    <div class="bible-hero-box" style="border-radius: 20px; padding: 30px; margin-bottom: 30px; border-left: 5px solid #c5a059;">
                        <h2 class="bible-hero-title" style="margin-top: 0;">1. Abertura do Coração</h2>
                        <p style="font-size: 1.15em; line-height: 1.7;">Insira aqui uma introdução envolvente que conecte o tema ao coração do aluno...</p>
                    </div><p><br></p>`;
                break;
            case 'verse':
                html = `
                    <blockquote class="bible-verse-block" style="border-left: 4px solid #c5a059; padding: 30px; margin: 40px 0; font-size: 1.3em; font-style: italic; border-radius: 12px; position: relative;">
                        <span style="font-size: 3em; color: #c5a059; opacity: 0.2; position: absolute; left: 10px; top: -10px;">"</span>
                        <span>Insira o versículo bíblico principal aqui (Referência)</span>
                        <span style="font-size: 3em; color: #c5a059; opacity: 0.2; position: absolute; right: 10px; bottom: -30px;">"</span>
                    </blockquote><p><br></p>`;
                break;
            case 'application':
                html = `
                    <div class="bible-app-box" style="padding: 30px; border-radius: 20px; border: 1px solid #e5e7eb; margin: 30px 0; background: #fdfdfd;">
                        <h2 style="color: #c5a059; margin-top: 0; display: flex; items-center gap-2">🛡️ Passo Prático</h2>
                        <p>Como posso aplicar esta verdade bíblica na minha rotina hoje?</p>
                        <div style="padding: 15px; background: #f8fafc; border-radius: 12px; margin-top: 10px; border-left: 4px solid #c5a059;">
                            <strong>Ação:</strong> [Escreva aqui o compromisso de mudança]
                        </div>
                    </div><p><br></p>`;
                break;
            case 'context':
                html = `
                    <div class="bible-context-box" style="background: #f1f5f9; padding: 30px; border-radius: 20px; margin: 30px 0;">
                        <h2 style="margin-top: 0;">🏛️ Contexto e Mergulho</h2>
                        <p><strong>Cenário:</strong> [Descreva quem escreveu, para quem e por que]</p>
                        <p><strong>Significado:</strong> [Explique o contexto cultural ou original da mensagem]</p>
                    </div><p><br></p>`;
                break;
            case 'questions':
                html = `
                    <div class="bible-questions-box" style="padding: 30px; border-radius: 20px; border: 2px dashed #e2e8f0; margin: 30px 0;">
                        <h2 style="text-align: center; color: #475569;">🤔 Perguntas para Reflexão</h2>
                        <ol style="margin-top: 20px;">
                            <li>O que este texto revela sobre o caráter de Deus?</li>
                            <li>Existe algum comando para obedecer ou promessa para crer?</li>
                            <li>Como minha vida seria diferente se eu vivesse plenamente este versículo?</li>
                        </ol>
                    </div><p><br></p>`;
                break;
            case 'prayer':
                html = `
                    <div class="bible-footer-box" style="border-radius: 25px; padding: 40px; margin-top: 50px; text-align: center; background: linear-gradient(135deg, #fffcf5 0%, #fff 100%); border: 1px solid #f0e6d6;">
                        <h2 class="bible-footer-title" style="color: #c5a059; margin-top: 0;">🕊️ Oração de Consagração</h2>
                        <p class="bible-prayer" style="font-size: 1.2em; font-style: italic; color: #555;">" Pai, escreva esta verdade em meu coração. Que o Teu Espírito me capacite a viver segundo a Tua vontade. Em nome de Jesus, Amém. "</p>
                    </div><p><br></p>`;
                break;
        }

        if (html) {
            execFormat('insertHTML', html);
            setShowTemplates(false);
        }
    };

    // Sync content when it changes externally
    useEffect(() => {
        const safeContent = content || '';
        if (editorRef.current && editorRef.current.innerHTML !== safeContent) {
            editorRef.current.innerHTML = safeContent;
        }
    }, [content]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'pt-BR';

                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        execFormat('insertText', finalTranscript + ' ');
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                    showNotification("Erro no ditado por voz.", "error");
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            showNotification("Seu navegador não suporta ditado por voz.", "warning");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                showNotification("Ouvindo... Pode falar.", "info");
            } catch (e) {
                console.error(e);
            }
        }
    };

    const execFormat = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        triggerChange();
    };

    const triggerChange = () => {
        if (editorRef.current) {
            editorRef.current.focus();
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    // --- IMAGE HANDLING ---

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        try {
            showNotification("Otimizando e enviando imagem...", "info");
            const { base64 } = await optimizeImage(file);
            const blob = await base64ToBlob(base64);

            // Upload to storage
            const path = `editor_uploads/${currentUser.uid}/${Date.now()}_${file.name}`;
            const url = await uploadBlob(blob, path);

            // Insere a URL da imagem na posição do cursor
            execFormat('insertImage', url);
            e.target.value = ''; // Reset input
            showNotification("Imagem enviada com sucesso!", "success");
        } catch (err) {
            console.error(err);
            showNotification("Erro ao carregar imagem.", "error");
        }
    };

    const handleAiImageGeneration = async () => {
        // 1. Verificação de Plano (Gold ou Pastor)
        // const isPremium = userProfile?.subscriptionTier === 'gold' || userProfile?.subscriptionTier === 'pastor';
        // if (!isPremium) {
        //     if (confirm("A geração de imagens no editor é exclusiva para membros Visionários e Pastores. Deseja fazer o upgrade?")) {
        //         openSubscription();
        //     }
        //     return;
        // }

        // 2. Solicitar Prompt
        const promptText = prompt("Descreva a imagem que deseja gerar (ex: Um pastor de ovelhas em um vale verde):");
        if (!promptText || !promptText.trim()) return;

        setIsGeneratingAi(true);
        try {
            // Usa o serviço Gemini existente
            const result = await generateVerseImage(promptText, "Ilustração Bíblica", "cinematic");

            if (result && currentUser) {
                const base64 = `data:${result.mimeType};base64,${result.data}`;
                const blob = await base64ToBlob(base64);

                // Upload to storage to avoid large base64 strings in Firestore
                const path = `ai_generated/${currentUser.uid}/${Date.now()}.webp`;
                const url = await uploadBlob(blob, path);

                execFormat('insertImage', url);
                showNotification("Imagem gerada e inserida!", "success");
            } else {
                showNotification("A IA não conseguiu gerar a imagem. Tente descrever diferente.", "warning");
            }
        } catch (e) {
            console.error(e);
            showNotification("Erro de conexão com a IA.", "error");
        } finally {
            setIsGeneratingAi(false);
        }
    };

    return (
        <div className={`flex flex-col w-full h-full ${className} ${isFullScreen ? 'fixed inset-0 z-[200] bg-white dark:bg-gray-900 overflow-hidden animate-in fade-in duration-300' : 'relative'}`}>
            {/* CSS Scoped for the Editor Content */}
            <style>{`
            .rich-editor-content {
                font-family: 'Lora', serif;
                font-size: 1.125rem; /* 18px */
                line-height: 1.8;
            }
            @media (max-width: 768px) {
                .rich-editor-content {
                    font-size: 1.25rem; 
                    padding: 1.5rem !important;
                }
            }

            .rich-editor-content h1 { font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5em; color: #1a1a1a; }
            .dark .rich-editor-content h1 { color: #ffffff; }

            .rich-editor-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25em; }
            .dark .rich-editor-content h2 { color: #d1d5db; border-bottom-color: #374151; }

            .rich-editor-content h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; color: #4b5563; }
            .dark .rich-editor-content h3 { color: #d1d5db; }

            .rich-editor-content blockquote { border-left: 4px solid #c5a059; padding-left: 1em; color: #666; font-style: italic; margin: 1.5em 0; background-color: rgba(197, 160, 89, 0.1); padding: 1em; border-radius: 0 0.5em 0.5em 0; }
            .dark .rich-editor-content blockquote { color: #9ca3af; }

            .rich-editor-content p { margin-bottom: 1em; }
            .rich-editor-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
            .rich-editor-content li { margin-bottom: 0.5em; }
            .rich-editor-content b, .rich-editor-content strong { font-weight: 700; }
            /* Image Styling inside Editor */
            .rich-editor-content img {
                max-width: 100%;
                height: auto;
                border-radius: 12px;
                margin: 20px 0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                display: block;
            }

            /* Custom AI Content Classes (Light & Dark Compatible) */
            .rich-editor-content .bible-title { text-align: center; margin-top: 10px; }
            
            .rich-editor-content .bible-subtitle { text-align: center; color: #888; font-style: italic; font-size: 1.1em; margin-bottom: 30px; }
            .dark .rich-editor-content .bible-subtitle { color: #aaa; }

            .rich-editor-content .bible-hero-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px; }
            .dark .rich-editor-content .bible-hero-box { background: #1e293b; border-color: #334155; }

            .rich-editor-content .bible-hero-title { color: #c5a059; margin-top: 0; font-weight: 800; }
            .dark .rich-editor-content .bible-hero-title { color: #d4af37; }

            .rich-editor-content .bible-verse-block { background: #fdfaf5; border: 1px solid #f0e6d6; border-radius: 12px; }
            .dark .rich-editor-content .bible-verse-block { background: #1a1a1a; border-color: #c5a05933; }

            .rich-editor-content .bible-list-item { background: #ffffff; border: 1px solid #f1f5f9; }
            .dark .rich-editor-content .bible-list-item { background: #0f172a; border-color: #1e293b; }

            .rich-editor-content .bible-footer-box { background: #f8fafc; border-radius: 20px; padding: 40px; margin-top: 40px; text-align: center; }
            .dark .rich-editor-content .bible-footer-box { background: #0f172a; }

            .rich-editor-content .bible-footer-title { font-size: 1.5rem; margin-bottom: 15px; color: #c5a059; }
            
            .rich-editor-content .bible-prayer { font-style: italic; color: #475569; max-width: 600px; margin: auto; line-height: 1.8; }
            .dark .rich-editor-content .bible-prayer { color: #94a3b8; }
            
            .rich-editor-content .bible-details { margin-top: 15px; cursor: pointer; }
            .rich-editor-content .bible-details summary { font-weight: bold; outline: none; color: #c5a059; font-style: normal; font-size: 0.85em; user-select: none; }
            .dark .rich-editor-content .bible-details summary { color: #d4af37; }
            .rich-editor-content .bible-details-content { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0; color: #475569; font-size: 0.95em; line-height: 1.6; opacity: 0.9; }
            .dark .rich-editor-content .bible-details-content { border-top-color: #334155; color: #94a3b8; }
        `}</style>

            {/* Toolbar */}
            <div
                className={`${isFullScreen ? 'p-4 border-b-2' : 'sticky top-0 p-2 border-b'} z-10 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-1 shadow-sm`}
                onMouseDown={e => {
                    // Prevents focus loss when clicking buttons (keeps caret in the editor)
                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        e.preventDefault();
                    }
                }}
            >
                <button onClick={() => execFormat('formatBlock', 'H1')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0" title="Título Principal"><Heading1 size={18} /></button>
                <button onClick={() => execFormat('formatBlock', 'H2')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0" title="Subtítulo"><Heading2 size={18} /></button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
                <button onClick={() => execFormat('bold')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0" title="Negrito"><Bold size={18} /></button>
                <button onClick={() => execFormat('italic')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0" title="Itálico"><Italic size={18} /></button>
                <button onClick={() => {
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const blockquote = document.createElement('blockquote');
                        if (range.toString().length > 0) {
                            blockquote.textContent = range.toString();
                            range.deleteContents();
                            range.insertNode(blockquote);
                        } else {
                            blockquote.textContent = "Citação...";
                            range.insertNode(blockquote);
                        }
                        triggerChange();
                    }
                }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0" title="Citação"><Quote size={18} /></button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
                <button onClick={() => execFormat('insertUnorderedList')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0" title="Lista"><List size={18} /></button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 flex-shrink-0"></div>

                {/* Visual Blocks Menu */}
                <div className="relative" ref={templateRef}>
                    <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className={`p-2 px-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all flex items-center gap-2 flex-shrink-0 border ${showTemplates ? 'bg-orange-50 border-orange-200 text-orange-600' : 'border-transparent text-orange-600 dark:text-orange-400'}`}
                        title="Inserir Blocos Temáticos"
                    >
                        <LayoutTemplate size={18} />
                        <span className="text-sm font-black uppercase tracking-tight hidden sm:inline">Blocos</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
                    </button>

                    {showTemplates && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 grid grid-cols-1 gap-1 z-50 animate-in fade-in zoom-in duration-200">
                            <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertTemplate('hero'); }} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all text-left group">
                                <div className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl group-hover:scale-110 transition-transform"><Heart size={18} /></div>
                                <div>
                                    <div className="text-sm font-bold dark:text-white">Abertura / Gancho</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Box de introdução emocional</div>
                                </div>
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertTemplate('verse'); }} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all text-left group">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><BookOpen size={18} /></div>
                                <div>
                                    <div className="text-sm font-bold dark:text-white">Destaque Bíblico</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Versículo com aspas elegantes</div>
                                </div>
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertTemplate('context'); }} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all text-left group">
                                <div className="p-2.5 bg-slate-100 dark:bg-slate-900/30 text-slate-600 rounded-xl group-hover:scale-110 transition-transform"><LayoutTemplate size={18} /></div>
                                <div>
                                    <div className="text-sm font-bold dark:text-white">Contexto e Mergulho</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Análise histórica e cultural</div>
                                </div>
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertTemplate('application'); }} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all text-left group">
                                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Zap size={18} /></div>
                                <div>
                                    <div className="text-sm font-bold dark:text-white">Passo Prático</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Ação e transformação real</div>
                                </div>
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertTemplate('questions'); }} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all text-left group">
                                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><Zap size={18} /></div>
                                <div>
                                    <div className="text-sm font-bold dark:text-white">Perguntas de Reflexão</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Autoexame baseado no texto</div>
                                </div>
                            </button>
                            <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertTemplate('prayer'); }} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all text-left group">
                                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><Hand size={18} /></div>
                                <div>
                                    <div className="text-sm font-bold dark:text-white">Oração de Fé</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Box de encerramento e entrega</div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 flex-shrink-0"></div>

                {/* Image Buttons */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-blue-600 dark:text-blue-400 transition-colors flex-shrink-0"
                    title="Inserir Imagem (Upload)"
                >
                    <ImageIcon size={18} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />

                <button
                    onClick={handleAiImageGeneration}
                    disabled={isGeneratingAi}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 relative group ${isGeneratingAi ? 'bg-purple-100' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600'}`}
                    title="Gerar Imagem com IA (Premium)"
                >
                    {isGeneratingAi ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}

                    {/* Lock indicator if not premium (optional visual cue) */}
                    {!(userProfile?.subscriptionTier === 'gold' || userProfile?.subscriptionTier === 'pastor') && (
                        <div className="absolute -top-1 -right-1 bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
                            <Lock size={8} className="text-gray-400" />
                        </div>
                    )}
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
                <button onClick={() => execFormat('undo')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0" title="Desfazer"><Undo size={18} /></button>
                <button onClick={() => {
                    if (editorRef.current) {
                        editorRef.current.innerHTML = "";
                        onChange("");
                    }
                }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0" title="Limpar"><Eraser size={18} /></button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
                <button
                    onClick={toggleListening}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 flex items-center gap-1 ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    title="Ditar Texto"
                >
                    <Mic size={18} />
                    {isListening && <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Ouvindo...</span>}
                </button>

                <div className="flex-1" />

                <button 
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className={`p-2 rounded-xl transition-all ${isFullScreen ? 'bg-bible-gold text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`}
                    title={isFullScreen ? "Sair do Modo Foco" : "Modo Foco (Tela Cheia)"}
                >
                    {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>

                {isFullScreen && (
                    <button 
                        onClick={() => setIsFullScreen(false)}
                        className="p-2 ml-1 bg-green-500 text-white rounded-xl shadow-lg active:scale-95 transition-transform"
                        title="Concluir"
                    >
                        <Check size={20} />
                    </button>
                )}
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                spellCheck="true"
                onInput={handleInput}
                className="rich-editor-content prose prose-slate dark:prose-invert flex-1 w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8 outline-none shadow-inner overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                data-placeholder={placeholder}
            />
        </div>
    );
};

export default RichTextEditor;
