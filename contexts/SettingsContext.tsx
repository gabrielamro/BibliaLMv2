"use client";


import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AppSettings } from '../types';
import { DEFAULT_FONT_SIZE } from '../constants';
import { useAuth } from './AuthContext';
import { dbService } from '../services/supabase';
import { DEFAULT_BIBLE_VERSION, normalizeBibleVersion } from '../utils/bibleVersionPreferences';

interface SettingsContextType {
  settings: AppSettings;
  isSelectionMode: boolean;
  isFocusMode: boolean;
  toggleTheme: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  saveBibleVersionAsDefault: (version?: string) => Promise<boolean>;
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

const createDefaultSettings = (overrides: Partial<AppSettings> = {}): AppSettings => {
  const defaultBibleVersion = normalizeBibleVersion(overrides.defaultBibleVersion || overrides.bibleVersion);

  return {
    theme: 'dark',
    fontSize: DEFAULT_FONT_SIZE,
    fontFamily: 'serif',
    lineHeight: 'normal',
    smartReadingMode: true,
    ...overrides,
    defaultBibleVersion,
    bibleVersion: defaultBibleVersion,
  };
};

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { userProfile, currentUser } = useAuth();

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') {
      return createDefaultSettings();
    }
    try {
      const saved = localStorage.getItem('bible_app_settings');
      const parsed = saved ? JSON.parse(saved) : null;
      return createDefaultSettings(parsed ?? {});
    } catch {
      return createDefaultSettings();
    }
  });

  const [isSelectionMode, setSelectionMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Sync from DB when user logs in
  useEffect(() => {
    if (userProfile) {
      setSettings(prev => {
        const nextDefaultBibleVersion = normalizeBibleVersion(userProfile.bibleVersion || prev.defaultBibleVersion);
        return {
          ...prev,
          theme: userProfile.theme || prev.theme,
          defaultBibleVersion: nextDefaultBibleVersion,
          bibleVersion: nextDefaultBibleVersion,
        };
      });
    }
  }, [userProfile?.uid, userProfile?.theme, userProfile?.bibleVersion]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bible_app_settings', JSON.stringify({
      ...settings,
      bibleVersion: settings.defaultBibleVersion || DEFAULT_BIBLE_VERSION,
    }));
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

  const saveBibleVersionAsDefault = async (version?: string): Promise<boolean> => {
    const nextDefaultBibleVersion = normalizeBibleVersion(version || settings.bibleVersion);
    setSettings(prev => ({
      ...prev,
      bibleVersion: nextDefaultBibleVersion,
      defaultBibleVersion: nextDefaultBibleVersion,
    }));

    if (currentUser) {
      try {
        await dbService.updateUserProfile(currentUser.uid, { bibleVersion: nextDefaultBibleVersion });
      } catch {
        return false;
      }
    }

    return true;
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      isSelectionMode,
      isFocusMode,
      toggleTheme,
      updateSettings,
      saveBibleVersionAsDefault,
      setSelectionMode,
      setIsFocusMode
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
