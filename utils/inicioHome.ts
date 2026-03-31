export const READING_RING_LENGTH = 163.36;

export interface InicioQuickAccessItem {
  label: string;
  path: string;
  iconKey: 'book' | 'target' | 'book-marked' | 'wand' | 'message' | 'history' | 'coffee' | 'heart' | 'map' | 'brain';
  colorClass: string;
}

export interface InicioQuickAccessGroup {
  title: string;
  items: InicioQuickAccessItem[];
}

export const INICIO_QUICK_ACCESS_GROUPS: InicioQuickAccessGroup[] = [
  {
    title: 'Pessoal',
    items: [
      { label: 'Meus Estudos', path: '/estudos', iconKey: 'book-marked', colorClass: 'text-orange-500' },
      { label: 'Cursos & Trilhas', path: '/aluno', iconKey: 'target', colorClass: 'text-red-500' },
      { label: 'Estúdio Criativo', path: '/estudio-criativo', iconKey: 'wand', colorClass: 'text-pink-500' },
      { label: 'Conselheiro IA', path: '/chat', iconKey: 'message', colorClass: 'text-purple-500' },
      { label: 'Atividades', path: '/historico', iconKey: 'history', colorClass: 'text-sky-500' },
    ],
  },
  {
    title: 'Bíblia',
    items: [
      { label: 'Bíblia Sagrada', path: '/biblia', iconKey: 'book', colorClass: 'text-blue-500' },
      { label: 'Pão Diário', path: '/devocional', iconKey: 'coffee', colorClass: 'text-amber-500' },
      { label: 'Orações', path: '/oracoes', iconKey: 'heart', colorClass: 'text-rose-500' },
      { label: 'Trilhas', path: '/trilhas', iconKey: 'map', colorClass: 'text-emerald-500' },
      { label: 'Meta de Leitura', path: '/plano', iconKey: 'target', colorClass: 'text-green-500' },
      { label: 'Quiz Bíblico', path: '/quiz', iconKey: 'brain', colorClass: 'text-yellow-500' },
    ],
  },
];

export function getReadingGoalProgress(chaptersRead: number, goal: number = 365) {
  const safeGoal = goal > 0 ? goal : 1;
  const percent = Math.min(100, Math.round((Math.max(0, chaptersRead) / safeGoal) * 100)) || 0;
  const strokeDashoffset = Number(
    (READING_RING_LENGTH - (READING_RING_LENGTH * percent) / 100).toFixed(2),
  );

  return {
    percent,
    strokeDashoffset,
  };
}
