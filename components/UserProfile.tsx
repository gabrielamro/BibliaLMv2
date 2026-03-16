"use client";
import { useNavigate } from '../utils/router';


import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Award, Edit2, LogOut, Settings, MapPin, Church, Crown, ArrowLeft, User, LogIn, History, ChevronRight } from 'lucide-react';

import ChangePasswordModal from './ChangePasswordModal';
import { BADGES } from '../constants';

const UserProfile: React.FC = () => {
  const { userProfile, signOut, openLogin } = useAuth();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  if (!userProfile) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-black/20 text-center animate-in fade-in">
           <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-gray-700 shadow-xl">
               <User size={48} className="text-gray-400" />
           </div>
           <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-2">Perfil do Membro</h2>
           <p className="text-gray-500 mb-8 max-w-xs leading-relaxed text-sm">Faça login para ver seu progresso, medalhas e gerenciar sua conta.</p>
           <button 
              onClick={() => openLogin()} 
              className="bg-bible-gold text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-xs"
           >
              <LogIn size={18} /> Entrar Agora
           </button>
        </div>
    );
  }

  const userBadges = BADGES.filter(badge => userProfile.badges?.includes(badge.id));

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6 pb-28">
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
            <button 
              onClick={() => navigate('/')} 
              className="absolute top-6 left-6 p-2 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 hover:text-bible-gold transition-colors"
              title="Voltar para o Feed"
            >
                <ArrowLeft size={18} />
            </button>

            <button onClick={() => navigate('/complete-profile')} className="absolute top-6 right-6 p-2 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 hover:text-bible-gold transition-colors">
                <Edit2 size={18} />
            </button>

            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden">
                {userProfile.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                        {userProfile.displayName?.substring(0, 2).toUpperCase()}
                    </div>
                )}
            </div>
            
            <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-1">{userProfile.displayName}</h1>
            <p className="text-sm text-gray-500 mb-4">@{userProfile.username}</p>

            <div className="flex justify-center gap-4 text-xs text-gray-500 mb-6">
                {userProfile.city && (
                    <span className="flex items-center gap-1"><MapPin size={12} /> {userProfile.city}</span>
                )}
                {userProfile.churchData?.churchName && (
                    <span className="flex items-center gap-1"><Church size={12} /> {userProfile.churchData.churchName}</span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                <div>
                    <span className="block text-xl font-black text-gray-900 dark:text-white">{userProfile.lifetimeXp}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">XP Total</span>
                </div>
                <div>
                    <span className="block text-xl font-black text-gray-900 dark:text-white uppercase flex items-center justify-center gap-1">
                        <Crown size={16} className="text-bible-gold" /> {userProfile.subscriptionTier}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Status do Plano</span>
                </div>
            </div>
            {userProfile.subscriptionExpiresAt && (
                <p className="mt-4 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                    Válido até: {new Date(userProfile.subscriptionExpiresAt).toLocaleDateString()}
                </p>
            )}
        </div>
        
        {/* Timeline Access Button */}
        <button 
            onClick={() => navigate('/historico')}
            className="w-full bg-gradient-to-r from-bible-leather to-[#3d2b25] dark:from-bible-darkPaper dark:to-black p-5 rounded-3xl shadow-lg flex items-center justify-between group hover:scale-[1.02] transition-transform"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-bible-gold/20 rounded-2xl flex items-center justify-center text-bible-gold">
                    <History size={24} />
                </div>
                <div className="text-left">
                    <h3 className="text-white font-bold text-lg">Minha Jornada</h3>
                    <p className="text-white/60 text-xs">Ver histórico de atividades</p>
                </div>
            </div>
            <div className="bg-white/10 p-2 rounded-full text-white group-hover:bg-white group-hover:text-black transition-colors">
                <ChevronRight size={20} />
            </div>
        </button>

        {/* Badges Section */}
        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award size={18} className="text-bible-gold" /> Conquistas
            </h3>
            {userBadges.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {userBadges.map(badge => (
                        <div key={badge.id} className="flex flex-col items-center gap-1" title={badge.description}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${badge.color} bg-opacity-20`}>
                                {badge.icon}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400 italic">Continue sua jornada para desbloquear selos.</p>
            )}
        </div>

        {/* Settings Buttons */}
        <div className="space-y-3">
            <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full p-4 bg-white dark:bg-bible-darkPaper rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                <span className="flex items-center gap-3"><Settings size={18} /> Alterar Senha</span>
            </button>
            
            <button 
                onClick={signOut}
                className="w-full p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            >
                <LogOut size={18} /> Sair da Conta
            </button>
        </div>
      </div>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
};

export default UserProfile;
