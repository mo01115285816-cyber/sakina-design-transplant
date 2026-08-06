package com.sakeenah.app.util

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.sakeenah.app.receiver.AlarmReceiver
import java.util.Calendar

/**
 * AlarmScheduler — schedules Exact Alarms using AlarmManager.setExactAndAllowWhileIdle().
 *
 * This is the CORE component that ensures prayer notifications fire at the EXACT second,
 * even when the phone is in Doze Mode or Deep Sleep.
 *
 * The "AllowWhileIdle" flag tells Android kernel: "Wake up the CPU NOW at this exact millisecond."
 *
 * Features:
 * - Uses setExactAndAllowWhileIdle() for Doze Mode bypass
 * - Schedules two alarms per prayer:
 *   1. Pre-prayer (10 minutes before) → triggers CountdownForegroundService
 *   2. Prayer time → triggers adhan notification
 * - Handles day-wraparound (Isha → next day Fajr)
 * - 24-Hour Refresh Chain: reschedules next day's alarms at Isha and Fajr
 * - Deterministic request codes to avoid duplicate/cancel issues
 */
class AlarmScheduler(private val context: Context) {

    companion object {
        private const val TAG = "AlarmScheduler"
        private const val PRE_PRAYER_MINUTES = 10

        // Prayer keys in order
        val PRAYER_KEYS = listOf("fajr", "dhuhr", "asr", "maghrib", "isha")

        /**
         * Calculate a unique request code for a prayer alarm.
         * This ensures deterministic IDs that can be cancelled and rescheduled reliably.
         *
         * Formula: (dayOfYear * 1000) + (prayerIndex * 10) + alarmType
         * - dayOfYear: 1-366
         * - prayerIndex: 0-4 (fajr, dhuhr, asr, maghrib, isha)
         * - alarmType: 0 = pre-prayer, 1 = prayer time
         */
        fun getRequestCode(dayOfYear: Int, prayerIndex: Int, isPrePrayer: Boolean): Int {
            val typeCode = if (isPrePrayer) 0 else 1
            return (dayOfYear * 1000) + (prayerIndex * 10) + typeCode
        }

        fun getPrayerIndex(prayerKey: String): Int {
            return PRAYER_KEYS.indexOf(prayerKey).coerceAtLeast(0)
        }
    }

    private val alarmManager: AlarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    /**
     * Schedule Exact Alarms for a specific prayer on a specific date.
     *
     * @param prayerKey One of: fajr, dhuhr, asr, maghrib, isha
     * @param prayerName Arabic name (e.g., "الفجر")
     * @param prayerTimeMs Prayer time in milliseconds (epoch)
     */
    fun schedulePrayer(prayerKey: String, prayerName: String, prayerTimeMs: Long) {
        val prayerIndex = getPrayerIndex(prayerKey)
        val calendar = Calendar.getInstance().apply {
            timeInMillis = prayerTimeMs
        }
        val dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)

        // 1. Schedule pre-prayer alarm (10 minutes before)
        val prePrayerTimeMs = prayerTimeMs - (PRE_PRAYER_MINUTES * 60 * 1000)
        if (prePrayerTimeMs > System.currentTimeMillis()) {
            scheduleExactAlarm(
                requestCode = getRequestCode(dayOfYear, prayerIndex, isPrePrayer = true),
                triggerTimeMs = prePrayerTimeMs,
                action = AlarmReceiver.ACTION_PRE_PRAYER_ALARM,
                prayerKey = prayerKey,
                prayerName = prayerName,
                prayerTimeMs = prayerTimeMs
            )
            Log.d(TAG, "Scheduled pre-prayer alarm for $prayerName at ${formatTime(prePrayerTimeMs)}")
        }

