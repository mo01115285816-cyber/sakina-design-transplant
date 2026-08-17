package com.sakeenah.app.util

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Persists the exact prayer schedule produced by the React/Adhan layer.
 * Boot recovery must restore the same values that were scheduled before reboot;
 * it must not silently substitute a second calculation implementation.
 */
object PrayerAlarmStore {
    private const val PREFS_NAME = "sakeenah_prayer_alarm_store"
    private const val ENTRIES_KEY = "scheduled_prayers"

    data class Entry(
        val key: String,
        val name: String,
        val timeMs: Long,
        val schedulePrePrayer: Boolean = true,
        val schedulePrayerTime: Boolean = true,
    )

    @Synchronized
    fun replace(context: Context, entries: List<Entry>) {
        val json = JSONArray()
        entries
            .filter { it.key.isNotBlank() && it.name.isNotBlank() && it.timeMs > 0L }
            .forEach { entry ->
                json.put(JSONObject().apply {
                    put("key", entry.key)
                    put("name", entry.name)
                    put("timeMs", entry.timeMs)
                    put("schedulePrePrayer", entry.schedulePrePrayer)
                    put("schedulePrayerTime", entry.schedulePrayerTime)
                })
            }
        preferences(context).edit().putString(ENTRIES_KEY, json.toString()).apply()
    }

    @Synchronized
    fun upsert(context: Context, entry: Entry) {
        val entries = load(context).filterNot { it.key == entry.key }.toMutableList()
        entries += entry
        replace(context, entries)
    }

    @Synchronized
    fun loadFuture(context: Context, nowMs: Long = System.currentTimeMillis()): List<Entry> {
        return load(context)
            .filter { it.timeMs > nowMs }
            .sortedBy { it.timeMs }
    }

    @Synchronized
    fun clear(context: Context) {
        preferences(context).edit().remove(ENTRIES_KEY).apply()
    }

    private fun load(context: Context): List<Entry> {
        val raw = preferences(context).getString(ENTRIES_KEY, null) ?: return emptyList()
        return try {
            val json = JSONArray(raw)
            buildList {
                for (index in 0 until json.length()) {
                    val item = json.optJSONObject(index) ?: continue
                    val key = item.optString("key")
                    val name = item.optString("name")
                    val timeMs = item.optLong("timeMs", 0L)
                    val schedulePrePrayer = item.optBoolean("schedulePrePrayer", true)
                    val schedulePrayerTime = item.optBoolean("schedulePrayerTime", true)
                    if (key.isNotBlank() && name.isNotBlank() && timeMs > 0L) {
                        add(Entry(key, name, timeMs, schedulePrePrayer, schedulePrayerTime))
                    }
                }
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun preferences(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
