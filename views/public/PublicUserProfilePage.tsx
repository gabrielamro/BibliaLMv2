"use client";
import { useNavigate, useLocation, useParams } from '../../utils/router';

import React, { useEffect, useState, useRef } from 'react';

import Link from "next/link";
import { dbService } from '../../services/supabase';
import { UserProfile, SavedStudy, CustomPlan, Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Loader2, Church, BookOpen, AlertTriangle, 
  ArrowLeft, LayoutGrid, Award, History,
  UserPlus, UserCheck, Heart, Layout, Calendar, Eye, 
  Edit2, Crown, DoorOpen, Sparkles, User, Bell, Palette, Shield, Check, LogOut, Instagram, MapPin
} from 'lucide-react';
import { BADGES } from '../../constants';
import { useHeader } from '../../contexts/HeaderContext';
import SEO from '../../components/SEO';
import { getProfileStudyItems } from '../../utils/contentEditing';
import { getProfileFeedPosts } from '../../utils/profileFeed';
import { FeedPostCard } from '../../components/social/FeedPostCard';
import { generateShareLink } from '../../utils/shareUtils';
import { postInteractionService } from '../../services/postInteractionService';
import { getPublicProfileTabs } from '../../utils/profileTabs';
type Tab = 'overview' | 'studies' | 'plans' | 'followers' | 'settings' | 'church';
type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'privacy' | 'subscription';

const PublicUserProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile: myProfile, recordActivity, openLogin, showNotification, signOut, openSubscription, updateProfile } = useAuth();
  const { setTitle, resetHeader, setBreadcrumbs } = useHeader();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userStudies, setUserStudies] = useState<SavedStudy[]>([]);
  const [userPlans, setUserPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('profile');
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
        const decodedUsername = decodeURIComponent(paramUsername);
        if (decodedUsername.includes('.') || decodedUsername === 'assets' || decodedUsername === 'static') {
            setLoading(false);
            setNotFound(true);
            return;
        }

        if (myProfile && myProfile.username === decodedUsername) {
             setProfile(myProfile);
             setLoading(false);
             fetchUserData(myProfile.uid);
             return;
        }

        const user = await dbService.getUserByUsername(decodedUsername);
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
            const [studiesResult, publicStudiesResult] = await Promise.allSettled([
                dbService.getAll(uid, 'studies'),
                dbService.getAll(uid, 'public_studies'),
            ]);
            const studiesData = studiesResult.status === 'fulfilled' ? studiesResult.value : [];
            const publicStudiesData = publicStudiesResult.status === 'fulfilled' ? publicStudiesResult.value : [];
            setUserStudies(getProfileStudyItems({
                studiesData: studiesData as any[],
                publicStudiesData: publicStudiesData as any[],
                isOwner: currentUser?.uid === uid,
            }) as SavedStudy[]);

            let plansData;
            if (currentUser?.uid === uid) {
                plansData = await dbService.getUserCustomPlans(uid);
            } else {
                plansData = await dbService.getPublicUserPlans(uid);
            }
            setUserPlans(plansData);

            const postsData = await dbService.getUserFeedPosts(uid, 50, myProfile);
            setUserPosts(getProfileFeedPosts(postsData, uid));
        } catch (e) {
            setUserPosts([]);
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

  const handlePostInteraction = async (postId: string, type: 'like' | 'comment' | 'share' | 'save') => {
    if (!currentUser) { openLogin(); return; }
    const targetPost = userPosts.find(post => post.id === postId);
    if (!targetPost) return;

    if (type === 'like') {
        const isLiked = targetPost.likedBy?.includes(currentUser.uid);
        const previousPost = targetPost;
        setUserPosts(prev => prev.map(post => {
            if (post.id !== postId) return post;
            const likedBy = isLiked
                ? (post.likedBy || []).filter(uid => uid !== currentUser.uid)
                : [...(post.likedBy || []), currentUser.uid];
            return { ...post, likedBy, likesCount: likedBy.length, likes: likedBy.length };
        }));
        try {
          const persisted = await postInteractionService.setLiked(targetPost, currentUser.uid, !isLiked);
          setUserPosts(prev => prev.map(post => post.id === postId ? persisted : post));
        } catch {
          setUserPosts(prev => prev.map(post => post.id === postId ? previousPost : post));
          showNotification('Não foi possível atualizar a curtida.', 'error');
        }
        return;
    }

    if (type === 'share') {
        const shareUrl = generateShareLink('post', { postId });
        if (navigator.share) {
            await navigator.share({ title: 'Culto+', url: shareUrl });
        } else {
            await navigator.clipboard.writeText(shareUrl);
            showNotification('Link copiado!', 'success');
        }
        return;
    }

    if (type === 'comment') {
        navigate(`/p/${postId}`);
        return;
    }

    if (type === 'save') {
        const desired = !targetPost.saved;
        setUserPosts(prev => prev.map(post => post.id === postId ? { ...post, saved: desired } : post));
        try {
          const persisted = await postInteractionService.setSaved(targetPost, desired);
          setUserPosts(prev => prev.map(post => post.id === postId ? persisted : post));
          showNotification(desired ? 'Publicação salva.' : 'Removida dos salvos.', 'success');
        } catch {
          setUserPosts(prev => prev.map(post => post.id === postId ? targetPost : post));
          showNotification('Não foi possível atualizar os salvos.', 'error');
        }
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
  const profileLocation = [profile.city, profile.state].filter(Boolean).join(', ');
  const instagramUsername = profile.instagram?.replace('@', '').trim();
  const instagramHref = instagramUsername ? `https://instagram.com/${instagramUsername}` : null;

  return (
    <div data-module="kingdom" className="h-full overflow-y-auto bg-[#fdfbf7] dark:bg-[#0b0b0c]">
      <SEO title={profile.displayName} />
      
      <div className="relative h-24 bg-gradient-to-r from-[#53247b] via-[#bd397f] to-[#ff744f] shadow-inner md:h-36">
      </div>

      <div className="z-10 mx-auto w-full max-w-[980px] space-y-4 px-4 pb-28 -mt-10 md:-mt-14">
          <div className="relative rounded-[1.5rem] border border-[#e4d9df] bg-white p-5 shadow-[0_18px_55px_rgba(58,29,71,0.10)] dark:border-fuchsia-300/15 dark:bg-[#1a1620] md:p-7">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 text-center md:text-left">
                  <div className="h-24 w-24 flex-shrink-0 -mt-14 overflow-hidden rounded-[1.5rem] border-[4px] border-white bg-gray-200 shadow-2xl dark:border-[#1a1620] dark:bg-gray-700 md:h-28 md:w-28 md:-mt-16">
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
                          <div className="flex min-w-0 flex-col items-center space-y-2 text-center md:items-start md:text-left">
                               <div className="flex w-full flex-wrap items-center justify-center gap-2 md:justify-start">
                                  <h1 className="max-w-full truncate text-2xl font-black leading-tight text-gray-950 dark:text-white md:text-3xl">{profile.displayName || `@${profile.username}`}</h1>
                                  {profile.subscriptionTier && profile.subscriptionTier !== 'free' && profile.subscriptionTier !== 'pastor' && profile.subscriptionTier !== 'admin' && (
                                      <div className="inline-flex min-h-6 items-center gap-1 rounded-full border border-bible-gold/20 bg-bible-gold/10 px-2.5">
                                          <Crown size={11} className={tiers[profile.subscriptionTier]?.color || 'text-bible-gold'} />
                                          <span className={`text-[9px] font-black uppercase tracking-widest ${tiers[profile.subscriptionTier]?.color || 'text-bible-gold'}`}>
                                              {tiers[profile.subscriptionTier]?.name}
                                          </span>
                                      </div>
                                  )}
                               </div>
                               <div className="flex w-full flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 md:justify-start">
                                  <span className="inline-flex min-h-7 items-center rounded-full bg-gray-100 px-3 dark:bg-gray-900/70">@{profile.username}</span>
                                  {profileLocation && (
                                      <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-gray-100 px-3 dark:bg-gray-900/70">
                                          <MapPin size={12} className="text-bible-gold" />
                                          {profileLocation}
                                      </span>
                                  )}
                                  {instagramHref && (
                                      <a
                                        href={instagramHref}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={`Abrir Instagram de ${profile.displayName || profile.username}`}
                                        className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-gray-100 px-3 transition-colors hover:bg-pink-50 hover:text-pink-600 dark:bg-gray-900/70 dark:hover:bg-pink-950/30"
                                      >
                                          <Instagram size={12} />
                                          Instagram
                                      </a>
                                  )}
                               </div>
                               {profile.slogan && (
                                  <p className="max-w-xl text-sm font-bold leading-snug text-gray-800 dark:text-gray-200">
                                      {profile.slogan}
                                  </p>
                               )}
                               {profile.bio && (
                                  <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                      {profile.bio}
                                  </p>
                               )}
                               {profile.churchData?.churchName && (
                                  <button
                                    type="button"
                                    onClick={() => profile.churchData?.churchSlug && navigate(`/igreja/${profile.churchData.churchSlug}`)}
                                    className="inline-flex min-h-8 max-w-full items-center justify-center gap-1.5 rounded-xl border border-bible-gold/15 bg-bible-gold/10 px-3 text-[10px] font-black uppercase tracking-widest text-bible-gold transition-all hover:bg-bible-gold hover:text-white disabled:cursor-default disabled:opacity-70 md:justify-start"
                                    disabled={!profile.churchData?.churchSlug}
                                    title="Ir para a pagina da igreja"
                                  >
                                      <Church size={12} />
                                      <span className="text-gray-500 dark:text-gray-400">Membro</span>
                                      <span className="text-gray-300 dark:text-gray-700">/</span>
                                      <span className="max-w-[220px] truncate">{profile.churchData.churchName}</span>
                                  </button>
                               )}
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
                  <div className="text-center">
                      <span className="block text-lg font-black text-gray-900 dark:text-white">{profile.followersCount || 0}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Seguidores</span>
                  </div>
                  <div className="text-center border-x border-gray-50 dark:border-gray-800">
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
                      ...(profile.churchData ? [{ id: 'church', label: 'Igreja', icon: <Church size={14} /> }] : [])
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
                  {false && (
                      <div className="space-y-6 animate-in slide-in-from-right-4">
                          {/* Mini Navegação de Settings */}
                          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                              {[
                                  { id: 'profile', label: 'Perfil', icon: <User size={14} /> },
                                  { id: 'notifications', label: 'Avisos', icon: <Bell size={14} /> },
                                  { id: 'appearance', label: 'Visual', icon: <Palette size={14} /> },
                                  { id: 'privacy', label: 'Segurança', icon: <Shield size={14} /> },
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
                                              <h3 className="font-black text-lg text-gray-900 dark:text-white mb-1">Status: {tiers[profile!.subscriptionTier || 'free'].name}</h3>
                                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sua assinatura está ativa e renovando.</p>
                                              
                                              <div className="mt-6 flex flex-col gap-2">
                                                  <button 
                                                    onClick={() => openSubscription()}
                                                    className="w-full py-3 bg-bible-gold text-black font-black uppercase tracking-widest text-[10px] rounded-xl shadow-md"
                                                  >
                                                      {profile!.subscriptionTier === 'free' ? 'Fazer Upgrade' : 'Mudar de Plano'}
                                                  </button>
                                                  <button 
                                                    onClick={() => openSubscription()}
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
                      <div className="mx-auto max-w-2xl animate-in fade-in">
                          {userPosts.length === 0 ? (
                              <div className="py-20 text-center text-gray-400 text-xs italic">Nenhuma postagem encontrada.</div>
                          ) : (
                              userPosts.map(post => (
                                  <FeedPostCard
                                      key={post.id}
                                      post={post}
                                      currentUser={currentUser}
                                      onInteraction={handlePostInteraction}
                                      showNotification={showNotification}
                                  />
                              ))
                          )}
                      </div>
                  )}

                  {false && profile && activeTab === 'overview' && (
                      <div className="space-y-6 animate-in fade-in">
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                              <h4 className="font-black text-gray-900 dark:text-white mb-4 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2"><History size={14} /> Estatísticas Vitais</h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
                                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Capítulos</span>
                                      <span className="text-xl font-black text-gray-900 dark:text-white">{profile!.stats?.totalChaptersRead || 0}</span>
                                  </div>
                                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
                                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Constância</span>
                                      <span className="text-xl font-black text-gray-900 dark:text-white">{profile!.stats?.daysStreak || 0}d</span>
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-4">
                              <h4 className="font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Award size={14} /> Conquistas Recentes</h4>
                              <div className="grid grid-cols-4 gap-3">
                                  {profile!.badges?.slice(0, 4).map((badgeId: string) => {
                                      const b = BADGES.find(x => x.id === badgeId);
                                      if (!b) return null;
                                      return (
                                          <div key={badgeId} className="aspect-square bg-gray-50 dark:bg-gray-900/50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800">
                                              <span className="text-2xl">{b.icon}</span>
                                          </div>
                                      );
                                  })}
                                  {(!profile!.badges || profile!.badges.length === 0) && (
                                      <div className="col-span-4 py-8 text-center text-gray-400 text-[10px] italic">Nenhuma conquista ainda.</div>
                                  )}
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'plans' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-in fade-in">
                          {userPlans.length === 0 ? (
                              <div className="py-20 text-center text-gray-400 text-xs italic">Nenhuma jornada pública encontrada.</div>
                          ) : (
                              userPlans.map(plan => (
                                  <button
                                      key={plan.id}
                                      type="button"
                                      onClick={() => navigate(`/jornada/${plan.id}`)}
                                      className="group block overflow-hidden rounded-[1.75rem] border border-purple-300/60 bg-gradient-to-br from-[#2b174f] via-purple-800 to-violet-600 text-left shadow-2xl shadow-purple-900/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                                  >
                                      <div className="relative h-36 bg-black">
                                          {plan.coverUrl ? (
                                              <img src={plan.coverUrl} className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" loading="lazy" alt={plan.title} />
                                          ) : (
                                              <div className="flex h-full w-full items-center justify-center bg-purple-950/40">
                                                  <DoorOpen className="text-violet-100/50" size={42} />
                                              </div>
                                          )}
                                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                                          <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-purple-200/40 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-violet-100 backdrop-blur-md">
                                              <DoorOpen size={11} /> Sala publicada
                                          </div>
                                          <div className="absolute bottom-0 left-0 right-0 p-4">
                                              <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-violet-100/90">Sala do Reino</p>
                                              <h4 className="font-serif text-lg font-black leading-tight text-white line-clamp-2">{plan.title}</h4>
                                          </div>
                                      </div>
                                      <div className="space-y-3 p-4">
                                          <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">{plan.weeks.reduce((total, week) => total + week.days.length, 0)} dias</span>
                                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-violet-100/80"><Eye size={12} /> {(plan.viewsCount ?? 0).toLocaleString('pt-BR')}</span>
                                          </div>
                                          <span className="inline-flex rounded-full bg-white px-3 py-2 text-[9px] font-black uppercase tracking-widest text-purple-900">Entrar na sala</span>
                                      </div>
                                  </button>
                              ))
                          )}
                      </div>
                  )}

                  {activeTab === 'church' && profile.churchData && (
                      <div className="animate-in fade-in space-y-4">
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                              <h4 className="font-black text-gray-900 dark:text-white mb-4 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2"><Church size={14} /> Minha Igreja</h4>
                              <div className="flex flex-col md:flex-row items-center gap-6">
                                  <div className="w-20 h-20 bg-bible-gold/10 text-bible-gold rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                                      <Church size={32} />
                                  </div>
                                  <div className="text-center md:text-left">
                                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile.churchData.churchName}</h3>
                                      <p className="text-sm text-gray-500 mt-1">Conectado e Servindo</p>
                                      <button 
                                          onClick={() => navigate(`/igreja/${profile.churchData?.churchSlug}`)}
                                          className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                                      >
                                          Visitar Página da Igreja
                                      </button>
                                  </div>
                              </div>
                          </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-in fade-in">
                          {userStudies.length === 0 ? (
                              <div className="md:col-span-2 xl:col-span-3 py-20 text-center text-gray-400 text-xs italic">Nenhum estudo compartilhado.</div>
                          ) : (
                              userStudies.map(study => (
                                  <button
                                      key={study.id}
                                      type="button"
                                      onClick={() => navigate(`/v/${study.id}`)}
                                      className="group block overflow-hidden rounded-[1.75rem] border border-bible-gold/30 bg-gradient-to-br from-[#1f1710] via-[#2c2117] to-black text-left shadow-2xl shadow-bible-gold/10 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                                  >
                                      <div className="relative h-36 bg-black">
                                          {(study.coverUrl || study.coverImage) ? (
                                              <img src={study.coverUrl || study.coverImage} className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" loading="lazy" alt={study.title} />
                                          ) : (
                                              <div className="flex h-full w-full items-center justify-center bg-bible-gold/10">
                                                  <BookOpen className="text-bible-gold/40" size={42} />
                                              </div>
                                          )}
                                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                                          <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-bible-gold/30 bg-black/50 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-bible-gold backdrop-blur-md">
                                              <Sparkles size={11} /> Estudo em destaque
                                          </div>
                                          <div className="absolute bottom-0 left-0 right-0 p-4">
                                              <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-bible-gold/90">Estudo</p>
                                              <h4 className="font-serif text-lg font-black leading-tight text-white line-clamp-2">{study.title}</h4>
                                          </div>
                                      </div>
                                      <div className="space-y-3 p-4">
                                          <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Biblioteca do Reino</span>
                                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-50/80"><Eye size={12} /> {(study.viewsCount ?? 0).toLocaleString('pt-BR')}</span>
                                          </div>
                                          <span className="inline-flex rounded-full bg-bible-gold px-3 py-2 text-[9px] font-black uppercase tracking-widest text-black">Abrir estudo</span>
                                      </div>
                                  </button>
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
