import type { PrayerItem } from "@/utils/prayerTimes";

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

export function getCountdownSeconds(localNow: Date, targetMinutes: number) {
  const target = new Date(localNow);
  target.setHours(Math.floor(targetMinutes / 60), targetMinutes % 60, 0, 0);
  if (target <= localNow) target.setDate(target.getDate() + 1);
  return Math.max(0, Math.floor((target.getTime() - localNow.getTime()) / 1000));
}

export function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
