import type { PrayerItem } from "./prayerTimes";

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getCurrentPrayerIndex(nowMinutes: number, schedule: PrayerItem[]) {
  for (let index = schedule.length - 1; index >= 0; index -= 1) {
    if (nowMinutes >= schedule[index].minutes) return index;
  }
  return schedule.length - 1;
}

/**
 * Derive the countdown from two absolute timestamps. The caller must provide
 * a target that belongs to the desired prayer event; ticks are never the
 * source of truth.
 */
export function getCountdownSeconds(now: Date, target: Date): number {
  return Math.ceil((target.getTime() - now.getTime()) / 1000);
}

export function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
