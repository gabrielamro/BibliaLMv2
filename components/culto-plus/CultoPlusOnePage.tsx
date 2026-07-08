"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Bookmark, CalendarDays, CheckCircle2, Clock, Copy, Download, Edit3, Eye, Gift, HandHeart, Heart, Loader2, MessageSquarePlus, NotebookPen, PlayCircle, QrCode, Radio, Save, Send, Share2, Sparkles, UserPlus, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { cultoPlusService } from '../../services/cultoPlusService';
import { dbService, supabase } from '../../services/supabase';
import { FeedPostCard } from '../social/FeedPostCard';
import CultoPlusTopActions from './CultoPlusTopActions';
import { ChurchService, Post, ServiceAdvancedAnalytics, ServiceAiContent, ServiceAiContentKind, ServiceLiveState, ServiceNote, ServicePrayerRequest, ServiceReactionSummary, ServiceReactionType, ServiceScheduleAssignment, ServiceScheduleStatus } from '../../types';
import { buildServiceCalendarEvent, getLiveStatusLabel, getOfferingItem, getServiceCounterParts } from '../../utils/cultoPlusOnePage';
import { getCurrentLiturgyMoment, getExperienceMoments, getNextLiturgyMoment, resolveServiceStreamStatus, resolveWorshipExperienceMode } from '../../utils/cultoPlusExperience';

type CultoPlusOnePageProps = {
  serviceSlug: string;
};

type QuickAction = {
  label: string;
  hint: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
};

const SCHEDULE_STATUS_LABELS: Record<ServiceScheduleStatus, string> = {
  pending: 'Aguardando resposta',
  confirmed: 'Confirmado',
  declined: 'Recusado',
  replaced: 'Substituido',
};

const SCHEDULE_STATUS_STYLES: Record<ServiceScheduleStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/60',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/60',
  declined: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/60',
  replaced: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-800',
};

const formatFullDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatServiceTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatWeekdayDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const buildServiceShareText = (service: ChurchService) =>
  `Participei do culto "${service.title}" na ${service.churchName}. Tema: ${service.theme}`;

const buildServiceRecapText = ({
  service,
  moments,
  notes,
  posts,
  prayersCount,
  verseSavesCount,
}: {
  service: ChurchService;
  moments: ReturnType<typeof getExperienceMoments>;
  notes: ServiceNote[];
  posts: Post[];
  prayersCount: number;
  verseSavesCount: number;
}) => {
  const keyMoments = moments.slice(0, 8).map((item) => `- ${item.startsAt} ${item.title}`).join('\n');
  const testimonies = posts.slice(0, 3).map((post) => `- ${post.content.replace(/\s+/g, ' ').trim().slice(0, 180)}`).join('\n');
  const privateNotes = notes.slice(0, 3).map((note) => `- ${note.content.replace(/\s+/g, ' ').trim().slice(0, 180)}`).join('\n');

  return [
    `Recapitulacao do culto: ${service.title}`,
    `Igreja: ${service.churchName}`,
    `Tema: ${service.theme}`,
    service.keyVerseRef ? `Versiculo-chave: ${service.keyVerseRef}` : null,
    service.keyVerseText ? `"${service.keyVerseText}"` : null,
    '',
    'Linha do culto:',
    keyMoments || '- Nenhum momento registrado.',
    '',
    'Participacao:',
    `- Check-ins: ${service.checkinsCount ?? 0}`,
    `- Posts/testemunhos: ${posts.length}`,
    `- Pedidos publicos de oracao: ${prayersCount}`,
    `- Versiculos salvos: ${verseSavesCount}`,
    '',
    testimonies ? `Destaques do feed:\n${testimonies}` : null,
    privateNotes ? `Minhas anotacoes:\n${privateNotes}` : null,
  ].filter((line) => line !== null).join('\n');
};

const getPublicPreacherName = (value?: string) => {
  const preacherName = value?.trim() ?? '';
  if (!preacherName || /^membro\s*\d+$/i.test(preacherName)) return '';
  return preacherName;
};

const getPublicMomentNotes = (value?: string | null) => {
  const notes = value?.trim() ?? '';
  if (!notes) return '';
  if (/preencha este momento com conteudo/i.test(notes)) return '';
  return notes;
};

const REACTION_OPTIONS: { type: ServiceReactionType; label: string }[] = [
  { type: 'amen', label: 'Amem' },
  { type: 'glory', label: 'Gloria' },
  { type: 'hallelujah', label: 'Aleluia' },
];

const emptyReactions = (): ServiceReactionSummary => ({ amen: 0, glory: 0, hallelujah: 0 });

const LIVE_POLL_INTERVAL_MS = 30000;
const premiumCardClass = 'rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-900/40 dark:bg-bible-darkPaper';
const premiumIconClass = 'text-emerald-700 dark:text-emerald-300';
const premiumButtonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60';
const champagneButtonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f3d28a] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#073b35] shadow-sm transition hover:bg-white disabled:opacity-60';

const POST_CULT_AI_ACTIONS: { kind: ServiceAiContentKind; label: string; description: string }[] = [
  { kind: 'pastor_post_summary', label: 'Resumo IA', description: 'Sintese pastoral para memoria e comunicacao.' },
  { kind: 'member_devotional', label: 'Devocional', description: 'Devocional para a igreja continuar na Palavra.' },
  { kind: 'member_weekly_plan', label: 'Plano semanal', description: 'Acompanhamento simples para celulas e grupos.' },
];

