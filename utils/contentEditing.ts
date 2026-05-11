type EditableContent = {
  id: string;
  type: string;
  [key: string]: any;
};

const roomStudyTypes = new Set(['plan', 'sala', 'room', 'journey', 'jornada', 'lesson', 'aula']);

export const isStandaloneStudyContent = (item: Record<string, any>) => {
  const rawType = String(item.type || item.contentType || '').toLowerCase();
  const meta = typeof item.meta === 'object' && item.meta !== null ? item.meta : {};

  if (roomStudyTypes.has(rawType)) return false;
  if (item.planId || item.plan_id || item.refDayId || item.ref_day_id) return false;
  if (meta.planId || meta.plan_id || meta.refDayId || meta.ref_day_id) return false;

  return true;
};

const parseJsonField = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeProfileStudyItem = (study: Record<string, any>): Record<string, any> => {
  const blocks = parseJsonField<any[]>(study.blocks, []);
  const meta = parseJsonField<Record<string, any>>(study.meta, {});

  return {
    ...study,
    type: study.type || 'study',
    blocks,
    meta,
    title: study.title || meta?.title || 'Estudo sem titulo',
    coverUrl: study.cover_image || meta?.coverImage || study.coverUrl,
    createdAt: study.createdAt || study.created_at,
    updatedAt: study.updatedAt || study.updated_at,
  };
};

export const getProfileStudyItems = ({
  studiesData,
  publicStudiesData,
  isOwner,
}: {
  studiesData: Record<string, any>[];
  publicStudiesData: Record<string, any>[];
  isOwner: boolean;
}) => {
  const normalized = [...publicStudiesData, ...studiesData]
    .map(normalizeProfileStudyItem)
    .filter(isStandaloneStudyContent)
    .filter((study) => isOwner || study.status === 'published' || study.isPublic === true || study.is_public === true);

  const uniqueById = new Map<string, Record<string, any>>();
  normalized.forEach((study) => {
    if (!uniqueById.has(study.id)) uniqueById.set(study.id, study);
  });

  return Array.from(uniqueById.values()).sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0).getTime();
    const dateB = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0).getTime();
    return dateB - dateA;
  });
};

export const getEditDestinationForContent = (item: EditableContent) => {
  if (item.type === 'plan') {
    return {
      path: `/criar-sala?id=${item.id}`,
      state: { planData: item },
    };
  }

  if (item.type === 'study') {
    return {
      path: `/criar-conteudo?id=${item.id}`,
      state: { contentId: item.id, studyData: item },
    };
  }

  return null;
};
