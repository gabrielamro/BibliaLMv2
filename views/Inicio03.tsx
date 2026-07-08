"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from '../utils/router';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import {
  BookOpen, ChevronRight, Share2, Bookmark, Flame, Zap,
  Search, Bell, Settings, Home, Wand2, User, Play, Pause,
  Plus, FileText, Image, Mic, History, Trophy, Crown, Target, Heart, ArrowRight, Sun, Moon,
  Users, MessageSquare, Calendar, Sparkles, CreditCard, HelpCircle, Book, Layout, Coffee, Map, Brain,
  LifeBuoy, Scroll, ShieldCheck, Terminal, ShieldAlert, LogOut, UserCircle, X, Lock,
  HandHeart, Loader2, Globe, PenLine, Church, Clock, ChevronLeft, ListTodo
} from 'lucide-react';

import { useSettings } from '../contexts/SettingsContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { bibleService } from '../services/bibleService';
import { dbService } from '../services/supabase';
import { cultoPlusService } from '../services/cultoPlusService';
import { resolveUserDailyDevotional } from '../services/devotionalResolver';
import { BIBLE_BOOKS_LIST, DAILY_BIBLE_VERSES } from '../constants';
import { resolveBibleSearchNavigation } from '../utils/bibleSearchNavigation';
import { getBibleBookAutocomplete } from '../utils/bibleBookAutocomplete';
import { getReadingGoalProgress, INICIO_QUICK_ACCESS_GROUPS, type InicioQuickAccessItem } from '../utils/inicioHome';
import { getEditDestinationForContent, isStandaloneStudyContent } from '../utils/contentEditing';
import { getNoteAreaClasses, getNoteAreaTextClasses, normalizeServiceNote, normalizeStandardNote } from '../utils/centralizedNotes';
import { useKingdomFeed } from '../hooks/useKingdomFeed';
import { usePrayerWall } from '../hooks/usePrayerWall';
import { FeedPostCard } from '../components/social/FeedPostCard';
import KingdomComposer from '../components/social/KingdomComposer';
import { getMentionNotifications } from '../utils/kingdomHomeFeed';
import CultoPlusPublicAgenda from '../components/culto-plus/CultoPlusPublicAgenda';
import { getAgendaRange } from '../utils/cultoPlusCalendar';
import { canAccessPastoralWorkspace, isGeneralManager } from '../utils/profileAccess';
import type { ChurchService, Post } from '../types';
import PaidAccountBadge from '../components/PaidAccountBadge';

const quickAccessIcons: Record<InicioQuickAccessItem['iconKey'], React.ReactNode> = {
  book: <BookOpen size={16} />,
  target: <Target size={16} />,
  'book-marked': <Book size={16} />,
  wand: <Wand2 size={16} />,
  message: <MessageSquare size={16} />,
  history: <History size={16} />,
  coffee: <Coffee size={16} />,
  heart: <Heart size={16} />,
  map: <Map size={16} />,
  brain: <Brain size={16} />,
};

const LockOverlay: React.FC<{ message?: string; className?: string }> = ({ message = 'Login necessário', className = '' }) => {
  const { openLogin } = useAuth();

  return (
    <div
      onClick={(e) => { e.stopPropagation(); openLogin(); }}
      className={`absolute inset-0 z-40 bg-transparent hover:bg-black/5 rounded-2xl cursor-pointer transition-all flex items-start justify-end p-2 md:p-3 ${className}`}
    >
      <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md p-1.5 px-2.5 rounded-lg shadow-md border border-gray-200 dark:border-[#333] flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
        <Lock size={12} className="text-[#c5a059]" />
        <span className="text-gray-900 dark:text-white font-medium text-[9px] uppercase tracking-widest whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  );
};

const HomePanel: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`rounded-[2rem] border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#161616] p-6 md:p-7 ${className}`}>
    {children}
  </div>
);

const HomeSectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  isLightTheme: boolean;
}> = ({ icon, title, subtitle, actionLabel, onAction, isLightTheme }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
      {icon}
      <div>
        <h2 className="font-medium text-lg md:text-xl lg:text-2xl">{title}</h2>
        {subtitle && (
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className={`text-[#c5a059] font-medium text-[10px] tracking-widest uppercase transition-colors ${isLightTheme ? 'hover:text-[#111111]' : 'hover:text-white'}`}
      >
        {actionLabel}
      </button>
    )}
  </div>
);

// ─── REINO TAB COMPONENT ────────────────────────────────────────────────────

interface ReinoTabProps {
  currentUser: any;
  userProfile: any;
  notifications: any[];
  navigate: (path: string) => void;
  openLogin: () => void;
  showNotification: (msg: string, type: any) => void;
}

const FeedSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[0, 1].map(i => (
      <div key={i} className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-gray-200 dark:bg-[#2A2A2A] rounded w-1/3" />
            <div className="h-2 bg-gray-100 dark:bg-[#222] rounded w-1/4" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 dark:bg-[#222] rounded w-full" />
          <div className="h-3 bg-gray-100 dark:bg-[#222] rounded w-4/5" />
        </div>
      </div>
    ))}
  </div>
);

const PrayerSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[0, 1].map(i => (
      <div key={i} className="p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-[#252525]">
        <div className="h-3 bg-gray-200 dark:bg-[#2A2A2A] rounded w-1/3 mb-2" />
        <div className="h-2 bg-gray-100 dark:bg-[#222] rounded w-full mb-1" />
        <div className="h-2 bg-gray-100 dark:bg-[#222] rounded w-3/4 mb-3" />
        <div className="h-7 bg-gray-200 dark:bg-[#2A2A2A] rounded-lg" />
      </div>
    ))}
  </div>
);

const KingdomPostGridSection: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  posts: Post[];
  currentUser: any;
  onInteraction: (postId: string, type: 'like' | 'comment' | 'share' | 'save') => void;
  showNotification: (msg: string, type: any) => void;
  emptyLabel: string;
}> = ({ title, subtitle, icon, posts, currentUser, onInteraction, showNotification, emptyLabel }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <div>
        <h3 className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {subtitle && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>

    {posts.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141414] py-8 px-4 text-center text-xs text-gray-400">
        {emptyLabel}
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {posts.map(post => (
          <div key={post.id} className="rounded-2xl overflow-hidden border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#141414]">
            <FeedPostCard
              post={post}
              currentUser={currentUser}
              onInteraction={onInteraction}
              showNotification={showNotification}
            />
          </div>
        ))}
      </div>
    )}
  </section>
);

