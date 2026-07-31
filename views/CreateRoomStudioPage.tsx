"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from '../utils/router';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useSettings } from '../contexts/SettingsContext';
import { dbService, uploadBlob } from '../services/supabase';
import type { CustomPlan, PlanDayContent, PlanWeek, PlanningFrequency, StudyEvaluation } from '../types';
import SEO from '../components/SEO';
import EvaluationBuilderModal, { EvaluationSourceLesson } from '../components/EvaluationBuilderModal';
import PlanStudioShell from '../components/PlanStudio/PlanStudioShell';
import type { StudioTab } from '../components/PlanStudio/types';
import StudyStudio from '../components/study-studio/StudyStudio';
import { buildBaseBlocks } from '../components/Builder/utils';
import { ArrowLeft, BookOpen, CheckCircle2, Copy, Edit3, Eye, GraduationCap, Lock, Plus, Share2, ShieldCheck, Users } from 'lucide-react';
import { getContentDefaultsFromSearchParams, toLegacyPlanPrivacyType } from '../utils/contentPrivacy';
import { getPlanSharePath, getPlanShareUrl } from '../utils/planSharing';

const getUnitLabel = (frequency: PlanningFrequency, index: number) => {
  if (frequency === 'daily') return `Dia ${index}`;
  if (frequency === 'monthly') return `Mes ${index}`;
  return `Semana ${index}`;
};

const createInitialPlan = (): Partial<CustomPlan> => ({
  title: '',
  description: '',
  category: 'Geral',
  weeks: [{ id: `unit-${Date.now()}`, title: 'Semana 1', days: [] }],
  isPublic: false,
  privacyType: 'followers',
  isRanked: false,
  planningFrequency: 'weekly',
  hasEvaluation: false,
  coverUrl: '',
  teams: [],
  subscribersCount: 0,
  status: 'draft',
});

const createLesson = (index: number): PlanDayContent => ({
  id: `lesson-${Date.now()}-${index}`,
  title: `Nova aula ${index}`,
  description: 'Clique em editar para construir o conteudo.',
  htmlContent: '<p>Conteudo em construcao...</p>',
  isCompleted: false,
});

const createLessonTemplateBlocks = () => buildBaseBlocks([
  { type: 'hero-split', layoutWidth: '1/1' },
  { type: 'biblical', layoutWidth: '2/3' },
  { type: 'study-outline', layoutWidth: '1/3' },
  { type: 'rich-text', layoutWidth: '1/1' },
  { type: 'slide', layoutWidth: '1/1' },
  { type: 'related-verses', layoutWidth: '1/1' },
  { type: 'authority', layoutWidth: '1/1' },
  { type: 'footer', layoutWidth: '1/1' },
  { type: 'reflection-question', layoutWidth: '1/1' },
]);

const getRoomLessons = (plan: Partial<CustomPlan>) => (
  (plan.weeks ?? []).flatMap((unit, unitIndex) =>
    unit.days.map((lesson, lessonIndex) => ({
      unitId: unit.id,
      unitTitle: unit.title || getUnitLabel(plan.planningFrequency ?? 'weekly', unitIndex + 1),
      lesson,
      index: lessonIndex + 1,
    })),
  )
);

const canSharePublishedRoom = (plan: Partial<CustomPlan>) => (
  (plan.privacyLevel || plan.privacyType) === 'public' || plan.privacyType === 'public'
);

