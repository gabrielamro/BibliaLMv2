import type { CustomPlan } from '../../types';

export interface PlanStudioChecklistItem {
  id: 'details' | 'cover' | 'lessons' | 'evaluation' | 'access';
  label: string;
  complete: boolean;
  required: boolean;
  helper: string;
}

const hasText = (value?: string) => Boolean(value && value.trim().length > 0);

export const getPlanLessonCount = (plan: Partial<CustomPlan>): number =>
  (plan.weeks ?? []).reduce((total, week) => total + (week.days?.length ?? 0), 0);

export const getPlanStudioChecklist = (plan: Partial<CustomPlan>): PlanStudioChecklistItem[] => {
  const detailsComplete = hasText(plan.title) && hasText(plan.description);
  const coverComplete = hasText(plan.coverUrl);
  const lessonsComplete = getPlanLessonCount(plan) > 0;
  const accessComplete = Boolean(plan.privacyType);

  return [
    {
      id: 'details',
      label: 'Dados essenciais preenchidos',
      complete: detailsComplete,
      required: true,
      helper: detailsComplete ? 'Titulo e descricao definidos.' : 'Informe titulo e descricao da sala.',
    },
    {
      id: 'cover',
      label: 'Capa definida',
      complete: coverComplete,
      required: true,
      helper: coverComplete ? 'A sala ja tem uma capa.' : 'Adicione ou gere uma capa para a sala.',
    },
    {
      id: 'lessons',
      label: 'Pelo menos 1 aula pronta',
      complete: lessonsComplete,
      required: true,
      helper: lessonsComplete ? 'A estrutura inicial ja existe.' : 'Adicione a primeira aula.',
    },
    {
      id: 'evaluation',
      label: 'Avaliacao final opcional',
      complete: Boolean(plan.hasEvaluation || plan.evaluationId),
      required: false,
      helper: 'Pode ser adicionada antes ou depois da publicacao.',
    },
    {
      id: 'access',
      label: 'Acesso configurado',
      complete: accessComplete,
      required: false,
      helper: accessComplete ? 'Visibilidade selecionada.' : 'Escolha quem podera acessar.',
    },
  ];
};

export const getPlanStudioCompletion = (plan: Partial<CustomPlan>): number => {
  const requiredItems = getPlanStudioChecklist(plan).filter((item) => item.required);
  if (requiredItems.length === 0) return 0;

  const complete = requiredItems.filter((item) => item.complete).length;
  return Math.round((complete / requiredItems.length) * 100);
};
