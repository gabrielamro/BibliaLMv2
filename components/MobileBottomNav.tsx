"use client";

import React, { useEffect, useState } from 'react';
import { BookOpen, Church, Crown, Home, PlayCircle, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from '../utils/router';
import { ACTIVE_CULTO_CHANGED_EVENT, readActiveCultoSession, type ActiveCultoSession } from '../utils/activeCultoSession';

const NAV_ITEMS = [
  { id: 'home', label: 'Início', icon: Home, path: '/newhome', module: 'home', protected: false },
  { id: 'bible', label: 'Bíblia', icon: BookOpen, path: '/bibliasagrada', module: 'bible', protected: false },
  { id: 'social', label: 'Reino', icon: Crown, path: '/social', module: 'kingdom', protected: false, hasBadge: true },
  { id: 'cultos', label: 'Cultos', icon: Church, path: '/meus-cultos', module: 'cultos', protected: false },
  { id: 'profile', label: 'Perfil', icon: UserRound, path: '/perfil', module: 'neutral', protected: true },
] as const;

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadNotificationsCount, currentUser, openLogin } = useAuth();
  const [activeCulto, setActiveCulto] = useState<ActiveCultoSession | null>(null);
  const isBibleExperience = ['/trilhas', '/diario-espiritual', '/bibliasagrada', '/biblia', '/devocional', '/oracoes', '/plano', '/quiz'].some(path => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const isCultoPlusShell = location.pathname === '/newhome'
    || location.pathname.startsWith('/meus-cultos')
    || location.pathname.startsWith('/minhas-escalas')
    || isBibleExperience;

  useEffect(() => {
    const refreshActiveCulto = () => setActiveCulto(readActiveCultoSession());
    refreshActiveCulto();
    window.addEventListener(ACTIVE_CULTO_CHANGED_EVENT, refreshActiveCulto);
    window.addEventListener('focus', refreshActiveCulto);
    return () => {
      window.removeEventListener(ACTIVE_CULTO_CHANGED_EVENT, refreshActiveCulto);
      window.removeEventListener('focus', refreshActiveCulto);
    };
  }, [location.pathname]);

  const isItemActive = (id: typeof NAV_ITEMS[number]['id'], path: string) => {
    if (id === 'social') {
      return location.pathname === '/social'
        || location.pathname.startsWith('/social/')
        || location.pathname.startsWith('/igreja/')
        || location.pathname.startsWith('/grupo/')
        || location.pathname.startsWith('/u/');
    }
    if (id === 'cultos') {
      return location.pathname.startsWith('/culto')
        || location.pathname.startsWith('/meus-cultos')
        || location.pathname.startsWith('/minhas-escalas');
    }
    if (id === 'bible') return isBibleExperience;
    if (id === 'profile') return location.pathname === '/perfil' || location.pathname.startsWith('/minha-conta');
    return location.pathname === path;
  };

  const handleNavigation = (path: string, isProtected: boolean, isActive: boolean) => {
    if (isProtected && !currentUser) {
      openLogin();
      return;
    }

    if (isActive) {
      navigate(path, { state: { reset: true, timestamp: Date.now() } });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    navigate(path);
  };

  return (
    <nav
      aria-label="Navegação principal mobile"
      data-testid={isCultoPlusShell ? 'cultoplus-mobile-bottom-nav' : 'mobile-bottom-nav'}
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.65rem)] md:hidden"
    >
      <div className="mx-auto max-w-lg rounded-[1.4rem] border border-fuchsia-300/30 bg-[#17131d]/95 px-1.5 shadow-[0_-8px_35px_rgba(24,12,31,0.3)] backdrop-blur-2xl dark:border-fuchsia-300/20">
        <div className="grid h-[4.5rem] grid-cols-5 items-end">
          {NAV_ITEMS.map(item => {
            const isActive = isItemActive(item.id, item.path);
            const Icon = item.icon;
            const isPremium = isActive;
            const targetPath = item.id === 'cultos' && activeCulto ? activeCulto.href : item.path;

            return (
              <button
                key={item.id}
                type="button"
                data-module-theme={item.module}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                onClick={() => handleNavigation(targetPath, item.protected, isActive)}
                className={`module-focus relative flex min-h-14 w-full flex-col items-center justify-end gap-1 rounded-2xl pb-2 text-[10px] font-bold transition duration-200 ${isActive ? 'module-accent-text text-white' : 'text-[#c2b7c7] hover:text-white'}`}
              >
                <span className={`relative flex items-center justify-center transition duration-200 ${isPremium ? '-translate-y-1 module-gradient h-11 w-12 rounded-[0.9rem] text-white shadow-[0_8px_22px_rgba(0,0,0,0.28)] after:absolute after:-bottom-1 after:right-1.5 after:h-3 after:w-3 after:rotate-45 after:bg-[var(--module-primary)]' : 'h-7 w-10 rounded-xl'}`}>
                  <Icon size={isPremium ? 23 : 22} strokeWidth={isPremium ? 2.4 : 1.9} className="relative z-10" />
                  {item.id === 'social' && unreadNotificationsCount > 0 ? (
                    <span className="absolute -right-1 -top-1 z-20 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-[#17131d]" aria-label={`${unreadNotificationsCount} notificações não lidas`} />
                  ) : null}
                  {item.id === 'cultos' && activeCulto ? (
                    <span title={`Voltar para ${activeCulto.title}`} className="absolute -right-1.5 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md ring-2 ring-[#17131d]" aria-label={`Culto em andamento: ${activeCulto.title}`}>
                      <PlayCircle size={13} fill="currentColor" />
                    </span>
                  ) : null}
                </span>
                <span className={isPremium ? '-mt-1 text-white' : ''}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
