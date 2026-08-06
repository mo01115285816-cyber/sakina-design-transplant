package com.sakeenah.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.sakeenah.app.util.AlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Calendar

/**
 * BootReceiver — restores all prayer alarms after device reboot.
 *
 * When the user restarts their phone, Android kills ALL scheduled alarms.
 * This receiver listens for BOOT_COMPLETED and immediately reschedules
 * today's prayer alarms in the background — even if the user never opens the app.
 *
 * This is CRITICAL for long-term reliability: without this, the app would
 * stop working after every reboot until the user manually opens it.
 *
 * Requirements:
 * - RECEIVE_BOOT_COMPLETED permission (already in AndroidManifest.xml)
 * - Registered in AndroidManifest.xml with BOOT_COMPLETED intent filter
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        Log.d(TAG, "BOOT_COMPLETED received — rescheduling all prayer alarms")

        // Use a background coroutine to avoid blocking the main thread
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val scheduler = AlarmScheduler(context)

                // Calculate today's prayer times
                val todayPrayers = calculateTodayPrayerTimes(context)

                if (todayPrayers.isNotEmpty()) {
                    // Cancel any existing alarms (shouldn't be any after reboot, but just in case)
                    scheduler.cancelAllPrayers()

                    // Schedule all of today's prayers
                    scheduler.scheduleAllPrayers(todayPrayers)

                    // Schedule the 24-Hour Refresh Chain for tomorrow
                    val tomorrowPrayers = calculateTomorrowPrayerTimes(context)
                    if (tomorrowPrayers.isNotEmpty()) {
                        scheduler.scheduleRefreshChain(tomorrowPrayers)
                    }

                    Log.d(TAG, "Successfully rescheduled ${todayPrayers.size} prayers after boot")
                } else {
                    Log.w(TAG, "No prayer times calculated after boot — user may need to open app")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to reschedule prayers after boot", e)
            }
        }
    }

    /**
     * Calculate today's prayer times.
     * In production, this should use the same calculation logic as the React layer.
     * For now, we'll use a simplified calculation or retrieve from SharedPreferences.
     *
     * TODO: Integrate with the same prayer calculation service used by the app.
     */
    private suspend fun calculateTodayPrayerTimes(
        context: Context
    ): List<Triple<String, String, Long>> {
        return withContext(Dispatchers.Default) {
            // TODO: Replace with actual prayer time calculation
            // This should use the same Adhan library and calculation method as the React layer
            // For now, return empty list — the app will need to open once to set proper times
            emptyList()
        }
    }

    /**
     * Calculate tomorrow's prayer times.
     */
    private suspend fun calculateTomorrowPrayerTimes(
        context: Context
    ): List<Triple<String, String, Long>> {
        return withContext(Dispatchers.Default) {
            // TODO: Replace with actual prayer time calculation for tomorrow
            emptyList()
        }
    }
}
