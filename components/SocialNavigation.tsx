"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';

import React from 'react';

import { Rss, Compass, Church, User, Wand2 } from 'lucide-react';

interface SocialNavigationProps {
  activeTab: 'feed' | 'explore' | 'tools' | 'church' | 'profile';
}

const SocialNavigation: React.FC<SocialNavigationProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'feed', icon: <Rss size={24} />, path: '/social' },
    { id: 'explore', icon: <Compass size={24} />, path: '/social/explore' },
    { id: 'tools', icon: <Wand2 size={24} />, path: '/social/ferramentas' },
    { id: 'church', icon: <Church size={24} />, path: '/social/church' },
    { id: 'profile', icon: <User size={24} />, path: '/social/profile' },
  ];

  const isTabActive = (id: string, path: string) => {
    if (activeTab === id) return true;
    if (id === 'profile' && (location.pathname === '/perfil' || location.pathname === '/social/profile')) return true;
    if (id === 'feed' && location.pathname === '/social') return true;
    return location.pathname.startsWith(path) && path !== '/social';
  };

  // Hide on mobile (md:hidden) because MobileBottomNav handles global navigation now
  // This prevents double bottom bars on mobile
  return (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-[100] bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-safe">
      <nav className="max-w-xl mx-auto h-14 flex items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = isTabActive(item.id, item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-200
                ${isActive ? 'text-bible-gold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}
              `}
            >
              {React.cloneElement(item.icon as React.ReactElement<any>, { 
                  strokeWidth: isActive ? 2.5 : 2,
                  fill: "none" // Garante que o ícone não fique "cheio" ou deformado
              })}
              
              {/* Indicador de Ponto (Estilo modern app) */}
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-bible-gold rounded-full animate-in fade-in zoom-in duration-300" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default SocialNavigation;