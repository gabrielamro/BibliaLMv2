"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Archive, ArrowDown, ArrowUp, Bell, Bookmark, Brain, CalendarDays, CheckCircle2, ChevronDown, Clock, Copy, Download, Edit2, Eye, ExternalLink, FileText, HandHeart, ImageIcon, Loader2, MessageSquare, NotebookPen, Plus, Quote, Radio, RefreshCw, Save, Search, Sparkles, Trash2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { bibleService } from '../../services/bibleService';
import { dbService, uploadBlob } from '../../services/supabase';
import { ChurchServiceStats, cultoPlusService } from '../../services/cultoPlusService';
import { generateDailyDevotional } from '../../services/pastorAgent';
import { ChurchService, ChurchServiceModality, ChurchServiceStatus, ChurchServiceType, ServiceAdvancedAnalytics, ServiceAiContentKind, ServiceCheckin, ServiceLiturgyItem, ServiceLiturgyKind, ServiceLiveState, ServiceMinistry, ServiceMinistryMember, ServiceReactionSummary, ServiceScheduleAssignment, UserProfile } from '../../types';
import CultoPlusCalendarView from './CultoPlusCalendarView';
import { getCalendarMonthRange } from '../../utils/cultoPlusCalendar';
import { SERVICE_MODALITY_META, SERVICE_MODALITY_VALUES, getServiceModality, normalizeServiceModality } from '../../utils/serviceModality';
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

type SelectShellProps = {
  children: React.ReactNode;
  className?: string;
};

type EditorStep = 'overview' | 'planning' | 'review';
type ServiceTemporalFilter = 'active' | 'in_progress' | 'upcoming' | 'past';
type ServiceTemporalState = 'in_progress' | 'upcoming' | 'past';

type ReviewIssue = {
  message: string;
  target: EditorStep;
  selector: string;
  liturgyItemId?: string;
};

const SelectShell: React.FC<SelectShellProps> = ({ children, className = '' }) => (
  <div className={`relative min-w-0 ${className}`}>
    {children}
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
      <ChevronDown size={15} />
    </span>
  </div>
);

const EDITOR_STEPS: { id: EditorStep; label: string; helper: string }[] = [
  { id: 'overview', label: 'Visão geral', helper: 'Informações gerais' },
  { id: 'planning', label: 'Planejamento', helper: 'Mensagem e programação' },
  { id: 'review', label: 'Revisão e publicação', helper: 'Verificar e publicar' },
];

const LOCAL_DRAFT_PREFIX = 'culto-plus-editor-draft';

