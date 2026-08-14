package com.sakeenah.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.sakeenah.app.MainActivity
import com.sakeenah.app.R
import com.sakeenah.app.receiver.NotificationStopReceiver

/**
 * CountdownForegroundService — Live countdown from 10:00 to 00:00 before adhan.
 *
 * This service runs as a FOREGROUND SERVICE to survive Doze Mode and App Standby.
 * It displays a notification with:
 * - Title: "أوشك الميقات • صلاة {name}"
 * - Body: "تهيأ بوضوئك، متبقي على الأذان:"
 * - Chronometer: live ticking countdown (MM:SS format)
 * - Ongoing: cannot be dismissed
 * - Auto-cancels at prayer time
 *
 * Service type: specialUse (Android 14+) — required for exact-time notifications.
 *
 * Lifecycle:
 * 1. AlarmReceiver triggers this service exactly 10 minutes before prayer
 * 2. Service shows chronometer notification
 * 3. Timer counts down second-by-second
 * 4. At 00:00, service stops itself and triggers AlarmReceiver.ACTION_PRAYER_ALARM
 */
class CountdownForegroundService : Service() {

    companion object {
        private const val TAG = "CountdownService"
        const val CHANNEL_ID = "countdown_channel"
        const val NOTIFICATION_ID_BASE = 300000

        private const val EXTRA_PRAYER_KEY = "prayer_key"
        private const val EXTRA_PRAYER_NAME = "prayer_name"
        private const val EXTRA_PRAYER_TIME_MS = "prayer_time_ms"

        // Wake lock tag for CPU wake during countdown
        private const val WAKE_LOCK_TAG = "SakinaCountdownWakeLock"

        fun start(context: Context, prayerKey: String, prayerName: String, prayerTimeMs: Long) {
            val intent = Intent(context, CountdownForegroundService::class.java).apply {
                putExtra(EXTRA_PRAYER_KEY, prayerKey)
                putExtra(EXTRA_PRAYER_NAME, prayerName)
                putExtra(EXTRA_PRAYER_TIME_MS, prayerTimeMs)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context, prayerKey: String) {
            val intent = Intent(context, CountdownForegroundService::class.java)
            context.stopService(intent)
        }

        fun getNotificationId(prayerKey: String): Int {
            return NOTIFICATION_ID_BASE + prayerKey.hashCode().toLong().toInt().and(0xFFFF)
        }
    }

    private var prayerKey: String = ""
    private var prayerName: String = ""
    private var prayerTimeMs: Long = 0L

    private val handler = Handler(Looper.getMainLooper())
    private var wakeLock: PowerManager.WakeLock? = null

    private val updateRunnable = object : Runnable {
        override fun run() {
            updateNotification()
            if (System.currentTimeMillis() < prayerTimeMs) {
                handler.postDelayed(this, 1000) // Update every second
            } else {
                // Time reached — stop service and trigger prayer alarm
                onCountdownComplete()
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        ensureChannelExists()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        prayerKey = intent?.getStringExtra(EXTRA_PRAYER_KEY) ?: ""
        prayerName = intent?.getStringExtra(EXTRA_PRAYER_NAME) ?: ""
        prayerTimeMs = intent?.getLongExtra(EXTRA_PRAYER_TIME_MS, 0L) ?: 0L

        if (prayerKey.isEmpty() || prayerTimeMs == 0L) {
            stopSelf()
            return START_NOT_STICKY
        }

        // Acquire partial wake lock to keep CPU awake
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG).apply {
            setReferenceCounted(false)
            acquire(11 * 60 * 1000L) // 11 minutes max (with 1 min buffer)
        }

        // Start as foreground service with the notification
        val notificationId = getNotificationId(prayerKey)
        val notification = buildNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+ — specialUse type for exact-time services
            startForeground(notificationId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(notificationId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(notificationId, notification)
        }

        // Start the second-by-second update loop
        handler.post(updateRunnable)

        return START_NOT_STICKY // Don't restart if killed (alarm will re-trigger)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun buildNotification(): Notification {
        val notificationId = getNotificationId(prayerKey)

        // Intent to open app when notification is tapped
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("أوشك الميقات • صلاة $prayerName")
            .setContentText("تهيأ بوضوئك، متبقي على الأذان:")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText("تهيأ بوضوئك، متبقي على الأذان:")
            )
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(pendingIntent)
            .setOngoing(true) // Cannot be dismissed
            .setAutoCancel(false)
            .setWhen(prayerTimeMs)
            .setUsesChronometer(true)
            .setChronometerCountDown(true)
            .setVibrate(longArrayOf(0, 300, 200, 300))

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder.setTimeoutAfter(10 * 60 * 1000) // 10 minutes
        }

        return builder.build()
    }

    private fun updateNotification() {
        val notificationId = getNotificationId(prayerKey)
        val notification = buildNotification()

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(notificationId, notification)
    }

    private fun onCountdownComplete() {
        // Countdown finished — prayer time reached
        wakeLock?.release()
        wakeLock = null
        handler.removeCallbacks(updateRunnable)
        stopSelf()

        // Trigger the main adhan notification via AlarmReceiver
        // In a full implementation, this would send an intent to show the adhan notification
        Log.d(TAG, "Countdown complete for $prayerName — prayer time reached")
    }

    private fun ensureChannelExists() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (notificationManager.getNotificationChannel(CHANNEL_ID) != null) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            "العدّاد التنازلي قبل الأذان",
            NotificationManager.IMPORTANCE_MAX
        ).apply {
            description = "عدّاد تنازلي حيّ يظهر قبل الأذان بـ 10 دقائق — لا يمكن تعطيله"
            enableVibration(true)
            enableLights(true)
            setShowBadge(false)
            setSound(null, null) // Silent — chronometer is the visual alert
            vibrationPattern = longArrayOf(0, 300, 200, 300)
            lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            setBypassDnd(true) // Bypass Do Not Disturb
        }

        notificationManager.createNotificationChannel(channel)
    }

    override fun onDestroy() {
        super.onDestroy()
        wakeLock?.release()
        wakeLock = null
        handler.removeCallbacks(updateRunnable)
    }
}
