# Prayer system root-cause audit — investigation snapshot

## Proven code evidence

- `src/App.tsx` re-runs the notification effect whenever `prayerSchedule`, preferences, or reminder flags change. It requests notification permission, clears only Capacitor `LocalNotifications`, then loops over prayers.
- Each pre-prayer call goes through `PrayerNotificationsService.schedulePrePrayerReminder`, which on Android calls `PrayerAlarmService.schedulePrayer`.
- `PrayerAlarmPlugin.schedulePrayer` schedules one native prayer through `AlarmScheduler.schedulePrayer` and only `PrayerAlarmStore.upsert`s that entry. It does not cancel the previous native alarm set.
- The same `schedulePrePrayerReminder` call schedules both the pre-prayer alarm and the prayer-time alarm natively. Immediately afterward `App.tsx` separately calls `PrayerNotificationsService.schedulePrayerTime`, which creates another LocalNotifications entry at the prayer timestamp. This is a second notification path for the prayer-time event on Android.
- The fallback LocalNotifications path uses random IDs, so repeated effect runs cannot cancel the previously created fallback entries by deterministic event identity.
- `AlarmScheduler.schedulePrayer` computes `prePrayerTimeMs = prayerTimeMs - 600000` and uses deterministic request codes, but `scheduleAllPrayers` is the only cancel-first bulk path. The active JS path does not use it.
- `CountdownForegroundService` calls `notificationManager.notify(notificationId, ...)` every second. Its notification is `setOngoing(true)` and it does not cancel the countdown notification in `onCountdownComplete`; it only stops the service. This can keep/recreate the notification while the service is active and leaves no explicit reminder state transition.
- `AlarmReceiver.ACTION_PRAYER_ALARM` stops the countdown service at prayer time, but the service's completion path and receiver path are not coordinated through a persisted event state.
- `src/App.tsx`'s visible countdown is for the next prayer's wall-clock `minutes`, not the pre-prayer reminder window. `getCountdownSeconds` clamps to zero and rolls to the next day, so it is not a source of truth for `PrayerTime - 10 minutes` and masks stale/expired state rather than modeling it.
- `BootReceiver` restores persisted future prayers and uses cancel-first bulk scheduling. A repository-wide call-site search found no runtime caller for `DailyRescheduler`; that unused class was removed so it cannot become a second scheduling path.
- First-launch permission logic runs `handleRetryGPS()` and `PrayerNotificationsService.requestPermission()` concurrently via `Promise.allSettled`. Exact-alarm capability is checked only in the battery modal; the scheduling effect does not gate scheduling on `canScheduleExactAlarms()`.
- Location permission uses a one-session `locationPermissionRequested` ref; after denial, retry is blocked until app reload even if the user can open settings. Background foreground and `watchPosition` can update location, which retriggers the schedule effect.
- AndroidManifest retains only the notification, exact-alarm, location, boot, wake-lock, and foreground-service capabilities required by the active flows; the battery-optimization permission and helper APIs were removed. The legacy `PrePrayerReminderPlugin` registration and source were removed; the active path uses `PrayerAlarmPlugin`.

## Root-cause candidates resolved by source and static verification

A. Duplicate/stale scheduling: effect re-entry + single native scheduling + random fallback IDs + separate native/local prayer-time paths.

B. Reminder lifecycle/dismissal: per-second foreground-service `notify` loop and no explicit `NotificationManager.cancel`/state transition on completion; `setOngoing(true)` prevents ordinary dismissal in the intended model.

C. Countdown semantics: visible UI countdown is next-prayer countdown with clamp-to-zero, not a timestamp-derived reminder window state machine.

D. Permission orchestration: concurrent first-run dialogs, no exact-alarm scheduling gate in the main scheduler, and denial retry lockout in the same session.

E. Restoration duplication: repository-wide call-site tracing found no active `DailyRescheduler` caller; native reboot restoration now uses the persisted bulk schedule contract, while foreground countdown expiration explicitly removes its notification.
