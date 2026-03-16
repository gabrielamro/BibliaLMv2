"use client";


import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AppSettings } from '../types';
import { DEFAULT_FONT_SIZE } from '../constants';
import { useAuth } from './AuthContext';
import { dbService } from '../services/supabase';

interface SettingsContextType {
  settings: AppSettings;
  isSelectionMode: boolean;
  isFocusMode: boolean;
  toggleTheme: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setSelectionMode: (isActive: boolean) => void;
  setIsFocusMode: (isActive: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { userProfile, currentUser } = useAuth();

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') {
      return {
        theme: 'dark',
        fontSize: DEFAULT_FONT_SIZE,
        fontFamily: 'serif',
        lineHeight: 'normal',
        smartReadingMode: true
      };
    }
    try {
      const saved = localStorage.getItem('bible_app_settings');
      return saved ? JSON.parse(saved) : {
        theme: 'dark', // Default to dark mode
        fontSize: DEFAULT_FONT_SIZE,
        fontFamily: 'serif',
        lineHeight: 'normal',
        smartReadingMode: true // Default ON for highlighting
      };
    } catch {
      return {
        theme: 'dark', // Default to dark mode
        fontSize: DEFAULT_FONT_SIZE,
        fontFamily: 'serif',
        lineHeight: 'normal',
        smartReadingMode: true
      };
    }
  });

  const [isSelectionMode, setSelectionMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Sync from DB when user logs in
  useEffect(() => {
    if (userProfile && userProfile.theme && userProfile.theme !== settings.theme) {
      setSettings(prev => ({ ...prev, theme: userProfile.theme! }));
    }
  }, [userProfile]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bible_app_settings', JSON.stringify(settings));
  }, [settings]);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    setSettings(prev => ({ ...prev, theme: newTheme }));

    // Save to DB if logged in
    if (currentUser) {
      dbService.updateUserProfile(currentUser.uid, { theme: newTheme }).catch(console.error);
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      isSelectionMode,
      isFocusMode,
      toggleTheme,
      updateSettings,
      setSelectionMode,
      setIsFocusMode
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
