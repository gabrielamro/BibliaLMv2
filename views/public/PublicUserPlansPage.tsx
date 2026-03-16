"use client";
import { useNavigate, useParams } from '../../utils/router';


import React, { useEffect, useState } from 'react';

import Link from "next/link";
import { dbService } from '../../services/supabase';
import { UserProfile, CustomPlan } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Loader2, MapPin, Church, AlertTriangle, ArrowLeft, 
  UserPlus, UserCheck, Layout, Calendar, Eye, Share2
} from 'lucide-react';
import SEO from '../../components/SEO';

const PublicUserPlansPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile: myProfile, recordActivity, openLogin, showNotification } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        if (!username) return;

        if (username.includes('.') || username === 'assets' || username === 'static') {
            setLoading(false);
            setNotFound(true);
            return;
        }

        try {
            const user = await dbService.getUserByUsername(username);
            
            if (!user || user.isProfilePublic === false) {
                setNotFound(true);
            } else {
                setProfile(user);
                
                // Check follow status
                if (currentUser && currentUser.uid !== user.uid) {
                    const following = await dbService.checkIsFollowing(currentUser.uid, user.uid);
                    setIsFollowing(following);
                }

                // Fetch Public Plans
                const publicPlans = await dbService.getPublicUserPlans(user.uid);
                setPlans(publicPlans);
            }
        } catch (e) {
            console.error("Error fetching data", e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [username, currentUser]);

  const handleFollowToggle = async () => {
      if (!currentUser || !profile) {
          openLogin();
          return;
      }

      const previousState = isFollowing;
      setIsFollowing(!isFollowing);
      
      try {
          if (previousState) {
              await dbService.unfollowUser(currentUser.uid, profile.uid);
          } else {
              await dbService.followUser(
                  currentUser.uid, 
                  profile.uid, 
                  { 
                      displayName: myProfile?.displayName || 'Usuário', 
                      photoURL: myProfile?.photoURL,
                      username: myProfile?.username 
                  },
                  {
                      displayName: profile.displayName,
                      photoURL: profile.photoURL,
                      username: profile.username
                  }
              );
              await recordActivity('social_follow', `Seguiu ${profile.displayName}`);
          }
      } catch (e) {
          setIsFollowing(previousState);
          console.error(e);
      }
  };

  const handleSharePlan = (e: React.MouseEvent, planId: string) => {
      e.stopPropagation();
      const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'https://biblialm.com.br';
      const url = `${origin}/#/jornada/${planId}`;
      if (navigator.share) {
          navigator.share({ title: 'Jornada Pastoral', url });
      } else {
          navigator.clipboard.writeText(url);
          showNotification("Link copiado!", "success");
      }
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-black/20">
              <Loader2 className="animate-spin text-bible-gold mb-4" size={40} />
              <p className="text-gray-500 font-serif italic">Carregando Jornadas...</p>
          </div>
      );
  }

  if (notFound || !profile) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-black/20 p-6 text-center">
              <AlertTriangle size={64} className="text-bible-gold mb-6 opacity-20" />
              <h1 className="text-2xl font-serif font-bold text-bible-leather dark:text-bible-gold mb-2">Perfil não encontrado</h1>
              <button onClick={() => navigate('/')} className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                  <ArrowLeft size={18} /> Voltar ao Início
              </button>
          </div>
      );
  }

  const isOwner = currentUser?.uid === profile.uid;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 flex flex-col relative">
      <SEO title={`Jornadas de ${profile.displayName}`} description={`Confira as séries de estudo criadas por ${profile.displayName}.`} />

      <div className="h-40 md:h-52 bg-gradient-to-r from-bible-gold to-yellow-600 shrink-0 relative">
          <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors z-20">
              <ArrowLeft size={20} />
          </button>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 -mt-16 md:-mt-20 z-10 space-y-8 pb-20">
          
          {/* Header Profile Card */}
          <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 relative flex flex-col md:flex-row items-center gap-6">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2rem] border-4 border-white dark:border-gray-800 shadow-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 -mt-16 md:-mt-0">
                  {profile.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                          {profile.displayName?.substring(0, 2).toUpperCase()}
                      </div>
                  )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white leading-tight">{profile.displayName}</h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2 text-sm text-gray-500">
                      <Link href={`/u/${profile.username}`} className="font-bold hover:text-bible-gold">@{profile.username}</Link>
                      {(profile.city || profile.state) && (
                          <span className="flex items-center gap-1"><MapPin size={12} /> {profile.city}-{profile.state}</span>
                      )}
                      {profile.churchData?.churchName && (
                          <span className="flex items-center gap-1 text-bible-gold font-bold"><Church size={12} /> {profile.churchData.churchName}</span>
                      )}
                  </div>
              </div>

              {!isOwner && (
                  <button 
                      onClick={handleFollowToggle}
                      className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                          isFollowing 
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700' 
                          : 'bg-bible-leather dark:bg-bible-gold text-white dark:text-black'
                      }`}
                  >
                      {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                  </button>
              )}
          </div>

          <div className="space-y-6">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 uppercase text-xs font-black tracking-widest px-2">
                  <Layout size={14} /> Jornadas Publicadas ({plans.length})
              </div>

              {plans.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                      <Layout size={40} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-400 font-bold">Nenhuma jornada publicada ainda.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {plans.map(plan => (
                          <div 
                              key={plan.id}
                              onClick={() => navigate(`/jornada/${plan.id}`)}
                              className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full"
                          >
                              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                                  <button onClick={(e) => handleSharePlan(e, plan.id)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:text-blue-500 text-gray-500 transition-colors shadow-sm">
                                      <Share2 size={16} />
                                  </button>
                              </div>

                              <div className="mb-6 pt-2">
                                  <span className="inline-block px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                                      {plan.category || 'Geral'}
                                  </span>
                                  <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-2 pr-4">
                                      {plan.title}
                                  </h3>
                                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                                      {plan.description}
                                  </p>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800 mt-auto">
                                  <div className="flex gap-4 text-xs font-bold text-gray-400">
                                      <span className="flex items-center gap-1"><Calendar size={14}/> {plan.weeks?.length || 0} Semanas</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-bible-gold text-xs font-bold group-hover:underline">
                                      Ver Jornada <Eye size={14} />
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>

      </div>
    </div>
  );
};

export default PublicUserPlansPage;
