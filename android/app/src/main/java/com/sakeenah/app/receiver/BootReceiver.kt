package com.sakeenah.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.sakeenah.app.util.AlarmScheduler
import com.sakeenah.app.util.PrayerScheduleEntry
import com.sakeenah.app.util.PrayerAlarmStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Restores the exact prayer alarms that were persisted when the app last
 * scheduled them. The receiver deliberately does not recalculate prayer times
 * in a second native implementation; it restores the values produced by the
 * React/Adhan calculation path.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action != Intent.ACTION_BOOT_COMPLETED && action != "android.intent.action.QUICKBOOT_POWERON") return

        val pendingResult = goAsync()
        Log.d(TAG, "BOOT_COMPLETED received — restoring persisted prayer alarms")

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val entries = PrayerAlarmStore.loadFuture(context)
                if (entries.isEmpty()) {
                    Log.i(TAG, "No future persisted prayer alarms to restore")
                    return@launch
                }

                val scheduler = AlarmScheduler(context)
                scheduler.cancelAllPrayers()
                scheduler.scheduleAllPrayers(
                    entries.map { entry ->
                        PrayerScheduleEntry(entry.key, entry.name, entry.timeMs, entry.schedulePrePrayer, entry.schedulePrayerTime)
                    }
                )
                Log.i(TAG, "Restored ${entries.size} persisted prayer alarms after boot")
            } catch (error: Exception) {
                Log.e(TAG, "Failed to restore prayer alarms after boot", error)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
