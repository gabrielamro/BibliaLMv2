"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';

import React from 'react';

import { Home, BookOpen, Crown, Map, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadNotificationsCount, currentUser, openLogin } = useAuth();

  const navItems = [
    {
      id: 'home',
      label: 'Início',
      icon: Home,
      path: '/',
      protected: true
    },
    {
      id: 'bible',
      label: 'Palavra',
      icon: BookOpen,
      path: '/biblia',
      protected: false
    },
    {
      id: 'social',
      label: 'Reino',
      icon: Crown,
      path: '/social',
      hasBadge: true,
      protected: false // Feed é público, interação é protegida internamente
    },
    {
      id: 'explore',
      label: 'Explorar',
      icon: Search,
      path: '/social/explore',
      protected: false
    },
    {
      id: 'navegar',
      label: 'Navegar',
      icon: Map,
      path: '/navegar',
      protected: false
    }
  ];

  const handleNavigation = (path: string, isProtected: boolean, isActive: boolean) => {
    if (isProtected && !currentUser) {
      openLogin();
      return;
    }

    if (isActive) {
      // Always broadcast reset state when clicking an active tab.
      // Components like Reader.tsx use internal state (not sub-routes).
      // If a component handles this, it returns to its root.
      // We also scroll to top for good measure.
      navigate(path, { state: { reset: true, timestamp: Date.now() } });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Different tab, navigate to it normally
      navigate(path);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Glassmorphism Container */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/20 dark:border-white/5 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            let isActive = false;
            if (item.id === 'social') {
              // Only active if starts with /social but NOT /social/explore
              isActive = location.pathname === '/social' || (location.pathname.startsWith('/social') && !location.pathname.startsWith('/social/explore'));
            } else {
              isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
            }

            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path, item.protected, isActive)}
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive ? 'text-bible-gold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-bible-gold rounded-full shadow-[0_0_10px_#c5a059]" />
                )}

                <div className="relative">
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                  />

                  {/* Notification Badge */}
                  {item.hasBadge && unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </div>

                <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;