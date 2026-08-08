"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Compass,
  ExternalLink,
  Eye,
  HeartHandshake,
  Lightbulb,
  Loader2,
  LockKeyhole,
  Pencil,
  RefreshCw,
  ScrollText,
  Send,
  Share2,
  Sparkles,
  Star,
  Target,
  Trophy,
  Wheat,
  X,
} from 'lucide-react';
import SEO from '../components/SEO';
import DevotionalFeedShareModal from '../components/DevotionalFeedShareModal';
import ConfirmationModal from '../components/ConfirmationModal';
import DevotionalHero from '../components/devotional/DevotionalHero';
import VerseHeroCard from '../components/devotional/VerseHeroCard';
import { DevotionalStepperCard, DevotionalTopCards } from '../components/devotional/DevotionalSidebar';
import ReminderBanner from '../components/devotional/ReminderBanner';
import FloatingContinueButton from '../components/devotional/FloatingContinueButton';
import DevotionalCalendarModal from '../components/devotional/DevotionalCalendarModal';
import HeartStateModal, { type HeartStateOption } from '../components/devotional/HeartStateModal';
import DevotionalHistoryModal from '../components/devotional/DevotionalHistoryModal';
import DevotionalTracksModal, { type DevotionalTrack } from '../components/devotional/DevotionalTracksModal';
import ReminderSettingsModal from '../components/devotional/ReminderSettingsModal';
import AudioPlayerBar from '../components/devotional/AudioPlayerBar';
import PersonalEvolutionPanel from '../components/devotional/PersonalEvolutionPanel';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import useAudioNarration from '../hooks/useAudioNarration';
import { bibleService } from '../services/bibleService';
import {
  createDevotionalBibleContextSummary,
  loadDevotionalBibleContext,
  type DevotionalBibleContext,
} from '../services/devotionalBibleContextService';
import {
  createInitialDevotionalJourney,
  loadDevotionalJourney,
  saveDevotionalJourney,
} from '../services/devotionalJourneyService';
import { DailyDevotionalError, resolveUserDailyDevotional } from '../services/devotionalResolver';
import { dbService } from '../services/supabase';
import { DAILY_BREAD } from '../constants';
import type { DevotionalJourneyState, DevotionalJourneyStep } from '../types';
import type { ResolvedDevotionalCandidate } from '../services/devotionalResolverCore';
import toast from 'react-hot-toast';

type FontScale = 'small' | 'medium' | 'large';

type ViewDevotional = ResolvedDevotionalCandidate & {
  verse: string;
  reference: string;
  text: string;
};

const STAGES: Array<{
  step: DevotionalJourneyStep;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}> = [
  { step: 1, label: 'Ler a Palavra', shortLabel: 'Ler', icon: BookOpen },
  { step: 2, label: 'Refletir', shortLabel: 'Refletir', icon: Sparkles },
  { step: 3, label: 'Orar', shortLabel: 'Orar', icon: HeartHandshake },
  { step: 4, label: 'Praticar', shortLabel: 'Praticar', icon: Target },
  { step: 5, label: 'Concluir', shortLabel: 'Concluir', icon: CheckCircle2 },
];

const FONT_SCALE_CLASSES: Record<FontScale, string> = {
  small: 'text-[15px] leading-7 md:text-base md:leading-8',
  medium: 'text-base leading-8 md:text-lg md:leading-9',
  large: 'text-lg leading-9 md:text-xl md:leading-10',
};

const PRACTICAL_TIPS = [
  'Demonstrar paciência e graça em uma conversa difícil hoje.',
  'Reservar 10 minutos de silêncio e gratidão no fim do dia.',
  'Enviar uma mensagem de encorajamento para um amigo ou irmão.',
  'Perdoar intencionalmente alguém que me magoou recentemente.',
  'Praticar a generosidade oferecendo ajuda a quem precisa.',
];

const IMPORTANT_DEVOTIONAL_TERMS = [
  'Espírito Santo',
  'Palavra de Deus',
  'Jesus Cristo',
  'misericórdia',
  'esperança',
  'confiança',
  'salvação',
  'promessa',
  'oração',
  'verdade',
  'Espírito',
  'Cristo',
  'Jesus',
  'Senhor',
  'Deus',
  'graça',
  'amor',
  'paz',
  'fé',
].sort((first, second) => second.length - first.length);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const IMPORTANT_TERM_PATTERN = new RegExp(`(${IMPORTANT_DEVOTIONAL_TERMS.map(escapeRegExp).join('|')})`, 'giu');
const IMPORTANT_TERM_SET = new Set(IMPORTANT_DEVOTIONAL_TERMS.map((term) => term.toLocaleLowerCase('pt-BR')));

const asDisplayString = (value: unknown, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const splitDevotionalParagraphs = (content: unknown) => {
  const normalized = asDisplayString(content).replace(/\r/g, '').trim();
  if (!normalized) return [];

  const explicitParagraphs = normalized
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) return explicitParagraphs;

  const sentences = normalized
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]+(?:[”"'])?|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean);

  if (!sentences || sentences.length < 4) return explicitParagraphs;

  const sentencesPerParagraph = Math.ceil(sentences.length / 3);
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(index, index + sentencesPerParagraph).join(' '));
  }
  return paragraphs;
};

const emphasizeImportantTerms = (content: unknown) => {
  const text = asDisplayString(content);
  if (!text) return null;
  return text
    .split(IMPORTANT_TERM_PATTERN)
    .map((part, index) => IMPORTANT_TERM_SET.has(part.toLocaleLowerCase('pt-BR')) ? (
      <strong key={`${part}-${index}`} className="font-bold text-[#2d1e11] dark:text-[#edad2c]">{part}</strong>
    ) : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>);
};

const addCompletedStep = (
  completedSteps: DevotionalJourneyStep[],
  step: DevotionalJourneyStep,
) => Array.from(new Set([...completedSteps, step])).sort() as DevotionalJourneyStep[];

const removeCompletedSteps = (
  completedSteps: DevotionalJourneyStep[],
  steps: DevotionalJourneyStep[],
) => completedSteps.filter((step) => !steps.includes(step));

