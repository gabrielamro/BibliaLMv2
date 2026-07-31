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
  Clock3,
  ExternalLink,
  Eye,
  Headphones,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  Pause,
  Quote,
  RefreshCw,
  Save,
  ScrollText,
  Send,
  Share2,
  Sparkles,
  Target,
  Wheat,
  X,
} from 'lucide-react';
import SEO from '../components/SEO';
import DevotionalFeedShareModal from '../components/DevotionalFeedShareModal';
import ConfirmationModal from '../components/ConfirmationModal';
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

const splitDevotionalParagraphs = (content: string) => {
  const normalized = content.replace(/\r/g, '').trim();
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

const emphasizeImportantTerms = (content: string) => content
  .split(IMPORTANT_TERM_PATTERN)
  .map((part, index) => IMPORTANT_TERM_SET.has(part.toLocaleLowerCase('pt-BR')) ? (
    <strong key={`${part}-${index}`} className="font-bold text-[#3f2c1e] dark:text-[#f1e8dc]">{part}</strong>
  ) : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>);

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
    verse: data.verseText || '',
    reference: data.verseReference || '',
    text: data.content || '',
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
      role="tabpanel"
      aria-labelledby={`devotional-stage-tab-${step}`}
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <header className={compactHeader ? 'mb-5' : 'mb-7 border-b border-[#ded8ce] pb-6 dark:border-white/10'}>
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${completed ? 'bg-[#74451f] text-[#fff6df]' : 'border border-[#c9a45c]/35 bg-[#f6ead0] text-[#74451f] dark:bg-[#c9a45c]/10 dark:text-[#e7c77f]'}`}>
            {completed ? <Check size={15} strokeWidth={3} /> : <Icon size={16} />}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a5a25] dark:text-[#e7c77f]">
            Etapa {step} de 5{compactHeader ? ` · ${title}` : ''}
          </span>
          {completed ? <span className="ml-auto text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a5a25] dark:text-[#e7c77f]">Concluída</span> : null}
        </div>
        {!compactHeader ? (
          <>
            <h2 className="mt-5 font-serif text-2xl font-semibold leading-tight text-[#3a2416] sm:text-[28px] dark:text-[#fff7e8]">{title}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#746558] dark:text-[#c9b9a5]">{description}</p>
          </>
        ) : null}
      </header>
      {children}
    </section>
  );
}

interface StageNavigationProps {
  activeStage: DevotionalJourneyStep;
  completedSteps: DevotionalJourneyStep[];
  progress: number;
  onSelect: (step: DevotionalJourneyStep) => void;
}

function StageNavigation({ activeStage, completedSteps, progress, onSelect }: StageNavigationProps) {
  return (
    <nav
      data-testid="devotional-stage-navigation"
      aria-labelledby="devotional-stage-navigation-title"
      className="border-t border-[#d9c59d] bg-[#f8f3ea]/75 p-4 sm:p-5 lg:border-l lg:border-t-0 lg:bg-[#f6efe3]/72 dark:border-[#a88c61]/18 dark:bg-[#252320]"
    >
      <div className="lg:sticky lg:top-4">
        <div className="flex items-end justify-between gap-4 lg:block">
          <div>
            <p id="devotional-stage-navigation-title" className="text-[10px] font-black uppercase tracking-[0.16em] text-[#563016] dark:text-[#f2dfbd]">Etapas do estudo</p>
            <p className="mt-1 text-xs leading-relaxed text-[#817264] dark:text-[#aa9c8e]">Continue no seu ritmo.</p>
          </div>
          <span className="shrink-0 text-xs font-black tabular-nums text-[#8a5a25] lg:mt-3 lg:block dark:text-[#e7c77f]">{progress}%</span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ded5c8] dark:bg-white/10">
          <span className="block h-full rounded-full bg-[linear-gradient(90deg,_#8a5a25,_#d2aa59)] transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div role="tablist" aria-label="Etapas do estudo" className="mt-4 grid gap-2 sm:grid-cols-5 lg:grid-cols-1">
          {STAGES.map(({ step, label, shortLabel, icon: StageIcon }) => {
            const completed = completedSteps.includes(step);
            const active = activeStage === step;
            return (
              <button
                id={`devotional-stage-tab-${step}`}
                key={step}
                type="button"
                role="tab"
                aria-selected={active}
                aria-current={active ? 'step' : undefined}
                aria-controls={`devotional-step-${step}`}
                aria-label={`Abrir etapa ${step}: ${label}`}
                onClick={() => onSelect(step)}
                className={`group flex min-h-12 min-w-0 items-center gap-3 rounded-xl border px-3 text-left transition ${
                  active
                    ? 'border-[#9f6c2c] bg-[#74451f] text-[#fff8ed] shadow-md dark:border-[#d2aa62] dark:bg-[#70441f]'
                    : completed
                      ? 'border-[#bda477] bg-[#fffaf0] text-[#57371e] hover:border-[#9f6c2c] dark:border-[#c9a45c]/25 dark:bg-[#2b2824] dark:text-[#eee1ce]'
                      : 'border-transparent bg-white/65 text-[#756658] hover:border-[#c9a45c]/50 hover:bg-white dark:bg-white/[0.035] dark:text-[#aa9c8e] dark:hover:border-[#c9a45c]/25 dark:hover:text-[#f4eadc]'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                  active
                    ? 'border-[#f0d69e]/45 bg-white/10 text-[#ffe7b5]'
                    : completed
                      ? 'border-[#74451f] bg-[#74451f] text-[#fff7e7]'
                      : 'border-[#d2c5b3] bg-[#eee4d3] text-[#7d6a59] dark:border-white/10 dark:bg-white/5 dark:text-[#9f8b78]'
                }`}>
                  {completed ? <Check size={14} strokeWidth={3} /> : <StageIcon size={15} />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[9px] font-black uppercase tracking-[0.12em] ${active ? 'text-[#f0d69e]' : 'text-[#9a6a33] dark:text-[#b89a6a]'}`}>Etapa {step}</span>
                  <span className="mt-0.5 block truncate text-xs font-bold sm:hidden lg:block">{label}</span>
                  <span className="mt-0.5 hidden truncate text-xs font-bold sm:block lg:hidden">{shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
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
  const [pullDistance, setPullDistance] = useState(0);
  const readerRef = useRef<HTMLElement>(null);
  const pullStartYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);

  const userId = currentUser ? (currentUser.uid ?? currentUser.id) : null;

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
      const restoredReflection = historyEntry?.reflection || savedJourney.reflectionDraft || '';
      let completedSteps = savedJourney.completedSteps;
      if (restoredReflection.trim()) completedSteps = addCompletedStep(completedSteps, 2);
      if (historyEntry?.is_amen) completedSteps = addCompletedStep(completedSteps, 3);
      if (savedJourney.completedAt) completedSteps = [1, 2, 3, 4, 5];

      const restoredJourney: DevotionalJourneyState = {
        ...savedJourney,
        reflectionDraft: restoredReflection,
        completedSteps,
      };
      const firstIncompleteStage = STAGES.find(({ step }) => !completedSteps.includes(step))?.step ?? 5;

      setDevotional(nextDevotional);
      setRefreshAvailable(Boolean(nextDevotional.refreshAvailable));
      setUserReflection(restoredReflection);
      setJourney(restoredJourney);
      setActiveStage(savedJourney.completedAt ? 5 : firstIncompleteStage);
    } catch (error) {
      console.error('Erro ao carregar Pão Diário:', error);
      if (forceNew) {
        if (error instanceof DailyDevotionalError && error.code === 'DAILY_REFRESH_USED') {
          setRefreshAvailable(false);
        }
        toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o Pão Diário.');
      } else {
        setDevotional(null);
        setJourney(null);
      }
    } finally {
      if (forceNew) setIsRefreshingDaily(false);
      else setLoading(false);
    }
  }, [userId]);

  const requestDailyRefresh = useCallback(() => {
    if (userId && !refreshAvailable) {
      showNotification('Você já usou sua atualização de hoje. Amanhã haverá uma nova opção.', 'info');
      return;
    }
    setIsRefreshConfirmOpen(true);
  }, [refreshAvailable, showNotification, userId]);

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

  const handlePullStart = (event: React.TouchEvent<HTMLElement>) => {
    if (window.matchMedia('(min-width: 640px)').matches || window.scrollY > 0) return;
    pullStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handlePullMove = (event: React.TouchEvent<HTMLElement>) => {
    if (pullStartYRef.current === null || window.scrollY > 0) return;
    const currentY = event.touches[0]?.clientY ?? pullStartYRef.current;
    const nextDistance = Math.min(96, Math.max(0, currentY - pullStartYRef.current) * 0.55);
    pullDistanceRef.current = nextDistance;
    setPullDistance(nextDistance);
  };

  const handlePullEnd = () => {
    const shouldConfirm = pullDistanceRef.current >= 64;
    pullStartYRef.current = null;
    pullDistanceRef.current = 0;
    setPullDistance(0);
    if (shouldConfirm) requestDailyRefresh();
  };

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

  useEffect(() => {
    try {
      const savedScale = window.localStorage.getItem('cultoplus_devotional_font_scale');
      if (savedScale === 'small' || savedScale === 'medium' || savedScale === 'large') {
        setFontScale(savedScale);
      }
    } catch {
      // Preferência local indisponível: mantém o tamanho padrão.
    }
  }, []);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/devocional') {
      setIsFocusMode(false);
    }
  }, [setIsFocusMode]);

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
      if (userId && userReflection.trim()) {
        await dbService.saveUserDevotionalAction(userId, devotional.id, 'reflection', userReflection.trim());
      }
      await persistJourney({
        ...journey,
        reflectionDraft: userReflection,
        completedSteps: addCompletedStep(journey.completedSteps, 2),
        updatedAt: new Date().toISOString(),
      });
      toast.success(userReflection.trim() ? 'Reflexão salva com privacidade.' : 'Etapa de reflexão concluída.');
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
      await persistJourney({
        ...journey,
        completedSteps: addCompletedStep(journey.completedSteps, 3),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Amém. Oração concluída.');
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
    const practicalAction = journey.practicalAction.trim()
      || createInitialDevotionalJourney(journey.devotionalId).practicalAction;
    await persistJourney({ ...journey, practicalAction, updatedAt: new Date().toISOString() });
  };

  const handlePracticalActionToggle = async () => {
    if (!journey || journey.completedAt) return;
    const practicalActionCompleted = !journey.practicalActionCompleted;
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

    if (userId) {
      try {
        await recordActivity('devotional', `Concluiu o Pão Diário: ${devotional.title}`, {
          sourceId: devotional.id,
          sourceType: 'devotional',
        });
      } catch (error) {
        console.warn('Jornada concluída, mas a atividade não foi registrada:', error);
      }
    }
    toast.success('Pão Diário concluído. Que esta Palavra acompanhe o seu dia!');
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

  const updateFontScale = (next: FontScale) => {
    setFontScale(next);
    try {
      window.localStorage.setItem('cultoplus_devotional_font_scale', next);
    } catch {
      // A preferência continua válida durante esta sessão.
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
      <div className="flex min-h-[72vh] items-center justify-center bg-[#f5ecdc] dark:bg-[#160f0b]">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c9a45c]/40 bg-[#fff8e8] text-[#74451f] dark:bg-[#c9a45c]/10 dark:text-[#e7c77f]">
            <Loader2 className="animate-spin" size={25} />
          </span>
          <div>
            <p className="text-sm font-black text-[#4d301c] dark:text-[#fff7e7]">Preparando seu Pão Diário</p>
            <p className="mt-1 text-xs text-gray-500">Palavra, reflexão, oração e prática.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!devotional || !journey) {
    return (
      <div className="flex min-h-[72vh] flex-col items-center justify-center gap-5 bg-[#f5ecdc] p-6 text-center dark:bg-[#160f0b]">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"><Wheat size={28} /></span>
        <div>
          <h1 className="text-2xl font-black text-[#4d301c] dark:text-[#fff7e7]">O Pão Diário não carregou</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">Tente novamente. Se a conexão estiver instável, o conteúdo padrão será usado.</p>
        </div>
        <button type="button" onClick={() => void loadDevotional(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#74451f] px-5 text-xs font-black uppercase tracking-wider text-[#fff8e8] shadow-lg shadow-[#3a2416]/15">
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

  return (
    <main
      data-testid="pao-diario-page"
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
      className="relative min-h-full overflow-x-clip bg-[radial-gradient(circle_at_top_right,_#fffdf7_0,_#f5efe5_42%,_#ece2d3_100%)] text-[#3c2a1d] dark:bg-[radial-gradient(circle_at_top_right,_#292724_0,_#1f1e1c_48%,_#171614_100%)] dark:text-[#e7e1d8]"
    >
      <SEO title="Pão Diário" name="Culto+" image="/brand/culto-plus-logo.png" description="Leia, reflita, ore e pratique a Palavra todos os dias." />

      <div
        aria-live="polite"
        className={'fixed left-1/2 top-2 z-[95] flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#c9a45c]/45 bg-[#fffaf0]/95 px-3 py-2 text-[10px] font-bold text-[#74451f] shadow-lg backdrop-blur transition sm:hidden dark:bg-[#291b13] dark:text-[#e7c77f] ' + (pullDistance > 8 ? 'opacity-100' : 'pointer-events-none opacity-0')}
        style={{ transform: `translate(-50%, ${Math.max(0, pullDistance - 12)}px)` }}
      >
        <RefreshCw size={13} className={pullDistance >= 64 ? 'rotate-180 transition-transform' : 'transition-transform'} />
        {pullDistance >= 64 ? 'Solte para confirmar' : 'Puxe para atualizar'}
      </div>

      {isFocusMode ? (
        <button
          type="button"
          onClick={() => setIsFocusMode(false)}
          className="fixed right-3 top-3 z-[90] inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-[#07162e] px-4 text-xs font-black text-white shadow-xl sm:right-5 sm:top-5"
        >
          <X size={16} /> Sair do modo sem interrupções
        </button>
      ) : null}

      {!isFocusMode ? (
        <header data-testid="pao-diario-header" className="relative overflow-hidden border-b border-[#c9a45c]/25 bg-[linear-gradient(118deg,_#302821_0%,_#4b4034_50%,_#6b5a45_100%)] px-4 py-5 text-[#f3eee5] sm:px-6 sm:py-8 lg:px-8">
          <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -top-16 h-52 w-52 rounded-full bg-[#f0cf83]/15 blur-3xl" />
          <div className="relative mx-auto flex w-full max-w-none flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#f1d490]">
                <span className="inline-flex items-center gap-1.5"><Wheat size={14} /> Pão Diário</span>
                <span className="text-white/30">•</span>
                <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-white/70"><CalendarDays size={14} /> {formattedDate}</span>
                <span className="text-white/30">•</span>
                <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-white/70"><Clock3 size={14} /> cerca de 5 minutos</span>
                <span className="hidden text-white/30 sm:inline">•</span>
                <button
                  type="button"
                  onClick={requestDailyRefresh}
                  disabled={isRefreshingDaily || Boolean(userId && !refreshAvailable)}
                  className="hidden min-h-8 items-center gap-1.5 rounded-full px-2 normal-case tracking-normal text-white/65 transition hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-55 sm:inline-flex"
                >
                  <RefreshCw size={13} className={isRefreshingDaily ? 'animate-spin' : ''} />
                  {isRefreshingDaily ? 'Atualizando' : userId && !refreshAvailable ? 'Atualizado hoje' : 'Atualizar'}
                </button>
              </div>
              <h1 className="mt-3 max-w-3xl font-serif text-[26px] font-semibold leading-tight text-white sm:text-[34px]">{devotional.title}</h1>
              <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-white/65 sm:block">Um estudo breve para ler a Palavra, responder com sinceridade e levar uma decisão para o dia.</p>
            </div>
            <button
              type="button"
              onClick={() => goToStage(journey.completedAt ? 1 : recommendedStage)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#ffe4a2]/60 bg-[#d2aa59] px-6 text-xs font-black uppercase tracking-[0.12em] text-[#2d190d] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#e2c177] sm:min-h-12 lg:self-auto"
            >
              {journey.completedAt ? 'Revisitar a Palavra' : completedCount ? 'Continuar estudo' : 'Começar estudo'} <ArrowRight size={16} />
            </button>
          </div>
        </header>
      ) : null}

      <article
        ref={readerRef}
        data-testid="devotional-reading-article"
        className={'relative mx-auto w-full max-w-none scroll-mt-3 px-3 pb-7 sm:px-6 sm:pb-10 lg:px-8 ' + (isFocusMode ? 'pt-16 sm:pt-20' : 'pt-3 sm:pt-6')}
      >
        <div data-testid="devotional-study-reader" className="w-full overflow-hidden rounded-[24px] border border-[#c9a45c]/40 bg-[#fffdf8] shadow-[0_22px_60px_rgba(67,55,43,0.10)] dark:border-[#a88c61]/25 dark:bg-[#23211f]">
          <div className="border-b border-[#d9c59d] bg-[#fffdf7]/80 px-4 pb-3 pt-4 backdrop-blur sm:px-6 lg:px-8 dark:border-[#a88c61]/18 dark:bg-[#2b2926]/90">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-4">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-[#8a5a25] dark:text-[#e7c77f]">
                    {activeStageDefinition.label} · etapa {activeStage} de 5
                  </p>
                  <span className="shrink-0 text-[10px] font-bold text-[#77736d] sm:hidden dark:text-gray-400">{progress}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e6e0d7] sm:w-64 dark:bg-white/10">
                  <span className="block h-full rounded-full bg-[linear-gradient(90deg,_#8a5a25,_#d2aa59)] transition-[width] duration-500" style={{ width: String(progress) + '%' }} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  disabled={isGenerating}
                  aria-label={isPlaying ? 'Pausar áudio do Pão Diário' : 'Ouvir Pão Diário'}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#c9a45c]/45 px-4 text-xs font-bold text-[#5b3a20] transition hover:border-[#9a682e] hover:text-[#74451f] disabled:opacity-60 dark:border-[#c9a45c]/20 dark:text-[#e8d8c5]"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={16} /> : isPlaying ? <Pause size={16} /> : <Headphones size={16} />}
                  {isGenerating ? 'Preparando' : isPlaying ? 'Pausar' : 'Ouvir'}
                </button>
                <div className="flex min-h-11 items-center rounded-full border border-[#d8d1c6] p-1 dark:border-white/10" role="group" aria-label="Tamanho do texto">
                  {([
                    ['small', 'A−', 'Diminuir texto'],
                    ['medium', 'A', 'Texto médio'],
                    ['large', 'A+', 'Aumentar texto'],
                  ] as const).map(([scale, label, ariaLabel]) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => updateFontScale(scale)}
                      aria-label={ariaLabel}
                      aria-pressed={fontScale === scale}
                      className={'flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs font-black transition ' + (fontScale === scale ? 'bg-[#74451f] text-[#fff7e7]' : 'text-[#7d6a59] hover:text-[#563016] dark:text-[#a99683] dark:hover:text-[#fff7e7]')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {!isFocusMode ? (
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#c9a45c]/45 px-4 text-xs font-bold text-[#5b3a20] transition hover:border-[#9a682e] hover:text-[#74451f] dark:border-[#c9a45c]/20 dark:text-[#e8d8c5]"
                  >
                    <LockKeyhole size={15} /> <span className="hidden sm:inline">Modo sem interrupções</span><span className="sm:hidden">Foco</span>
                  </button>
                ) : null}
              </div>
            </div>

          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
          <div aria-live="polite" className="min-h-[420px] px-5 py-7 sm:px-10 sm:py-8 lg:px-10 xl:px-12">
            {activeStage === 1 ? (
              <ReadingSection
                step={1}
                title="Ler a Palavra"
                description="Leia sem pressa. Se puder, repita o versículo em voz baixa antes de seguir."
                icon={BookOpen}
                completed={journey.completedSteps.includes(1)}
                compactHeader
              >
                <div className="text-center">
                  <Quote className="mx-auto text-[#b58132]/45 dark:text-[#e7c77f]/35" size={34} aria-hidden="true" />
                  <blockquote
                    data-testid="devotional-main-verse"
                    className={'mx-auto mt-4 max-w-4xl font-normal tracking-[0.008em] text-[#3b3129] dark:text-[#e7e0d4] ' + FONT_SCALE_CLASSES[fontScale]}
                    style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
                  >“{devotional.verse}”</blockquote>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#8a5a25] dark:text-[#e7c77f]">{devotional.reference}</p>
                  <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-[#77736d] dark:text-gray-400">
                    Leia sem pressa. Se puder, repita o versículo em voz baixa antes de seguir.
                  </p>
                </div>

                {bibleContext ? (
                  <dl data-testid="devotional-verse-overview" className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-[#ded8ce] py-4 dark:border-white/10">
                    <div className="text-center">
                      <dt className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8b8780] dark:text-gray-500">Livro e capítulo</dt>
                      <dd className="mt-1 text-sm font-semibold text-[#17324d] dark:text-gray-100">{bibleContext.bookName} {bibleContext.chapter}</dd>
                    </div>
                    <div className="text-center">
                      <dt className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8b8780] dark:text-gray-500">Versículo-base</dt>
                      <dd className="mt-1 text-sm font-semibold text-[#17324d] dark:text-gray-100">{bibleContext.focusReference}</dd>
                    </div>
                    <div className="text-center">
                      <dt className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8b8780] dark:text-gray-500">Parte da Bíblia</dt>
                      <dd className="mt-1 text-sm font-semibold text-[#17324d] dark:text-gray-100">{bibleContext.testamentLabel}</dd>
                    </div>
                  </dl>
                ) : null}

                <section data-testid="devotional-pastoral-reflection" className="mt-7 rounded-[22px] border border-[#c9a45c]/35 bg-[#faf6ee] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-[#a88c61]/24 dark:bg-[#2a2825] sm:p-7">
                  <div className="mx-auto w-full max-w-[92ch]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a45c]/35 bg-[#f3e3c4] text-[#74451f] dark:bg-[#c9a45c]/10 dark:text-[#e7c77f]"><Sparkles size={17} /></span>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a5a25] dark:text-[#e7c77f]">Sentido central</p>
                        <h2 className="font-serif text-xl font-semibold text-[#3a2416] dark:text-[#fff7e8]">Reflexão</h2>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-[#77736d] dark:text-gray-400">Reflexão pastoral para auxiliar a leitura; confira sempre o sentido no capítulo completo.</p>
                    <div data-testid="devotional-central-text" className={'mx-auto mt-5 max-w-[82ch] space-y-4 text-[#514438] dark:text-[#e4d7c9] ' + FONT_SCALE_CLASSES[fontScale]}>
                      {splitDevotionalParagraphs(devotional.text).map((paragraph, index) => (
                        <p key={`${paragraph.slice(0, 24)}-${index}`} className="hyphens-auto text-justify [text-align-last:left]">
                          {emphasizeImportantTerms(paragraph)}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div data-testid="devotional-biblical-context" className="mx-auto mt-7 max-w-[92ch] border-t border-[#d7c39a] pt-6 dark:border-[#c9a45c]/20">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a45c]/35 bg-[#f3e3c4] text-[#74451f] dark:bg-[#c9a45c]/10 dark:text-[#e7c77f]"><ScrollText size={17} /></span>
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-[#3a2416] dark:text-[#fff7e8]">Contexto bíblico imediato</h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#747772] dark:text-gray-400">Agora, leia os versos ao redor para perceber o argumento do capítulo.</p>
                      </div>
                    </div>

                    {isBibleContextLoading ? (
                      <div className="mt-5 space-y-3" aria-label="Carregando contexto bíblico">
                        {[0, 1, 2].map((item) => <span key={item} className="block h-11 animate-pulse rounded-xl bg-[#e9e3d9] dark:bg-white/5" />)}
                      </div>
                    ) : bibleContext?.hasSurroundingVerses ? (
                      <div className="mt-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a5a25] dark:text-[#e7c77f]">{bibleContext.passageReference} · texto bíblico</p>
                        <ol tabIndex={0} role="region" aria-label={`Contexto de ${bibleContext.focusReference}`} className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a5a25]">
                          {bibleContext.verses.map((verse) => {
                            const isFocusVerse = verse.number >= bibleContext.focusStartVerse && verse.number <= bibleContext.focusEndVerse;
                            return (
                              <li data-testid={isFocusVerse ? 'devotional-focus-verse' : undefined} key={verse.number} aria-current={isFocusVerse ? 'location' : undefined} className={'grid grid-cols-[26px_1fr] gap-2 rounded-xl px-3 py-2.5 text-sm leading-relaxed ' + (isFocusVerse ? 'bg-[#65584b] shadow-sm dark:bg-[#3b3834]' : '')}>
                                <span className={'pt-0.5 text-[10px] font-black ' + (isFocusVerse ? 'text-[#efd18b]' : 'text-[#9a682e] dark:text-[#e7c77f]')}>{verse.number}</span>
                                <span
                                  className={isFocusVerse ? 'font-normal text-[#fffaf0] dark:text-[#e7e0d4]' : 'font-normal text-[#554b42] dark:text-[#d9d2c8]'}
                                  style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
                                >{verse.text}</span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl bg-white/70 px-4 py-3 text-xs leading-relaxed text-[#656965] dark:bg-white/[0.03] dark:text-gray-400">
                        O trecho ampliado não está disponível agora. O versículo-base permanece acima e o capítulo completo pode ser aberto ao final desta etapa.
                      </div>
                    )}

                    <div className="mt-5 text-center">
                      <Link href={contextHref} className="inline-flex min-h-11 items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-[#65401f] underline decoration-[#b58132]/50 underline-offset-4 transition hover:text-[#8a5a25] dark:text-[#f4e6d2] dark:hover:text-[#e7c77f]">
                        <ExternalLink size={15} /> Abrir o capítulo completo
                      </Link>
                    </div>
                  </div>
                </section>

                <section data-testid="devotional-observation" className="mt-7 border-t border-[#ded8ce] pt-6 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a45c]/35 bg-[#f3e3c4] text-[#74451f] dark:bg-[#c9a45c]/10 dark:text-[#e7c77f]"><Eye size={17} /></span>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[#3a2416] dark:text-[#fff7e8]">Observe no texto</h3>
                      <p className="mt-1 text-xs leading-relaxed text-[#747772] dark:text-gray-400">Finalize a leitura percebendo os movimentos mais importantes da passagem.</p>
                    </div>
                  </div>
                  <ol className="mt-5 grid gap-3 md:grid-cols-3">
                    {[
                      'O que este trecho revela sobre Deus, Jesus ou a ação divina?',
                      'Existe uma promessa, um convite, uma advertência ou um contraste?',
                      'Que resposta o próprio texto convida você a oferecer hoje?',
                    ].map((question, index) => (
                      <li key={question} className="grid grid-cols-[24px_1fr] gap-3 rounded-2xl border border-[#d8d1c6] bg-white/55 p-4 text-xs leading-relaxed text-[#596166] dark:border-white/10 dark:bg-white/[0.025] dark:text-gray-300">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f3e3c4] text-[9px] font-black text-[#74451f] dark:bg-[#c9a45c]/10 dark:text-[#e7c77f]">{index + 1}</span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </ReadingSection>
            ) : null}

            {activeStage === 2 ? (
              <ReadingSection step={2} title="Deixe a Palavra encontrar você" description="Não procure uma resposta perfeita. Registre apenas o que ficou vivo em sua atenção." icon={Sparkles} completed={journey.completedSteps.includes(2)}>
                <label htmlFor="devotional-reflection" className="block text-sm font-semibold text-[#27364a] dark:text-gray-200">O que esta Palavra despertou em você?</label>
                <textarea
                  id="devotional-reflection"
                  value={userReflection}
                  onChange={(event) => setUserReflection(event.target.value)}
                  rows={5}
                  placeholder="Escreva uma percepção, uma decisão ou uma pergunta..."
                  className={'mt-4 w-full resize-y rounded-2xl border border-[#c9a45c]/45 bg-[#fffdf7]/80 px-4 py-4 text-[#493525] outline-none transition placeholder:text-[#9b8a78] focus:border-[#9a682e] focus:ring-2 focus:ring-[#b58132]/10 dark:border-[#c9a45c]/20 dark:bg-white/[0.03] dark:text-[#fff7e7] ' + FONT_SCALE_CLASSES[fontScale]}
                />
                <span className="mt-4 inline-flex items-center gap-2 text-xs leading-relaxed text-[#7a4a1f] dark:text-[#e7c77f]"><LockKeyhole size={15} /> Sua anotação é privada e não entra no feed.</span>
              </ReadingSection>
            ) : null}

            {activeStage === 3 ? (
              <ReadingSection step={3} title="Faça silêncio e ore" description="Use esta oração como ponto de partida. Acrescente suas próprias palavras e permaneça alguns instantes em silêncio." icon={HeartHandshake} completed={journey.completedSteps.includes(3)}>
                <div className="rounded-[22px] border border-[#c9a45c]/40 bg-[#f7ead0]/75 px-5 py-7 text-center dark:border-[#c9a45c]/20 dark:bg-[#c9a45c]/5 sm:px-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a5a25] dark:text-[#e7c77f]">Oração sugerida</p>
                  <p className={'mx-auto mt-4 max-w-2xl font-serif italic text-[#503b27] dark:text-amber-50 ' + FONT_SCALE_CLASSES[fontScale]}>{devotional.prayer}</p>
                </div>
                <p className="mx-auto mt-5 max-w-xl text-center text-xs leading-relaxed text-[#77736d] dark:text-gray-400">Depois da leitura, faça uma breve pausa. A oração sugerida é um apoio; você pode usar suas próprias palavras.</p>
              </ReadingSection>
            ) : null}

            {activeStage === 4 ? (
              <ReadingSection step={4} title="Leve uma decisão com você" description="Uma prática pequena e verdadeira vale mais do que uma intenção ampla que será esquecida." icon={Target} completed={journey.completedSteps.includes(4)}>
                <label htmlFor="devotional-practical-action" className="block text-sm font-semibold text-[#27364a] dark:text-gray-200">Hoje eu escolho...</label>
                <input
                  id="devotional-practical-action"
                  value={journey.practicalAction}
                  onChange={(event) => handlePracticalActionChange(event.target.value)}
                  onBlur={() => void handlePracticalActionBlur()}
                  disabled={Boolean(journey.completedAt)}
                  className="mt-3 h-14 w-full border-0 border-b border-[#bda36f] bg-transparent px-0 text-base font-medium text-[#493525] outline-none transition focus:border-[#8a5a25] focus:ring-0 disabled:opacity-70 dark:border-[#c9a45c]/25 dark:text-[#fff7e7]"
                />
                <button
                  type="button"
                  onClick={handlePracticalActionToggle}
                  disabled={Boolean(journey.completedAt)}
                  aria-pressed={journey.practicalActionCompleted}
                  className="mt-6 flex w-full items-start gap-4 rounded-2xl border border-[#c9a45c]/40 bg-[#fffdf7]/65 p-4 text-left transition hover:border-[#9a682e] disabled:opacity-70 dark:border-[#c9a45c]/20 dark:bg-white/[0.02]"
                >
                  <span className={'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ' + (journey.practicalActionCompleted ? 'bg-[#74451f] text-[#fff7e7]' : 'border border-[#9a958e] text-transparent dark:border-white/30')}><Check size={15} /></span>
                  <span><strong className="block text-sm text-[#4d301c] dark:text-[#fff7e7]">Marcar como praticado</strong><small className="mt-1 block text-xs leading-relaxed text-[#747772] dark:text-gray-400">Não é uma medida de fé; é apenas um lembrete da decisão que você escolheu levar.</small></span>
                </button>
              </ReadingSection>
            ) : null}

            {activeStage === 5 ? (
              <ReadingSection step={5} title="Feche este tempo com intenção" description="Concluir registra sua constância. Compartilhar continua sendo uma escolha, nunca uma obrigação." icon={CheckCircle2} completed={journey.completedSteps.includes(5)}>
                {journey.completedAt ? (
                  <div className="py-2 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#74451f] text-[#fff7e7]"><CheckCircle2 size={25} /></span>
                    <h3 className="mt-4 font-serif text-2xl font-semibold text-[#4d301c] dark:text-[#fff7e7]">Pão Diário concluído</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#656965] dark:text-gray-300">Siga sem pressa. A decisão registrada é o elo entre a leitura e o restante do seu dia.</p>
                    <div className="mx-auto mt-6 max-w-xl border-t border-[#d9d1c5] pt-6 dark:border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#65401f] dark:text-[#e8d8c5]">Se quiser, compartilhe</p>
                      <p className="mt-2 text-xs leading-relaxed text-[#777971] dark:text-gray-400">Você revisará a publicação antes de enviar. Sua reflexão pessoal permanece privada.</p>
                      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                        {journey.feedSharedAt ? (
                          <Link href="/social" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#b58132]/40 px-5 text-xs font-black uppercase tracking-[0.1em] text-[#74451f] dark:text-[#e7c77f]"><Check size={15} /> Publicado · Ver no Reino</Link>
                        ) : (
                          <button type="button" onClick={() => setIsShareModalOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#74451f] px-5 text-xs font-black uppercase tracking-[0.1em] text-[#fff7e7] transition hover:bg-[#5f3518]"><Send size={15} /> Criar publicação no feed</button>
                        )}
                        <button type="button" onClick={handleNativeShare} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-xs font-black uppercase tracking-[0.1em] text-[#65401f] underline decoration-[#b58132]/45 underline-offset-4 dark:text-[#fff7e7]"><Share2 size={15} /> Compartilhar fora do Culto+</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 text-center">
                    <span className={'mx-auto flex h-12 w-12 items-center justify-center rounded-full ' + (isReadyToComplete ? 'bg-[#74451f] text-[#fff7e7]' : 'border border-[#bcb3a7] text-[#96918a] dark:border-white/20')}>
                      {isReadyToComplete ? <Sparkles size={20} /> : <LockKeyhole size={19} />}
                    </span>
                    <h3 className="mt-4 font-serif text-xl font-semibold text-[#4d301c] dark:text-[#fff7e7]">{isReadyToComplete ? 'Você chegou ao fim desta leitura' : 'Ainda há um passo antes de concluir'}</h3>
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#6e716f] dark:text-gray-400">{isReadyToComplete ? 'Finalize este tempo e guarde a decisão que nasceu da Palavra.' : 'Passe pela leitura, reflexão, oração e prática no seu próprio ritmo.'}</p>
                  </div>
                )}
              </ReadingSection>
            ) : null}
          </div>
          <StageNavigation
            activeStage={activeStage}
            completedSteps={journey.completedSteps}
            progress={progress}
            onSelect={(step) => goToStage(step, false)}
          />
          </div>

          <div data-testid="devotional-stage-actions" className="flex flex-col-reverse gap-3 border-t border-[#d7c39a] bg-[#f8f3ea] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 dark:border-[#a88c61]/18 dark:bg-[#2a2825]">
            <button
              type="button"
              onClick={() => previousStage && goToStage(previousStage, false)}
              disabled={!previousStage}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-xs font-black uppercase tracking-[0.1em] text-[#56616b] transition hover:bg-black/5 disabled:invisible dark:text-gray-300 dark:hover:bg-white/5"
            >
              <ArrowLeft size={15} /> Etapa anterior
            </button>

            {activeStage === 1 ? (
              <button type="button" onClick={() => void handleReadingContinue()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#74451f] px-6 text-xs font-black uppercase tracking-[0.1em] text-[#fff8e8] shadow-md shadow-[#3a2416]/15 transition hover:bg-[#5f3518]">
                {journey.completedSteps.includes(1) ? 'Continuar para reflexão' : 'Concluir leitura e continuar'} <ArrowRight size={15} />
              </button>
            ) : null}

            {activeStage === 2 ? (
              <button type="button" onClick={() => void handleReflectionContinue()} disabled={isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#74451f] px-6 text-xs font-black uppercase tracking-[0.1em] text-[#fff8e8] shadow-md shadow-[#3a2416]/15 transition hover:bg-[#5f3518] disabled:opacity-60">
                {isSaving ? <Loader2 className="animate-spin" size={15} /> : userReflection.trim() ? <Save size={15} /> : <ArrowRight size={15} />}
                {userReflection.trim() ? 'Salvar e continuar' : 'Continuar sem escrever'}
              </button>
            ) : null}

            {activeStage === 3 ? (
              <button type="button" onClick={() => void handlePrayerContinue()} disabled={isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a8752d] px-6 text-xs font-black uppercase tracking-[0.1em] text-[#28160b] shadow-md shadow-[#3a2416]/15 transition hover:bg-[#bd9149] disabled:opacity-60">
                {isSaving ? <Loader2 className="animate-spin" size={15} /> : <HeartHandshake size={15} />}
                {journey.completedSteps.includes(3) ? 'Continuar para a prática' : 'Dizer Amém e continuar'}
              </button>
            ) : null}

            {activeStage === 4 ? (
              <button
                type="button"
                onClick={() => goToStage(5, false)}
                disabled={!journey.practicalActionCompleted}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#74451f] px-6 text-xs font-black uppercase tracking-[0.1em] text-[#fff8e8] transition hover:bg-[#5f3518] disabled:cursor-not-allowed disabled:bg-[#d8d2c8] disabled:text-[#8a867f] dark:disabled:bg-white/10"
              >
                Ir para conclusão <ArrowRight size={15} />
              </button>
            ) : null}

            {activeStage === 5 && !journey.completedAt ? (
              <button
                type="button"
                onClick={() => void handleCompleteJourney()}
                disabled={!isReadyToComplete}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#74451f] px-6 text-xs font-black uppercase tracking-[0.1em] text-[#fff8e8] transition hover:bg-[#5f3518] disabled:cursor-not-allowed disabled:bg-[#d8d2c8] disabled:text-[#8a867f] dark:disabled:bg-white/10"
              >
                <CheckCircle2 size={16} /> Concluir Pão Diário
              </button>
            ) : null}

            {activeStage === 5 && journey.completedAt ? (
              <button type="button" onClick={() => goToStage(1, false)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#b58132]/40 px-6 text-xs font-black uppercase tracking-[0.1em] text-[#74451f] transition hover:bg-[#f3e3c4] dark:text-[#e7c77f] dark:hover:bg-[#c9a45c]/10">
                Voltar à Palavra <BookOpen size={15} />
              </button>
            ) : null}
          </div>
        </div>

        <footer className="py-5 text-center">
          <p className="inline-flex items-center gap-2 text-[11px] leading-relaxed text-[#7b7b74] dark:text-gray-500">
            <Wheat className="text-[#9a682e]/70 dark:text-[#e7c77f]/60" size={16} />
            A reflexão auxilia a leitura, mas não substitui o texto bíblico em seu contexto.
          </p>
        </footer>
      </article>

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
