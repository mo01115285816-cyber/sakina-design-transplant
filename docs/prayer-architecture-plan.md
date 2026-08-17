# Prayer and reminder architecture plan

## Root Cause A — duplicate scheduling

The React effect re-enters on location, date, and preference changes. It currently clears only Capacitor LocalNotifications, calls the native single-prayer scheduler repeatedly, and then separately schedules prayer-time LocalNotifications. The fix is one serialized `scheduleAllPrayerEvents` operation. On Android it calls one native cancel-first bulk method. On web it clears pending entries and schedules deterministic IDs. The native prayer-time path becomes the only Android prayer-time notification source.

## Root Cause B — reminder lifecycle and dismissal

The foreground countdown service re-publishes the same notification every second and marks it ongoing. The fix is a single notification publication at the ACTIVE transition, a system chronometer based on the absolute prayer timestamp, and one expiration runnable at `PrayerTime`. Expiration cancels/removes the notification and stops the service. A user dismissal is not observed or rescheduled; the service remains non-republishing until the scheduled expiration.

## Root Cause C — countdown semantics

The app currently derives the visible countdown from wall-clock minutes and clamps it to zero. A pure timestamp state machine will define `SCHEDULED` for `now < PrayerTime - 600000`, `ACTIVE` for `PrayerTime - 600000 <= now < PrayerTime`, and `EXPIRED` for `now >= PrayerTime`. Remaining seconds are derived from `PrayerTime - now` only while ACTIVE and never become negative.

## Root Cause D — permission orchestration

Location and notification requests currently run concurrently, exact-alarm capability is not a scheduling gate, and a one-session ref blocks location retry. The fix sequences location handling separately from the notification capability onboarding, checks exact-alarm capability before native scheduling, and uses foreground refresh to check location state without reopening a system dialog automatically. The onboarding exposes only notification and exact-alarm capabilities required by the scheduler; the prayer-time and ten-minute reminder events remain mandatory application capabilities with no Settings toggles. Battery optimization and vendor auto-start remain optional platform limitations rather than unconditional permission requests.

## Root Cause E — competing legacy path

The old `PrePrayerReminderPlugin` is registered but not used by the current JS path. It will be removed from runtime registration so the Android app has one active pre-prayer scheduling path.

## Non-goals

Quran/QCF, page layouts, Quran data, welcome screen, and unrelated services are not modified.
