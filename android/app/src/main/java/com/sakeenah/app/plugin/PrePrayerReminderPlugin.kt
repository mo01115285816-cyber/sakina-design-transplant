package com.sakeenah.app.plugin

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.sakeenah.app.MainActivity
import com.sakeenah.app.R

/**
 * Pre-Prayer Reminder Plugin — Native Android Chronometer Notification
 *
 * Builds a LIVE COUNTDOWN notification that ticks down from 10:00 to 00:00
 * using Android's built-in Chronometer system. This notification:
 *
 * - Shows a real-time countdown on the lock screen and notification shade
 * - Appears as a "Status Chip" / Live Activity on Android 12+ in the status bar
 * - Cannot be dismissed by the user (setOngoing = true)
 * - Auto-cancels exactly at prayer time via setTimeoutAfter(10 minutes)
 * - Uses gentle vibration pattern [0, 300, 200, 300]
 * - Silent (no sound) — purely visual + haptic
 *
 * Architecture: This is a SEPARATE plugin from DynamicIsland because it uses
 * entirely different native APIs (NotificationCompat vs Compose overlay).
 */
@CapacitorPlugin(name = "PrePrayerReminder")
class PrePrayerReminderPlugin : Plugin() {

    companion object {
        const val CHANNEL_ID = "pre_prayer_channel"
        const val NOTIFICATION_BASE_ID = 200000

        // Prayer index mapping for deterministic notification IDs
        private val PRAYER_INDEX = mapOf(
            "fajr" to 0,
            "dhuhr" to 1,
            "asr" to 2,
            "maghrib" to 3,
            "isha" to 4
        )

        /**
         * Calculate a deterministic notification ID based on prayer key and date.
         * Ensures: unique per day per prayer, predictable for cancellation,
         * no conflicts with other notification IDs.
         */
        fun getNotificationId(prayerKey: String, dayOfYear: Int): Int {
            val index = PRAYER_INDEX[prayerKey] ?: 0
            return NOTIFICATION_BASE_ID + (dayOfYear % 366) * 5 + index
        }
    }

    override fun load() {
        super.load()
        ensureChannelExists()
    }

    /**
     * Schedule a pre-prayer reminder with live Chronometer countdown.
     *
     * Expected parameters:
     * {
     *   "prayerName": "العصر",
     *   "prayerKey": "asr",
     *   "prayerTimeMs": 1754400000000  (prayer time in milliseconds)
     * }
     */
    @PluginMethod
    fun schedule(call: PluginCall) {
        try {
            val prayerName = call.getString("prayerName") ?: ""
            val prayerKey = call.getString("prayerKey") ?: ""
            val prayerTimeMs = call.getLong("prayerTimeMs") ?: 0L

            if (prayerName.isEmpty() || prayerKey.isEmpty() || prayerTimeMs == 0L) {
                call.reject("Missing required parameters: prayerName, prayerKey, prayerTimeMs")
                return
            }

            val notificationId = getNotificationId(prayerKey, getDayOfYear())
            buildAndShowNotification(prayerName, prayerTimeMs, notificationId)

            call.resolve(JSObject().apply {
                put("success", true)
                put("notificationId", notificationId)
            })
        } catch (e: Exception) {
            call.reject("Failed to schedule pre-prayer reminder: ${e.message}")
        }
    }

    /**
     * Cancel a specific pre-prayer reminder notification.
     *
     * Expected parameters:
     * {
     *   "prayerKey": "asr",
     *   "dayOfYear": 217  (optional, defaults to today)
     * }
     */
    @PluginMethod
    fun cancel(call: PluginCall) {
        try {
            val prayerKey = call.getString("prayerKey") ?: ""
            val dayOfYear = call.getInt("dayOfYear", getDayOfYear()) ?: getDayOfYear()

            if (prayerKey.isEmpty()) {
                call.reject("Missing required parameter: prayerKey")
                return
            }

            val notificationId = getNotificationId(prayerKey, dayOfYear)
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancel(notificationId)

            call.resolve(JSObject().apply {
                put("success", true)
                put("notificationId", notificationId)
            })
        } catch (e: Exception) {
            call.reject("Failed to cancel pre-prayer reminder: ${e.message}")
        }
    }

