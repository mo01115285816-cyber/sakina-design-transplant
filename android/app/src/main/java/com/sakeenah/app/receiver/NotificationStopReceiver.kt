package com.sakeenah.app.receiver

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.util.Log
import com.sakeenah.app.service.CountdownForegroundService
import com.sakeenah.app.service.AdhanPlayerService

/**
 * NotificationStopReceiver — handles STOP button press from prayer notifications.
 *
 * When user taps STOP on a prayer notification, this receiver:
 * 1. Cancels the notification immediately
 * 2. Stops any playing adhan audio
 * 3. Stops the CountdownForegroundService if running
 *
 * This uses Android's Notification Actions feature — the button appears
 * directly on the notification card without opening the app.
 */
class NotificationStopReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "StopReceiver"
        const val ACTION_STOP_ADHAN = "com.sakeenah.app.action.STOP_ADHAN"
        const val EXTRA_NOTIFICATION_ID = "notification_id"
        const val EXTRA_PRAYER_KEY = "prayer_key"

        /**
         * Create a PendingIntent for the STOP action.
         * Used by PrayerAlarmPlugin when building the notification.
         */
        fun createStopPendingIntent(
            context: Context,
            notificationId: Int,
            prayerKey: String,
            requestCode: Int
        ): android.app.PendingIntent {
            val intent = Intent(context, NotificationStopReceiver::class.java).apply {
                action = ACTION_STOP_ADHAN
                putExtra(EXTRA_NOTIFICATION_ID, notificationId)
                putExtra(EXTRA_PRAYER_KEY, prayerKey)
            }

            val flags = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            } else {
                android.app.PendingIntent.FLAG_UPDATE_CURRENT
            }

            return android.app.PendingIntent.getBroadcast(context, requestCode, intent, flags)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_STOP_ADHAN) return

        val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, 0)
        val prayerKey = intent.getStringExtra(EXTRA_PRAYER_KEY) ?: "unknown"

        Log.d(TAG, "STOP pressed for prayer: $prayerKey (notificationId: $notificationId)")

        // 1. Cancel the notification immediately
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancel(notificationId)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to cancel notification", e)
        }

        // 2. Stop any playing adhan audio via AudioManager
        try {
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.abandonAudioFocus(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop audio", e)
        }

        // 3. Stop AdhanPlayerService
        try {
            AdhanPlayerService.stop(context, prayerKey)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop adhan player", e)
        }

        // 4. Stop CountdownForegroundService if running
        try {
            CountdownForegroundService.stop(context, prayerKey)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop countdown service", e)
        }
    }
}