const getRoomPrivacySummary = (plan: Partial<CustomPlan>) => {
  const visibility = plan.privacyLevel || plan.privacyType || 'public';
  const groupCount = plan.allowedGroupIds?.length || (plan.groupId ? 1 : 0);
  const inviteCount = plan.allowedUserIds?.length || 0;

  if (visibility === 'public' || plan.privacyType === 'public') {
    return {
      label: 'Publica',
      audience: 'Qualquer pessoa com o link pode acessar as aulas.',
      detail: 'Compartilhamento habilitado.',
      tone: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-950/20',
    };
  }

  if (visibility === 'church' || plan.privacyType === 'church') {
    return {
      label: 'Membros da igreja',
      audience: 'Apenas membros vinculados a esta igreja podem acessar as aulas.',
      detail: plan.churchId ? 'Contexto de igreja aplicado.' : 'Defina a igreja no contexto para liberar o acesso correto.',
      tone: 'text-purple-700 dark:text-violet-300',
      bg: 'bg-purple-50 dark:bg-purple-950/20',
    };
  }

  if (visibility === 'group' || visibility === 'church_groups' || plan.privacyType === 'group') {
    return {
      label: visibility === 'church_groups' ? 'Grupos especificos' : 'Membros do grupo',
      audience: 'Apenas os grupos selecionados podem acessar as aulas.',
      detail: groupCount > 0 ? `${groupCount} grupo${groupCount === 1 ? '' : 's'} autorizado${groupCount === 1 ? '' : 's'}.` : 'Nenhum grupo autorizado definido.',
      tone: 'text-purple-700 dark:text-violet-300',
      bg: 'bg-purple-50 dark:bg-purple-950/20',
    };
  }

  if (visibility === 'invite_only' || plan.inviteRequired) {
    return {
      label: 'Privada com convite',
      audience: 'Somente pessoas convidadas podem acessar as aulas.',
      detail: inviteCount > 0 ? `${inviteCount} pessoa${inviteCount === 1 ? '' : 's'} autorizada${inviteCount === 1 ? '' : 's'}.` : 'Envie convites para liberar acesso.',
      tone: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
    };
  }

  return {
    label: 'Privada',
    audience: 'Apenas voce e pessoas autorizadas podem acessar as aulas.',
    detail: 'Compartilhamento publico desativado.',
    tone: 'text-gray-700 dark:text-gray-300',
    bg: 'bg-gray-50 dark:bg-gray-900',
  };
};

const stripHtml = (value: string) =>
  value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const collectBlockText = (block: any): string => {
  const data = block?.data ?? {};
  const parts: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) parts.push(stripHtml(value));
  };

  [
    data.title,
    data.heading,
    data.subtitle,
    data.verse,
    data.reference,
    data.text,
    data.content,
    data.body,
    data.description,
    data.question,
    data.support,
    data.headline,
    data.subheadline,
  ].forEach(add);

  if (Array.isArray(data.items)) data.items.forEach((item: any) => [item.title, item.text, item.description].forEach(add));
  if (Array.isArray(data.slides)) data.slides.forEach((slide: any) => [slide.title, slide.content, slide.description].forEach(add));
  if (Array.isArray(data.verses)) data.verses.forEach((verse: any) => [verse.reference, verse.text, verse.summary].forEach(add));

  return parts.filter(Boolean).join('\n');
};

interface PublishedRoomSuccessProps {
  plan: Partial<CustomPlan>;
  planId: string;
  onBackToWorkspace: () => void;
  onContinueEditing: () => void;
  onViewPublished: () => void;
  onShare: () => void;
  onAddLesson: () => void;
  onOpenEvaluation: () => void;
}

