import type { DailyReading, PlanProgress } from '../types';

export interface ReadingPlanProgressInput {
  reading: DailyReading | null;
  progress: PlanProgress;
  readChapters?: Record<string, number[]>;
  xpReadingChapter?: number;
  xpDailyGoal?: number;
  xpReadingPresence?: number;
  today?: Date;
}

export interface ReadingPlanDayStatus {
  day: number;
  status: 'done' | 'partial' | 'missed' | 'upcoming';
}

export interface ReadingPlanProgressSummary {
  planDay: number;
  totalPlanDays: number;
  planPercent: number;
  completedPlanDays: number;
  totalSections: number;
  completedSections: number;
  totalChapters: number;
  completedChapters: number;
  remainingChapters: number;
  dayPercent: number;
  estimatedMinutesRemaining: number;
  earnedManaToday: number;
  availableManaToday: number;
  activeSecondsToday: number;
  activeSecondsWeek: number;
  activeMinutesToday: number;
  activeMinutesWeek: number;
  readingPaceLabel: 'iniciando' | 'leve' | 'constante' | 'profundo';
  presenceGoalMet: boolean;
  presenceManaEarnedToday: number;
  presenceManaAvailableToday: number;
  dayCompleted: boolean;
  isToday: boolean;
  daysBehind: number;
  nextMilestoneDays: number;
  calendar: ReadingPlanDayStatus[];
}

const countSectionChapters = (startChapter: number, endChapter: number) => {
  return Math.max(0, endChapter - startChapter + 1);
};

const parsePlanDays = (planType: string) => {
  const parsed = Number.parseInt(planType, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 365;
};

export const getPlanDayFromStartDate = (startDate: string, today = new Date()) => {
  if (!startDate) return 1;

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 1;

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.floor((currentDay - startDay) / 86400000) + 1;

  return Math.max(1, diffDays);
};

export const getReadingPlanProgressSummary = ({
  reading,
  progress,
  readChapters = {},
  xpReadingChapter = 20,
  xpDailyGoal = 50,
  xpReadingPresence = 5,
  today = new Date(),
}: ReadingPlanProgressInput): ReadingPlanProgressSummary => {
  const totalPlanDays = parsePlanDays(progress.planType);
  const planDay = getPlanDayFromStartDate(progress.startDate, today);
  const completedDays = progress.completedDays || [];
  const explicitCompletedSections = reading ? progress.completedSections?.[reading.day] || [] : [];

  const sections = reading?.readings || [];
  let completedSections = 0;
  let totalChapters = 0;
  let completedChapters = 0;

  sections.forEach((section, index) => {
    const chapterCount = countSectionChapters(section.startChapter, section.endChapter);
    const bookProgress = readChapters[section.bookId] || [];
    const completedInSection = Array.from(
      { length: chapterCount },
      (_, chapterOffset) => section.startChapter + chapterOffset
    ).filter((chapter) => bookProgress.includes(chapter)).length;

    totalChapters += chapterCount;
    completedChapters += completedInSection;

    if (explicitCompletedSections.includes(index) || completedInSection === chapterCount) {
      completedSections += 1;
    }
  });

  const totalSections = sections.length;
  const remainingChapters = Math.max(0, totalChapters - completedChapters);
  const dayCompleted = totalSections > 0 && completedSections >= totalSections;
  const completedPlanDays = new Set(completedDays).size;
  const latestCompletedDay = completedDays.length ? Math.max(...completedDays) : 0;
  const daysBehind = Math.max(0, planDay - Math.max(latestCompletedDay, completedPlanDays) - (dayCompleted ? 0 : 1));
  const nextMilestoneDays = Math.max(0, 7 - ((progress.streak || 0) % 7 || 7));
  const startCalendarDay = Math.max(1, planDay - 20);
  const timeLog = progress.timeLog || {};
  const todayTime = timeLog[reading?.day || planDay] || timeLog[planDay];
  const activeSecondsToday = Math.max(0, todayTime?.activeSeconds || 0);
  const activeSecondsWeek = Array.from({ length: 7 }, (_, index) => planDay - index)
    .filter((day) => day > 0)
    .reduce((total, day) => total + Math.max(0, timeLog[day]?.activeSeconds || 0), 0);
  const activeMinutesToday = Math.floor(activeSecondsToday / 60);
  const activeMinutesWeek = Math.floor(activeSecondsWeek / 60);
  const presenceGoalMet = activeSecondsToday >= 300;
  const presenceManaEarnedToday = todayTime?.awardedPresenceMana ? xpReadingPresence : 0;
  const presenceManaAvailableToday = presenceGoalMet || todayTime?.awardedPresenceMana ? 0 : xpReadingPresence;
  const readingPaceLabel: ReadingPlanProgressSummary['readingPaceLabel'] =
    activeSecondsToday < 60 ? 'iniciando' :
    activeSecondsToday < 300 ? 'leve' :
    activeSecondsToday < 900 ? 'constante' :
    'profundo';

  const calendar: ReadingPlanDayStatus[] = Array.from({ length: 30 }, (_, index) => {
    const day = startCalendarDay + index;
    const isDone = completedDays.includes(day) || (reading?.day === day && dayCompleted);
    const isPartial = reading?.day === day && !dayCompleted && completedSections > 0;
    const status: ReadingPlanDayStatus['status'] = isDone ? 'done' : isPartial ? 'partial' : day < planDay ? 'missed' : 'upcoming';
    return { day, status };
  });

  return {
    planDay,
    totalPlanDays,
    planPercent: Math.min(100, Math.round((completedPlanDays / totalPlanDays) * 100)),
    completedPlanDays,
    totalSections,
    completedSections,
    totalChapters,
    completedChapters,
    remainingChapters,
    dayPercent: totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0,
    estimatedMinutesRemaining: remainingChapters * 4,
    earnedManaToday: completedChapters * xpReadingChapter + (dayCompleted ? xpDailyGoal : 0) + presenceManaEarnedToday,
    availableManaToday: remainingChapters * xpReadingChapter + (dayCompleted ? 0 : xpDailyGoal) + presenceManaAvailableToday,
    activeSecondsToday,
    activeSecondsWeek,
    activeMinutesToday,
    activeMinutesWeek,
    readingPaceLabel,
    presenceGoalMet,
    presenceManaEarnedToday,
    presenceManaAvailableToday,
    dayCompleted,
    isToday: reading?.day === planDay,
    daysBehind,
    nextMilestoneDays,
    calendar,
  };
};
