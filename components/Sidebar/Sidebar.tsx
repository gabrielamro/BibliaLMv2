"use client";

/**
 * Sidebar.tsx
 * Barra lateral principal do BibliaLM — estilo Canva com identidade visual oficial.
 * Paleta: bible-gold (#c5a059), bible-leather (#5d4037), bible-paper (#fdfbf7), bible-ink (#2d2a26)
 * Suporta: colapso (com persistência em localStorage), logo + nome no modo expandido,
 * botão "+ Criar", navegação flat com ícones, tooltips colapsados, sino e avatar no footer.
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocation } from '../../utils/router';
import {
  Home,
  BookMarked,
  MessageCircle,
  Book,
  Coffee,
  HandHeart,
  Target,
  Brain,
  Rss,
  Compass,
  Layout as LayoutIcon,
  Mic2,
  Plus,
  Bell,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  LockOpen,
  Crown,
  Sun,
  Moon,
  FileText,
  Users,
} from 'lucide-react';
import { LogoIcon } from '../LogoIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { SYSTEM_VERSION } from '../../constants';

const STORAGE_KEY = 'blm_sidebar_collapsed';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  protected?: boolean;
  featured?: boolean;
}

interface SidebarProps {
  /** Callback para abrir modal de login */
  onOpenLogin: () => void;
  /** Callback para abrir modal de configurações de conta */
  onOpenSettings?: () => void;
  initiallyCollapsed?: boolean;
}