const SERVICE_TEMPORAL_FILTERS: { value: ServiceTemporalFilter; label: string }[] = [
  { value: 'active', label: 'Ativos' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Já passaram' },
];

const SERVICE_TYPES: { value: ChurchServiceType; label: string }[] = [
  { value: 'sunday', label: 'Domingo' },
  { value: 'youth', label: 'Jovens' },
  { value: 'women', label: 'Mulheres' },
  { value: 'cell', label: 'Célula' },
  { value: 'conference', label: 'Conferência' },
  { value: 'vigil', label: 'Vigília' },
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
      title: 'Marcar culto em andamento sem transmissão ao vivo.',
      className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300',
    });
  }

  if ((service.status === 'published' || service.status === 'checkin_open' || service.status === 'in_progress') && service.liveUrl) {
    actions.push({
      status: 'live',
      label: 'Iniciar live',
      title: 'Marcar culto como ao vivo com transmissão.',
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
  { value: 'entrance', label: 'Entrada / Recepção' },
  { value: 'opening', label: 'Abertura' },
  { value: 'worship', label: 'Adoração e Louvor' },
  { value: 'word', label: 'Leitura Bíblica / Palavra' },
  { value: 'offering', label: 'Dízimos e Ofertas' },
  { value: 'prayer', label: 'Momento de Oração' },
  { value: 'response', label: 'Resposta / Apelo' },
  { value: 'closing', label: 'Encerramento' },
  { value: 'other', label: 'Outro momento' },
];

const summarizeCreatedMoments = (items: ServiceLiturgyItem[]) => {
  if (items.length === 0) return '';
  const moments = items.slice(0, 7).map((item) => {
    const kindLabel = LITURGY_KIND_OPTIONS.find((option) => option.value === item.kind)?.label ?? 'Momento';
    const songsCount = item.kind === 'worship' ? getSongItems(item).filter((song) => song.trim()).length : 0;
    const detail = songsCount > 0 ? ` com ${songsCount} louvor${songsCount === 1 ? '' : 'es'}` : '';
    return `${item.startsAt} - ${item.title || kindLabel}${detail}`;
  });
  const extra = items.length > moments.length ? ` e mais ${items.length - moments.length}` : '';
  return `Foram criados ${items.length} momentos: ${moments.join('; ')}${extra}.`;
};

const PIX_KEY_TYPES: { value: NonNullable<ServiceLiturgyItem['pixKeyType']>; label: string }[] = [
  { value: 'cpf', label: 'CPF' },
  { value: 'phone', label: 'Número' },
  { value: 'email', label: 'E-mail' },
  { value: 'random', label: 'Chave aleatoria' },
];

const DEFAULT_LITURGY: { kind: ServiceLiturgyKind; title: string; startsAt: string }[] = [
  { kind: 'entrance', title: 'Liturgia de Entrada', startsAt: '18:45' },
  { kind: 'opening', title: 'Abertura', startsAt: '19:00' },
  { kind: 'worship', title: 'Adoração e Louvor', startsAt: '19:15' },
  { kind: 'word', title: 'Liturgia da Palavra', startsAt: '19:50' },
  { kind: 'offering', title: 'Dizimo / Oférta / Resposta', startsAt: '20:35' },
  { kind: 'prayer', title: 'Momento de Oração', startsAt: '20:45' },
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
  if (/^\d{1,2}:\d$/.test(clean)) {
    const [rawHours, rawMinutes] = clean.split(':');
    const hours = Number(rawHours);
    const minutes = Number(`${rawMinutes}0`);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
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
const getSongText = (item: ServiceLiturgyItem, song: string) => item.songTexts?.[song.trim()] ?? '';
const getSongLeader = (item: ServiceLiturgyItem, song: string) => item.songLeaders?.[song.trim()] ?? '';
const timeToMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = normalizeTime24h(time, '00:00').split(':').map(Number);
  return hours * 60 + minutes;
};
const minutesToTime = (minutes: number) => {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
};
const formatMinutesDuration = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;
  if (hours <= 0) return `${remaining}min`;
  return `${hours}h ${String(remaining).padStart(2, '0')}min`;
};
const buildTimelineTimes = (startTime: string, endTime: string, count: number) => {
  if (count <= 0) return [];
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  const duration = Math.max(15, endMinutes - startMinutes);
  if (count === 1) return [minutesToTime(startMinutes)];
  const step = duration / count;
  return Array.from({ length: count }, (_, index) => minutesToTime(startMinutes + Math.floor(step * index)));
};

const buildPlannedLiturgyItems = (
  plannedItems: Array<Partial<ServiceLiturgyItem>> = [],
  startTime = '19:00',
  endTime = '21:00',
): ServiceLiturgyItem[] => {
  const sourceItems = plannedItems.filter((item) => item.title || item.notes || item.kind);
  const timelineTimes = buildTimelineTimes(startTime, endTime, sourceItems.length || DEFAULT_LITURGY.length);
  const normalizedItems = sourceItems
    .map((item, index) => ({
      id: `ai_plan_${item.kind || 'other'}_${Date.now()}_${index}`,
      kind: item.kind || 'other',
      title: item.title || 'Novo momento',
      startsAt: timelineTimes[index] || normalizeTime24h(item.startsAt || '', startTime),
      responsible: item.responsible || '',
      notes: item.notes || '',
      verseRef: item.verseRef,
      verseText: item.verseText,
      songList: item.songList,
      songLyrics: item.songLyrics,
      songTexts: item.songTexts,
      pixKeyType: item.pixKeyType,
      pixKey: item.pixKey,
      sortOrder: index,
    } as ServiceLiturgyItem));

  return normalizedItems.length
    ? normalizedItems
    : createDefaultLiturgy().map((item, index) => ({ ...item, startsAt: timelineTimes[index] || item.startsAt }));
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

const getServiceTemporalState = (service: ChurchService, now = new Date()): ServiceTemporalState => {
  const start = new Date(service.startsAt);
  const end = new Date(service.endsAt || service.startsAt);
  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  if (service.status === 'finished' || service.status === 'archived') return 'past';
  if (service.status === 'in_progress' || service.status === 'live') return 'in_progress';
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && nowMs >= startMs && nowMs <= endMs) return 'in_progress';
  if (Number.isFinite(startMs) && nowMs < startMs) return 'upcoming';
  return 'past';
};

const matchesServiceTemporalFilter = (state: ServiceTemporalState, filter: ServiceTemporalFilter) => {
  if (filter === 'active') return state !== 'past';
  return state === filter;
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
  { kind: 'member_prayer', label: 'Oração' },
  { kind: 'member_weekly_plan', label: 'Plano semanal' },
  { kind: 'member_reflection_questions', label: 'Perguntas' },
];

const PASTOR_AI_ACTIONS: { kind: ServiceAiContentKind; label: string }[] = [
  { kind: 'pastor_structure', label: 'Estrutura' },
  { kind: 'pastor_liturgy', label: 'Liturgia' },
  { kind: 'pastor_verses', label: 'Versículos' },
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
  pageDescription = 'Crie a timeline litúrgica, publique uma OnePage e acompanhe check-ins, anotações e postagens ligadas a igreja.',
}) => {
  const { currentUser, userProfile, showNotification, recordActivity, checkFeatureAccess, incrementUsage } = useAuth();
  const { settings } = useSettings();
  const churchData = userProfile?.churchData;
  const [services, setServices] = useState<ChurchService[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(initialMode === 'create');
  const [activeEditorStep, setActiveEditorStep] = useState<EditorStep>('overview');
  const [serviceView, setServiceView] = useState<'list' | 'calendar'>(initialView);
  const [serviceTemporalFilter, setServiceTemporalFilter] = useState<ServiceTemporalFilter>('active');
  const [currentTime, setCurrentTime] = useState(() => new Date());
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
  const [servicePlanningSummary, setServicePlanningSummary] = useState('');
  const [newMinistryName, setNewMinistryName] = useState('');
  const [newMinistryDescription, setNewMinistryDescription] = useState('');
  const [selectedMinistryId, setSelectedMinistryId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [ministryRole, setMinistryRole] = useState('');
  const [scheduleMinistryId, setScheduleMinistryId] = useState('');
  const [scheduleMemberId, setScheduleMemberId] = useState('');
  const [scheduleRole, setScheduleRole] = useState('');
  const [replacementMemberByAssignment, setReplacementMemberByAssignment] = useState<Record<string, string>>({});
  const [loadingSongTextKey, setLoadingSongTextKey] = useState<string | null>(null);
  const [expandedSongTextKey, setExpandedSongTextKey] = useState<string | null>(null);
  const [expandedLiturgyItemId, setExpandedLiturgyItemId] = useState<string | null>(null);
  const [draggedLiturgyItemId, setDraggedLiturgyItemId] = useState<string | null>(null);
  const [savedFormSnapshot, setSavedFormSnapshot] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [liveVerseRef, setLiveVerseRef] = useState('');
  const [liveVerseText, setLiveVerseText] = useState('');
  const [liveExplanation, setLiveExplanation] = useState('');
  const [serviceLimit, setServiceLimit] = useState<{ allowed: boolean; used: number; limit: number | null }>({ allowed: true, used: 0, limit: null });
  const [isCurrentChurchManager, setIsCurrentChurchManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyVerseSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialEditHydratedRef = useRef<string | null>(null);
  const recoveredDraftKeyRef = useRef<string | null>(null);

  const [title, setTitle] = useState('Culto de Celebracao');
  const [theme, setTheme] = useState('');
  const [preacherName, setPreacherName] = useState(userProfile?.displayName ?? '');
  const [serviceType, setServiceType] = useState<ChurchServiceType>('sunday');
  const [modality, setModality] = useState<ChurchServiceModality>('presencial');
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
  const serviceTypeLabel = SERVICE_TYPES.find((type) => type.value === serviceType)?.label ?? 'Culto';
  const formSnapshot = useMemo(() => JSON.stringify({
    title,
    theme,
    preacherName,
    serviceType,
    modality,
    status,
    startsAt,
    endsAt,
    keyVerseRef,
    keyVerseText,
    bannerUrl,
    liveUrl,
    liturgyItems,
  }), [bannerUrl, endsAt, keyVerseRef, keyVerseText, liturgyItems, liveUrl, modality, preacherName, serviceType, startsAt, status, theme, title]);
  const hasUnsavedChanges = showForm && savedFormSnapshot !== '' && formSnapshot !== savedFormSnapshot;
  const localDraftKey = showForm ? `${LOCAL_DRAFT_PREFIX}:${editingServiceId ?? 'new'}:${churchData?.churchId ?? 'no-church'}` : '';
  const calendarRange = useMemo(() => getCalendarMonthRange(calendarDate), [calendarDate]);
  const visibleServices = useMemo(
    () => services.filter((service) => matchesServiceTemporalFilter(getServiceTemporalState(service, currentTime), serviceTemporalFilter)),
    [currentTime, serviceTemporalFilter, services],
  );
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  );
  const editingService = useMemo(
    () => services.find((service) => service.id === editingServiceId) ?? null,
    [editingServiceId, services],
  );
  const publicServicePath = editingService?.slug ? `/culto/${editingService.slug}` : '';
  const publicServiceUrl = publicServicePath
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${publicServicePath}`
    : '';
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
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

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
        // MVP barato: a lista usa contadores j? cacheados em church_services.
        // Estatisticas completas so sao carregadas quando o gestor abre um culto.
        setServiceStats(Object.fromEntries(loaded.map((service) => [service.id, statsFromServiceRow(service)])));
      } catch {
        showNotification('Não foi possível carregar os cultos.', 'error');
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
    const hydrationKey = `${initialServiceId}:${initialEdit ? 'edit' : 'view'}`;
    if (initialEditHydratedRef.current === hydrationKey) return;
    initialEditHydratedRef.current = hydrationKey;
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

  useEffect(() => {
    if (!showForm) return;
    if (!savedFormSnapshot) setSavedFormSnapshot(formSnapshot);
    if (expandedLiturgyItemId && liturgyItems.some((item) => item.id === expandedLiturgyItemId)) return;
    setExpandedLiturgyItemId(liturgyItems[0]?.id ?? null);
  }, [expandedLiturgyItemId, formSnapshot, liturgyItems, savedFormSnapshot, showForm]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!localDraftKey || !hasUnsavedChanges) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(localDraftKey, JSON.stringify({
          savedAt: new Date().toISOString(),
          snapshot: formSnapshot,
        }));
      } catch {
        // Falha de storage não deve interromper a edição do culto.
      }
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [formSnapshot, hasUnsavedChanges, localDraftKey]);

  useEffect(() => {
    if (!showForm || !localDraftKey || !savedFormSnapshot || recoveredDraftKeyRef.current === localDraftKey) return;
    recoveredDraftKeyRef.current = localDraftKey;
    try {
      const rawDraft = window.localStorage.getItem(localDraftKey);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as { savedAt?: string; snapshot?: string };
      if (!draft.snapshot || draft.snapshot === savedFormSnapshot) return;
      const savedLabel = draft.savedAt
        ? new Date(draft.savedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : 'anteriormente';
      if (window.confirm(`Existe um rascunho local deste culto salvo em ${savedLabel}. Deseja restaurar?`)) {
        applyFormSnapshot(draft.snapshot);
      }
    } catch {
      // Rascunho corrompido e ignorado para manter o editor funcional.
    }
  }, [localDraftKey, savedFormSnapshot, showForm]);

  const liturgySummary = useMemo(
    () => liturgyItems.filter((item) => item.title.trim()).map((item) => item.title).join(' -> '),
    [liturgyItems],
  );

  const liturgyTiming = useMemo(() => {
    const availableMinutes = Math.max(0, timeToMinutes(serviceEndTime) - timeToMinutes(serviceStartTime));
    const sorted = [...liturgyItems].sort((a, b) => timeToMinutes(a.startsAt) - timeToMinutes(b.startsAt));
    const itemsWithDuration = sorted.map((item, index) => {
      const current = timeToMinutes(item.startsAt);
      const next = sorted[index + 1] ? timeToMinutes(sorted[index + 1].startsAt) : timeToMinutes(serviceEndTime);
      return {
        id: item.id,
        duration: Math.max(0, next - current),
      };
    });
    const plannedMinutes = itemsWithDuration.reduce((total, item) => total + item.duration, 0);
    const percent = availableMinutes > 0 ? Math.min(100, Math.round((plannedMinutes / availableMinutes) * 100)) : 0;
    return {
      availableMinutes,
      plannedMinutes,
      remainingMinutes: availableMinutes - plannedMinutes,
      percent,
      itemsWithDuration,
    };
  }, [liturgyItems, serviceEndTime, serviceStartTime]);

  const reviewIssues = useMemo<ReviewIssue[]>(() => {
    const issues: ReviewIssue[] = [];
    const firstWorshipWithoutSongs = liturgyItems.find((item) => item.kind === 'worship' && getSongItems(item).filter((song) => song.trim()).length === 0);
    const firstWorshipWithFewSongs = liturgyItems.find((item) => item.kind === 'worship' && getSongItems(item).filter((song) => song.trim()).length > 0 && getSongItems(item).filter((song) => song.trim()).length < 3);
    const firstOfferingWithoutPix = liturgyItems.find((item) => item.kind === 'offering' && !item.pixKey?.trim());
    const firstItemWithoutResponsible = liturgyItems.find((item) => !item.responsible?.trim());

    if (!title.trim()) issues.push({ message: 'Informe o nome do culto.', target: 'overview', selector: '[data-review-target="title"]' });
    if (!theme.trim()) issues.push({ message: 'Defina a mensagem central.', target: 'planning', selector: '[data-review-target="theme"]' });
    if (!keyVerseRef.trim()) issues.push({ message: 'Escolha o versículo-chave.', target: 'planning', selector: '[data-review-target="key-verse"]' });
    if (!bannerUrl.trim()) issues.push({ message: 'Adicione uma imagem de capa para o culto.', target: 'overview', selector: '[data-review-target="banner"]' });
    if (liveUrl.trim() && !isSafeLiveUrl(liveUrl)) issues.push({ message: 'Corrija o link HTTPS da transmissão.', target: 'overview', selector: '[data-review-target="live-url"]' });
    if (liturgyItems.length === 0) issues.push({ message: 'Adicione pelo menos um momento na programação.', target: 'planning', selector: '[data-review-target="liturgy-list"]' });
    if (firstWorshipWithoutSongs) issues.push({ message: 'Adicione músicas ao momento de louvor.', target: 'planning', selector: `[data-review-target="liturgy-worship-${firstWorshipWithoutSongs.id}"]`, liturgyItemId: firstWorshipWithoutSongs.id });
    if (firstWorshipWithFewSongs) issues.push({ message: 'Sugira pelo menos 3 louvores no momento de adoração.', target: 'planning', selector: `[data-review-target="liturgy-worship-${firstWorshipWithFewSongs.id}"]`, liturgyItemId: firstWorshipWithFewSongs.id });
    if (firstOfferingWithoutPix) issues.push({ message: 'Informe a chave PIX no momento de dízimos e ofertas.', target: 'planning', selector: `[data-review-target="liturgy-offering-pix-${firstOfferingWithoutPix.id}"]`, liturgyItemId: firstOfferingWithoutPix.id });
    if (firstItemWithoutResponsible) issues.push({ message: 'Existem momentos sem responsável definido.', target: 'planning', selector: `[data-review-target="liturgy-responsible-${firstItemWithoutResponsible.id}"]`, liturgyItemId: firstItemWithoutResponsible.id });
    if (liturgyTiming.remainingMinutes < 0) issues.push({ message: `A programação ultrapassa o horário previsto em ${Math.abs(liturgyTiming.remainingMinutes)} min.`, target: 'planning', selector: '[data-review-target="liturgy-timing"]' });
    return issues;
  }, [bannerUrl, keyVerseRef, liturgyItems, liturgyTiming.remainingMinutes, liveUrl, theme, title]);

  const completedEditorSteps = useMemo<Record<EditorStep, boolean>>(() => ({
    overview: Boolean(title.trim() && serviceDate && serviceStartTime && serviceEndTime),
    planning: Boolean(theme.trim() && keyVerseRef.trim()) && liturgyItems.length > 0 && liturgyTiming.plannedMinutes > 0,
    review: reviewIssues.length === 0,
  }), [keyVerseRef, liturgyItems.length, liturgyTiming.plannedMinutes, reviewIssues.length, serviceDate, serviceEndTime, serviceStartTime, status, theme, title]);

  const getLiturgyItemDuration = (itemId: string) => liturgyTiming.itemsWithDuration.find((item) => item.id === itemId)?.duration ?? 0;
  const activeEditorStepIndex = EDITOR_STEPS.findIndex((step) => step.id === activeEditorStep);
  const previousEditorStep = EDITOR_STEPS[activeEditorStepIndex - 1]?.id;
  const nextEditorStep = EDITOR_STEPS[activeEditorStepIndex + 1]?.id;
  const reviewChecklist: { label: string; done: boolean; target: EditorStep }[] = [
    { label: 'Informações do culto', done: completedEditorSteps.overview, target: 'overview' },
    { label: 'Mensagem central', done: Boolean(theme.trim()), target: 'planning' },
    { label: 'Programação', done: liturgyItems.length > 0 && liturgyTiming.plannedMinutes > 0, target: 'planning' },
    { label: 'Versículo-chave', done: Boolean(keyVerseRef.trim()), target: 'planning' },
    { label: 'Capa do culto', done: Boolean(bannerUrl.trim()), target: 'overview' },
    { label: 'Transmissão valida', done: !liveUrl.trim() || isSafeLiveUrl(liveUrl), target: 'overview' },
    { label: 'Músicas definidas', done: liturgyItems.some((item) => item.kind === 'worship' && getSongItems(item).some((song) => song.trim())), target: 'planning' },
    { label: 'Oférta configurada', done: !liturgyItems.some((item) => item.kind === 'offering') || liturgyItems.some((item) => item.kind === 'offering' && item.pixKey?.trim()), target: 'planning' },
    { label: 'Responsaveis definidos', done: !liturgyItems.some((item) => !item.responsible?.trim()), target: 'planning' },
  ];
  const completedReviewItems = reviewChecklist.filter((item) => item.done).length;
  const reviewCompletionPercent = reviewChecklist.length > 0 ? Math.round((completedReviewItems / reviewChecklist.length) * 100) : 0;

  const focusReviewIssue = (issue: ReviewIssue) => {
    setActiveEditorStep(issue.target);
    if (issue.liturgyItemId) setExpandedLiturgyItemId(issue.liturgyItemId);

    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(issue.selector);
      if (!target) return;

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = target.matches('input, textarea, select, button, a')
        ? target
        : target.querySelector<HTMLElement>('input, textarea, select, button, a');
      focusable?.focus({ preventScroll: true });
    }, 120);
  };
  const saveStateLabel = hasUnsavedChanges
    ? 'Alterações não salvas'
    : lastSavedAt
      ? `Salvo ${lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      : 'Pronto para editar';

  const markFormSnapshotSaved = (snapshot = formSnapshot) => {
    setSavedFormSnapshot(snapshot);
    setLastSavedAt(new Date());
    if (localDraftKey) {
      try {
        window.localStorage.removeItem(localDraftKey);
      } catch {
        // Storage indisponível não deve bloquear o salvamento do culto.
      }
    }
  };

  const applyFormSnapshot = (snapshot: string) => {
    try {
      const draft = JSON.parse(snapshot);
      setTitle(draft.title ?? title);
      setTheme(draft.theme ?? '');
      setPreacherName(draft.preacherName ?? userProfile?.displayName ?? '');
      setServiceType(draft.serviceType ?? 'sunday');
      setModality(normalizeServiceModality(draft.modality) ?? 'presencial');
      setStatus(draft.status ?? 'published');
      setStartsAt(draft.startsAt ?? todayAt('19:00'));
      setEndsAt(draft.endsAt ?? todayAt('21:00'));
      setKeyVerseRef(draft.keyVerseRef ?? '');
      setKeyVerseText(draft.keyVerseText ?? '');
      setKeyVerseSearchState(draft.keyVerseText ? 'found' : 'idle');
      setBannerUrl(draft.bannerUrl ?? '');
      setLiveUrl(draft.liveUrl ?? '');
      setLiturgyItems(Array.isArray(draft.liturgyItems) ? draft.liturgyItems : createDefaultLiturgy());
      setActiveEditorStep('overview');
      setLastSavedAt(null);
      showNotification('Rascunho local restaurado.', 'success');
    } catch {
      showNotification('Não foi possível restaurar o rascunho local.', 'error');
    }
  };

  const closeEditor = () => {
    if (hasUnsavedChanges && !window.confirm('Existem alterações não salvas neste culto. Deseja sair mesmo assim?')) return;
    setShowForm(false);
    resetForm();
  };

  const updateLiturgyItem = (id: string, updates: Partial<ServiceLiturgyItem>) => {
    setLiturgyItems((items) => items.map((item) => item.id === id ? { ...item, ...updates } : item));
  };

  const addLiturgyItem = () => {
    const newId = `draft_other_${Date.now()}`;
    setLiturgyItems((items) => [
      ...items,
      {
        id: newId,
        kind: 'other',
        title: 'Novo momento',
        startsAt: items.at(-1)?.startsAt ?? '21:00',
        responsible: '',
        notes: '',
        sortOrder: items.length,
      },
    ]);
    setExpandedLiturgyItemId(newId);
  };

  const duplicateLiturgyItem = (id: string) => {
    const newId = `draft_copy_${Date.now()}`;
    setLiturgyItems((items) => {
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) return items;
      const source = items[index];
      const copy: ServiceLiturgyItem = {
        ...source,
        id: newId,
        title: `${source.title} (cópia)`,
        sortOrder: index + 1,
      };
      return [
        ...items.slice(0, index + 1),
        copy,
        ...items.slice(index + 1),
      ].map((item, itemIndex) => ({ ...item, sortOrder: itemIndex }));
    });
    setExpandedLiturgyItemId(newId);
  };

  const reorderLiturgyItem = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setLiturgyItems((items) => {
      const sourceIndex = items.findIndex((item) => item.id === sourceId);
      const targetIndex = items.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return items;
      const next = [...items];
      const [source] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, source);
      return next.map((item, index) => ({ ...item, sortOrder: index }));
    });
  };

  const recalculateLiturgyTimes = () => {
    const times = buildTimelineTimes(serviceStartTime, serviceEndTime, liturgyItems.length);
    setLiturgyItems((items) => items.map((item, index) => ({ ...item, startsAt: times[index] ?? item.startsAt, sortOrder: index })));
    showNotification('Horários recalculados dentro do periodo do culto.', 'success');
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
      const previousTitle = songs[index]?.trim();
      const nextTitle = value.trim();
      const songTexts = { ...(item.songTexts ?? {}) };
      const songLeaders = { ...(item.songLeaders ?? {}) };
      if (previousTitle && nextTitle && previousTitle !== nextTitle && songTexts[previousTitle] && !songTexts[nextTitle]) {
        songTexts[nextTitle] = songTexts[previousTitle];
        delete songTexts[previousTitle];
      }
      if (previousTitle && nextTitle && previousTitle !== nextTitle && songLeaders[previousTitle] && !songLeaders[nextTitle]) {
        songLeaders[nextTitle] = songLeaders[previousTitle];
        delete songLeaders[previousTitle];
      }
      songs[index] = value;
      return { ...item, songList: songs.join('\n'), songTexts, songLeaders };
    }));
  };

  const updateSongLeader = (id: string, song: string, value: string) => {
    const title = song.trim();
    if (!title) return;
    updateLiturgyItem(id, {
      songLeaders: {
        ...(liturgyItems.find((item) => item.id === id)?.songLeaders ?? {}),
        [title]: value,
      },
    });
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

  const loadSongText = async (item: ServiceLiturgyItem, song: string, index: number) => {
    const title = song.trim();
    if (!title) {
      showNotification('Informe o nome da música para buscar o texto.', 'warning');
      return;
    }

    const key = `${item.id}_${index}`;
    setLoadingSongTextKey(key);
    try {
      const context = [theme, keyVerseRef, servicePlanningFocus].filter(Boolean).join(' | ');
      const songText = await cultoPlusService.generateSongLyricsText(title, context);
      updateLiturgyItem(item.id, {
        songTexts: {
          ...(item.songTexts ?? {}),
          [title]: songText,
        },
      });
      setExpandedSongTextKey(key);
      showNotification('Texto carregado para o louvor.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Não foi possível carregar o texto da música.', 'error');
    } finally {
      setLoadingSongTextKey(null);
    }
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
    setModality('presencial');
    setStatus('published');
    setStartsAt(todayAt('19:00'));
    setEndsAt(todayAt('21:00'));
    setKeyVerseRef('');
    setKeyVerseText('');
    setKeyVerseSearchState('idle');
    setServicePlanningFocus('');
    setServicePlanningSummary('');
    setBannerUrl('');
    setLiveUrl('');
    setLiturgyItems(createDefaultLiturgy());
    setActiveEditorStep('overview');
    setExpandedLiturgyItemId(null);
    setSavedFormSnapshot('');
    setLastSavedAt(null);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
    setActiveEditorStep('overview');
    setSavedFormSnapshot('');
    setLastSavedAt(null);
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
    setActiveEditorStep('overview');
    setSavedFormSnapshot('');
    setLastSavedAt(null);
  };

  const startEdit = (service: ChurchService) => {
    setEditingServiceId(service.id);
    setTitle(service.title);
    setTheme(service.theme);
    setPreacherName(service.preacherName);
    setServiceType(service.serviceType);
    setModality(getServiceModality(service));
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
    setActiveEditorStep('overview');
    setExpandedLiturgyItemId(service.liturgyItems[0]?.id ?? null);
    setSavedFormSnapshot('');
    setLastSavedAt(service.updatedAt ? new Date(service.updatedAt) : null);
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
      showNotification('Não foi possível enviar o banner.', 'error');
    } finally {
      setUploadingBanner(false);
      event.target.value = '';
    }
  };

  const handleCopyPublicLink = async () => {
    if (!publicServiceUrl) {
      showNotification('Salve o culto para gerar o link público.', 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(publicServiceUrl);
      showNotification('Link público cópiado.', 'success');
    } catch {
      showNotification('Não foi possível cópiar o link.', 'error');
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
      showNotification('Ministério criado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Não foi possível criar o ministério.', 'error');
    }
  };

  const addMemberToMinistry = async () => {
    const ministry = ministries.find((item) => item.id === selectedMinistryId);
    const member = churchMembers.find((item) => item.uid === selectedMemberId);
    if (!ministry || !member) {
      showNotification('Selecione o ministério e o membro.', 'warning');
      return;
    }
    try {
      const entry = await cultoPlusService.addMinistryMember(ministry, member, ministryRole.trim());
      setMinistryMembers((items) => [entry, ...items.filter((item) => !(item.ministryId === ministry.id && item.userId === member.uid))]);
      setSelectedMemberId('');
      setMinistryRole('');
      showNotification('Membro vinculado ao ministério.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Não foi possível vincular o membro.', 'error');
    }
  };

  const createScheduleAssignment = async () => {
    if (!selectedService) return;
    const ministry = ministries.find((item) => item.id === scheduleMinistryId);
    const member = churchMembers.find((item) => item.uid === scheduleMemberId);
    if (!ministry || !member) {
      showNotification('Selecione o ministério e o membro da escala.', 'warning');
      return;
    }
    try {
      const assignment = await cultoPlusService.createScheduleAssignment(selectedService, ministry, member, scheduleRole.trim());
      setScheduleAssignments((items) => [assignment, ...items.filter((item) => !(item.serviceId === selectedService.id && item.ministryId === ministry.id && item.userId === member.uid))]);
      setScheduleMemberId('');
      setScheduleRole('');
      showNotification('Escala criada para o culto.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Não foi possível criar a escala.', 'error');
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: ServiceScheduleAssignment['status']) => {
    try {
      await cultoPlusService.updateScheduleAssignmentStatus(assignmentId, status);
      setScheduleAssignments((items) => items.map((item) => item.id === assignmentId ? { ...item, status, updatedAt: new Date().toISOString() } : item));
      showNotification('Status da escala atualizado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Não foi possível atualizar a escala.', 'error');
    }
  };

  const markReminderSent = async (assignmentId: string) => {
    try {
      await cultoPlusService.markScheduleReminderSent(assignmentId);
      const reminderSentAt = new Date().toISOString();
      setScheduleAssignments((items) => items.map((item) => item.id === assignmentId ? { ...item, reminderSentAt, updatedAt: reminderSentAt } : item));
      showNotification('Lembrete registrado na escala.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Não foi possível registrar o lembrete.', 'error');
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
      showNotification(error?.message || 'Não foi possível substituir a escala.', 'error');
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
      showNotification(error?.message || 'Não foi possível sincronizar o culto.', 'error');
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
      showNotification('Conteúdo gerado com IA.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Não foi possível gerar com IA.', 'error');
    } finally {
      setAiLoadingKind(null);
    }
  };

  const generateServicePlanFromAi = async (promptOverride?: string) => {
    if (!currentUser) return;
    if (!canUsePastoralAiFeatures) {
      showNotification('Planejamento com IA esta disponível para perfis Pastor/Gestor ou planos com recursos pastorais.', 'warning');
      return;
    }

    setGeneratingServicePlan(true);
    try {
      const normalizedServiceStartTime = normalizeTime24h(serviceStartTime, '19:00');
      const normalizedServiceEndTime = normalizeTime24h(serviceEndTime, '21:00');
      setStartsAt(buildDateTimeLocal(serviceDate, normalizedServiceStartTime));
      setEndsAt(buildDateTimeLocal(serviceDate, normalizedServiceEndTime));

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
        showNotification('Informe um versículo-chave ou tente novamente para usar o versículo do dia.', 'warning');
        return;
      }

      const suggestion = await cultoPlusService.generateServicePlanning({
        verseReference,
        verseText,
        userPrompt: (promptOverride ?? servicePlanningPrompt).trim(),
        serviceStartTime: normalizedServiceStartTime,
        serviceEndTime: normalizedServiceEndTime,
      });

      if (suggestion.title) setTitle(suggestion.title);
      if (suggestion.theme) setTheme(suggestion.theme);
      if (suggestion.serviceType) setServiceType(suggestion.serviceType);
      setServicePlanningFocus(suggestion.pastoralFocus ?? '');

      if (suggestion.liturgyItems?.length) {
        const plannedItems = buildPlannedLiturgyItems(suggestion.liturgyItems, normalizedServiceStartTime, normalizedServiceEndTime);
        setLiturgyItems(plannedItems);
        setServicePlanningSummary(summarizeCreatedMoments(plannedItems));
      } else {
        setServicePlanningSummary('');
      }

      await incrementUsage('analysis');
      showNotification('Planejamento do culto aplicado.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Não foi possível gerar o planejamento.', 'error');
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
      showNotification(error?.message || 'Não foi possível exportar.', 'error');
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
      showNotification(error?.message || 'Não foi possível atualizar o estado do culto.', 'error');
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
      showNotification('Informe um link HTTPS válido para a live.', 'warning');
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
        modality,
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
        markFormSnapshotSaved();
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
      markFormSnapshotSaved();
      setShowForm(false);
      resetForm();
      await recordActivity('create_sermon', `Criou Culto+: ${service.title}`, { serviceId: service.id });
      showNotification('Culto criado e OnePage públicada.', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Não foi possível criar o culto.', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!showForm) return;
    const handleEditorShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSubmit();
      }
    };
    window.addEventListener('keydown', handleEditorShortcut);
    return () => window.removeEventListener('keydown', handleEditorShortcut);
  }, [showForm, formSnapshot]);

  return (
    <section className="w-full max-w-none bg-white p-4 dark:bg-bible-darkPaper md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => showForm ? closeEditor() : undefined}
            className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-emerald-700"
          >
            <ArrowUp className="-rotate-90" size={14} />
            Cultos
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-bible-gold">Culto+</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white">
            <Radio className="text-bible-gold" />
            {showForm ? title : pageTitle}
            {showForm && (
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${SERVICE_STATUS_STYLES[status]}`}>
                {SERVICE_STATUS_LABELS[status]}
              </span>
            )}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {showForm ? `${serviceTypeLabel} • ${formatServiceDate(startsAt)} • ${serviceStartTime} as ${serviceEndTime}` : pageDescription}
          </p>
          {showForm && (
            <p className={`mt-2 text-xs font-bold ${hasUnsavedChanges ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {saveStateLabel}. Clique em salvar para persistir no culto.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {showForm && (
            <Link
              href={editingServiceId && services.find((service) => service.id === editingServiceId)?.slug ? `/culto/${services.find((service) => service.id === editingServiceId)?.slug}` : '/workspace-pastoral/cultos'}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-bible-darkPaper dark:text-gray-200"
            >
              <Eye size={16} />
              Visualizar
            </Link>
          )}
          {showForm && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              title={editingServiceId ? 'Salvar as alterações deste culto.' : 'Publicar a OnePage deste culto.'}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:ring-emerald-900/40"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingServiceId ? 'Salvar alterações' : 'Publicar OnePage'}
            </button>
          )}
          <button
            onClick={() => showForm ? closeEditor() : startCreate()}
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

      {canCreate && !showForm && (
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
                planMatrix.exports && 'Exportações',
                planMatrix.advancedAnalytics && 'Analytics',
              ].filter(Boolean).join(' · ') || 'Básico'}
            </p>
          </div>
        </div>
      )}

      {canCreate && showForm && (
        <div className="mt-8 space-y-6 rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
          <datalist id="culto-plus-time-options">
            {TIME_OPTIONS.map((time) => <option key={time} value={time} />)}
          </datalist>
          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper md:grid-cols-3">
            {EDITOR_STEPS.map((step, index) => {
              const isActive = activeEditorStep === step.id;
              const isComplete = completedEditorSteps[step.id];
              const hasIssue = (step.id === 'planning' || step.id === 'review') && reviewIssues.length > 0;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveEditorStep(step.id)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`${step.label}: ${isComplete ? 'completa' : hasIssue ? 'possui pendência' : 'não iniciada'}`}
                  className={`flex min-h-16 items-center gap-3 rounded-xl px-3 text-left transition ${isActive ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'} ${hasIssue && !isActive ? 'ring-1 ring-amber-200 dark:ring-amber-900/50' : ''}`}
                >
                  <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isActive ? 'bg-white text-emerald-700' : isComplete ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : hasIssue ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-900'}`}>
                    {isComplete ? <CheckCircle2 size={14} /> : hasIssue ? '!' : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-xs font-black ${isActive ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{step.label}</span>
                    <span className={`mt-0.5 block text-[10px] font-semibold ${isActive ? 'text-emerald-50/80' : 'text-gray-400'}`}>{step.helper}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
          <div className={`${activeEditorStep === 'overview' || activeEditorStep === 'planning' ? 'grid' : 'hidden'} grid-cols-1 gap-4 md:grid-cols-2`}>
            <div className={activeEditorStep === 'overview' ? 'grid grid-cols-1 gap-4 md:grid-cols-[1fr_150px_150px_140px] md:col-span-2' : 'hidden'}>
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
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hora início</span>
                <input
                  type="text"
                  list="culto-plus-time-options"
                  inputMode="numeric"
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  placeholder="18:00"
                  value={serviceStartTime}
                  title="Informe o horário de início no formato 24 horas."
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
                  title="Informe o horário previsto de encerramento no formato 24 horas."
                  onChange={(event) => setEndsAt(buildDateTimeLocal(serviceDate, maskTimeInput(event.target.value)))}
                  onBlur={(event) => setEndsAt(buildDateTimeLocal(serviceDate, normalizeTime24h(event.target.value, serviceEndTime)))}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper"
                />
              </label>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duracao prevista</span>
                <div className="flex min-h-[46px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 dark:border-gray-700 dark:bg-bible-darkPaper dark:text-gray-200">
                  {formatMinutesDuration(liturgyTiming.availableMinutes)}
                </div>
              </div>
            </div>
            <label className={activeEditorStep === 'overview' ? 'space-y-1' : 'hidden'}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nome do culto</span>
              <input data-review-target="title" value={title} onChange={(event) => setTitle(event.target.value)} title="Informe o nome público do culto que aparecera na OnePage." className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
            </label>
            <label className={activeEditorStep === 'overview' ? 'space-y-1' : 'hidden'}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipo</span>
              <SelectShell>
                <select value={serviceType} onChange={(event) => setServiceType(event.target.value as ChurchServiceType)} title="Escolha a categoria deste culto para organizacao e filtros." className="w-full appearance-none rounded-2xl border border-gray-200 bg-white py-3 pl-4 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                  {SERVICE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </SelectShell>
            </label>
            <label className={activeEditorStep === 'overview' ? 'space-y-1' : 'hidden'}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Modalidade</span>
              <SelectShell>
                <select
                  value={modality}
                  onChange={(event) => setModality(event.target.value as ChurchServiceModality)}
                  title="Defina se a participação é presencial, online ou híbrida. A agenda pública usa esta informação nos filtros e selos."
                  className="w-full appearance-none rounded-2xl border border-gray-200 bg-white py-3 pl-4 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper"
                >
                  {SERVICE_MODALITY_VALUES.map((value) => (
                    <option key={value} value={value}>{SERVICE_MODALITY_META[value].label}</option>
                  ))}
                </select>
              </SelectShell>
              <p className="text-xs font-medium text-gray-400">{SERVICE_MODALITY_META[modality].description}</p>
            </label>
            <label className={activeEditorStep === 'overview' ? 'space-y-1' : 'hidden'}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</span>
              <SelectShell>
                <select value={status} onChange={(event) => setStatus(event.target.value as ChurchServiceStatus)} title="Defina se o culto fica como rascunho, publicado, ao vivo ou encerrado." className="w-full appearance-none rounded-2xl border border-gray-200 bg-white py-3 pl-4 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                  {SERVICE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </SelectShell>
            </label>
            <label className={activeEditorStep === 'planning' ? 'space-y-1 md:col-span-2' : 'hidden'}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tema da mensagem</span>
              <input data-review-target="theme" value={theme} onChange={(event) => setTheme(event.target.value)} title="Descreva o tema ou subtitulo da mensagem do culto." placeholder="Ex.: Vivendo pela fé" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
            </label>
            <label className={activeEditorStep === 'overview' ? 'space-y-1' : 'hidden'}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pastor responsável</span>
              <input value={preacherName} onChange={(event) => setPreacherName(event.target.value)} title="Informe o pastor ou responsável pela mensagem." className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
            </label>
            <label className={activeEditorStep === 'overview' ? 'space-y-1 md:col-span-2' : 'hidden'}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Link da live</span>
              <div className="relative">
                <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  data-review-target="live-url"
                  value={liveUrl}
                  onChange={(event) => setLiveUrl(event.target.value)}
                  title="Cole o link HTTPS da transmissão ao vivo, como YouTube, Facebook, Instagram ou Zoom."
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper"
                />
              </div>
              <p className="text-xs font-medium text-gray-400">Opcional. Use quando o culto tiver transmissão ao vivo externa.</p>
            </label>
            <div data-review-target="banner" className={activeEditorStep === 'overview' ? 'space-y-2 md:col-span-2' : 'hidden'}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Capa do culto</span>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px] md:items-end">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-bible-darkPaper">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Capa do culto" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 text-gray-400 dark:from-emerald-950/20 dark:via-bible-darkPaper dark:to-amber-950/10">
                      <ImageIcon size={28} />
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingBanner} title="Enviar uma imagem de banner para este culto." className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-bible-gold disabled:opacity-50 dark:border-gray-700 dark:bg-bible-darkPaper dark:text-gray-200" aria-label="Enviar banner">
                  {uploadingBanner ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  Alterar imagem
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
              </div>
            </div>
            <div className={activeEditorStep === 'planning' ? 'space-y-2 md:col-span-2' : 'hidden'}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Versículo-chave</span>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/40 dark:text-emerald-300/50" size={17} />
                    <input
                      data-review-target="key-verse"
                      value={keyVerseRef}
                      maxLength={40}
                      onChange={(event) => {
                        setKeyVerseRef(event.target.value);
                        if (!event.target.value.trim()) {
                          setKeyVerseText('');
                          setKeyVerseSearchState('idle');
                        }
                      }}
                      title="Informe a referencia bíblica principal do culto."
                      placeholder="Joao 15:5"
                      className="w-full rounded-2xl border border-emerald-100 bg-white py-3 pl-11 pr-11 text-sm font-black text-gray-900 outline-none shadow-sm transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-900/40 dark:bg-bible-darkPaper dark:text-white dark:focus:ring-emerald-950/40"
                    />
                    {searchingKeyVerse && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-700 dark:text-emerald-300" size={16} />}
                  </div>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Texto do versículo</span>
                  <textarea
                    value={keyVerseText}
                    onChange={(event) => {
                      setKeyVerseText(event.target.value);
                      if (event.target.value.trim()) setKeyVerseSearchState('found');
                    }}
                    title="Revise ou edite o texto do versículo-chave que aparecera na OnePage."
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
                  Não encontrei essa referencia. Confira o livro, capitulo e versículo.
                </p>
              )}
            </div>
          </div>

          <div className={`${activeEditorStep === 'planning' ? 'block' : 'hidden'} overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-bible-darkPaper`}>
            <div className="flex flex-col gap-4 bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] p-4 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-50/80">Assistente do Culto+</p>
                <h3 className="mt-1 flex items-center gap-2 text-base font-black">
                  <Sparkles size={17} className="text-[#f3d28a]" />
                  IA contextual para mensagem e programação
                </h3>
                <p className="mt-2 text-xs font-semibold text-emerald-50/80">
                  Gere tema, estrutura, momentos e músicas sem sair da etapa Mensagem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPlanner(true)}
                title="Abrir o assistente lateral do Culto+."
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/12 px-4 text-[10px] font-black uppercase tracking-widest ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Abrir assistente
              </button>
            </div>
          </div>

          {showAiPlanner && (
            <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Assistente do Culto+">
              <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-bible-darkPaper">
                <div className="flex items-start justify-between gap-4 border-b border-emerald-100 p-5 dark:border-emerald-900/40">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">Assistente do Culto+</p>
                    <h3 className="mt-1 text-xl font-black text-gray-900 dark:text-white">Planejamento com IA</h3>
                    <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Base: {keyVerseRef || 'versículo do dia'} • {serviceStartTime} as {serviceEndTime}</p>
                  </div>
                  <button type="button" onClick={() => setShowAiPlanner(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900" aria-label="Fechar assistente">
                    <Plus className="rotate-45" size={18} />
                  </button>
                </div>
                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      ['Gerar tema', 'Gere um tema pastoral claro, titulo do culto e foco central a partir do versículo-chave.'],
                      ['Criar introdução', 'Crie uma introdução pastoral breve, acolhedora e bíblica para abrir a mensagem.'],
                      ['Sugerir estrutura', 'Sugira uma estrutura de mensagem com início, desenvolvimento, aplicação e resposta.'],
                      ['Sugerir momentos', 'Monte uma programação litúrgica equilibrada dentro do horário do culto.'],
                      ['Sugerir músicas', 'Sugira exatamente 3 louvores congregacionais coerentes com o tema e versículo.'],
                    ].map(([label, prompt]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setServicePlanningPrompt(prompt);
                          void generateServicePlanFromAi(prompt);
                        }}
                        disabled={generatingServicePlan}
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-left text-sm font-black text-emerald-900 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={servicePlanningPrompt}
                    onChange={(event) => setServicePlanningPrompt(event.target.value)}
                    title="Descreva o foco pastoral desejado para a IA sugerir planejamento do culto."
                    placeholder="Ex.: culto evangelístico para famílias, foco em restauração, encerrando com apelo e oração pelos lares."
                    className="min-h-36 w-full resize-none rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm font-medium leading-relaxed text-gray-800 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/15 dark:text-gray-100 dark:focus:ring-emerald-950/40"
                  />
                  {servicePlanningFocus && (
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-[#fff8e8] p-4 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-bible-darkPaper dark:to-amber-950/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">Foco sugerido</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">{servicePlanningFocus}</p>
                    </div>
                  )}
                  {servicePlanningSummary && (
                    <div className="rounded-2xl border border-amber-100 bg-[#fff8e8] p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8a6a2f] dark:text-[#f3d28a]">Momentos criados</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-200">{servicePlanningSummary}</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-emerald-100 p-5 dark:border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => generateServicePlanFromAi()}
                    disabled={generatingServicePlan}
                    title="Gerar sugestoes de titulo, tema e liturgia com base no prompt informado."
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 dark:ring-emerald-900/40"
                  >
                    {generatingServicePlan ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Gerar e aplicar planejamento
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={activeEditorStep === 'planning' ? 'block' : 'hidden'}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Timeline litúrgica</h3>
              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-medium text-gray-400 md:block">{liturgySummary}</span>
                <button type="button" onClick={recalculateLiturgyTimes} className="inline-flex min-h-9 items-center justify-center rounded-xl border border-emerald-100 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-bible-darkPaper dark:text-emerald-300">
                  Recalcular horários
                </button>
              </div>
            </div>
            <div data-review-target="liturgy-timing" className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-bible-darkPaper">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tempo e programação</p>
                  <p className="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">
                    {liturgyTiming.plannedMinutes} min planejados de {liturgyTiming.availableMinutes} min disponíveis
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${liturgyTiming.remainingMinutes < 0 ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300'}`}>
                  {liturgyTiming.remainingMinutes < 0 ? `${Math.abs(liturgyTiming.remainingMinutes)} min acima` : `${liturgyTiming.remainingMinutes} min livres`}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-900">
                <div className={`h-full rounded-full ${liturgyTiming.remainingMinutes < 0 ? 'bg-red-500' : 'bg-emerald-700'}`} style={{ width: `${liturgyTiming.percent}%` }} />
              </div>
            </div>
            <p className="mb-3 text-xs font-semibold text-gray-400">
              Arraste momentos recolhidos para reorganizar. Use as setas quando estiver editando um momento aberto.
            </p>
            <div data-review-target="liturgy-list" className="space-y-3">
              {liturgyItems.map((item) => {
                const songs = getSongItems(item);
                const visibleSongs = songs.length > 0 ? songs : [''];
                const isExpanded = expandedLiturgyItemId === item.id;
                const itemDuration = getLiturgyItemDuration(item.id);
                return (
                  <div
                    key={item.id}
                    data-review-target={`liturgy-item-${item.id}`}
                    draggable={!isExpanded}
                    onDragStart={(event) => {
                      if (isExpanded) return;
                      setDraggedLiturgyItemId(item.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', item.id);
                    }}
                    onDragOver={(event) => {
                      if (!draggedLiturgyItemId || draggedLiturgyItemId === item.id) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceId = draggedLiturgyItemId || event.dataTransfer.getData('text/plain');
                      if (sourceId) reorderLiturgyItem(sourceId, item.id);
                      setDraggedLiturgyItemId(null);
                    }}
                    onDragEnd={() => setDraggedLiturgyItemId(null)}
                    className={`rounded-2xl border bg-white p-4 transition dark:bg-bible-darkPaper ${isExpanded ? 'border-emerald-200 shadow-sm dark:border-emerald-900/50' : 'cursor-grab border-gray-100 hover:border-emerald-100 active:cursor-grabbing dark:border-gray-800'} ${draggedLiturgyItemId === item.id ? 'opacity-60 ring-2 ring-emerald-200 dark:ring-emerald-900/50' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedLiturgyItemId(isExpanded ? null : item.id)}
                      className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${isExpanded ? 'bg-emerald-700 text-white' : 'bg-gray-50 text-gray-500 dark:bg-gray-900'}`}>
                          {item.startsAt}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-gray-900 dark:text-white">{item.title || 'Novo momento'}</span>
                          <span className="mt-1 block truncate text-xs font-semibold text-gray-500">
                            {item.kind === 'worship' ? `${songs.filter((song) => song.trim()).length} músicas` : item.verseRef || item.notes || LITURGY_KIND_OPTIONS.find((option) => option.value === item.kind)?.label}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {itemDuration} min
                        <span className="rounded-xl border border-gray-200 px-3 py-1 text-gray-600 dark:border-gray-700 dark:text-gray-300">{isExpanded ? 'Concluir edição' : 'Editar'}</span>
                      </span>
                    </button>

                    {isExpanded && (
                    <>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[232px_minmax(180px,0.9fr)_minmax(220px,1.1fr)]">
                      <div className="flex min-w-0 gap-2">
                        <input
                          value={item.startsAt}
                          list="culto-plus-time-options"
                          inputMode="numeric"
                          pattern="[0-2][0-9]:[0-5][0-9]"
                          title="Horário em que este momento da liturgia começa."
                          onChange={(event) => updateLiturgyItem(item.id, { startsAt: maskTimeInput(event.target.value) })}
                          onBlur={(event) => updateLiturgyItem(item.id, { startsAt: normalizeTime24h(event.target.value, item.startsAt) })}
                          className="h-10 w-[72px] shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm font-black outline-none dark:border-gray-700 dark:bg-gray-900"
                        />
                        <button type="button" onClick={() => moveLiturgyItem(item.id, -1)} title="Mover este momento uma posicao para cima." className="inline-flex h-10 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-bible-gold" aria-label="Mover etapa para cima"><ArrowUp size={14} /></button>
                        <button type="button" onClick={() => moveLiturgyItem(item.id, 1)} title="Mover este momento uma posicao para baixo." className="inline-flex h-10 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-bible-gold" aria-label="Mover etapa para baixo"><ArrowDown size={14} /></button>
                        <button type="button" onClick={() => duplicateLiturgyItem(item.id)} title="Duplicar este momento da liturgia." className="inline-flex h-10 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-bible-gold" aria-label="Duplicar momento"><Plus size={14} /></button>
                        <button type="button" onClick={() => removeLiturgyItem(item.id)} disabled={liturgyItems.length <= 1} title="Remover este momento da liturgia." className="inline-flex h-10 w-8 shrink-0 items-center justify-center rounded-xl border border-red-100 text-red-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-950/40 dark:hover:bg-red-950/20" aria-label="Remover momento"><Trash2 size={14} /></button>
                      </div>
                      <SelectShell>
                        <select value={item.kind} onChange={(event) => updateLiturgyItem(item.id, { kind: event.target.value as ServiceLiturgyKind })} title="Escolha o tipo deste momento da liturgia." className="h-10 w-full min-w-0 appearance-none rounded-xl border border-gray-200 py-2 pl-3 pr-12 text-sm font-bold outline-none dark:border-gray-700 dark:bg-gray-900">
                          {LITURGY_KIND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </SelectShell>
                      <input value={item.title} onChange={(event) => updateLiturgyItem(item.id, { title: event.target.value })} title="Nome deste momento da liturgia." className="h-10 min-w-0 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold outline-none dark:border-gray-700 dark:bg-gray-900" />
                      <input data-review-target={`liturgy-responsible-${item.id}`} value={item.responsible ?? ''} onChange={(event) => updateLiturgyItem(item.id, { responsible: event.target.value })} title="Pessoa ou equipe responsável por este momento." placeholder="Responsável" className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none dark:border-gray-700 dark:bg-gray-900 md:col-span-3" />
                    </div>

                    {item.kind === 'worship' && (
                      <div data-review-target={`liturgy-worship-${item.id}`} className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Músicas</p>
                          <button type="button" onClick={() => addSongItem(item.id)} title="Adicionar uma música a este momento de louvor." className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-white px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-bible-darkPaper dark:text-emerald-300">
                            <Plus size={12} />
                            Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {visibleSongs.map((song, index) => {
                            const songKey = `${item.id}_${index}`;
                            const songTitle = song.trim();
                            const isExpanded = expandedSongTextKey === songKey;
                            return (
                              <div key={`${item.id}_song_${index}`} className="rounded-2xl border border-emerald-100 bg-white p-2 dark:border-emerald-900/40 dark:bg-bible-darkPaper">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedSongTextKey(isExpanded ? null : songKey)}
                                    title="Mostrar ou ocultar o texto desta música."
                                    className="min-w-0 flex-1 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-left outline-none transition hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                                  >
                                    <span className="block truncate text-sm font-black text-emerald-900 dark:text-emerald-100">{songTitle || 'Título da música'}</span>
                                    <span className="mt-0.5 block text-[10px] font-black uppercase tracking-widest text-emerald-700/70 dark:text-emerald-300/70">
                                      {getSongLeader(item, song) ? getSongLeader(item, song) : 'Sem ministro'} • {getSongText(item, song) ? 'Texto adicionado' : 'Sem texto'}
                                    </span>
                                  </button>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => loadSongText(item, song, index)}
                                      disabled={loadingSongTextKey === songKey}
                                      title="Buscar ou gerar texto seguro para esta música."
                                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-100 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-bible-darkPaper dark:text-emerald-300"
                                    >
                                      {loadingSongTextKey === songKey ? <Loader2 size={14} className="animate-spin" /> : 'Buscar texto'}
                                    </button>
                                    <button type="button" onClick={() => removeSongItem(item.id, index)} title="Remover esta música." className="inline-flex min-h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-white text-red-300 transition hover:bg-red-50 hover:text-red-500 dark:border-red-950/40 dark:bg-bible-darkPaper dark:hover:bg-red-950/20" aria-label="Remover música">
                                    <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="mt-2 space-y-2">
                                    <input value={song} onChange={(event) => updateSongItem(item.id, index, event.target.value)} title="Título da música deste momento de louvor." placeholder="Título da música" className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-bold outline-none dark:border-emerald-900/40 dark:bg-bible-darkPaper" />
                                    <input value={getSongLeader(item, song)} onChange={(event) => updateSongLeader(item.id, song, event.target.value)} title="Ministério, cantor ou equipe responsável por esta música." placeholder="Ministério / cantor" className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-bold outline-none dark:border-emerald-900/40 dark:bg-bible-darkPaper" />
                                    <textarea
                                      value={getSongText(item, song)}
                                      onChange={(event) => updateLiturgyItem(item.id, {
                                        songTexts: {
                                          ...(item.songTexts ?? {}),
                                          [songTitle]: event.target.value,
                                        },
                                      })}
                                      title="Texto desta música."
                                      placeholder="Texto desta música. Use 'Buscar texto' para carregar automaticamente ou digite a letra completa."
                                      className="min-h-36 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 font-mono text-xs leading-relaxed outline-none dark:border-emerald-900/40 dark:bg-bible-darkPaper"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {item.kind === 'word' && (
                      <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-3 dark:border-blue-900/40 dark:bg-blue-950/10 md:grid-cols-[180px_1fr]">
                        <input value={item.verseRef ?? ''} onChange={(event) => updateLiturgyItem(item.id, { verseRef: event.target.value })} title="Reférencia bíblica deste momento da Palavra." placeholder="Versículo" className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-black outline-none dark:border-blue-900/40 dark:bg-bible-darkPaper" />
                        <input value={item.verseText ?? ''} onChange={(event) => updateLiturgyItem(item.id, { verseText: event.target.value })} title="Texto bíblico deste momento da Palavra." placeholder="Texto bíblico" className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold outline-none dark:border-blue-900/40 dark:bg-bible-darkPaper" />
                        <textarea value={item.notes ?? ''} onChange={(event) => updateLiturgyItem(item.id, { notes: event.target.value })} title="Descrição pastoral ou orientação para o momento da Palavra." placeholder="Descrição da palavra do pastor" className="min-h-20 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none dark:border-blue-900/40 dark:bg-bible-darkPaper md:col-span-2" />
                      </div>
                    )}

                    {item.kind === 'offering' && (
                      <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/10 md:grid-cols-[160px_1fr]">
                        <textarea value={item.notes ?? ''} onChange={(event) => updateLiturgyItem(item.id, { notes: event.target.value })} title="Mensagem exibida junto ao momento de dízimos e ofertas." placeholder="Mensagem livre para dízimos e ofertas" className="min-h-20 rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper md:col-span-2" />
                        <SelectShell>
                          <select value={item.pixKeyType ?? 'cpf'} onChange={(event) => updateLiturgyItem(item.id, { pixKeyType: event.target.value as NonNullable<ServiceLiturgyItem['pixKeyType']> })} title="Escolha o tipo da chave PIX de oferta." className="w-full appearance-none rounded-xl border border-amber-100 bg-white py-2 pl-3 pr-12 text-sm font-bold outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper">
                            {PIX_KEY_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </SelectShell>
                        <input data-review-target={`liturgy-offering-pix-${item.id}`} value={item.pixKey ?? ''} onChange={(event) => updateLiturgyItem(item.id, { pixKey: event.target.value })} title="Chave PIX que sera exibida no botão Ofertar da página pública." placeholder="Chave PIX" className="rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm font-bold outline-none dark:border-amber-900/40 dark:bg-bible-darkPaper" />
                      </div>
                    )}

                    {['entrance', 'opening', 'prayer', 'response', 'closing', 'other'].includes(item.kind) && (
                      <textarea
                        value={item.notes ?? ''}
                        onChange={(event) => updateLiturgyItem(item.id, { notes: event.target.value })}
                        title="Observacoes pastorais deste momento da liturgia."
                        placeholder={
                          item.kind === 'prayer' ? 'Orientação para o momento de oração' :
                          item.kind === 'closing' ? 'Mensagem de encerramento' :
                          'Observacoes deste momento'
                        }
                        className="mt-3 min-h-16 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none dark:border-gray-700 dark:bg-gray-900"
                      />
                    )}
                    </>
                    )}
                  </div>
                );
              })}
              <button type="button" onClick={addLiturgyItem} title="Adicionar um novo momento a timeline litúrgica." className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/10 dark:text-emerald-300">
                <Plus size={15} />
                Adicionar momento
              </button>
            </div>
          </div>

          <div className={activeEditorStep === 'review' ? 'grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]' : 'hidden'}>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-bible-darkPaper">
              <p className="text-sm font-black text-gray-900 dark:text-white">Revisao do culto</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">Confira os itens abaixo antes de publicar.</p>
              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status geral</p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[6px] border-emerald-500 bg-white text-sm font-black text-emerald-700 shadow-sm dark:bg-bible-darkPaper">
                    {reviewCompletionPercent}%
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{reviewIssues.length === 0 ? 'Pronto para publicar' : 'Quase pronto!'}</p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">{reviewIssues.length === 0 ? 'Todos os itens essenciais foram conféridos.' : `Faltam ${reviewIssues.length} ajustes para publicar seu culto.`}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-black text-gray-900 dark:text-white">Pendencias ({reviewIssues.length})</p>
                <div className="mt-3 space-y-3">
                  {reviewIssues.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
                      <CheckCircle2 size={18} />
                      Nenhuma pendência encontrada.
                    </div>
                  ) : reviewIssues.map((issue) => (
                    <div key={issue.message} className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-start gap-3 text-sm font-bold text-amber-800 dark:text-amber-200">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-300 text-[11px] font-black">!</span>
                        {issue.message}
                      </p>
                      <button type="button" onClick={() => focusReviewIssue(issue)} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-amber-700 transition hover:bg-amber-50 dark:border-amber-900/50 dark:bg-bible-darkPaper dark:text-amber-300">
                        {issue.message.includes('programação') ? 'Revisar programação' : 'Corrigir'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden">
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {SERVICE_STATUS_OPTIONS.filter((option) => ['draft', 'published', 'checkin_open'].includes(option.value)).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`rounded-2xl border p-4 text-left transition ${status === option.value ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200' : 'border-gray-100 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900/40'}`}
                  >
                    <span className="block text-sm font-black">{option.label}</span>
                    <span className="mt-1 block text-xs font-semibold">{option.value === 'draft' ? 'Ainda não aparece publicamente.' : option.value === 'published' ? 'Página pública disponível.' : 'Participantes podem fazer check-in.'}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Página do culto</p>
                <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-500 dark:bg-bible-darkPaper">
                  {editingServiceId && services.find((service) => service.id === editingServiceId)?.slug ? `/culto/${services.find((service) => service.id === editingServiceId)?.slug}` : 'O link sera criado ao salvar.'}
                </p>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Prévia da capa do culto" className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-white text-gray-300 dark:bg-bible-darkPaper">
                    <ImageIcon size={24} />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm font-black text-gray-900 dark:text-white">{title || 'Culto sem titulo'}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">{serviceTypeLabel} • {formatServiceDate(startsAt)} • {serviceStartTime}</p>
                </div>
              </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-bible-darkPaper">
              <p className="text-sm font-black text-gray-900 dark:text-white">Publicar culto</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">Defina a visibilidade e finalize a públicacao.</p>

              <div className="mt-5 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Visibilidade do culto</p>
                <div className="mt-3 space-y-2">
                  {[
                    { value: 'published' as ChurchServiceStatus, label: 'Público', helper: 'Qualquer pessoa pode visualizar.' },
                    { value: 'checkin_open' as ChurchServiceStatus, label: 'Somente membros', helper: 'Apenas membros da igreja podem visualizar.' },
                    { value: 'draft' as ChurchServiceStatus, label: 'Privado', helper: 'Apenas lideres e responsaveis podem visualizar.' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${status === option.value ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200' : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-300'}`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${status === option.value ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                        {status === option.value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <span>
                        <span className="block text-sm font-black">{option.label}</span>
                        <span className="mt-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">{option.helper}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Página do culto</p>
                <label className="mt-4 block text-[10px] font-black uppercase tracking-widest text-gray-400">Link público</label>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2 dark:bg-emerald-950/20">
                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-gray-600 dark:text-gray-300">
                    {publicServiceUrl || 'O link sera criado ao salvar.'}
                  </span>
                  <button type="button" onClick={handleCopyPublicLink} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-emerald-700 dark:hover:bg-bible-darkPaper" aria-label="Copiar link público">
                    <Copy size={14} />
                  </button>
                </div>
                <p className="mt-2 text-xs font-semibold text-gray-400">Este link sera compartilhado com sua igreja.</p>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Imagem de destaque</p>
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Imagem de destaque do culto" className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-32 items-center justify-center text-gray-300">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingBanner} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-bible-darkPaper dark:text-gray-200">
                  {uploadingBanner ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  Alterar imagem
                </button>
              </div>

              {publicServicePath && (
                <Link href={publicServicePath} target="_blank" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-bible-darkPaper dark:text-gray-200">
                  <ExternalLink size={14} />
                  Visualizar prévia
                </Link>
              )}

              <div className="hidden">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confirmar públicacao</p>
              <div className="mt-4 space-y-3">
                {(reviewIssues.length ? reviewIssues.map((issue) => issue.message) : ['Pronto para salvar ou publicar.']).map((item) => (
                  <p key={item} className={`text-sm font-bold ${reviewIssues.length ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{item}</p>
                ))}
              </div>
              {reviewIssues.length > 0 && (
                <button type="button" onClick={() => setActiveEditorStep('review')} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-[10px] font-black uppercase tracking-widest text-amber-700 transition hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  Revisar pendências
                </button>
              )}
              </div>
              <button onClick={handleSubmit} disabled={saving} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingServiceId ? 'Salvar culto' : 'Publicar culto'}
              </button>
            </div>
          </div>

            </div>
            <aside className="space-y-4">
              <div className={activeEditorStep === 'overview' ? 'hidden' : 'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper'}>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Página do culto</p>
                <label className="mt-5 block text-[10px] font-black uppercase tracking-widest text-gray-400">Link público</label>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2 dark:bg-emerald-950/20">
                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#073b35] dark:text-emerald-200">
                    {publicServiceUrl || 'O link sera criado ao salvar.'}
                  </span>
                  <button type="button" onClick={handleCopyPublicLink} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-emerald-700 dark:hover:bg-bible-darkPaper" aria-label="Copiar link público">
                    <Copy size={14} />
                  </button>
                </div>
                <p className="mt-3 text-xs font-semibold text-gray-400">Este link sera compartilhado com sua igreja.</p>
              </div>

              <div className={activeEditorStep === 'overview' ? 'hidden' : 'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper'}>
                <p className="text-sm font-black text-gray-900 dark:text-white">Capa do culto</p>
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Capa do culto" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-gray-300">
                      <ImageIcon size={22} />
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingBanner} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-bible-darkPaper dark:text-gray-200">
                  {uploadingBanner ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  Alterar imagem
                </button>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper">
                <p className="text-sm font-black text-gray-900 dark:text-white">Checklist de revisão</p>
                <div className="mt-4 space-y-3">
                  {reviewChecklist.slice(0, 8).map((item) => (
                    <button key={`side_${item.label}`} type="button" onClick={() => setActiveEditorStep(item.target)} className="flex w-full items-center justify-between gap-3 text-left">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{item.label}</span>
                      {item.done ? <CheckCircle2 size={15} className="text-emerald-600" /> : <span className="text-xs font-black text-amber-600">!</span>}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setActiveEditorStep('review')} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-bible-darkPaper dark:text-gray-200">
                  Ver revisão completa
                </button>
              </div>

              {activeEditorStep !== 'overview' && (
                <>
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper">
                    <p className="text-sm font-black text-gray-900 dark:text-white">Resumo do culto</p>
                    <div className="mt-4 space-y-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                      <p className="flex items-center gap-2"><CalendarDays size={15} className="text-gray-400" /> {liturgyItems.length} momentos</p>
                      <p className="flex items-center gap-2"><Radio size={15} className="text-gray-400" /> {liturgyItems.reduce((total, item) => total + getSongItems(item).filter((song) => song.trim()).length, 0)} músicas</p>
                      <p className="flex items-center gap-2"><Bookmark size={15} className="text-gray-400" /> {liturgyItems.filter((item) => item.verseRef).length} texto bíblico</p>
                      <p className="flex items-center gap-2"><Clock size={15} className="text-gray-400" /> {formatMinutesDuration(liturgyTiming.plannedMinutes)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper">
                    <p className="text-sm font-black text-gray-900 dark:text-white">Tempo e programação</p>
                    <p className="mt-2 text-xs font-bold text-gray-500">{liturgyTiming.percent}% do tempo utilizado</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-900">
                      <div className={`h-full rounded-full ${liturgyTiming.remainingMinutes < 0 ? 'bg-red-500' : 'bg-emerald-700'}`} style={{ width: `${liturgyTiming.percent}%` }} />
                    </div>
                    <div className="mt-4 space-y-2 text-xs font-bold text-gray-500">
                      <p className="flex justify-between"><span>Disponível</span><span className="text-emerald-700">{formatMinutesDuration(Math.max(0, liturgyTiming.remainingMinutes))}</span></p>
                      <p className="flex justify-between"><span>Inicio</span><span>{serviceStartTime}</span></p>
                      <p className="flex justify-between"><span>Termino</span><span>{serviceEndTime}</span></p>
                    </div>
                  </div>

                </>
              )}
            </aside>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
            <button onClick={closeEditor} disabled={saving} title="Cancelar edição e fechar formulário." className="rounded-2xl bg-gray-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-500 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800">
              Cancelar
            </button>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {previousEditorStep && (
                <button type="button" onClick={() => setActiveEditorStep(previousEditorStep)} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-bible-darkPaper dark:text-gray-200">
                  Anterior
                </button>
              )}
              {nextEditorStep ? (
                <button type="button" onClick={() => setActiveEditorStep(nextEditorStep)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-emerald-800">
                  Proximo: {EDITOR_STEPS[activeEditorStepIndex + 1]?.label}
                  <ArrowDown className="-rotate-90" size={14} />
                </button>
              ) : null}
              <button onClick={handleSubmit} disabled={saving} title={editingServiceId ? 'Salvar as alterações deste culto.' : 'Publicar a OnePage deste culto.'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#073b35] via-[#0f5d51] to-[#d8b15f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 dark:ring-emerald-900/40">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingServiceId ? 'Salvar alterações' : 'Publicar OnePage'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={showForm ? 'hidden' : 'mt-8'}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500">
            {serviceView === 'calendar' ? <CalendarDays size={16} /> : <FileText size={16} />}
            {serviceView === 'calendar' ? 'Calendário' : 'Cultos recentes'}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {serviceView === 'list' && (
              <div className="inline-grid grid-cols-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-1 dark:border-emerald-900/50 dark:bg-emerald-950/10 sm:grid-cols-4">
                {SERVICE_TEMPORAL_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setServiceTemporalFilter(filter.value)}
                    aria-pressed={serviceTemporalFilter === filter.value}
                    className={`min-h-10 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition ${serviceTemporalFilter === filter.value ? 'bg-white text-emerald-700 shadow-sm dark:bg-bible-darkPaper dark:text-emerald-300' : 'text-emerald-700/60 hover:text-emerald-800 dark:text-emerald-300/60 dark:hover:text-emerald-200'}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
            <div className="inline-grid grid-cols-2 rounded-2xl border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900/40">
              {([
                ['list', 'Lista'],
                ['calendar', 'Calendário'],
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
            Crie o primeiro culto para liberar check-in, anotações e feed vinculado.
          </div>
        ) : visibleServices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/10 dark:text-emerald-300">
            Nenhum culto encontrado neste filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleServices.map((service) => {
              const journeyActions = getServiceJourneyActions(service);
              const temporalState = getServiceTemporalState(service, currentTime);
              const isInProgress = temporalState === 'in_progress';
              return (
                <div key={service.id} className={`rounded-2xl border p-5 transition hover:border-bible-gold/40 dark:hover:bg-gray-900 ${isInProgress ? 'border-emerald-200 bg-emerald-50/60 ring-1 ring-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:ring-emerald-900/40' : 'border-gray-100 bg-gray-50 hover:bg-white dark:border-gray-800 dark:bg-gray-900/40'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 text-sm font-black text-gray-900 dark:text-white">{service.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{service.theme}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {isInProgress && (
                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-white shadow-sm shadow-emerald-900/10">
                          Em andamento
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${SERVICE_STATUS_STYLES[service.status]}`}>
                        {SERVICE_STATUS_LABELS[service.status]}
                      </span>
                    </div>
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
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pedidos de oração</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white"><HandHeart size={18} className="text-bible-gold" /> {serviceStats[selectedServiceId]?.prayersCount ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Versículos salvos</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white"><Bookmark size={18} className="text-bible-gold" /> {serviceStats[selectedServiceId]?.verseSavesCount ?? 0}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 dark:bg-bible-darkPaper">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Escalas e ministérios</p>
                <h4 className="text-base font-black text-gray-900 dark:text-white">{selectedService?.title ?? 'Culto selecionado'}</h4>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-bible-gold/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-bible-leather dark:text-bible-gold">
                <Users size={12} />
                {scheduleAssignments.length} escalados
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Novo ministério</p>
                <div className="space-y-2">
                  <input value={newMinistryName} onChange={(event) => setNewMinistryName(event.target.value)} placeholder="Louvor, Mídia, Recepção..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
                  <input value={newMinistryDescription} onChange={(event) => setNewMinistryDescription(event.target.value)} placeholder="Descrição opcional" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
                  <button onClick={createMinistry} disabled={!newMinistryName.trim()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-bible-leather px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50 dark:bg-bible-gold dark:text-black">
                    <Plus size={14} />
                    Criar ministério
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Vincular membro</p>
                <div className="space-y-2">
                  <SelectShell>
                    <select value={selectedMinistryId} onChange={(event) => setSelectedMinistryId(event.target.value)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                      <option value="">Ministério</option>
                      {ministries.map((ministry) => <option key={ministry.id} value={ministry.id}>{ministry.name}</option>)}
                    </select>
                  </SelectShell>
                  <SelectShell>
                    <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                      <option value="">Membro</option>
                      {churchMembers.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
                    </select>
                  </SelectShell>
                  <input value={ministryRole} onChange={(event) => setMinistryRole(event.target.value)} placeholder="Função: vocal, câmera, recepção..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
                  <button onClick={addMemberToMinistry} disabled={!selectedMinistryId || !selectedMemberId} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-bible-gold px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-50">
                    <UserPlus size={14} />
                    Vincular
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Escalar no culto</p>
                <div className="space-y-2">
                  <SelectShell>
                    <select value={scheduleMinistryId} onChange={(event) => setScheduleMinistryId(event.target.value)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                      <option value="">Ministério</option>
                      {ministries.map((ministry) => <option key={ministry.id} value={ministry.id}>{ministry.name}</option>)}
                    </select>
                  </SelectShell>
                  <SelectShell>
                    <select value={scheduleMemberId} onChange={(event) => setScheduleMemberId(event.target.value)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper">
                      <option value="">Membro</option>
                      {churchMembers.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
                    </select>
                  </SelectShell>
                  <input value={scheduleRole} onChange={(event) => setScheduleRole(event.target.value)} placeholder="Função neste culto" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-bible-darkPaper" />
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
                      <SelectShell className="min-w-0 flex-1">
                        <select value={replacementMemberByAssignment[assignment.id] ?? ''} onChange={(event) => setReplacementMemberByAssignment((current) => ({ ...current, [assignment.id]: event.target.value }))} className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-2 pr-10 text-xs font-bold outline-none dark:border-gray-700 dark:bg-bible-darkPaper">
                          <option value="">Substituto</option>
                          {churchMembers.filter((member) => member.uid !== assignment.userId).map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
                        </select>
                      </SelectShell>
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
                <input value={liveVerseRef} onChange={(event) => setLiveVerseRef(event.target.value)} placeholder="Versículo atual" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-gray-900" />
                <textarea value={liveVerseText} onChange={(event) => setLiveVerseText(event.target.value)} placeholder="Texto bíblico enviado aos participantes" className="min-h-20 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-bible-gold dark:border-gray-700 dark:bg-gray-900" />
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
                            title="Carregar versículo e notas deste momento nos campos acima."
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-[10px] font-black uppercase tracking-widest text-gray-500 transition hover:text-bible-leather dark:bg-bible-darkPaper dark:text-gray-300"
                          >
                            <Quote size={12} />
                            Preparar
                          </button>
                          <button
                            type="button"
                            onClick={() => pushLiveStep(item)}
                            disabled={isSyncing}
                            title="Sincronizar este momento na OnePage pública do culto."
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
                Conteúdo de apoio: diferencie resumo, interpretacao e aplicação pastoral antes de publicar ou ensinar.
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
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Analytics avançado</p>
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
