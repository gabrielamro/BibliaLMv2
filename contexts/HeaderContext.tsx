"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Breadcrumb {
  label: string;
  path?: string;
  onClick?: () => void;
}

interface HeaderContextType {
  title: string;
  setTitle: (title: string) => void;
  subtitle?: string;
  setSubtitle: (subtitle?: string) => void;
  icon?: ReactNode;
  setIcon: (icon?: ReactNode) => void;
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  isHeaderHidden: boolean;
  setIsHeaderHidden: (isHidden: boolean) => void;
  resetHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined);
  const [icon, setIcon] = useState<ReactNode | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  const resetHeader = useCallback(() => {
    setTitle('');
    setSubtitle(undefined);
    setIcon(undefined);
    setBreadcrumbs([]);
    setIsHeaderHidden(false);
  }, []);

  return (
    <HeaderContext.Provider value={{ title, setTitle, subtitle, setSubtitle, icon, setIcon, breadcrumbs, setBreadcrumbs, isHeaderHidden, setIsHeaderHidden, resetHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
