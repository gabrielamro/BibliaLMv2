
import { DailyReading, PlanDuration, PlanScope, ReadingSection } from "../types";
import { BIBLE_BOOKS_LIST } from "../constants";

// Definição da estrutura de capítulos por livro para cálculo preciso
const CHAPTER_COUNTS: { [key: string]: number } = {
  'gn': 50, 'ex': 40, 'lv': 27, 'nm': 36, 'dt': 34, 'js': 24, 'jz': 21, 'rt': 4,
  '1sm': 31, '2sm': 24, '1rs': 22, '2rs': 25, '1cr': 29, '2cr': 36, 'ed': 10, 'ne': 13, 'et': 10,
  'jo': 42, 'sl': 150, 'pv': 31, 'ec': 12, 'ct': 8, 'is': 66, 'jr': 52, 'lm': 5, 'ez': 48,
  'dn': 12, 'os': 14, 'jl': 3, 'am': 9, 'ob': 1, 'jn': 4, 'mq': 7, 'na': 3, 'hc': 3,
  'sf': 3, 'ag': 2, 'zc': 14, 'ml': 4,
  'mt': 28, 'mc': 16, 'lc': 24, 'joao': 21, 'at': 28, 'rm': 16, '1co': 16, '2co': 13,
  'gl': 6, 'ef': 6, 'fp': 4, 'cl': 4, '1ts': 5, '2ts': 3, '1tm': 6, '2tm': 4, 'tt': 3,
  'fm': 1, 'hb': 13, 'tg': 5, '1pe': 5, '2pe': 3, '1jo': 5, '2jo': 1, '3jo': 1, 'jd': 1, 'ap': 22
};

const OT_BOOKS = ['gn', 'ex', 'lv', 'nm', 'dt', 'js', 'jz', 'rt', '1sm', '2sm', '1rs', '2rs', '1cr', '2cr', 'ed', 'ne', 'et', 'jo', 'is', 'jr', 'lm', 'ez', 'dn', 'os', 'jl', 'am', 'ob', 'jn', 'mq', 'na', 'hc', 'sf', 'ag', 'zc', 'ml'];
const NT_BOOKS = ['mt', 'mc', 'lc', 'joao', 'at', 'rm', '1co', '2co', 'gl', 'ef', 'fp', 'cl', '1ts', '2ts', '1tm', '2tm', 'tt', 'fm', 'hb', 'tg', '1pe', '2pe', '1jo', '2jo', '3jo', 'jd', 'ap'];

/**
 * Encontra a referência bíblica (Livro e Capítulos) baseada em um índice global de capítulos.
 */
const getBookAndChaptersFromIndex = (globalIndex: number, bookList: string[], chaptersPerDay: number) => {
  let remainingIndex = Math.max(0, globalIndex);
  let currentBookId = bookList[0];
  
  // Total chapters in this list
  let totalInList = 0;
  for (const bid of bookList) totalInList += (CHAPTER_COUNTS[bid] || 0);

  // If index exceeds total, loop around
  remainingIndex = remainingIndex % totalInList;

  for (const bid of bookList) {
    const count = CHAPTER_COUNTS[bid] || 1;
    if (remainingIndex < count) {
      currentBookId = bid;
      break;
    }
    remainingIndex -= count;
    currentBookId = bid; 
  }

  const bookMeta = BIBLE_BOOKS_LIST.find(b => b.id === currentBookId) || BIBLE_BOOKS_LIST[0];
  const startChap = remainingIndex + 1;
  const maxInBook = CHAPTER_COUNTS[currentBookId] || 1;
  
  const endChap = Math.min(startChap + Math.max(1, Math.floor(chaptersPerDay)) - 1, maxInBook);

  return {
    bookId: currentBookId,
    name: bookMeta.name,
    ref: `${bookMeta.name} ${startChap}${startChap !== endChap ? `-${endChap}` : ''}`,
    startChapter: startChap,
    endChapter: endChap
  };
};

export const getReadingForDay = (
  planDayNumber: number, 
  duration: PlanDuration, 
  startDateStr?: string,
  scope: PlanScope = 'all'
): DailyReading => {
  const durationDays = parseInt(duration) || 365;
  const adjustedDay = ((planDayNumber - 1) % durationDays) + 1;

  const readings: ReadingSection[] = [];

  // Lógica para BÍBLIA COMPLETA
  if (scope === 'all') {
      // 1. Antigo Testamento (Aprox 929 caps)
      const otTotal = 929;
      const otCapsPerDay = otTotal / durationDays;
      const otIndex = Math.floor((adjustedDay - 1) * otCapsPerDay);
      readings.push({ 
          section: 'Antigo Testamento', 
          ...getBookAndChaptersFromIndex(otIndex, OT_BOOKS, Math.ceil(otCapsPerDay)) 
      });

      // 2. Novo Testamento (Aprox 260 caps)
      const ntTotal = 260;
      const ntCapsPerDay = Math.max(1, ntTotal / durationDays);
      const ntIndex = Math.floor((adjustedDay - 1) * ntCapsPerDay);
      readings.push({ 
          section: 'Novo Testamento', 
          ...getBookAndChaptersFromIndex(ntIndex, NT_BOOKS, Math.ceil(ntCapsPerDay)) 
      });

      // 3. Salmos (150 caps) - Circular
      const psIndex = (adjustedDay - 1) % 150;
      readings.push({
        section: 'Salmos',
        bookId: 'sl',
        name: 'Salmos',
        ref: `Salmos ${psIndex + 1}`,
        startChapter: psIndex + 1,
        endChapter: psIndex + 1
      });

      // 4. Provérbios (31 caps) - Circular
      const prIndex = (adjustedDay - 1) % 31;
      readings.push({
        section: 'Provérbios',
        bookId: 'pv',
        name: 'Provérbios',
        ref: `Provérbios ${prIndex + 1}`,
        startChapter: prIndex + 1,
        endChapter: prIndex + 1
      });
  } 
  
  // Outros escopos (Simplificado)
  else {
      const isNT = scope === 'new_testament';
      const books = isNT ? NT_BOOKS : OT_BOOKS;
      const total = isNT ? 260 : 929;
      const capsPerDay = total / durationDays;
      const index = Math.floor((adjustedDay - 1) * capsPerDay);
      
      readings.push({
          section: 'Leitura Principal',
          ...getBookAndChaptersFromIndex(index, books, Math.ceil(capsPerDay))
      });
      
      // Salmos/Provérbios como bônus
      const bonusId = isNT ? 'pv' : 'sl';
      const bonusMax = isNT ? 31 : 150;
      const bonusIndex = (adjustedDay - 1) % bonusMax;
      readings.push({
        section: isNT ? 'Sabedoria' : 'Devocional',
        bookId: bonusId,
        name: bonusId === 'sl' ? 'Salmos' : 'Provérbios',
        ref: `${bonusId === 'sl' ? 'Salmos' : 'Provérbios'} ${bonusIndex + 1}`,
        startChapter: bonusIndex + 1,
        endChapter: bonusIndex + 1
      });
  }

  let dateDisplay = `Dia ${planDayNumber}`;
  if (startDateStr) {
    const start = new Date(startDateStr);
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + (planDayNumber - 1));
    dateDisplay = targetDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return {
    day: planDayNumber,
    dateDisplay,
    readings
  };
};