const normalizeForView = (data: ResolvedDevotionalCandidate | null): ViewDevotional | null => {
  if (!data) return null;
  return {
    ...data,
    title: asDisplayString(data.title, 'Pão Diário'),
    verse: asDisplayString(data.verseText),
    reference: asDisplayString(data.verseReference),
    text: asDisplayString(data.content),
    prayer: asDisplayString(data.prayer),
  };
};

interface ReadingSectionProps {
  step: DevotionalJourneyStep;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  compactHeader?: boolean;
  children: React.ReactNode;
}

function ReadingSection({ step, title, description, icon: Icon, completed, compactHeader = false, children }: ReadingSectionProps) {
  return (
    <section
      id={`devotional-step-${step}`}
      data-testid={`devotional-step-${step}`}
      aria-labelledby={`devotional-stage-tab-${step}`}
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <header className={compactHeader ? 'mb-5' : 'mb-7 border-b border-[#ded8ce] pb-6 dark:border-white/10'}>
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${completed ? 'bg-[#edad2c] text-white' : 'border border-[#edad2c]/35 bg-[#edad2c]/10 text-[#edad2c] dark:bg-[#edad2c]/20'}`}>
            {completed ? <Check size={15} strokeWidth={3} /> : <Icon size={16} />}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#edad2c]">
            Etapa {step} de 5{compactHeader ? ` · ${title}` : ''}
          </span>
          {completed ? <span className="ml-auto text-[9px] font-bold uppercase tracking-[0.14em] text-[#edad2c]">Concluída</span> : null}
        </div>
        {!compactHeader ? (
          <>
            <h2 className="mt-4 font-serif text-2xl font-semibold leading-tight text-[#302316] sm:text-[28px] dark:text-[#fff7eb]">{title}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#736353] dark:text-[#c4b7a7]">{description}</p>
          </>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export default function DevotionalPage() {
  const { currentUser, recordActivity, showNotification, openLogin } = useAuth();
  const { isFocusMode, setIsFocusMode } = useSettings();
  const [loading, setLoading] = useState(true);
  const [devotional, setDevotional] = useState<ViewDevotional | null>(null);
  const [journey, setJourney] = useState<DevotionalJourneyState | null>(null);
  const [userReflection, setUserReflection] = useState('');
  const [fontScale, setFontScale] = useState<FontScale>('medium');
  const [isSaving, setIsSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<DevotionalJourneyStep>(1);
  const [bibleContext, setBibleContext] = useState<DevotionalBibleContext | null>(null);
  const [isBibleContextLoading, setIsBibleContextLoading] = useState(false);
  const [isRefreshingDaily, setIsRefreshingDaily] = useState(false);
  const [isRefreshConfirmOpen, setIsRefreshConfirmOpen] = useState(false);
  const [refreshAvailable, setRefreshAvailable] = useState(false);

  // Estados dos Modais
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isHeartModalOpen, setIsHeartModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTracksModalOpen, setIsTracksModalOpen] = useState(false);
  const [isReminderSettingsModalOpen, setIsReminderSettingsModalOpen] = useState(false);
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState(false);

  const [heartState, setHeartState] = useState<HeartStateOption | null>(null);
  const [favoriteVerses, setFavoriteVerses] = useState<Array<{ id: string; verse: string; reference: string }>>([]);
  const [savedNotes, setSavedNotes] = useState<Array<{ id: string; date: string; title: string; note: string }>>([]);
  const [savedPrayers, setSavedPrayers] = useState<Array<{ id: string; date: string; prayer: string; isAnswered?: boolean }>>([]);
  const [savedCommitments, setSavedCommitments] = useState<Array<{ id: string; date: string; commitment: string; isDone?: boolean }>>([]);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [reminderSettings, setReminderSettings] = useState({
    time: '08:00',
    days: 'daily',
    mode: 'morning' as 'morning' | 'night',
    enabled: true,
  });

  const readerRef = useRef<HTMLElement>(null);
  const userId = currentUser ? (currentUser.uid ?? currentUser.id) : null;
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Gabriel';

  const loadDevotional = useCallback(async (forceNew = false) => {
    if (forceNew) setIsRefreshingDaily(true);
    else setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const resolved = await resolveUserDailyDevotional({ userId, forceNew });
      const candidate = resolved ?? {
        ...DAILY_BREAD,
        id: `daily:${today}:fallback`,
        date: today,
        source: 'generated' as const,
      };
      const nextDevotional = normalizeForView(candidate);
      if (!nextDevotional) throw new Error('Devocional indisponível');

      const [savedJourney, history] = await Promise.all([
        loadDevotionalJourney(userId, nextDevotional.id),
        userId ? dbService.getUserDevotionalHistory(userId, 30) : Promise.resolve([]),
      ]);
      const historyEntry = history.find((entry: any) => entry.content_id === nextDevotional.id);
      const restoredReflection = asDisplayString(
        historyEntry?.reflection || savedJourney.reflectionDraft || '',
      );
      let completedSteps = savedJourney.completedSteps;
      if (restoredReflection.trim()) completedSteps = addCompletedStep(completedSteps, 2);
      if (historyEntry?.is_amen) completedSteps = addCompletedStep(completedSteps, 3);
      if (savedJourney.completedAt) completedSteps = [1, 2, 3, 4, 5];

      const practicalAction = savedJourney.practicalAction === 'Escolher uma atitude concreta para viver esta Palavra hoje.'
        ? ''
        : asDisplayString(savedJourney.practicalAction);

      const restoredJourney: DevotionalJourneyState = {
        ...savedJourney,
        practicalAction,
        reflectionDraft: restoredReflection,
        completedSteps,
      };
      const firstIncompleteStage = STAGES.find(({ step }) => !completedSteps.includes(step))?.step ?? 5;

      setDevotional(nextDevotional);
      setRefreshAvailable(Boolean(nextDevotional.refreshAvailable));
      setUserReflection(restoredReflection);
      setJourney(restoredJourney);
      setActiveStage(savedJourney.completedAt ? 5 : firstIncompleteStage);

      if (history && history.length > 0) {
        const dates = history.map((h: any) => h.date || h.created_at?.split('T')[0]).filter(Boolean);
        setCompletedDates(dates);
      }
    } catch (error) {
      console.error('Erro ao carregar Pão Diário:', error);
      if (forceNew) {
        if (error instanceof DailyDevotionalError && error.code === 'DAILY_REFRESH_USED') {
          setRefreshAvailable(false);
        }
        toast.error(
          error instanceof Error && error.message && error.message !== '[object Object]'
            ? error.message
            : 'Não foi possível atualizar o Pão Diário.',
        );
      } else {
        setDevotional(null);
        setJourney(null);
      }
    } finally {
      if (forceNew) setIsRefreshingDaily(false);
      else setLoading(false);
    }
  }, [userId]);

  const confirmDailyRefresh = useCallback(async () => {
    if (!userId) {
      setIsRefreshConfirmOpen(false);
      showNotification('Entre na sua conta para gerar um novo Pão Diário.', 'info');
      openLogin('/devocional');
      return;
    }
    setIsRefreshConfirmOpen(false);
    await loadDevotional(true);
  }, [loadDevotional, openLogin, showNotification, userId]);

  useEffect(() => {
    void loadDevotional();
  }, [loadDevotional]);

  useEffect(() => {
    let cancelled = false;
    if (!devotional?.reference) {
      setBibleContext(null);
      setIsBibleContextLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setBibleContext(createDevotionalBibleContextSummary(devotional.reference, devotional.verse));
    setIsBibleContextLoading(true);
    void loadDevotionalBibleContext(devotional.reference, devotional.verse)
      .then((context) => {
        if (!cancelled) setBibleContext(context);
      })
      .finally(() => {
        if (!cancelled) setIsBibleContextLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [devotional?.reference, devotional?.verse]);

  const audioText = useMemo(() => {
    if (!devotional) return '';
    const passage = bibleContext?.hasSurroundingVerses
      ? `Contexto bíblico, ${bibleContext.passageReference}. ${bibleContext.verses.map((verse) => `Versículo ${verse.number}. ${verse.text}`).join(' ')}`
      : `${devotional.reference}. ${devotional.verse}`;
    return `${devotional.title}. ${passage}. Reflexão pastoral. ${devotional.text}. Oração. ${devotional.prayer}`;
  }, [bibleContext, devotional]);
  const { isPlaying, isGenerating, togglePlayPause, stopAudio } = useAudioNarration(audioText);

  useEffect(() => () => stopAudio(true), [stopAudio]);

  const contextHref = useMemo(() => {
    if (!devotional?.reference) return '/bibliasagrada';
    const parsed = bibleService.parseReference(devotional.reference);
    if (!parsed) return '/bibliasagrada';
    return `/biblia?book=${encodeURIComponent(parsed.bookId)}&cap=${parsed.chapter}&vs=${parsed.startVerse}`;
  }, [devotional]);

  const formattedDate = useMemo(() => {
    if (!devotional?.date) return 'Hoje';
    const date = new Date(`${devotional.date}T12:00:00`);
    if (Number.isNaN(date.getTime())) return 'Hoje';
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }, [devotional?.date]);

  const persistJourney = useCallback(async (next: DevotionalJourneyState) => {
    setJourney(next);
    try {
      const saved = await saveDevotionalJourney(userId, next);
      setJourney(saved);
      return saved;
    } catch (error) {
      console.warn('Não foi possível sincronizar a jornada devocional:', error);
      return next;
    }
  }, [userId]);

  const markStep = async (step: DevotionalJourneyStep) => {
    if (!journey) return;
    await persistJourney({
      ...journey,
      completedSteps: addCompletedStep(journey.completedSteps, step),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleReflectionSave = async () => {
    if (!journey || !devotional || isSaving) return false;
    setIsSaving(true);
    try {
      if (userReflection.trim()) {
        if (userId) {
          await dbService.saveUserDevotionalAction(userId, devotional.id, 'reflection', userReflection.trim());
        }
        setSavedNotes((prev) => [
          {
            id: `note-${Date.now()}`,
            date: new Date().toLocaleDateString('pt-BR'),
            title: devotional.title,
            note: userReflection.trim(),
          },
          ...prev,
        ]);
      }
      await persistJourney({
        ...journey,
        reflectionDraft: userReflection,
        completedSteps: addCompletedStep(journey.completedSteps, 2),
        updatedAt: new Date().toISOString(),
      });
      toast.success(userReflection.trim() ? 'Reflexão salva no Meu Diário.' : 'Etapa de reflexão concluída.');
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrayerComplete = async () => {
    if (!journey || !devotional || isSaving) return false;
    setIsSaving(true);
    try {
      if (userId && !journey.completedSteps.includes(3)) {
        await dbService.saveUserDevotionalAction(userId, devotional.id, 'amen');
      }
      setSavedPrayers((prev) => [
        {
          id: `prayer-${Date.now()}`,
          date: new Date().toLocaleDateString('pt-BR'),
          prayer: devotional.prayer,
          isAnswered: false,
        },
        ...prev,
      ]);
      await persistJourney({
        ...journey,
        completedSteps: addCompletedStep(journey.completedSteps, 3),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Amém. Oração concluída e registrada.');
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePracticalActionChange = (value: string) => {
    if (!journey || journey.completedAt) return;
    setJourney({ ...journey, practicalAction: value });
  };

  const handlePracticalActionBlur = async () => {
    if (!journey || journey.completedAt) return;
    await persistJourney({ ...journey, practicalAction: journey.practicalAction, updatedAt: new Date().toISOString() });
  };

  const handlePracticalActionToggle = async () => {
    if (!journey || journey.completedAt) return;
    const practicalActionCompleted = !journey.practicalActionCompleted;
    if (practicalActionCompleted && journey.practicalAction.trim()) {
      setSavedCommitments((prev) => [
        {
          id: `commit-${Date.now()}`,
          date: new Date().toLocaleDateString('pt-BR'),
          commitment: journey.practicalAction.trim(),
          isDone: true,
        },
        ...prev,
      ]);
    }
    await persistJourney({
      ...journey,
      practicalActionCompleted,
      completedSteps: practicalActionCompleted
        ? addCompletedStep(journey.completedSteps, 4)
        : removeCompletedSteps(journey.completedSteps, [4, 5]),
      completedAt: practicalActionCompleted ? journey.completedAt : null,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCompleteJourney = async () => {
    if (!journey || !devotional || journey.completedAt) return;
    const ready = [1, 2, 3, 4].every((step) => journey.completedSteps.includes(step as DevotionalJourneyStep));
    if (!ready) {
      showNotification('Conclua as quatro etapas anteriores para finalizar.', 'warning');
      return;
    }

    const completedAt = new Date().toISOString();
    await persistJourney({
      ...journey,
      completedSteps: [1, 2, 3, 4, 5],
      completedAt,
      updatedAt: completedAt,
    });

    const todayStr = new Date().toISOString().split('T')[0];
    setCompletedDates((prev) => Array.from(new Set([...prev, todayStr])));

    if (userId) {
      try {
        await recordActivity('devotional', `Concluiu o Pão Diário: ${devotional.title}`, {
          sourceId: devotional.id,
          sourceType: 'devotional',
        });
      } catch (error) {
        console.warn('Jornada concluída, mas atividade não registrada:', error);
      }
    }
    toast.success('Pão Diário concluído! Sequência de dias atualizada.');
  };

  const handleSharePublished = async () => {
    if (!journey) return;
    const sharedAt = new Date().toISOString();
    await persistJourney({ ...journey, feedSharedAt: sharedAt, updatedAt: sharedAt });
  };

  const handleNativeShare = async () => {
    if (!devotional) return;
    const text = `Pão Diário · Culto+\n\n“${devotional.verse}”\n${devotional.reference}\n\n${devotional.title}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${devotional.title} | Pão Diário`, text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text}\n\n${window.location.href}`);
        toast.success('Conteúdo copiado.');
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') toast.error('Não foi possível compartilhar.');
    }
  };

  const handleToggleFavoriteVerse = () => {
    if (!devotional) return;
    const isAlreadyFav = favoriteVerses.some((v) => v.verse === devotional.verse);
    if (isAlreadyFav) {
      setFavoriteVerses((prev) => prev.filter((v) => v.verse !== devotional.verse));
      toast.success('Versículo removido dos favoritos.');
    } else {
      setFavoriteVerses((prev) => [
        { id: `fav-${Date.now()}`, verse: devotional.verse, reference: devotional.reference },
        ...prev,
      ]);
      toast.success('Versículo adicionado aos Favoritos!');
    }
  };

  const goToStage = useCallback((step: DevotionalJourneyStep, scroll = true) => {
    setActiveStage(step);
    if (!scroll || typeof window === 'undefined') return;
    window.requestAnimationFrame(() => {
      readerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleReadingContinue = async () => {
    await markStep(1);
    goToStage(2);
  };

  const handleReflectionContinue = async () => {
    if (await handleReflectionSave()) goToStage(3);
  };

  const handlePrayerContinue = async () => {
    if (await handlePrayerComplete()) goToStage(4);
  };

  if (loading) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center bg-[#f7f4ec] dark:bg-[#160f0b]">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#edad2c]/40 bg-[#fffdf8] text-[#edad2c] dark:bg-[#edad2c]/10">
            <Loader2 className="animate-spin" size={25} />
          </span>
          <div>
            <p className="text-sm font-black text-[#302316] dark:text-[#fff7eb]">Preparando seu Pão Diário</p>
            <p className="mt-1 text-xs text-gray-500">Palavra, reflexão, oração e prática.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!devotional || !journey) {
    return (
      <div className="flex min-h-[72vh] flex-col items-center justify-center gap-5 bg-[#f7f4ec] p-6 text-center dark:bg-[#160f0b]">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#edad2c]/15 text-[#edad2c]"><Wheat size={28} /></span>
        <div>
          <h1 className="text-2xl font-black text-[#302316] dark:text-[#fff7eb]">O Pão Diário não carregou</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">Tente novamente. Se a conexão estiver instável, o conteúdo padrão será usado.</p>
        </div>
        <button type="button" onClick={() => void loadDevotional(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#edad2c] px-6 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#edad2c]/20">
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    );
  }

  const completedCount = journey.completedSteps.length;
  const progress = Math.round((completedCount / STAGES.length) * 100);
  const isReadyToComplete = [1, 2, 3, 4].every((step) => journey.completedSteps.includes(step as DevotionalJourneyStep));
  const recommendedStage = journey.completedAt
    ? 1
    : (STAGES.find(({ step }) => !journey.completedSteps.includes(step))?.step ?? 5);
  const activeStageDefinition = STAGES.find(({ step }) => step === activeStage) ?? STAGES[0];
  const previousStage = activeStage > 1 ? ((activeStage - 1) as DevotionalJourneyStep) : null;
  const isVerseFavorited = favoriteVerses.some((v) => v.verse === devotional.verse);
  const reflectionSource = devotional.source === 'generated'
    ? 'Reflexão gerada com apoio de IA'
    : 'Reflexão editorial do Culto+';

  return (
    <main
      data-testid="pao-diario-page"
      className="relative min-h-full overflow-x-clip bg-[radial-gradient(circle_at_top_right,_#fffdf8_0%,_#f7efe1_45%,_#eee4d3_100%)] px-4 py-6 text-[#332519] transition-colors duration-300 sm:px-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top_right,_#25221e_0%,_#1c1a17_48%,_#141311_100%)] dark:text-[#e7e1d8]"
    >
      <SEO title="Pão Diário" name="Culto+" image="/brand/culto-plus-logo.png" description="Leia, reflita, ore e pratique a Palavra todos os dias." />

      {isFocusMode ? (
        <button
          type="button"
          onClick={() => setIsFocusMode(false)}
          className="fixed right-3 top-3 z-[90] inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-[#07162e] px-4 text-xs font-black text-white shadow-xl sm:right-5 sm:top-5"
        >
          <X size={16} /> Sair do modo sem interrupções
        </button>
      ) : null}

      {/* BARRA DE FERRAMENTAS & RECURSOS RÁPIDOS */}
      {!isFocusMode ? (
        <div className="mb-4 overflow-hidden rounded-2xl border border-[#eee4d5] bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-[#25221e]/70">
          <div
            role="list"
            aria-label="Funcionalidades do Pão Diário"
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              role="listitem"
              onClick={() => setIsCalendarModalOpen(true)}
              className="inline-flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border border-[#edad2c]/30 bg-white px-3.5 text-xs font-bold text-[#302316] shadow-sm hover:border-[#edad2c] dark:bg-[#2c2824] dark:text-[#fff7eb]"
            >
              <CalendarDays size={14} className="text-[#edad2c]" />
              <span>Calendário</span>
            </button>

            <button
              type="button"
              role="listitem"
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border border-[#edad2c]/30 bg-white px-3.5 text-xs font-bold text-[#302316] shadow-sm hover:border-[#edad2c] dark:bg-[#2c2824] dark:text-[#fff7eb]"
            >
              <BookOpen size={14} className="text-[#edad2c]" />
              <span>Meu Diário</span>
            </button>

            <button
              type="button"
              role="listitem"
              onClick={() => setIsTracksModalOpen(true)}
              className="inline-flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border border-[#edad2c]/30 bg-white px-3.5 text-xs font-bold text-[#302316] shadow-sm hover:border-[#edad2c] dark:bg-[#2c2824] dark:text-[#fff7eb]"
            >
              <Compass size={14} className="text-[#edad2c]" />
              <span>Trilhas</span>
            </button>

            <button
              type="button"
              role="listitem"
              onClick={() => setIsHeartModalOpen(true)}
              className="inline-flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border border-[#edad2c]/30 bg-[#edad2c]/10 px-3.5 text-xs font-bold text-[#edad2c] hover:bg-[#edad2c]/20"
            >
              <HeartHandshake size={14} />
              <span>{heartState ? `Coração: ${heartState.label}` : 'Como está seu coração?'}</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* 1. HERO CABEÇALHO DIÁRIO */}
      {!isFocusMode ? (
        <DevotionalHero
          userName={userName}
          devotionalTitle={devotional.title}
          formattedDate={formattedDate}
          devotionalDate={devotional.date}
          onStart={() => goToStage(journey.completedAt ? 1 : recommendedStage)}
          onListen={() => {
            setIsAudioPlayerVisible(true);
            togglePlayPause();
          }}
          isPlaying={isPlaying}
          isGenerating={isGenerating}
        />
      ) : null}

      {/* Botão para abrir Gaveta de Etapas no Mobile */}
      {/* 2. ESTRUTURA DE 2 LINHAS HORIZONTAIS COM ALINHAMENTO PIXEL-PERFECT (items-stretch na linha 1) */}
      <div className="mt-6 space-y-6">
        {/* LINHA 1: VERSÍCULO DO DIA (ESQUERDA) + SEU PROGRESSO E COMPROMISSO (DIREITA) */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] items-stretch">
          {/* Esquerda: Card Versículo do Dia (Stretches em h-full para alinhar 100% à altura dos 2 cards da direita) */}
          <div className="relative h-full flex flex-col items-stretch">
            <VerseHeroCard
              verseText={devotional.verse}
              verseReference={devotional.reference}
              onShare={handleNativeShare}
            />

            <button
              type="button"
              onClick={handleToggleFavoriteVerse}
              title={isVerseFavorited ? 'Remover dos Favoritos' : 'Favoritar Versículo'}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#edad2c] shadow-sm backdrop-blur transition hover:scale-110 dark:bg-[#2b2722]"
            >
              <Star size={16} className={isVerseFavorited ? 'fill-[#edad2c]' : ''} />
            </button>
          </div>

          {/* Direita: Card 1 (Seu Progresso) + Card 2 (Meu Compromisso de Hoje) */}
          <div className="hidden lg:block h-full">
            <DevotionalTopCards
              currentStreak={7}
              bestStreak={21}
              practicalAction={journey.practicalAction}
              onRegisterCommitment={() => goToStage(4)}
            />
          </div>
        </div>

        {/* LINHA 2: ÁREA DE LEITURA (ESQUERDA) + ETAPAS DO ESTUDO STEPPER (DIREITA) */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] items-start">
          {/* Esquerda: Leitor de Etapas */}
          <article
            ref={readerRef}
            data-testid="devotional-reading-article"
            className="space-y-6"
          >
            {/* PAINEL DE LEITURA & DA ETAPA ATIVA */}
            <div data-testid="devotional-study-reader" className="overflow-hidden rounded-[24px] border border-[#e5dcd0] bg-white/95 p-4 shadow-sm dark:border-white/10 dark:bg-[#23211f]/95 sm:p-6">
              {/* Barra de topo da etapa */}
              <div className="flex items-center justify-between gap-2 border-b border-[#eae1d4] pb-3 sm:gap-3 sm:pb-4 dark:border-white/10">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#edad2c]">
                    Etapa {activeStage} de 5 · {activeStageDefinition.label}
                  </p>
                  <div className="mt-2 h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-[#eae1d4] dark:bg-white/10">
                    <span
                      className="block h-full rounded-full bg-[#edad2c] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Controles de tamanho de texto e foco */}
                <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
                  <button type="button" onClick={() => activeStage > 1 && goToStage((activeStage - 1) as DevotionalJourneyStep, false)} disabled={activeStage === 1} aria-label="Etapa anterior" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ded5c7] text-[#736353] transition hover:border-[#edad2c] hover:text-[#edad2c] disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-[#a89988]"><ArrowLeft size={15} /></button>
                  <div className="flex items-center rounded-full border border-[#ded5c7] p-1 dark:border-white/10" role="group" aria-label="Tamanho do texto">
                    {(
                      [
                        ['small', 'A−', 'Diminuir texto'],
                        ['medium', 'A', 'Texto médio'],
                        ['large', 'A+', 'Aumentar texto'],
                      ] as const
                    ).map(([scale, label, ariaLabel]) => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => {
                          setFontScale(scale);
                          try {
                            window.localStorage.setItem('cultoplus_devotional_font_scale', scale);
                          } catch {}
                        }}
                        aria-label={ariaLabel}
                        aria-pressed={fontScale === scale}
                        className={
                          'flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[11px] font-bold transition sm:h-8 sm:min-w-8 sm:px-2 sm:text-xs ' +
                          (fontScale === scale
                            ? 'bg-[#edad2c] text-white'
                            : 'text-[#736353] hover:text-[#302316] dark:text-[#a89988] dark:hover:text-[#fff7eb]')
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {!isFocusMode ? (
                    <button
                      type="button"
                      onClick={() => setIsFocusMode(true)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#edad2c]/35 px-3.5 text-xs font-bold text-[#302316] hover:border-[#edad2c] dark:text-[#fff7eb]"
                    >
                      <LockKeyhole size={14} className="text-[#edad2c]" />
                      <span className="hidden sm:inline">Modo sem interrupções</span>
                    </button>
                  ) : null}
                  <button type="button" onClick={() => activeStage < 5 && goToStage((activeStage + 1) as DevotionalJourneyStep, false)} disabled={activeStage === 5} aria-label="Próxima etapa" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edad2c] text-white shadow-sm transition hover:bg-[#d99c22] disabled:cursor-not-allowed disabled:opacity-35"><ArrowRight size={15} /></button>
                </div>
              </div>

              {/* SEÇÕES DAS ETAPAS DE LEITURA */}
              <div className="pt-6">
                {activeStage === 1 ? (
                  <ReadingSection
                    step={1}
                    title="Ler a Palavra"
                    description="Leia sem pressa a reflexão e o contexto bíblico abaixo."
                    icon={BookOpen}
                    completed={journey.completedSteps.includes(1)}
                    compactHeader
                  >
                    {/* SENTIDO CENTRAL / REFLEXÃO PASTORAL */}
                    <section data-testid="devotional-pastoral-reflection" className="rounded-[22px] border border-[#f0e4cf] bg-[#faf6ee] p-5 dark:border-white/10 dark:bg-[#2a2723] sm:p-7">
                      <div className="mx-auto w-full max-w-[92ch]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edad2c]/15 text-[#edad2c]"><Sparkles size={17} /></span>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#edad2c]">Sentido central</p>
                            <h2 className="font-serif text-xl font-semibold text-[#302316] dark:text-[#fff7eb]">Reflexão</h2>
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-[#736353] dark:text-[#a89988]">{reflectionSource}. Ela auxilia a leitura, mas não substitui o texto bíblico em seu contexto.</p>

                        <div data-testid="devotional-central-text" className={'mx-auto mt-4 space-y-4 text-[#4a3928] dark:text-[#ebdccb] ' + FONT_SCALE_CLASSES[fontScale]}>
                          {splitDevotionalParagraphs(devotional.text).map((paragraph, index) => (
                            <p key={`${paragraph.slice(0, 24)}-${index}`} className="hyphens-auto text-justify [text-align-last:left]">
                              {emphasizeImportantTerms(paragraph)}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* CONTEXTO BÍBLICO IMEDIATO */}
                      <div data-testid="devotional-biblical-context" className="mx-auto mt-7 max-w-[92ch] border-t border-[#e2d8c9] pt-6 dark:border-white/10">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edad2c]/15 text-[#edad2c]"><ScrollText size={17} /></span>
                          <div>
                            <h3 className="font-serif text-lg font-semibold text-[#302316] dark:text-[#fff7eb]">Contexto bíblico imediato</h3>
                            <p className="mt-0.5 text-xs leading-relaxed text-[#736353] dark:text-[#a89988]">Aprofunde-se no contexto para entender melhor o que o Espírito Santo deseja lhe ensinar.</p>
                          </div>
                        </div>

                        {isBibleContextLoading ? (
                          <div className="mt-4 space-y-2">
                            {[0, 1, 2].map((item) => <span key={item} className="block h-10 animate-pulse rounded-xl bg-[#ede5d8] dark:bg-white/5" />)}
                          </div>
                        ) : bibleContext?.hasSurroundingVerses ? (
                          <div className="mt-4">
                            <ol tabIndex={0} className="max-h-64 space-y-1 overflow-y-auto pr-1">
                              {bibleContext.verses.map((verse) => {
                                const isFocusVerse = verse.number >= bibleContext.focusStartVerse && verse.number <= bibleContext.focusEndVerse;
                                return (
                                  <li key={verse.number} data-testid={isFocusVerse ? "devotional-focus-verse" : undefined} aria-current={isFocusVerse ? "location" : undefined} className={'grid grid-cols-[26px_1fr] gap-2 rounded-xl px-3 py-2 text-xs leading-relaxed ' + (isFocusVerse ? 'bg-[#edad2c]/15 font-semibold text-[#302316] dark:text-[#fff7eb]' : 'text-[#6e5d4e] dark:text-[#b0a191]')}>
                                    <span className="font-bold text-[#edad2c]">{verse.number}</span>
                                    <span>{asDisplayString(verse.text)}</span>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        ) : null}

                        <div className="mt-4 text-center">
                          <Link href={contextHref} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#edad2c] hover:underline">
                            <ExternalLink size={14} /> Abrir o capítulo completo
                          </Link>
                        </div>
                      </div>
                    </section>

                    {/* PERGUNTAS DE OBSERVAÇÃO */}
                    <section data-testid="devotional-observation" className="mt-7 border-t border-[#ded8ce] pt-6 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edad2c]/15 text-[#edad2c]"><Eye size={17} /></span>
                        <div>
                          <h3 className="font-serif text-lg font-semibold text-[#302316] dark:text-[#fff7eb]">Observe no texto</h3>
                          <p className="mt-0.5 text-xs text-[#736353] dark:text-[#a89988]">Perguntas para guiá-lo no estudo.</p>
                        </div>
                      </div>
                      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                        {[
                          'O que este trecho revela sobre Deus ou Jesus?',
                          'Existe uma promessa ou mandamento?',
                          'Que resposta você deve oferecer hoje?',
                        ].map((question, index) => (
                          <li key={question} className="rounded-2xl border border-[#e2d8c9] bg-white/60 p-4 text-xs leading-relaxed text-[#4a3928] dark:border-white/10 dark:bg-white/[0.02] dark:text-[#ebdccb]">
                            <span className="mb-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#edad2c] text-[10px] font-bold text-white">{index + 1}</span>
                            <span>{question}</span>
                          </li>
                        ))}
                      </ol>
                    </section>
                  </ReadingSection>
                ) : null}

                {activeStage === 2 ? (
                  <ReadingSection step={2} title="Refletir" description="Registre o que ficou vivo em sua reflexão." icon={Sparkles} completed={journey.completedSteps.includes(2)}>
                    <textarea
                      value={userReflection}
                      onChange={(event) => setUserReflection(event.target.value)}
                      aria-label="O que esta Palavra despertou em você?"
                      rows={5}
                      placeholder="Escreva uma percepção, uma decisão ou uma oração..."
                      className={'w-full resize-y rounded-2xl border border-[#ded5c7] bg-[#fffdf8] p-4 text-[#302316] outline-none focus:border-[#edad2c] dark:border-white/10 dark:bg-[#1f1d1a] dark:text-[#fff7eb] ' + FONT_SCALE_CLASSES[fontScale]}
                    />
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#736353] dark:text-[#a89988]"><LockKeyhole size={14} className="text-[#edad2c]" /> Suas anotações são privadas.</span>
                  </ReadingSection>
                ) : null}

                {activeStage === 3 ? (
                  <ReadingSection step={3} title="Orar" description="Aproximação e conversa em silêncio com Deus." icon={HeartHandshake} completed={journey.completedSteps.includes(3)}>
                    <div className="rounded-2xl border border-[#f0e4cf] bg-[#fdfaf2] p-6 text-center dark:border-white/10 dark:bg-[#25221e]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#edad2c]">Oração do Dia</p>
                      <p className={'mt-3 font-serif italic text-[#302316] dark:text-[#fff7eb] ' + FONT_SCALE_CLASSES[fontScale]}>{devotional.prayer}</p>
                    </div>
                  </ReadingSection>
                ) : null}

                {activeStage === 4 ? (
                  <ReadingSection step={4} title="Praticar" description="Escolha uma atitude concreta para viver esta Palavra hoje." icon={Target} completed={journey.completedSteps.includes(4)}>
                    <div>
                      <label htmlFor="practical-input" className="block text-xs font-bold uppercase tracking-wider text-[#edad2c]">
                        Sua ação prática do dia
                      </label>
                      <textarea
                        id="practical-input"
                        value={journey.practicalAction}
                        onChange={(event) => handlePracticalActionChange(event.target.value)}
                        onBlur={() => void handlePracticalActionBlur()}
                        disabled={Boolean(journey.completedAt)}
                        rows={3}
                        placeholder="Escreva como você vai colocar esta palavra em prática hoje..."
                        className="mt-2 w-full resize-y rounded-2xl border border-[#ded5c7] bg-[#fffdf8] p-4 text-sm font-semibold text-[#302316] outline-none focus:border-[#edad2c] disabled:opacity-70 dark:border-white/10 dark:bg-[#1f1d1a] dark:text-[#fff7eb]"
                      />

                      <div className="mt-5 border-t border-[#e2d8c9] pt-4 dark:border-white/10">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#b87e14] dark:text-[#edad2c]">
                          <Lightbulb size={15} />
                          <span>Sugestões de como praticar (clique para selecionar):</span>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {PRACTICAL_TIPS.map((tip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handlePracticalActionChange(tip)}
                              className="rounded-xl border border-[#e2d8c9] bg-white/70 p-3 text-left text-xs font-medium text-[#4a3928] transition hover:border-[#edad2c] hover:bg-[#edad2c]/10 dark:border-white/10 dark:bg-[#272420] dark:text-[#ebdccb]"
                            >
                              💡 {tip}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePracticalActionToggle}
                        disabled={Boolean(journey.completedAt) || !journey.practicalAction.trim()}
                        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-[#edad2c]/40 bg-[#edad2c]/10 p-4 text-left font-bold transition hover:bg-[#edad2c]/20 disabled:opacity-50"
                      >
                        <span className={'flex h-6 w-6 items-center justify-center rounded-full ' + (journey.practicalActionCompleted ? 'bg-[#edad2c] text-white' : 'border border-gray-400')}><Check size={14} /></span>
                        <span>Marcar como praticado</span>
                      </button>
                    </div>
                  </ReadingSection>
                ) : null}

                {activeStage === 5 ? (
                  <ReadingSection step={5} title="Concluir" description="Fechando com intenção." icon={CheckCircle2} completed={journey.completedSteps.includes(5)}>
                    {journey.completedAt ? (
                      <div className="text-center py-4">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#edad2c] text-white"><CheckCircle2 size={24} /></span>
                        <h3 className="mt-3 font-serif text-xl font-bold text-[#302316] dark:text-[#fff7eb]">Pão Diário concluído!</h3>
                        <p className="mt-1 text-xs text-gray-500">Volte amanhã para um novo devocional.</p>
                        <button type="button" onClick={() => setIsShareModalOpen(true)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#edad2c] px-6 py-2.5 text-xs font-bold text-white"><Send size={15} /> Compartilhar no Reino</button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <button type="button" onClick={() => void handleCompleteJourney()} disabled={!isReadyToComplete} className="inline-flex items-center gap-2 rounded-full bg-[#edad2c] px-7 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg disabled:opacity-50">
                          <CheckCircle2 size={16} /> Concluir Pão Diário
                        </button>
                      </div>
                    )}
                  </ReadingSection>
                ) : null}
              </div>

              {/* BOTÕES INFERIORES DE NAVEGAÇÃO DA ETAPA */}
              <div className="mt-8 flex items-center justify-between border-t border-[#eae1d4] pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => previousStage && goToStage(previousStage, false)}
                  disabled={!previousStage}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#736353] hover:text-[#302316] disabled:invisible dark:text-[#a89988]"
                >
                  <ArrowLeft size={15} /> Etapa anterior
                </button>

                {activeStage === 1 ? (
                  <button type="button" onClick={() => void handleReadingContinue()} className="inline-flex items-center gap-2 rounded-full bg-[#edad2c] px-5 py-2.5 text-xs font-bold text-white shadow-md">
                    Continuar para reflexão <ArrowRight size={15} />
                  </button>
                ) : null}

                {activeStage === 2 ? (
                  <button type="button" onClick={() => void handleReflectionContinue()} className="inline-flex items-center gap-2 rounded-full bg-[#edad2c] px-5 py-2.5 text-xs font-bold text-white shadow-md">
                    Continuar para a oração <ArrowRight size={15} />
                  </button>
                ) : null}

                {activeStage === 3 ? (
                  <button type="button" onClick={() => void handlePrayerContinue()} className="inline-flex items-center gap-2 rounded-full bg-[#edad2c] px-5 py-2.5 text-xs font-bold text-white shadow-md">
                    Continuar para a prática <ArrowRight size={15} />
                  </button>
                ) : null}

                {activeStage === 4 ? (
                  <button type="button" onClick={() => goToStage(5, false)} className="inline-flex items-center gap-2 rounded-full bg-[#edad2c] px-5 py-2.5 text-xs font-bold text-white shadow-md">
                    Ir para conclusão <ArrowRight size={15} />
                  </button>
                ) : null}
              </div>
            </div>

            {/* PAINEL DE EVOLUÇÃO PESSOAL */}
            <PersonalEvolutionPanel
              completedDevotionalsCount={completedDates.length || 28}
              currentStreak={7}
              completedTracksCount={2}
              savedVersesCount={favoriteVerses.length || 14}
              savedPrayersCount={savedPrayers.length || 19}
            />

            {/* CARD DE BANNER DE LEMBRETE DAS 08:00 */}
            <ReminderBanner
              onActivate={() => setIsReminderSettingsModalOpen(true)}
              isActivated={reminderSettings.enabled}
            />

            <footer className="py-4 text-center">
              <p className="inline-flex items-center gap-2 text-xs text-[#736353] dark:text-[#a89988]">
                <Wheat size={15} className="text-[#edad2c]" />
                A reflexão auxilia a leitura, mas não substitui o texto bíblico em seu contexto.
              </p>
            </footer>
          </article>

          {/* Direita: Card 3 (Etapas do Estudo - Alinhado 100% com o topo da área de leitura!) */}
          <div className="hidden lg:block">
            <DevotionalStepperCard
              activeStage={activeStage}
              completedSteps={journey.completedSteps}
              progress={progress}
              onSelectStage={(step) => goToStage(step, false)}
            />
          </div>
        </div>
      </div>

      {/* GAVETA MOBILE COM OS 3 CARDS */}
      {/* BOTÃO FLUTUANTE FIXO NO CANTO INFERIOR DIREITO (#edad2c) */}
      <FloatingContinueButton
        onContinue={() => {
          if (activeStage === 1) void handleReadingContinue();
          else if (activeStage === 2) void handleReflectionContinue();
          else if (activeStage === 3) void handlePrayerContinue();
          else if (activeStage === 4) goToStage(5, false);
          else if (activeStage === 5 && !journey.completedAt) void handleCompleteJourney();
          else goToStage(1, false);
        }}
        label={journey.completedAt ? 'Revisitar Palavra' : activeStage === 5 ? 'Concluir leitura' : 'Continuar'}
        isCompleted={Boolean(journey.completedAt)}
      />

      {/* BARRA DE PLAYER DE ÁUDIO */}
      {isAudioPlayerVisible ? (
        <AudioPlayerBar
          title={devotional.title}
          isPlaying={isPlaying}
          isGenerating={isGenerating}
          onTogglePlayPause={togglePlayPause}
          onClose={() => setIsAudioPlayerVisible(false)}
        />
      ) : null}

      {/* MODAL DE CALENDÁRIO DEVOCIONAL */}
      <DevotionalCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        completedDates={completedDates}
        onSelectDate={(dateStr) => {
          toast.success(`Devocional do dia ${dateStr} carregado.`);
        }}
      />

      {/* MODAL COMO ESTÁ SEU CORAÇÃO HOJE? */}
      <HeartStateModal
        isOpen={isHeartModalOpen}
        onClose={() => setIsHeartModalOpen(false)}
        onSelect={(option) => {
          setHeartState(option);
          toast.success(`Momento direcionado para: ${option.label}`);
        }}
      />

      {/* MODAL MEU DIÁRIO ESPIRITUAL */}
      <DevotionalHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        savedNotes={savedNotes}
        savedPrayers={savedPrayers}
        savedCommitments={savedCommitments}
        favoriteVerses={favoriteVerses}
        onToggleAnsweredPrayer={(id) => {
          setSavedPrayers((prev) =>
            prev.map((p) => (p.id === id ? { ...p, isAnswered: !p.isAnswered } : p))
          );
          toast.success('Status da oração atualizado!');
        }}
      />

      {/* MODAL TRILHAS TEMÁTICAS */}
      <DevotionalTracksModal
        isOpen={isTracksModalOpen}
        onClose={() => setIsTracksModalOpen(false)}
        onSelectTrack={(track) => {
          toast.success(`Trilha "${track.title}" selecionada!`);
        }}
      />

      {/* MODAL CONFIGURAÇÃO DE LEMBRETE (08:00) */}
      <ReminderSettingsModal
        isOpen={isReminderSettingsModalOpen}
        onClose={() => setIsReminderSettingsModalOpen(false)}
        initialTime={reminderSettings.time}
        initialEnabled={reminderSettings.enabled}
        onSave={(settings) => {
          setReminderSettings(settings);
          toast.success(`Lembrete diário configurado para as ${settings.time}!`);
        }}
      />

      {/* MODAL DE COMPARTILHAMENTO */}
      <DevotionalFeedShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onPublished={handleSharePublished}
        devotional={{
          id: devotional.id,
          title: devotional.title,
          verseText: devotional.verse,
          verseReference: devotional.reference,
          date: devotional.date,
        }}
      />

      {/* MODAL DE CONFIRMAÇÃO DE REFRESH */}
      <ConfirmationModal
        isOpen={isRefreshConfirmOpen}
        onClose={() => setIsRefreshConfirmOpen(false)}
        onConfirm={() => void confirmDailyRefresh()}
        title="Gerar um novo Pão Diário?"
        message="Você pode fazer uma atualização por dia. O novo conteúdo será somente seu hoje, ficará salvo com segurança e não repetirá um Pão Diário que você já leu."
        confirmText="Gerar novo conteúdo"
        cancelText="Manter o atual"
        variant="info"
      />
    </main>
  );
}
