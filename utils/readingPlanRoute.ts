import type { PlanDuration, PlanScope } from '../types';

const VALID_SCOPES: PlanScope[] = ['all', 'new_testament', 'old_testament'];

export interface ReadingPlanRouteInput {
  day: number;
  sectionIndex?: number;
  scope?: PlanScope;
  planType?: PlanDuration;
  startDate?: string;
  chapter?: number;
}

export interface ReadingPlanRouteParams {
  day: number;
  sectionIndex: number;
  scope?: PlanScope;
  planType?: PlanDuration;
  startDate?: string;
  chapter?: number;
}

const positiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const nonNegativeInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
};

const normalizeScope = (value: string | null): PlanScope | undefined => {
  return VALID_SCOPES.includes(value as PlanScope) ? value as PlanScope : undefined;
};

export const buildReadingPlanUrl = ({
  day,
  sectionIndex = 0,
  scope,
  planType,
  startDate,
  chapter,
}: ReadingPlanRouteInput) => {
  const params = new URLSearchParams();
  params.set('dia', String(positiveInt(day, 1)));
  params.set('secao', String(nonNegativeInt(sectionIndex, 0)));

  if (scope) params.set('escopo', scope);
  if (planType) params.set('tipo', String(planType));
  if (startDate) params.set('inicio', startDate);
  if (chapter) params.set('capitulo', String(positiveInt(chapter, 1)));

  return `/plano/leitura?${params.toString()}`;
};

export const parseReadingPlanSearchParams = (params: URLSearchParams): ReadingPlanRouteParams => {
  const scope = normalizeScope(params.get('escopo') || params.get('scope'));
  const planType = params.get('tipo') || params.get('type') || undefined;
  const startDate = params.get('inicio') || params.get('start') || undefined;
  const rawChapter = params.get('capitulo') || params.get('chapter');
  const chapter = rawChapter ? positiveInt(rawChapter, 1) : undefined;

  return {
    day: positiveInt(params.get('dia') || params.get('day'), 1),
    sectionIndex: nonNegativeInt(params.get('secao') || params.get('section'), 0),
    scope,
    planType,
    startDate,
    chapter,
  };
};
