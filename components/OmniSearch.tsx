"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';

import { Search, X, BookOpen, Zap, User, Church, Loader2, ChevronRight, Command, Layout, ArrowLeft } from 'lucide-react';
import { dbService } from '../services/supabase';
import { resolveBibleSearchNavigation } from '../utils/bibleSearchNavigation';

interface SearchResult {
    id: string;
    type: 'bible' | 'feature' | 'user' | 'church';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
}

interface OmniSearchProps {
    onClose?: () => void;
    mobileMode?: boolean;
}

const FEATURES = [
    { keywords: ['quiz', 'jogo', 'perguntas', 'desafio'], label: 'Desafio da Sabedoria', path: '/quiz', icon: <Zap size={16} /> },
    { keywords: ['devocional', 'pao', 'pão', 'dia', 'meditacao', 'meditação'], label: 'Pão Diário', path: '/devocional', icon: <BookOpen size={16} /> },
    { keywords: ['estudio', 'arte', 'imagem', 'podcast', 'criar'], label: 'Estúdio Criativo', path: '/?tab=criar', icon: <Zap size={16} /> },
    { keywords: ['chat', 'ia', 'conselheiro', 'ajuda'], label: 'Conselheiro IA', path: '/chat', icon: <Zap size={16} /> },
    { keywords: ['plano', 'leitura', 'meta', 'anual'], label: 'Meta de Leitura', path: '/plano', icon: <BookOpen size={16} /> },
    { keywords: ['perfil', 'conta', 'eu'], label: 'Meu Perfil', path: '/perfil', icon: <User size={16} /> },
    { keywords: ['jornada', 'workspace', 'pastoral'], label: 'Workspace Pastoral', path: '/workspace-pastoral', icon: <Layout size={16} /> },
];

const OmniSearch: React.FC<OmniSearchProps> = ({ onClose, mobileMode }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mobileMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [mobileMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (onClose) onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (text.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        setIsOpen(true);
        setLoading(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            const lowerText = text.toLowerCase().trim();
            const newResults: SearchResult[] = [];

            const bibleResult = await resolveBibleSearchNavigation(lowerText);
            if (bibleResult) {
                const subtitle = bibleResult.text
                    ? `${bibleResult.text.substring(0, 60)}${bibleResult.text.length > 60 ? '...' : ''}`
                    : 'Pressione Enter para ler na Bíblia';

                newResults.push({
                    id: `bible-${bibleResult.routeState.bookId}-${bibleResult.routeState.chapter}`,
                    type: 'bible',
                    title: `Ler ${bibleResult.formattedRef}`,
                    subtitle,
                    icon: <BookOpen size={16} />,
                    action: () => {
                        navigate('/biblia', { state: bibleResult.routeState });
                        setIsOpen(false);
                        setQuery('');
                        if (onClose) onClose();
                    }
                });
            }

            const matchedFeatures = FEATURES.filter(f => f.keywords.some(k => lowerText.includes(k)));
            matchedFeatures.forEach(f => {
                newResults.push({
                    id: `feat-${f.path}`,
                    type: 'feature',
                    title: f.label,
                    subtitle: 'Ferramenta',
                    icon: f.icon,
                    action: () => {
                        navigate(f.path);
                        setIsOpen(false);
                        setQuery('');
                        if (onClose) onClose();
                    }
                });
            });

            if (!bibleResult) {
                try {
                    const [users, churches] = await Promise.all([
                        dbService.searchUsersByName(text),
                        dbService.searchGlobalChurches(text)
                    ]);

                    users.forEach(u => {
                        newResults.push({
                            id: `user-${u.uid}`,
                            type: 'user',
                            title: u.displayName,
                            subtitle: `@${u.username}`,
                            icon: <User size={16} />,
                            action: () => {
                                navigate(`/u/${u.username}`);
                                setIsOpen(false);
                                setQuery('');
                                if (onClose) onClose();
                            }
                        });
                    });

                    churches.forEach(c => {
                        newResults.push({
                            id: `church-${c.id}`,
                            type: 'church',
                            title: c.name,
                            subtitle: 'Igreja',
                            icon: <Church size={16} />,
                            action: () => {
                                navigate(`/igreja/${c.slug}`);
                                setIsOpen(false);
                                setQuery('');
                                if (onClose) onClose();
                            }
                        });
                    });
                } catch (e) {
                    console.error("OmniSearch Error:", e);
                }
            }

            setResults(newResults);
            setLoading(false);
        }, 400);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${mobileMode ? 'h-full flex items-center' : 'max-w-md mx-auto'} z-50`}>
            <div className="relative group w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    {mobileMode && onClose ? (
                        <button onClick={onClose} className="text-gray-400 hover:text-bible-gold">
                            <ArrowLeft size={20} />
                        </button>
                    ) : (
                        <Search size={16} className="text-gray-400 group-focus-within:text-bible-gold transition-colors pointer-events-none" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
                    placeholder={mobileMode ? "Buscar..." : "Buscar versículos, irmãos ou ferramentas..."}
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-bible-gold/30 focus:border-bible-gold/50 transition-all font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 ${mobileMode ? 'bg-gray-100 dark:bg-gray-900 border-transparent' : ''}`}
                />

                {loading ? (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <Loader2 size={16} className="animate-spin text-bible-gold" />
                    </div>
                ) : query && (
                    <button onClick={() => { setQuery(''); setIsOpen(false); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && (results.length > 0 || loading) && (
                <div className={`absolute top-full left-0 right-0 mt-2 bg-white dark:bg-bible-darkPaper rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 origin-top ${mobileMode ? 'w-screen -ml-4 mt-4 rounded-none border-x-0 border-b shadow-none h-[calc(100vh-80px)]' : ''}`}>
                    {results.length > 0 ? (
                        <div className="py-2">
                            <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resultados</span>
                                {!mobileMode && <span className="text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-800 px-1.5 rounded flex items-center gap-1"><Command size={8} /> K</span>}
                            </div>
                            <div className={`overflow-y-auto custom-scrollbar ${mobileMode ? 'max-h-[calc(100vh-140px)]' : 'max-h-[300px]'}`}>
                                {results.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={item.action}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${item.type === 'bible' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                                item.type === 'feature' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                                                    item.type === 'church' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-bible-gold transition-colors">{item.title}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-medium">{item.subtitle}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-bible-gold" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        !loading && (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-400 font-medium">Nenhum resultado encontrado.</p>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default OmniSearch;
