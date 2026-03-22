"use client";
import { useNavigate } from '../utils/router';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import {
  loginWithGoogle, loginWithApple, loginWithEmail, registerWithEmail,
  logout, dbService, monitorAuthState, resetPasswordEmail, supabase
} from '../services/supabase';
import { UserProfile, Badge, ActionType, ReadingPosition, UserActivity, UserStats, SystemSettings, SubscriptionTier, UserUsage, PlanFeatures, AppNotification } from '../types';
import { BADGES, SUBSCRIPTION_PLANS } from '../constants';

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  general: { maintenanceMode: false, welcomeMessage: "Bem-vindo" },
  gamification: { xpReadingChapter: 20, xpDailyGoal: 50, xpDevotional: 15, xpCreateStudy: 30, xpShare: 10, xpMarkVerse: 2, xpCreateSermon: 40, xpCreateImage: 10, xpUseChat: 5 },
  links: { pixKey: "", supportUrl: "" },
  costs: { imageGen: 0, podcastGen: 0, deepAnalysis: 0, captionGen: 0, sermonGen: 0 },
  limits: { freeImages: 2, freePodcasts: 1, dailyFreeChat: 10 },
  subscription: {
    prices: {
      bronzeMonthly: 9.99, bronzeAnnual: 59.90,
      silverMonthly: 19.99, silverAnnual: 119.90,
      goldMonthly: 39.99, goldAnnual: 239.90
    },
    promo: { active: false, title: "Oferta Limitada", description: "Acesso total liberado!", color: "bg-bible-gold" }
  }
};

