"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Archive, ArrowDown, ArrowUp, Bell, Bookmark, Brain, CalendarDays, CheckCircle2, Clock, Download, Edit2, Eye, ExternalLink, FileText, HandHeart, ImageIcon, Loader2, MessageSquare, NotebookPen, Plus, Quote, Radio, RefreshCw, Save, Search, Sparkles, Trash2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { bibleService } from '../../services/bibleService';
import { dbService, uploadBlob } from '../../services/supabase';
import { ChurchServiceStats, cultoPlusService } from '../../services/cultoPlusService';
import { generateDailyDevotional } from '../../services/pastorAgent';
import { ChurchService, ChurchServiceStatus, ChurchServiceType, ServiceAdvancedAnalytics, ServiceAiContentKind, ServiceCheckin, ServiceLiturgyItem, ServiceLiturgyKind, ServiceLiveState, ServiceMinistry, ServiceMinistryMember, ServiceReactionSummary, ServiceScheduleAssignment, UserProfile } from '../../types';
import CultoPlusCalendarView from './CultoPlusCalendarView';
import { getCalendarMonthRange } from '../../utils/cultoPlusCalendar';
import { isSafeLiveUrl } from '../../utils/cultoPlusOnePage';
import { isGeneralManager } from '../../utils/profileAccess';

type CultoPlusManagerProps = {
  initialMode?: 'list' | 'create';
  initialView?: 'list' | 'calendar';
  initialServiceId?: string | null;
  initialEdit?: boolean;
  pageTitle?: string;
  pageDescription?: string;
};

const SERVICE_TYPES: { value: ChurchServiceType; label: string }[] = [
  { value: 'sunday', label: 'Domingo' },
  { value: 'youth', label: 'Jovens' },
  { value: 'women', label: 'Mulheres' },
  { value: 'cell', label: 'Celula' },
  { value: 'conference', label: 'Conferencia' },
  { value: 'vigil', label: 'Vigilia' },
  { value: 'communion', label: 'Santa Ceia' },
  { value: 'other', label: 'Outro' },
];

const SERVICE_STATUS_OPTIONS: { value: ChurchServiceStatus; label: string }[] = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'checkin_open', label: 'Check-in aberto' },
  { value: 'live', label: 'Ao vivo' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'finished', label: 'Encerrado' },
];

const SERVICE_STATUS_LABELS: Record<ChurchServiceStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  checkin_open: 'Check-in aberto',
  live: 'Ao vivo',
  in_progress: 'Em andamento',
  finished: 'Encerrado',
  archived: 'Arquivado',
};

const SERVICE_STATUS_STYLES: Record<ChurchServiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800',
  checkin_open: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:ring-cyan-800',
  live: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800',
  finished: 'bg-white text-gray-500 ring-1 ring-gray-200 dark:bg-bible-darkPaper dark:text-gray-400 dark:ring-gray-800',
  archived: 'bg-gray-100 text-gray-400 dark:bg-gray-900 dark:text-gray-500',
};

type ServiceJourneyAction = {
  status: ChurchServiceStatus;
  label: string;
  title: string;
  className: string;
};

const getServiceJourneyActions = (service: ChurchService): ServiceJourneyAction[] => {
  if (service.status === 'archived') return [];
  const actions: ServiceJourneyAction[] = [];

  if (service.status === 'draft') {
    actions.push({
      status: 'published',
      label: 'Publicar',
      title: 'Publicar a OnePage deste culto.',
      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300',
    });
  }

  if (service.status === 'published' || service.status === 'draft') {
    actions.push({
      status: 'checkin_open',
      label: 'Abrir check-in',
      title: 'Liberar check-in antes do culto.',
      className: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-300',
    });
  }

  if (service.status === 'published' || service.status === 'checkin_open') {
    actions.push({
      status: 'in_progress',
      label: 'Iniciar presencial',
      title: 'Marcar culto em andamento sem transmissao ao vivo.',
      className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300',
    });
  }

  if ((service.status === 'published' || service.status === 'checkin_open' || service.status === 'in_progress') && service.liveUrl) {
    actions.push({
      status: 'live',
      label: 'Iniciar live',
      title: 'Marcar culto como ao vivo com transmissao.',
      className: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300',
    });
  }

  if (service.status === 'checkin_open' || service.status === 'in_progress' || service.status === 'live') {
    actions.push({
      status: 'finished',
      label: 'Encerrar',
      title: 'Encerrar o culto e liberar a recapitulação.',
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    });
  }

  if (service.status === 'finished') {
    actions.push({
      status: 'published',
      label: 'Reabrir',
      title: 'Voltar o culto para publicado.',
      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300',
    });
  }

  return actions.slice(0, 3);
};

const LITURGY_KIND_OPTIONS: { value: ServiceLiturgyKind; label: string }[] = [
  { value: 'entrance', label: 'Entrada / Recepcao' },
  { value: 'opening', label: 'Abertura' },
  { value: 'worship', label: 'Adoracao e Louvor' },
  { value: 'word', label: 'Leitura Biblica / Palavra' },
  { value: 'offering', label: 'Dizimos e Ofertas' },
  { value: 'prayer', label: 'Momento de Oracao' },
  { value: 'response', label: 'Resposta / Apelo' },
  { value: 'closing', label: 'Encerramento' },
  { value: 'other', label: 'Outro momento' },
];

const PIX_KEY_TYPES: { value: NonNullable<ServiceLiturgyItem['pixKeyType']>; label: string }[] = [
  { value: 'cpf', label: 'CPF' },
  { value: 'phone', label: 'Numero' },
  { value: 'email', label: 'E-mail' },
  { value: 'random', label: 'Chave aleatoria' },
];

const DEFAULT_LITURGY: { kind: ServiceLiturgyKind; title: string; startsAt: string }[] = [
  { kind: 'entrance', title: 'Liturgia de Entrada', startsAt: '18:45' },
  { kind: 'opening', title: 'Abertura', startsAt: '19:00' },
  { kind: 'worship', title: 'Adoracao e Louvor', startsAt: '19:15' },
  { kind: 'word', title: 'Liturgia da Palavra', startsAt: '19:50' },
  { kind: 'offering', title: 'Dizimo / Oferta / Resposta', startsAt: '20:35' },
  { kind: 'prayer', title: 'Momento de Oracao', startsAt: '20:45' },
  { kind: 'closing', title: 'Encerramento', startsAt: '20:55' },
];

const createDefaultLiturgy = (): ServiceLiturgyItem[] =>
  DEFAULT_LITURGY.map((item, index) => ({
    id: `draft_${item.kind}_${index}`,
    kind: item.kind,
    title: item.title,
    startsAt: item.startsAt,
    responsible: '',
    notes: '',
    sortOrder: index,
  }));

const todayAt = (time: string) => {
  const date = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours ?? 19, minutes ?? 0, 0, 0);
  return date.toISOString().slice(0, 16);
};

const toDateTimeLocal = (value: string) => {
  try {
    const date = new Date(value);
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  } catch {
    return value;
  }
};

