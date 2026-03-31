type EditableContent = {
  id: string;
  type: string;
  [key: string]: any;
};

export const getEditDestinationForContent = (item: EditableContent) => {
  if (item.type === 'plan') {
    return {
      path: `/criador-jornada?id=${item.id}`,
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