        // 2. Schedule prayer time alarm
        if (prayerTimeMs > System.currentTimeMillis()) {
            scheduleExactAlarm(
                requestCode = getRequestCode(dayOfYear, prayerIndex, isPrePrayer = false),
                triggerTimeMs = prayerTimeMs,
                action = AlarmReceiver.ACTION_PRAYER_ALARM,
                prayerKey = prayerKey,
                prayerName = prayerName,
                prayerTimeMs = prayerTimeMs
            )
            Log.d(TAG, "Scheduled prayer alarm for $prayerName at ${formatTime(prayerTimeMs)}")
        }
    }

    /**
     * Schedule ALL prayers for a specific date.
     * Call this from BootReceiver and DailyRescheduler.
     *
     * @param prayers List of (prayerKey, prayerName, prayerTimeMs) tuples
     */
    fun scheduleAllPrayers(prayers: List<Triple<String, String, Long>>) {
        // Cancel all existing alarms first (to avoid duplicates)
        cancelAllPrayers()

        for ((prayerKey, prayerName, prayerTimeMs) in prayers) {
            schedulePrayer(prayerKey, prayerName, prayerTimeMs)
        }
        Log.d(TAG, "Scheduled ${prayers.size} prayers (${prayers.size * 2} alarms total)")
    }

    /**
     * Cancel all scheduled alarms for a specific prayer.
     */
    fun cancelPrayer(prayerKey: String, dayOfYear: Int) {
        val prayerIndex = getPrayerIndex(prayerKey)

        for (isPrePrayer in listOf(true, false)) {
            val requestCode = getRequestCode(dayOfYear, prayerIndex, isPrePrayer)
            val action = if (isPrePrayer) AlarmReceiver.ACTION_PRE_PRAYER_ALARM else AlarmReceiver.ACTION_PRAYER_ALARM

            val intent = Intent(context, AlarmReceiver::class.java).apply {
                this.action = action
            }
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags)
            alarmManager.cancel(pendingIntent)
        }
    }

    /**
     * Cancel ALL scheduled alarms (for rescheduling).
     * Scans ±1 day range to cover edge cases.
     */
    fun cancelAllPrayers() {
        val today = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)

        for (day in (today - 1)..(today + 1)) {
            for (prayerIndex in PRAYER_KEYS.indices) {
                for (isPrePrayer in listOf(true, false)) {
                    val requestCode = getRequestCode(day, prayerIndex, isPrePrayer)
                    val action = if (isPrePrayer) AlarmReceiver.ACTION_PRE_PRAYER_ALARM else AlarmReceiver.ACTION_PRAYER_ALARM

                    val intent = Intent(context, AlarmReceiver::class.java).apply {
                        this.action = action
                    }
                    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    } else {
                        PendingIntent.FLAG_UPDATE_CURRENT
                    }
                    val pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags)
                    alarmManager.cancel(pendingIntent)
                }
            }
        }
        Log.d(TAG, "Cancelled all prayer alarms")
    }

    /**
     * Schedule the 24-Hour Refresh Chain.
     * At Isha time, schedule tomorrow's Fajr pre-prayer alarm.
     * At Fajr time, schedule tomorrow's remaining prayers.
     */
    fun scheduleRefreshChain(nextDayPrayers: List<Triple<String, String, Long>>) {
        for ((prayerKey, prayerName, prayerTimeMs) in nextDayPrayers) {
            val prePrayerTimeMs = prayerTimeMs - (PRE_PRAYER_MINUTES * 60 * 1000)

            if (prePrayerTimeMs > System.currentTimeMillis()) {
                val calendar = Calendar.getInstance().apply { timeInMillis = prayerTimeMs }
                val dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)
                val prayerIndex = getPrayerIndex(prayerKey)

                scheduleExactAlarm(
                    requestCode = getRequestCode(dayOfYear, prayerIndex, isPrePrayer = true),
                    triggerTimeMs = prePrayerTimeMs,
                    action = AlarmReceiver.ACTION_PRE_PRAYER_ALARM,
                    prayerKey = prayerKey,
                    prayerName = prayerName,
                    prayerTimeMs = prayerTimeMs
                )
            }
        }
        Log.d(TAG, "Scheduled 24-Hour Refresh Chain for ${nextDayPrayers.size} prayers")
    }

    /**
     * Check if SCHEDULE_EXACT_ALARM permission is granted.
     * On Android 12+, this permission is REQUIRED for setExactAndAllowWhileIdle().
     */
    fun canScheduleExactAlarms(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true // Not required on older versions
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PRIVATE: Exact Alarm Scheduling
    // ══════════════════════════════════════════════════════════════════

    private fun scheduleExactAlarm(
        requestCode: Int,
        triggerTimeMs: Long,
        action: String,
        prayerKey: String,
        prayerName: String,
        prayerTimeMs: Long
    ) {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            this.action = action
            putExtra(AlarmReceiver.EXTRA_PRAYER_KEY, prayerKey)
            putExtra(AlarmReceiver.EXTRA_PRAYER_NAME, prayerName)
            putExtra(AlarmReceiver.EXTRA_PRAYER_TIME_MS, prayerTimeMs)
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags)

        // ═══ THE CRITICAL CALL: setExactAndAllowWhileIdle ══
        // This tells Android kernel: "Wake up the CPU NOW at this exact millisecond"
        // even if the phone is in Doze Mode / Deep Sleep.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerTimeMs,
                pendingIntent
            )
        } else {
            // Fallback for Android < 6.0
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                triggerTimeMs,
                pendingIntent
            )
        }
    }

    private fun formatTime(ms: Long): String {
        val cal = Calendar.getInstance().apply { timeInMillis = ms }
        return String.format(
            "%02d:%02d:%02d",
            cal.get(Calendar.HOUR_OF_DAY),
            cal.get(Calendar.MINUTE),
            cal.get(Calendar.SECOND)
        )
    }
}
