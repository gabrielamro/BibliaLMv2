'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useNavigate } from '../utils/router';
import {
  User, Settings, Bell, Shield, CreditCard, Palette, Globe, Lock,
  ChevronRight, Camera, LogOut, Award, Zap, Flame, Star, BookOpen,
  MessageSquare, Image, Mic, FileText, Crown, Loader2, Check, X
} from 'lucide-react';
import SEO from '../components/SEO';

type TabType = 'profile' | 'notifications' | 'appearance' | 'privacy' | 'subscription';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, updateProfile, openSubscription, showNotification, signOut } = useAuth();
  const { setTitle, setBreadcrumbs, resetHeader } = useHeader();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    displayName: currentUser?.displayName || '',
    bio: userProfile?.bio || '',
    slogan: userProfile?.slogan || '',
    instagram: userProfile?.instagram || '',
    city: userProfile?.city || '',
    state: userProfile?.state || '',
    isProfilePublic: userProfile?.isProfilePublic ?? true,
    theme: userProfile?.theme || 'dark' as 'light' | 'dark',
  });

  useEffect(() => {
    setTitle('Perfil');
    setBreadcrumbs([
      { label: 'Início', path: '/inicio03' },
      { label: 'Perfil' }
    ]);
    return () => resetHeader();
  }, [setTitle, setBreadcrumbs, resetHeader]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(editedProfile);
      showNotification('Perfil atualizado!', 'success');
    } catch (e) {
      showNotification('Erro ao salvar', 'error');
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut();
      navigate('/');
    }
  };

  const tabs = [
    { id: 'profile' as const, icon: <User size={18} />, label: 'Perfil' },
    { id: 'notifications' as const, icon: <Bell size={18} />, label: 'Notificações' },
    { id: 'appearance' as const, icon: <Palette size={18} />, label: 'Aparência' },
    { id: 'privacy' as const, icon: <Shield size={18} />, label: 'Privacidade' },
    { id: 'subscription' as const, icon: <Crown size={18} />, label: 'Assinatura' },
  ];

  const tierColors: Record<string, string> = {
    free: 'bg-gray-500',
    bronze: 'bg-amber-700',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    pastor: 'bg-purple-500',
  };

  const tierNames: Record<string, string> = {
    free: 'Gratuito',
    bronze: 'Bronze',
    silver: 'Prata',
    gold: 'Visionário',
    pastor: 'Pastor',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-[#c5a059]/30">
      <SEO title="Perfil" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/inicio03')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-white rotate-180" />
            </button>
            <h1 className="font-bold text-white text-lg">Meu Perfil</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 pb-24">
        {/* Avatar e Info Principal */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || 'Usuário'}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#c5a059]/30 mx-auto"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#c5a059]/20 flex items-center justify-center mx-auto">
                <User size={40} className="text-[#c5a059]" />
              </div>
            )}
            <button className="absolute bottom-0 right-0 p-2 bg-[#c5a059] rounded-full hover:bg-[#c5a059]/80 transition-colors">
              <Camera size={16} className="text-white" />
            </button>
          </div>
          
          <h2 className="mt-4 font-bold text-2xl text-white">{currentUser?.displayName || 'Usuário'}</h2>
          <p className="text-gray-400 text-sm">{currentUser?.email}</p>
          
          {/* Badge de Assinatura */}
          <div className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full ${tierColors[userProfile?.subscriptionTier || 'free']}/20 border border-${userProfile?.subscriptionTier || 'free'}/30`}>
            <Crown size={14} className={`${tierColors[userProfile?.subscriptionTier || 'free'].replace('bg-', 'text-')}`} />
            <span className={`text-sm font-bold ${tierColors[userProfile?.subscriptionTier || 'free'].replace('bg-', 'text-')}`}>
              {tierNames[userProfile?.subscriptionTier || 'free']}
            </span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-center gap-2 text-[#c5a059]">
                <Zap size={18} fill="#c5a059" />
                <span className="font-bold text-xl">{userProfile?.credits?.toLocaleString() || 0}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Créditos</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-center gap-2 text-orange-500">
                <Flame size={18} fill="currentColor" />
                <span className="font-bold text-xl">{userProfile?.stats?.daysStreak || 0}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Dias seguidos</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-center gap-2 text-yellow-500">
                <Star size={18} fill="currentColor" />
                <span className="font-bold text-xl">{(userProfile?.lifetimeXp || 0).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">XP Total</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#c5a059]/10 text-[#c5a059]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <>
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <User size={18} className="text-[#c5a059]" />
                  Informações Pessoais
                </h3>
                
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Nome</label>
                  <input
                    type="text"
                    value={editedProfile.displayName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, displayName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059]/50 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Bio</label>
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    rows={3}
                    placeholder="Conte um pouco sobre você..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059]/50 transition-colors resize-none"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Slogan</label>
                  <input
                    type="text"
                    value={editedProfile.slogan}
                    onChange={(e) => setEditedProfile({ ...editedProfile, slogan: e.target.value })}
                    placeholder="Sua frase de impacto..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059]/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Instagram</label>
                    <input
                      type="text"
                      value={editedProfile.instagram}
                      onChange={(e) => setEditedProfile({ ...editedProfile, instagram: e.target.value })}
                      placeholder="@seuinstagram"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Cidade/Estado</label>
                    <input
                      type="text"
                      value={`${editedProfile.city || ''}, ${editedProfile.state || ''}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(',');
                        setEditedProfile({ 
                          ...editedProfile, 
                          city: parts[0]?.trim() || '',
                          state: parts[1]?.trim() || ''
                        });
                      }}
                      placeholder="São Paulo, SP"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059]/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3 bg-[#c5a059] text-white font-bold rounded-xl hover:bg-[#c5a059]/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  Salvar Alterações
                </button>
              </div>

              {/* Links Rápidos */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <h3 className="font-bold text-white mb-4">Atividades</h3>
                {[
                  { icon: <BookOpen size={18} />, label: 'Capítulos Lidos', value: userProfile?.stats?.totalChaptersRead || 0 },
                  { icon: <MessageSquare size={18} />, label: 'Mensagens no Chat', value: userProfile?.stats?.totalChatMessages || 0 },
                  { icon: <Image size={18} />, label: 'Imagens Geradas', value: userProfile?.stats?.totalImagesGenerated || 0 },
                  { icon: <Mic size={18} />, label: 'Podcasts Criados', value: userProfile?.stats?.totalSermonsCreated || 0 },
                  { icon: <FileText size={18} />, label: 'Estudos Criados', value: userProfile?.stats?.studiesCreated || 0 },
                  { icon: <Award size={18} />, label: 'Badges Conquistados', value: userProfile?.badges?.length || 0 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3 text-gray-300">
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="font-bold text-[#c5a059]">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bell size={18} className="text-[#c5a059]" />
                Preferências de Notificação
              </h3>
              
              {[
                { id: 'prayer', label: 'Novas solicitações de oração', enabled: true },
                { id: 'devotional', label: 'Lembrete de devocional diário', enabled: true },
                { id: 'study', label: 'Atualizações de estudos', enabled: true },
                { id: 'social', label: 'Novos comentários e interações', enabled: false },
                { id: 'marketing', label: 'Novidades do BíbliaLM', enabled: false },
              ].map((item, i) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-gray-300 text-sm">{item.label}</span>
                  <button 
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      item.enabled ? 'bg-[#c5a059]' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                      item.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Palette size={18} className="text-[#c5a059]" />
                Aparência
              </h3>
              
              <div className="space-y-3">
                <label className="text-xs text-gray-400 block mb-1.5">Tema</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['dark', 'light'].map(theme => (
                    <button
                      key={theme}
                      onClick={() => setEditedProfile({ ...editedProfile, theme: theme as 'light' | 'dark' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        editedProfile.theme === theme 
                          ? 'border-[#c5a059] bg-[#c5a059]/10' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-full h-16 rounded-lg mb-2 ${
                        theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-100'
                      }`} />
                      <span className="text-sm font-medium text-white capitalize">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-[#c5a059]" />
                Privacidade
              </h3>
              
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <span className="text-gray-300 text-sm block">Perfil Público</span>
                  <span className="text-xs text-gray-500">Outros usuários podem ver seu perfil</span>
                </div>
                <button 
                  onClick={() => setEditedProfile({ ...editedProfile, isProfilePublic: !editedProfile.isProfilePublic })}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    editedProfile.isProfilePublic ? 'bg-[#c5a059]' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                    editedProfile.isProfilePublic ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <span className="text-gray-300 text-sm block">Sair da conta</span>
                  <span className="text-xs text-gray-500">Faça logout da sua conta</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Plano Atual */}
              <div className="p-6 bg-gradient-to-br from-[#c5a059]/20 to-[#c5a059]/5 border border-[#c5a059]/30 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">Plano {tierNames[userProfile?.subscriptionTier || 'free']}</h3>
                    <p className="text-sm text-gray-400">
                      {userProfile?.subscriptionStatus === 'active' 
                        ? 'Ativo' 
                        : 'Sem assinatura'}
                    </p>
                  </div>
                  <Crown size={32} className="text-[#c5a059]" />
                </div>
                
                {userProfile?.subscriptionTier === 'free' ? (
                  <button
                    onClick={openSubscription}
                    className="w-full py-3 bg-[#c5a059] text-white font-bold rounded-xl hover:bg-[#c5a059]/90 transition-colors"
                  >
                    Fazer Upgrade
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">
                      Créditos restantes: <span className="text-[#c5a059] font-bold">{userProfile?.credits}</span>
                    </p>
                    <button
                      onClick={openSubscription}
                      className="w-full py-3 border border-[#c5a059] text-[#c5a059] font-bold rounded-xl hover:bg-[#c5a059]/10 transition-colors"
                    >
                      Gerenciar Assinatura
                    </button>
                  </div>
                )}
              </div>

              {/* Benefícios */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h3 className="font-bold text-white mb-4">Seus Benefícios</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Análises de texto', available: true },
                    { label: 'Geração de imagens', available: userProfile?.subscriptionTier !== 'free' },
                    { label: 'Podcasts com IA', available: userProfile?.subscriptionTier !== 'free' },
                    { label: 'Estudos ilimitados', available: ['gold', 'pastor'].includes(userProfile?.subscriptionTier || '') },
                    { label: 'Badge exclusivo', available: ['bronze', 'silver', 'gold', 'pastor'].includes(userProfile?.subscriptionTier || '') },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.available ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <X size={18} className="text-gray-600" />
                      )}
                      <span className={`text-sm ${item.available ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
