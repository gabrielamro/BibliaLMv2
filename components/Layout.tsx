"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from '../utils/router';
import Link from 'next/link';
import {
    Heart, User as UserIcon, ChevronDown, LogOut,
    BookOpen, LayoutDashboard, Brain, CheckCircle2,
    CalendarRange, Mic2, Coffee, MessageCircle,
    Sun, Moon, Sparkles, HelpCircle,
    Settings, Crown, Search, AlertTriangle,
    Terminal, Users, ShieldCheck, Lock, ChevronRight,
    ArrowLeft, ArrowRight, Home, PlusCircle, Plus, Compass, Church, Grid,
    ImageIcon, HandHeart, PenLine, Edit2, Smile, Send, Rss, Boxes,
    GraduationCap, BookMarked, Layers, LayoutGrid, Zap, FileText, Layout as LayoutIcon,
    PenTool, LibraryBig, MonitorPlay, UserCircle, Book, Palette, Wand2, Activity, Target, Map,
    Briefcase, Bell, Clock, Trophy, Info, X, Trash2, Check, MoreHorizontal, LifeBuoy, Scroll, ShieldAlert,
    History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useHeader } from '../contexts/HeaderContext';
import LoginModal from './LoginModal';
import SystemTutorialModal from './SystemTutorialModal';
import SupportModal from './SupportModal';
import BuyCreditsModal from './BuyCreditsModal';
import { LogoIcon } from './LogoIcon';
import MobileBottomNav from './MobileBottomNav';
import OmniSearch from './OmniSearch';
import { dbService } from '../services/supabase';
import ObreiroIAChatbot from './ObreiroIAChatbot';

interface LayoutProps {
    children: React.ReactNode;
}