// ---------------------------------------------------------------------------
// Tooltip simples para modo colapsado
// ---------------------------------------------------------------------------
const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="relative group/tip flex items-center justify-center">
    {children}
    <div
      className="
        pointer-events-none absolute left-full ml-3 z-[200]
        whitespace-nowrap rounded-lg bg-[#2d2a26] dark:bg-[#fdfbf7]
        text-[#fdfbf7] dark:text-[#2d2a26] text-xs font-semibold px-3 py-1.5 shadow-xl
        opacity-0 translate-x-1 scale-95
        group-hover/tip:opacity-100 group-hover/tip:translate-x-0 group-hover/tip:scale-100
        transition-all duration-200 delay-150
      "
    >
      {label}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Item de navegação
// ---------------------------------------------------------------------------
const NavItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  isAuthenticated: boolean;
  onProtectedClick: (e: React.MouseEvent) => void;
}> = ({ item, isActive, collapsed, isAuthenticated, onProtectedClick }) => {
  const baseClass = `
    relative flex items-center gap-3 rounded-xl transition-all duration-200 group
    ${isActive
      ? 'bg-[#c5a059]/15 text-[#5d4037] dark:text-[#c5a059] font-semibold'
      : item.featured
        ? 'bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#5d4037] dark:text-[#c5a059] font-bold shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-[#c5a059]/8 hover:text-[#2d2a26] dark:hover:text-white'
    }
    ${collapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'px-3 py-2.5 w-full'}
  `;

  const iconClass = `shrink-0 transition-colors ${
    isActive
      ? 'text-[#c5a059]'
      : 'text-gray-400 group-hover:text-[#c5a059] dark:group-hover:text-[#c5a059]'
  }`;
  const ProtectedIcon = isAuthenticated ? LockOpen : Lock;
  const protectedLabel = isAuthenticated ? 'Desbloqueado com login' : 'Login necessario';
  const protectedIconClass = isAuthenticated
    ? 'text-emerald-500 dark:text-emerald-400'
    : 'text-gray-300 dark:text-gray-600';

  const inner = (
    <Link
      href={item.path}
      onClick={item.protected ? onProtectedClick : undefined}
      className={baseClass}
    >
      <span className={iconClass}>{item.icon}</span>
      {!collapsed && (
        <span className="text-sm truncate animate-in fade-in slide-in-from-left-2 duration-200">
          {item.label}
        </span>
      )}
      {!collapsed && item.protected && (
        <ProtectedIcon
          size={11}
          className={`ml-auto shrink-0 ${protectedIconClass}`}
          aria-label={protectedLabel}
        />
      )}
      {collapsed && item.protected && (
        <span
          className="absolute right-1.5 top-1.5 rounded-full bg-bible-paper dark:bg-[#0a0a0a]"
          title={protectedLabel}
          aria-label={protectedLabel}
        >
          <ProtectedIcon size={10} className={protectedIconClass} />
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return <Tooltip label={item.label}>{inner}</Tooltip>;
  }
  return inner;
};

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------
const Sidebar: React.FC<SidebarProps> = ({ onOpenLogin, onOpenSettings, initiallyCollapsed = false }) => {
  const { currentUser, userProfile, notifications, unreadNotificationsCount, markNotificationsAsRead, signOut } = useAuth();
  const { settings, toggleTheme } = useSettings();
  const location = useLocation();

  // Colapso com persistência
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (initiallyCollapsed) {
      return true;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  // Persistir colapso
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (initiallyCollapsed) {
      setCollapsed(true);
    }
  }, [initiallyCollapsed]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (createRef.current && !createRef.current.contains(e.target as Node)) setCreateMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isPastor = userProfile?.subscriptionTier === 'pastor';

  // ---------------------------------------------------------------------------
  // Estrutura de navegação flat (estilo Canva)
  // ---------------------------------------------------------------------------
  const mainNav: NavItem[] = [
    { label: 'Bíblia Sagrada', path: '/bibliasagrada', icon: <Book size={20} />, featured: true },
    { label: 'Início', path: '/', icon: <Home size={20} /> },
    { label: 'Meus Estudos', path: '/estudos', icon: <BookMarked size={20} />, protected: true },
    { label: 'Conselheiro IA', path: '/chat', icon: <MessageCircle size={20} /> },
    { label: 'Pão Diário', path: '/devocional', icon: <Coffee size={20} /> },
    { label: 'Orações', path: '/oracoes', icon: <HandHeart size={20} /> },
    { label: 'Meta de Leitura', path: '/plano', icon: <Target size={20} />, protected: true },
    { label: 'Quiz Bíblico', path: '/quiz', icon: <Brain size={20} /> },
    { label: 'Feed', path: '/social', icon: <Rss size={20} /> },
    { label: 'Explorar', path: '/social/explore', icon: <Compass size={20} /> },
  ];

  const pastoralNav: NavItem[] = isPastor
    ? [
        { label: 'Workspace', path: '/workspace-pastoral', icon: <LayoutIcon size={20} />, protected: true },
        { label: 'Púlpito Digital', path: '/pulpito', icon: <Mic2 size={20} />, protected: true },
      ]
    : [];

  const allNav = [...mainNav, ...pastoralNav];

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const handleProtectedClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      onOpenLogin();
    }
  };

  // Iniciais do usuário para avatar
  const initials = (userProfile?.displayName || currentUser?.email || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        bg-bible-paper dark:bg-[#0a0a0a]
        border-r border-[#c5a059]/20 dark:border-gray-800
        transition-all duration-300 ease-in-out
        relative z-20 shrink-0
        ${collapsed ? 'w-[72px]' : 'w-[220px]'}
      `}
    >
      {/* ── Header: Botão colapso + Logo ── */}
      <div
        className={`flex items-center h-16 px-3 shrink-0 border-b border-[#c5a059]/15 dark:border-gray-800 ${
          collapsed ? 'justify-center' : 'gap-2'
        }`}
      >
        {/* Botão de colapso */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="p-2 rounded-xl text-gray-400 hover:text-[#c5a059] hover:bg-[#c5a059]/10 transition-all duration-200 shrink-0"
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        {/* Logo BibliaLM — apenas no modo expandido */}
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity animate-in fade-in slide-in-from-left-2 duration-300"
          >
            <LogoIcon className="w-7 h-7 text-[#c5a059] shrink-0" />
            <div className="min-w-0">
              <p className="font-serif font-bold text-[15px] leading-none text-[#2d2a26] dark:text-white truncate">
                BíbliaLM
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#c5a059]/70 truncate">
                Soli Deo Gloria
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* ── Botão "+ Criar" com Dropdown ── */}
      <div className={`px-3 pt-4 pb-2 shrink-0 relative ${collapsed ? 'flex justify-center' : ''}`} ref={createRef}>
        {collapsed ? (
          <Tooltip label="Criar...">
            <button
              type="button"
              onClick={() => setCreateMenuOpen(!createMenuOpen)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 shadow-md ${
                createMenuOpen ? 'bg-[#5d4037] text-white' : 'bg-[#c5a059] text-white shadow-[#c5a059]/30 hover:bg-[#5d4037]'
              }`}
            >
              <Plus size={20} strokeWidth={2.5} className={`transition-transform duration-300 ${createMenuOpen ? 'rotate-45' : ''}`} />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all duration-200 active:scale-[0.98] animate-in fade-in duration-300 ${
              createMenuOpen ? 'bg-[#5d4037] text-white' : 'bg-[#c5a059] text-white shadow-[#c5a059]/25 hover:bg-[#5d4037]'
            }`}
          >
            <Plus size={18} strokeWidth={2.5} className={`transition-transform duration-300 ${createMenuOpen ? 'rotate-45' : ''}`} />
            Criar
          </button>
        )}

        {/* Dropdown de Opções de Criação */}
        {createMenuOpen && (
          <div
            className={`
              absolute z-[210] w-48
              bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
              border border-gray-100 dark:border-gray-800 overflow-hidden
              animate-in fade-in zoom-in-95 duration-200
              ${collapsed ? 'left-full ml-2 top-0 origin-left' : 'left-3 right-3 top-full mt-1 origin-top'}
            `}
          >
            <Link
              href="/criar-conteudo"
              onClick={() => setCreateMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-[#c5a059]/10 transition-colors border-b border-gray-50 dark:border-gray-800"
            >
              <FileText size={16} className="text-[#c5a059]" />
              Criar Estudo
            </Link>
            <Link
              href="/criar-sala"
              onClick={() => setCreateMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-[#c5a059]/10 transition-colors"
            >
              <Users size={16} className="text-[#c5a059]" />
              Criar Sala
            </Link>
          </div>
        )}
      </div>

      {/* ── Itens de Navegação ── */}
      <nav
        aria-label="Menu principal"
        className={`flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5 custom-scrollbar ${
          collapsed ? 'px-1.5' : 'px-2'
        }`}
      >
        {allNav.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            collapsed={collapsed}
            isAuthenticated={!!currentUser}
            onProtectedClick={handleProtectedClick}
          />
        ))}
      </nav>

      {/* ── Footer: Sino + Avatar ── */}
      <div
        className={`shrink-0 border-t border-[#c5a059]/15 dark:border-gray-800 pt-3 pb-4 px-3 flex flex-col gap-2 ${
          collapsed ? 'items-center' : 'items-stretch'
        }`}
      >
        {/* Sino de notificações */}
        {currentUser && (
          <div className="relative" ref={notifRef}>
            {collapsed ? (
              <Tooltip label="Notificações">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-[#c5a059]/10 hover:text-[#c5a059] transition-all relative"
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-bible-paper dark:border-[#0a0a0a]" />
                  )}
                </button>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-[#c5a059]/10 hover:text-[#2d2a26] dark:hover:text-white transition-all relative"
              >
                <Bell size={20} className="shrink-0" />
                <span className="text-sm font-medium">Notificações</span>
                {unreadNotificationsCount > 0 && (
                  <span className="ml-auto flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Dropdown de notificações */}
            {notifOpen && (
              <div
                className={`
                  absolute bottom-full mb-2 z-[200] w-72
                  bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                  border border-gray-100 dark:border-gray-800 overflow-hidden
                  animate-in fade-in zoom-in-95 origin-bottom-left duration-200
                  ${collapsed ? 'left-full ml-2' : 'left-0'}
                `}
              >
                <div className="p-3 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                  <span className="font-bold text-xs text-gray-700 dark:text-gray-200">Notificações</span>
                  <button
                    onClick={markNotificationsAsRead}
                    className="text-[10px] text-[#c5a059] hover:underline font-bold uppercase"
                  >
                    Limpar
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-xs">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 border-b border-gray-50 dark:border-gray-800 transition-colors ${
                          !n.read ? 'bg-[#c5a059]/5 dark:bg-[#c5a059]/5' : ''
                        }`}
                      >
                        <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{n.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Avatar do usuário / Entrar na conta */}
        <div className="relative" ref={profileRef}>
          {currentUser ? (
            <>
              {collapsed ? (
                <Tooltip label={userProfile?.displayName || 'Perfil'}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="w-10 h-10 rounded-full bg-[#5d4037] text-white flex items-center justify-center text-xs font-black shadow-md transition-all hover:scale-105 overflow-hidden"
                  >
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </button>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#c5a059]/10 transition-all animate-in fade-in duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-[#5d4037] text-white flex items-center justify-center text-xs font-black shadow-sm overflow-hidden shrink-0">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-[#2d2a26] dark:text-white truncate leading-tight">
                      {userProfile?.displayName || 'Usuário'}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tight font-medium truncate">
                      {userProfile?.subscriptionTier || 'free'}
                    </p>
                  </div>
                </button>
              )}

              {/* Dropdown de perfil */}
              {profileOpen && (
                <div
                  className={`
                    absolute bottom-full mb-2 z-[200] w-52
                    bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                    border border-gray-100 dark:border-gray-800 overflow-hidden
                    animate-in fade-in zoom-in-95 origin-bottom-left duration-200
                    ${collapsed ? 'left-full ml-2' : 'left-0'}
                  `}
                >
                  <Link
                    href="/perfil"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Crown size={14} className="text-[#c5a059]" /> Meu Perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => { toggleTheme(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {settings.theme === 'dark'
                      ? <Sun size={14} className="text-orange-400" />
                      : <Moon size={14} className="text-indigo-400" />
                    }
                    {settings.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-800" />
                  <button
                    type="button"
                    onClick={() => { signOut(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={14} /> Sair
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Estado não logado */
            collapsed ? (
              <Tooltip label="Entrar na conta">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#c5a059] text-white shadow-md hover:bg-[#5d4037] transition-all hover:scale-105"
                >
                  <span className="text-xs font-black">→</span>
                </button>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full py-2.5 rounded-xl bg-[#5d4037] hover:bg-[#c5a059] text-white text-sm font-bold shadow-md transition-all duration-200 active:scale-[0.98] animate-in fade-in duration-300"
              >
                Entrar na Conta
              </button>
            )
          )}
        </div>

        {/* Versão do sistema */}
        {!collapsed && (
          <p className="text-[9px] font-black tracking-widest text-gray-300 dark:text-gray-700 uppercase text-center select-none animate-in fade-in duration-300">
            v{SYSTEM_VERSION}
          </p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
