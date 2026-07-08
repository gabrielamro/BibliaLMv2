import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getPlanDayFromStartDate, getReadingPlanProgressSummary } from '../utils/readingPlanProgress.ts';
import type { DailyReading, PlanProgress } from '../types.ts';

const baseProgress: PlanProgress = {
  isActive: true,
  planType: '365',
  planScope: 'new_testament',
  completedDays: [],
  completedSections: {},
  lastChapterInSection: {},
  lastReadingDate: '',
  streak: 6,
  startDate: '2026-06-10T08:00:00.000Z',
  notificationsEnabled: false,
  notificationTime: '08:00',
  studyRoutine: [],
};

const reading: DailyReading = {
  day: 6,
  dateDisplay: '15 de junho de 2026',
  readings: [
    { section: 'Leitura Principal', bookId: 'mt', name: 'Mateus', ref: 'Mateus 1-2', startChapter: 1, endChapter: 2 },
    { section: 'Sabedoria', bookId: 'pv', name: 'Proverbios', ref: 'Proverbios 1', startChapter: 1, endChapter: 1 },
  ],
};

test('getPlanDayFromStartDate counts the current plan day without absolute-date drift', () => {
  assert.equal(getPlanDayFromStartDate(baseProgress.startDate, new Date('2026-06-15T12:00:00.000Z')), 6);
});

test('getReadingPlanProgressSummary calculates daily progress, Mana and next milestone', () => {
  const summary = getReadingPlanProgressSummary({
    reading,
    progress: baseProgress,
    readChapters: { mt: [1], pv: [1] },
    today: new Date('2026-06-15T12:00:00.000Z'),
  });

  assert.equal(summary.planDay, 6);
  assert.equal(summary.totalChapters, 3);
  assert.equal(summary.completedChapters, 2);
  assert.equal(summary.remainingChapters, 1);
  assert.equal(summary.completedSections, 1);
  assert.equal(summary.dayPercent, 67);
  assert.equal(summary.earnedManaToday, 40);
  assert.equal(summary.availableManaToday, 75);
  assert.equal(summary.nextMilestoneDays, 1);
  assert.equal(summary.readingPaceLabel, 'iniciando');
});

test('getReadingPlanProgressSummary marks a completed day and adds daily goal Mana', () => {
  const summary = getReadingPlanProgressSummary({
    reading,
    progress: { ...baseProgress, completedSections: { 6: [0, 1] }, completedDays: [6] },
    readChapters: { mt: [1, 2], pv: [1] },
    today: new Date('2026-06-15T12:00:00.000Z'),
  });

  assert.equal(summary.dayCompleted, true);
  assert.equal(summary.earnedManaToday, 110);
  assert.equal(summary.availableManaToday, 5);
  assert.equal(summary.calendar.find((day) => day.day === 6)?.status, 'done');
});

test('getReadingPlanProgressSummary includes active reading time and presence Mana', () => {
  const summary = getReadingPlanProgressSummary({
    reading,
    progress: {
      ...baseProgress,
      timeLog: {
        1: { activeSeconds: 600, lastTrackedAt: '2026-06-10T12:00:00.000Z' },
        6: { activeSeconds: 920, awardedPresenceMana: true, lastTrackedAt: '2026-06-15T12:00:00.000Z' },
      },
    },
    readChapters: { mt: [1], pv: [1] },
    today: new Date('2026-06-15T12:00:00.000Z'),
  });

  assert.equal(summary.activeMinutesToday, 15);
  assert.equal(summary.activeMinutesWeek, 25);
  assert.equal(summary.readingPaceLabel, 'profundo');
  assert.equal(summary.presenceGoalMet, true);
  assert.equal(summary.presenceManaEarnedToday, 5);
  assert.equal(summary.availableManaToday, 70);
});