type NavType = 'bible' | 'community' | 'personal' | 'pastoral' | 'system';

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const {
        currentUser, userProfile, notifications, unreadNotificationsCount, signOut,
        isLoginModalOpen, openLogin, closeLogin, markNotificationsAsRead,
        notification, clearNotification, isBuyCreditsModalOpen, closeBuyCredits
    } = useAuth();

    const { settings, toggleTheme, isFocusMode } = useSettings();
    const { title: headerTitle, subtitle: headerSubtitle, icon: headerIcon, breadcrumbs, isHeaderHidden } = useHeader();
    const navigate = useNavigate();
    const location = useLocation();

    const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
        'Bíblia': true,
        'Pessoal': true,
        'Pastoral': true
    });

    const [showHeader, setShowHeader] = useState(true);
    const lastScrollY = useRef(0);
    const notifRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const desktopSettingsRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const isLanding = location.pathname === '/intro' || location.pathname === '/apresentacao' || location.pathname === '/faith-tech';
    const isCustomHomeShell = location.pathname === '/';

    // Define quais rotas são "Raiz" e NÃO devem ter botão de voltar no mobile
    // Apenas as abas da MobileBottomNav e páginas de aterrissagem devem estar aqui
    const rootPaths = [
        '/',                // Santuário (Home)
        '/biblia',          // Bíblia
        '/social',          // Reino (Feed)
        '/social/explore',  // Explorar
        '/perfil',          // Perfil (Eu)
        '/intro',           // Landing
        '/apresentacao',    // Apresentação
        '/login'            // Login
    ];

    const showBackButton = !rootPaths.includes(location.pathname);

    const isAdmin = userProfile?.username === 'gabrielamaro' || currentUser?.email === 'gabrielamaro@live.com';
    const isPastor = userProfile?.subscriptionTier === 'pastor';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifDropdownOpen(false);
            }
            const isOutsideSettings =
                (settingsRef.current && !settingsRef.current.contains(event.target as Node)) &&
                (desktopSettingsRef.current && !desktopSettingsRef.current.contains(event.target as Node));

            if (isOutsideSettings) {
                setIsSettingsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                clearNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, clearNotification]);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/oracoes') return 'Orações Guiadas';
        if (path === '/trilhas') return 'Trilhas de Leitura';
        if (path === '/biblia') return 'Bíblia Sagrada';
        if (path === '/social') return 'O Reino';
        if (path === '/') return 'Santuário';
        if (path === '/perfil') return 'Meu Perfil';
        if (path === '/chat') return 'Conselheiro IA';
        if (path === '/estudio-criativo') return 'Estúdio Criativo';
        if (path === '/plano') return 'Meta de Leitura';
        if (path === '/devocional') return 'Pão Diário';
        if (path === '/aluno') return 'Área do Aluno';
        if (path === '/quiz') return 'Desafio da Sabedoria';
        if (path === '/historico') return 'Minhas Atividades';
        if (path === '/pulpito') return 'Púlpito Digital';
        if (path === '/workspace-pastoral') return 'Workspace Pastoral';
        return 'BíbliaLM';
    }
    const pageTitle = getPageTitle();
    
    const navStructure = useMemo(() => {
        const base = [
            {
                groupLabel: 'Pessoal',
                icon: <UserIcon size={18} />,
                type: 'personal' as NavType,
                colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
                items: [
                    { label: 'Santuário', path: '/', icon: <Home size={18} />, type: 'personal' as NavType, description: 'Seu painel principal' },
                    { label: 'Meus Estudos', path: '/estudos/planos', icon: <BookMarked size={18} />, protected: true, type: 'personal' as NavType, description: 'Seus sermões e notas' },
                    { label: 'Cursos & Trilhas', path: '/aluno', icon: <GraduationCap size={18} />, type: 'personal' as NavType, description: 'Salas e Trilhas' },
                    { label: 'Estúdio Criativo', path: '/estudio-criativo', icon: <Wand2 size={18} />, protected: true, type: 'personal' as NavType, description: 'Crie imagens e podcasts' },
                    { label: 'Conselheiro IA', path: '/chat', icon: <MessageCircle size={18} />, type: 'personal' as NavType, description: 'Tire dúvidas com a IA' },
                    { label: 'Atividades', path: '/historico', icon: <History size={18} />, protected: true, type: 'personal' as NavType, description: 'Seu histórico' },
                ]
            },
            {
                groupLabel: 'Bíblia',
                icon: <BookOpen size={18} />,
                type: 'bible' as NavType,
                colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
                items: [
                    { label: 'Bíblia Sagrada', path: '/biblia', icon: <Book size={18} />, type: 'bible' as NavType, description: 'Leitura, áudio e versões' },
                    { label: 'Pão Diário', path: '/devocional', icon: <Coffee size={18} />, type: 'bible' as NavType, description: 'Mensagem e oração do dia' },
                    { label: 'Orações', path: '/oracoes', icon: <HandHeart size={18} />, type: 'bible' as NavType, description: 'Guiadas por temas' },
                    { label: 'Trilhas', path: '/trilhas', icon: <Map size={18} />, type: 'bible' as NavType, description: 'Leituras temáticas' },
                    { label: 'Meta de Leitura', path: '/plano', icon: <Target size={18} />, protected: true, type: 'bible' as NavType, description: 'Acompanhe seu plano anual' },
                    { label: 'Quiz Bíblico', path: '/quiz', icon: <Brain size={18} />, type: 'bible' as NavType, description: 'Teste seus conhecimentos' },
                ]
            },
            {
                groupLabel: 'Reino',
                icon: <Crown size={18} />,
                type: 'community' as NavType,
                items: [
                    { label: 'Feed', path: '/social', icon: <Rss size={18} />, type: 'community' as NavType },
                    { label: 'Explorar', path: '/social/explore', icon: <Compass size={18} />, type: 'community' as NavType },
                    { label: 'Ferramentas', path: '/social/ferramentas', icon: <Wand2 size={18} />, type: 'community' as NavType },
                ]
            },
        ];
        if (isPastor) {
            base.push({
                groupLabel: 'Pastoral',
                icon: <Briefcase size={18} />,
                type: 'pastoral' as NavType,
                colorClass: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
                items: [
                    { label: 'Workspace', path: '/workspace-pastoral', icon: <LayoutIcon size={18} />, protected: true, type: 'pastoral' as NavType, description: 'Gestão de jornadas' },
                    { label: 'Púlpito Digital', path: '/pulpito', icon: <Mic2 size={18} />, protected: true, type: 'pastoral' as NavType, description: 'Modo Pregação e Slides' },
                ]
            });
        }
        return base;
    }, [isPastor, currentUser]);
    const toggleSubmenu = (label: string) => {
        setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const handleNavClick = (e: React.MouseEvent, item: any) => {
        if (item.protected && !currentUser) {
            e.preventDefault();
            openLogin();
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
            setShowHeader(false);
        } else {
            setShowHeader(true);
        }
        lastScrollY.current = currentScrollY;
    };

    const isFreePlan = !userProfile || userProfile.subscriptionTier === 'free';

    // Renderização do Conteúdo do Dropdown (Engrenagem)
    const renderSettingsDropdown = () => (
        <div className="flex flex-col py-2">
            {currentUser && (
                <Link
                    href="/perfil"
                    onClick={() => setIsSettingsMenuOpen(false)}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
                >
                    <UserIcon size={16} className="text-bible-gold" /> Meu Perfil
                </Link>
            )}

            <Link
                href="/intro"
                onClick={() => setIsSettingsMenuOpen(false)}
                className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
            >
                <LayoutIcon size={16} className="text-blue-500" /> Apresentação
            </Link>

            <Link
                href="/regras"
                onClick={() => setIsSettingsMenuOpen(false)}
                className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
            >
                <Zap size={16} className="text-purple-500" /> Manual do Maná
            </Link>

            <button
                type="button"
                onClick={() => { toggleTheme(); setIsSettingsMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
            >
                {settings.theme === 'dark' ? <Sun size={16} className="text-orange-500" /> : <Moon size={16} className="text-indigo-500" />}
                {settings.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>

            <div className="h-px bg-gray-50 dark:bg-gray-800 my-1" />

            <Link
                href="/suporte"
                onClick={() => setIsSettingsMenuOpen(false)}
                className="w-full text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
            >
                <LifeBuoy size={16} /> Suporte / Doar
            </Link>

            <Link
                href="/termos"
                onClick={() => setIsSettingsMenuOpen(false)}
                className="w-full text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
            >
                <Scroll size={16} /> Termos
            </Link>

            <Link
                href="/privacidade"
                onClick={() => setIsSettingsMenuOpen(false)}
                className="w-full text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
            >
                <ShieldCheck size={16} /> Privacidade
            </Link>

            {isAdmin && (
                <>
                    <div className="h-px bg-red-100 dark:bg-red-900/20 my-1" />
                    <Link
                        href="/admin"
                        onClick={() => setIsSettingsMenuOpen(false)}
                        className="w-full text-left px-4 py-3 text-xs font-black text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3"
                    >
                        <Terminal size={16} /> Painel Admin
                    </Link>
                    <Link
                        href="/system-integrity"
                        onClick={() => setIsSettingsMenuOpen(false)}
                        className="w-full text-left px-4 py-3 text-xs font-black text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3"
                    >
                        <ShieldAlert size={16} /> Integridade
                    </Link>
                </>
            )}

            <div className="h-px bg-gray-50 dark:bg-gray-800 my-1" />

            {currentUser ? (
                <button
                    type="button"
                    onClick={() => { signOut(); setIsSettingsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                >
                    <LogOut size={16} /> Sair
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => { openLogin(); setIsSettingsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-bible-gold hover:bg-bible-gold/10 flex items-center gap-3"
                >
                    <UserCircle size={16} /> Entrar na Conta
                </button>
            )}
        </div>
    );

    if (isLanding) return (
        <>
            {children}
            <LoginModal isOpen={isLoginModalOpen} onClose={closeLogin} />
            <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
            <BuyCreditsModal isOpen={isBuyCreditsModalOpen} onClose={closeBuyCredits} />
        </>
    );

    return (
        <div className="flex flex-col h-[100dvh] bg-bible-paper dark:bg-black transition-colors duration-300 font-sans overflow-hidden w-full max-w-[100vw]">

            {/* Mobile Header - Hidden in Focus Mode */}
            <header
                className={`md:hidden flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 absolute top-0 left-0 right-0 z-[60] h-[60px] pt-safe transition-transform duration-300 ease-in-out ${showHeader ? 'translate-y-0' : '-translate-y-full'
                    } ${isFocusMode || isCustomHomeShell || isHeaderHidden ? '!hidden' : ''}`}
            >
                <div className="flex items-center gap-3 z-10 flex-1 overflow-hidden">
                    {showBackButton ? (
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                    ) : (
                        <div onClick={() => navigate('/')} className="cursor-pointer active:opacity-70 flex-shrink-0 mb-0.5">
                            {headerIcon ? (
                                <div className="text-bible-gold scale-125 transform origin-left">
                                    {headerIcon}
                                </div>
                            ) : (
                                <LogoIcon className="w-8 h-8 text-bible-gold" />
                            )}
                        </div>
                    )}
                    
                    <div className="flex flex-col justify-center truncate">
                        {breadcrumbs.length > 0 ? (
                            <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] truncate mb-0.5 pointer-events-auto">
                                {breadcrumbs.slice(-2).map((crumb, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <ChevronRight size={8} />}
                                        <span className="truncate">{crumb.label}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] truncate mb-0.5">
                                {headerSubtitle || 'Santuário'}
                            </p>
                        )}
                        <h1 className="font-sans font-black text-[17px] tracking-tight text-gray-900 dark:text-white truncate leading-[1.1] pointer-events-auto">
                            {headerTitle || pageTitle}
                        </h1>
                    </div>
                </div>

                {/* Right Side: Icons */}
                <div className="flex items-center gap-1 z-10 flex-shrink-0">
                    {isFreePlan && (
                        <button onClick={() => setIsSupportModalOpen(true)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                            <Heart size={20} fill="currentColor" />
                        </button>
                    )}

                    {currentUser && (
                        <div className="relative" ref={notifRef}>
                            <button onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-bible-gold transition-colors relative rounded-full">
                                <Bell size={20} />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-black"></span>
                                )}
                            </button>
                            {isNotifDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                    <div className="p-3 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                                        <span className="font-bold text-xs">Notificações</span>
                                        <button onClick={markNotificationsAsRead} className="text-[10px] text-bible-gold hover:underline font-bold uppercase">Limpar</button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400 text-xs">Nenhuma notificação</div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div key={notif.id} onClick={() => { if (notif.link) navigate(notif.link); setIsNotifDropdownOpen(false); }} className={`p-3 border-b border-gray-50 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800 transition-colors ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{notif.title}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative" ref={settingsRef}>
                        <button
                            type="button"
                            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                            className={`p-2 rounded-full transition-colors ${isSettingsMenuOpen ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            <Settings size={20} />
                        </button>
                        {isSettingsMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[100] animate-in fade-in zoom-in-95 origin-top-right">
                                {renderSettingsDropdown()}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative w-full">

                {/* Desktop Sidebar - Hidden in Focus Mode and Home Shell */}
                <aside className={`hidden lg:flex flex-col w-64 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800 relative z-20 ${isFocusMode || isCustomHomeShell ? 'hidden' : ''}`}>
                    <div onClick={() => navigate('/')} className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <LogoIcon className="w-8 h-8 text-bible-gold" />
                        <div>
                            <h1 className="font-serif font-bold text-xl text-gray-900 dark:text-white leading-none">BíbliaLM</h1>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Soli Deo Gloria</span>
                        </div>
                    </div>

                    <div className="p-4">
                        <OmniSearch />
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 custom-scrollbar">
                        {navStructure.map((group, idx) => (
                            <div key={idx}>
                                <button
                                    onClick={() => toggleSubmenu(group.groupLabel)}
                                    className="w-full flex items-center justify-between text-xs font-black uppercase text-gray-400 tracking-widest mb-2 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 transition-colors"
                                >
                                    {group.groupLabel}
                                    <ChevronDown size={12} className={`transition-transform duration-200 ${openSubmenus[group.groupLabel] ? 'rotate-180' : ''}`} />
                                </button>

                                {openSubmenus[group.groupLabel] && (
                                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                                        {group.items.map((item: any) => {
                                            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                                            return (
                                                <Link
                                                    key={item.path}
                                                    href={item.path}
                                                    onClick={(e) => handleNavClick(e, item)}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${isActive ? 'bg-bible-gold/10 text-bible-leather dark:text-bible-gold font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}
                                                >
                                                    <div className={`${isActive ? 'text-bible-gold' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                                                        {item.icon}
                                                    </div>
                                                    <span className="text-sm">{item.label}</span>
                                                    {item.protected && !currentUser && <Lock size={12} className="ml-auto text-gray-300" />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
                        {currentUser ? (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border border-gray-200 dark:border-gray-600">
                                    {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{userProfile?.displayName?.substring(0, 2)}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userProfile?.displayName}</p>
                                    <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-tighter">{userProfile?.subscriptionTier}</p>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => openLogin()} className="w-full py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl font-bold text-sm shadow-md hover:scale-[1.02] transition-transform">
                                Entrar na Conta
                            </button>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 relative flex flex-col w-full overflow-hidden ${isFocusMode ? 'bg-black' : ''}`}>

                    {notification && (
                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 border ${notification.type === 'error' ? 'bg-red-500 text-white border-red-600' :
                                notification.type === 'success' ? 'bg-green-600 text-white border-green-700' :
                                    notification.type === 'badge' ? 'bg-purple-600 text-white border-purple-700' :
                                        'bg-gray-900 text-white border-gray-800'
                            }`}>
                            {notification.type === 'error' && <AlertTriangle size={18} />}
                            {notification.type === 'success' && <CheckCircle2 size={18} />}
                            {notification.type === 'badge' && <Crown size={18} />}
                            {notification.type === 'info' && <Info size={18} />}
                            <span className="text-sm font-bold">{notification.message}</span>
                            <button onClick={clearNotification} className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Desktop Header - Hidden in Focus Mode */}
                    <header className={`hidden md:flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-40 shrink-0 h-20 ${isFocusMode || isCustomHomeShell || isHeaderHidden ? '!hidden' : ''}`}>
                        {/* Left Side & Title */}
                        <div className="flex items-center gap-4 flex-1">
                            {showBackButton && (
                                <button onClick={() => navigate(-1)} className="p-2 mr-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0">
                                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                                </button>
                            )}
                            
                            {headerIcon && (
                                <div className="text-bible-gold shrink-0 scale-[1.3] origin-left mr-2">
                                    {headerIcon}
                                </div>
                            )}

                            <div className="flex flex-col justify-center">
                                {breadcrumbs.length > 0 ? (
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                                        {breadcrumbs.map((crumb, index) => (
                                            <React.Fragment key={index}>
                                                {index > 0 && <ChevronRight size={10} className="mx-1" />}
                                                <span
                                                    onClick={() => {
                                                        if (crumb.onClick) crumb.onClick();
                                                        else if (crumb.path) navigate(crumb.path);
                                                    }}
                                                    className={`cursor-pointer hover:text-bible-gold transition-colors ${index === breadcrumbs.length - 1 ? 'text-gray-600 dark:text-gray-300' : ''}`}
                                                >
                                                    {crumb.label}
                                                </span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                                        {headerSubtitle || 'BÍBLIA'}
                                    </p>
                                )}
                                <h2 className="text-xl md:text-2xl font-sans font-black tracking-tight text-gray-900 dark:text-white leading-none">
                                    {headerTitle || pageTitle}
                                </h2>
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center justify-end gap-4 w-32 flex-shrink-0">
                            <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-bible-gold transition-colors">
                                {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {currentUser && (
                                <div className="relative" ref={notifRef}>
                                    <button onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)} className="p-2 text-gray-400 hover:text-bible-gold transition-colors relative">
                                        <Bell size={20} />
                                        {unreadNotificationsCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
                                        )}
                                    </button>
                                    {isNotifDropdownOpen && (
                                        <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                            <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                                <span className="font-bold text-sm">Notificações</span>
                                                <button onClick={markNotificationsAsRead} className="text-[10px] text-bible-gold hover:underline font-bold uppercase">Marcar lidas</button>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-400 text-xs">Nenhuma nova notificação</div>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <div key={notif.id} className={`p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                                            <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{notif.title}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{notif.message}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="relative" ref={desktopSettingsRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                                    className={`p-2 rounded-full transition-colors ${isSettingsMenuOpen ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-bible-gold'}`}
                                >
                                    <Settings size={20} />
                                </button>
                                {isSettingsMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[100] animate-in fade-in zoom-in-95 origin-top-right">
                                        {renderSettingsDropdown()}
                                    </div>
                                )}
                            </div>

                            {isFreePlan && (
                                <button onClick={() => setIsSupportModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-bold hover:bg-red-100 transition-colors">
                                    <Heart size={14} fill="currentColor" />
                                    <span>Ofertar</span>
                                </button>
                            )}
                        </div>
                    </header>

                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative ${isFocusMode || isCustomHomeShell ? 'pt-0' : 'pt-[60px] md:pt-0'}`}
                        onScroll={handleScroll}
                    >
                        {children}
                    </div>

                    {!isFocusMode && <MobileBottomNav />}
                    <LoginModal isOpen={isLoginModalOpen} onClose={closeLogin} />
                    <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
                    <BuyCreditsModal isOpen={isBuyCreditsModalOpen} onClose={closeBuyCredits} />
                    <SystemTutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
                    <ObreiroIAChatbot />
                </main>
            </div>
        </div>
    );
};

export default Layout;
