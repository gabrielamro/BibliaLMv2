import { ServiceNote } from '../types';

type RawNote = Record<string, any>;

export type NoteArea = 'bible' | 'study' | 'devotional' | 'culto_plus' | 'general';

const getStandardNoteArea = (note: RawNote): NoteArea => {
  const bookId = String(note.bookId || note.book_id || '').toLowerCase();
  if (bookId === 'devocional' || bookId === 'devotional') return 'devotional';
  if (bookId.startsWith('study:')) return 'study';
  if (!bookId || bookId === 'geral' || bookId === 'general') return 'general';
  return 'bible';
};

export const getNoteAreaLabel = (area: NoteArea) => {
  switch (area) {
    case 'bible': return 'Biblia';
    case 'study': return 'Estudos';
    case 'devotional': return 'Devocional';
    case 'culto_plus': return 'Culto+';
    default: return 'Geral';
  }
};

export const getNoteAreaClasses = (area?: NoteArea) => {
  switch (area) {
    case 'bible':
      return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300';
    case 'study':
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';
    case 'devotional':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
    case 'culto_plus':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  }
};

export const getNoteAreaTextClasses = (area?: NoteArea) => {
  switch (area) {
    case 'bible':
      return 'text-cyan-700 dark:text-cyan-300';
    case 'study':
      return 'text-indigo-700 dark:text-indigo-300';
    case 'devotional':
      return 'text-amber-700 dark:text-amber-300';
    case 'culto_plus':
      return 'text-emerald-700 dark:text-emerald-300';
    default:
      return 'text-gray-600 dark:text-gray-300';
  }
};

export const normalizeStandardNote = (note: RawNote) => {
  const area = getStandardNoteArea(note);
  return {
    ...note,
    type: 'note' as const,
    noteArea: area,
    noteAreaLabel: getNoteAreaLabel(area),
    title: note.title || (area === 'bible' ? 'Nota biblica' : area === 'study' ? 'Reflexao de estudo' : area === 'devotional' ? 'Nota devocional' : 'Nota geral'),
    content: note.content || '',
    createdAt: note.createdAt || note.created_at,
    updatedAt: note.updatedAt || note.updated_at,
  };
};

export const normalizeServiceNote = (note: ServiceNote) => ({
  id: note.id,
  type: 'note' as const,
  noteArea: 'culto_plus' as const,
  noteAreaLabel: getNoteAreaLabel('culto_plus'),
  title: 'Anotacao do Culto+',
  content: note.content || '',
  tags: note.tags || [],
  sourceId: note.serviceId,
  sourceType: 'service_note',
  bookId: 'culto_plus',
  chapter: 0,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});