const getDatePart = (value: string) => value?.slice(0, 10) || new Date().toISOString().slice(0, 10);
const getTimePart = (value: string, fallback: string) => value?.slice(11, 16) || fallback;
const buildDateTimeLocal = (date: string, time: string) => `${date}T${time || '00:00'}`;
const normalizeTime24h = (value: string, fallback: string) => {
  const clean = value.replace(/[^\d:]/g, '').slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(clean)) {
    const [hours, minutes] = clean.split(':').map(Number);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) return clean;
  }
  if (/^\d{4}$/.test(clean)) {
    const hours = Number(clean.slice(0, 2));
    const minutes = Number(clean.slice(2, 4));
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) return `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
  }
  return fallback;
};
const maskTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const minutes = index * 15;
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
});
const getSongItems = (item: ServiceLiturgyItem) => item.songList?.split('\n') ?? [];

const buildPlannedLiturgyItems = (
  plannedItems: Array<Partial<ServiceLiturgyItem>> = [],
): ServiceLiturgyItem[] => {
  const fallbackTimes = ['18:45', '19:00', '19:15', '19:50', '20:35', '20:45', '20:55'];
  const normalizedItems = plannedItems
    .filter((item) => item.title || item.notes || item.kind)
    .map((item, index) => ({
      id: `ai_plan_${item.kind || 'other'}_${Date.now()}_${index}`,
      kind: item.kind || 'other',
      title: item.title || 'Novo momento',
      startsAt: item.startsAt || fallbackTimes[index] || fallbackTimes.at(-1) || '21:00',
      responsible: item.responsible || '',
      notes: item.notes || '',
      verseRef: item.verseRef,
      verseText: item.verseText,
      scriptureReadingRef: item.scriptureReadingRef,
      scriptureReadingText: item.scriptureReadingText,
      leaderScript: item.leaderScript,
      prayerGuide: item.prayerGuide,
      transitionText: item.transitionText,
      sermonPoints: item.sermonPoints,
      songList: item.songList,
      pixKeyType: item.pixKeyType,
      pixKey: item.pixKey,
      sortOrder: index,
    } as ServiceLiturgyItem));

  return normalizedItems.length ? normalizedItems : createDefaultLiturgy();
};

const formatServiceDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const SCHEDULE_STATUS_LABELS: Record<ServiceScheduleAssignment['status'], string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  declined: 'Recusado',
  replaced: 'Substituido',
};

const SCHEDULE_STATUS_STYLES: Record<ServiceScheduleAssignment['status'], string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-200',
  declined: 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-200',
  replaced: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200',
};

const SCHEDULE_STATUS_ORDER: Record<ServiceScheduleAssignment['status'], number> = {
  pending: 0,
  declined: 1,
  confirmed: 2,
  replaced: 3,
};

const sortScheduleAssignments = (assignments: ServiceScheduleAssignment[]) =>
  [...assignments].sort((a, b) => {
    const statusDiff = SCHEDULE_STATUS_ORDER[a.status] - SCHEDULE_STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return (a.ministryName || '').localeCompare(b.ministryName || '') || (a.userDisplayName || '').localeCompare(b.userDisplayName || '');
  });

const MEMBER_AI_ACTIONS: { kind: ServiceAiContentKind; label: string }[] = [
  { kind: 'member_summary', label: 'Resumo' },
  { kind: 'member_devotional', label: 'Devocional' },
  { kind: 'member_prayer', label: 'Oracao' },
  { kind: 'member_weekly_plan', label: 'Plano semanal' },
  { kind: 'member_reflection_questions', label: 'Perguntas' },
];

const PASTOR_AI_ACTIONS: { kind: ServiceAiContentKind; label: string }[] = [
  { kind: 'pastor_structure', label: 'Estrutura' },
  { kind: 'pastor_liturgy', label: 'Liturgia' },
  { kind: 'pastor_verses', label: 'Versiculos' },
  { kind: 'pastor_duration', label: 'Duracao' },
  { kind: 'pastor_post_summary', label: 'Pos-culto' },
];

const statsFromServiceRow = (service: ChurchService): ChurchServiceStats => ({
  visitorsCount: 0,
  checkinsCount: service.checkinsCount ?? 0,
  postsCount: service.postsCount ?? 0,
  notesCount: 0,
  prayersCount: 0,
  verseSavesCount: 0,
});

const buildAdvancedAnalytics = (
  stats: ChurchServiceStats,
  reactions: ServiceReactionSummary,
  schedules: ServiceScheduleAssignment[],
): ServiceAdvancedAnalytics => {
  const reactionsCount = reactions.amen + reactions.glory + reactions.hallelujah;
  const engagementActions = stats.checkinsCount + stats.postsCount + stats.notesCount + stats.prayersCount + stats.verseSavesCount + reactionsCount;
  return {
    ...stats,
    reactionsCount,
    schedulesCount: schedules.length,
    pendingSchedulesCount: schedules.filter((item) => item.status === 'pending').length,
    engagementRate: stats.visitorsCount > 0 ? Math.round((engagementActions / stats.visitorsCount) * 100) : 0,
  };
};

const getCachedDailyVerse = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = window.localStorage.getItem('devotional_cache');
    if (!cached) return null;
    const devotional = JSON.parse(cached);
    if (!devotional?.verseReference || !devotional?.verseText) return null;
    return {
      verseReference: devotional.verseReference as string,
      verseText: devotional.verseText as string,
      title: devotional.title as string | undefined,
    };
  } catch {
    return null;
  }
};

const CultoPlusManager: React.FC<CultoPlusManagerProps> = ({
  initialMode = 'list',
  initialView = 'list',
  initialServiceId = null,
  initialEdit = false,
  pageTitle = 'Acompanhamento de Culto',
  pageDescription = 'Crie a timeline liturgica, publique uma OnePage e acompanhe check-ins, anotacoes e postagens ligadas a igreja.',
}) => {
  const { currentUser, userProfile, showNotification, recordActivity, checkFeatureAccess, incrementUsage } = useAuth();
  const { settings } = useSettings();
  const churchData = userProfile?.churchData;
  const [services, setServices] = useState<ChurchService[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(initialMode === 'create');
  const [serviceView, setServiceView] = useState<'list' | 'calendar'>(initialView);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [serviceStats, setServiceStats] = useState<Record<string, ChurchServiceStats>>({});
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedCheckins, setSelectedCheckins] = useState<ServiceCheckin[]>([]);
  const [ministries, setMinistries] = useState<ServiceMinistry[]>([]);
  const [ministryMembers, setMinistryMembers] = useState<ServiceMinistryMember[]>([]);
  const [scheduleAssignments, setScheduleAssignments] = useState<ServiceScheduleAssignment[]>([]);
  const [churchMembers, setChurchMembers] = useState<UserProfile[]>([]);
  const [liveState, setLiveState] = useState<ServiceLiveState | null>(null);
  const [syncingLiveItemId, setSyncingLiveItemId] = useState<string | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<ServiceAdvancedAnalytics | null>(null);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [aiLoadingKind, setAiLoadingKind] = useState<ServiceAiContentKind | null>(null);
  const [aiOutput, setAiOutput] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [searchingKeyVerse, setSearchingKeyVerse] = useState(false);
  const [keyVerseSearchState, setKeyVerseSearchState] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [servicePlanningPrompt, setServicePlanningPrompt] = useState('');
  const [generatingServicePlan, setGeneratingServicePlan] = useState(false);
  const [servicePlanningFocus, setServicePlanningFocus] = useState('');
  const [newMinistryName, setNewMinistryName] = useState('');
  const [newMinistryDescription, setNewMinistryDescription] = useState('');
  const [selectedMinistryId, setSelectedMinistryId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [ministryRole, setMinistryRole] = useState('');
  const [scheduleMinistryId, setScheduleMinistryId] = useState('');
  const [scheduleMemberId, setScheduleMemberId] = useState('');
  const [scheduleRole, setScheduleRole] = useState('');
  const [replacementMemberByAssignment, setReplacementMemberByAssignment] = useState<Record<string, string>>({});
  const [liveVerseRef, setLiveVerseRef] = useState('');
  const [liveVerseText, setLiveVerseText] = useState('');
  const [liveExplanation, setLiveExplanation] = useState('');
  const [serviceLimit, setServiceLimit] = useState<{ allowed: boolean; used: number; limit: number | null }>({ allowed: true, used: 0, limit: null });
  const [isCurrentChurchManager, setIsCurrentChurchManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyVerseSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title, setTitle] = useState('Culto de Celebracao');
  const [theme, setTheme] = useState('');
  const [preacherName, setPreacherName] = useState(userProfile?.displayName ?? '');
  const [serviceType, setServiceType] = useState<ChurchServiceType>('sunday');
  const [status, setStatus] = useState<ChurchServiceStatus>('published');
  const [startsAt, setStartsAt] = useState(todayAt('19:00'));
  const [endsAt, setEndsAt] = useState(todayAt('21:00'));
  const [keyVerseRef, setKeyVerseRef] = useState('');
  const [keyVerseText, setKeyVerseText] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [liturgyItems, setLiturgyItems] = useState<ServiceLiturgyItem[]>(createDefaultLiturgy);

  const canCreate = Boolean(currentUser && churchData?.churchId);
  const planMatrix = cultoPlusService.getPlanMatrix(userProfile?.subscriptionTier ?? 'free');
  const canUsePastoralAiFeatures = checkFeatureAccess('aiSermonBuilder') || isGeneralManager(userProfile) || isCurrentChurchManager;
  const serviceDate = getDatePart(startsAt);
  const serviceStartTime = getTimePart(startsAt, '19:00');
  const serviceEndTime = getTimePart(endsAt, '21:00');
  const calendarRange = useMemo(() => getCalendarMonthRange(calendarDate), [calendarDate]);
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  );
  const sortedScheduleAssignments = useMemo(() => sortScheduleAssignments(scheduleAssignments), [scheduleAssignments]);
  const scheduleSummary = useMemo(() => ({
    pending: scheduleAssignments.filter((item) => item.status === 'pending').length,
    confirmed: scheduleAssignments.filter((item) => item.status === 'confirmed').length,
    declined: scheduleAssignments.filter((item) => item.status === 'declined').length,
    replaced: scheduleAssignments.filter((item) => item.status === 'replaced').length,
  }), [scheduleAssignments]);
  const liveLiturgyItems = selectedService?.liturgyItems ?? [];
  const liveCurrentIndex = Math.max(0, liveLiturgyItems.findIndex((item) => item.id === liveState?.currentItemId));
  const liveCurrentItem = liveLiturgyItems[liveCurrentIndex] ?? liveLiturgyItems[0] ?? null;
  const liveNextItem = liveLiturgyItems[liveCurrentIndex + 1] ?? null;
  const liveProgress = liveLiturgyItems.length > 0 ? Math.round(((liveCurrentIndex + 1) / liveLiturgyItems.length) * 100) : 0;

  useEffect(() => {
    const loadServices = async () => {
      if (!churchData?.churchId) return;
      setLoading(true);
      try {
        const [loaded, loadedMinistries, loadedMinistryMembers, loadedChurchMembers] = await Promise.all([
          serviceView === 'calendar'
            ? cultoPlusService.getServicesByChurchRange(churchData.churchId, {
              startDate: calendarRange.startDate,
              endDate: calendarRange.endDate,
              includeDrafts: true,
              limit: 120,
            })
            : cultoPlusService.getServicesByChurch(churchData.churchId, { includeDrafts: true, limit: 20 }),
          cultoPlusService.getMinistriesByChurch(churchData.churchId),
          cultoPlusService.getMinistryMembers(churchData.churchId),
          dbService.getChurchMembers(churchData.churchId).catch(() => []),
        ]);
        cultoPlusService.canCreateServiceForChurch(churchData.churchId, userProfile?.subscriptionTier ?? 'free').then(setServiceLimit).catch(() => {});
        setServices(loaded);
        setMinistries(loadedMinistries);
        setMinistryMembers(loadedMinistryMembers);
        setChurchMembers(loadedChurchMembers);
        // MVP barato: a lista usa contadores ja cacheados em church_services.
        // Estatisticas completas so sao carregadas quando o gestor abre um culto.
        setServiceStats(Object.fromEntries(loaded.map((service) => [service.id, statsFromServiceRow(service)])));
      } catch {
        showNotification('Nao foi possivel carregar os cultos.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, [churchData?.churchId, showNotification, serviceView, calendarRange.startDate, calendarRange.endDate, userProfile?.subscriptionTier]);

  useEffect(() => {
    let cancelled = false;

    const loadChurchManagerStatus = async () => {
      const currentUserId = currentUser?.uid ?? currentUser?.id;
      if (!currentUserId || !churchData?.churchId) {
        setIsCurrentChurchManager(false);
        return;
      }

      if (isGeneralManager(userProfile)) {
        setIsCurrentChurchManager(true);
        return;
      }

      const isManager = await dbService.isUserChurchManager(currentUserId, churchData.churchId);
      if (!cancelled) setIsCurrentChurchManager(isManager);
    };

    loadChurchManagerStatus();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid, currentUser?.id, churchData?.churchId, userProfile?.profileType, userProfile?.subscriptionTier]);

  useEffect(() => {
    if (!initialServiceId || services.length === 0) return;
    const service = services.find((item) => item.id === initialServiceId);
    if (!service) return;
    if (initialEdit) {
      startEdit(service);
      setSelectedServiceId(null);
      return;
    }
    void openServicePanel(service);
  }, [initialEdit, initialServiceId, services]);

  useEffect(() => {
    if (keyVerseSearchTimeoutRef.current) clearTimeout(keyVerseSearchTimeoutRef.current);

    if (keyVerseRef.trim().length <= 3) {
      setSearchingKeyVerse(false);
      setKeyVerseSearchState('idle');
      return;
    }

    keyVerseSearchTimeoutRef.current = setTimeout(async () => {
      setSearchingKeyVerse(true);
      try {
        const result = await bibleService.getTextByReference(keyVerseRef, settings.bibleVersion || 'ara');
        if (result) {
          setKeyVerseText(result.text);
          setKeyVerseSearchState('found');
          if (result.formattedRef !== keyVerseRef) setKeyVerseRef(result.formattedRef);
        } else {
          setKeyVerseSearchState('not_found');
        }
      } finally {
        setSearchingKeyVerse(false);
      }
    }, 700);

    return () => {
      if (keyVerseSearchTimeoutRef.current) clearTimeout(keyVerseSearchTimeoutRef.current);
    };
  }, [keyVerseRef, settings.bibleVersion]);

  const liturgySummary = useMemo(
    () => liturgyItems.filter((item) => item.title.trim()).map((item) => item.title).join(' -> '),
    [liturgyItems],
  );

  const updateLiturgyItem = (id: string, updates: Partial<ServiceLiturgyItem>) => {
    setLiturgyItems((items) => items.map((item) => item.id === id ? { ...item, ...updates } : item));
  };

  const addLiturgyItem = () => {
    setLiturgyItems((items) => [
      ...items,
      {
        id: `draft_other_${Date.now()}`,
        kind: 'other',
        title: 'Novo momento',
        startsAt: items.at(-1)?.startsAt ?? '21:00',
        responsible: '',
        notes: '',
        sortOrder: items.length,
      },
    ]);
  };

  const removeLiturgyItem = (id: string) => {
    setLiturgyItems((items) => {
      if (items.length <= 1) return items;
      return items
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, sortOrder: index }));
    });
  };

  const updateSongItem = (id: string, index: number, value: string) => {
    setLiturgyItems((items) => items.map((item) => {
      if (item.id !== id) return item;
      const songs = getSongItems(item);
      songs[index] = value;
      return { ...item, songList: songs.join('\n') };
    }));
  };

  const addSongItem = (id: string) => {
    setLiturgyItems((items) => items.map((item) => item.id === id
      ? { ...item, songList: [...getSongItems(item), ''].join('\n') }
      : item));
  };

  const removeSongItem = (id: string, index: number) => {
    setLiturgyItems((items) => items.map((item) => {
      if (item.id !== id) return item;
      const songs = getSongItems(item).filter((_, songIndex) => songIndex !== index);
      return { ...item, songList: songs.join('\n') };
    }));
  };

  const moveLiturgyItem = (id: string, direction: -1 | 1) => {
    setLiturgyItems((items) => {
      const index = items.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
      const next = [...items];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next.map((entry, sortOrder) => ({ ...entry, sortOrder }));
    });
  };

  const resetForm = () => {
    setEditingServiceId(null);
    setTitle('Culto de Celebracao');
    setTheme('');
    setPreacherName(userProfile?.displayName ?? '');
    setServiceType('sunday');
    setStatus('published');
    setStartsAt(todayAt('19:00'));
    setEndsAt(todayAt('21:00'));
    setKeyVerseRef('');
    setKeyVerseText('');
    setKeyVerseSearchState('idle');
    setServicePlanningFocus('');
    setBannerUrl('');
    setLiveUrl('');
    setLiturgyItems(createDefaultLiturgy());
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startCreateAtDate = (date: Date) => {
    resetForm();
    const nextStart = new Date(date);
    nextStart.setHours(19, 0, 0, 0);
    const nextEnd = new Date(date);
    nextEnd.setHours(21, 0, 0, 0);
    setStartsAt(toDateTimeLocal(nextStart.toISOString()));
    setEndsAt(toDateTimeLocal(nextEnd.toISOString()));
    setShowForm(true);
  };

  const startEdit = (service: ChurchService) => {
    setEditingServiceId(service.id);
    setTitle(service.title);
    setTheme(service.theme);
    setPreacherName(service.preacherName);
    setServiceType(service.serviceType);
    setStatus(service.status);
    setStartsAt(toDateTimeLocal(service.startsAt));
    setEndsAt(toDateTimeLocal(service.endsAt));
    setKeyVerseRef(service.keyVerseRef ?? '');
    setKeyVerseText(service.keyVerseText ?? '');
    setKeyVerseSearchState(service.keyVerseText ? 'found' : 'idle');
    setBannerUrl(service.bannerUrl ?? '');
    setLiveUrl(service.liveUrl ?? '');
    setLiturgyItems(service.liturgyItems.length ? service.liturgyItems : createDefaultLiturgy());
    setShowForm(true);
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;
    setUploadingBanner(true);
    try {
      const url = await uploadBlob(file, `church_services/${currentUser.uid ?? currentUser.id}/${Date.now()}_${file.name}`);
      setBannerUrl(url);
      showNotification('Banner enviado.', 'success');
    } catch {
      showNotification('Nao foi possivel enviar o banner.', 'error');
    } finally {
      setUploadingBanner(false);
      event.target.value = '';
    }
  };

  const openServicePanel = async (service: ChurchService) => {
    setSelectedServiceId(service.id);
    setLoadingPanel(true);
    try {
      const [stats, checkins, assignments, live, reactions] = await Promise.all([
        cultoPlusService.getServiceStats(service.id),
        cultoPlusService.getServiceCheckins(service.id),
        cultoPlusService.getScheduleAssignments(service.id),
        cultoPlusService.getLiveState(service.id),
        cultoPlusService.getReactionSummary(service.id),
      ]);
      const analytics = buildAdvancedAnalytics(stats, reactions, assignments);
      setServiceStats((current) => ({ ...current, [service.id]: stats }));
      setSelectedCheckins(checkins);
      setScheduleAssignments(assignments);
      setLiveState(live);
      setAdvancedAnalytics(analytics);
      setLiveVerseRef(live?.currentVerseRef ?? service.keyVerseRef ?? '');
      setLiveVerseText(live?.currentVerseText ?? service.keyVerseText ?? '');
      setLiveExplanation(live?.currentExplanation ?? '');
    } finally {
      setLoadingPanel(false);
    }
  };

  const createMinistry = async () => {
    if (!churchData?.churchId || !currentUser || !newMinistryName.trim()) return;
    try {
      const ministry = await cultoPlusService.createMinistry(
        churchData.churchId,
        currentUser.uid ?? currentUser.id,
        newMinistryName.trim(),
        newMinistryDescription.trim(),
      );
      setMinistries((items) => [ministry, ...items.filter((item) => item.id !== ministry.id)]);
      setNewMinistryName('');
      setNewMinistryDescription('');
      setSelectedMinistryId(ministry.id);
      setScheduleMinistryId(ministry.id);
      showNotification('Ministerio criado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel criar o ministerio.', 'error');
    }
  };

  const addMemberToMinistry = async () => {
    const ministry = ministries.find((item) => item.id === selectedMinistryId);
    const member = churchMembers.find((item) => item.uid === selectedMemberId);
    if (!ministry || !member) {
      showNotification('Selecione o ministerio e o membro.', 'warning');
      return;
    }
    try {
      const entry = await cultoPlusService.addMinistryMember(ministry, member, ministryRole.trim());
      setMinistryMembers((items) => [entry, ...items.filter((item) => !(item.ministryId === ministry.id && item.userId === member.uid))]);
      setSelectedMemberId('');
      setMinistryRole('');
      showNotification('Membro vinculado ao ministerio.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel vincular o membro.', 'error');
    }
  };

  const createScheduleAssignment = async () => {
    if (!selectedService) return;
    const ministry = ministries.find((item) => item.id === scheduleMinistryId);
    const member = churchMembers.find((item) => item.uid === scheduleMemberId);
    if (!ministry || !member) {
      showNotification('Selecione o ministerio e o membro da escala.', 'warning');
      return;
    }
    try {
      const assignment = await cultoPlusService.createScheduleAssignment(selectedService, ministry, member, scheduleRole.trim());
      setScheduleAssignments((items) => [assignment, ...items.filter((item) => !(item.serviceId === selectedService.id && item.ministryId === ministry.id && item.userId === member.uid))]);
      setScheduleMemberId('');
      setScheduleRole('');
      showNotification('Escala criada para o culto.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel criar a escala.', 'error');
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: ServiceScheduleAssignment['status']) => {
    try {
      await cultoPlusService.updateScheduleAssignmentStatus(assignmentId, status);
      setScheduleAssignments((items) => items.map((item) => item.id === assignmentId ? { ...item, status, updatedAt: new Date().toISOString() } : item));
      showNotification('Status da escala atualizado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel atualizar a escala.', 'error');
    }
  };

  const markReminderSent = async (assignmentId: string) => {
    try {
      await cultoPlusService.markScheduleReminderSent(assignmentId);
      const reminderSentAt = new Date().toISOString();
      setScheduleAssignments((items) => items.map((item) => item.id === assignmentId ? { ...item, reminderSentAt, updatedAt: reminderSentAt } : item));
      showNotification('Lembrete registrado na escala.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel registrar o lembrete.', 'error');
    }
  };

  const replaceAssignment = async (assignmentId: string) => {
    const replacementId = replacementMemberByAssignment[assignmentId];
    const replacement = churchMembers.find((item) => item.uid === replacementId);
    if (!replacement) {
      showNotification('Selecione o substituto.', 'warning');
      return;
    }
    try {
      await cultoPlusService.replaceScheduleAssignment(assignmentId, replacement);
      setScheduleAssignments((items) => items.map((item) => item.id === assignmentId ? {
        ...item,
        status: 'replaced',
        replacementUserId: replacement.uid,
        replacementUserDisplayName: replacement.displayName,
        updatedAt: new Date().toISOString(),
      } : item));
      setReplacementMemberByAssignment((current) => ({ ...current, [assignmentId]: '' }));
      showNotification('Substituicao registrada.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel substituir a escala.', 'error');
    }
  };

  const pushLiveStep = async (item: ServiceLiturgyItem) => {
    if (!selectedService || !currentUser) return;
    setSyncingLiveItemId(item.id);
    try {
      const next = await cultoPlusService.updateLiveState(selectedService, currentUser.uid ?? currentUser.id, {
        currentItemId: item.id,
        currentTitle: item.title,
        currentVerseRef: liveVerseRef.trim() || selectedService.keyVerseRef || null,
        currentVerseText: liveVerseText.trim() || selectedService.keyVerseText || null,
        currentExplanation: liveExplanation.trim() || item.notes || null,
      });
      setLiveState(next);
      if (selectedService.status !== 'live') {
        await cultoPlusService.updateService(selectedService.id, { status: 'live' });
        setServices((items) => items.map((service) => service.id === selectedService.id ? { ...service, status: 'live' } : service));
      }
      showNotification('Momento ao vivo sincronizado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel sincronizar o culto.', 'error');
    } finally {
      setSyncingLiveItemId(null);
    }
  };

  const resolveKeyVerseForAction = async () => {
    let verseReference = keyVerseRef.trim();
    let verseText = keyVerseText.trim();

    if (verseReference && (!verseText || keyVerseSearchState !== 'found')) {
      setSearchingKeyVerse(true);
      try {
        const result = await bibleService.getTextByReference(verseReference, settings.bibleVersion || 'ara');
        if (result) {
          verseReference = result.formattedRef || verseReference;
          verseText = result.text || verseText;
          setKeyVerseRef(verseReference);
          setKeyVerseText(verseText);
          setKeyVerseSearchState('found');
        }
      } finally {
        setSearchingKeyVerse(false);
      }
    }

    return { verseReference, verseText };
  };

  const prepareLiveStep = (item: ServiceLiturgyItem) => {
    setLiveVerseRef(item.verseRef || selectedService?.keyVerseRef || liveVerseRef);
    setLiveVerseText(item.verseText || selectedService?.keyVerseText || liveVerseText);
    setLiveExplanation(item.notes || liveExplanation);
  };

  const generateAiContent = async (kind: ServiceAiContentKind) => {
    if (!selectedService || !currentUser) return;
    if (!canUsePastoralAiFeatures) {
      showNotification('IA do Culto+ e recurso premium.', 'warning');
      return;
    }
    setAiLoadingKind(kind);
    try {
      const result = await cultoPlusService.generateAiContent(kind, selectedService, currentUser.uid ?? currentUser.id, liveExplanation);
      setAiOutput(result.content);
      await incrementUsage('analysis');
      showNotification('Conteudo gerado com IA.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel gerar com IA.', 'error');
    } finally {
      setAiLoadingKind(null);
    }
  };

  const generateServicePlanFromAi = async () => {
    if (!currentUser) return;
    if (!canUsePastoralAiFeatures) {
      showNotification('Planejamento com IA esta disponivel para perfis Pastor/Gestor ou planos com recursos pastorais.', 'warning');
      return;
    }

    setGeneratingServicePlan(true);
    try {
      let { verseReference, verseText } = await resolveKeyVerseForAction();

      if (!verseReference || !verseText) {
        const cached = getCachedDailyVerse();
        const dailyVerse = cached ?? await generateDailyDevotional(false);
        verseReference = dailyVerse?.verseReference || '';
        verseText = dailyVerse?.verseText || '';
        if (verseReference && verseText) {
          setKeyVerseRef(verseReference);
          setKeyVerseText(verseText);
          setKeyVerseSearchState('found');
        }
      }

      if (!verseReference || !verseText) {
        showNotification('Informe um versiculo-chave ou tente novamente para usar o versiculo do dia.', 'warning');
        return;
      }

      const suggestion = await cultoPlusService.generateServicePlanning({
        verseReference,
        verseText,
        userPrompt: servicePlanningPrompt.trim(),
      });

      if (suggestion.title) setTitle(suggestion.title);
      if (suggestion.theme) setTheme(suggestion.theme);
      if (suggestion.serviceType) setServiceType(suggestion.serviceType);
      setServicePlanningFocus(suggestion.pastoralFocus ?? '');

      if (suggestion.liturgyItems?.length) {
        setLiturgyItems(buildPlannedLiturgyItems(suggestion.liturgyItems));
      }

      await incrementUsage('analysis');
      showNotification('Planejamento do culto aplicado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel gerar o planejamento.', 'error');
    } finally {
      setGeneratingServicePlan(false);
    }
  };

  const exportSelectedService = async () => {
    if (!selectedService) return;
    try {
      const csv = await cultoPlusService.exportServiceReport(selectedService);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `culto-plus-${selectedService.slug}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showNotification('Relatorio exportado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel exportar.', 'error');
    }
  };

  const archiveService = async (service: ChurchService) => {
    if (!window.confirm(`Arquivar "${service.title}"?`)) return;
    await cultoPlusService.archiveService(service.id);
    setServices((items) => items.filter((item) => item.id !== service.id));
    if (selectedServiceId === service.id) setSelectedServiceId(null);
    showNotification('Culto arquivado.', 'info');
  };

  const updateServiceJourneyStatus = async (service: ChurchService, nextStatus: ChurchServiceStatus) => {
    try {
      await cultoPlusService.updateService(service.id, { status: nextStatus });
      const updatedAt = new Date().toISOString();
      setServices((items) => items.map((item) => item.id === service.id ? { ...item, status: nextStatus, updatedAt } : item));
      showNotification(`Culto marcado como ${SERVICE_STATUS_LABELS[nextStatus].toLowerCase()}.`, 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel atualizar o estado do culto.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !userProfile || !churchData?.churchId) {
      showNotification('Vincule seu perfil a uma igreja para criar cultos.', 'warning');
      return;
    }
    if (!title.trim() || !theme.trim()) {
      showNotification('Informe o nome do culto e o tema.', 'warning');
      return;
    }
    if (!isSafeLiveUrl(liveUrl)) {
      showNotification('Informe um link HTTPS valido para a live.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const { verseReference, verseText } = await resolveKeyVerseForAction();
      const payload = {
        title: title.trim(),
        theme: theme.trim(),
        preacherName: preacherName.trim() || userProfile.displayName,
        serviceType,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        keyVerseRef: verseReference || undefined,
        keyVerseText: verseText || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        liveUrl: liveUrl.trim(),
        status,
        liturgyItems,
      };

      if (editingServiceId) {
        await cultoPlusService.updateService(editingServiceId, payload);
        setServices((items) => items.map((item) => item.id === editingServiceId ? {
          ...item,
          ...payload,
          updatedAt: new Date().toISOString(),
        } : item));
        await recordActivity('create_sermon', `Atualizou Culto+: ${payload.title}`, { serviceId: editingServiceId });
        showNotification('Culto atualizado.', 'success');
        setShowForm(false);
        resetForm();
        return;
      }

      const limitState = await cultoPlusService.canCreateServiceForChurch(churchData.churchId, userProfile.subscriptionTier ?? 'free');
      setServiceLimit(limitState);
      if (!limitState.allowed) {
        showNotification(`Limite do plano ${planMatrix.label}: ${limitState.used}/${limitState.limit} cultos neste mes.`, 'warning');
        return;
      }

      const service = await cultoPlusService.createService({
        churchId: churchData.churchId,
        churchName: churchData.churchName,
        churchSlug: churchData.churchSlug,
        ...payload,
        createdBy: currentUser.uid ?? currentUser.id,
      });
      setServiceLimit((current) => ({ ...current, used: current.used + 1, allowed: current.limit === null || current.used + 1 < current.limit }));
      setServices((items) => [service, ...items]);
      setShowForm(false);
      resetForm();
      await recordActivity('create_sermon', `Criou Culto+: ${service.title}`, { serviceId: service.id });
      showNotification('Culto criado e OnePage publicada.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Nao foi possivel criar o culto.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-amber-100 bg-white p-6 shadow-sm dark:border-amber-900/30 dark:bg-bible-darkPaper md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bible-gold">Culto+</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white">
            <Radio className="text-bible-gold" />
            {pageTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {pageDescription}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {showForm && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              title={editingServiceId ? 'Salvar as alteracoes deste culto.' : 'Publicar a OnePage deste culto.'}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:ring-emerald-900/40"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingServiceId ? 'Salvar alteracoes' : 'Publicar OnePage'}
            </button>
          )}
          <button
            onClick={() => showForm ? setShowForm(false) : startCreate()}
            disabled={!canCreate}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:ring-emerald-900/40"
          >
            {showForm ? <Plus size={16} className="rotate-45" /> : <Sparkles size={16} />}
            {showForm ? 'Fechar' : 'Novo Culto+'}
          </button>
        </div>
      </div>

      {!canCreate && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900/40">
          Para criar cultos, seu perfil precisa estar vinculado a uma igreja.
        </div>
      )}

      {canCreate && (
        <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40 md:grid-cols-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Plano Culto+</p>
            <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">{planMatrix.label}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cultos neste mes</p>
            <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">{serviceLimit.used}{serviceLimit.limit === null ? ' / ilimitado' : ` / ${serviceLimit.limit}`}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recursos ativos</p>
            <p className="mt-1 text-xs font-bold text-gray-500 dark:text-gray-400">
              {[
                planMatrix.ai && 'IA',
                planMatrix.schedules && 'Escalas',
                planMatrix.exports && 'Exportacoes',
                planMatrix.advancedAnalytics && 'Analytics',
              ].filter(Boolean).join(' · ') || 'Basico'}
            </p>
          </div>
        </div>
      )}

      {canCreate && showForm && (
        <div className="mt-8 space-y-6 rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
          <datalist id="culto-plus-time-options">
            {TIME_OPTIONS.map((time) => <option key={time} value={time} />)}
          </datalist>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nome do culto</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} title="Informe o nome publico do culto que aparecera na OnePage." className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipo</span>
              <select value={serviceType} onChange={(event) => setServiceType(event.target.value as ChurchServiceType)} title="Escolha a categoria deste culto para organizacao e filtros." className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                {SERVICE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as ChurchServiceStatus)} title="Defina se o culto fica como rascunho, publicado, ao vivo ou encerrado." className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                {SERVICE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tema da mensagem</span>
              <input value={theme} onChange={(event) => setTheme(event.target.value)} title="Descreva o tema ou subtitulo da mensagem do culto." placeholder="Ex.: Vivendo pela fe" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pastor responsavel</span>
              <input value={preacherName} onChange={(event) => setPreacherName(event.target.value)} title="Informe o pastor ou responsavel pela mensagem." className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Banner URL</span>
              <div className="flex gap-2">
                <input value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} title="Cole a URL da imagem de capa que sera usada no topo da OnePage." placeholder="https://..." className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingBanner} title="Enviar uma imagem de banner para este culto." className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-gray-500 hover:text-bible-gold disabled:opacity-50 dark:border-gray-700 dark:bg-bible-darkPaper" aria-label="Enviar banner">
                  {uploadingBanner ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
              </div>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Link da live</span>
              <div className="relative">
                <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  value={liveUrl}
                  onChange={(event) => setLiveUrl(event.target.value)}
                  title="Cole o link HTTPS da transmissao ao vivo, como YouTube, Facebook, Instagram ou Zoom."
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper"
                />
              </div>
              <p className="text-xs font-medium text-gray-400">Opcional. Use quando o culto tiver transmissao ao vivo externa.</p>
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px_160px] md:col-span-2">
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Data do culto</span>
                <input
                  type="date"
                  value={serviceDate}
                  title="Escolha a data em que o culto acontecera."
                  onChange={(event) => {
                    const nextDate = event.target.value || serviceDate;
                    setStartsAt(buildDateTimeLocal(nextDate, serviceStartTime));
                    setEndsAt(buildDateTimeLocal(nextDate, serviceEndTime));
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hora inicio</span>
                <input
                  type="text"
                  list="culto-plus-time-options"
                  inputMode="numeric"
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  placeholder="18:00"
                  value={serviceStartTime}
                  title="Informe o horario de inicio no formato 24 horas."
                  onChange={(event) => setStartsAt(buildDateTimeLocal(serviceDate, maskTimeInput(event.target.value)))}
                  onBlur={(event) => setStartsAt(buildDateTimeLocal(serviceDate, normalizeTime24h(event.target.value, serviceStartTime)))}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hora fim</span>
                <input
                  type="text"
                  list="culto-plus-time-options"
                  inputMode="numeric"
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  placeholder="21:00"
                  value={serviceEndTime}
                  title="Informe o horario previsto de encerramento no formato 24 horas."
                  onChange={(event) => setEndsAt(buildDateTimeLocal(serviceDate, maskTimeInput(event.target.value)))}
                  onBlur={(event) => setEndsAt(buildDateTimeLocal(serviceDate, normalizeTime24h(event.target.value, serviceEndTime)))}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper"
                />
              </label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Versiculo-chave</span>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/40 dark:text-emerald-300/50" size={17} />
                    <input
                      value={keyVerseRef}
                      maxLength={40}
                      onChange={(event) => {
                        setKeyVerseRef(event.target.value);
                        if (!event.target.value.trim()) {
                          setKeyVerseText('');
                          setKeyVerseSearchState('idle');
                        }
                      }}
                      title="Informe a referencia biblica principal do culto."
                      placeholder="Joao 15:5"
                      className="w-full rounded-2xl border border-emerald-100 bg-white py-3 pl-11 pr-11 text-sm font-black text-gray-900 outline-none shadow-sm transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-900/40 dark:bg-bible-darkPaper dark:text-white dark:focus:ring-emerald-950/40"
                    />
                    {searchingKeyVerse && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-700 dark:text-emerald-300" size={16} />}
                  </div>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Texto do versiculo</span>
                  <textarea
                    value={keyVerseText}
                    onChange={(event) => {
                      setKeyVerseText(event.target.value);
                      if (event.target.value.trim()) setKeyVerseSearchState('found');
                    }}
                    title="Revise ou edite o texto do versiculo-chave que aparecera na OnePage."
                    placeholder="O texto sera preenchido automaticamente ao informar a referencia."
                    className="min-h-[46px] w-full resize-none rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold leading-relaxed text-gray-700 outline-none shadow-sm transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-900/40 dark:bg-bible-darkPaper dark:text-gray-200 dark:focus:ring-emerald-950/40"
                  />
                </label>
              </div>

              {keyVerseSearchState === 'found' && keyVerseText && (
                <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-[#fff8e8] p-4 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/25 dark:via-bible-darkPaper dark:to-amber-950/10">
                  <Quote size={15} className="mb-2 text-[#b88a2f]" />
                  <p className="line-clamp-3 font-serif text-sm italic leading-relaxed text-gray-700 dark:text-gray-200">"{keyVerseText}"</p>
                  <span className="mt-2 block text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">{keyVerseRef}</span>
                </div>
              )}

              {keyVerseSearchState === 'not_found' && !searchingKeyVerse && (
                <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  Nao encontrei essa referencia. Confira o livro, capitulo e versiculo.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-bible-darkPaper">
            <div className="flex flex-col gap-4 bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] p-4 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-50/80">Planejamento IA</p>
                <h3 className="mt-1 flex items-center gap-2 text-base font-black">
                  <Sparkles size={17} className="text-[#f3d28a]" />
                  Criar Culto+ com ajuda da IA
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPlanner((value) => !value)}
                title={showAiPlanner ? 'Ocultar o campo de prompt da IA.' : 'Abrir o campo para pedir sugestoes de planejamento a IA.'}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/12 px-4 text-[10px] font-black uppercase tracking-widest ring-1 ring-white/20 transition hover:bg-white/20"
              >
                {showAiPlanner ? 'Ocultar prompt' : 'Abrir prompt'}
              </button>
            </div>

            {showAiPlanner && (
              <div className="space-y-4 p-4">
                <textarea
                  value={servicePlanningPrompt}
                  onChange={(event) => setServicePlanningPrompt(event.target.value)}
                  title="Descreva o foco pastoral desejado para a IA sugerir planejamento do culto."
                  placeholder="Ex.: culto evangelistico para familias, foco em restauracao, encerrando com apelo e oracao pelos lares."
                  className="min-h-28 w-full resize-none rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm font-medium leading-relaxed text-gray-800 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/15 dark:text-gray-100 dark:focus:ring-emerald-950/40"
                />
                {servicePlanningFocus && (
                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-[#fff8e8] p-4 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-bible-darkPaper dark:to-amber-950/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">Foco sugerido</p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">{servicePlanningFocus}</p>
                  </div>
                )}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
                    Se o versiculo-chave estiver vazio, a IA usa o versiculo do dia como base.
                  </p>
                  <button
                    type="button"
                    onClick={generateServicePlanFromAi}
                    disabled={generatingServicePlan}
                    title="Gerar sugestoes de titulo, tema e liturgia com base no prompt informado."
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 dark:ring-emerald-900/40"
                  >
                    {generatingServicePlan ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Gerar planejamento
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Timeline liturgica</h3>
              <span className="hidden text-xs font-medium text-gray-400 md:block">{liturgySummary}</span>
            </div>
            <div className="space-y-3">
              {liturgyItems.map((item) => {
                const songs = getSongItems(item);
                const visibleSongs = songs.length > 0 ? songs : [''];
                return (
                  <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-bible-darkPaper">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[170px_1fr_1fr]">
                      <div className="flex gap-2">
                        <input
                          value={item.startsAt}
                          list="culto-plus-time-options"
                          inputMode="numeric"
                          pattern="[0-2][0-9]:[0-5][0-9]"
                          title="Horario em que este momento da liturgia comeca."
                          onChange={(event) => updateLiturgyItem(item.id, { startsAt: maskTimeInput(event.target.value) })}
                          onBlur={(event) => updateLiturgyItem(item.id, { startsAt: normalizeTime24h(event.target.value, item.startsAt) })}
                          className="min-w-[72px] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-black outline-none dark:border-gray-700 dark:bg-gray-900"
                        />
                        <button type="button" onClick={() => moveLiturgyItem(item.id, -1)} title="Mover este momento uma posicao para cima." className="rounded-xl border border-gray-200 px-2 text-gray-400 hover:text-bible-gold" aria-label="Mover etapa para cima"><ArrowUp size={14} /></button>
                        <button type="button" onClick={() => moveLiturgyItem(item.id, 1)} title="Mover este momento uma posicao para baixo." className="rounded-xl border border-gray-200 px-2 text-gray-400 hover:text-bible-gold" aria-label="Mover etapa para baixo"><ArrowDown size={14} /></button>
                        <button type="button" onClick={() => removeLiturgyItem(item.id)} disabled={liturgyItems.length <= 1} title="Remover este momento da liturgia." className="rounded-xl border border-red-100 px-2 text-red-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-950/40 dark:hover:bg-red-950/20" aria-label="Remover momento"><Trash2 size={14} /></button>
                      </div>
                      <select value={item.kind} onChange={(event) => updateLiturgyItem(item.id, { kind: event.target.value as ServiceLiturgyKind })} title="Escolha o tipo deste momento da liturgia." className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold outline-none dark:border-gray-700 dark:bg-gray-900">
                        {LITURGY_KIND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      <input value={item.title} onChange={(event) => updateLiturgyItem(item.id, { title: event.target.value })} title="Nome deste momento da liturgia." className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold outline-none dark:border-gray-700 dark:bg-gray-900" />
                      <input value={item.responsible ?? ''} onChange={(event) => updateLiturgyItem(item.id, { responsible: event.target.value })} title="Pessoa ou equipe responsavel por este momento." placeholder="Responsavel" className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none dark:border-gray-700 dark:bg-gray-900 md:col-span-3" />
                    </div>

                    {item.kind === 'worship' && (
                      <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Musicas</p>
                          <button type="button" onClick={() => addSongItem(item.id)} title="Adicionar uma musica a este momento de louvor." className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-white px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-bible-darkPaper dark:text-emerald-300">
                            <Plus size={12} />
                            Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {visibleSongs.map((song, index) => (
                            <div key={`${item.id}_song_${index}`} className="flex gap-2">
                              <input value={song} onChange={(event) => updateSongItem(item.id, index, event.target.value)} title="Titulo da musica deste momento de louvor." placeholder="Titulo da musica" className="min-w-0 flex-1 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-bold outline-none dark:border-emerald-900/40 dark:bg-bible-darkPaper" />
                              <button type="button" onClick={() => removeSongItem(item.id, index)} title="Remover esta musica." className="inline-flex min-h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-white text-red-300 transition hover:bg-red-50 hover:text-red-500 dark:border-red-950/40 dark:bg-bible-darkPaper dark:hover:bg-red-950/20" aria-label="Remover musica">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.kind === 'word' && (
                      <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-3 dark:border-blue-900/40 dark:bg-blue-950/10 md:grid-cols-[180px_1fr]">
                        <input value={item.verseRef ?? ''} onChange={(event) => updateLiturgyItem(item.id, { verseRef: event.target.value })} title="Referencia biblica deste momento da Palavra." placeholder="Versiculo" className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-black outline-none dark:border-blue-900/40 dark:bg-bible-darkPaper" />
                        <input value={item.verseText ?? ''} onChange={(event) => updateLiturgyItem(item.id, { verseText: event.target.value })} title="Texto biblico deste momento da Palavra." placeholder="Texto biblico" className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold outline-none dark:border-blue-900/40 dark:bg-bible-darkPaper" />
                        <textarea value={item.notes ?? ''} onChange={(event) => updateLiturgyItem(item.id, { notes: event.target.value })} title="Descricao pastoral ou orientacao para o momento da Palavra." placeholder="Descricao da palavra do pastor" className="min-h-20 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none dark:border-blue-900/40 dark:bg-bible-darkPaper md:col-span-2" />
                      </div>
                    )}

                    {item.kind === 'offering' && (
                      <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/10 md:grid-cols-[160px_1fr]">
                        <textarea value={item.notes ?? ''} onChange={(event) => updateLiturgyItem(item.id, { notes: event.target.value })} title="Mensagem exibida junto ao momento de dizimos e ofertas." placeholder="Mensagem livre para dizimos e ofertas" className="min-h-20 rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper md:col-span-2" />
                        <select value={item.pixKeyType ?? 'cpf'} onChange={(event) => updateLiturgyItem(item.id, { pixKeyType: event.target.value as NonNullable<ServiceLiturgyItem['pixKeyType']> })} title="Escolha o tipo da chave PIX de oferta." className="rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm font-bold outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper">
                          {PIX_KEY_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <input value={item.pixKey ?? ''} onChange={(event) => updateLiturgyItem(item.id, { pixKey: event.target.value })} title="Chave PIX que sera exibida no botao Ofertar da pagina publica." placeholder="Chave PIX" className="rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm font-bold outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper" />
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-[#c5a059]/20 bg-[#fff8e8]/45 p-3 dark:border-[#c5a059]/20 dark:bg-amber-950/10 md:grid-cols-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8a6a2f] dark:text-[#f3d28a] md:col-span-2">Roteiro gerado</p>
                      <textarea
                        value={item.leaderScript ?? ''}
                        onChange={(event) => updateLiturgyItem(item.id, { leaderScript: event.target.value })}
                        title="Fala pronta para o dirigente deste momento."
                        placeholder="Fala do dirigente"
                        className="min-h-20 rounded-xl border border-[#ead9a8] bg-white px-3 py-2 text-sm outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper"
                      />
                      <textarea
                        value={item.transitionText ?? ''}
                        onChange={(event) => updateLiturgyItem(item.id, { transitionText: event.target.value })}
                        title="Transicao para o proximo momento."
                        placeholder="Transicao para o proximo momento"
                        className="min-h-20 rounded-xl border border-[#ead9a8] bg-white px-3 py-2 text-sm outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper"
                      />
                      <textarea
                        value={item.prayerGuide ?? ''}
                        onChange={(event) => updateLiturgyItem(item.id, { prayerGuide: event.target.value })}
                        title="Guia de oracao deste momento."
                        placeholder="Guia de oracao"
                        className="min-h-20 rounded-xl border border-[#ead9a8] bg-white px-3 py-2 text-sm outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper"
                      />
                      <textarea
                        value={(item.sermonPoints ?? []).join('\n')}
                        onChange={(event) => updateLiturgyItem(item.id, { sermonPoints: event.target.value.split('\n').map((point) => point.trim()).filter(Boolean) })}
                        title="Pontos principais da Palavra ou aplicacao deste momento."
                        placeholder="Pontos da mensagem, um por linha"
                        className="min-h-20 rounded-xl border border-[#ead9a8] bg-white px-3 py-2 text-sm outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper"
                      />
                      <input
                        value={item.scriptureReadingRef ?? ''}
                        onChange={(event) => updateLiturgyItem(item.id, { scriptureReadingRef: event.target.value })}
                        title="Referencia da leitura biblica deste momento."
                        placeholder="Leitura biblica: referencia"
                        className="rounded-xl border border-[#ead9a8] bg-white px-3 py-2 text-sm font-bold outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper"
                      />
                      <textarea
                        value={item.scriptureReadingText ?? ''}
                        onChange={(event) => updateLiturgyItem(item.id, { scriptureReadingText: event.target.value })}
                        title="Texto da leitura biblica deste momento."
                        placeholder="Texto da leitura biblica"
                        className="min-h-20 rounded-xl border border-[#ead9a8] bg-white px-3 py-2 text-sm outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper"
                      />
                    </div>

                    {['entrance', 'opening', 'prayer', 'response', 'closing', 'other'].includes(item.kind) && (
                      <textarea
                        value={item.notes ?? ''}
                        onChange={(event) => updateLiturgyItem(item.id, { notes: event.target.value })}
                        title="Observacoes pastorais deste momento da liturgia."
                        placeholder={
                          item.kind === 'prayer' ? 'Orientacao para o momento de oracao' :
                          item.kind === 'closing' ? 'Mensagem de encerramento' :
                          'Observacoes deste momento'
                        }
                        className="mt-3 min-h-16 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none dark:border-gray-700 dark:bg-gray-900"
                      />
                    )}
                  </div>
                );
              })}
              <button type="button" onClick={addLiturgyItem} title="Adicionar um novo momento a timeline liturgica." className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/10 dark:text-emerald-300">
                <Plus size={15} />
                Adicionar momento
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
            <button onClick={() => { setShowForm(false); resetForm(); }} disabled={saving} title="Cancelar edicao e fechar formulario." className="rounded-2xl bg-gray-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-500 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving} title={editingServiceId ? 'Salvar as alteracoes deste culto.' : 'Publicar a OnePage deste culto.'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 dark:ring-emerald-900/40">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingServiceId ? 'Salvar alteracoes' : 'Publicar OnePage'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500">
            {serviceView === 'calendar' ? <CalendarDays size={16} /> : <FileText size={16} />}
            {serviceView === 'calendar' ? 'Calendario' : 'Cultos recentes'}
          </div>
          <div className="inline-grid grid-cols-2 rounded-2xl border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900/40">
            {([
              ['list', 'Lista'],
              ['calendar', 'Calendario'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setServiceView(value)}
                className={`min-h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition ${serviceView === value ? 'bg-white text-emerald-700 shadow-sm dark:bg-bible-darkPaper dark:text-emerald-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm font-bold text-gray-400"><Loader2 size={16} className="animate-spin" /> Carregando cultos...</div>
        ) : serviceView === 'calendar' ? (
          <CultoPlusCalendarView
            services={services}
            visibleDays={calendarRange.visibleDays}
            currentDate={calendarDate}
            scheduleAssignments={scheduleAssignments}
            onPreviousMonth={() => setCalendarDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
            onNextMonth={() => setCalendarDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
            onToday={() => setCalendarDate(new Date())}
            onCreateAtDate={startCreateAtDate}
            onEdit={startEdit}
            onOpenPanel={openServicePanel}
          />
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm font-medium text-gray-400 dark:border-gray-800">
            Crie o primeiro culto para liberar check-in, anotacoes e feed vinculado.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
              const journeyActions = getServiceJourneyActions(service);
              return (
                <div key={service.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:border-bible-gold/40 hover:bg-white dark:border-gray-800 dark:bg-gray-900/40 dark:hover:bg-gray-900">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 text-sm font-black text-gray-900 dark:text-white">{service.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{service.theme}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${SERVICE_STATUS_STYLES[service.status]}`}>
                      {SERVICE_STATUS_LABELS[service.status]}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 dark:bg-bible-darkPaper"><CalendarDays size={12} /> {formatServiceDate(service.startsAt)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 dark:bg-bible-darkPaper"><Clock size={12} /> {service.liturgyItems.length} etapas</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 dark:bg-bible-darkPaper"><Users size={12} /> {serviceStats[service.id]?.checkinsCount ?? service.checkinsCount ?? 0}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 dark:bg-bible-darkPaper"><MessageSquare size={12} /> {serviceStats[service.id]?.postsCount ?? service.postsCount ?? 0}</span>
                  </div>
                  {journeyActions.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-white bg-white/70 p-3 dark:border-gray-800 dark:bg-bible-darkPaper/70">
                      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Jornada do culto</p>
                      <div className="flex flex-wrap gap-2">
                        {journeyActions.map((action) => (
                          <button
                            key={`${service.id}_${action.status}`}
                            type="button"
                            onClick={() => updateServiceJourneyStatus(service, action.status)}
                            title={action.title}
                            className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition hover:-translate-y-0.5 ${action.className}`}
                          >
                            {action.status === 'live' ? <Radio size={11} /> : action.status === 'finished' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
                    <Link href={`/culto/${service.slug}`} className="inline-flex items-center justify-center gap-1 rounded-xl bg-bible-gold px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black">
                      <ExternalLink size={12} /> Abrir
                    </Link>
                    <button onClick={() => startEdit(service)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-bible-darkPaper">
                      <Edit2 size={12} /> Editar
                    </button>
                    <button onClick={() => openServicePanel(service)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-bible-darkPaper">
                      <NotebookPen size={12} /> Painel
                    </button>
                    <button onClick={() => archiveService(service)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 dark:bg-red-950/20">
                      <Archive size={12} /> Arquivar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedServiceId && (
        <div className="mt-6 rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Painel do culto</h3>
            {loadingPanel && <Loader2 size={16} className="animate-spin text-bible-gold" />}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Visitantes</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white"><Eye size={18} className="text-bible-gold" /> {serviceStats[selectedServiceId]?.visitorsCount ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Check-ins</p>
              <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{serviceStats[selectedServiceId]?.checkinsCount ?? selectedCheckins.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Posts</p>
              <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{serviceStats[selectedServiceId]?.postsCount ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Anotacoes privadas</p>
              <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{serviceStats[selectedServiceId]?.notesCount ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pedidos de oracao</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white"><HandHeart size={18} className="text-bible-gold" /> {serviceStats[selectedServiceId]?.prayersCount ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Versiculos salvos</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white"><Bookmark size={18} className="text-bible-gold" /> {serviceStats[selectedServiceId]?.verseSavesCount ?? 0}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Escalas e ministerios</p>
                <h4 className="text-base font-black text-gray-900 dark:text-white">{selectedService?.title ?? 'Culto selecionado'}</h4>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-bible-gold/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-bible-leather dark:text-bible-gold">
                <Users size={12} />
                {scheduleAssignments.length} escalados
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Novo ministerio</p>
                <div className="space-y-2">
                  <input value={newMinistryName} onChange={(event) => setNewMinistryName(event.target.value)} placeholder="Louvor, Midia, Recepcao..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
                  <input value={newMinistryDescription} onChange={(event) => setNewMinistryDescription(event.target.value)} placeholder="Descricao opcional" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
                  <button onClick={createMinistry} disabled={!newMinistryName.trim()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-bible-leather px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50 dark:bg-bible-gold dark:text-black">
                    <Plus size={14} />
                    Criar ministerio
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Vincular membro</p>
                <div className="space-y-2">
                  <select value={selectedMinistryId} onChange={(event) => setSelectedMinistryId(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                    <option value="">Ministerio</option>
                    {ministries.map((ministry) => <option key={ministry.id} value={ministry.id}>{ministry.name}</option>)}
                  </select>
                  <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                    <option value="">Membro</option>
                    {churchMembers.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
                  </select>
                  <input value={ministryRole} onChange={(event) => setMinistryRole(event.target.value)} placeholder="Funcao: vocal, camera, recepcao..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
                  <button onClick={addMemberToMinistry} disabled={!selectedMinistryId || !selectedMemberId} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-bible-gold px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-50">
                    <UserPlus size={14} />
                    Vincular
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Escalar no culto</p>
                <div className="space-y-2">
                  <select value={scheduleMinistryId} onChange={(event) => setScheduleMinistryId(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                    <option value="">Ministerio</option>
                    {ministries.map((ministry) => <option key={ministry.id} value={ministry.id}>{ministry.name}</option>)}
                  </select>
                  <select value={scheduleMemberId} onChange={(event) => setScheduleMemberId(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                    <option value="">Membro</option>
                    {churchMembers.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
                  </select>
                  <input value={scheduleRole} onChange={(event) => setScheduleRole(event.target.value)} placeholder="Funcao neste culto" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
                  <button onClick={createScheduleAssignment} disabled={!scheduleMinistryId || !scheduleMemberId} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-bible-gold px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-50">
                    <CalendarDays size={14} />
                    Criar escala
                  </button>
                </div>
              </div>
            </div>

            {ministries.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {ministries.map((ministry) => (
                  <span key={ministry.id} className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-gray-900">
                    {ministry.name}
                    <span className="rounded-full bg-white px-2 py-0.5 text-gray-400 dark:bg-bible-darkPaper">
                      {ministryMembers.filter((member) => member.ministryId === ministry.id).length}
                    </span>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {scheduleAssignments.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm font-medium text-gray-400 dark:border-gray-800">
                  Nenhuma escala criada para este culto.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {([
                      ['pending', 'Pendentes', scheduleSummary.pending],
                      ['confirmed', 'Confirmados', scheduleSummary.confirmed],
                      ['declined', 'Recusados', scheduleSummary.declined],
                      ['replaced', 'Substituidos', scheduleSummary.replaced],
                    ] as const).map(([statusKey, label, value]) => (
                      <div key={statusKey} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                        <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  {scheduleSummary.pending > 0 && (
                    <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                      Existem {scheduleSummary.pending} pessoa(s) sem resposta. Use lembretes ou substituicoes para fechar a escala antes do culto.
                    </p>
                  )}
                </>
              )}
              {sortedScheduleAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{assignment.userDisplayName}</p>
                      <p className="mt-1 text-xs font-medium text-gray-500">
                        {assignment.ministryName}{assignment.role ? ` - ${assignment.role}` : ''}
                      </p>
                      {assignment.replacementUserDisplayName && (
                        <p className="mt-1 text-xs font-bold text-bible-gold">Substituto: {assignment.replacementUserDisplayName}</p>
                      )}
                    </div>
                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${SCHEDULE_STATUS_STYLES[assignment.status]}`}>
                      {SCHEDULE_STATUS_LABELS[assignment.status]}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <button onClick={() => updateAssignmentStatus(assignment.id, 'confirmed')} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-green-600 dark:bg-bible-darkPaper">
                      <CheckCircle2 size={13} />
                      Confirmar
                    </button>
                    <button onClick={() => updateAssignmentStatus(assignment.id, 'declined')} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 dark:bg-bible-darkPaper">
                      <Archive size={13} />
                      Recusar
                    </button>
                    <button onClick={() => markReminderSent(assignment.id)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-bible-darkPaper">
                      <Bell size={13} />
                      {assignment.reminderSentAt ? 'Lembrado' : 'Lembrete'}
                    </button>
                    <div className="flex gap-2">
                      <select value={replacementMemberByAssignment[assignment.id] ?? ''} onChange={(event) => setReplacementMemberByAssignment((current) => ({ ...current, [assignment.id]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs font-bold outline-none dark:border-gray-700 dark:bg-bible-darkPaper">
                        <option value="">Substituto</option>
                        {churchMembers.filter((member) => member.uid !== assignment.userId).map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
                      </select>
                      <button onClick={() => replaceAssignment(assignment.id)} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-3 text-gray-500 dark:bg-bible-darkPaper" aria-label="Substituir membro escalado">
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Culto ao vivo</p>
                  <h4 className="text-base font-black text-gray-900 dark:text-white">Sincronizar OnePage</h4>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${liveState ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-200' : 'bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-300'}`}>
                  {liveState ? 'Ativo' : 'Pronto'}
                </span>
              </div>
              <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Momento atual</p>
                    <h5 className="mt-1 text-sm font-black text-gray-900 dark:text-white">{liveCurrentItem?.title ?? 'Nenhum momento selecionado'}</h5>
                    {liveNextItem && <p className="mt-1 text-xs font-semibold text-gray-500">Proximo: {liveNextItem.title}</p>}
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-bible-darkPaper">
                    {liveLiturgyItems.length ? `${liveCurrentIndex + 1}/${liveLiturgyItems.length}` : '0/0'}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-bible-darkPaper">
                  <div className="h-full rounded-full bg-bible-gold transition-all" style={{ width: `${liveProgress}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <input value={liveVerseRef} onChange={(event) => setLiveVerseRef(event.target.value)} placeholder="Versiculo atual" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-gray-900" />
                <textarea value={liveVerseText} onChange={(event) => setLiveVerseText(event.target.value)} placeholder="Texto biblico enviado aos participantes" className="min-h-20 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-gray-900" />
                <textarea value={liveExplanation} onChange={(event) => setLiveExplanation(event.target.value)} placeholder="Explicacao pastoral breve" className="min-h-20 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-gray-900" />
              </div>
              <div className="mt-4 space-y-2">
                {liveLiturgyItems.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm font-medium text-gray-400 dark:border-gray-800">
                    Adicione momentos na liturgia para controlar o culto ao vivo.
                  </p>
                ) : liveLiturgyItems.map((item, index) => {
                  const isCurrent = liveState?.currentItemId === item.id;
                  const isPast = liveState?.currentItemId ? index < liveCurrentIndex : false;
                  const isSyncing = syncingLiveItemId === item.id;
                  return (
                    <div key={item.id} className={`rounded-2xl border p-3 transition ${isCurrent ? 'border-bible-gold bg-bible-gold/10' : 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40'} ${isPast ? 'opacity-60' : ''}`}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${isCurrent ? 'bg-bible-gold text-black' : 'bg-white text-gray-500 dark:bg-bible-darkPaper'}`}>
                              {index + 1}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.startsAt}</span>
                            {isCurrent && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-red-600 dark:bg-red-950/20 dark:text-red-200">No ar</span>}
                          </div>
                          <h5 className="mt-2 line-clamp-1 text-sm font-black text-gray-900 dark:text-white">{item.title}</h5>
                          {(item.verseRef || item.notes) && (
                            <p className="mt-1 line-clamp-1 text-xs font-semibold text-gray-500">
                              {item.verseRef || item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => prepareLiveStep(item)}
                            title="Carregar versiculo e notas deste momento nos campos acima."
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-[10px] font-black uppercase tracking-widest text-gray-500 transition hover:text-bible-leather dark:bg-bible-darkPaper dark:text-gray-300"
                          >
                            <Quote size={12} />
                            Preparar
                          </button>
                          <button
                            type="button"
                            onClick={() => pushLiveStep(item)}
                            disabled={isSyncing}
                            title="Sincronizar este momento na OnePage publica do culto."
                            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest transition disabled:opacity-60 ${isCurrent ? 'bg-bible-gold text-black' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}
                          >
                            {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}
                            Sincronizar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">IA Crista</p>
                  <h4 className="text-base font-black text-gray-900 dark:text-white">Apoio pastoral e devocional</h4>
                </div>
                <Brain className="text-bible-gold" size={20} />
              </div>
              <p className="mb-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Conteudo de apoio: diferencie resumo, interpretacao e aplicacao pastoral antes de publicar ou ensinar.
              </p>
              <div className="mb-3">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Para membros</p>
                <div className="flex flex-wrap gap-2">
                  {MEMBER_AI_ACTIONS.map((action) => (
                    <button key={action.kind} onClick={() => generateAiContent(action.kind)} disabled={aiLoadingKind !== null} className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-gray-50 px-3 text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-50 dark:bg-gray-900">
                      {aiLoadingKind === action.kind ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Para pastor</p>
                <div className="flex flex-wrap gap-2">
                  {PASTOR_AI_ACTIONS.map((action) => (
                    <button key={action.kind} onClick={() => generateAiContent(action.kind)} disabled={aiLoadingKind !== null} className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-bible-gold/10 px-3 text-[10px] font-black uppercase tracking-widest text-bible-leather disabled:opacity-50 dark:text-bible-gold">
                      {aiLoadingKind === action.kind ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
              {aiOutput && (
                <textarea value={aiOutput} onChange={(event) => setAiOutput(event.target.value)} className="mt-4 min-h-52 w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed outline-none dark:border-gray-800 dark:bg-gray-900" />
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Analytics avancado</p>
                <h4 className="text-base font-black text-gray-900 dark:text-white">Mapa de engajamento do culto</h4>
              </div>
              <button onClick={exportSelectedService} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-gray-900">
                <Download size={14} />
                Exportar CSV
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Engajamento</p>
                <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{advancedAnalytics?.engagementRate ?? 0}%</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reacoes</p>
                <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{advancedAnalytics?.reactionsCount ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Escalas</p>
                <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{advancedAnalytics?.schedulesCount ?? scheduleAssignments.length}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pendencias</p>
                <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{advancedAnalytics?.pendingSchedulesCount ?? scheduleAssignments.filter((item) => item.status === 'pending').length}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 max-h-64 overflow-y-auto rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Ultimos check-ins</p>
            {selectedCheckins.length === 0 ? (
              <p className="text-sm font-medium text-gray-400">Nenhum check-in registrado ainda.</p>
            ) : (
              <div className="space-y-3">
                {selectedCheckins.map((checkin) => (
                  <div key={checkin.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      {checkin.userPhotoURL ? <img src={checkin.userPhotoURL} alt={checkin.userDisplayName} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{checkin.userDisplayName}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{formatServiceDate(checkin.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CultoPlusManager;
