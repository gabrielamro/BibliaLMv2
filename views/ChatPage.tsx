"use client";


import React, { useEffect } from 'react';
import AIChat from '../components/AIChat';
import { useFeatures } from '../contexts/FeatureContext';
import { useHeader } from '../contexts/HeaderContext';
import { MessageSquare, Sparkles } from 'lucide-react';

const FeatureDisabled = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black animate-in fade-in">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="text-gray-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Em Breve</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            O Chat IA está sendo calibrado para oferecer as melhores respostas.
        </p>
    </div>
);

const ChatPage: React.FC = () => {
  const { isFeatureEnabled } = useFeatures();
  const { setTitle, setSubtitle, setIcon, resetHeader } = useHeader();

  useEffect(() => {
    setTitle('Conselheiro IA');
    setIcon(<Sparkles size={20} />);
    return () => resetHeader();
  }, [setTitle, setIcon, resetHeader]);

  if (!isFeatureEnabled('module_chat')) {
      return <FeatureDisabled />;
  }

  return <AIChat />;
};

export default ChatPage;
