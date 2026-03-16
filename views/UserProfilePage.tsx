
import React from 'react';
import UserProfile from '../components/UserProfile';
import SocialNavigation from '../components/SocialNavigation';
import SEO from '../components/SEO';
import { useFeatures } from '../contexts/FeatureContext';
import { User } from 'lucide-react';

const FeatureDisabled = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black animate-in fade-in">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
            <User className="text-gray-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Em Breve</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            Seu perfil no Reino está sendo preparado.
        </p>
    </div>
);

const UserProfilePage: React.FC = () => {
  const { isFeatureEnabled } = useFeatures();

  if (!isFeatureEnabled('module_profile')) {
      return <FeatureDisabled />;
  }

  return (
    <div className="h-full flex flex-col">
      <SEO title="Meu Perfil" />
      <div className="flex-1 overflow-hidden">
        <UserProfile />
      </div>
      <SocialNavigation activeTab="profile" />
    </div>
  );
};

export default UserProfilePage;
