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
  UserPlus, UserCheck, Users, Heart, Layout, Calendar, Eye, Settings, LogOut, Edit2
} from 'lucide-react';
import { BADGES } from '../../constants';
import { useHeader } from '../../contexts/HeaderContext';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import SEO from '../../components/SEO';

type Tab = 'overview' | 'studies' | 'plans' | 'followers' | 'following';

const PublicUserProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile: myProfile, recordActivity, openLogin, showNotification, signOut } = useAuth();
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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const isMeRoute = location.pathname === '/perfil';
  const isOwner = currentUser && (isMeRoute || currentUser.uid === profile?.uid);

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
                              <p className="text-xs font-black text-bible-gold uppercase tracking-[0.2em] mb-1">Cidadão do Reino</p>
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
              <div className="grid grid-cols-3 gap-2 mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="text-center" onClick={() => setActiveTab('followers')}>
                      <span className="block text-lg font-black text-gray-900 dark:text-white">{profile.followersCount || 0}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Seguidores</span>
                  </div>
                  <div className="text-center border-x border-gray-50 dark:border-gray-800" onClick={() => setActiveTab('following')}>
                      <span className="block text-lg font-black text-gray-900 dark:text-white">{profile.followingCount || 0}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Seguindo</span>
                  </div>
                  <div className="text-center">
                      <span className="block text-lg font-black text-purple-600">{profile.lifetimeXp || 0}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Maná</span>
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
                      { id: 'followers', label: 'Seguidores', icon: <Users size={14} /> }
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
                  {activeTab === 'overview' && (
                      <div className="space-y-6 animate-in fade-in">
                          {userBadges.length > 0 && (
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                  {userBadges.slice(0, 8).map(badge => (
                                      <div key={badge.id} className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-bible-gold/10 border border-bible-gold/20 shadow-sm">
                                          {badge.icon}
                                      </div>
                                  ))}
                              </div>
                          )}
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                              <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-xs uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} /> Estatísticas</h4>
                              <div className="space-y-2">
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">Constância</span><span className="font-bold">{profile.stats?.daysStreak || 0} dias</span></div>
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">Capítulos Lidos</span><span className="font-bold">{profile.stats?.totalChaptersRead || 0}</span></div>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'studies' && (
                      <div className="grid grid-cols-1 gap-3 animate-in fade-in">
                          {userStudies.length === 0 ? (
                              <div className="py-12 text-center text-gray-400 text-xs italic">Nenhum estudo público.</div>
                          ) : (
                              userStudies.map(study => (
                                  <div key={study.id} onClick={() => navigate(`/v/${study.id}`)} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-all cursor-pointer">
                                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{study.title}</h4>
                                      <p className="text-[10px] text-gray-500 line-clamp-1 mt-1">{study.analysis.replace(/<[^>]*>/g, '')}</p>
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