"use client";
import { useNavigate, useLocation, useParams, useSearchParams } from '../../utils/router';

import React, { useEffect, useState, useRef } from 'react';

import Link from "next/link";
import { dbService } from '../../services/supabase';
import { UserProfile, SavedStudy, CustomPlan } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Loader2, MapPin, Church, Award, BookOpen, Share2, AlertTriangle, 
  ArrowLeft, LayoutGrid, Quote, TrendingUp, History, Star, 
  UserPlus, UserCheck, Users, Heart, Layout, Calendar, Eye, 
  Settings, LogOut, Edit2, Zap, Flame, Crown, Bell, Shield, Palette, Check, X, Camera, User
} from 'lucide-react';
import { BADGES } from '../../constants';
import { useHeader } from '../../contexts/HeaderContext';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import SEO from '../../components/SEO';

type Tab = 'overview' | 'studies' | 'plans' | 'followers' | 'following' | 'settings';
type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'privacy' | 'subscription';

const PublicUserProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile: myProfile, recordActivity, openLogin, showNotification, signOut, openSubscription } = useAuth();
  const { setTitle, resetHeader, setBreadcrumbs } = useHeader();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStudies, setUserStudies] = useState<SavedStudy[]>([]);
  const [userPlans, setUserPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('profile');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editedProfile, setEditedProfile] = useState({
    displayName: '',
    bio: '',
    slogan: '',
    instagram: '',
    city: '',
    state: '',
    isProfilePublic: true,
    theme: 'dark' as 'light' | 'dark',
  });

  const settingsRef = useRef<HTMLDivElement>(null);

  const isMeRoute = location.pathname === '/perfil' || location.pathname === '/minha-conta';
  const isOwner = currentUser && (isMeRoute || currentUser.uid === profile?.uid);

  useEffect(() => {
    if (myProfile && isMeRoute) {
        setEditedProfile({
            displayName: myProfile.displayName || '',
            bio: myProfile.bio || '',
            slogan: myProfile.slogan || '',
            instagram: myProfile.instagram || '',
            city: myProfile.city || '',
            state: myProfile.state || '',
            isProfilePublic: myProfile.isProfilePublic ?? true,
            theme: myProfile.theme || 'dark',
        });
    }
  }, [myProfile, isMeRoute]);

  const { updateProfile } = useAuth();

  useEffect(() => {
    if (profile) {
      setTitle(profile.displayName || 'Perfil');
      setBreadcrumbs([
        { label: 'O Reino', path: '/social' },
        { label: 'Perfil' }
      ]);
    }
    return () => resetHeader();
  }, [profile, setTitle, setBreadcrumbs, resetHeader]);

  useEffect(() => {
    const loadProfile = async () => {
        if (isMeRoute) {
            if (myProfile) {
                setProfile(myProfile);
                setLoading(false);
                fetchUserData(myProfile.uid);
            } else if (!currentUser) {
                openLogin();
                setLoading(false);
            }
            return;
        }

        if (!paramUsername) return;
        if (paramUsername.includes('.') || paramUsername === 'assets' || paramUsername === 'static') {
            setLoading(false);
            setNotFound(true);
            return;
        }

        if (myProfile && myProfile.username === paramUsername) {
             setProfile(myProfile);
             setLoading(false);
             fetchUserData(myProfile.uid);
             return;
        }

        const user = await dbService.getUserByUsername(paramUsername);
        if (!user || user.isProfilePublic === false) {
            setNotFound(true);
        } else {
            setProfile(user);
            if (currentUser && currentUser.uid !== user.uid) {
                const following = await dbService.checkIsFollowing(currentUser.uid, user.uid);
                setIsFollowing(following);
            }
            fetchUserData(user.uid);
        }
        setLoading(false);
    };

    const fetchUserData = async (uid: string) => {
        try {
            const studiesData = await dbService.getAll(uid, 'studies');
            const publicStudies = (studiesData as SavedStudy[]).filter(s => 
                (currentUser?.uid === uid) || 
                (s.source === 'sermon' || s.source === 'podcast' || s.source === 'geral' || s.source === 'plano')
            );
            setUserStudies(publicStudies);

            let plansData;
            if (currentUser?.uid === uid) {
                plansData = await dbService.getUserCustomPlans(uid);
            } else {
                plansData = await dbService.getPublicUserPlans(uid);
            }
            setUserPlans(plansData);
        } catch (e) {
            setUserStudies([]);
            setUserPlans([]);
        }
    };

    loadProfile();
  }, [paramUsername, currentUser, myProfile, isMeRoute]);

  const handleFollowToggle = async () => {
      if (!currentUser || !profile) { openLogin(); return; }
      const previousState = isFollowing;
      setIsFollowing(!isFollowing);
      try {
          if (previousState) await dbService.unfollowUser(currentUser.uid, profile.uid);
          else {
              await dbService.followUser(currentUser.uid, profile.uid, 
                  { displayName: myProfile?.displayName || 'Usuário', photoURL: myProfile?.photoURL, username: myProfile?.username },
                  { displayName: profile.displayName, photoURL: profile.photoURL, username: profile.username }
              );
              await recordActivity('social_follow', `Seguiu ${profile.displayName}`);
          }
      } catch (e) { setIsFollowing(previousState); }
  };
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(editedProfile);
      showNotification('Perfil atualizado!', 'success');
      // Update local profile state as well
      if (profile) setProfile({ ...profile, ...editedProfile });
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

  const tiers: Record<string, { name: string, color: string }> = {
    free: { name: 'Gratuito', color: 'text-gray-500' },
    bronze: { name: 'Bronze', color: 'text-amber-700' },
    silver: { name: 'Prata', color: 'text-gray-400' },
    gold: { name: 'Visionário', color: 'text-yellow-500' },
    pastor: { name: 'Pastor', color: 'text-purple-500' },
  };
  if (loading) return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-black">
          <Loader2 className="animate-spin text-bible-gold mb-4" size={40} />
          <p className="text-gray-500 font-serif italic">Carregando perfil...</p>
      </div>
  );

  if (notFound || !profile) return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-black p-6 text-center">
          <AlertTriangle size={64} className="text-bible-gold mb-6 opacity-20" />
          <h1 className="text-2xl font-serif font-bold mb-2">Perfil não encontrado</h1>
          <button onClick={() => navigate('/')} className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
              <ArrowLeft size={18} /> Voltar ao Início
          </button>
      </div>
  );

  const userBadges = BADGES.filter(badge => profile.badges?.includes(badge.id));

  return (
    <div className="h-full bg-gray-50 dark:bg-black overflow-y-auto">
      <SEO title={profile.displayName} />
      
      <div className="h-32 md:h-64 bg-gradient-to-r from-bible-gold to-yellow-600 relative shadow-inner">
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 -mt-12 md:-mt-20 z-10 space-y-4 pb-28">
          <div className="bg-white dark:bg-bible-darkPaper rounded-[2rem] shadow-xl p-5 md:p-8 border border-gray-100 dark:border-gray-800 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 text-center md:text-left">
                  <div className="w-24 h-24 md:w-40 md:h-40 rounded-[2rem] border-[4px] border-white dark:border-gray-800 shadow-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 -mt-16 md:-mt-24">
                      {profile.photoURL ? (
                          <img src={profile.photoURL} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                              {profile.displayName?.substring(0, 2).toUpperCase()}
                          </div>
                      )}
                  </div>
                  <div className="flex-1 w-full">
                      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-3">
                          <div className="min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                  <p className="text-xs font-black text-bible-gold uppercase tracking-[0.2em]">Cidadão do Reino</p>
                                  {profile.subscriptionTier && profile.subscriptionTier !== 'free' && (
                                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10`}>
                                          <Crown size={10} className={tiers[profile.subscriptionTier]?.color || 'text-bible-gold'} />
                                          <span className={`text-[8px] font-black uppercase ${tiers[profile.subscriptionTier]?.color || 'text-bible-gold'}`}>
                                              {tiers[profile.subscriptionTier]?.name}
                                          </span>
                                      </div>
                                  )}
                               </div>
                               <p className="text-xs font-bold text-gray-400">@{profile.username}</p>
                          </div>
                          <button 
                              onClick={isOwner ? () => navigate('/complete-profile') : handleFollowToggle}
                              className={`px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 shadow-md active:scale-95 ${
                                  isOwner || isFollowing 
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' 
                                  : 'bg-bible-leather dark:bg-bible-gold text-white dark:text-black'
                              }`}
                          >
                              {isOwner ? <Edit2 size={12} /> : isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
                              {isOwner ? 'Editar' : isFollowing ? 'Seguindo' : 'Seguir'}
                          </button>
                      </div>
                  </div>
              </div>

              {/* STATS REAL GRID NO MOBILE */}
              <div className={`grid ${isOwner ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mt-6 border-t border-gray-100 dark:border-gray-800 pt-4`}>
                  <div className="text-center" onClick={() => setActiveTab('followers')}>
                      <span className="block text-lg font-black text-gray-900 dark:text-white">{profile.followersCount || 0}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Seguidores</span>
                  </div>
                  <div className="text-center border-x border-gray-50 dark:border-gray-800" onClick={() => setActiveTab('following')}>
                      <span className="block text-lg font-black text-gray-900 dark:text-white">{profile.followingCount || 0}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Seguindo</span>
                  </div>
                  {isOwner && (
                      <div className="text-center border-r border-gray-50 dark:border-gray-800">
                          <span className="block text-lg font-black text-bible-gold">{profile.credits || 0}</span>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Créditos</span>
                      </div>
                  )}
                  <div className="text-center">
                      <span className="block text-lg font-black text-purple-600">{profile.lifetimeXp || 0}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Maná (XP)</span>
                  </div>
              </div>
          </div>

          <div className="bg-white dark:bg-bible-darkPaper rounded-[2rem] shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800 min-h-[300px]">
              {/* TAB SCROLLABLE NO MOBILE */}
              <div className="flex bg-gray-50 dark:bg-gray-900 p-1 border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar scroll-smooth">
                  {[
                      { id: 'overview', label: 'Início', icon: <LayoutGrid size={14} /> },
                      { id: 'studies', label: `Estudos`, icon: <BookOpen size={14} /> },
                      { id: 'plans', label: `Jornadas`, icon: <Layout size={14} /> },
                      { id: 'followers', label: 'Seguidores', icon: <Users size={14} /> },
                      ...(isOwner ? [{ id: 'settings', label: 'Conta', icon: <Settings size={14} /> }] : [])
                  ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)} 
                        className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-bible-gold shadow-sm' : 'text-gray-400'}`}
                      >
                          {tab.icon} {tab.label}
                      </button>
                  ))}
              </div>

              <div className="p-4 md:p-8">
                  {activeTab === 'settings' && isOwner && (
                      <div className="space-y-6 animate-in slide-in-from-right-4">
                          {/* Mini Navegação de Settings */}
                          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                              {[
                                  { id: 'profile', label: 'Perfil', icon: <User size={14} /> },
                                  { id: 'notifications', label: 'Avisos', icon: <Bell size={14} /> },
                                  { id: 'appearance', label: 'Visual', icon: <Palette size={14} /> },
                                  { id: 'privacy', label: 'Segurança', icon: <Shield size={14} /> },
                                  { id: 'subscription', label: 'Plano', icon: <Crown size={14} /> }
                              ].map(sTab => (
                                  <button
                                      key={sTab.id}
                                      onClick={() => setActiveSettingsTab(sTab.id as SettingsTab)}
                                      className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeSettingsTab === sTab.id ? 'bg-bible-gold/20 text-bible-gold border border-bible-gold/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
                                  >
                                      {sTab.icon} {sTab.label}
                                  </button>
                              ))}
                          </div>

                          <div className="space-y-6">
                              {activeSettingsTab === 'profile' && (
                                  <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Nome de Exibição</label>
                                              <input
                                                  type="text"
                                                  value={editedProfile.displayName}
                                                  onChange={(e) => setEditedProfile({ ...editedProfile, displayName: e.target.value })}
                                                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:border-bible-gold outline-none transition-all"
                                              />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Slogan / Frase</label>
                                              <input
                                                  type="text"
                                                  value={editedProfile.slogan}
                                                  onChange={(e) => setEditedProfile({ ...editedProfile, slogan: e.target.value })}
                                                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:border-bible-gold outline-none transition-all"
                                              />
                                          </div>
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Bio Curta</label>
                                          <textarea
                                              value={editedProfile.bio}
                                              onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                                              rows={3}
                                              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:border-bible-gold outline-none transition-all resize-none"
                                          />
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Instagram</label>
                                              <input
                                                  type="text"
                                                  value={editedProfile.instagram}
                                                  onChange={(e) => setEditedProfile({ ...editedProfile, instagram: e.target.value })}
                                                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:border-bible-gold outline-none transition-all"
                                              />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Cidade, UF</label>
                                              <input
                                                  type="text"
                                                  value={`${editedProfile.city}, ${editedProfile.state}`}
                                                  onChange={(e) => {
                                                      const [city, state] = e.target.value.split(',').map(s => s.trim());
                                                      setEditedProfile({ ...editedProfile, city: city || '', state: state || '' });
                                                  }}
                                                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:border-bible-gold outline-none transition-all"
                                              />
                                          </div>
                                      </div>
                                      <button
                                          onClick={handleSave}
                                          disabled={isSaving}
                                          className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                                      >
                                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                          Salvar Alterações
                                      </button>
                                  </div>
                              )}

                              {activeSettingsTab === 'notifications' && (
                                  <div className="space-y-4">
                                      {[
                                          { id: 'prayer', label: 'Novas solicitações de oração' },
                                          { id: 'devotional', label: 'Lembrete de devocinal diário' },
                                          { id: 'study', label: 'Atualizações de estudos' },
                                          { id: 'social', label: 'Novos seguidores e interações' }
                                      ].map((item) => (
                                          <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl">
                                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                                              <div className="w-10 h-5 bg-bible-gold rounded-full relative">
                                                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5" />
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {activeSettingsTab === 'appearance' && (
                                  <div className="grid grid-cols-2 gap-4">
                                      {['light', 'dark'].map(theme => (
                                          <button
                                              key={theme}
                                              onClick={() => setEditedProfile({ ...editedProfile, theme: theme as any })}
                                              className={`p-4 rounded-2xl border-2 transition-all ${editedProfile.theme === theme ? 'border-bible-gold bg-bible-gold/5' : 'border-gray-100 dark:border-gray-800'}`}
                                          >
                                              <div className={`w-full h-12 rounded-lg mb-2 ${theme === 'dark' ? 'bg-black' : 'bg-gray-200'}`} />
                                              <span className="text-[10px] font-black uppercase tracking-widest">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                                          </button>
                                      ))}
                                  </div>
                              )}

                              {activeSettingsTab === 'subscription' && (
                                  <div className="space-y-4">
                                      <div className="p-6 bg-gradient-to-br from-bible-gold/20 to-bible-gold/5 border border-bible-gold/30 rounded-[2rem] relative overflow-hidden">
                                          <div className="absolute -top-4 -right-4 opacity-5">
                                              <Crown size={120} />
                                          </div>
                                          <div className="relative z-10">
                                              <h3 className="font-black text-lg text-gray-900 dark:text-white mb-1">Status: {tiers[profile.subscriptionTier || 'free'].name}</h3>
                                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sua assinatura está ativa e renovando.</p>
                                              
                                              <div className="mt-6 flex flex-col gap-2">
                                                  <button 
                                                    onClick={openSubscription}
                                                    className="w-full py-3 bg-bible-gold text-black font-black uppercase tracking-widest text-[10px] rounded-xl shadow-md"
                                                  >
                                                      {profile.subscriptionTier === 'free' ? 'Fazer Upgrade' : 'Mudar de Plano'}
                                                  </button>
                                                  <button 
                                                    onClick={openSubscription}
                                                    className="w-full py-3 bg-white/10 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-xl"
                                                  >
                                                      Gerenciar Fatura
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {activeSettingsTab === 'privacy' && (
                                  <div className="space-y-3">
                                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl">
                                          <div>
                                              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Perfil Público</p>
                                              <p className="text-[9px] text-gray-500">Outros usuários podem te encontrar</p>
                                          </div>
                                          <button 
                                              onClick={() => setEditedProfile({ ...editedProfile, isProfilePublic: !editedProfile.isProfilePublic })}
                                              className={`w-10 h-5 rounded-full relative transition-all ${editedProfile.isProfilePublic ? 'bg-bible-gold' : 'bg-gray-300 dark:bg-gray-700'}`}
                                          >
                                              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${editedProfile.isProfilePublic ? 'right-0.5' : 'left-0.5'}`} />
                                          </button>
                                      </div>
                                      <button 
                                          onClick={handleLogout}
                                          className="w-full p-4 flex items-center justify-center gap-2 text-red-500 font-black uppercase tracking-widest text-[10px] bg-red-500/5 border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-all"
                                      >
                                          <LogOut size={16} /> Sair da Conta
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  {activeTab === 'overview' && (
                      <div className="space-y-6 animate-in fade-in">
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                              <h4 className="font-black text-gray-900 dark:text-white mb-4 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2"><History size={14} /> Estatísticas Vitais</h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
                                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Capítulos</span>
                                      <span className="text-xl font-black text-gray-900 dark:text-white">{profile.stats?.totalChaptersRead || 0}</span>
                                  </div>
                                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
                                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Constância</span>
                                      <span className="text-xl font-black text-gray-900 dark:text-white">{profile.stats?.daysStreak || 0}d</span>
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-4">
                              <h4 className="font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Award size={14} /> Conquistas Recentes</h4>
                              <div className="grid grid-cols-4 gap-3">
                                  {profile.badges?.slice(0, 4).map((badgeId: string) => {
                                      const b = BADGES.find(x => x.id === badgeId);
                                      if (!b) return null;
                                      return (
                                          <div key={badgeId} className="aspect-square bg-gray-50 dark:bg-gray-900/50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800">
                                              <span className="text-2xl">{b.icon}</span>
                                          </div>
                                      );
                                  })}
                                  {(!profile.badges || profile.badges.length === 0) && (
                                      <div className="col-span-4 py-8 text-center text-gray-400 text-[10px] italic">Nenhuma conquista ainda.</div>
                                  )}
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'plans' && (
                      <div className="space-y-4 animate-in fade-in">
                          {userPlans.length === 0 ? (
                              <div className="py-20 text-center text-gray-400 text-xs italic">Nenhuma jornada pública encontrada.</div>
                          ) : (
                              userPlans.map(plan => (
                                  <div key={plan.id} className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                                      <h4 className="font-black text-gray-900 dark:text-white text-sm">{plan.title}</h4>
                                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">{plan.totalDays} Dias de Jornada</p>
                                  </div>
                              ))
                          )}
                      </div>
                  )}

                  {activeTab === 'followers' && (
                      <div className="space-y-3 animate-in fade-in">
                          {followersList.length === 0 ? (
                              <div className="py-20 text-center text-gray-400 text-xs italic">Ainda não possui seguidores.</div>
                          ) : (
                              followersList.map(f => (
                                  <div key={f.id} onClick={() => navigate(`/p/${f.username}`)} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 cursor-pointer">
                                      <div className="w-10 h-10 rounded-full bg-bible-gold/20" />
                                      <span className="font-bold text-sm text-gray-900 dark:text-white">@{f.username}</span>
                                  </div>
                              ))
                          )}
                      </div>
                  )}

                  {activeTab === 'studies' && (
                      <div className="grid grid-cols-1 gap-3 animate-in fade-in">
                          {userStudies.length === 0 ? (
                              <div className="py-20 text-center text-gray-400 text-xs italic">Nenhum estudo compartilhado.</div>
                          ) : (
                              userStudies.map(study => (
                                  <div key={study.id} onClick={() => navigate(`/v/${study.id}`)} className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-all cursor-pointer group">
                                      <h4 className="font-black text-sm text-gray-900 dark:text-white truncate group-hover:text-bible-gold transition-colors">{study.title}</h4>
                                      <p className="text-[10px] text-gray-500 line-clamp-1 mt-1 uppercase tracking-widest font-black opacity-60">Estudo Realizado</p>
                                  </div>
                              ))
                          )}
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default PublicUserProfilePage;