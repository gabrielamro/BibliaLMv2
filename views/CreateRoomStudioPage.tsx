"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from '../utils/router';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useSettings } from '../contexts/SettingsContext';
import { dbService, uploadBlob } from '../services/supabase';
import type { CustomPlan, PlanDayContent, PlanWeek, PlanningFrequency, StudyEvaluation } from '../types';
import SEO from '../components/SEO';
import EvaluationBuilderModal from '../components/EvaluationBuilderModal';
import PlanStudioShell from '../components/PlanStudio/PlanStudioShell';
import type { StudioTab } from '../components/PlanStudio/types';
import CreateContentV3Page from './CreateContentV3Page';
import { buildBaseBlocks } from '../components/Builder/utils';

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

  const planIdFromUrl = searchParams.get('id');

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
    const lessonId = searchParams.get('lesson');
    if (!lessonId || activeUnitId || !(plan.weeks?.length)) return;

    const target = plan.weeks
      .flatMap((unit) => unit.days.map((lesson) => ({ unitId: unit.id, lesson })))
      .find((item) => item.lesson.id === lessonId);

    if (target) {
      setActiveUnitId(target.unitId);
      setEditingLessonId(target.lesson.id);
    }
  }, [activeUnitId, plan.weeks, searchParams]);

  const updatePlan = (patch: Partial<CustomPlan>) => {
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

  const closeLessonEditor = () => {
    setActiveUnitId(null);
    setEditingLessonId(null);
    const params = new URLSearchParams();
    if (savedPlanId) params.set('id', savedPlanId);
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

  const buildPayload = (targetStatus: 'draft' | 'published') => {
    const timestamp = new Date().toISOString();
    return {
      ...plan,
      title: plan.title?.trim() || 'Nova sala',
      description: plan.description?.trim() || '',
      authorId: currentUser?.uid,
      authorName: userProfile?.displayName || currentUser?.email || 'Pastor',
      authorPhoto: userProfile?.photoURL ?? undefined,
      isPublic: targetStatus === 'published',
      status: targetStatus,
      updatedAt: timestamp,
      createdAt: plan.createdAt ?? timestamp,
      subscribersCount: plan.subscribersCount ?? 0,
      planningFrequency: plan.planningFrequency ?? 'weekly',
      privacyType: plan.privacyType ?? 'followers',
      isRanked: plan.isRanked ?? false,
      teams: plan.teams ?? [],
      weeks: plan.weeks ?? [],
    };
  };

  const savePlan = async (targetStatus: 'draft' | 'published') => {
    if (!currentUser) {
      openLogin();
      return;
    }

    if (!plan.title?.trim()) {
      showNotification('Informe o nome da sala antes de salvar.', 'error');
      return;
    }

    targetStatus === 'published' ? setIsPublishing(true) : setIsSaving(true);
    try {
      const payload = buildPayload(targetStatus);
      if (savedPlanId) {
        await dbService.updateCustomPlan(savedPlanId, payload);
      } else {
        const created = await dbService.createCustomPlan(payload);
        setSavedPlanId(created.id);
        window.history.replaceState({}, '', `/criar-sala?id=${created.id}`);
      }
      setPlan((current) => ({ ...current, status: targetStatus, isPublic: targetStatus === 'published' }));
      showNotification(targetStatus === 'published' ? 'Sala publicada.' : 'Rascunho salvo.', 'success');
    } catch {
      showNotification('Nao foi possivel salvar a sala.', 'error');
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const openLesson = (unitId: string, lesson: PlanDayContent) => {
    openLessonInRoom(unitId, lesson.id);
  };

  const previewPlan = () => {
    if (!savedPlanId) {
      showNotification('Salve a sala para visualizar a experiencia do aluno.', 'warning');
      return;
    }
    navigate(`/jornada/${savedPlanId}`, { state: { fromEditor: true } });
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

  const activeLesson = activeUnitId && editingLessonId
    ? plan.weeks?.find((unit) => unit.id === activeUnitId)?.days.find((lesson) => lesson.id === editingLessonId)
    : null;

  const saveLessonContent = async (content: any) => {
    if (!activeUnitId || !editingLessonId) return;

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

    setPlan((current) => ({
      ...current,
      weeks: (current.weeks ?? []).map((unit) => {
        if (unit.id !== activeUnitId) return unit;
        return {
          ...unit,
          days: unit.days.map((lesson) => (lesson.id === editingLessonId ? nextLesson : lesson)),
        };
      }),
    }));
    closeLessonEditor();
  };

  if (activeUnitId && editingLessonId && activeLesson) {
    const blocks = activeLesson.blocksConfig?.length ? activeLesson.blocksConfig : createLessonTemplateBlocks();
    return (
      <>
        <SEO title={activeLesson.title || 'Nova Aula'} />
        <div className="h-[100dvh] overflow-hidden bg-bible-paper dark:bg-black">
          <CreateContentV3Page
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
      />
      <EvaluationBuilderModal
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
        onSave={saveEvaluation}
        initialData={evaluationData || undefined}
      />
    </>
  );
};

export default CreateRoomStudioPage;