    /**
     * Cancel ALL pre-prayer reminder notifications (useful for rescheduling).
     */
    @PluginMethod
    fun cancelAll(call: PluginCall) {
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            // Cancel all notifications in the pre-prayer ID range
            val today = getDayOfYear()
            for (day in (today - 1)..(today + 1)) {
                for (index in 0..4) {
                    val id = NOTIFICATION_BASE_ID + (day % 366) * 5 + index
                    try { notificationManager.cancel(id) } catch (_: Exception) {}
                }
            }

            call.resolve(JSObject().apply { put("success", true) })
        } catch (e: Exception) {
            call.reject("Failed to cancel all pre-prayer reminders: ${e.message}")
        }
    }

    /**
     * Check if Chronometer countdown notifications are supported on this device.
     * Requires Android 7.0+ (API 24) for setChronometerCountDown().
     */
    @PluginMethod
    fun isChronometerSupported(call: PluginCall) {
        val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
        call.resolve(JSObject().apply { put("supported", supported) })
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PRIVATE: Notification Building
    // ══════════════════════════════════════════════════════════════════

    private fun buildAndShowNotification(
        prayerName: String,
        prayerTimeMs: Long,
        notificationId: Int
    ) {
        val context = context

        // Create the notification channel (idempotent)
        ensureChannelExists()

        // Build an intent that opens the app when notification is tapped
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // ═══ Build the Chronometer notification ═══
        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            // Content
            .setContentTitle("أوشك الميقات • صلاة $prayerName")
            .setContentText("تهيأ بوضوئك، متبقي على الأذان:")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText("تهيأ بوضوئك، متبقي على الأذان:")
            )
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(false)
            .setOngoing(true)  // Cannot be dismissed by user

            // ══ CHRONOMETER — The core feature ═══
            .setWhen(prayerTimeMs)           // Target time = prayer time
            .setUsesChronometer(true)        // Enable the chronometer display
            .setChronometerCountDown(true)   // Count DOWN from target (09:59 → 00:00)

            // ═══ Vibration — gentle pattern ═══
            .setVibrate(longArrayOf(0, 300, 200, 300))

            // ═══ Category — for proper Android treatment ═══
            .setCategory(NotificationCompat.CATEGORY_ALARM)

        // ══ Auto-cancellation at prayer time (API 26+) ═══
        // The notification will automatically disappear 10 minutes after being shown,
        // which is exactly when prayer time arrives.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder.setTimeoutAfter(10 * 60 * 1000) // 10 minutes in milliseconds
        }

        // ═══ Show the notification ═══
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(notificationId, builder.build())
    }

    /**
     * Create the pre-prayer notification channel if it doesn't exist.
     * Channel properties:
     * - HIGH importance (shows as heads-up, enables chronometer in status bar)
     * - Silent (no sound — the chronometer IS the alert)
     * - Vibration enabled
     * - Shows as Live Activity / Status Chip on Android 12+
     */
    private fun ensureChannelExists() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val context = context
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Check if channel already exists
        if (notificationManager.getNotificationChannel(CHANNEL_ID) != null) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            "تنبيه ما قبل الصلاة",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "عدّاد تنازلي حيّ يظهر قبل الصلاة بـ 10 دقائق"
            enableVibration(true)
            enableLights(true)
            setShowBadge(false)
            setSound(null, null) // Silent — chronometer is the visual alert
            vibrationPattern = longArrayOf(0, 300, 200, 300)
            lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
        }

        notificationManager.createNotificationChannel(channel)
    }

    private fun getDayOfYear(): Int {
        val cal = java.util.Calendar.getInstance()
        return cal.get(java.util.Calendar.DAY_OF_YEAR)
    }
}
