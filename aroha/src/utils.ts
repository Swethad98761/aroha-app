// src/utils.ts

import { format, isToday, isSameDay, startOfWeek, addDays, getMonth, getYear, getDate } from 'date-fns';

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatMinSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateMedium(dateStr: string): string {
  return format(new Date(dateStr), 'MMMM d, yyyy');
}

/** Get Mon–Sun days for the current week */
export function getCurrentWeekDays(): Date[] {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isSameDay2(d1: Date | string, d2: Date | string): boolean {
  return isSameDay(new Date(d1), new Date(d2));
}

export function isTodayDate(dateStr: string): boolean {
  return isToday(new Date(dateStr));
}

export function getMonthlyWorkoutGoal(weeklyGoal: number): number {
  return Math.round(weeklyGoal * 4.33);
}

export function weekdayNarrow(date: Date): string {
  return format(date, 'EEEEE'); // single letter: M T W T F S S
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Get unique active days this month for a list of ISO date strings */
export function uniqueActiveDaysThisMonth(dates: string[]): number {
  const now = new Date();
  const cm = getMonth(now);
  const cy = getYear(now);
  const days = new Set<number>();
  for (const d of dates) {
    const dt = new Date(d);
    if (getMonth(dt) === cm && getYear(dt) === cy) {
      days.add(getDate(dt));
    }
  }
  return days.size;
}
