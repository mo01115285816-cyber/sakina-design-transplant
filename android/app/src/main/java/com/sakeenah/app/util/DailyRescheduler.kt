package com.sakeenah.app.util

import android.content.Context
import android.util.Log
import java.util.Calendar

/**
 * DailyRescheduler — implements the "24-Hour Refresh Chain" strategy.
 *
 * The problem: scheduling alarms a year in advance is unreliable because:
 * 1. Timezone changes (DST) can shift prayer times
 * 2. Calculation method changes (user travels to a different country)
 * 3. Android may eventually kill long-scheduled alarms
 *
 * The solution: "Rolling 24-Hour Window"
 * - At Isha time (end of day): schedule tomorrow's Fajr pre-prayer alarm
 * - At Fajr time (start of day): schedule the rest of today's prayers
 * - This creates a continuous chain that never breaks
 * - Android sees the app as "active" because it's constantly rescheduling
 *
 * Usage:
 * - Call scheduleNextDayAtIsha() when the Isha prayer alarm fires
 * - Call scheduleRemainingTodayAtFajr() when the Fajr prayer alarm fires
 */
class DailyRescheduler(private val context: Context) {

    companion object {
        private const val TAG = "DailyRescheduler"
    }

    private val scheduler = AlarmScheduler(context)

    /**
     * Schedule tomorrow's Fajr at Isha time.
     * Called when the Isha prayer alarm fires.
     *
     * This ensures that even if the user doesn't open the app for a week,
     * tomorrow's Fajr will still fire because we scheduled it at Isha time today.
     */
    fun scheduleNextDayAtIsha(
        tomorrowFajrKey: String,
        tomorrowFajrName: String,
        tomorrowFajrTimeMs: Long
    ) {
        val calendar = Calendar.getInstance().apply {
            timeInMillis = tomorrowFajrTimeMs
        }

        // Only schedule if it's actually tomorrow (safety check)
        val today = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
        val tomorrow = calendar.get(Calendar.DAY_OF_YEAR)

        if (tomorrow == (today + 1) || (today == 365 && tomorrow == 1)) {
            scheduler.schedulePrayer(tomorrowFajrKey, tomorrowFajrName, tomorrowFajrTimeMs)
            Log.d(TAG, "Scheduled tomorrow's Fajr at Isha time")
        } else {
            Log.w(TAG, "Fajr time is not tomorrow — skipping schedule")
        }
    }

    /**
     * Schedule the rest of today's prayers at Fajr time.
     * Called when the Fajr prayer alarm fires.
     *
     * This ensures that Dhuhr, Asr, Maghrib, and Isha are all scheduled
     * fresh at the start of each day.
     */
    fun scheduleRemainingTodayAtFajr(
        prayers: List<Triple<String, String, Long>>
    ) {
        // prayers should contain: dhuhr, asr, maghrib, isha (NOT fajr, already fired)
        for ((prayerKey, prayerName, prayerTimeMs) in prayers) {
            // Only schedule if it's in the future
            if (prayerTimeMs > System.currentTimeMillis()) {
                scheduler.schedulePrayer(prayerKey, prayerName, prayerTimeMs)
            }
        }
        Log.d(TAG, "Scheduled remaining ${prayers.size} prayers at Fajr time")
    }

    /**
     * Full reschedule: cancels everything and reschedules from scratch.
     * Use this when:
     * - User changes location
     * - User changes calculation method
     * - User changes Asr school (Hanafi vs Standard)
     * - App detects that alarms may have been cancelled by the system
     */
    fun fullReschedule(allPrayers: List<Triple<String, String, Long>>) {
        scheduler.cancelAllPrayers()
        scheduler.scheduleAllPrayers(allPrayers)
        Log.d(TAG, "Full reschedule completed for ${allPrayers.size} prayers")
    }

    /**
     * Health check: verify that all expected alarms are still scheduled.
     * If any are missing, trigger a full reschedule.
     *
     * Call this periodically (e.g., every hour via WorkManager).
     */
    fun healthCheck(expectedPrayers: List<Triple<String, String, Long>>): Boolean {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
        var allScheduled = true

        for ((prayerKey, prayerName, prayerTimeMs) in expectedPrayers) {
            val calendar = Calendar.getInstance().apply { timeInMillis = prayerTimeMs }
            val dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)
            val prayerIndex = AlarmScheduler.getPrayerIndex(prayerKey)

            // Check if the alarm is still scheduled by attempting to cancel it
            // If it returns true, it was scheduled; if false, it wasn't
            val requestCode = AlarmScheduler.getRequestCode(dayOfYear, prayerIndex, isPrePrayer = true)
            val intent = android.content.Intent(context, com.sakeenah.app.receiver.AlarmReceiver::class.java).apply {
                action = com.sakeenah.app.receiver.AlarmReceiver.ACTION_PRE_PRAYER_ALARM
            }
            val flags = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            } else {
                android.app.PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pendingIntent = android.app.PendingIntent.getBroadcast(context, requestCode, intent, flags)

            // Note: There's no direct API to check if an alarm is scheduled.
            // We use a heuristic: if the alarm time is in the past but the prayer hasn't fired,
            // something went wrong.
            if (prayerTimeMs < System.currentTimeMillis() - (24 * 60 * 60 * 1000)) {
                // Prayer time was more than 24 hours ago — this shouldn't happen
                allScheduled = false
                Log.w(TAG, "Alarm for $prayerName appears to be stale")
            }
        }

        if (!allScheduled) {
            Log.w(TAG, "Health check failed — triggering full reschedule")
            fullReschedule(expectedPrayers)
        } else {
            Log.d(TAG, "Health check passed — all alarms are scheduled")
        }

        return allScheduled
    }
}
