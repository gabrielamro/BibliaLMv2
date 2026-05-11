"use client";

import React from 'react';

interface SocialNavigationProps {
  activeTab: 'feed' | 'explore' | 'tools' | 'church' | 'profile';
}

const SocialNavigation: React.FC<SocialNavigationProps> = () => {
  // A navegacao inferior social foi substituida pela navegacao global mobile.
  // No desktop, o social usa a navegacao principal e nao deve ter barra fixa inferior.
  return null;
};

export default SocialNavigation;
