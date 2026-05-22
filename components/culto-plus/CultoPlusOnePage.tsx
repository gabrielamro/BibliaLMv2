"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Bookmark, CalendarDays, CheckCircle2, Clock, Copy, Download, Eye, Gift, HandHeart, Heart, Loader2, MessageSquarePlus, NotebookPen, PlayCircle, QrCode, Radio, Save, Send, Share2, Sparkles, UserPlus, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { cultoPlusService } from '../../services/cultoPlusService';
import { dbService } from '../../services/supabase';
import { FeedPostCard } from '../social/FeedPostCard';
import CultoPlusTopActions from './CultoPlusTopActions';
import { ChurchService, Post, ServiceLiveState, ServiceNote, ServicePrayerRequest, ServiceReactionSummary, ServiceReactionType } from '../../types';
import { buildServiceCalendarEvent, getLiveStatusLabel, getOfferingItem, getServiceCounterParts } from '../../utils/cultoPlusOnePage';

type CultoPlusOnePageProps = {
  serviceSlug: string;
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

const getServiceStatus = (service: ChurchService, nowDate: Date) => {
  const startsAt = new Date(service.startsAt);
  const endsAt = new Date(service.endsAt);
  if (nowDate < startsAt) {
    const minutes = Math.max(1, Math.ceil((startsAt.getTime() - nowDate.getTime()) / 60000));
    if (minutes < 60) return `Comeca em ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `Comeca em ${hours}h${remainingMinutes ? ` ${remainingMinutes}min` : ''}`;
  }
  if (nowDate <= endsAt || service.status === 'live') return 'Ao vivo agora';
  return 'Encerrado';
};

const getLiturgyItemDate = (service: ChurchService, startsAt: string) => {
  const [hours, minutes] = startsAt.split(':').map(Number);
  const date = new Date(service.startsAt);
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date;
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

const CultoPlusOnePage: React.FC<CultoPlusOnePageProps> = ({ serviceSlug }) => {
  const { currentUser, userProfile, openLogin, showNotification, recordActivity } = useAuth();
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
  const [savingNote, setSavingNote] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reactions, setReactions] = useState<ServiceReactionSummary>(emptyReactions);
  const [publicPrayers, setPublicPrayers] = useState<ServicePrayerRequest[]>([]);
  const [prayerContent, setPrayerContent] = useState('');
  const [isPrayerPrivate, setIsPrayerPrivate] = useState(false);
  const [savingPrayer, setSavingPrayer] = useState(false);
  const [savingVerse, setSavingVerse] = useState(false);
  const [verseSavesCount, setVerseSavesCount] = useState(0);
  const [checkinUrl, setCheckinUrl] = useState('');
  const [checkinIntentHandled, setCheckinIntentHandled] = useState(false);
  const [liveState, setLiveState] = useState<ServiceLiveState | null>(null);
  const [nowDate, setNowDate] = useState(() => new Date());
  const currentSectionRef = useRef<HTMLDivElement>(null);

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
        const loaded = await cultoPlusService.getServiceBySlug(serviceSlug);
        setService(loaded);
        if (loaded) {
          setCheckinsCount(loaded.checkinsCount ?? 0);
          const [visitors, alreadyChecked, savedNotes] = await Promise.all([
            cultoPlusService.recordVisit(loaded, currentUser),
            userId ? cultoPlusService.hasCheckedIn(loaded.id, userId) : Promise.resolve(false),
            userId ? cultoPlusService.getMyNotes(loaded.id, userId) : Promise.resolve([]),
          ]);
          setVisitorsCount(visitors);
          setCheckedIn(alreadyChecked);
          setNoteComments(savedNotes);
          cultoPlusService.getServicePosts(loaded.id).then(setPosts).catch(() => setPosts([]));
          cultoPlusService.getReactionSummary(loaded.id).then(setReactions).catch(() => setReactions(emptyReactions()));
          cultoPlusService.getPublicPrayerRequests(loaded.id).then(setPublicPrayers).catch(() => setPublicPrayers([]));
          cultoPlusService.getKeyVerseSaveCount(loaded.id).then(setVerseSavesCount).catch(() => setVerseSavesCount(0));
          if (loaded.status === 'live') {
            cultoPlusService.getLiveState(loaded.id).then(setLiveState).catch(() => setLiveState(null));
          }
        }
      } catch {
        showNotification('Nao foi possivel carregar o culto.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadService();
  }, [serviceSlug, showNotification, userId]);

  useEffect(() => {
    if (!service || service.status !== 'live') return;
    const timer = window.setInterval(() => {
      cultoPlusService.getLiveState(service.id).then(setLiveState).catch(() => {});
    }, LIVE_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [service]);

  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}`;
    setCheckinUrl(`${url}?checkin=1`);
    const timer = window.setInterval(() => setNowDate(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const currentStep = useMemo(() => {
    if (!service) return null;
    if (liveState?.currentItemId) {
      return service.liturgyItems.find((item) => item.id === liveState.currentItemId) ?? null;
    }
    return service.liturgyItems.find((item, index) => {
      const start = getLiturgyItemDate(service, item.startsAt);
      const nextItem = service.liturgyItems[index + 1];
      if (!nextItem) return nowDate >= start;
      const end = getLiturgyItemDate(service, nextItem.startsAt);
      return nowDate >= start && nowDate < end;
    }) ?? service.liturgyItems[0] ?? null;
  }, [service, liveState, nowDate]);

  const offeringItem = useMemo(() => service ? getOfferingItem(service.liturgyItems) : undefined, [service]);
  const counterParts = useMemo(() => service ? getServiceCounterParts(service, nowDate) : null, [service, nowDate]);
  const liveStatusLabel = useMemo(() => service ? getLiveStatusLabel(service, nowDate) : '', [service, nowDate]);

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

  const handleShare = async () => {
    if (!service) return;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: service.title, text: service.theme, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    showNotification('Link do culto copiado.', 'success');
  };

  const copyToClipboard = async (value: string, message = 'Copiado.') => {
    await navigator.clipboard.writeText(value);
    showNotification(message, 'success');
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
                      Voce esta no Culto da {service.churchName}{service.preacherName ? `, com ${service.preacherName}.` : '.'}
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
              {service.liveUrl ? (
                <a
                  href={service.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir a transmissao ao vivo deste culto em uma nova aba."
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e4b457] px-4 text-[10px] font-medium uppercase tracking-widest text-white shadow-lg shadow-black/10 transition hover:bg-[#f3d28a] hover:text-[#073b35]"
                >
                  <PlayCircle size={16} />
                  Entrar na live
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Este culto ainda nao possui link de transmissao ao vivo cadastrado."
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-[10px] font-medium uppercase tracking-widest text-white/45"
                >
                  <PlayCircle size={16} />
                  Live indisponivel
                </button>
              )}
              <button
                type="button"
                onClick={handleAddToCalendar}
                title="Baixar um arquivo de calendario com data, horario e link deste culto."
                className="mt-4 inline-flex min-h-10 items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-white/80 transition hover:text-white"
              >
                <CalendarDays size={16} />
                Adicionar ao calendario
              </button>
            </aside>
          </div>

          <div className="mt-8 grid gap-4 border-y border-white/12 py-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: <CalendarDays size={19} />, label: formatWeekdayDate(service.startsAt), value: 'Data do culto' },
              { icon: <Clock size={19} />, label: formatServiceTime(service.startsAt), value: 'Horario de inicio' },
              { icon: <BookOpen size={19} />, label: service.keyVerseRef || 'Palavra', value: 'Versiculo-chave' },
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
            {[
              { label: checkedIn ? 'Acompanhar' : 'Check-in', hint: checkedIn ? 'Culto' : 'Registrar presenca', title: checkedIn ? 'Ir para o momento atual e acompanhar a liturgia.' : 'Registrar sua presenca neste culto.', icon: <Radio size={20} />, onClick: handleFollowAction },
              { label: 'Anotacoes', hint: 'Faca suas notas', title: 'Abrir o painel para escrever suas anotacoes pessoais do culto.', icon: <NotebookPen size={20} />, onClick: () => setIsNotePanelOpen(true) },
              { label: 'Oracao', hint: 'Escreva seu pedido', title: 'Abrir popup para enviar um pedido de oracao deste culto.', icon: <HandHeart size={20} />, onClick: () => setIsPrayerModalOpen(true) },
              { label: 'Ofertar', hint: offeringItem ? 'Dizimos e ofertas' : 'Indisponivel', title: offeringItem ? 'Abrir a chave PIX cadastrada para dizimos e ofertas.' : 'Este culto ainda nao possui chave PIX de oferta cadastrada.', icon: <Gift size={20} />, onClick: () => setIsOfferingModalOpen(true) },
              { label: 'Convidar', hint: 'Chame alguem', title: 'Abrir convite pronto para enviar este culto a outra pessoa.', icon: <UserPlus size={20} />, onClick: () => setIsInviteModalOpen(true) },
              { label: 'Compartilhar', hint: 'Divulgue o culto', title: 'Compartilhar ou copiar o link publico deste culto.', icon: <Share2 size={20} />, onClick: handleShare },
            ].map((action) => (
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
                <h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{liveState?.currentTitle || currentStep?.title || 'Culto publicado'}</h2>
                {(liveState?.currentExplanation || currentStep?.notes) && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{liveState?.currentExplanation || currentStep?.notes}</p>}
              </div>
              <button onClick={handleCheckin} disabled={checkingIn || checkedIn} title={checkedIn ? 'Voce ja registrou check-in neste culto.' : 'Registrar sua presenca neste culto.'} className={champagneButtonClass}>
                {checkingIn ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {checkedIn ? 'Check-in feito' : 'Fazer check-in'}
              </button>
            </div>
          </div>

          {(service.status === 'live' || liveState) && (
            <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-[#fff8e8] p-6 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-bible-darkPaper dark:to-amber-950/10">
              <div className="flex items-center gap-2">
                <Radio className="text-red-500" size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">Modo Culto Ao Vivo</p>
              </div>
              <h2 className="mt-2 text-xl font-black text-gray-900 dark:text-white">{liveState?.currentTitle || currentStep?.title || 'Acompanhando a liturgia'}</h2>
              {liveState?.currentVerseRef && <p className="mt-4 text-sm font-black text-gray-900 dark:text-white">{liveState.currentVerseRef}</p>}
              {liveState?.currentVerseText && <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-200">{liveState.currentVerseText}</p>}
              {liveState?.currentExplanation && <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{liveState.currentExplanation}</p>}
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
              {service.liturgyItems.map((item, index) => {
                const nextItem = service.liturgyItems[index + 1];
                const itemEnd = nextItem ? getLiturgyItemDate(service, nextItem.startsAt) : new Date(service.endsAt);
                const isPastItem = currentStep?.id !== item.id && nowDate > itemEnd;
                return (
                <div key={item.id} className={`rounded-2xl border p-4 transition-all duration-700 ${isPastItem ? 'opacity-45 saturate-50' : 'opacity-100'} ${currentStep?.id === item.id ? 'border-emerald-300 bg-emerald-50 shadow-lg shadow-emerald-950/5 dark:border-emerald-800 dark:bg-emerald-950/20' : 'border-emerald-100 bg-[#f8fcfa] dark:border-emerald-900/40 dark:bg-emerald-950/10'}`}>
                  <div className="flex items-start gap-4">
                    <span className={`rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm transition-all duration-700 dark:bg-bible-darkPaper ${isPastItem ? 'text-gray-300 line-through dark:text-gray-600' : 'text-emerald-700 dark:text-emerald-300'}`}>{item.startsAt}</span>
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-white">{item.title}</h3>
                      {item.responsible && <p className="text-xs font-bold text-gray-400">Responsavel: {item.responsible}</p>}
                      {item.notes && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.notes}</p>}
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
            <textarea value={postContent} onChange={(event) => setPostContent(event.target.value)} title="Escreva uma mensagem para publicar no feed da igreja vinculada a este culto." placeholder="Compartilhe uma frase da pregacao, testemunho ou foto depois pelo feed..." className="min-h-32 w-full resize-none rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-emerald-900/40 dark:bg-emerald-950/10" />
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
              <p className="mt-3 break-all text-xs font-medium text-emerald-700 dark:text-emerald-300">{typeof window !== 'undefined' ? window.location.href.split('?')[0] : ''}</p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => copyToClipboard(`Venha participar do culto "${service.title}" na ${service.churchName}. ${window.location.href.split('?')[0]}`, 'Convite copiado.')}
                title="Copiar texto de convite com o link deste culto."
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 text-[10px] font-medium uppercase tracking-widest text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
              >
                <Copy size={14} />
                Copiar
              </button>
              <button
                type="button"
                onClick={handleShare}
                title="Compartilhar este culto usando as opcoes do dispositivo."
                className={champagneButtonClass}
              >
                <Share2 size={14} />
                Compartilhar
              </button>
            </div>
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