const PublishedRoomSuccess: React.FC<PublishedRoomSuccessProps> = ({
  plan,
  planId,
  onBackToWorkspace,
  onContinueEditing,
  onViewPublished,
  onShare,
  onAddLesson,
  onOpenEvaluation,
}) => {
  const lessons = getRoomLessons(plan);
  const shareEnabled = canSharePublishedRoom(plan);
  const privacySummary = getRoomPrivacySummary(plan);
  const shareUrl = typeof window !== 'undefined'
    ? getPlanShareUrl(planId, plan.shareSlug, window.location.origin)
    : getPlanSharePath(planId, plan.shareSlug);

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-purple-50/70 text-gray-950 dark:bg-black dark:text-white">
      <header className="border-b border-purple-100 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-md dark:border-purple-900/40 dark:bg-[#0a0a0a]/90 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={onBackToWorkspace}
              aria-label="Voltar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 text-gray-500 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-purple-900/40 dark:text-gray-400 dark:hover:text-violet-300"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-purple-700 dark:text-violet-300">
                <CheckCircle2 size={13} />
                Sala publicada
              </p>
              <h1 className="truncate text-2xl font-black tracking-tight text-gray-950 dark:text-white md:text-3xl">
                {plan.title || 'Sala publicada'}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={onViewPublished}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-black text-white shadow-lg shadow-purple-900/15 transition-transform hover:bg-purple-800 active:scale-[0.98] dark:bg-violet-500"
            >
              <Eye size={16} />
              Visualizar
            </button>
            {shareEnabled && (
              <button
                type="button"
                onClick={onShare}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-sm font-black text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
              >
                <Share2 size={16} />
                Compartilhar
              </button>
            )}
            <button
              type="button"
              onClick={onContinueEditing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-sm font-black text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
            >
              <Edit3 size={16} />
              Editar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] gap-6 p-4 pb-24 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f] md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-violet-200">
                <CheckCircle2 size={38} />
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Obrigado por criar esta sala</p>
                <h2 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white md:text-4xl">
                  Sua jornada esta pronta para receber alunos.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                  Voce publicou {lessons.length} aula{lessons.length === 1 ? '' : 's'} em {(plan.weeks ?? []).length} unidade{(plan.weeks ?? []).length === 1 ? '' : 's'}.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Aulas publicadas</p>
                <h3 className="text-xl font-black text-gray-950 dark:text-white">Conteudo da sala</h3>
              </div>
              <button
                type="button"
                onClick={onAddLesson}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-100 px-4 text-sm font-black text-purple-800 transition-colors hover:bg-purple-200 dark:bg-purple-950/40 dark:text-violet-200"
              >
                <Plus size={16} />
                Nova aula
              </button>
            </div>

            {lessons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50 p-8 text-center dark:border-purple-900/40 dark:bg-gray-900">
                <BookOpen className="mx-auto mb-3 text-purple-700 dark:text-violet-300" size={34} />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Nenhuma aula criada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map(({ lesson, unitId, unitTitle, index }) => (
                  <div
                    key={`${unitId}:${lesson.id}:${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-purple-50/60 p-4 dark:border-purple-900/40 dark:bg-gray-900"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-purple-700 shadow-sm dark:bg-black dark:text-violet-200">
                      {index}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-gray-950 dark:text-white">{lesson.title || 'Aula sem titulo'}</p>
                      <p className="mt-0.5 truncate text-xs font-bold text-gray-400">{unitTitle}</p>
                    </div>
                    <CheckCircle2 className="shrink-0 text-purple-700 dark:text-violet-300" size={18} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[22px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Privacidade das aulas</p>
            <div className={`rounded-2xl p-4 ${privacySummary.bg}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-700 shadow-sm dark:bg-black dark:text-violet-200">
                  {shareEnabled ? <ShieldCheck size={18} /> : <Lock size={18} />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-black ${privacySummary.tone}`}>{privacySummary.label}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-gray-600 dark:text-gray-300">{privacySummary.audience}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{privacySummary.detail}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onContinueEditing}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-xs font-black text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
            >
              <Edit3 size={14} />
              Alterar privacidade
            </button>
          </section>

          <section className="rounded-[22px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Proximos passos</p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={onViewPublished}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-black text-white shadow-lg shadow-purple-900/15 transition-transform hover:bg-purple-800 active:scale-[0.98] dark:bg-violet-500"
              >
                <Eye size={16} />
                Visualizar sala publicada
              </button>
              {shareEnabled ? (
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-sm font-black text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
                >
                  <Share2 size={16} />
                  Compartilhar link
                </button>
              ) : (
                <div className="rounded-xl bg-purple-50 px-4 py-3 text-xs font-bold leading-5 text-gray-500 dark:bg-gray-900">
                  Compartilhamento publico indisponivel para a privacidade atual.
                </div>
              )}
              <button
                type="button"
                onClick={onOpenEvaluation}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-sm font-black text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-purple-900/40 dark:bg-gray-900 dark:text-violet-200"
              >
                <GraduationCap size={16} />
                {plan.hasEvaluation ? 'Editar avaliacao' : 'Criar avaliacao'}
              </button>
            </div>
          </section>

          <section className="rounded-[22px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Link da sala</p>
            <div className="flex items-center gap-2 rounded-xl bg-purple-50 p-2 dark:bg-gray-900">
              <p className="min-w-0 flex-1 truncate px-2 text-xs font-bold text-gray-500">{shareUrl}</p>
              <button
                type="button"
                onClick={onShare}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-700 shadow-sm dark:bg-black dark:text-violet-200"
                aria-label="Copiar link"
              >
                <Copy size={15} />
              </button>
            </div>
          </section>

          <section className="rounded-[22px] border border-purple-100 bg-white p-5 shadow-sm dark:border-purple-900/40 dark:bg-[#0f0f0f]">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Gestao</p>
            <div className="flex items-center gap-3 rounded-2xl bg-purple-50 p-4 dark:bg-gray-900">
              <Users className="text-purple-700 dark:text-violet-300" size={20} />
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                Acompanhe inscritos, progresso e comentarios pela propria sala publicada.
              </p>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};

const CreateRoomStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, userProfile, showNotification, openLogin } = useAuth();
  const { setIsFocusMode } = useSettings();
  const { setIsHeaderHidden, resetHeader } = useHeader();

  const [plan, setPlan] = useState<Partial<CustomPlan>>(() => createInitialPlan());
  const [savedPlanId, setSavedPlanId] = useState<string | null>(searchParams.get('id'));
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [evaluationData, setEvaluationData] = useState<StudyEvaluation | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(searchParams.get('lesson'));
  const [detailsValidationError, setDetailsValidationError] = useState<string | null>(null);
  const [detailsForceOpenSignal, setDetailsForceOpenSignal] = useState(0);
  const [publishedSuccessPlanId, setPublishedSuccessPlanId] = useState<string | null>(null);

  const planIdFromUrl = searchParams.get('id');
  const contentDefaults = useMemo(() => getContentDefaultsFromSearchParams(searchParams), [searchParams]);

  useEffect(() => {
    setIsFocusMode(true);
    setIsHeaderHidden(true);
    return () => {
      setIsFocusMode(false);
      setIsHeaderHidden(false);
      resetHeader();
    };
  }, [resetHeader, setIsFocusMode, setIsHeaderHidden]);

  useEffect(() => {
    if (!planIdFromUrl) return;

    let cancelled = false;
    dbService.getCustomPlan(planIdFromUrl)
      .then(async (loadedPlan) => {
        if (!loadedPlan || cancelled) return;
        setPlan(loadedPlan);
        setSavedPlanId(loadedPlan.id);
        if (loadedPlan.evaluationId) {
          const evaluation = await dbService.getEvaluation(loadedPlan.evaluationId);
          if (!cancelled) setEvaluationData(evaluation);
        }
      })
      .catch(() => {
        if (!cancelled) showNotification('Nao foi possivel carregar a sala.', 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [planIdFromUrl, showNotification]);

  useEffect(() => {
    if (planIdFromUrl) return;
    setPlan((current) => ({
      ...current,
      privacyType: toLegacyPlanPrivacyType(contentDefaults.visibility),
      privacyLevel: contentDefaults.visibility,
      churchId: contentDefaults.churchId,
      groupId: contentDefaults.groupId,
      createdFromContext: contentDefaults.scope,
      inviteRequired: contentDefaults.visibility === 'invite_only',
    }));
  }, [contentDefaults, planIdFromUrl]);

  useEffect(() => {
    const lessonId = searchParams.get('lesson');
    if (!lessonId || activeUnitId || !(plan.weeks?.length)) return;

    const target = plan.weeks
      .flatMap((unit) => unit.days.map((lesson) => ({ unitId: unit.id, lesson })))
      .find((item) => item.lesson.id === lessonId);

    if (target) {
      setActiveUnitId(target.unitId);
      setEditingLessonId(target.lesson.id);
      return;
    }

    if (searchParams.get('type')?.startsWith('nova-aula')) {
      const firstUnit = plan.weeks[0];
      const lessonIndex = firstUnit.days.length + 1;
      const restoredLesson: PlanDayContent = {
        ...createLesson(lessonIndex),
        id: lessonId,
        title: `Nova aula ${lessonIndex}`,
      };

      setPlan((current) => ({
        ...current,
        weeks: (current.weeks ?? []).map((unit, index) =>
          index === 0 ? { ...unit, days: [...unit.days, restoredLesson] } : unit,
        ),
      }));
      setActiveUnitId(firstUnit.id);
      setEditingLessonId(lessonId);
    }
  }, [activeUnitId, plan.weeks, searchParams]);

  const updatePlan = (patch: Partial<CustomPlan>) => {
    if (patch.title !== undefined && patch.title.trim()) {
      setDetailsValidationError(null);
    }
    setPlan((current) => ({ ...current, ...patch }));
  };

  const handleFrequencyChange = (frequency: PlanningFrequency) => {
    setPlan((current) => ({
      ...current,
      planningFrequency: frequency,
      weeks: (current.weeks ?? []).map((unit, index) => ({
        ...unit,
        title: getUnitLabel(frequency, index + 1),
      })),
    }));
  };

  const addUnit = () => {
    setPlan((current) => {
      const weeks = current.weeks ?? [];
      const frequency = current.planningFrequency ?? 'weekly';
      return {
        ...current,
        weeks: [
          ...weeks,
          {
            id: `unit-${Date.now()}`,
            title: getUnitLabel(frequency, weeks.length + 1),
            days: [],
          },
        ],
      };
    });
  };

  const renameUnit = (unitId: string, title: string) => {
    setPlan((current) => ({
      ...current,
      weeks: (current.weeks ?? []).map((unit) => (unit.id === unitId ? { ...unit, title } : unit)),
    }));
  };

  const deleteUnit = (unitId: string) => {
    setPlan((current) => ({
      ...current,
      weeks: (current.weeks ?? []).filter((unit) => unit.id !== unitId),
    }));
  };

  const openLessonInRoom = (unitId: string, lessonId: string) => {
    setActiveUnitId(unitId);
    setEditingLessonId(lessonId);
    const params = new URLSearchParams();
    if (savedPlanId) params.set('id', savedPlanId);
    params.set('lesson', lessonId);
    window.history.replaceState({}, '', `/criar-sala?${params.toString()}`);
  };

  const closeLessonEditor = (planId = savedPlanId) => {
    setActiveUnitId(null);
    setEditingLessonId(null);
    const params = new URLSearchParams();
    if (planId) params.set('id', planId);
    window.history.replaceState({}, '', params.toString() ? `/criar-sala?${params.toString()}` : '/criar-sala');
  };

  const addLesson = (unitId: string) => {
    const lessonIndex = ((plan.weeks ?? []).find((unit) => unit.id === unitId)?.days.length ?? 0) + 1;
    const newLesson = createLesson(lessonIndex);
    setPlan((current) => ({
      ...current,
      weeks: (current.weeks ?? []).map((unit) => {
        if (unit.id !== unitId) return unit;
        return {
          ...unit,
          days: [...unit.days, newLesson],
        };
      }),
    }));
    openLessonInRoom(unitId, newLesson.id);
  };

  const renameLesson = (unitId: string, lessonId: string, title: string) => {
    setPlan((current) => ({
      ...current,
      weeks: (current.weeks ?? []).map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              days: unit.days.map((lesson) => (lesson.id === lessonId ? { ...lesson, title } : lesson)),
            }
          : unit,
      ),
    }));
  };

  const deleteLesson = (unitId: string, lessonId: string) => {
    setPlan((current) => ({
      ...current,
      weeks: (current.weeks ?? []).map((unit) =>
        unit.id === unitId ? { ...unit, days: unit.days.filter((lesson) => lesson.id !== lessonId) } : unit,
      ),
    }));
  };

  const reorderUnits = (weeks: PlanWeek[]) => {
    setPlan((current) => ({ ...current, weeks }));
  };

  const generatedCover = useMemo(() => {
    const title = encodeURIComponent(plan.title || 'Sala de Estudos');
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%236b7c93'/%3E%3Cstop offset='.55' stop-color='%23c5a059'/%3E%3Cstop offset='1' stop-color='%235d4037'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='675' fill='url(%23g)'/%3E%3Ccircle cx='940' cy='188' r='170' fill='%23ffffff' opacity='.12'/%3E%3Ctext x='80' y='360' fill='white' font-family='Arial' font-size='72' font-weight='800'%3E${title}%3C/text%3E%3C/svg%3E`;
  }, [plan.title]);

  const evaluationLessons = useMemo<EvaluationSourceLesson[]>(() => (
    (plan.weeks ?? []).flatMap((unit) =>
      unit.days.map((lesson) => {
        const blockContent = (lesson.blocksConfig ?? []).map(collectBlockText).filter(Boolean).join('\n\n');
        const htmlContent = stripHtml(lesson.htmlContent || '');
        const content = [lesson.description, blockContent, htmlContent].filter(Boolean).join('\n\n').slice(0, 12000);

        return {
          id: lesson.id,
          title: lesson.title || 'Aula sem titulo',
          description: lesson.description,
          content,
        };
      }),
    )
  ), [plan.weeks]);

  const generateCover = () => {
    setIsGeneratingCover(true);
    window.setTimeout(() => {
      updatePlan({ coverUrl: generatedCover });
      setIsGeneratingCover(false);
      showNotification('Capa sugerida para a sala.', 'success');
    }, 250);
  };

  const attachCover = async (file: File) => {
    if (!currentUser) {
      openLogin();
      return;
    }

    setIsUploadingCover(true);
    try {
      const url = await uploadBlob(file, `plan_covers/${currentUser.uid}_${Date.now()}_${file.name}`);
      updatePlan({ coverUrl: url });
      showNotification('Imagem de capa anexada.', 'success');
    } catch {
      showNotification('Nao foi possivel anexar a imagem.', 'error');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const buildPayload = (targetStatus: 'draft' | 'published', sourcePlan = plan) => {
    const timestamp = new Date().toISOString();
    return {
      ...sourcePlan,
      title: sourcePlan.title?.trim() || 'Nova sala',
      description: sourcePlan.description?.trim() || '',
      authorId: currentUser?.uid,
      authorName: userProfile?.displayName || currentUser?.email || 'Pastor',
      authorPhoto: userProfile?.photoURL ?? undefined,
      isPublic: targetStatus === 'published',
      status: targetStatus,
      updatedAt: timestamp,
      createdAt: sourcePlan.createdAt ?? timestamp,
      subscribersCount: sourcePlan.subscribersCount ?? 0,
      planningFrequency: sourcePlan.planningFrequency ?? 'weekly',
      privacyType: sourcePlan.privacyType ?? 'followers',
      privacyLevel: sourcePlan.privacyLevel ?? contentDefaults.visibility,
      churchId: sourcePlan.churchId ?? contentDefaults.churchId,
      groupId: sourcePlan.groupId ?? contentDefaults.groupId,
      createdFromContext: sourcePlan.createdFromContext ?? contentDefaults.scope,
      inviteRequired: sourcePlan.inviteRequired ?? (sourcePlan.privacyLevel === 'invite_only'),
      isRanked: sourcePlan.isRanked ?? false,
      teams: sourcePlan.teams ?? [],
      weeks: sourcePlan.weeks ?? [],
    };
  };

  const savePlan = async (targetStatus: 'draft' | 'published') => {
    if (!plan.title?.trim()) {
      setActiveTab('overview');
      setDetailsValidationError('Informe o nome da sala antes de salvar.');
      setDetailsForceOpenSignal((current) => current + 1);
      showNotification('Informe o nome da sala antes de salvar.', 'error');
      return;
    }

    if (!currentUser) {
      openLogin();
      return;
    }

    targetStatus === 'published' ? setIsPublishing(true) : setIsSaving(true);
    try {
      const payload = buildPayload(targetStatus);
      let nextPlanId = savedPlanId;
      let nextRevision = Number(plan.revision || 0);
      if (savedPlanId) {
        nextRevision = await dbService.updateCustomPlanWithRevision(
          savedPlanId,
          payload,
          Number(plan.revision || 0),
        );
      } else {
        const created = await dbService.createCustomPlan(payload);
        nextPlanId = created.id;
        nextRevision = created.revision;
        setSavedPlanId(created.id);
        window.history.replaceState({}, '', `/criar-sala?id=${created.id}`);
      }
      setPlan((current) => ({
        ...current,
        revision: nextRevision,
        status: targetStatus,
        isPublic: targetStatus === 'published',
      }));
      showNotification(targetStatus === 'published' ? 'Sala publicada.' : 'Rascunho salvo.', 'success');
      if (targetStatus === 'published' && nextPlanId) {
        setPublishedSuccessPlanId(nextPlanId);
      }
    } catch (error) {
      showNotification(
        error instanceof Error && error.name === 'StudyRevisionConflictError'
          ? error.message
          : 'Nao foi possivel salvar a sala.',
        'error',
      );
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const openLesson = (unitId: string, lesson: PlanDayContent) => {
    openLessonInRoom(unitId, lesson.id);
  };

  const previewPlan = () => {
    viewPublishedRoom();
  };

  const saveEvaluation = async (data: any) => {
    if (!currentUser || !savedPlanId) {
      showNotification('Salve a sala antes de criar a avaliacao.', 'warning');
      return;
    }

    try {
      const created = await dbService.createEvaluation({
        ...data,
        planId: savedPlanId,
        authorId: currentUser.uid,
        createdAt: new Date().toISOString(),
      });
      await dbService.updateCustomPlan(savedPlanId, { hasEvaluation: true, evaluationId: created.id });
      setEvaluationData({ id: created.id, ...data });
      updatePlan({ hasEvaluation: true, evaluationId: created.id });
      setIsEvaluationOpen(false);
      showNotification('Avaliacao salva.', 'success');
    } catch {
      showNotification('Nao foi possivel salvar a avaliacao.', 'error');
    }
  };

  const openEvaluation = () => {
    if (!savedPlanId) {
      showNotification('Salve a sala antes de criar a avaliacao.', 'warning');
      return;
    }
    setIsEvaluationOpen(true);
  };

  const viewPublishedRoom = (planId = savedPlanId) => {
    if (!planId) {
      showNotification('Salve a sala para visualizar a experiencia do aluno.', 'warning');
      return;
    }
    navigate(`/jornada/${planId}`, { state: { fromEditor: true } });
  };

  const sharePublishedRoom = async (planId = savedPlanId) => {
    if (!planId) {
      showNotification('Salve a sala antes de compartilhar.', 'warning');
      return;
    }

    const shareUrl = getPlanShareUrl(planId, plan.shareSlug, window.location.origin);
    try {
      if (canSharePublishedRoom(plan) && navigator.share) {
        await navigator.share({ title: plan.title || 'Sala BibliaLM', url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      showNotification('Link da sala copiado.', 'success');
    } catch {
      showNotification('Nao foi possivel compartilhar agora.', 'error');
    }
  };

  const addLessonAfterPublish = () => {
    const firstUnit = (plan.weeks ?? [])[0];
    if (firstUnit) {
      setPublishedSuccessPlanId(null);
      addLesson(firstUnit.id);
      return;
    }
    setPublishedSuccessPlanId(null);
    addUnit();
    setActiveTab('lessons');
  };

  const activeLesson = activeUnitId && editingLessonId
    ? plan.weeks?.find((unit) => unit.id === activeUnitId)?.days.find((lesson) => lesson.id === editingLessonId)
    : null;

  const saveLessonContent = async (content: any) => {
    if (!activeUnitId || !editingLessonId) return;
    if (!currentUser) {
      openLogin();
      throw new Error('AUTH_REQUIRED');
    }

    const nextLesson: PlanDayContent = {
      id: editingLessonId,
      title: content.meta?.title || activeLesson?.title || 'Nova aula',
      description: content.meta?.description || activeLesson?.description || '',
      htmlContent: activeLesson?.htmlContent || '<p>Conteudo em construcao...</p>',
      blocksConfig: content.blocks || [],
      tags: content.meta?.tags || activeLesson?.tags || [],
      category: content.meta?.category || activeLesson?.category || 'Geral',
      isCompleted: activeLesson?.isCompleted ?? false,
    };

    const nextWeeks = (plan.weeks ?? []).map((unit) => {
      if (unit.id !== activeUnitId) return unit;
      return {
        ...unit,
        days: unit.days.map((lesson) => (lesson.id === editingLessonId ? nextLesson : lesson)),
      };
    });
    const targetStatus = plan.status === 'published' ? 'published' : 'draft';
    const nextPlan: Partial<CustomPlan> = { ...plan, weeks: nextWeeks };

    setIsSaving(true);
    try {
      let persistedPlanId = savedPlanId;
      const payload = buildPayload(targetStatus, nextPlan);
      if (savedPlanId) {
        const revision = await dbService.updateCustomPlanWithRevision(
          savedPlanId,
          payload,
          Number(plan.revision || 0),
        );
        nextPlan.revision = revision;
      } else {
        const created = await dbService.createCustomPlan(payload);
        persistedPlanId = created.id;
        setSavedPlanId(created.id);
        nextPlan.revision = created.revision;
      }
      setPlan(nextPlan);
      closeLessonEditor(persistedPlanId);
    } catch (error) {
      showNotification('Não foi possível salvar a aula. O editor continuará aberto.', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (activeUnitId && editingLessonId && activeLesson) {
    const blocks = activeLesson.blocksConfig?.length ? activeLesson.blocksConfig : createLessonTemplateBlocks();
    return (
      <>
        <SEO title={activeLesson.title || 'Nova Aula'} />
        <div className="h-[100dvh] overflow-hidden bg-bible-paper dark:bg-black">
          <StudyStudio
            mode="roomLesson"
            draftId={editingLessonId}
            embeddedContext={{
              initialContent: {
                id: editingLessonId,
                title: activeLesson.title,
                type: 'article',
                status: 'draft',
                blocks,
                meta: {
                  title: activeLesson.title,
                  description: activeLesson.description || '',
                  tags: activeLesson.tags || [],
                  category: activeLesson.category || 'Geral',
                },
              },
              onSave: saveLessonContent,
              onClose: closeLessonEditor,
              isEmbedded: true,
            }}
          />
        </div>
      </>
    );
  }

  if (publishedSuccessPlanId) {
    return (
      <>
        <SEO title="Sala publicada" />
        <PublishedRoomSuccess
          plan={{ ...plan, status: 'published', isPublic: true }}
          planId={publishedSuccessPlanId}
          onBackToWorkspace={() => navigate('/workspace-pastoral')}
          onContinueEditing={() => setPublishedSuccessPlanId(null)}
          onViewPublished={() => viewPublishedRoom(publishedSuccessPlanId)}
          onShare={() => sharePublishedRoom(publishedSuccessPlanId)}
          onAddLesson={addLessonAfterPublish}
          onOpenEvaluation={openEvaluation}
        />
        <EvaluationBuilderModal
          isOpen={isEvaluationOpen}
          onClose={() => setIsEvaluationOpen(false)}
          onSave={saveEvaluation}
          initialData={evaluationData || undefined}
          lessons={evaluationLessons}
        />
      </>
    );
  }

  return (
    <>
      <SEO title="Criar Sala" />
      <PlanStudioShell
        plan={plan}
        savedPlanId={savedPlanId}
        activeTab={activeTab}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isGeneratingCover={isGeneratingCover}
        isUploadingCover={isUploadingCover}
        evaluationData={evaluationData}
        onTabChange={setActiveTab}
        onBack={() => navigate('/workspace-pastoral')}
        onSave={() => savePlan('draft')}
        onPublish={() => savePlan('published')}
        onPreview={previewPlan}
        onPlanChange={updatePlan}
        onFrequencyChange={handleFrequencyChange}
        onGenerateCover={generateCover}
        onAttachCover={attachCover}
        onAddUnit={addUnit}
        onRenameUnit={renameUnit}
        onDeleteUnit={deleteUnit}
        onAddLesson={addLesson}
        onRenameLesson={renameLesson}
        onDeleteLesson={deleteLesson}
        onOpenLesson={openLesson}
        onReorderUnits={reorderUnits}
        onOpenEvaluation={openEvaluation}
        onGenerateWithAI={() => showNotification('A geracao assistida sera conectada depois da validacao do layout.', 'info')}
        onImportLessons={() => showNotification('Importacao de aulas esta planejada para uma proxima etapa.', 'info')}
        detailsValidationError={detailsValidationError}
        detailsForceOpenSignal={detailsForceOpenSignal}
      />
      <EvaluationBuilderModal
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
        onSave={saveEvaluation}
        initialData={evaluationData || undefined}
        lessons={evaluationLessons}
      />
    </>
  );
};

export default CreateRoomStudioPage;