const ReinoTab: React.FC<ReinoTabProps> = ({
  currentUser, userProfile, notifications, navigate, openLogin, showNotification
}) => {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const churchId = userProfile?.churchData?.churchId;
  const churchName = userProfile?.churchData?.churchName;

  const {
    posts,
    groups,
    highlightedPosts,
    churchPosts,
    groupSections,
    isLoading: feedLoading,
    reload: reloadFeed,
  } = useKingdomFeed(userProfile);
  const { prayers, isLoading: prayersLoading, intercede } = usePrayerWall(churchId);

  // Menções: filtra notificações do tipo social/info dos últimas 5 entradas
  const mentions = useMemo(
    () => getMentionNotifications(notifications || [], userProfile),
    [notifications, userProfile]
  );

  const handleInteraction = useCallback(async (postId: string, type: 'like' | 'comment' | 'share' | 'save') => {
    if (!currentUser) { openLogin(); return; }
    if (type === 'like') {
      const target = posts.find(p => p.id === postId);
      if (!target) return;
      const isLiked = target.likedBy?.includes(currentUser.uid);
      await dbService.togglePostLike(postId, currentUser.uid, !!isLiked);
      reloadFeed();
    } else if (type === 'comment') {
      navigate(`/p/${postId}`);
    } else if (type === 'share') {
      const url = `${window.location.origin}/p/${postId}`;
      if (navigator.share) {
        await navigator.share({ title: 'BíbliaLM', url });
      } else {
        navigator.clipboard.writeText(url);
        showNotification('Link copiado!', 'success');
      }
    }
  }, [currentUser, posts, reloadFeed, openLogin, navigate, showNotification]);

  const handleInterced = useCallback(async (prayerId: string) => {
    if (!currentUser) { openLogin(); return; }
    const prayer = prayers.find(p => p.id === prayerId);
    if (!prayer) return;
    const isActive = !prayer.intercessors.includes(currentUser.uid);
    await intercede(prayerId, currentUser.uid, isActive);
    showNotification(isActive ? '🙏 Oração registrada!' : 'Intercessão removida.', 'success');
  }, [currentUser, prayers, intercede, openLogin, showNotification]);

  return (
    <div className="space-y-6">

      {/* HEAD REINO */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 flex items-center justify-between relative overflow-hidden">
        {!currentUser && <LockOverlay message="Entrar na comunidade" />}
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 flex-1">
          <h2 className="text-white font-medium text-2xl md:text-3xl lg:text-4xl flex items-center gap-2 mb-1">
            <Users size={24} /> Comunidade do Reino
          </h2>
          {churchName ? (
            <p className="text-blue-200 text-sm font-medium flex items-center gap-1.5">
              <Church size={13} /> {churchName}
            </p>
          ) : (
            <p className="text-blue-100 text-sm max-w-lg">
              Conecte-se com sua igreja local, veja os pedidos de oração e acompanhe as novidades da célula.
            </p>
          )}
        </div>
        <button
          onClick={() => currentUser ? setIsComposerOpen(true) : openLogin()}
          className="relative z-10 bg-white text-indigo-700 font-medium text-[11px] px-4 py-2 uppercase tracking-wide rounded-lg shadow-lg hover:bg-gray-100 transition-colors shrink-0 hidden md:flex items-center gap-1.5"
        >
          <PenLine size={13} /> Novo Post
        </button>
      </div>

      {/* CONTEÚDO REINO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* FEED PRINCIPAL */}
        <div className="md:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
              <Layout size={16} className="text-[#c5a059]" />
              Feed do Reino
            </h3>
            {!churchId && (
              <button
                onClick={() => navigate('/social/igrejas')}
                className="text-[10px] text-blue-500 font-medium uppercase tracking-widest hover:text-blue-400 flex items-center gap-1"
              >
                <Globe size={11} /> Vincular Igreja
              </button>
            )}
          </div>

          {feedLoading ? (
            <FeedSkeleton />
          ) : (
            <>
              <KingdomPostGridSection
                title="Seu Feed"
                subtitle="Postagens em evidencia no Reino."
                icon={<Flame size={16} className="text-orange-500" />}
                posts={highlightedPosts}
                currentUser={currentUser}
                onInteraction={handleInteraction}
                showNotification={showNotification}
                emptyLabel="Ainda nao ha postagens em evidencia."
              />
              <KingdomPostGridSection
                title="Sua Igreja"
                subtitle={churchId ? churchName : 'Vincule sua igreja para ver apenas as postagens dela.'}
                icon={<Church size={16} className="text-[#c5a059]" />}
                posts={churchPosts}
                currentUser={currentUser}
                onInteraction={handleInteraction}
                showNotification={showNotification}
                emptyLabel={churchId ? 'Ainda nao ha postagens da sua igreja.' : 'Vincule sua igreja para ativar este feed.'}
              />

              {groupSections.map(({ group, posts: groupPosts }) => (
                <KingdomPostGridSection
                  key={group.id}
                  title={`Grupo: ${group.name}`}
                  subtitle="Postagens deste grupo."
                  icon={<Users size={16} className="text-blue-500" />}
                  posts={groupPosts}
                  currentUser={currentUser}
                  onInteraction={handleInteraction}
                  showNotification={showNotification}
                  emptyLabel="Ainda nao ha postagens neste grupo."
                />
              ))}
              {posts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Ainda não há posts no feed.</p>
                  <p className="text-xs mt-1">Seja o primeiro a compartilhar!</p>
                </div>
              )}
              <button
                onClick={() => navigate('/social')}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 dark:border-[#2A2A2A] rounded-2xl text-gray-500 dark:text-gray-400 hover:border-[#c5a059]/50 hover:text-[#c5a059] transition-colors text-xs font-medium uppercase tracking-widest"
              >
                Ver Tudo no Reino <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>

        {/* SIDEBAR REINO */}
        <div className="md:col-span-4 space-y-6">

          {/* Mural de Oração */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-medium text-[13px] flex items-center gap-2">
                <HandHeart size={14} className="text-pink-500" /> Mural de Oração
              </h3>
              <button
                onClick={() => navigate('/sala-de-oracao')}
                className="text-[10px] text-pink-500 font-medium uppercase tracking-widest hover:text-pink-400"
              >
                Ver Todos
              </button>
            </div>

            {prayersLoading ? <PrayerSkeleton /> : (
              <div className="space-y-3">
                {prayers.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Nenhum pedido no mural ainda.</p>
                )}
                {prayers.map(prayer => {
                  const isInterceeding = prayer.intercessors.includes(currentUser?.uid || '');
                  return (
                    <div key={prayer.id} className="p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-[#252525]">
                      <span className="text-gray-900 dark:text-white font-medium text-xs inline-block mb-1">{prayer.userName}</span>
                      <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-tight mb-1">{prayer.content}</p>
                      {prayer.intercessorsCount > 0 && (
                        <p className="text-[10px] text-pink-400 font-medium mb-2">
                          🙏 {prayer.intercessorsCount} {prayer.intercessorsCount === 1 ? 'pessoa orou' : 'pessoas oraram'}
                        </p>
                      )}
                      <button
                        onClick={() => handleInterced(prayer.id)}
                        className={`w-full text-center py-1.5 rounded-lg font-medium text-[10px] transition-colors border ${
                          isInterceeding
                            ? 'bg-pink-500 border-pink-500 text-white hover:bg-pink-600'
                            : 'border-gray-300 dark:border-[#3A3A3A] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {isInterceeding ? '✓ ORANDO JUNTO' : 'ORAR JUNTO'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* Grupos */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-medium text-[13px] flex items-center gap-2">
                <Users size={14} className="text-blue-500" /> Grupos
              </h3>
              <button
                onClick={() => navigate(churchId ? `/social/igreja/${userProfile?.churchData?.churchSlug}` : '/social/igrejas')}
                className="text-[10px] text-blue-500 font-medium uppercase tracking-widest hover:text-blue-400"
              >
                Ver
              </button>
            </div>
            <div className="space-y-2">
              {groups.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Entre em um grupo para ver esta area.</p>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => navigate(`/social/grupo/${group.slug || group.id}`)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl p-3 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-left"
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{group.name}</span>
                    <ChevronRight size={14} className="text-blue-500 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Menções */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-medium text-[13px] flex items-center gap-2">
                <MessageSquare size={14} className="text-[#c5a059]" /> Menções
              </h3>
            </div>
            <div className="space-y-3">
              {mentions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhuma novidade ainda.</p>
              ) : (
                mentions.map((n: any) => {
                  const initials = n.title?.substring(0, 2).toUpperCase() || '??';
                  return (
                    <button
                      key={n.id}
                      onClick={() => n.link && navigate(n.link)}
                      className="w-full flex gap-3 text-left hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-xl p-2 -mx-2 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#c5a059]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="font-medium text-[#c5a059] text-[10px]">{initials}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                          {n.timestamp ? new Date(n.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* KingdomComposer: Novo Post */}
      <KingdomComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPostSuccess={() => { setIsComposerOpen(false); reloadFeed(); }}
      />

      {/* Floating Novo Post (mobile) */}
      {currentUser && (
        <button
          onClick={() => setIsComposerOpen(true)}
          className="md:hidden fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-black"
          aria-label="Criar novo post no Reino"
        >
          <PenLine size={22} />
        </button>
      )}
    </div>
  );
};

// ─── SANCTUARY PAGE ──────────────────────────────────────────────────────────

const SanctuaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, notifications, unreadNotificationsCount, markNotificationsAsRead, openLogin, signOut, showNotification } = useAuth();
  const { resetHeader, setIsHeaderHidden } = useHeader();
  const { settings, toggleTheme } = useSettings();
  const { plans } = useWorkspace();

  type HomeTab = 'inicio' | 'criar' | 'reino' | 'gestao' | 'calendario';

  const HOME_TAB_HASHES: Record<HomeTab, string> = {
    inicio: '',
    criar: '#criativo',
    reino: '#reino',
    gestao: '#gestao',
    calendario: '#calendario',
  };

  const [activeTab, setActiveTab] = useState<HomeTab>(() => {
    try {
      const saved = sessionStorage.getItem('inicio_active_tab');
      if (saved === 'inicio' || saved === 'criar' || saved === 'reino' || saved === 'gestao' || saved === 'calendario') {
        return saved;
      }
    } catch (e) { }
    return 'inicio';
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('inicio_active_tab', activeTab);
    } catch (e) { }
  }, [activeTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [churchServices, setChurchServices] = useState<ChurchService[]>([]);
  const [dailyDevotional, setDailyDevotional] = useState<any>(null);
  const [loadingDevotional, setLoadingDevotional] = useState(true);
  const [userStudies, setUserStudies] = useState<any[]>([]);
  const [userNotes, setUserNotes] = useState<any[]>([]);
  const [userPlans, setUserPlans] = useState<any[]>([]);
  const [isCurrentChurchManager, setIsCurrentChurchManager] = useState(false);
  type StudyShelfTypeFilter = 'all' | 'study' | 'plan' | 'note';
  type StudyShelfStatusFilter = 'all' | 'draft' | 'published';
  const [studyShelfTypeFilter, setStudyShelfTypeFilter] = useState<StudyShelfTypeFilter>('all');
  const [studyShelfStatusFilter, setStudyShelfStatusFilter] = useState<StudyShelfStatusFilter>('all');
  const [searchPreview, setSearchPreview] = useState<{ text: string, formattedRef: string, routeState: any } | null>(null);
  const bookAutocomplete = useMemo(
    () => getBibleBookAutocomplete(searchTerm, BIBLE_BOOKS_LIST, 4),
    [searchTerm],
  );

  // Versículo do dia: seleção aleatória local, sem IA
  const verseOfTheDay = useMemo(() => {
    const idx = Math.floor(Math.random() * DAILY_BIBLE_VERSES.length);
    return DAILY_BIBLE_VERSES[idx];
  }, []);
  const settingsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const userName = userProfile?.displayName || 'Visitante';
  const userAvatar = userProfile?.photoURL || currentUser?.user_metadata?.avatar_url || null;
  const memberChurchName = userProfile?.churchData?.churchName || 'sua igreja';
  const isPastorProfile = canAccessPastoralWorkspace(userProfile);
  const baseChurchRoleLabel = isPastorProfile ? 'Pastor' : 'Membro';
  const churchRoleLabel = (isGeneralManager(userProfile) || isCurrentChurchManager)
    ? `${baseChurchRoleLabel} e Gestor`
    : baseChurchRoleLabel;
  const memberChurchPrefix = memberChurchName.toLowerCase().startsWith('igreja') ? 'da' : 'da Igreja';
  const memberChurchPath = userProfile?.churchData?.churchSlug ? `/igreja/${userProfile.churchData.churchSlug}` : '/social/igrejas';
  const userMana = userProfile?.lifetimeXp || 0;
  const userStreak = userProfile?.stats?.daysStreak || 1;
  const chaptersRead = userProfile?.stats?.totalChaptersRead || 0;
  const isAdmin = userProfile?.username === 'gabrielamaro' || currentUser?.email === 'gabrielamaro@live.com';
  const isLightTheme = settings.theme === 'light';
  const sanctuaryChurchId = userProfile?.churchData?.churchId;
  const churchAgendaRange = useMemo(() => getAgendaRange(new Date(), 14), []);

  useEffect(() => {
    let cancelled = false;

    const loadChurchManagerStatus = async () => {
      if (!currentUser?.uid || !sanctuaryChurchId) {
        setIsCurrentChurchManager(false);
        return;
      }

      if (isGeneralManager(userProfile)) {
        setIsCurrentChurchManager(true);
        return;
      }

      const isManager = await dbService.isUserChurchManager(currentUser.uid, sanctuaryChurchId);
      if (!cancelled) setIsCurrentChurchManager(isManager);
    };

    loadChurchManagerStatus();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid, sanctuaryChurchId, userProfile?.profileType, userProfile?.subscriptionTier]);

  const handleProfileNavigation = () => {
    setIsSettingsOpen(false);
    setIsNotifDropdownOpen(false);
    if (currentUser) {
      navigate('/perfil');
      return;
    }
    openLogin();
  };
  const salaAccentClass = 'bg-violet-500/15 text-violet-700 dark:text-violet-200 ring-1 ring-violet-300/40 dark:ring-violet-400/20';
  const formatShortDate = (value?: string) => new Date(value || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const getContentDate = (item: any) => new Date(item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at || 0).getTime();
  const studyShelfItems = useMemo(() => {
    let items = [...userStudies, ...userPlans, ...userNotes];

    if (studyShelfTypeFilter !== 'all') {
      items = items.filter((item) => item.type === studyShelfTypeFilter);
    }

    if (studyShelfStatusFilter !== 'all') {
      items = items.filter((item) => item.status === studyShelfStatusFilter);
    }

    return items.sort((a, b) => getContentDate(b) - getContentDate(a));
  }, [studyShelfTypeFilter, studyShelfStatusFilter, userNotes, userPlans, userStudies]);
  const studyShelfConfig = useMemo(() => {
    if (studyShelfTypeFilter === 'note') return {
      actionLabel: 'Abrir estudos',
      actionPath: '/estudos',
      lockLabel: 'Ver estudos',
      emptyTitle: 'Nenhum registro encontrado',
      emptyHint: 'Abrir estudos',
    };
    if (studyShelfTypeFilter === 'plan') return {
      actionLabel: 'Nova sala',
      actionPath: '/criar-sala',
      lockLabel: 'Ver salas',
      emptyTitle: 'Nenhuma sala encontrada',
      emptyHint: 'Ver salas',
    };
    return {
      actionLabel: 'Novo estudo',
      actionPath: '/criar-conteudo',
      lockLabel: 'Criar com IA',
      emptyTitle: 'Nada encontrado',
      emptyHint: 'Abrir estudos',
    };
  }, [studyShelfTypeFilter]);
  const getStudyShelfTypeLabel = (item: any) => {
    if (item.type === 'plan') return 'SALA';
    if (item.type === 'note') return 'NOTA';
    return 'ESTUDO';
  };
  const getStudyShelfStatusLabel = (item: any) => {
    if (item.type === 'note') return item.noteAreaLabel || 'Geral';
    if (item.type === 'plan') return item.isEnrolled ? 'Inscrito' : (item.status === 'published' ? 'Publicado' : 'Rascunho');
    return item.status === 'published' ? 'Publicado' : 'Rascunho';
  };
  const getStudyShelfTitle = (item: any) => item.title || item.sourceStudyTitle || item.content?.slice?.(0, 90) || 'Estudo sem titulo';
  const getStudyShelfTitleClass = (item: any) => {
    const titleLength = String(getStudyShelfTitle(item)).length;
    if (titleLength > 72) return 'text-[11px] leading-snug line-clamp-4';
    if (titleLength > 44) return 'text-[12px] leading-snug line-clamp-4';
    return 'text-[13px] leading-tight line-clamp-3';
  };
  const handleStudyShelfItemClick = (item: any) => {
    if (item.type === 'note') {
      navigate('/estudos');
      return;
    }

    if (item.type === 'plan') {
      if (item.authorId !== (currentUser?.uid || currentUser?.id)) {
        navigate(`/jornada/${item.id}`);
        return;
      }

      const destination = getEditDestinationForContent(item);
      navigate(destination?.path || `/criar-sala?id=${item.id}`, destination?.state ? { state: destination.state } : undefined);
      return;
    }

    if (item.isFollowed) {
      navigate(`/v/${item.id}`);
      return;
    }

    const destination = getEditDestinationForContent(item);
    navigate(destination?.path || `/criar-conteudo?id=${item.id}`, destination?.state ? { state: destination.state } : { state: { contentId: item.id, studyData: item } });
  };

  useEffect(() => {
    if (!sanctuaryChurchId) {
      setChurchServices([]);
      return;
    }

    let mounted = true;
    cultoPlusService.getServicesByChurchRange(sanctuaryChurchId, {
      startDate: churchAgendaRange.startDate,
      endDate: churchAgendaRange.endDate,
      status: ['published', 'live', 'finished'],
      limit: 6,
    })
      .then((services) => {
        if (mounted) setChurchServices(services);
      })
      .catch(() => {
        if (mounted) setChurchServices([]);
      });

    return () => {
      mounted = false;
    };
  }, [sanctuaryChurchId, churchAgendaRange.startDate, churchAgendaRange.endDate]);
  // Referência do Hero sempre é a randômica instantânea
  const heroReference = verseOfTheDay.ref;

  const readGoal = 365;
  const { percent: readPercent, strokeDashoffset: readProgressStrokeDashoffset } = getReadingGoalProgress(chaptersRead, readGoal);

  const openVerseOfDay = () => {
    console.log('[Inicio03] heroReference:', heroReference);
    const parsed = heroReference ? bibleService.parseReference(heroReference) : null;
    console.log('[Inicio03] parsed:', parsed);
    if (parsed) {
      const url = `/biblia?book=${parsed.bookId}&cap=${parsed.chapter}&vs=${parsed.startVerse}`;
      console.log('[Inicio03] Navigating to:', url);
      navigate(url);
      return;
    }
    console.log('[Inicio03] Could not parse, going to /biblia');
    navigate('/biblia');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const term = searchTerm.trim();
      if (term.length >= 3) {
        const bibleResult = await resolveBibleSearchNavigation(term, {
          parseReference: input => bibleService.parseReference(input),
          getTextByReference: input => bibleService.getTextByReference(input, settings.bibleVersion || 'ara'),
        });
        if (bibleResult) {
          // Procura o versiculo ou trecho
          const fallbackVerseData = bibleResult.text ? null : await bibleService.getVerseText(term, settings.bibleVersion || 'ara');
          setSearchPreview({
            text: bibleResult.text || fallbackVerseData?.text || 'Abrir referencia na Biblia',
            formattedRef: fallbackVerseData?.formattedRef || bibleResult.formattedRef,
            routeState: bibleResult.routeState
          });
        } else {
          setSearchPreview(null);
        }
      } else {
        setSearchPreview(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, settings.bibleVersion]);

  useEffect(() => {
    setIsHeaderHidden(true);
    return () => {
      setIsHeaderHidden(false);
      resetHeader();
    };
  }, [setIsHeaderHidden, resetHeader]);

  useEffect(() => {
    const loadDevotional = async () => {
      try {
        setLoadingDevotional(true);
        const uid = currentUser ? (currentUser.id ?? currentUser.uid) : null;
        const devotional = await resolveUserDailyDevotional({ userId: uid });
        setDailyDevotional(devotional);
      } catch (error) {
        console.error('[Inicio03] Erro ao carregar devotional:', error);
      } finally {
        setLoadingDevotional(false);
      }
    };
    loadDevotional();
  }, [currentUser]);

  useEffect(() => {
    let mounted = true;
    const loadUserStudies = async () => {
      if (!currentUser) {
        setUserStudies([]);
        setUserNotes([]);
        setUserPlans([]);
        return;
      }

      const uid = currentUser.uid ?? currentUser.id;
      try {
        const enrolledPlanIds = Array.from(new Set([
          ...((userProfile as any)?.enrolledPlans || []),
          ...((userProfile as any)?.enrolled_plans || []),
          ...((currentUser as any)?.enrolledPlans || []),
          ...((currentUser as any)?.enrolled_plans || []),
        ].filter(Boolean)));

        const [studiesData, publicStudiesData, notesData, serviceNotesData, ownedPlansData, enrolledPlansData] = await Promise.all([
          dbService.getAll(uid, 'studies'),
          dbService.getAll(uid, 'public_studies'),
          dbService.getAll(uid, 'notes'),
          cultoPlusService.getUserNotes(uid),
          dbService.getUserCustomPlans(uid),
          dbService.getEnrolledPlans(enrolledPlanIds),
        ]);

        const normalizeStudy = (study: any) => {
          let blocks = study.blocks;
          let meta = study.meta;
          try { if (typeof blocks === 'string') blocks = JSON.parse(blocks); } catch (e) { blocks = []; }
          try { if (typeof meta === 'string') meta = JSON.parse(meta); } catch (e) { meta = {}; }
          return {
            ...study,
            type: study.type || 'study',
            blocks,
            meta,
            title: study.title || meta?.title || 'Estudo sem titulo',
            coverUrl: study.cover_image || meta?.coverImage || study.coverUrl,
          };
        };

        const studies = [...(studiesData as any[]), ...(publicStudiesData as any[])]
          .map(normalizeStudy)
          .filter(isStandaloneStudyContent)
          .sort((a, b) => new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0).getTime() - new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0).getTime())
          .slice(0, 24);

        if (!mounted) return;
        setUserStudies(studies);
        setUserNotes([...(notesData as any[]).map(normalizeStandardNote), ...(serviceNotesData as any[]).map(normalizeServiceNote)]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
          .slice(0, 24));
        setUserPlans([...(ownedPlansData as any[]), ...(enrolledPlansData as any[]).filter((plan) => plan.authorId !== uid)]
          .map((plan) => ({ ...plan, type: 'plan', isEnrolled: plan.authorId !== uid }))
          .sort((a, b) => new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0).getTime() - new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0).getTime())
          .slice(0, 24));
      } catch (error) {
        console.error('[Inicio03] Erro ao carregar estudos:', error);
        if (!mounted) return;
        setUserStudies([]);
        setUserNotes([]);
        setUserPlans([]);
      }
    };

    loadUserStudies();
    return () => {
      mounted = false;
    };
  }, [currentUser, userProfile]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'inicio' || tab === 'criar' || tab === 'reino') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`min-h-screen selection:bg-[#c5a059]/30 font-sans pb-24 ${isLightTheme ? 'bg-[#F6F3EE] text-[#111111]' : 'bg-[#0E0E0E] text-white'}`}>
      <main className="w-full mx-auto px-4 md:px-8 lg:px-10 pt-6 space-y-10">

        {/* ========================================================= */}
        {/* CABEÇALHO EXATO DO ANEXO */}
        {/* ========================================================= */}
        <div className="space-y-5">
          {/* Usuário e Status */}
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={handleProfileNavigation}
                aria-label={currentUser ? 'Abrir meu perfil' : 'Entrar para abrir perfil'}
                className={`shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c5a059]/60 ${
                  isLightTheme ? 'hover:bg-white/70' : 'hover:bg-white/5'
                }`}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full ring-2 ring-transparent flex items-center justify-center font-medium text-xs ${isLightTheme ? 'bg-[#E2DBCD] text-[#5C4A2A]' : 'bg-[#1A1A1A] text-gray-300'}`}>
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
              <div className="flex min-w-0 flex-col">
                <span className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-400 text-[11px] font-medium leading-tight">
                  <span>Bem Vindo de volta {userName}</span>
                  <PaidAccountBadge tier={userProfile?.subscriptionTier} compact />
                </span>
                <span className={`max-w-[240px] truncate font-medium text-[13px] leading-tight sm:max-w-none ${isLightTheme ? 'text-[#111111]' : 'text-white'}`}>
                  {churchRoleLabel} {memberChurchPrefix}{' '}
                  <button
                    type="button"
                    onClick={() => navigate(memberChurchPath)}
                    className="font-medium text-[#c5a059] underline-offset-2 hover:underline focus:outline-none focus:underline"
                  >
                    {memberChurchName}
                  </button>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-[#1A1A1A] rounded-full px-3 py-1.5">
                  <Zap size={14} className="text-[#c5a059]" fill="currentColor" />
                  <span className="text-gray-900 dark:text-white font-medium text-xs">{userMana.toLocaleString('pt-BR')}</span>
                  <span className="text-gray-500 dark:text-gray-500 text-[10px] font-medium">Mana</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-[#1A1A1A] rounded-full px-3 py-1.5">
                  <Flame size={14} className="text-red-500" fill="currentColor" />
                  <span className="text-gray-900 dark:text-white font-medium text-xs">{userStreak}</span>
                  <span className="text-gray-500 dark:text-gray-500 text-[10px] font-medium">dias</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <div className="relative" ref={notifRef}>
                  <button className={`transition-colors relative ${isLightTheme ? 'hover:text-[#111111]' : 'hover:text-white'}`} onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}>
                    <Bell size={20} />
                    {unreadNotificationsCount > 0 && (
                      <span className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isLightTheme ? 'border border-[#F6F3EE]' : 'border border-[#0E0E0E]'} bg-red-500`}></span>
                    )}
                  </button>
                  {isNotifDropdownOpen && (
                    <div className={`absolute right-0 top-full mt-3 w-72 rounded-xl shadow-xl overflow-hidden z-50 ${isLightTheme ? 'bg-white border border-[#E7E2D7]' : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}>
                      <div className={`p-3 flex items-center justify-between ${isLightTheme ? 'border-b border-[#EFE9DD]' : 'border-b border-[#2A2A2A]'}`}>
                        <span className={`font-medium text-xs ${isLightTheme ? 'text-[#111111]' : 'text-white'}`}>Notificações</span>
                        <button onClick={markNotificationsAsRead} className="text-[10px] text-[#c5a059] hover:underline font-medium uppercase">Marcar lidas</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-600 dark:text-gray-400 text-xs">Nenhuma notificação</div>
                        ) : (
                          notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => {
                                if (notif.link) navigate(notif.link);
                                setIsNotifDropdownOpen(false);
                              }}
                              className={`w-full text-left p-3 transition-colors ${isLightTheme ? 'border-b border-[#F2EEE5] hover:bg-[#F8F4EA]' : 'border-b border-[#2A2A2A] hover:bg-[#252525]'} ${!notif.read ? (isLightTheme ? 'bg-[#FFF8E8]' : 'bg-[#1F1A10]') : ''}`}
                            >
                              <p className={`text-xs font-medium line-clamp-1 ${isLightTheme ? 'text-[#111111]' : 'text-white'}`}>{notif.title}</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-500 line-clamp-2">{notif.message}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative" ref={settingsRef}>
                  <button className={`transition-colors ${isLightTheme ? 'hover:text-[#111111]' : 'hover:text-white'}`} onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                    <Settings size={20} />
                  </button>
                  {isSettingsOpen && (
                    <div className={`absolute right-0 top-full mt-3 w-64 rounded-xl shadow-xl overflow-hidden z-50 py-2 ${isLightTheme ? 'bg-white border border-[#E7E2D7]' : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}>
                      {currentUser && (
                        <button onClick={() => { setIsSettingsOpen(false); navigate('/perfil'); }} className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-700 hover:bg-[#F8F4EA]' : 'text-gray-300 hover:bg-[#252525]'}`}>
                          <User size={16} /> Meu Perfil
                        </button>
                      )}
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/intro'); }} className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-700 hover:bg-[#F8F4EA]' : 'text-gray-300 hover:bg-[#252525]'}`}>
                        <Layout size={16} className="text-blue-500" /> Apresentação
                      </button>
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/regras'); }} className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-700 hover:bg-[#F8F4EA]' : 'text-gray-300 hover:bg-[#252525]'}`}>
                        <Zap size={16} className="text-purple-500" /> Manual do Maná
                      </button>
                      <button onClick={() => { toggleTheme(); setIsSettingsOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-700 hover:bg-[#F8F4EA]' : 'text-gray-300 hover:bg-[#252525]'}`}>
                        {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        {settings.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                      </button>
                      <div className={`h-px my-1 ${isLightTheme ? 'bg-[#EFE9DD]' : 'bg-[#2A2A2A]/50'}`} />
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/suporte'); }} className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-500 hover:bg-[#F8F4EA]' : 'text-gray-400 hover:bg-[#252525]'}`}>
                        <LifeBuoy size={16} /> Suporte / Doar
                      </button>
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/termos'); }} className={`w-full text-left px-4 py-2 text-[10px] font-medium uppercase tracking-widest flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-400 hover:bg-[#F8F4EA]' : 'text-gray-400 hover:bg-[#252525]'}`}>
                        <Scroll size={16} /> Termos
                      </button>
                      <button onClick={() => { setIsSettingsOpen(false); navigate('/privacidade'); }} className={`w-full text-left px-4 py-2 text-[10px] font-medium uppercase tracking-widest flex items-center gap-2 transition-colors ${isLightTheme ? 'text-gray-400 hover:bg-[#F8F4EA]' : 'text-gray-400 hover:bg-[#252525]'}`}>
                        <ShieldCheck size={16} /> Privacidade
                      </button>
                      {isAdmin && (
                        <>
                          <div className={`h-px my-1 ${isLightTheme ? 'bg-red-100' : 'bg-red-900/20'}`} />
                          <button onClick={() => { setIsSettingsOpen(false); navigate('/admin'); }} className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${isLightTheme ? 'text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-red-500/10'}`}>
                            <Terminal size={16} /> Painel Admin
                          </button>
                          <button onClick={() => { setIsSettingsOpen(false); navigate('/system-integrity'); }} className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${isLightTheme ? 'text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-red-500/10'}`}>
                            <ShieldAlert size={16} /> Integridade
                          </button>
                        </>
                      )}
                      <div className={`h-px my-1 ${isLightTheme ? 'bg-[#EFE9DD]' : 'bg-[#2A2A2A]/50'}`} />
                      {currentUser ? (
                        <button onClick={() => { signOut(); setIsSettingsOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${isLightTheme ? 'text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-red-500/10'}`}>
                          <LogOut size={16} /> Sair
                        </button>
                      ) : (
                        <button onClick={() => { openLogin(); setIsSettingsOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-medium text-[#c5a059] hover:bg-[#c5a059]/10 flex items-center gap-2 transition-colors">
                          <UserCircle size={16} /> Entrar na Conta
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Busca em destaque */}
          <div className={`relative w-full rounded-3xl border p-1.5 shadow-2xl transition-all ${isLightTheme ? 'bg-white border-[#E9DEC9] shadow-[#C5A059]/10' : 'bg-[#15120D] border-[#2B2417] shadow-black/30'}`}>
            <div className="absolute inset-y-1.5 left-1.5 z-10 flex w-12 items-center justify-center rounded-xl bg-[#c5a059] text-white shadow-lg shadow-[#c5a059]/25 pointer-events-none dark:text-black">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  if (searchPreview) {
                    const { bookId, chapter, scrollToVerse } = searchPreview.routeState;
                    navigate(`/biblia?book=${bookId}&cap=${chapter}${scrollToVerse ? `&vs=${scrollToVerse}` : ''}`);
                  } else {
                    navigate(`/social/explore?q=${encodeURIComponent(searchTerm.trim())}`);
                  }
                }
              }}
              placeholder="Buscar versículos, estudos, pessoas..."
              className={`w-full rounded-2xl border py-3 pl-16 pr-24 text-sm font-medium text-gray-900 placeholder-gray-500 outline-none transition-all focus:border-[#c5a059] focus:ring-4 focus:ring-[#c5a059]/15 dark:text-white dark:placeholder-gray-500 ${isLightTheme ? 'bg-[#FBF8F1] border-[#EFE6D5]' : 'bg-[#0E0E0E] border-[#2A2419]'}`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSearchPreview(null);
                }}
                aria-label="Limpar pesquisa"
                className="absolute inset-y-1.5 right-12 flex w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-black/5 hover:text-red-500 dark:hover:bg-white/10"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (searchPreview) {
                  const { bookId, chapter, scrollToVerse } = searchPreview.routeState;
                  navigate(`/biblia?book=${bookId}&cap=${chapter}${scrollToVerse ? `&vs=${scrollToVerse}` : ''}`);
                } else if (searchTerm.trim()) {
                  navigate(`/social/explore?q=${encodeURIComponent(searchTerm.trim())}`);
                } else {
                  navigate('/bibliasagrada');
                }
              }}
              aria-label="Pesquisar"
              className="absolute inset-y-1.5 right-1.5 flex w-10 items-center justify-center rounded-xl bg-[#2d2a26] text-white transition-all hover:bg-[#c5a059] hover:text-black active:scale-95 dark:bg-[#f5efe3] dark:text-[#14100A] dark:hover:bg-[#c5a059]"
            >
              <Search size={16} />
            </button>
            {/* Search Preview Autocomplete */}
            {searchPreview && (
              <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl overflow-hidden z-50 p-4 border cursor-pointer flex flex-col gap-2 ${isLightTheme ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-[#1A1A1A] border-[#2A2A2A] hover:bg-[#202020]'}`}
                onClick={() => {
                  const { bookId, chapter, scrollToVerse } = searchPreview.routeState;
                  navigate(`/biblia?book=${bookId}&cap=${chapter}${scrollToVerse ? `&vs=${scrollToVerse}` : ''}`);
                }}>
                <div className="flex items-center gap-2 text-[#c5a059]">
                  <BookOpen size={16} />
                  <span className="font-medium text-xs uppercase tracking-widest">{searchPreview.formattedRef}</span>
                </div>
                <p className="text-gray-900 dark:text-white text-sm line-clamp-2">"{searchPreview.text}"</p>
                <span className="text-gray-500 text-[10px] uppercase font-medium mt-1">APERTAR ENTER PARA LER</span>
              </div>
            )}
            {!searchPreview && bookAutocomplete.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl overflow-hidden z-50 border ${isLightTheme ? 'bg-white border-gray-200' : 'bg-[#1A1A1A] border-[#2A2A2A]'}`}>
                {bookAutocomplete.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => setSearchTerm(suggestion.completion)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors ${isLightTheme ? 'hover:bg-gray-50' : 'hover:bg-[#202020]'}`}
                  >
                    <span className="flex items-center gap-3">
                      <BookOpen size={16} className="text-[#c5a059]" />
                      <span>
                        <span className={`block text-sm font-medium ${isLightTheme ? 'text-gray-900' : 'text-white'}`}>{suggestion.name}</span>
                        <span className="block text-[10px] font-medium uppercase tracking-widest text-gray-500">Completar referência</span>
                      </span>
                    </span>
                    <span className="text-xs font-medium text-[#c5a059]">{suggestion.completion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs Nav */}
          <div className="flex items-center gap-6 border-b border-gray-200 dark:border-[#2A2A2A] relative">
            <button
              onClick={() => setActiveTab('inicio')}
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'inicio' ? 'text-[#c5a059]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Home size={16} />
              <span className="text-sm font-medium">Início</span>
              {activeTab === 'inicio' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#c5a059]" />}
            </button>
            <button
              onClick={() => setActiveTab('criar')}
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'criar' ? (isLightTheme ? 'text-[#111111]' : 'text-white') : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Wand2 size={16} />
              <span className="text-sm font-medium">Criar</span>
              {activeTab === 'criar' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white" />}
            </button>
            <button
              onClick={() => setActiveTab('reino')}
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'reino' ? (isLightTheme ? 'text-[#111111]' : 'text-white') : 'text-gray-500 hover:text-gray-300'}`}
            >
              <User size={16} />
              <span className="text-sm font-medium">Reino</span>
              {activeTab === 'reino' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white" />}
            </button>
            <button
              onClick={() => setActiveTab('gestao')}
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'gestao' ? (isLightTheme ? 'text-[#111111]' : 'text-white') : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Church size={16} />
              <span className="text-sm font-medium">Gestão</span>
              {activeTab === 'gestao' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#c5a059]" />}
            </button>
            <button
              onClick={() => setActiveTab('calendario')}
              className={`flex items-center gap-2 pb-3 px-1 relative ${activeTab === 'calendario' ? (isLightTheme ? 'text-[#111111]' : 'text-white') : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Calendar size={16} />
              <span className="text-sm font-medium">Calendário</span>
              {activeTab === 'calendario' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#3b82f6]" />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* GRID DO CONTEÚDO */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 mt-10">

          {/* COLUNA ESQUERDA (Principal) - ocupa 8 colunas no grid baseado no anexo */}
          <div className="lg:col-span-12 space-y-6 md:space-y-8 lg:space-y-12">

            {activeTab === 'inicio' && (
              <>
                {/* 1. HERO - VERSÍCULO DO DIA */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-stretch">
                <div className="relative rounded-2xl overflow-hidden min-h-[220px] md:min-h-[250px] lg:min-h-[260px] lg:col-span-8 flex flex-col justify-end p-5 md:p-7 group cursor-pointer" onClick={openVerseOfDay}>
                  <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1525286102666-b3281abadd14?auto=format&fit=crop&q=80&w=1600" alt="" className="w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/80 to-[#0E0E0E]/30" />
                    <div className="absolute top-6 left-0 w-full text-center pointer-events-none opacity-80">
                      <h1 className="text-[100px] md:text-[150px] lg:text-[190px] font-medium text-white/10 tracking-tighter leading-none select-none">JESUS</h1>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#c5a059] text-black font-medium text-[10px] rounded-lg mb-4 shadow-lg shadow-[#c5a059]/20">
                      <BookOpen size={14} /> Versículo do Dia
                    </div>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium text-white leading-tight mb-6 max-w-3xl line-clamp-3">
                      "{verseOfTheDay.text}"
                    </h2>

                    <div className="flex items-center justify-between">
                      <span className="text-[#c5a059] font-medium text-sm md:text-base">- {verseOfTheDay.ref}</span>
                      <div className="flex items-center gap-3">
                        <button className="w-10 h-10 bg-white/10 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white" onClick={(e) => { e.stopPropagation(); openVerseOfDay(); }}>
                          <Share2 size={18} />
                        </button>
                        <button className="w-10 h-10 bg-white/10 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white" onClick={(e) => { e.stopPropagation(); openVerseOfDay(); }}>
                          <Bookmark size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. META LIDA & PÃO DIÁRIO */}
                  {/* Meta de Leitura */}
                  <div className="lg:col-span-4 min-h-[180px] bg-gray-50 dark:bg-[#141414] rounded-2xl p-6 border border-gray-200 dark:border-[#2A2A2A] flex justify-between items-center cursor-pointer hover:border-gray-300 dark:hover:border-[#3A3A3A] transition-colors relative" onClick={() => navigate('/plano')}>
                    {!currentUser && <LockOverlay message="Acompanhar progresso" />}
                    <div className="flex flex-col h-full justify-between">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                        <Target size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 dark:text-white font-medium text-[13px] mb-1">Meta de Leitura</h3>
                        <span className="text-gray-500 dark:text-gray-500 font-medium text-[10px] flex items-center gap-1 uppercase tracking-wider">RETOMAR <ChevronRight size={12} /></span>
                      </div>
                    </div>
                    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#222" strokeWidth="6" />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="6"
                          strokeDasharray="163.36"
                          strokeDashoffset={readProgressStrokeDashoffset}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-gray-900 dark:text-white font-medium text-[10px]">{readPercent}%</span>
                    </div>
                  </div>

                  {/* Pão Diário */}
                  <div className="lg:col-span-6 min-h-[160px] bg-gray-50 dark:bg-[#141414] rounded-2xl p-6 border border-gray-200 dark:border-[#2A2A2A] flex justify-between relative overflow-hidden cursor-pointer hover:border-gray-300 dark:hover:border-[#3A3A3A] transition-colors" onClick={() => navigate('/devocional')}>
                    {!currentUser && <LockOverlay message="Ver meu devocional" />}
                    <div className="absolute right-[-20%] top-[-20%] text-[180px] font-serif font-medium text-white/5 leading-none select-none pointer-events-none">99</div>

                    <div className="flex flex-col h-full justify-between relative z-10 w-1/3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
                        <Heart size={16} className="text-orange-500" fill="currentColor" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 dark:text-white font-medium text-[13px] mb-1">Pão Diário</h3>
                        <span className="text-gray-500 dark:text-gray-500 font-medium text-[10px] flex items-center gap-1 uppercase tracking-wider">ACESSAR <ChevronRight size={12} /></span>
                      </div>
                    </div>

                    <div className="relative z-10 w-2/3 pl-4 flex flex-col justify-center border-l border-gray-200 dark:border-[#2A2A2A] ml-4 bg-gradient-to-r from-transparent to-gray-50 dark:to-[#141414]">
                      <div className="flex items-center gap-1 text-[#c5a059] mb-2">
                        <Zap size={10} fill="currentColor" />
                        <span className="text-[9px] font-medium tracking-widest uppercase">DEVOCIONAL DO DIA</span>
                      </div>
                      <p className="text-gray-900 dark:text-white text-fluid-body font-serif italic mb-2 leading-relaxed pr-4 line-clamp-3">
                        "{loadingDevotional ? 'Carregando porção diária...' : (dailyDevotional?.verse || dailyDevotional?.verseText || 'Hoje, enquanto meditamos nas palavras do Senhor...')}"
                      </p>
                      <span className="text-[#c5a059] font-medium text-[9px] uppercase tracking-widest">
                        {loadingDevotional ? '...' : (dailyDevotional?.reference || dailyDevotional?.verseReference || '')}
                      </span>
                    </div>
                  </div>

                  {/* Oração do Dia */}
                  <div
                    className="lg:col-span-6 min-h-[160px] bg-stone-50 dark:bg-stone-950/20 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer hover:border-stone-500/60 dark:hover:border-stone-500/60 transition-colors relative overflow-hidden"
                    onClick={() => navigate('/oracoes')}
                  >
                    <div className="absolute right-[-40px] top-[-70px] text-[160px] font-serif font-medium text-stone-900/5 dark:text-stone-300/5 leading-none select-none pointer-events-none">AM</div>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-9 h-9 rounded-full bg-stone-500/10 flex items-center justify-center flex-shrink-0">
                        <HandHeart size={17} className="text-stone-700 dark:text-stone-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 mb-2">
                          <Sparkles size={11} fill="currentColor" />
                          <span className="text-[9px] font-medium tracking-widest uppercase">ORAÇÃO DO DIA</span>
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-medium text-[15px] mb-1">Oração ao Amanhecer</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-serif italic leading-relaxed max-w-2xl line-clamp-2">
                          "Pai amado, obrigado por este novo dia. Entrego minhas mãos para o Teu trabalho e meus pés para o Teu caminho..."
                        </p>
                        <span className="mt-3 inline-flex text-stone-700 dark:text-stone-300 font-medium text-[9px] uppercase tracking-widest">BIBLIALM</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate('/oracoes'); }}
                      className="relative z-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-800 px-4 py-3 text-[10px] font-medium uppercase tracking-widest text-white hover:bg-stone-900 transition-colors min-h-11"
                    >
                      Ler Completa <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

                {/* 3. ESPAÇO + (ADMIN ONLY) */}
                {sanctuaryChurchId && !isAdmin && (
                  <div className="space-y-3">
                    <HomeSectionHeader
                      icon={<Calendar size={18} className="text-emerald-600" />}
                      title="Proximos Cultos"
                      actionLabel="VER CULTOS"
                      onAction={() => navigate(memberChurchPath)}
                      isLightTheme={isLightTheme}
                    />
                    <CultoPlusPublicAgenda
                      services={churchServices}
                      visibleDays={churchAgendaRange.visibleDays}
                      onOpen={(service) => navigate(`/culto/${service.slug}`)}
                      layout="carousel"
                      pageSize={6}
                    />
                  </div>
                )}

                {isAdmin && (
                  <div className="pt-2 border-t border-transparent">
                    <HomeSectionHeader
                      icon={<BookOpen size={18} className="text-[#c5a059]" />}
                      title="Espaço +"
                      subtitle="Espaço do pastor e Igreja"
                      actionLabel="PAINEL DE CONTROLE"
                      onAction={() => navigate('/workspace-pastoral')}
                      isLightTheme={isLightTheme}
                    />

                    <HomePanel className="overflow-hidden space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-widest text-violet-600 dark:text-violet-300">Salas</p>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Salas de Estudo</h3>
                          </div>
                          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[9px] font-medium uppercase tracking-widest text-violet-700 dark:text-violet-200">Premium roxo</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-1 custom-scrollbar">
                      {/* Nova Sala */}
                      <button
                        onClick={() => navigate('/criar-sala')}
                        className="min-w-[180px] h-[190px] rounded-2xl border border-dashed border-violet-400/50 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/30 dark:via-[#1A1A1A] dark:to-fuchsia-950/20 flex flex-col items-center justify-center gap-4 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-900/10 transition-all cursor-pointer shrink-0 group"
                      >
                        <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-700/25 group-hover:scale-105 transition-transform">
                          <Plus size={24} />
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium text-[11px] uppercase tracking-wider">Nova sala</span>
                      </button>

                      {plans.length > 0 ? plans.map(plan => (
                        <div
                          key={plan.id}
                          className="min-w-[260px] h-[190px] rounded-2xl overflow-hidden bg-white dark:bg-[#1A1A1A] border border-violet-200 dark:border-violet-900/50 flex flex-col cursor-pointer hover:border-violet-400 hover:shadow-xl hover:shadow-violet-950/10 transition-all shrink-0 group"
                          onClick={() => navigate(`/plano/${plan.id}`)}
                        >
                          <div className="h-24 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-white dark:from-violet-950/50 dark:via-[#252525] dark:to-[#1A1A1A] relative overflow-hidden shrink-0">
                            {plan.coverUrl ? (
                              <img src={plan.coverUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={plan.title} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="rounded-2xl bg-white/70 dark:bg-black/25 p-3 shadow-sm ring-1 ring-violet-200/70 dark:ring-violet-500/20">
                                  <BookOpen size={30} className="text-violet-600 dark:text-violet-300" />
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <span className={`${salaAccentClass} font-medium text-[7px] px-2 py-1 rounded-full tracking-widest uppercase backdrop-blur`}>ATIVA</span>
                            </div>
                          </div>

                          <div className="p-4 flex flex-col justify-between flex-1">
                            <h3 className="text-gray-900 dark:text-white font-medium text-[13px] line-clamp-2 leading-tight group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">{plan.title}</h3>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-[9px] text-violet-600 dark:text-violet-300 font-medium uppercase tracking-tighter">
                                <Users size={10} /> {plan.subscribersCount || 0} membros
                              </div>
                              <span className="text-gray-400 text-[8px] font-medium">{formatShortDate(plan.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="min-w-[220px] h-[190px] rounded-2xl p-5 bg-violet-50/60 dark:bg-violet-950/10 border border-dashed border-violet-200 dark:border-violet-900/50 flex flex-col justify-center items-center text-center shrink-0">
                          <BookOpen size={24} className="text-violet-500 mb-3" />
                          <span className="text-gray-500 dark:text-gray-500 text-xs mb-2">Você ainda não tem salas ativas</span>
                        </div>
                      )}
                      </div>

                      <div className="space-y-3 border-t border-gray-200 pt-5 dark:border-[#2A2A2A]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Cultos +</p>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Cultos da igreja {userProfile?.churchData?.churchName || ''} agendados</h3>
                          </div>
                          <button onClick={() => navigate('/workspace-pastoral/cultos')} className="text-[10px] font-medium uppercase tracking-widest text-[#c5a059] hover:text-emerald-700 transition-colors">Ver cultos</button>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
                          <button
                            onClick={() => navigate('/workspace-pastoral/cultos/novo')}
                            className="min-h-[170px] rounded-2xl border border-dashed border-emerald-500/40 bg-gradient-to-br from-emerald-950 via-emerald-800 to-[#c5a059] text-white flex flex-col items-center justify-center gap-4 hover:shadow-xl hover:shadow-emerald-950/20 transition-all cursor-pointer group overflow-hidden relative"
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%)]" />
                            <div className="relative w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-white ring-1 ring-white/20 group-hover:scale-105 transition-transform">
                              <Sparkles size={24} />
                            </div>
                            <span className="relative font-medium text-[11px] uppercase tracking-wider">Novo Culto +</span>
                          </button>

                          <CultoPlusPublicAgenda
                            services={churchServices}
                            visibleDays={churchAgendaRange.visibleDays}
                            onOpen={(service) => navigate(`/culto/${service.slug}`)}
                            emptyLabel="Nenhum Culto+ criado ainda"
                            layout="carousel"
                            pageSize={6}
                          />
                        </div>
                      </div>
                      </div>
                    </HomePanel>
                  </div>
                )}

                {/* 4. MEUS ESTUDOS E CARDS */}
                <div className={`pt-2 border-t ${isAdmin ? 'border-gray-200 dark:border-[#2A2A2A] mt-6' : 'border-transparent'}`}>
                  <div className="mb-4 flex items-center justify-between gap-4 px-1">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-cyan-700 dark:text-cyan-300">Estudos</p>
                      <h2 className="text-gray-900 dark:text-white font-medium text-lg md:text-xl lg:text-2xl">Meus Estudos</h2>
                    </div>
                    <button
                      onClick={() => navigate('/estudos')}
                      className="rounded-full bg-cyan-500/10 px-3 py-1 text-[9px] font-medium uppercase tracking-widest text-cyan-700 transition-colors hover:bg-cyan-500/15 dark:text-cyan-200"
                    >
                      Biblioteca
                    </button>
                  </div>

                  <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: 'all', label: 'Tudo' },
                      { id: 'study', label: 'Estudos' },
                      { id: 'plan', label: 'Salas' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setStudyShelfTypeFilter(filter.id as StudyShelfTypeFilter)}
                        className={`whitespace-nowrap rounded-xl px-4 py-2 text-[10px] font-medium uppercase tracking-widest transition-all ${studyShelfTypeFilter === filter.id ? 'bg-cyan-700 text-white shadow-md shadow-cyan-900/10' : 'bg-white text-gray-500 hover:text-cyan-700 dark:bg-[#1A1A1A] dark:text-gray-400 dark:hover:text-cyan-300'}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: 'all', label: 'Todos Status' },
                      { id: 'draft', label: 'Rascunhos' },
                      { id: 'published', label: 'Publicados' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setStudyShelfStatusFilter(filter.id as StudyShelfStatusFilter)}
                        className={`whitespace-nowrap rounded-lg px-3 py-2 text-[9px] font-medium uppercase tracking-widest transition-all ${studyShelfStatusFilter === filter.id ? 'bg-gray-800 text-white dark:bg-white dark:text-black' : 'bg-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {/* Box Criar Estudo */}
                    <button
                      className="min-w-[180px] h-[190px] rounded-2xl border border-dashed border-cyan-400/50 bg-gradient-to-br from-cyan-50 via-white to-sky-50 dark:from-cyan-950/25 dark:via-[#1A1A1A] dark:to-sky-950/15 flex flex-col items-center justify-center gap-4 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-900/10 transition-all cursor-pointer shrink-0 group relative overflow-hidden"
                      onClick={() => navigate(studyShelfConfig.actionPath)}
                    >
                      {!currentUser && <LockOverlay message={studyShelfConfig.lockLabel} />}
                      <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-700/25 group-hover:scale-105 transition-transform">
                        <Plus size={24} />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-[11px] uppercase tracking-wider">{studyShelfConfig.actionLabel}</span>
                    </button>

                    {/* Box Cards Escuros */}
                    <div className="contents">
                      {studyShelfItems.length > 0 ? studyShelfItems.slice(0, 6).map((study, i) => (
                        <div key={`${study.type || 'content'}-${study.id || i}`} onClick={() => handleStudyShelfItemClick(study)} className="min-w-[260px] h-[190px] rounded-2xl overflow-hidden bg-white dark:bg-[#1A1A1A] border border-cyan-200 dark:border-cyan-900/50 flex flex-col cursor-pointer hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-950/10 transition-all shrink-0 group">
                          <div className="h-24 bg-gradient-to-br from-cyan-100 via-sky-50 to-white dark:from-cyan-950/50 dark:via-[#252525] dark:to-[#1A1A1A] relative overflow-hidden shrink-0">
                            {(study.coverUrl || study.cover_url || study.imageUrl || study.image_url) ? (
                              <img src={study.coverUrl || study.cover_url || study.imageUrl || study.image_url || study.coverImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={getStudyShelfTitle(study)} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="rounded-2xl bg-white/70 dark:bg-black/25 p-3 shadow-sm ring-1 ring-cyan-200/70 dark:ring-cyan-500/20">
                                  {study.type === 'note' ? <PenLine size={30} className="text-cyan-700 dark:text-cyan-300" /> : study.type === 'plan' ? <BookOpen size={30} className="text-cyan-700 dark:text-cyan-300" /> : <FileText size={30} className="text-cyan-700 dark:text-cyan-300" />}
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <span className={`rounded-full px-2 py-1 text-[7px] font-medium uppercase tracking-widest backdrop-blur ${study.type === 'note' ? getNoteAreaClasses(study.noteArea) : 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-100'}`}>{getStudyShelfTypeLabel(study)}</span>
                            </div>
                          </div>
                          <div className="p-4 flex flex-col justify-between flex-1 min-h-0">
                            <h3 className={`h-[48px] text-gray-900 dark:text-white font-medium overflow-hidden group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors ${getStudyShelfTitleClass(study)}`}>{getStudyShelfTitle(study)}</h3>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-[9px] text-cyan-700 dark:text-cyan-300 font-medium uppercase tracking-tighter">
                                {study.type === 'note' ? <PenLine size={10} /> : study.type === 'plan' ? <Users size={10} /> : <BookOpen size={10} />}
                                <span className={study.type === 'note' ? getNoteAreaTextClasses(study.noteArea) : ''}>{getStudyShelfStatusLabel(study)}</span>
                              </div>
                              <span className="text-gray-400 text-[8px] font-medium">{formatShortDate(study.updatedAt || study.updated_at || study.createdAt || study.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <>
                          <div onClick={() => navigate(studyShelfConfig.actionPath)} className="min-w-[260px] h-[190px] rounded-2xl p-5 bg-cyan-50/60 dark:bg-cyan-950/10 border border-dashed border-cyan-200 dark:border-cyan-900/50 flex flex-col justify-center items-center text-center shrink-0 cursor-pointer hover:border-cyan-400 transition-colors">
                            <FileText size={24} className="text-cyan-600 dark:text-cyan-300 mb-3" />
                            <span className="text-gray-500 dark:text-gray-500 text-xs font-medium">{studyShelfConfig.emptyTitle}</span>
                          </div>
                          <div onClick={() => navigate('/estudos')} className="min-w-[260px] h-[190px] rounded-2xl p-5 bg-white dark:bg-[#1A1A1A] border border-cyan-100 dark:border-cyan-900/40 flex flex-col justify-center items-center text-center shrink-0 cursor-pointer hover:border-cyan-400 transition-colors">
                            <BookOpen size={24} className="text-cyan-600 dark:text-cyan-300 mb-3" />
                            <span className="text-gray-500 dark:text-gray-500 text-xs font-medium">{studyShelfConfig.emptyHint}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. ESTÚDIO CRIATIVO + FLASH QUIZ */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <HomePanel className="relative overflow-hidden lg:col-span-7">

                  <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 blur-3xl rounded-full" />

                  <div className="flex items-center gap-4 mb-5 relative z-10">
                    <div className="w-11 h-11 bg-[#c5a059] rounded-xl flex items-center justify-center border border-white/10 shadow-lg shrink-0">
                      <Wand2 size={22} className="text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <h2 className="text-gray-900 dark:text-white font-medium text-xl md:text-2xl leading-tight">Estúdio Criativo com IA</h2>
                      <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mt-2 pr-2">Transforme sua fé em arte e áudio com ferramentas de criação por IA.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                    <button
                      onClick={() => navigate('/criar-arte-sacra')}
                      className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] text-left hover:border-green-500/30 transition-colors min-h-[150px] flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1 rounded bg-green-500/10">
                          <Image size={17} className="text-green-500" />
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium text-[13px]">Gerar Arte Sacra</span>
                      </div>
                      <p className="text-[#888] text-[11px] leading-relaxed mb-4">Crie imagens inspiradas em versículos e cenas bíblicas.</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-[9px] font-medium text-gray-600 dark:text-gray-400">Realista</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-[9px] font-medium text-gray-600 dark:text-gray-400">Óleo</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-[9px] font-medium text-gray-600 dark:text-gray-400">Aquarela</span>
                      </div>
                    </button>

                    <button
                      onClick={() => navigate('/criar-podcast')}
                      className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] text-left hover:border-pink-500/30 transition-colors relative min-h-[150px] flex flex-col justify-between"
                    >
                      {!currentUser && <LockOverlay message="Criar Podcast" />}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1 rounded bg-pink-500/10">
                          <Mic size={17} className="text-pink-500" />
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium text-[13px]">Gerar Podcast</span>
                      </div>
                      <p className="text-[#888] text-[11px] leading-relaxed mb-4">Transforme reflexões em episódios com narração IA.</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-[9px] font-medium text-gray-600 dark:text-gray-400">Devocional</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-[9px] font-medium text-gray-600 dark:text-gray-400">Estudo</span>
                      </div>
                    </button>
                  </div>
                  </HomePanel>
                  <HomePanel className="relative overflow-hidden min-h-[320px] lg:col-span-5">
                    {!currentUser && <LockOverlay message="Participar do Quiz" />}
                    <div className="flex items-center gap-2 mb-6 relative z-10">
                      <Zap size={14} className="text-[#c5a059]" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium uppercase tracking-wider">DESCOBERTAS</span>
                    </div>

                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-purple-500" />
                        <span className="text-[10px] text-purple-500 font-medium uppercase tracking-wider">FLASH QUIZ</span>
                      </div>

                      <h3 className="text-gray-900 dark:text-white font-medium text-[13px] mb-5">Quem foi o sucessor de Moisés?</h3>

                      <div className="space-y-2">
                        {['Josué', 'Calebe', 'Arão', 'Hur'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => navigate('/quiz')}
                            className="w-full text-left bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#252525] border border-gray-200 dark:border-[#2A2A2A] rounded-xl py-3 px-4 text-[13px] text-gray-700 dark:text-gray-300 font-medium transition-colors"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </HomePanel>
                </div>
              </>
            )}

            {/* ==================== ABA CRIAR ==================== */}
            {activeTab === 'criar' && (
              <div className="space-y-6">

                {/* 1. RESUMO IA / CRÉDITOS */}
                <div className="bg-white dark:bg-[#1A1624] rounded-[2rem] p-6 md:p-8 border border-gray-200 dark:border-[#2A2A2A] relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-3xl rounded-full" />
                  <div className="w-16 h-16 bg-[#c5a059] rounded-2xl flex items-center justify-center border border-white/10 shadow-lg relative z-10 shrink-0">
                    <Sparkles size={32} className="text-gray-900 dark:text-white" />
                  </div>
                  <div className="relative z-10 flex-1">
                    <h2 className="text-gray-900 dark:text-white font-medium text-2xl md:text-3xl lg:text-4xl leading-tight mb-2">Seu Estúdio Criativo</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-[14px] leading-relaxed">
                      Você pode gerar imagens bíblicas, criar episódios de podcast curtos e planejar esboços utilizando os assistentes de IA especializados.
                    </p>
                  </div>
                  <div className="relative z-10 bg-gray-50 dark:bg-[#120F18] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-4 shrink-0 flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-gray-500 dark:text-gray-500 text-[10px] font-medium uppercase tracking-widest mb-1">Status</span>
                      <span className="text-green-500 font-medium text-sm flex items-center gap-1"><Zap size={14} /> Ativo</span>
                    </div>
                  </div>
                </div>

                {/* 2. FERRAMENTAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* ... cards artes sacras, podcast, criar conteudo ... */}
                  <button
                    onClick={() => navigate('/criar-arte-sacra')}
                    className="bg-white dark:bg-[#1A1E24] p-5 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] text-left hover:border-blue-500/30 transition-colors group relative overflow-hidden h-[180px] flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-auto">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Image size={24} className="text-blue-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-medium text-lg">Gerar Imagens</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">Crie artes sacras com IA.</p>
                      <div className="mt-4 flex items-center text-blue-500 text-xs font-medium gap-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        INICIAR <ArrowRight size={12} />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/criar-podcast')}
                    className="bg-white dark:bg-[#1A1E24] p-5 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] text-left hover:border-pink-500/30 transition-colors group relative overflow-hidden h-[180px] flex flex-col"
                  >
                    {!currentUser && <LockOverlay message="Criar Podcast" />}
                    <div className="flex items-center gap-2 mb-auto">
                      <div className="p-2 rounded-lg bg-pink-500/10">
                        <Mic size={24} className="text-pink-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-medium text-lg">Gerar Podcast</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">Narrativas e Devocionais gerados em áudio.</p>
                      <div className="mt-4 flex items-center text-pink-500 text-xs font-medium gap-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        INICIAR <ArrowRight size={12} />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/criar-conteudo')}
                    className="bg-white dark:bg-[#1A1E24] p-5 rounded-2xl border border-gray-200 dark:border-[#2A2A2A] text-left hover:border-green-500/30 transition-colors group relative overflow-hidden h-[180px] flex flex-col md:col-span-2 lg:col-span-1"
                  >
                    <div className="flex items-center gap-2 mb-auto">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Wand2 size={24} className="text-green-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-medium text-lg">Esboços de IA</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">Aprofundamento de textos.</p>
                      <div className="mt-4 flex items-center text-green-500 text-xs font-medium gap-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        INICIAR <ArrowRight size={12} />
                      </div>
                    </div>
                  </button>
                </div>

                {/* 3. HISTÓRICO RECENTE & DICAS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Historico */}
                  <div className="bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-gray-900 dark:text-white font-medium flex items-center gap-2"><History size={16} className="text-gray-600 dark:text-gray-400" /> Histórico Recente</h3>
                      <button className={`text-[10px] text-[#c5a059] font-medium uppercase tracking-widest transition-colors ${isLightTheme ? 'hover:text-[#111111]' : 'hover:text-white'}`}>Ver Tudo</button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=200', title: 'Criação', type: 'image' },
                        { url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=200', title: 'Mar Vermelho', type: 'image' },
                        { url: 'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=200', title: 'Jerusalém', type: 'podcast' },
                        { url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=200', title: 'Daniel', type: 'podcast' },
                      ].map((item, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white dark:bg-[#1A1A1A] relative group cursor-pointer border border-gray-200 dark:border-[#2A2A2A] hover:border-[#c5a059]/50 transition-colors">
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute top-1 left-1 p-1 bg-black/50 backdrop-blur rounded-md">
                            {item.type === 'image' ? <Image size={10} className="text-white" /> : <Mic size={10} className="text-white" />}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-[9px] font-medium truncate">{item.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dicas */}
                  <div className="bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-gray-900 dark:text-white font-medium flex items-center gap-2"><Book size={16} className="text-gray-600 dark:text-gray-400" /> Dicas de Prompt</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-[#2A2A2A]">
                        <span className="text-[10px] text-[#c5a059] font-medium uppercase mb-1 block">Imagens</span>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Para melhores resultados, seja descritivo com o estilo desejado. Ex: "Jesus caminhando sobre as águas, estilo pintura a óleo impressionista, luz dramática".</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-[#2A2A2A]">
                        <span className="text-[10px] text-pink-500 font-medium uppercase mb-1 block">Podcasts</span>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Cole o versículo ou citação completa do devocional e defina o tom como "encorajador" ou "reflexivo" para a narração.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== ABA REINO ==================== */}
            {activeTab === 'reino' && (
              <ReinoTab
                currentUser={currentUser}
                userProfile={userProfile}
                notifications={notifications}
                navigate={navigate}
                openLogin={openLogin}
                showNotification={showNotification}
              />
            )}

            {/* ==================== ABA GESTÃO ==================== */}
            {activeTab === 'gestao' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-[#111] dark:to-[#1A1A1A] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden border border-gray-700 dark:border-[#333]">
                  <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-[#c5a059]/10 blur-3xl rounded-full pointer-events-none" />
                  <div className="relative z-10 flex-1 mb-4 md:mb-0">
                    <h2 className="text-white font-medium text-2xl md:text-3xl flex items-center gap-3 mb-2">
                      <Church size={28} className="text-[#c5a059]" /> Gestão da Igreja
                    </h2>
                    <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
                      Painel de controle para líderes e administradores. Gerencie pessoas, equipes, QR Codes de formulários e acompanhe indicadores da sua igreja.
                    </p>
                  </div>
                  <div className="relative z-10 bg-black/40 backdrop-blur border border-white/10 rounded-xl p-3 shrink-0 flex items-center gap-3">
                    <span className="text-gray-400 text-[10px] font-medium uppercase tracking-widest">Acesso Restrito</span>
                    <Lock size={14} className="text-[#c5a059]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Pessoas', desc: 'Diretório e acompanhamento', icon: <Users size={20} className="text-blue-500" />, path: '/gestao-igreja/pessoas', badge: '1.2k Ativos', badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
                    { title: 'Equipes', desc: 'Líderes e voluntários', icon: <Target size={20} className="text-green-500" />, path: '/gestao-igreja/equipes', badge: '12 Equipes', badgeColor: 'bg-green-500/10 text-green-600 dark:text-green-400' },
                    { title: 'QR Codes', desc: 'Check-in e formulários', icon: <Globe size={20} className="text-cyan-500" />, path: '/gestao-igreja/qrcodes', badge: '+45 Hoje', badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
                    { title: 'Inbox Pastoral', desc: 'Pedidos e aconselhamento', icon: <Heart size={20} className="text-pink-500" />, path: '/gestao-igreja/inbox', badge: '3 Pendentes', badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400', alert: true },
                    { title: 'Designações', desc: 'Funções e tarefas', icon: <Settings size={20} className="text-orange-500" />, path: '/gestao-igreja/designacoes', badge: '8 Escalas', badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
                    { title: 'Notificações', desc: 'Avisos e alertas', icon: <Bell size={20} className="text-yellow-500" />, path: '/gestao-igreja/notificacoes', badge: 'Enviadas: 124', badgeColor: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
                    { title: 'Permissões', desc: 'Controle de acesso', icon: <ShieldCheck size={20} className="text-purple-500" />, path: '/gestao-igreja/permissoes', badge: 'Seguro', badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
                    { title: 'Indicadores', desc: 'Métricas da igreja', icon: <Zap size={20} className="text-[#c5a059]" />, path: '/gestao-igreja/indicadores', badge: '+15% Frequência', badgeColor: 'bg-[#c5a059]/10 text-[#c5a059]' },
                  ].map((card, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(card.path)}
                      className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5 text-left hover:border-[#c5a059]/50 hover:shadow-lg transition-all group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-[#1A1A1A] flex items-center justify-center border border-gray-100 dark:border-[#333] group-hover:scale-105 transition-transform">
                            {card.icon}
                          </div>
                          {card.badge && (
                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${card.badgeColor} ${card.alert ? 'animate-pulse ring-1 ring-pink-500/30' : ''}`}>
                              {card.badge}
                            </span>
                          )}
                        </div>
                        <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-[#c5a059] transition-colors" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-gray-900 dark:text-white font-medium text-[13px]">{card.title}</h3>
                        <p className="text-gray-500 text-[11px] mt-1 line-clamp-1">{card.desc}</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== ABA CALENDÁRIO ==================== */}
            {activeTab === 'calendario' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-[#111] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-lg">
                  <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-blue-400/20 blur-3xl rounded-full pointer-events-none" />
                  <div className="relative z-10 flex-1 mb-4 md:mb-0">
                    <h2 className="text-white font-medium text-2xl md:text-3xl flex items-center gap-3 mb-2">
                      <Calendar size={28} className="text-blue-300" /> Meu Calendário
                    </h2>
                    <p className="text-blue-100/80 text-sm max-w-xl leading-relaxed">
                      Sua agenda pessoal na igreja. Visualize seus eventos, escalas, cultos e gerencie convites pendentes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Coluna Esquerda: Calendário e Convites */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Mini Calendario Decorativo */}
                    <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-900 dark:text-white font-medium text-[13px]">Junho 2026</h3>
                        <div className="flex gap-1">
                          <button className="p-1 rounded bg-gray-50 dark:bg-[#222]"><ChevronLeft size={14}/></button>
                          <button className="p-1 rounded bg-gray-50 dark:bg-[#222]"><ChevronRight size={14}/></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 font-medium mb-2">
                        <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {[...Array(30)].map((_, i) => (
                          <div key={i} className={`p-1.5 rounded-full ${i+1 === 26 ? 'bg-blue-500 text-white font-bold' : (i+1 === 28 || i+1 === 15) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                            {i+1}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Convites Pendentes */}
                    <div className="bg-white dark:bg-[#161616] border border-orange-200 dark:border-orange-900/30 rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full pointer-events-none" />
                      <div className="flex items-center gap-2 mb-4 relative z-10">
                        <Bell size={16} className="text-orange-500" />
                        <h3 className="text-gray-900 dark:text-white font-medium text-[13px]">Convites Pendentes</h3>
                        <span className="ml-auto bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">2</span>
                      </div>
                      <div className="space-y-3 relative z-10">
                        <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/20">
                          <p className="text-xs text-gray-800 dark:text-gray-200 font-medium mb-1">Escala: Louvor (Baterista)</p>
                          <p className="text-[10px] text-gray-500 mb-3">Culto de Domingo • 28/06 às 18:00</p>
                          <div className="flex gap-2">
                            <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors">Aceitar</button>
                            <button className="flex-1 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 text-[10px] font-bold py-1.5 rounded-lg transition-colors">Recusar</button>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/20">
                          <p className="text-xs text-gray-800 dark:text-gray-200 font-medium mb-1">Convite: Pequeno Grupo</p>
                          <p className="text-[10px] text-gray-500 mb-3">Célula de Jovens • Sexta às 20:00</p>
                          <div className="flex gap-2">
                            <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors">Aceitar</button>
                            <button className="flex-1 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 text-[10px] font-bold py-1.5 rounded-lg transition-colors">Recusar</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Próximos Eventos */}
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-gray-900 dark:text-white font-medium text-[15px] flex items-center gap-2">
                          <ListTodo size={18} className="text-blue-500" /> Próximos Compromissos
                        </h3>
                        <button className="text-[11px] text-blue-500 font-medium hover:underline">Ver Agenda Completa</button>
                      </div>

                      <div className="space-y-6">
                        {/* Hoje */}
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">Hoje</span>
                            <div className="flex-1 h-px bg-gray-100 dark:bg-[#222]" />
                          </div>
                          <div className="space-y-3">
                            <div className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-[#2A2A2A] group cursor-pointer">
                              <div className="flex flex-col items-center justify-center min-w-[50px]">
                                <span className="text-[10px] text-gray-400 font-medium uppercase">Qui</span>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">26</span>
                              </div>
                              <div className="w-1 bg-green-500 rounded-full" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Culto</span>
                                  <span className="text-gray-400 text-[10px] flex items-center gap-1"><Clock size={10} /> 19:30</span>
                                </div>
                                <h4 className="text-[13px] font-medium text-gray-900 dark:text-white mb-0.5 group-hover:text-blue-500 transition-colors">Culto de Ensino</h4>
                                <p className="text-[11px] text-gray-500">Participação como <strong className="text-gray-700 dark:text-gray-300">Membro</strong></p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fim de Semana */}
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">Domingo</span>
                            <div className="flex-1 h-px bg-gray-100 dark:bg-[#222]" />
                          </div>
                          <div className="space-y-3">
                            <div className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-[#2A2A2A] group cursor-pointer">
                              <div className="flex flex-col items-center justify-center min-w-[50px]">
                                <span className="text-[10px] text-gray-400 font-medium uppercase">Dom</span>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">28</span>
                              </div>
                              <div className="w-1 bg-[#c5a059] rounded-full" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="bg-[#c5a059]/10 text-[#c5a059] text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Santa Ceia</span>
                                  <span className="text-gray-400 text-[10px] flex items-center gap-1"><Clock size={10} /> 18:00</span>
                                </div>
                                <h4 className="text-[13px] font-medium text-gray-900 dark:text-white mb-0.5 group-hover:text-blue-500 transition-colors">Culto de Celebração e Santa Ceia</h4>
                                <p className="text-[11px] text-gray-500">Participação como <strong className="text-gray-700 dark:text-gray-300">Pastor</strong> (Pregador)</p>
                              </div>
                            </div>

                            <div className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-[#2A2A2A] group cursor-pointer">
                              <div className="flex flex-col items-center justify-center min-w-[50px]">
                                <span className="text-[10px] text-transparent font-medium uppercase">Dom</span>
                                <span className="text-xl font-bold text-transparent">28</span>
                              </div>
                              <div className="w-1 bg-purple-500 rounded-full" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Reunião</span>
                                  <span className="text-gray-400 text-[10px] flex items-center gap-1"><Clock size={10} /> 20:30</span>
                                </div>
                                <h4 className="text-[13px] font-medium text-gray-900 dark:text-white mb-0.5 group-hover:text-blue-500 transition-colors">Reunião de Liderança</h4>
                                <p className="text-[11px] text-gray-500">Participação como <strong className="text-gray-700 dark:text-gray-300">Pastor</strong></p>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ========================================================= */}
          {/* COLUNA DIREITA (Sidebar) */}
          {/* ========================================================= */}
          <div className="hidden">

            {/* Minhas Atividades Button */}
            <button
              onClick={() => navigate('/historico')}
              className="w-full flex items-center justify-between bg-gradient-to-r from-[#9F5FFC] to-[#7D3CF3] rounded-2xl p-5 shadow-lg group hover:opacity-90 transition-opacity relative"
            >
              {!currentUser && <LockOverlay message="Ver histórico" />}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center bg-transparent">
                  <History size={18} className="text-gray-900 dark:text-white" />
                </div>
                <span className="text-gray-900 dark:text-white font-medium text-[13px]">Minhas Atividades</span>
              </div>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <ChevronRight size={18} className="text-[#8A49F6]" />
              </div>
            </button>

            {/* Acesso Rápido */}
            <HomePanel className="min-h-[360px]">
              <h4 className="text-[10px] text-gray-500 dark:text-gray-500 font-medium uppercase tracking-wider mb-6 pl-2">ACESSO RÁPIDO</h4>

              <div className="space-y-5">
                {INICIO_QUICK_ACCESS_GROUPS.map((group, groupIndex) => (
                  <div key={group.title} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium uppercase tracking-[0.22em]">{group.title}</span>
                    </div>

                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className="w-full flex items-center gap-4 py-3 px-2 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-xl transition-colors"
                        >
                          <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-[#252525]">
                            <div className={item.colorClass}>{quickAccessIcons[item.iconKey]}</div>
                          </div>
                          <span className="text-[13px] text-gray-900 dark:text-white font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {groupIndex < INICIO_QUICK_ACCESS_GROUPS.length - 1 && (
                      <div className="h-px bg-gray-200 dark:bg-[#202020] w-full mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </HomePanel>

            {/* Descobertas / Flash Quiz Box */}
            <HomePanel className="relative overflow-hidden min-h-[360px]">
              {!currentUser && <LockOverlay message="Participar do Quiz" />}
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <Zap size={14} className="text-[#c5a059]" />
                <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium uppercase tracking-wider">DESCOBERTAS</span>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-purple-500" />
                  <span className="text-[10px] text-purple-500 font-medium uppercase tracking-wider">FLASH QUIZ</span>
                </div>

                <h3 className="text-gray-900 dark:text-white font-medium text-[13px] mb-5">Quem foi o sucessor de Moisés?</h3>

                <div className="space-y-2">
                  {['Josué', 'Calebe', 'Arão', 'Hur'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => navigate('/quiz')}
                      className="w-full text-left bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#252525] border border-gray-200 dark:border-[#2A2A2A] rounded-xl py-3 px-4 text-[13px] text-gray-700 dark:text-gray-300 font-medium transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </HomePanel>

          </div>
        </div>
      </main>
    </div>
  );
};

export default SanctuaryPage;