interface AuthContextType {
  currentUser: any | null;
  userProfile: UserProfile | null;
  systemSettings: SystemSettings;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  loading: boolean;
  isLoginModalOpen: boolean;
  intendedPath: string | null;
  openLogin: (path?: string) => void;
  closeLogin: () => void;
  setIntendedPath: (path: string | null) => void;
  signIn: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (identifier: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, n: string, u: string, city: string, state: string, tier?: SubscriptionTier, churchData?: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkFeatureAccess: (feature: keyof PlanFeatures) => boolean;
  incrementUsage: (feature: 'images' | 'podcasts' | 'analysis' | 'chat') => Promise<void>;
  upgradeSubscription: (tier: SubscriptionTier, duration?: 'monthly' | 'yearly') => Promise<void>;
  recordActivity: (action: ActionType, details: string, meta?: any) => Promise<void>;
  earnMana: (action: ActionType, details?: string) => Promise<void>;
  updateLastReadingPosition: (pos: ReadingPosition) => Promise<void>;
  markChapterCompleted: (bookId: string, chapter: number) => Promise<void>;
  notification: { message: string, type: 'success' | 'info' | 'badge' | 'error' | 'warning' } | null;
  showNotification: (message: string, type?: 'success' | 'info' | 'badge' | 'error' | 'warning') => void;
  clearNotification: () => void;
  newUnlockedBadge: Badge | null;
  clearBadgeNotification: () => void;
  markNotificationsAsRead: () => Promise<void>;
  addSystemNotification: (title: string, message: string, type: AppNotification['type'], link?: string) => Promise<void>;
  openSubscription: () => void;

  // Credit System
  isBuyCreditsModalOpen: boolean;
  openBuyCredits: () => void;
  closeBuyCredits: () => void;
  deductPoints: (amount: number) => Promise<boolean>;
  buyCredits: (amount: number, price: number) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [systemSettings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);
  const [intendedPath, setIntendedPath] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' | 'badge' | 'error' | 'warning' } | null>(null);
  const [newUnlockedBadge, setNewUnlockedBadge] = useState<Badge | null>(null);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const openLogin = (path?: string) => {
    if (path) setIntendedPath(path);
    setIsLoginModalOpen(true);
  };
  const closeLogin = () => setIsLoginModalOpen(false);

  const openBuyCredits = () => setIsBuyCreditsModalOpen(true);
  const closeBuyCredits = () => setIsBuyCreditsModalOpen(false);

  // Carrega configurações do sistema
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await dbService.getSystemSettings();
        if (settings) setSettings(prev => ({ ...prev, ...settings }));
      } catch (e) { /* silencioso */ }
    };
    loadSettings();
  }, []);

  const checkSubscriptionExpiry = useCallback((profile: UserProfile) => {
    if (!profile.subscriptionExpiresAt || profile.subscriptionTier === 'free' || profile.subscriptionTier === 'pastor' || profile.subscriptionTier === 'admin') return profile;
    const expiryDate = new Date(profile.subscriptionExpiresAt);
    if (new Date() > expiryDate) {
      dbService.updateUserProfile(profile.uid, { subscriptionTier: 'free', subscriptionStatus: 'inactive' });
      setNotification({ message: "Assinatura expirada.", type: 'info' });
      return { ...profile, subscriptionTier: 'free' as SubscriptionTier, subscriptionStatus: 'inactive' as const };
    }
    return profile;
  }, []);

  // Carrega notificações do usuário via Supabase
  const loadNotifications = useCallback(async (uid: string) => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('timestamp', { ascending: false })
        .limit(20);
      setNotifications((data ?? []).map((d: any) => ({
        id: d.id, title: d.title, message: d.message,
        type: d.type, timestamp: d.timestamp, read: d.read, link: d.link
      })));
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    const unsubscribe = monitorAuthState(async (user: any) => {
      setCurrentUser(user);

      if (user) {
        const uid = user?.id ?? user?.uid;
        if (!uid) {
          console.error("Usuário autenticado sem id/uid válido:", user);
          setUserProfile(null);
          setNotifications([]);
          setLoading(false);
          return;
        }

        let stage = 'getUserProfile';
        try {
          let profile = await dbService.getUserProfile(uid);

          if (!profile) {
            stage = 'createUserProfile:prepare';
            // Cria perfil automático
            const generatedUsername = (user.email ?? user.id).split('@')[0]
              .toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);

            const newProfile: any = {
              uid,
              email: user.email,
              displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || 'Membro',
              photoURL: user.user_metadata?.avatar_url ?? null,
              username: generatedUsername,
              lifetimeXp: 0,
              credits: 0,
              badges: ['event_early'],
              subscriptionTier: 'free',
              subscriptionStatus: 'active',
              activityLog: [],
              stats: { totalChaptersRead: 0, daysStreak: 1, studiesCreated: 0, totalDevotionalsRead: 0, totalNotes: 0, totalShares: 0, totalImagesGenerated: 0, totalChatMessages: 0, totalSermonsCreated: 0, totalVersesMarked: 0, totalQuizzesCompleted: 0, perfectQuizzes: 0 }
            };
            stage = 'createUserProfile:insert';
            await dbService.createUserProfile(uid, newProfile);
            stage = 'getUserProfile:afterCreate';
            profile = await dbService.getUserProfile(uid);
          }

          if (profile) {
            const checkedProfile = checkSubscriptionExpiry(profile);

            // Reset de cotas diárias
            const todayStr = new Date().toISOString().split('T')[0];
            if (checkedProfile.usageToday?.date !== todayStr) {
              const resetUsage: UserUsage = { date: todayStr, imagesCount: 0, podcastsCount: 0, analysisCount: 0, chatCount: 0 };
              try {
                stage = 'updateUserProfile:usageTodayReset';
                await dbService.updateUserProfile(uid, { usageToday: resetUsage });
                checkedProfile.usageToday = resetUsage;
              } catch { /* silencioso */ }
            }

            setUserProfile(checkedProfile);
          }

          stage = 'loadNotifications';
          await loadNotifications(uid);
        } catch (e: any) {
          const parsedError = e instanceof Error
            ? { type: 'Error', name: e.name, message: e.message, stack: e.stack }
            : {
                type: typeof e,
                raw: e,
                keys: e && typeof e === 'object' ? Object.keys(e) : [],
                stringified: (() => { try { return JSON.stringify(e); } catch { return String(e); } })()
              };

          console.error("Erro detalhado ao carregar perfil:", {
            uid,
            stage,
            message: e?.message,
            code: e?.code,
            details: e?.details,
            hint: e?.hint,
            parsedError
          });

          setUserProfile(prev => prev ?? {
            uid,
            email: user?.email || '',
            displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || 'Membro',
            photoURL: user?.user_metadata?.avatar_url || null,
            username: (user?.email || uid).split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20),
            credits: 0,
            lifetimeXp: 0,
            badges: ['event_early'],
            subscriptionTier: 'free',
            subscriptionStatus: 'active',
            activityLog: [],
            stats: {
              totalChaptersRead: 0, daysStreak: 1, studiesCreated: 0, totalDevotionalsRead: 0, totalNotes: 0,
              totalShares: 0, totalImagesGenerated: 0, totalChatMessages: 0, totalSermonsCreated: 0,
              totalVersesMarked: 0, totalQuizzesCompleted: 0, perfectQuizzes: 0
            },
            usageToday: { date: new Date().toISOString().split('T')[0], imagesCount: 0, podcastsCount: 0, analysisCount: 0, chatCount: 0 }
          } as UserProfile);
        }
      } else {
        setUserProfile(null);
        setNotifications([]);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [checkSubscriptionExpiry, loadNotifications]);

  // Inscrição realtime para notificações
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser?.id ?? currentUser?.uid;
    if (!uid) return;
    const channel = supabase
      .channel(`notifications_${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        () => loadNotifications(uid))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, loadNotifications]);

  const signIn = async () => { await loginWithGoogle(); };
  const signInWithApple = async () => { await loginWithApple(); };

  const signInWithEmail = async (identifier: string, p: string) => {
    let emailToUse = identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse);

    if (!isEmail) {
      const cleanUsername = identifier.replace('@', '').trim().toLowerCase();
      const resolvedEmail = await dbService.getEmailByUsername(cleanUsername);
      if (resolvedEmail) {
        emailToUse = resolvedEmail;
      } else {
        throw new Error("Nome de usuário não encontrado.");
      }
    }

    await loginWithEmail(emailToUse, p);
    setIsLoginModalOpen(false);
  };

  const signUpWithEmail = async (e: string, p: string, n: string, u: string, city: string, state: string, tier: SubscriptionTier = 'free', churchData?: any) => {
    const cred = await registerWithEmail(e, p, n);
    const profileData: any = {
      email: e,
      displayName: n,
      username: u.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      city,
      state,
      lifetimeXp: 0,
      credits: 0,
      badges: ['event_early'],
      subscriptionTier: tier,
      subscriptionStatus: 'active',
      activityLog: [],
      stats: { totalChaptersRead: 0, daysStreak: 1, studiesCreated: 0, totalDevotionalsRead: 0, totalNotes: 0, totalShares: 0, totalImagesGenerated: 0, totalChatMessages: 0, totalSermonsCreated: 0, totalVersesMarked: 0, totalQuizzesCompleted: 0, perfectQuizzes: 0 },
      usageToday: { date: new Date().toISOString().split('T')[0], imagesCount: 0, podcastsCount: 0, analysisCount: 0, chatCount: 0 }
    };

    if (churchData) {
      profileData.churchData = churchData;
      profileData.lifetimeXp = 50;
    }

    await dbService.createUserProfile(cred.user!.id, profileData);
    setIsLoginModalOpen(false);
  };

  const resetPassword = async (email: string) => await resetPasswordEmail(email);
  const signOut = async () => await logout();

  const markNotificationsAsRead = async () => {
    if (!currentUser) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', currentUser.id)
      .in('id', unread.map(n => n.id));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addSystemNotification = async (title: string, message: string, type: AppNotification['type'], link?: string) => {
    if (!currentUser) return;
    await dbService.sendUserNotification(currentUser.id, title, message, type, link);
    await loadNotifications(currentUser.id);
  };

  const checkFeatureAccess = (feature: keyof PlanFeatures): boolean => {
    const tier = userProfile?.subscriptionTier || 'free';

    if (systemSettings?.featuresMatrix?.[tier]) {
      return !!systemSettings.featuresMatrix[tier][feature];
    }

    if (tier === 'gold' || tier === 'pastor' || tier === 'admin') return true;

    const freeFeatures: Array<keyof PlanFeatures> = [
      'aiChatAccess', 'readingPlans', 'audioNarration', 'focusMode',
      'socialFeedRead', 'socialFeedPost', 'muralPosting', 'followingSystem',
      'achievementBadges', 'advancedSearch'
    ];
    if (tier === 'free') return freeFeatures.includes(feature);
    return false;
  };

  const incrementUsage = async (feature: 'images' | 'podcasts' | 'analysis' | 'chat') => {
    if (!userProfile) return;
    const field = `${feature}Count`;
    const newVal = ((userProfile.usageToday as any)?.[field] || 0) + 1;
    const newUsageToday = { ...userProfile.usageToday, [field]: newVal } as UserUsage;
    await dbService.updateUserProfile(userProfile.uid, { usageToday: newUsageToday });
    setUserProfile(prev => prev ? { ...prev, usageToday: newUsageToday } : null);
  };

  const recordActivity = async (action: ActionType, details: string, meta: any = {}) => {
    if (!currentUser || !userProfile) return;
    const xpGained = meta.xpGained || 1;
    const currentXp = userProfile.lifetimeXp || 0;
    const newXp = currentXp + xpGained;
    const newActivity: UserActivity = { id: Date.now().toString(), type: action, description: details, timestamp: new Date().toISOString(), meta: { xpGained } };
    const newBadges: string[] = [...(userProfile.badges || [])];

    BADGES.forEach(badge => {
      if (badge.category === 'level' && badge.requirement && newXp >= badge.requirement && !newBadges.includes(badge.id)) {
        newBadges.push(badge.id);
        setNewUnlockedBadge(badge);
        addSystemNotification("Nova Conquista!", `Você desbloqueou o selo: ${badge.name}`, 'badge');
      }
    });

    await dbService.updateUserProfile(currentUser.id, { lifetimeXp: newXp, badges: newBadges });
    setUserProfile(prev => prev ? { ...prev, lifetimeXp: newXp, badges: newBadges } : null);
  };

  const markChapterCompleted = async (bookId: string, chapter: number) => {
    if (!currentUser || !userProfile) return;
    // Atualiza progresso local otimisticamente
    const currentProgress = userProfile.progress?.readChapters ?? {};
    const bookChapters = currentProgress[bookId] ?? [];
    if (!bookChapters.includes(chapter)) {
      const newProgress = {
        ...userProfile.progress,
        readChapters: { ...currentProgress, [bookId]: [...bookChapters, chapter] },
        lastActiveBookId: bookId,
        lastActiveChapter: chapter,
      };
      const newStats = { ...userProfile.stats, totalChaptersRead: (userProfile.stats?.totalChaptersRead || 0) + 1 };
      setUserProfile(prev => prev ? { ...prev, progress: newProgress as any, stats: newStats } : null);
      await dbService.updateUserProfile(currentUser.id, { progress: newProgress, stats: newStats });
    }
    await recordActivity('reading_chapter', `Capítulo lido: ${bookId} ${chapter}`, { xpGained: 20 });
  };

  const upgradeSubscription = async (tier: SubscriptionTier, duration: 'monthly' | 'yearly' = 'monthly') => {
    if (!currentUser) return;
    const expiry = new Date();
    if (duration === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
    else expiry.setFullYear(expiry.getFullYear() + 1);
    await dbService.updateUserProfile(currentUser.id, { subscriptionTier: tier, subscriptionStatus: 'active', subscriptionExpiresAt: expiry.toISOString() });
    setUserProfile(prev => prev ? { ...prev, subscriptionTier: tier, subscriptionStatus: 'active', subscriptionExpiresAt: expiry.toISOString() } : null);
    setNotification({ message: `Plano ${tier.toUpperCase()} ativado!`, type: 'success' });
    addSystemNotification("Assinatura Ativa", `Bem-vindo ao plano ${tier.toUpperCase()}!`, 'success');
  };

  const deductPoints = async (amount: number): Promise<boolean> => {
    if (!userProfile || (userProfile.credits || 0) < amount) return false;
    const newCredits = (userProfile.credits || 0) - amount;
    await dbService.updateUserProfile(userProfile.uid, { credits: newCredits });
    setUserProfile(prev => prev ? { ...prev, credits: newCredits } : null);
    return true;
  };

  const buyCredits = async (amount: number, _price: number) => {
    if (!userProfile) return;
    const newCredits = (userProfile.credits || 0) + amount;
    await dbService.updateUserProfile(userProfile.uid, { credits: newCredits });
    setUserProfile(prev => prev ? { ...prev, credits: newCredits } : null);
    setNotification({ message: `${amount} moedas adicionadas!`, type: 'success' });
  };

  return (
    <AuthContext.Provider value={{
      currentUser, userProfile, systemSettings, notifications, unreadNotificationsCount, loading,
      isLoginModalOpen, intendedPath, openLogin, closeLogin, setIntendedPath,
      signIn, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword, signOut,
      recordActivity, earnMana: (a, d) => recordActivity(a, d || 'Ação realizada'),
      updateLastReadingPosition: (p) => currentUser ? dbService.updateUserProfile(currentUser.id, { lastReadingPosition: p }) : Promise.resolve(),
      markChapterCompleted,
      notification, showNotification: (m, t = 'info') => setNotification({ message: m, type: t }), clearNotification: () => setNotification(null),
      newUnlockedBadge, clearBadgeNotification: () => setNewUnlockedBadge(null),
      checkFeatureAccess, incrementUsage, upgradeSubscription, markNotificationsAsRead, addSystemNotification,
      openSubscription: () => navigate('/planos'),
      isBuyCreditsModalOpen, openBuyCredits, closeBuyCredits, deductPoints, buyCredits,
      updateProfile: async (updates: Partial<UserProfile>) => {
        if (!currentUser) return;
        await dbService.updateUserProfile(currentUser.id, updates);
        setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      }
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

