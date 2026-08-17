export const PRE_PRAYER_REMINDER_MS = 10 * 60 * 1000;

export type ReminderState = "SCHEDULED" | "ACTIVE" | "EXPIRED";

export interface PrayerReminderEvent {
  prayerKey: string;
  prayerTimeMs: number;
  reminderTargetMs: number;
}

export function createPrayerReminderEvent(
  prayerKey: string,
  prayerTimeMs: number,
): PrayerReminderEvent {
  return {
    prayerKey,
    prayerTimeMs,
    reminderTargetMs: prayerTimeMs - PRE_PRAYER_REMINDER_MS,
  };
}

export function getReminderState(
  event: PrayerReminderEvent,
  nowMs: number,
): ReminderState {
  if (nowMs < event.reminderTargetMs) return "SCHEDULED";
  if (nowMs < event.prayerTimeMs) return "ACTIVE";
  return "EXPIRED";
}

export function getReminderRemainingSeconds(
  event: PrayerReminderEvent,
  nowMs: number,
): number | null {
  if (getReminderState(event, nowMs) !== "ACTIVE") return null;
  return Math.max(0, Math.ceil((event.prayerTimeMs - nowMs) / 1000));
}

export function getTimestampCountdownSeconds(
  nowMs: number,
  targetMs: number,
): number {
  return Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
}
