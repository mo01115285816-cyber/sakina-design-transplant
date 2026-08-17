import { readFileSync } from 'node:fs';
import {
  createPrayerReminderEvent,
  getReminderRemainingSeconds,
  getReminderState,
} from '../src/services/prayer-reminder-state';
import { getCountdownSeconds } from '../src/utils/timeHelpers';

const prayerTimeMs = 1_800_000_600_000;
const event = createPrayerReminderEvent('fajr', prayerTimeMs);
const targetMs = prayerTimeMs - 600_000;

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(event.reminderTargetMs === targetMs, 'ReminderTarget must equal PrayerTime - 600000ms');
assert(getReminderState(event, targetMs - 1) === 'SCHEDULED', 'Before target must be SCHEDULED');
assert(getReminderState(event, targetMs) === 'ACTIVE', 'At target must be ACTIVE');
assert(getReminderRemainingSeconds(event, targetMs) === 600, 'At target remaining must be 600 seconds');
assert(getReminderState(event, prayerTimeMs - 1000) === 'ACTIVE', 'One second before prayer must be ACTIVE');
assert(getReminderRemainingSeconds(event, prayerTimeMs - 1000) === 1, 'One second before prayer remaining must be 1');
assert(getReminderState(event, prayerTimeMs) === 'EXPIRED', 'At prayer time must be EXPIRED');
assert(getReminderState(event, prayerTimeMs + 10_000) === 'EXPIRED', 'After prayer must remain EXPIRED');
assert(getReminderRemainingSeconds(event, prayerTimeMs) === null, 'Expired event has no countdown');
assert(getCountdownSeconds(new Date(targetMs), new Date(prayerTimeMs)) === 600, 'Absolute countdown must derive from timestamps');
assert(getCountdownSeconds(new Date(prayerTimeMs + 1000), new Date(prayerTimeMs)) === -1, 'Raw timestamp helper must expose an expired target');

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const notificationService = readFileSync(new URL('../src/services/PrayerNotificationsService.ts', import.meta.url), 'utf8');
const prayerAlarmService = readFileSync(new URL('../src/services/PrayerAlarmService.ts', import.meta.url), 'utf8');
const countdownService = readFileSync(new URL('../android/app/src/main/java/com/sakeenah/app/service/CountdownForegroundService.kt', import.meta.url), 'utf8');
const scheduler = readFileSync(new URL('../android/app/src/main/java/com/sakeenah/app/util/AlarmScheduler.kt', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../src/components/SettingsScreen.tsx', import.meta.url), 'utf8');
const permissionModal = readFileSync(new URL('../src/components/BatteryOptimizationModal.tsx', import.meta.url), 'utf8');

assert(!app.includes('schedulePrePrayerReminder('), 'App must not call the legacy per-prayer scheduler');
assert(!app.includes('schedulePrayerTime('), 'App must not create a second prayer-time notification path');
assert((app.match(/syncPrayerSchedule\(/g) ?? []).length === 1, 'App must have one central schedule reconciliation call');
assert(app.includes('prayerTimeNotificationsEnabled: true'), 'Prayer-time notifications must remain mandatory');
assert(app.includes('prePrayerRemindersEnabled: true'), 'Ten-minute reminders must remain mandatory');
assert(!app.includes('isPrayerReminderEnabled'), 'Global prayer notification toggle must not return to App');
assert(!app.includes('isPrePrayerReminderEnabled'), 'Global pre-prayer toggle must not return to App');
assert(!settings.includes('منبهات الصلاة'), 'Global prayer notification card must not appear in Settings');
assert(app.includes('if (!locationPermissionFlowDone) return;'), 'First-launch capability onboarding must wait for location flow');
assert(!app.includes('if (!isNative || !locationPermissionFlowDone) return;'), 'Notification onboarding must not be Android-only');
assert(permissionModal.includes('if (!statusLoaded) return;'), 'Permission modal must not dismiss while status is loading');
assert(permissionModal.includes('currentStep < 0 || currentStep >= steps.length'), 'Permission modal must recover an invalid step index');
assert(prayerAlarmService.includes('schedulePrayerTime?: boolean'), 'Native schedule contract must carry prayer-time enablement');
assert(!notificationService.includes('id: Math.floor(Math.random()'), 'Notification IDs must never be random');
assert(!prayerAlarmService.includes('isBatteryOptimizationEnabled'), 'PrayerAlarmService must not expose unused battery optimization APIs');
assert(!countdownService.includes('setOngoing(true)'), 'Countdown reminder must be dismissible');
assert(!countdownService.includes('notificationManager.notify'), 'Countdown service must not republish every second');
assert(countdownService.includes('stopForeground(STOP_FOREGROUND_REMOVE)'), 'Countdown expiration must remove its foreground notification');
assert(scheduler.includes('prayerTimeMs - (PRE_PRAYER_MINUTES * 60 * 1000)'), 'Native target must derive from prayer timestamp');
assert(scheduler.includes('for (day in 0..366)'), 'Native cancellation must cover all day-of-year request codes');

console.log(JSON.stringify({
  reminderTargetMs: targetMs,
  states: ['SCHEDULED', 'ACTIVE', 'EXPIRED'],
  noNegativeStateCountdown: true,
  centralScheduling: true,
  dismissibleNotification: true,
}, null, 2));