const CultoPlusOnePage: React.FC<CultoPlusOnePageProps> = ({ serviceSlug }) => {
  const { currentUser, userProfile, openLogin, showNotification, recordActivity, checkFeatureAccess, incrementUsage } = useAuth();
  const { setIsHeaderHidden, resetHeader } = useHeader();
  const [service, setService] = useState<ChurchService | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [checkinsCount, setCheckinsCount] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [note, setNote] = useState('');
  const [noteComments, setNoteComments] = useState<ServiceNote[]>([]);
  const [isNotePanelOpen, setIsNotePanelOpen] = useState(false);
  const [isReactionPanelOpen, setIsReactionPanelOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reactions, setReactions] = useState<ServiceReactionSummary>(emptyReactions);
  const [publicPrayers, setPublicPrayers] = useState<ServicePrayerRequest[]>([]);
  const [scheduleAssignments, setScheduleAssignments] = useState<ServiceScheduleAssignment[]>([]);
  const [nextService, setNextService] = useState<ChurchService | null>(null);
  const [pastoralAnalytics, setPastoralAnalytics] = useState<ServiceAdvancedAnalytics | null>(null);
  const [postCultAiContents, setPostCultAiContents] = useState<Partial<Record<ServiceAiContentKind, ServiceAiContent>>>({});
  const [postCultAiLoadingKind, setPostCultAiLoadingKind] = useState<ServiceAiContentKind | null>(null);
  const [canManageService, setCanManageService] = useState(false);
  const [canViewServiceSchedule, setCanViewServiceSchedule] = useState(false);
  const [savingScheduleStatusId, setSavingScheduleStatusId] = useState<string | null>(null);
  const [prayerContent, setPrayerContent] = useState('');
  const [isPrayerPrivate, setIsPrayerPrivate] = useState(false);
  const [savingPrayer, setSavingPrayer] = useState(false);
  const [savingVerse, setSavingVerse] = useState(false);
  const [verseSavesCount, setVerseSavesCount] = useState(0);
  const [checkinUrl, setCheckinUrl] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [exportingPastoralReport, setExportingPastoralReport] = useState(false);
  const [checkinIntentHandled, setCheckinIntentHandled] = useState(false);
  const [inviteIntentHandled, setInviteIntentHandled] = useState(false);
  const [inviteAcceptedHandled, setInviteAcceptedHandled] = useState(false);
  const [liveState, setLiveState] = useState<ServiceLiveState | null>(null);
  const [nowDate, setNowDate] = useState(() => new Date());
  const currentSectionRef = useRef<HTMLDivElement>(null);
  const postComposerRef = useRef<HTMLTextAreaElement>(null);

  const userId = currentUser?.uid ?? currentUser?.id;

  useEffect(() => {
    setIsHeaderHidden(true);
    return () => {
      setIsHeaderHidden(false);
      resetHeader();
    };
  }, [resetHeader, setIsHeaderHidden]);

  useEffect(() => {
    const loadService = async () => {
      setLoading(true);
      try {
        const experience = await cultoPlusService.getServiceExperienceBySlug(serviceSlug, userId);
        setService(experience?.service ?? null);

        if (experience) {
          const visitors = await cultoPlusService.recordVisit(experience.service, currentUser);
          setVisitorsCount(visitors);
          setCheckinsCount(experience.participation.checkinsCount);
          setCheckedIn(experience.viewer.checkedIn);
          setNoteComments(experience.viewer.notes);
          setPosts(experience.content.posts);
          setReactions(experience.participation.reactions);
          setPublicPrayers(experience.content.publicPrayers);
          setScheduleAssignments(experience.content.scheduleAssignments);
          setNextService(experience.content.nextService ?? null);
          setVerseSavesCount(experience.participation.verseSavesCount);
          setLiveState(experience.liveState);
          setCanManageService(experience.viewer.canManageService);
          setCanViewServiceSchedule(experience.viewer.canViewServiceSchedule);
        }
      } catch (error) {
        console.error('Erro ao carregar experiencia do culto:', error);
        showNotification('Nao foi possivel carregar o culto.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadService();
  }, [currentUser, serviceSlug, showNotification, userId]);

  useEffect(() => {
    if (!service) return;
    let isMounted = true;

    const refreshStats = async () => {
      try {
        const stats = await cultoPlusService.getServiceStats(service.id);
        if (!isMounted) return;
        setVisitorsCount(stats.visitorsCount);
        setCheckinsCount(stats.checkinsCount);
        setVerseSavesCount(stats.verseSavesCount);
      } catch {
        // Realtime is progressive enhancement; the regular UI actions still update local state.
      }
    };

    const refreshServiceExperience = async () => {
      try {
        const experience = await cultoPlusService.getServiceExperienceBySlug(serviceSlug, userId);
        if (!isMounted || !experience) return;
        setService(experience.service);
        setCheckedIn(experience.viewer.checkedIn);
        setNoteComments(experience.viewer.notes);
        setScheduleAssignments(experience.content.scheduleAssignments);
        setNextService(experience.content.nextService ?? null);
        setLiveState(experience.liveState);
        setCheckinsCount(experience.participation.checkinsCount);
        setVerseSavesCount(experience.participation.verseSavesCount);
        setCanManageService(experience.viewer.canManageService);
        setCanViewServiceSchedule(experience.viewer.canViewServiceSchedule);
      } catch {
        // Avoid surfacing transient Realtime refresh errors to members during worship.
      }
    };

    const channel = supabase
      .channel(`culto_plus_service_${service.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'church_services', filter: `id=eq.${service.id}` }, () => {
        refreshServiceExperience();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_live_states', filter: `service_id=eq.${service.id}` }, () => {
        cultoPlusService.getLiveState(service.id).then((next) => {
          if (isMounted) setLiveState(next);
        }).catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_reactions', filter: `service_id=eq.${service.id}` }, () => {
        cultoPlusService.getReactionSummary(service.id).then((next) => {
          if (isMounted) setReactions(next);
        }).catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_prayer_requests', filter: `service_id=eq.${service.id}` }, () => {
        Promise.all([
          cultoPlusService.getPublicPrayerRequests(service.id),
          refreshStats(),
        ]).then(([nextPrayers]) => {
          if (isMounted) setPublicPrayers(nextPrayers);
        }).catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `service_id=eq.${service.id}` }, () => {
        Promise.all([
          cultoPlusService.getServicePosts(service.id),
          refreshStats(),
        ]).then(([nextPosts]) => {
          if (isMounted) setPosts(nextPosts);
        }).catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_checkins', filter: `service_id=eq.${service.id}` }, () => {
        refreshStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_visits', filter: `service_id=eq.${service.id}` }, () => {
        refreshStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_verse_saves', filter: `service_id=eq.${service.id}` }, () => {
        refreshStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_schedule_assignments', filter: `service_id=eq.${service.id}` }, () => {
        cultoPlusService.getScheduleAssignments(service.id).then((next) => {
          if (isMounted) setScheduleAssignments(next);
        }).catch(() => {});
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [service, serviceSlug, userId]);

  useEffect(() => {
    if (!service || (service.status !== 'live' && service.status !== 'in_progress')) return;
    const timer = window.setInterval(() => {
      cultoPlusService.getLiveState(service.id).then(setLiveState).catch(() => {});
    }, LIVE_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [service]);

  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}`;
    setCheckinUrl(`${url}?checkin=1`);
    setInviteUrl(url);
    const timer = window.setInterval(() => setNowDate(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const currentStep = useMemo(() => {
    if (!service) return null;
    return getCurrentLiturgyMoment(service, nowDate, liveState?.currentItemId);
  }, [service, liveState, nowDate]);

  const nextStep = useMemo(() => service ? getNextLiturgyMoment(service, currentStep) : null, [service, currentStep]);
  const experienceMoments = useMemo(() => service ? getExperienceMoments(service, currentStep, nowDate) : [], [currentStep, service, nowDate]);
  const offeringItem = useMemo(() => service ? getOfferingItem(service.liturgyItems) : undefined, [service]);
  const counterParts = useMemo(() => service ? getServiceCounterParts(service, nowDate) : null, [service, nowDate]);
  const streamStatus = useMemo(() => service ? resolveServiceStreamStatus(service, nowDate) : 'not_configured', [service, nowDate]);
  const experienceMode = useMemo(
    () => service ? resolveWorshipExperienceMode({ serviceStatus: service.status, streamStatus }) : 'before',
    [service, streamStatus],
  );
  const liveStatusLabel = useMemo(() => {
    if (!service) return '';
    if (experienceMode === 'during_without_live') return 'Culto em andamento';
    if (experienceMode === 'after') return 'Culto encerrado';
    if (experienceMode === 'archived') return 'Culto arquivado';
    return getLiveStatusLabel(service, nowDate);
  }, [experienceMode, service, nowDate]);
  const scheduleGroups = useMemo(() => scheduleAssignments.reduce<Record<string, ServiceScheduleAssignment[]>>((groups, assignment) => {
    const key = assignment.ministryName || 'Equipe sem nome';
    groups[key] = [...(groups[key] ?? []), assignment];
    return groups;
  }, {}), [scheduleAssignments]);
  const myAssignments = useMemo(
    () => userId ? scheduleAssignments.filter((assignment) => assignment.userId === userId || assignment.replacementUserId === userId) : [],
    [scheduleAssignments, userId],
  );
  const canOpenSchedule = canViewServiceSchedule || myAssignments.length > 0;
  const publicPreacherName = service ? getPublicPreacherName(service.preacherName) : '';
  const currentStepNotes = getPublicMomentNotes(liveState?.currentExplanation || currentStep?.notes);
  const isAfterCult = experienceMode === 'after' || experienceMode === 'archived';
  const afterCultTitle = experienceMode === 'archived' ? 'Culto arquivado' : 'Culto encerrado';
  const completedMomentsCount = experienceMoments.filter((item) => item.momentStatus === 'completed').length;
  const recapStats = [
    { label: 'Momentos', value: `${completedMomentsCount}/${experienceMoments.length || service?.liturgyItems.length || 0}`, icon: <CheckCircle2 size={16} /> },
    { label: 'Anotacoes', value: `${noteComments.length}`, icon: <NotebookPen size={16} /> },
    { label: 'Pedidos', value: `${publicPrayers.length}`, icon: <HandHeart size={16} /> },
    { label: 'Posts', value: `${posts.length}`, icon: <MessageSquarePlus size={16} /> },
    { label: 'Versiculos', value: `${verseSavesCount}`, icon: <BookOpen size={16} /> },
  ];
  const recapText = useMemo(() => service ? buildServiceRecapText({
    service: { ...service, checkinsCount },
    moments: experienceMoments,
    notes: noteComments,
    posts,
    prayersCount: publicPrayers.length,
    verseSavesCount,
  }) : '', [checkinsCount, experienceMoments, noteComments, posts, publicPrayers.length, service, verseSavesCount]);

  useEffect(() => {
    if (!service || !isAfterCult) {
      setPastoralAnalytics(null);
      return;
    }

    let isMounted = true;
    cultoPlusService.getAdvancedAnalytics(service.id)
      .then((analytics) => {
        if (isMounted) setPastoralAnalytics(analytics);
      })
      .catch(() => {
        if (isMounted) setPastoralAnalytics(null);
      });

    return () => {
      isMounted = false;
    };
  }, [isAfterCult, service]);

  const requireLogin = () => {
    openLogin(window.location.pathname);
    showNotification('Entre para participar do culto.', 'info');
  };

  const handleCheckin = async () => {
    if (!service) return;
    if (!currentUser || !userProfile) {
      requireLogin();
      return;
    }
    setCheckingIn(true);
    try {
      await cultoPlusService.checkIn(service, currentUser, userProfile);
      setCheckedIn(true);
      setCheckinsCount((count) => checkedIn ? count : count + 1);
      await recordActivity('social_interaction', `Check-in no culto: ${service.title}`, { serviceId: service.id });
      showNotification('Check-in registrado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel fazer check-in.', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSaveNote = async () => {
    if (!service) return;
    if (!currentUser || !userProfile) {
      requireLogin();
      return;
    }
    const content = note.trim();
    if (!content) {
      showNotification('Escreva uma anotacao antes de salvar.', 'warning');
      return;
    }
    setSavingNote(true);
    try {
      const savedNote = await cultoPlusService.saveNote(service.id, userId, content);
      setNoteComments((items) => [savedNote, ...items]);
      setNote('');
      await recordActivity('create_note', `Anotou no culto: ${service.title}`, { serviceId: service.id });
      showNotification('Anotacao salva.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel salvar a anotacao.', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreatePost = async () => {
    if (!service) return;
    if (!currentUser || !userProfile) {
      requireLogin();
      return;
    }
    const content = postContent.trim() || buildServiceShareText(service);
    setPosting(true);
    try {
      await cultoPlusService.createServicePost({ service, user: currentUser, profile: userProfile, content });
      const nextPosts = await cultoPlusService.getServicePosts(service.id);
      setPosts(nextPosts);
      setPostContent('');
      await recordActivity('social_post', `Postou sobre o culto: ${service.title}`, { serviceId: service.id });
      showNotification('Postagem enviada para o mural da igreja.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel publicar no feed.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handlePrepareTestimonyPost = () => {
    if (!service) return;
    if (!postContent.trim()) {
      setPostContent(`Testemunho do culto "${service.title}": `);
    }
    window.setTimeout(() => {
      postComposerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postComposerRef.current?.focus();
    }, 0);
  };

  const handleShare = async () => {
    if (!service) return;
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: service.title, text: service.theme, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showNotification('Link do culto copiado.', 'success');
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Erro ao compartilhar culto:', error);
      showNotification('Nao foi possivel compartilhar o culto.', 'error');
    }
  };

  const getOrCreateInviteUrl = async (source: 'copy' | 'share' = 'share') => {
    if (!service) return window.location.href.split('?')[0];
    if (inviteUrl.includes('?invite=')) return inviteUrl;
    if (!currentUser || !userProfile) return window.location.href.split('?')[0];

    setCreatingInvite(true);
    try {
      const invite = await cultoPlusService.createPublicInvite(service, {
        uid: userId,
        id: userId,
        displayName: userProfile.displayName,
      }, source);
      const url = `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(invite.token)}`;
      setInviteToken(invite.token);
      setInviteUrl(url);
      await recordActivity('invite_sent', `Convidou alguem para o culto: ${service.title}`, { serviceId: service.id, inviteId: invite.id });
      return url;
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel registrar o convite.', 'error');
      return window.location.href.split('?')[0];
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyToClipboard = async (value: string, message = 'Copiado.') => {
    try {
      await navigator.clipboard.writeText(value);
      showNotification(message, 'success');
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      showNotification('Nao foi possivel copiar o texto.', 'error');
    }
  };

  const handleCopyRecap = () => {
    if (!recapText) return;
    copyToClipboard(recapText, 'Recapitulacao copiada.');
  };

  const handleDownloadRecap = () => {
    if (!service || !recapText) return;
    const blob = new Blob([recapText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recap-${service.slug}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPastoralReport = async () => {
    if (!service) return;
    setExportingPastoralReport(true);
    try {
      const csv = await cultoPlusService.exportServiceReport(service);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-pastoral-${service.slug}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showNotification('Relatorio pastoral exportado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel exportar o relatorio pastoral.', 'error');
    } finally {
      setExportingPastoralReport(false);
    }
  };

  const handleGeneratePostCultAi = async (kind: ServiceAiContentKind) => {
    if (!service) return;
    if (!currentUser) {
      requireLogin();
      return;
    }
    if (!checkFeatureAccess('aiSermonBuilder')) {
      showNotification('IA pos-culto e recurso premium do Culto+.', 'warning');
      return;
    }

    setPostCultAiLoadingKind(kind);
    try {
      const result = await cultoPlusService.generateAiContent(kind, service, userId, recapText);
      setPostCultAiContents((items) => ({ ...items, [kind]: result }));
      await incrementUsage('analysis');
      await recordActivity('social_interaction', `Gerou apoio pos-culto com IA: ${service.title}`, { serviceId: service.id, kind });
      showNotification('Apoio pos-culto gerado com IA.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel gerar apoio pos-culto.', 'error');
    } finally {
      setPostCultAiLoadingKind(null);
    }
  };

  const handleAddToCalendar = () => {
    if (!service) return;
    const pageUrl = window.location.href.split('?')[0];
    const ics = buildServiceCalendarEvent(service, pageUrl);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `culto-${service.slug}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleFollowAction = () => {
    if (!checkedIn) {
      handleCheckin();
      return;
    }
    currentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReaction = async (reactionType: ServiceReactionType) => {
    if (!service) return;
    if (!currentUser || !userProfile) {
      requireLogin();
      return;
    }
    try {
      const next = await cultoPlusService.reactToService(service.id, userId, reactionType);
      setReactions(next);
      await recordActivity('social_interaction', `Reagiu ao culto: ${service.title}`, { serviceId: service.id, reactionType });
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel registrar a reacao.', 'error');
    }
  };

  useEffect(() => {
    if (!service || checkinIntentHandled) return;
    const shouldCheckin = new URLSearchParams(window.location.search).get('checkin') === '1';
    if (!shouldCheckin) return;
    setCheckinIntentHandled(true);
    if (!currentUser || !userProfile) {
      requireLogin();
      return;
    }
    if (!checkedIn) {
      handleCheckin();
    }
  }, [service, checkinIntentHandled, currentUser, userProfile, checkedIn]);

  useEffect(() => {
    if (!service) return;
    const token = new URLSearchParams(window.location.search).get('invite') ?? '';
    if (!token) return;
    setInviteToken(token);
    setInviteUrl(`${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(token)}`);
    if (!inviteIntentHandled) {
      setInviteIntentHandled(true);
      cultoPlusService.markPublicInviteOpened(token).catch(() => {});
    }
    if (currentUser && userProfile && !inviteAcceptedHandled) {
      setInviteAcceptedHandled(true);
      cultoPlusService.acceptPublicInvite(token, currentUser, userProfile)
        .then(() => recordActivity('invite_accepted', `Aceitou convite para o culto: ${service.title}`, { serviceId: service.id, inviteToken: token }))
        .catch(() => {});
    }
  }, [currentUser, inviteAcceptedHandled, inviteIntentHandled, recordActivity, service, userProfile]);

  const handleCreatePrayer = async () => {
    if (!service) return;
    if (!currentUser || !userProfile) {
      requireLogin();
      return;
    }
    if (!prayerContent.trim()) {
      showNotification('Escreva o pedido de oracao.', 'warning');
      return;
    }
    setSavingPrayer(true);
    try {
      const prayer = await cultoPlusService.createPrayerRequest(service, currentUser, userProfile, prayerContent.trim(), isPrayerPrivate);
      if (!prayer.isPrivate) setPublicPrayers((items) => [prayer, ...items]);
      setPrayerContent('');
      setIsPrayerPrivate(false);
      setIsPrayerModalOpen(false);
      await recordActivity('prayer_wall', `Pediu oracao no culto: ${service.title}`, { serviceId: service.id, isPrivate: prayer.isPrivate });
      showNotification(prayer.isPrivate ? 'Pedido privado enviado.' : 'Pedido publicado no culto.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel enviar o pedido.', 'error');
    } finally {
      setSavingPrayer(false);
    }
  };

  const handleIntercedePrayer = async (prayer: ServicePrayerRequest) => {
    if (!service) return;
    if (!currentUser || !userProfile) {
      requireLogin();
      return;
    }
    try {
      const count = await cultoPlusService.intercedePrayerRequest(prayer.id, service.id, userId);
      setPublicPrayers((items) => items.map((item) => item.id === prayer.id ? { ...item, intercessorsCount: count, intercessedByMe: true } : item));
      await recordActivity('prayer_wall', `Intercedeu por pedido no culto: ${service.title}`, { serviceId: service.id, prayerId: prayer.id });
      showNotification('Intercessao registrada.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel registrar a intercessao.', 'error');
    }
  };

  const handleScheduleStatus = async (assignment: ServiceScheduleAssignment, status: ServiceScheduleStatus) => {
    if (!currentUser || !userProfile) {
      requireLogin();
      return;
    }
    setSavingScheduleStatusId(assignment.id);
    try {
      await cultoPlusService.updateScheduleAssignmentStatus(assignment.id, status);
      const updatedAt = new Date().toISOString();
      setScheduleAssignments((items) => items.map((item) => item.id === assignment.id ? { ...item, status, updatedAt } : item));
      await recordActivity('social_interaction', `${status === 'confirmed' ? 'Confirmou' : 'Respondeu'} escala no culto: ${service?.title ?? 'Culto+'}`, {
        serviceId: assignment.serviceId,
        assignmentId: assignment.id,
        status,
      });
      showNotification(status === 'confirmed' ? 'Escala confirmada.' : 'Resposta da escala registrada.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel responder a escala.', 'error');
    } finally {
      setSavingScheduleStatusId(null);
    }
  };

  const handleSaveKeyVerse = async () => {
    if (!service) return;
    if (!currentUser || !userProfile) {
      requireLogin();
      return;
    }
    setSavingVerse(true);
    try {
      const count = await cultoPlusService.saveKeyVerse(service, userId);
      setVerseSavesCount(count);
      await recordActivity('mark_verse', `Salvou versiculo-chave do culto: ${service.title}`, { serviceId: service.id, verseRef: service.keyVerseRef });
      showNotification('Versiculo salvo.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel salvar o versiculo.', 'error');
    } finally {
      setSavingVerse(false);
    }
  };

  const quickActions: QuickAction[] = [
    ...(!isAfterCult ? [{
      label: checkedIn ? 'Acompanhar' : 'Check-in',
      hint: checkedIn ? 'Culto' : 'Registrar presenca',
      title: checkedIn ? 'Ir para o momento atual e acompanhar a liturgia.' : 'Registrar sua presenca neste culto.',
      icon: <Radio size={20} />,
      onClick: handleFollowAction,
    }] : []),
    {
      label: 'Anotacoes',
      hint: isAfterCult ? 'Rever suas notas' : 'Faca suas notas',
      title: 'Abrir o painel para escrever suas anotacoes pessoais do culto.',
      icon: <NotebookPen size={20} />,
      onClick: () => setIsNotePanelOpen(true),
    },
    ...(!isAfterCult ? [{
      label: 'Oracao',
      hint: 'Escreva seu pedido',
      title: 'Abrir popup para enviar um pedido de oracao deste culto.',
      icon: <HandHeart size={20} />,
      onClick: () => setIsPrayerModalOpen(true),
    }, {
      label: 'Ofertar',
      hint: offeringItem ? 'Dizimos e ofertas' : 'Indisponivel',
      title: offeringItem ? 'Abrir a chave PIX cadastrada para dizimos e ofertas.' : 'Este culto ainda nao possui chave PIX de oferta cadastrada.',
      icon: <Gift size={20} />,
      onClick: () => setIsOfferingModalOpen(true),
    }] : []),
    {
      label: 'Convidar',
      hint: isAfterCult ? 'Compartilhe memoria' : 'Chame alguem',
      title: isAfterCult ? 'Compartilhar a pagina deste culto com outra pessoa.' : 'Abrir convite pronto para enviar este culto a outra pessoa.',
      icon: <UserPlus size={20} />,
      onClick: isAfterCult ? handleShare : () => setIsInviteModalOpen(true),
    },
    {
      label: 'Compartilhar',
      hint: 'Divulgue o culto',
      title: 'Compartilhar ou copiar o link publico deste culto.',
      icon: <Share2 size={20} />,
      onClick: handleShare,
    },
  ];

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4fbf8] dark:bg-black"><Loader2 className="animate-spin text-emerald-700 dark:text-emerald-300" size={40} /></div>;
  }

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4fbf8] p-6 text-center dark:bg-black">
        <Radio className="mb-4 text-gray-300" size={48} />
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Culto nao encontrado</h1>
        <Link href="/social/igrejas" className="mt-4 text-sm font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Voltar para igrejas</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4fbf8] text-gray-900 dark:bg-black dark:text-white">
      <section className="relative overflow-hidden bg-[#073b35] text-white">
        {service.bannerUrl && <img src={service.bannerUrl} alt={service.title} className="absolute inset-0 h-full w-full object-cover opacity-30" />}
        <div className="absolute inset-0 bg-gradient-to-br from-[#031f1c]/95 via-[#073b35]/90 to-[#d8b15f]/70" />
        <CultoPlusTopActions
          backHref={service.churchSlug ? `/igreja/${service.churchSlug}` : '/social/igrejas'}
          onNotify={() => showNotification('Notificacoes do culto em breve.', 'info')}
          items={[
            { label: 'Compartilhar culto', icon: <Share2 size={15} />, onClick: handleShare },
            ...(checkinUrl ? [{ label: 'QR de check-in', icon: <QrCode size={15} />, onClick: () => setIsQrModalOpen(true) }] : []),
            { label: 'Ver igreja', icon: <Users size={15} />, href: service.churchSlug ? `/igreja/${service.churchSlug}` : '/social/igrejas' },
          ]}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-8 pt-24 md:px-8 md:pb-10 md:pt-28">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-lg border border-[#f3d28a]/30 bg-black/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-[#f3d28a] backdrop-blur">
                Culto+
              </span>
              <h1 className="mt-4 max-w-4xl text-4xl font-medium leading-tight text-white md:text-6xl">{service.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/82 md:text-xl">{service.theme}</p>

              {(canOpenSchedule || canManageService) && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {canOpenSchedule && (
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/12 px-4 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur transition hover:bg-white/18"
                    >
                      <Users size={16} />
                      Ver escala
                    </button>
                  )}
                  {canManageService && (
                    <Link
                      href={`/workspace-pastoral/cultos?serviceId=${encodeURIComponent(service.id)}&edit=1`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f3d28a] px-4 text-[10px] font-black uppercase tracking-widest text-[#073b35] shadow-sm transition hover:bg-white"
                    >
                      <Edit3 size={16} />
                      Editar culto
                    </Link>
                  )}
                </div>
              )}

              <div className="mt-7 max-w-3xl rounded-2xl border border-white/18 bg-white/8 p-4 shadow-2xl shadow-black/10 backdrop-blur-md md:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#f3d28a]/35 bg-[#f3d28a]/10 text-[#f3d28a]">
                    <Radio size={28} />
                  </div>
                  <div>
                    <p className="text-lg font-medium leading-snug text-white md:text-xl">
                      Seja bem-vindo ao culto das {formatServiceTime(service.startsAt)}.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                      Voce esta no Culto da {service.churchName}{publicPreacherName ? `, com ${publicPreacherName}.` : '.'}
                      {service.liveUrl ? ' Voce tambem pode participar pela live na web.' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/15 backdrop-blur-md">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f3d28a]/18 px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest text-[#f3d28a]">
                <Radio size={13} />
                {liveStatusLabel}
              </span>
              {isAfterCult ? (
                <div className="mt-6 rounded-xl border border-white/12 bg-white/8 p-4">
                  <p className="text-lg font-medium text-white">{experienceMode === 'archived' ? 'Registro historico' : 'Obrigado por participar'}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    As anotacoes, pedidos e publicacoes continuam disponiveis para memoria do culto.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mt-6 text-sm text-white/78">{counterParts?.label}</p>
                  <div className="mt-2 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-end gap-2">
                    <div>
                      <p className="text-4xl font-medium leading-none md:text-5xl">{counterParts?.hours ?? '00'}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-widest text-white/58">Hora</p>
                    </div>
                    <span className="pb-6 text-3xl text-white/75">:</span>
                    <div>
                      <p className="text-4xl font-medium leading-none md:text-5xl">{counterParts?.minutes ?? '00'}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-widest text-white/58">Min</p>
                    </div>
                    <span className="pb-6 text-3xl text-white/75">:</span>
                    <div>
                      <p className="text-4xl font-medium leading-none md:text-5xl">{counterParts?.seconds ?? '00'}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-widest text-white/58">Seg</p>
                    </div>
                  </div>
                </>
              )}
              {service.liveUrl ? (
                <a
                  href={service.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={isAfterCult ? 'Abrir a gravacao ou transmissao vinculada a este culto.' : 'Abrir a transmissao ao vivo deste culto em uma nova aba.'}
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e4b457] px-4 text-[10px] font-medium uppercase tracking-widest text-white shadow-lg shadow-black/10 transition hover:bg-[#f3d28a] hover:text-[#073b35]"
                >
                  <PlayCircle size={16} />
                  {isAfterCult ? 'Assistir novamente' : 'Entrar na live'}
                </a>
              ) : experienceMode === 'during_without_live' ? (
                <div className="mt-6 rounded-xl border border-white/12 bg-white/8 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#f3d28a]">
                    <Radio size={14} />
                    Culto presencial
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Sem transmissao ativa. Acompanhe a liturgia, ore, anote e participe pelo app.
                  </p>
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-white/10 bg-white/6 p-4 text-sm leading-relaxed text-white/62">
                  Transmissao nao configurada. O culto pode ser acompanhado pela programacao, check-in, oracao e anotacoes.
                </p>
              )}
              {!isAfterCult && (
                <button
                  type="button"
                  onClick={handleAddToCalendar}
                  title="Baixar um arquivo de calendario com data, horario e link deste culto."
                  className="mt-4 inline-flex min-h-10 items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-white/80 transition hover:text-white"
                >
                  <CalendarDays size={16} />
                  Adicionar ao calendario
                </button>
              )}
            </aside>
          </div>

          <div className="mt-8 grid gap-4 border-y border-white/12 py-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: <CalendarDays size={19} />, label: formatWeekdayDate(service.startsAt), value: 'Data do culto' },
              { icon: <Clock size={19} />, label: formatServiceTime(service.startsAt), value: 'Horario de inicio' },
              { icon: <BookOpen size={19} />, label: service.keyVerseRef || 'Nao definido', value: 'Versiculo-chave' },
              { icon: <Eye size={19} />, label: `${visitorsCount}`, value: visitorsCount === 1 ? 'Visita' : 'Visitas' },
              { icon: <Users size={19} />, label: `${checkinsCount}`, value: checkinsCount === 1 ? 'Check-in' : 'Check-ins' },
            ].map((item) => (
              <div key={`${item.value}_${item.label}`} className="flex min-w-0 items-center gap-3 text-white/78">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85">{item.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-0.5 text-xs text-white/58">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                title={action.title}
                className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white/12 bg-white/10 p-3 text-left backdrop-blur transition hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-[#f3d28a]/70"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f3d28a]/14 text-[#f3d28a] transition group-hover:bg-[#f3d28a]/24">{action.icon}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">{action.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-white/60">{action.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_360px] md:px-8">
        <div className="space-y-6">
          <div ref={currentSectionRef} className={premiumCardClass}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Momento atual</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{isAfterCult ? afterCultTitle : liveState?.currentTitle || currentStep?.title || 'Culto publicado'}</h2>
                {isAfterCult ? (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    A recapitulacao do culto permanece disponivel com timeline, anotacoes, pedidos e publicacoes.
                  </p>
                ) : currentStepNotes && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{currentStepNotes}</p>}
              </div>
              {isAfterCult ? (
                <button onClick={handleShare} title="Compartilhar ou copiar o link publico deste culto." className={champagneButtonClass}>
                  <Share2 size={16} />
                  Compartilhar culto
                </button>
              ) : (
                <button onClick={handleCheckin} disabled={checkingIn || checkedIn} title={checkedIn ? 'Voce ja registrou check-in neste culto.' : 'Registrar sua presenca neste culto.'} className={champagneButtonClass}>
                  {checkingIn ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {checkedIn ? 'Check-in feito' : 'Fazer check-in'}
                </button>
              )}
            </div>
          </div>

          {myAssignments.length > 0 && (
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-900/40 dark:bg-bible-darkPaper">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Minha escala</p>
                  <h2 className="mt-1 text-xl font-black text-gray-900 dark:text-white">Voce esta escalado neste culto</h2>
                </div>
                {canOpenSchedule && (
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    title="Abrir a escala completa deste culto."
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300"
                  >
                    <Users size={14} />
                    Ver escala
                  </button>
                )}
              </div>

              <div className="grid gap-3">
                {myAssignments.map((assignment) => {
                  const isSavingThisSchedule = savingScheduleStatusId === assignment.id;
                  const isActionDisabled = isAfterCult || assignment.status === 'replaced' || isSavingThisSchedule;
                  return (
                    <div key={assignment.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black text-gray-900 dark:text-white">{assignment.ministryName || 'Equipe'}</span>
                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${SCHEDULE_STATUS_STYLES[assignment.status]}`}>
                              {SCHEDULE_STATUS_LABELS[assignment.status]}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{assignment.role || 'Funcao nao informada'}</p>
                          {assignment.replacementUserDisplayName && (
                            <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-200">Substituto: {assignment.replacementUserDisplayName}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => handleScheduleStatus(assignment, 'confirmed')}
                            disabled={isActionDisabled || assignment.status === 'confirmed'}
                            title="Confirmar sua presenca nesta escala."
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSavingThisSchedule ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleScheduleStatus(assignment, 'declined')}
                            disabled={isActionDisabled || assignment.status === 'declined'}
                            title="Informar que voce nao podera servir nesta escala."
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-[10px] font-black uppercase tracking-widest text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/20 dark:text-red-200"
                          >
                            <X size={13} />
                            Recusar
                          </button>
                        </div>
                      </div>
                      {isAfterCult && (
                        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-500 dark:bg-black/20 dark:text-gray-400">
                          Este culto ja foi encerrado. A escala fica disponivel apenas como historico.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isAfterCult && (
            <div className="rounded-[2rem] border border-[#f3d28a]/40 bg-gradient-to-br from-[#fff8e8] via-white to-emerald-50 p-6 shadow-sm dark:border-amber-900/40 dark:from-amber-950/20 dark:via-bible-darkPaper dark:to-emerald-950/10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#a87d22] dark:text-amber-200">Recapitulacao do culto</p>
                  <h2 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{service.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    Reviva a ordem do culto, continue suas anotacoes e compartilhe o que Deus falou com a igreja.
                  </p>
                </div>
                {service.liveUrl && (
                  <a
                    href={service.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir a gravacao ou transmissao vinculada a este culto."
                    className={champagneButtonClass}
                  >
                    <PlayCircle size={16} />
                    Assistir novamente
                  </a>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {recapStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-emerald-100 bg-white/75 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-black/18">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                      {item.icon}
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{item.value}</p>
                    <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>

              {pastoralAnalytics && (
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-white/75 p-4 dark:border-emerald-900/40 dark:bg-black/18">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Indicadores pastorais</p>
                      <h3 className="mt-1 text-sm font-black text-gray-900 dark:text-white">Participacao, engajamento e escala deste culto</h3>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Baseado nos registros digitais do Culto+
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Engajamento', value: `${pastoralAnalytics.engagementRate}%`, helper: 'acoes digitais por visita' },
                      { label: 'Reacoes', value: `${pastoralAnalytics.reactionsCount}`, helper: 'amen, gloria e aleluia' },
                      { label: 'Escalados', value: `${pastoralAnalytics.schedulesCount}`, helper: `${pastoralAnalytics.pendingSchedulesCount} pendente(s)` },
                      { label: 'Participacao', value: `${pastoralAnalytics.checkinsCount}/${pastoralAnalytics.visitorsCount}`, helper: 'check-ins / visitas' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-[#f8fcfa] p-4 dark:bg-black/20">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{item.value}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{item.label}</p>
                        <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{item.helper}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setIsNotePanelOpen(true)}
                  title="Abrir painel para rever ou criar anotacoes deste culto."
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-black/18 dark:text-emerald-200"
                >
                  <NotebookPen size={15} />
                  Rever anotacoes
                </button>
                <button
                  type="button"
                  onClick={handlePrepareTestimonyPost}
                  title="Preparar um testemunho ou frase deste culto no feed da igreja."
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-black/18 dark:text-emerald-200"
                >
                  <MessageSquarePlus size={15} />
                  Escrever testemunho
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  title="Compartilhar ou copiar o link publico deste culto."
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-black/18 dark:text-emerald-200"
                >
                  <Share2 size={15} />
                  Compartilhar
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-white/75 p-4 dark:border-emerald-900/40 dark:bg-black/18">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Resumo pastoral</p>
                    <h3 className="mt-1 text-sm font-black text-gray-900 dark:text-white">Texto pronto para memoria, ata ou compartilhamento</h3>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleCopyRecap}
                      title="Copiar a recapitulacao textual deste culto."
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-200"
                    >
                      <Copy size={13} />
                      Copiar
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadRecap}
                      title="Baixar a recapitulacao textual deste culto."
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-200"
                    >
                      <Download size={13} />
                      Baixar
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPastoralReport}
                      disabled={exportingPastoralReport}
                      title="Exportar relatorio pastoral em CSV com metricas de participacao deste culto."
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#fff8e8] px-3 text-[10px] font-black uppercase tracking-widest text-[#8a6418] transition hover:bg-[#f3d28a]/30 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-950/20 dark:text-amber-200"
                    >
                      {exportingPastoralReport ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      Relatorio CSV
                    </button>
                  </div>
                </div>
                <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#f8fcfa] p-4 text-xs leading-relaxed text-gray-600 dark:bg-black/20 dark:text-gray-300">
                  {recapText}
                </pre>
              </div>

              <div className="mt-5 rounded-2xl border border-[#f3d28a]/40 bg-white/75 p-4 dark:border-amber-900/40 dark:bg-black/18">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#a87d22] dark:text-amber-200">Apoio pos-culto com IA</p>
                    <h3 className="mt-1 text-sm font-black text-gray-900 dark:text-white">Resumo, devocional e acompanhamento para a semana</h3>
                    <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Use como rascunho pastoral. Revise antes de publicar, ensinar ou enviar para grupos.
                    </p>
                  </div>
                  <Sparkles className="hidden text-[#a87d22] dark:text-amber-200 sm:block" size={20} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {POST_CULT_AI_ACTIONS.map((action) => {
                    const isLoadingAi = postCultAiLoadingKind === action.kind;
                    return (
                      <button
                        key={action.kind}
                        type="button"
                        onClick={() => handleGeneratePostCultAi(action.kind)}
                        disabled={postCultAiLoadingKind !== null}
                        title={`Gerar ${action.label.toLowerCase()} com IA.`}
                        className="flex min-h-24 flex-col items-start justify-center rounded-2xl border border-[#f3d28a]/40 bg-[#fff8e8] p-4 text-left transition hover:border-[#d8b15f] hover:bg-[#fdf2d3] disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
                      >
                        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8a6418] dark:text-amber-200">
                          {isLoadingAi ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                          {action.label}
                        </span>
                        <span className="mt-2 text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-300">{action.description}</span>
                      </button>
                    );
                  })}
                </div>

                {Object.keys(postCultAiContents).length > 0 && (
                  <div className="mt-4 space-y-3">
                    {POST_CULT_AI_ACTIONS.map((action) => {
                      const item = postCultAiContents[action.kind];
                      if (!item) return null;
                      return (
                        <article key={action.kind} className="rounded-2xl bg-[#f8fcfa] p-4 dark:bg-black/20">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#a87d22] dark:text-amber-200">{action.label}</p>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.content, `${action.label} copiado.`)}
                              title={`Copiar ${action.label.toLowerCase()} gerado pela IA.`}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-white px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-50 dark:bg-bible-darkPaper dark:text-emerald-200"
                            >
                              <Copy size={13} />
                              Copiar
                            </button>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">{item.content}</p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              {posts.length > 0 && (
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-white/75 p-4 dark:border-emerald-900/40 dark:bg-black/18">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Testemunhos e destaques</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {posts.slice(0, 3).map((post) => (
                      <article key={post.id} className="rounded-2xl bg-[#f8fcfa] p-4 dark:bg-black/20">
                        <p className="line-clamp-4 text-sm leading-relaxed text-gray-700 dark:text-gray-200">{post.content}</p>
                        <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{post.userDisplayName}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {nextService && (
                <Link
                  href={`/culto/${nextService.slug}`}
                  className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white/75 p-4 transition hover:border-[#f3d28a] hover:bg-white dark:border-emerald-900/40 dark:bg-black/18 dark:hover:bg-black/25 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Proximo culto</span>
                    <span className="mt-1 block text-sm font-black text-gray-900 dark:text-white">{nextService.title}</span>
                    <span className="mt-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{formatFullDate(nextService.startsAt)}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a87d22] dark:text-amber-200">
                    Abrir <ArrowRight size={14} />
                  </span>
                </Link>
              )}
            </div>
          )}

          {(experienceMode === 'during_with_live' || experienceMode === 'during_without_live' || liveState) && (
            <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-[#fff8e8] p-6 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-bible-darkPaper dark:to-amber-950/10">
              <div className="flex items-center gap-2">
                <Radio className="text-red-500" size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                  {experienceMode === 'during_with_live' ? 'Modo Culto Ao Vivo' : 'Culto presencial em andamento'}
                </p>
              </div>
              <h2 className="mt-2 text-xl font-black text-gray-900 dark:text-white">{liveState?.currentTitle || currentStep?.title || 'Acompanhando a liturgia'}</h2>
              {liveState?.currentVerseRef && <p className="mt-4 text-sm font-black text-gray-900 dark:text-white">{liveState.currentVerseRef}</p>}
              {liveState?.currentVerseText && <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-200">{liveState.currentVerseText}</p>}
              {currentStepNotes && <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{currentStepNotes}</p>}
              {nextStep && (
                <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-xs font-black uppercase tracking-widest text-emerald-800 dark:bg-black/20 dark:text-emerald-200">
                  Proximo momento: {nextStep.title}
                </p>
              )}
            </div>
          )}

          <div className={premiumCardClass}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white"><Sparkles className={premiumIconClass} /> Reacoes do culto</h2>
            <div className="grid grid-cols-3 gap-3">
              {REACTION_OPTIONS.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  title={`Registrar reacao: ${reaction.label}.`}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-3 py-4 text-center transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/10"
                >
                  <span className="block text-sm font-black text-gray-900 dark:text-white">{reaction.label}</span>
                  <span className="mt-1 block text-2xl font-black text-emerald-700 dark:text-emerald-300">{reactions[reaction.type]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={premiumCardClass}>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white"><Clock className={premiumIconClass} /> Timeline liturgica</h2>
            <div className="space-y-3">
              {experienceMoments.map((item) => {
                const isPastItem = item.momentStatus === 'completed';
                return (
                <div key={item.id} className={`rounded-2xl border p-4 transition-all duration-700 ${isPastItem ? 'opacity-45 saturate-50' : 'opacity-100'} ${item.momentStatus === 'current' ? 'border-emerald-300 bg-emerald-50 shadow-lg shadow-emerald-950/5 dark:border-emerald-800 dark:bg-emerald-950/20' : 'border-emerald-100 bg-[#f8fcfa] dark:border-emerald-900/40 dark:bg-emerald-950/10'}`}>
                  <div className="flex items-start gap-4">
                    <span className={`rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm transition-all duration-700 dark:bg-bible-darkPaper ${isPastItem ? 'text-gray-300 line-through dark:text-gray-600' : 'text-emerald-700 dark:text-emerald-300'}`}>{item.startsAt}</span>
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-white">{item.title}</h3>
                      {item.responsible && <p className="text-xs font-bold text-gray-400">Responsavel: {item.responsible}</p>}
                      {getPublicMomentNotes(item.notes) && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{getPublicMomentNotes(item.notes)}</p>}
                      {(item.leaderScript || item.prayerGuide || item.transitionText || item.scriptureReadingRef || item.scriptureReadingText || item.sermonPoints?.length) && (
                        <div className="mt-3 space-y-2 rounded-2xl border border-[#f3d28a]/40 bg-white/70 p-3 text-sm text-gray-600 dark:border-amber-900/30 dark:bg-bible-darkPaper/70 dark:text-gray-300">
                          {item.leaderScript && <p><span className="font-black text-[#8a6a2f] dark:text-[#f3d28a]">Fala:</span> {item.leaderScript}</p>}
                          {(item.scriptureReadingRef || item.scriptureReadingText) && (
                            <div>
                              {item.scriptureReadingRef && <p className="font-black text-emerald-800 dark:text-emerald-300">{item.scriptureReadingRef}</p>}
                              {item.scriptureReadingText && <p className="mt-1 font-serif italic leading-relaxed">"{item.scriptureReadingText}"</p>}
                            </div>
                          )}
                          {item.sermonPoints?.length ? (
                            <ul className="list-disc space-y-1 pl-5">
                              {item.sermonPoints.map((point, index) => <li key={`${item.id}_point_${index}`}>{point}</li>)}
                            </ul>
                          ) : null}
                          {item.prayerGuide && <p><span className="font-black text-[#8a6a2f] dark:text-[#f3d28a]">Oração:</span> {item.prayerGuide}</p>}
                          {item.transitionText && <p><span className="font-black text-[#8a6a2f] dark:text-[#f3d28a]">Transição:</span> {item.transitionText}</p>}
                        </div>
                      )}
                      {item.songList && (
                        <ul className="mt-2 space-y-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                          {item.songList.split('\n').filter(Boolean).map((song, index) => <li key={`${item.id}_song_${index}`}>- {song}</li>)}
                        </ul>
                      )}
                      {item.verseRef && <p className="mt-2 text-sm font-black text-emerald-800 dark:text-emerald-300">{item.verseRef}</p>}
                      {item.verseText && <p className="mt-1 font-serif text-sm italic leading-relaxed text-gray-600 dark:text-gray-300">"{item.verseText}"</p>}
                      {item.kind === 'offering' && item.pixKey && (
                        <div className="mt-3 rounded-xl border border-[#f3d28a]/50 bg-[#fff8e8] px-3 py-2 text-xs font-bold text-[#073b35] dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                          PIX {item.pixKeyType ? `(${item.pixKeyType})` : ''}: {item.pixKey}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          <div className={premiumCardClass}>
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white"><NotebookPen className={premiumIconClass} /> Minhas anotacoes</h2>
              <button onClick={() => setIsNotePanelOpen(true)} title="Abrir painel para escrever uma nova anotacao pessoal." className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300">
                <MessageSquarePlus size={14} />
                Nova anotacao
              </button>
            </div>
            {noteComments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center text-sm font-medium text-gray-400 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                Suas anotacoes do culto aparecerao aqui.
              </div>
            ) : (
              <div className="space-y-3">
                {noteComments.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-emerald-100 bg-[#f8fcfa] p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">{item.content}</p>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className={premiumCardClass}>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white"><MessageSquarePlus className={premiumIconClass} /> Feed do culto</h2>
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center text-sm font-medium text-gray-400 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                As postagens vinculadas a este culto aparecerao aqui.
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    showNotification={showNotification}
                    onInteraction={async (postId, type) => {
                      if (type === 'like') {
                        await dbService.togglePostLike(postId, userId || '', !post.likedBy?.includes(userId || ''));
                        setPosts(await cultoPlusService.getServicePosts(service.id));
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={premiumCardClass}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white"><HandHeart className={premiumIconClass} /> Pedidos de oracao</h2>
              <button
                type="button"
                onClick={() => setIsPrayerModalOpen(true)}
                title="Abrir popup para enviar um pedido de oracao."
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300"
              >
                <Send size={14} />
                Enviar pedido
              </button>
            </div>
            {publicPrayers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center text-sm font-medium text-gray-400 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                Nenhum pedido publico neste culto ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {publicPrayers.map((prayer) => (
                  <div key={prayer.id} className="rounded-2xl border border-emerald-100 bg-[#f8fcfa] p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-white dark:bg-bible-darkPaper">
                        {prayer.userPhotoURL ? <img src={prayer.userPhotoURL} alt={prayer.userName} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{prayer.userName}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{new Date(prayer.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{prayer.content}</p>
                    <button
                      onClick={() => handleIntercedePrayer(prayer)}
                      disabled={prayer.intercessedByMe}
                      title={prayer.intercessedByMe ? 'Voce ja marcou que esta orando por este pedido.' : 'Marcar que voce esta orando por este pedido.'}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:bg-bible-darkPaper dark:text-emerald-300"
                    >
                      <HandHeart size={13} />
                      {prayer.intercessedByMe ? 'Intercedendo' : 'Estou orando'} ({prayer.intercessorsCount})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className={premiumCardClass}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white"><MessageSquarePlus className={premiumIconClass} /> Postar no feed</h2>
            <textarea ref={postComposerRef} value={postContent} onChange={(event) => setPostContent(event.target.value)} title="Escreva uma mensagem para publicar no feed da igreja vinculada a este culto." placeholder="Compartilhe uma frase da pregacao, testemunho ou foto depois pelo feed..." className="min-h-32 w-full resize-none rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-emerald-900/40 dark:bg-emerald-950/10" />
            <button onClick={handleCreatePost} disabled={posting} title="Publicar esta mensagem no feed da igreja." className={`mt-3 w-full ${champagneButtonClass}`}>
              {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Publicar com a igreja
            </button>
          </div>

          {service.keyVerseRef && (
            <div className="rounded-[2rem] border border-[#f3d28a]/50 bg-gradient-to-br from-[#fff8e8] via-white to-emerald-50 p-6 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-bible-darkPaper dark:to-emerald-950/10">
              <h2 className="flex items-center gap-2 text-lg font-black text-[#073b35] dark:text-[#f3d28a]"><Heart size={18} /> Versiculo-chave</h2>
              <p className="mt-3 text-sm font-black text-gray-900 dark:text-white">{service.keyVerseRef}</p>
              {service.keyVerseText && <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{service.keyVerseText}</p>}
              <button onClick={handleSaveKeyVerse} disabled={savingVerse} title="Salvar este versiculo-chave na sua conta." className={`mt-4 w-full ${champagneButtonClass}`}>
                {savingVerse ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
                Salvar versiculo ({verseSavesCount})
              </button>
            </div>
          )}

        </aside>
      </section>

      {isPrayerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true" aria-labelledby="service-prayer-title" onClick={() => setIsPrayerModalOpen(false)}>
          <div className="w-full max-w-lg rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-2xl dark:border-emerald-900/40 dark:bg-bible-darkPaper" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="service-prayer-title" className="flex items-center gap-2 text-xl font-medium text-gray-900 dark:text-white">
                  <HandHeart className={premiumIconClass} />
                  Pedido de oracao
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">Compartilhe um pedido para intercessao neste culto.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrayerModalOpen(false)}
                title="Fechar janela de pedido de oracao."
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
                aria-label="Fechar pedido de oracao"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={prayerContent}
              onChange={(event) => setPrayerContent(event.target.value)}
              title="Escreva um pedido de oracao para este culto."
              placeholder="Compartilhe um pedido para intercessao..."
              className="min-h-32 w-full resize-none rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 text-sm leading-relaxed outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/10 dark:focus:ring-emerald-950/40"
            />
            <label className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <input type="checkbox" checked={isPrayerPrivate} onChange={(event) => setIsPrayerPrivate(event.target.checked)} title="Enviar este pedido somente de forma privada." className="h-4 w-4 rounded border-gray-300 text-emerald-700" />
              Enviar como privado
            </label>
            <button
              type="button"
              onClick={handleCreatePrayer}
              disabled={savingPrayer || !prayerContent.trim()}
              title="Enviar o pedido de oracao para este culto."
              className={`mt-4 w-full ${premiumButtonClass}`}
            >
              {savingPrayer ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar pedido
            </button>
          </div>
        </div>
      )}

      {isOfferingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true" aria-labelledby="service-offering-title" onClick={() => setIsOfferingModalOpen(false)}>
          <div className="w-full max-w-md rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-2xl dark:border-emerald-900/40 dark:bg-bible-darkPaper" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="service-offering-title" className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white"><Gift className={premiumIconClass} /> Ofertar</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">Contribua com liberdade e discernimento, como parte da sua adoracao.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOfferingModalOpen(false)}
                title="Fechar janela de oferta."
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
                aria-label="Fechar oferta"
              >
                <X size={18} />
              </button>
            </div>
            {offeringItem?.pixKey ? (
              <div className="rounded-2xl border border-[#f3d28a]/50 bg-[#fff8e8] p-4 text-[#073b35] dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
                <p className="text-[10px] font-medium uppercase tracking-widest opacity-70">Chave PIX {offeringItem.pixKeyType ? `(${offeringItem.pixKeyType})` : ''}</p>
                <p className="mt-2 break-all text-base font-medium">{offeringItem.pixKey}</p>
                {offeringItem.notes && <p className="mt-3 text-sm leading-relaxed opacity-75">{offeringItem.notes}</p>}
                <button
                  type="button"
                  onClick={() => copyToClipboard(offeringItem.pixKey ?? '', 'Chave PIX copiada.')}
                  title="Copiar a chave PIX da oferta."
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[10px] font-medium uppercase tracking-widest text-[#073b35] shadow-sm transition hover:bg-amber-50 dark:bg-bible-darkPaper dark:text-amber-100"
                >
                  <Copy size={14} />
                  Copiar chave
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center text-sm font-medium text-gray-500 dark:border-emerald-900/40 dark:bg-emerald-950/10 dark:text-gray-400">
                Oferta indisponivel neste culto.
              </div>
            )}
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true" aria-labelledby="service-invite-title" onClick={() => setIsInviteModalOpen(false)}>
          <div className="w-full max-w-md rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-2xl dark:border-emerald-900/40 dark:bg-bible-darkPaper" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="service-invite-title" className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white"><UserPlus className={premiumIconClass} /> Convidar alguem</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">Compartilhe o culto com alguem que pode ser edificado pela mensagem.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                title="Fechar janela de convite."
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
                aria-label="Fechar convite"
              >
                <X size={18} />
              </button>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                Venha participar do culto "{service.title}" na {service.churchName}. Tema: {service.theme}
              </p>
              <p className="mt-3 break-all text-xs font-medium text-emerald-700 dark:text-emerald-300">{inviteUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : '')}</p>
              {inviteToken && (
                <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Convite rastreavel criado
                </p>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={async () => {
                  const url = await getOrCreateInviteUrl('copy');
                  await copyToClipboard(`Venha participar do culto "${service.title}" na ${service.churchName}. ${url}`, 'Convite copiado.');
                }}
                disabled={creatingInvite}
                title="Copiar texto de convite com link rastreavel deste culto."
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 text-[10px] font-medium uppercase tracking-widest text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
              >
                {creatingInvite ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                Copiar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const url = await getOrCreateInviteUrl('share');
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: service.title, text: service.theme, url });
                      return;
                    }
                    await copyToClipboard(url, 'Link do convite copiado.');
                  } catch (error: any) {
                    if (error?.name !== 'AbortError') showNotification('Nao foi possivel compartilhar o convite.', 'error');
                  }
                }}
                disabled={creatingInvite}
                title="Compartilhar este culto usando as opcoes do dispositivo."
                className={champagneButtonClass}
              >
                {creatingInvite ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true" aria-labelledby="service-schedule-title" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-2xl dark:border-emerald-900/40 dark:bg-bible-darkPaper" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="service-schedule-title" className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white"><Users className={premiumIconClass} /> Escala do culto</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">Equipes e pessoas escaladas para servir neste culto.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                title="Fechar escala do culto."
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
                aria-label="Fechar escala do culto"
              >
                <X size={18} />
              </button>
            </div>

            {Object.keys(scheduleGroups).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(scheduleGroups).map(([teamName, assignments]) => (
                  <div key={teamName} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">{teamName}</h3>
                      <span className="w-fit rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:bg-bible-darkPaper dark:text-emerald-200">{assignments.length} pessoa(s)</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {assignments.map((assignment) => (
                        <div key={assignment.id} className="flex flex-col gap-1 rounded-xl bg-white p-3 text-sm dark:bg-bible-darkPaper sm:flex-row sm:items-center sm:justify-between">
                          <span className="min-w-0">
                            <span className="block font-black text-gray-900 dark:text-white">{assignment.userDisplayName}</span>
                            <span className="mt-0.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">{assignment.role || 'Funcao nao informada'}</span>
                          </span>
                          <span className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${SCHEDULE_STATUS_STYLES[assignment.status]}`}>
                            {SCHEDULE_STATUS_LABELS[assignment.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
                <Users className="mx-auto text-gray-300" size={30} />
                <h3 className="mt-3 text-base font-black text-gray-900 dark:text-white">Nenhuma escala publicada</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">Quando a equipe for escalada no Culto+, os nomes aparecerao aqui.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isQrModalOpen && checkinUrl && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true" aria-labelledby="service-qr-title" onClick={() => setIsQrModalOpen(false)}>
          <div className="w-full max-w-md rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-2xl dark:border-emerald-900/40 dark:bg-bible-darkPaper" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 id="service-qr-title" className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white"><QrCode className={premiumIconClass} /> QR de check-in</h2>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                title="Fechar janela do QR de check-in."
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
                aria-label="Fechar QR de check-in"
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkinUrl)}`}
              alt="QR Code de check-in do culto"
              className="mx-auto h-44 w-44 rounded-2xl border border-emerald-100 bg-white p-3"
              loading="lazy"
            />
            <p className="mt-4 text-center text-xs font-medium text-gray-400">Aponte a camera para abrir e iniciar o check-in.</p>
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=720x720&data=${encodeURIComponent(checkinUrl)}`}
              download={`qr-${service.slug}.png`}
              title="Baixar a imagem do QR Code para check-in."
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-[10px] font-medium uppercase tracking-widest text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            >
              <Download size={14} />
              Baixar QR
            </a>
          </div>
        </div>
      )}

      {isNotePanelOpen ? (
        <div className="fixed inset-x-4 bottom-20 z-[80] rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-2xl shadow-emerald-950/15 dark:border-emerald-900/60 dark:bg-bible-darkPaper md:inset-x-auto md:bottom-6 md:right-6 md:w-[430px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white"><NotebookPen className={premiumIconClass} /> Minhas anotacoes</h2>
            <button
              type="button"
              onClick={() => setIsNotePanelOpen(false)}
              title="Ocultar o campo de anotacao."
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
              aria-label="Ocultar campo de anotacao"
            >
              <X size={18} />
            </button>
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            title="Escreva uma anotacao pessoal sobre o culto."
            placeholder="Anote versiculos, frases da pregacao e aplicacoes praticas..."
            className="min-h-44 w-full resize-none rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-emerald-900/40 dark:bg-emerald-950/10"
          />
          <button onClick={handleSaveNote} disabled={savingNote || !note.trim()} title="Salvar sua anotacao pessoal deste culto." className={`mt-3 w-full ${premiumButtonClass}`}>
            {savingNote ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar anotacao
          </button>
        </div>
      ) : (
        <>
          <div className="fixed bottom-36 right-4 z-[80] flex flex-col items-end gap-2 md:bottom-24 md:right-6">
            {isReactionPanelOpen && (
              <div className="mb-1 grid gap-2 rounded-[1.5rem] border border-emerald-100 bg-white p-2 shadow-2xl shadow-emerald-950/15 dark:border-emerald-900/40 dark:bg-bible-darkPaper">
                {REACTION_OPTIONS.map((reaction) => (
                  <button
                    key={reaction.type}
                    type="button"
                    onClick={() => {
                      handleReaction(reaction.type);
                      setIsReactionPanelOpen(false);
                    }}
                    title={`Registrar reacao: ${reaction.label}.`}
                    className="inline-flex min-h-10 items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
                  >
                    {reaction.label}
                    <span className="rounded-full bg-white px-2 py-1 text-emerald-700 dark:bg-bible-darkPaper dark:text-emerald-300">{reactions[reaction.type]}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsReactionPanelOpen((isOpen) => !isOpen)}
              title="Abrir opcoes de reacao para este culto."
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#f3d28a] px-5 text-[10px] font-black uppercase tracking-widest text-[#073b35] shadow-2xl shadow-emerald-950/15 ring-4 ring-white transition hover:-translate-y-0.5 dark:ring-black"
              aria-label="Abrir reacoes do culto"
            >
              <Sparkles size={18} />
              Reagir
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsNotePanelOpen(true)}
            title="Abrir o campo para criar uma anotacao pessoal."
            className="fixed bottom-20 right-4 z-[80] inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl shadow-emerald-950/20 ring-4 ring-white transition hover:-translate-y-0.5 dark:ring-black md:bottom-6 md:right-6"
            aria-label="Abrir campo de anotacao"
          >
            <NotebookPen size={18} />
            Anotar
          </button>
        </>
      )}
    </main>
  );
};

export default CultoPlusOnePage;
