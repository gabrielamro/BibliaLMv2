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
