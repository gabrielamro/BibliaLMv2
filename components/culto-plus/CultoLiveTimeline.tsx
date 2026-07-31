"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  LockKeyhole,
  LogIn,
  Loader2,
  MessageSquare,
  Radio,
  Send,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import type {
  ChurchService,
  Post,
  ServiceCheckin,
  ServiceLiturgyComment,
  ServiceLiturgyItem,
  ServicePrayerTimelineEvent,
  ServiceReactionBurst,
  ServiceReactionSummary,
  ServiceReactionType,
} from '../../types';
import type { ServiceCounterParts } from '../../utils/cultoPlusOnePage';
import {
  getLiturgyMomentForTimestamp,
  type ServiceExperienceMoment,
} from '../../utils/cultoPlusExperience';

type TimelineFilter = 'all' | 'prayer' | 'feed' | 'checkin' | 'comment';

type CultoLiveTimelineProps = {
  service: ChurchService;
  moments: ServiceExperienceMoment[];
  currentMoment: ServiceLiturgyItem | null;
  currentMomentTitle: string;
  currentMomentResponsible: string;
  currentMomentVerseRef: string;
  currentMomentVerseText: string;
  checkins: ServiceCheckin[];
  prayerEvents: ServicePrayerTimelineEvent[];
  posts: Post[];
  comments: ServiceLiturgyComment[];
  participantCount: number;
  participantAvatars: string[];
  counterParts: ServiceCounterParts | null;
  currentUserId?: string;
  isAuthenticated: boolean;
  isAfterCult: boolean;
  savingComment: boolean;
  reactions: ServiceReactionSummary;
  reactionBursts: ServiceReactionBurst[];
  reactingType: ServiceReactionType | null;
  onRequireLogin: () => void;
  onReact: (reactionType: ServiceReactionType) => Promise<void>;
  onSaveComment: (liturgyItemId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
};

type TimelineEvent =
  | { id: string; kind: 'checkin'; createdAt: string; count: number }
  | { id: string; kind: 'prayer'; createdAt: string; prayer: ServicePrayerTimelineEvent }
  | { id: string; kind: 'feed'; createdAt: string; post: Post }
  | { id: string; kind: 'comment'; createdAt: string; comment: ServiceLiturgyComment };

const FILTER_LABELS: Record<TimelineFilter, string> = {
  all: 'Tudo',
  prayer: 'Orações',
  feed: 'Feed',
  checkin: 'Check-ins',
  comment: 'Comentários',
};

const REACTION_OPTIONS: Array<{ type: ServiceReactionType; emoji: string; label: string }> = [
  { type: 'amen', emoji: '🙏', label: 'Amém' },
  { type: 'glory', emoji: '🙌', label: 'Glória' },
  { type: 'hallelujah', emoji: '✨', label: 'Aleluia' },
];

const formatTimelineTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch {
    return '';
  }
};

const compactText = (value: string, limit: number) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 1).trimEnd()}…` : normalized;
};

const getInitials = (value: string) => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return `${words[0]?.[0] ?? 'C'}${words[1]?.[0] ?? ''}`.toUpperCase();
};

const TimelineAvatar: React.FC<{ name: string; photoURL?: string | null; tone?: 'gold' | 'green' | 'neutral' }> = ({
  name,
  photoURL,
  tone = 'neutral',
}) => {
  const toneClass = tone === 'gold'
    ? 'border-[#f3d28a]/45 bg-[#f3d28a]/16 text-[#f3d28a]'
    : tone === 'green'
      ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
      : 'border-white/15 bg-white/8 text-white/82';

  if (photoURL) {
    return <img src={photoURL} alt="" className="h-9 w-9 shrink-0 rounded-full border border-white/20 object-cover" />;
  }

  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${toneClass}`}>
      {getInitials(name)}
    </span>
  );
};

