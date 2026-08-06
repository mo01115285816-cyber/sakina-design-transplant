package com.sakeenah.app.plugin

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.sakeenah.app.service.AdhanPlayerService

/**
 * AdhanPlayerPlugin — Capacitor bridge to AdhanPlayerService.
 *
 * Methods:
 * - playAdhan: Start playing adhan audio with notification
 * - stopAdhan: Stop adhan audio and cancel notification
 */
@CapacitorPlugin(name = "AdhanPlayer")
class AdhanPlayerPlugin : Plugin() {

    @PluginMethod
    fun playAdhan(call: PluginCall) {
        try {
            val prayerKey = call.getString("prayerKey") ?: ""
            val prayerName = call.getString("prayerName") ?: ""
            val notificationBody = call.getString("notificationBody") ?: ""
            val muezzinUri = call.getString("muezzinUri")

            if (prayerKey.isEmpty() || prayerName.isEmpty()) {
                call.reject("Missing required parameters: prayerKey, prayerName")
                return
            }

            AdhanPlayerService.start(
                context,
                prayerKey,
                prayerName,
                notificationBody,
                muezzinUri
            )

            call.resolve(JSObject().apply {
                put("success", true)
                put("prayerKey", prayerKey)
            })
        } catch (e: Exception) {
            call.reject("Failed to play adhan: ${e.message}")
        }
    }

    @PluginMethod
    fun stopAdhan(call: PluginCall) {
        try {
            val prayerKey = call.getString("prayerKey") ?: ""

            if (prayerKey.isEmpty()) {
                call.reject("Missing required parameter: prayerKey")
                return
            }

            AdhanPlayerService.stop(context, prayerKey)

            call.resolve(JSObject().apply {
                put("success", true)
                put("prayerKey", prayerKey)
            })
        } catch (e: Exception) {
            call.reject("Failed to stop adhan: ${e.message}")
        }
    }
}
