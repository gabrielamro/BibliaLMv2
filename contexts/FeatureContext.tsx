"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FeatureFlag } from '../types';
import { dbService } from '../services/supabase';

interface FeatureContextProps {
  features: FeatureFlag[];
  isFeatureEnabled: (key: string) => boolean;
  loading: boolean;
  refreshFeatures: () => Promise<void>;
  toggleFeature: (key: string, enabled: boolean) => Promise<void>;
}

const FeatureContext = createContext<FeatureContextProps | undefined>(undefined);

// Default features list to ensure system stability if DB is empty
const DEFAULT_FEATURES: FeatureFlag[] = [
  { id: '1', key: 'module_social', label: 'Rede Social (Feed)', description: 'Feed de postagens, comentários e interações.', isEnabled: true, rolloutPercentage: 100 },
  { id: '2', key: 'module_plans', label: 'Planos de Leitura', description: 'Sistema de planos de leitura e salas de estudo.', isEnabled: true, rolloutPercentage: 100 },
  { id: '3', key: 'module_study', label: 'Ferramentas de Estudo', description: 'IA, Análise Profunda e Notas.', isEnabled: true, rolloutPercentage: 100 },
  { id: '4', key: 'module_gamification', label: 'Gamificação', description: 'Pontos, Níveis, Badges e Ranking.', isEnabled: true, rolloutPercentage: 100 },
  { id: '5', key: 'feature_audio', label: 'Áudio & Narração', description: 'Narração de capítulos e geração de podcasts.', isEnabled: true, rolloutPercentage: 100 },
  { id: '6', key: 'feature_images', label: 'Geração de Imagens', description: 'Criação de imagens com IA.', isEnabled: true, rolloutPercentage: 100 },
  { id: '7', key: 'ai_chat', label: 'Chat com IA', description: 'Obreiro IA para tirar dúvidas.', isEnabled: true, rolloutPercentage: 100 },
  { id: '8', key: 'workspace_pastoral', label: 'Workspace Pastoral', description: 'Área administrativa para pastores.', isEnabled: true, rolloutPercentage: 100 },
];

export const FeatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlag[]>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);

  const refreshFeatures = async () => {
    try {
      const settings = await dbService.getSystemSettings();
      if (settings && settings.featureFlags && settings.featureFlags.length > 0) {
        // Merge DB features with Defaults to ensure new features appear
        const dbFeatures = settings.featureFlags;
        const mergedFeatures = DEFAULT_FEATURES.map(def => {
          const found = dbFeatures.find(f => f.key === def.key);
          return found ? found : def;
        });
        setFeatures(mergedFeatures);
      } else {
        // First run or empty DB, save defaults
        await dbService.saveSystemSettings({ featureFlags: DEFAULT_FEATURES });
        setFeatures(DEFAULT_FEATURES);
      }
    } catch (error) {
      console.error("Error loading feature flags:", error);
      // Fallback to defaults is already set in initial state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFeatures();
  }, []);

  const isFeatureEnabled = (key: string): boolean => {
    const feature = features.find(f => f.key === key);
    // If feature not found, default to true (safe fallback) or false depending on strategy.
    // Here we default to true to avoid breaking if a key is missing, unless it's critical.
    // But for a "disable" roadmap, default false might be safer for NEW features.
    // Let's stick to the state value.
    return feature ? feature.isEnabled : true;
  };

  const toggleFeature = async (key: string, enabled: boolean) => {
    const newFeatures = features.map(f => f.key === key ? { ...f, isEnabled: enabled } : f);
    setFeatures(newFeatures);
    try {
      await dbService.saveSystemSettings({ featureFlags: newFeatures });
    } catch (e) {
      console.error("Error saving feature toggle:", e);
      // Revert on error
      refreshFeatures();
    }
  };

  return (
    <FeatureContext.Provider value={{ features, isFeatureEnabled, loading, refreshFeatures, toggleFeature }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

// Component helper for conditional rendering
export const FeatureGuard: React.FC<{ flag: string; children: ReactNode; fallback?: ReactNode }> = ({ flag, children, fallback = null }) => {
  const { isFeatureEnabled, loading } = useFeatures();
  
  if (loading) return null; // Or a skeleton?
  
  if (isFeatureEnabled(flag)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};
