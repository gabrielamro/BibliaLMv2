type EditableContent = {
  id: string;
  type: string;
  [key: string]: any;
};

export const getEditDestinationForContent = (item: EditableContent) => {
  if (item.type === 'plan') {
    return {
      path: '/criador-jornada',
      state: { planData: item },
    };
  }

  if (item.type === 'study') {
    return {
      path: '/criar-conteudo',
      state: { contentId: item.id, studyData: item },
    };
  }

  return null;
};