const CultoLiveTimeline: React.FC<CultoLiveTimelineProps> = ({
  service,
  moments,
  currentMoment,
  currentMomentTitle,
  currentMomentResponsible,
  currentMomentVerseRef,
  currentMomentVerseText,
  checkins,
  prayerEvents,
  posts,
  comments,
  participantCount,
  participantAvatars,
  counterParts,
  currentUserId,
  isAuthenticated,
  isAfterCult,
  savingComment,
  reactions,
  reactionBursts,
  reactingType,
  onRequireLogin,
  onReact,
  onSaveComment,
  onDeleteComment,
}) => {
  const currentMomentId = currentMoment?.id ?? moments[0]?.id ?? '';
  const currentIndex = Math.max(0, moments.findIndex((item) => item.id === currentMomentId));
  const progressPercent = moments.length > 0 ? Math.max(4, ((currentIndex + 1) / moments.length) * 100) : 0;
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(currentMomentId ? [currentMomentId] : []));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [showReturnToLive, setShowReturnToLive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentMomentRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentMomentId) return;
    setExpandedIds((current) => new Set([...current, currentMomentId]));
  }, [currentMomentId]);

  useEffect(() => {
    if (!currentUserId) return;
    const ownDrafts = comments.reduce<Record<string, string>>((result, comment) => {
      if (comment.userId === currentUserId) result[comment.liturgyItemId] = comment.content;
      return result;
    }, {});
    setDrafts((current) => ({ ...ownDrafts, ...current }));
  }, [comments, currentUserId]);

  useEffect(() => {
    if (!isFilterOpen) return;

    const closeFilter = (event: PointerEvent) => {
      if (!filterMenuRef.current?.contains(event.target as Node)) setIsFilterOpen(false);
    };
    const closeFilterWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFilterOpen(false);
    };

    document.addEventListener('pointerdown', closeFilter);
    document.addEventListener('keydown', closeFilterWithKeyboard);
    return () => {
      document.removeEventListener('pointerdown', closeFilter);
      document.removeEventListener('keydown', closeFilterWithKeyboard);
    };
  }, [isFilterOpen]);

  const groupedEvents = useMemo(() => {
    const grouped = new Map<string, TimelineEvent[]>();
    const push = (momentId: string | undefined, event: TimelineEvent) => {
      if (!momentId) return;
      grouped.set(momentId, [...(grouped.get(momentId) ?? []), event]);
    };

    const checkinsByMoment = new Map<string, ServiceCheckin[]>();
    checkins.forEach((checkin) => {
      const momentId = getLiturgyMomentForTimestamp(service, checkin.createdAt)?.id;
      if (!momentId) return;
      checkinsByMoment.set(momentId, [...(checkinsByMoment.get(momentId) ?? []), checkin]);
    });
    checkinsByMoment.forEach((items, momentId) => {
      const latest = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      push(momentId, { id: `checkins_${momentId}`, kind: 'checkin', createdAt: latest.createdAt, count: items.length });
    });

    prayerEvents.forEach((prayer) => {
      const momentId = getLiturgyMomentForTimestamp(service, prayer.createdAt)?.id;
      push(momentId, { id: `prayer_${prayer.prayerId}`, kind: 'prayer', createdAt: prayer.createdAt, prayer });
    });

    posts.forEach((post) => {
      const momentId = getLiturgyMomentForTimestamp(service, post.createdAt)?.id;
      push(momentId, { id: `post_${post.id}`, kind: 'feed', createdAt: post.createdAt, post });
    });

    comments.forEach((comment) => {
      push(comment.liturgyItemId, { id: `comment_${comment.id}`, kind: 'comment', createdAt: comment.createdAt, comment });
    });

    grouped.forEach((events, momentId) => {
      grouped.set(momentId, events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    });
    return grouped;
  }, [checkins, comments, posts, prayerEvents, service]);

  const visibleEventKinds = useMemo(() => {
    if (filter === 'all') return null;
    return new Set([filter]);
  }, [filter]);

  const timerLabel = counterParts
    ? `${counterParts.hours}:${counterParts.minutes}:${counterParts.seconds}`
    : '00:00:00';

  const handleTimelineScroll = () => {
    const container = scrollRef.current;
    const current = currentMomentRef.current;
    if (!container || !current) return;
    const distance = Math.abs(current.offsetTop - container.scrollTop);
    setShowReturnToLive(distance > 180);
  };

  const returnToLive = () => {
    currentMomentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowReturnToLive(false);
  };

  const toggleMoment = (momentId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(momentId) && momentId !== currentMomentId) next.delete(momentId);
      else next.add(momentId);
      return next;
    });
  };

  const submitComment = async (momentId: string) => {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    const content = drafts[momentId]?.trim() ?? '';
    if (!content) return;
    await onSaveComment(momentId, content);
  };

  return (
    <aside className="relative flex max-h-[calc(100svh-1rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/15 backdrop-blur-md lg:max-h-[calc(100svh-3rem)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-14 z-40 h-72 overflow-hidden" aria-hidden="true">
        {reactionBursts.map((burst, index) => {
          const reaction = REACTION_OPTIONS.find((item) => item.type === burst.reactionType) ?? REACTION_OPTIONS[0];
          return (
            <div
              key={burst.id}
              className="culto-reaction-burst absolute bottom-0"
              style={{ left: `${16 + (index % 3) * 32}%` }}
            >
              <div className="relative">
                <TimelineAvatar name={burst.userName} photoURL={burst.userPhotoURL} tone="gold" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/40 bg-[#f3d28a] text-sm shadow-lg">
                  {reaction.emoji}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="shrink-0 rounded-2xl border border-white/12 bg-white/8 p-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Users size={17} className="shrink-0 text-white/85" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                {participantCount} {participantCount === 1 ? 'participante' : 'participantes'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-black tabular-nums text-white" aria-label={`${counterParts?.label ?? 'Tempo do culto'} ${timerLabel}`}>
            <Clock3 size={15} className="text-[#f3d28a]" />
            {timerLabel}
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-white">{Math.min(currentIndex + 1, moments.length || 1)} de {moments.length || 1}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">momentos</p>
          </div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#f3d28a] transition-all duration-700" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 -space-x-2">
            {participantAvatars.slice(0, 5).map((initials, index) => (
              <span key={`${initials}_${index}`} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#174c45] bg-[#f3d28a] text-[8px] font-black text-[#073b35]">
                {initials}
              </span>
            ))}
          </div>
          <span className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[#f3d28a]">
            {counterParts?.label ?? 'Culto publicado'}
          </span>
        </div>
      </div>

      <div className="relative z-[60] mt-3 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-white">Timeline do culto</h2>
            <span className="rounded-full bg-[#f3d28a]/16 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-[#f3d28a]">Live</span>
          </div>
          <p className="mt-0.5 text-[10px] text-white/52">Acompanhe cada momento e participação.</p>
        </div>
        <div ref={filterMenuRef} className="relative min-w-0">
          <button
            type="button"
            onClick={() => setIsFilterOpen((current) => !current)}
            className="inline-flex h-10 max-w-[9.5rem] items-center gap-2 rounded-xl border border-white/12 bg-white/8 px-3 text-[9px] font-black uppercase tracking-wider text-white/80 transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-[#f3d28a]/70"
            aria-label="Filtrar eventos da timeline"
            aria-expanded={isFilterOpen}
            aria-controls="culto-timeline-filter-menu"
            aria-haspopup="menu"
          >
            <Filter size={14} className="shrink-0" />
            <span className="truncate">{FILTER_LABELS[filter]}</span>
          </button>
          {isFilterOpen && (
            <div
              id="culto-timeline-filter-menu"
              role="menu"
              className="absolute right-0 top-11 z-[70] w-40 max-w-[calc(100vw-2rem)] rounded-xl border border-white/15 bg-[#123d38] p-1.5 shadow-2xl shadow-black/35"
            >
              {(Object.keys(FILTER_LABELS) as TimelineFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="menuitemradio"
                  aria-checked={filter === item}
                  onClick={() => {
                    setFilter(item);
                    setIsFilterOpen(false);
                  }}
                  className={`flex min-h-9 w-full items-center rounded-lg px-3 text-left text-xs font-bold transition ${filter === item ? 'bg-[#f3d28a]/16 text-[#f3d28a]' : 'text-white/75 hover:bg-white/8'}`}
                >
                  {FILTER_LABELS[item]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleTimelineScroll}
        className="relative order-1 mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(243,210,138,.45)_transparent]"
        aria-live="polite"
      >
        <div className="absolute bottom-8 left-[1.15rem] top-5 w-px bg-gradient-to-b from-[#f3d28a]/70 via-white/22 to-white/8" />
        {moments.map((moment) => {
          const isCurrent = moment.id === currentMomentId;
          const isExpanded = expandedIds.has(moment.id);
          const existingComment = comments.find((comment) => comment.liturgyItemId === moment.id && comment.userId === currentUserId);
          const events = (groupedEvents.get(moment.id) ?? []).filter((event) => !visibleEventKinds || visibleEventKinds.has(event.kind));
          const momentTitle = isCurrent ? currentMomentTitle : moment.title;
          const momentTime = moment.startsAt.includes('T') ? formatTimelineTime(moment.startsAt) : moment.startsAt;

          return (
            <div key={moment.id} ref={isCurrent ? currentMomentRef : undefined} className="relative pl-10">
              <span className={`absolute left-2 top-5 z-10 h-5 w-5 rounded-full border-4 ${isCurrent ? 'border-[#f3d28a] bg-white shadow-[0_0_16px_rgba(243,210,138,.75)]' : moment.momentStatus === 'completed' ? 'border-emerald-300/45 bg-emerald-200/70' : 'border-white/35 bg-[#315b55]'}`} />
              <section className={`overflow-hidden rounded-2xl border transition ${isCurrent ? 'border-[#f3d28a]/70 bg-black/12 shadow-lg shadow-black/10' : 'border-white/12 bg-white/6'}`}>
                <button
                  type="button"
                  onClick={() => toggleMoment(moment.id)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={isExpanded}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-black ${isCurrent ? 'text-[#f3d28a]' : 'text-white/82'}`}>{momentTime} • {momentTitle}</span>
                      {isCurrent && <span className="rounded-full bg-[#f3d28a]/16 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-[#f3d28a]"><Radio size={9} className="mr-1 inline" />Agora</span>}
                      {moment.momentStatus === 'completed' && <CheckCircle2 size={14} className="text-emerald-300" />}
                    </div>
                    {!isExpanded && <p className="mt-1 text-[10px] text-white/45">{events.length} evento(s) neste momento</p>}
                  </div>
                  {isExpanded ? <ChevronUp size={17} className="shrink-0 text-white/55" /> : <ChevronDown size={17} className="shrink-0 text-white/55" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/8 px-4 pb-4 pt-3">
                    {isCurrent && (
                      <div className="mb-3">
                        {currentMomentResponsible && <p className="text-xs font-semibold text-white/65">{currentMomentResponsible}</p>}
                        {(currentMomentVerseRef || currentMomentVerseText) && (
                          <div className="mt-3 rounded-xl border border-white/10 bg-white/7 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                {currentMomentVerseRef && <p className="text-xs font-black text-white">{currentMomentVerseRef}</p>}
                                {currentMomentVerseText && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/65">{currentMomentVerseText}</p>}
                              </div>
                              <Link href="/biblia" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#f3d28a]/35 px-2.5 text-[8px] font-black uppercase tracking-widest text-[#f3d28a]">
                                <BookOpen size={13} />
                                Bíblia
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="divide-y divide-white/8">
                      {events.length === 0 && (
                        <p className="py-4 text-center text-[11px] text-white/42">Nenhuma atividade registrada neste momento.</p>
                      )}
                      {events.map((event) => {
                        if (event.kind === 'checkin') {
                          return (
                            <div key={event.id} className="flex gap-3 py-3">
                              <TimelineAvatar name="Check-in" tone="green" />
                              <div className="min-w-0">
                                <p className="text-xs leading-relaxed text-white/80">
                                  <span className="mr-2 text-white/42">{formatTimelineTime(event.createdAt)}</span>
                                  <strong>{event.count} {event.count === 1 ? 'pessoa fez' : 'pessoas fizeram'} check-in</strong>
                                </p>
                              </div>
                            </div>
                          );
                        }

                        if (event.kind === 'prayer') {
                          return (
                            <div key={event.id} className="flex gap-3 py-3">
                              <TimelineAvatar name={event.prayer.userName} photoURL={event.prayer.userPhotoURL} tone={event.prayer.isPrivate ? 'gold' : 'neutral'} />
                              <div className="min-w-0">
                                <p className="text-xs leading-relaxed text-white/82">
                                  <span className="mr-2 text-white/42">{formatTimelineTime(event.createdAt)}</span>
                                  <strong>{event.prayer.userName}</strong> pediu {event.prayer.isPrivate ? 'uma oração privada' : 'oração'}
                                  {event.prayer.isPrivate && <LockKeyhole size={12} className="ml-1.5 inline text-[#f3d28a]" />}
                                </p>
                                {!event.prayer.isPrivate && event.prayer.contentPreview && (
                                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/62">{compactText(event.prayer.contentPreview, 120)}</p>
                                )}
                              </div>
                            </div>
                          );
                        }

                        if (event.kind === 'feed') {
                          return (
                            <div key={event.id} className="flex gap-3 py-3">
                              <TimelineAvatar name={event.post.userDisplayName || 'Feed'} photoURL={event.post.userPhotoURL} />
                              <div className="min-w-0">
                                <p className="text-xs leading-relaxed text-white/82">
                                  <span className="mr-2 text-white/42">{formatTimelineTime(event.createdAt)}</span>
                                  <strong>Novo post no feed</strong>
                                </p>
                                <p className="mt-1.5 text-[11px] leading-relaxed text-white/62">{compactText(event.post.content, 120)}</p>
                                <Link href={`/p/${event.post.id}`} className="mt-1.5 inline-flex text-[9px] font-black uppercase tracking-widest text-[#f3d28a]">Ver post</Link>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={event.id} className="flex gap-3 py-3">
                            <TimelineAvatar name={event.comment.userName} photoURL={event.comment.userPhotoURL} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs leading-relaxed text-white/82">
                                <span className="mr-2 text-white/42">{formatTimelineTime(event.createdAt)}</span>
                                <strong>{event.comment.userName}</strong> comentou
                              </p>
                              <p className="mt-1.5 text-[11px] leading-relaxed text-white/62">{compactText(event.comment.content, 180)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {isCurrent && !isAfterCult && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <MessageSquare size={14} className="text-[#f3d28a]" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/75">
                              {existingComment ? 'Editar seu comentário' : 'Comentar este momento'}
                            </p>
                          </div>
                          {existingComment && (
                            <button
                              type="button"
                              onClick={() => onDeleteComment(existingComment.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/45 transition hover:bg-red-400/10 hover:text-red-200"
                              aria-label="Excluir meu comentário deste momento"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        {isAuthenticated ? (
                          <>
                            <div className="flex items-end gap-2">
                              <textarea
                                value={drafts[moment.id] ?? ''}
                                onChange={(event) => setDrafts((current) => ({ ...current, [moment.id]: event.target.value.slice(0, 500) }))}
                                placeholder="Compartilhe uma reflexão…"
                                rows={2}
                                className="min-h-12 flex-1 resize-none rounded-xl border border-white/12 bg-white/7 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#f3d28a]/60"
                              />
                              <button
                                type="button"
                                onClick={() => submitComment(moment.id)}
                                disabled={savingComment || !(drafts[moment.id]?.trim())}
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3d28a] text-[#073b35] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                                aria-label={existingComment ? 'Atualizar comentário' : 'Enviar comentário'}
                              >
                                <Send size={16} />
                              </button>
                            </div>
                            <p className="mt-2 text-[9px] text-white/38">1 comentário por pessoa em cada momento • {drafts[moment.id]?.length ?? 0}/500</p>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={onRequireLogin}
                            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#f3d28a]/35 text-[9px] font-black uppercase tracking-widest text-[#f3d28a]"
                          >
                            <LogIn size={14} />
                            Entrar para comentar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          );
        })}

        {moments.length === 0 && (
          <div className="rounded-2xl border border-white/12 bg-white/6 p-6 text-center">
            <UserRound className="mx-auto text-white/30" size={28} />
            <p className="mt-3 text-sm font-bold text-white/72">A liturgia ainda não foi publicada.</p>
          </div>
        )}
      </div>

      {!isAfterCult && (
        <div className="relative z-20 order-3 mt-3 grid shrink-0 grid-cols-3 gap-2 rounded-2xl border border-white/12 bg-[#103d37]/95 p-2 shadow-[0_12px_30px_rgba(4,31,28,.2)] backdrop-blur-xl" aria-label="Reações rápidas do culto">
          {REACTION_OPTIONS.map((reaction) => (
            <button
              key={reaction.type}
              type="button"
              onClick={() => onReact(reaction.type)}
              disabled={reactingType !== null}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/7 px-2 text-white transition hover:border-[#f3d28a]/45 hover:bg-[#f3d28a]/12 focus:outline-none focus:ring-2 focus:ring-[#f3d28a]/70 disabled:cursor-wait disabled:opacity-65"
              aria-label={`${reaction.label}: ${reactions[reaction.type]} reações`}
              title={`Reagir com ${reaction.label}`}
            >
              <span className="text-lg" aria-hidden="true">{reaction.emoji}</span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-[9px] font-black uppercase tracking-wider text-white/70">{reaction.label}</span>
                <span className="block text-xs font-black tabular-nums text-[#f3d28a]">
                  {reactingType === reaction.type ? <Loader2 size={13} className="animate-spin" /> : reactions[reaction.type]}
                </span>
              </span>
            </button>
          ))}
          <span className="sr-only" aria-live="polite">
            {REACTION_OPTIONS.map((reaction) => `${reaction.label}: ${reactions[reaction.type]}`).join(', ')}
          </span>
        </div>
      )}

      {showReturnToLive && (
        <button
          type="button"
          onClick={returnToLive}
          className="order-2 mx-auto mt-3 inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[#f3d28a]/50 bg-[#173f39] px-4 text-[9px] font-black uppercase tracking-widest text-[#f3d28a] shadow-xl"
        >
          <Radio size={13} />
          Voltar ao vivo
        </button>
      )}
      <style jsx>{`
        @keyframes cultoReactionFloat {
          0% {
            opacity: 0;
            transform: translate(-50%, 18px) scale(.72);
          }
          18% {
            opacity: 1;
            transform: translate(-50%, -18px) scale(1);
          }
          72% {
            opacity: .94;
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + 12px), -230px) scale(.84);
          }
        }

        .culto-reaction-burst {
          animation: cultoReactionFloat 2.4s cubic-bezier(.2, .72, .28, 1) forwards;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .culto-reaction-burst {
            animation-duration: .7s;
          }
        }
      `}</style>
    </aside>
  );
};

export default CultoLiveTimeline;
