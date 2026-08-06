package com.sakeenah.app.plugin

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.sakeenah.app.data.AudioStateHolder
import com.sakeenah.app.service.AudioOverlayService

@CapacitorPlugin(name = "DynamicIsland")
class DynamicIslandPlugin : Plugin() {

    override fun load() {
        super.load()
        DynamicIslandBridge.plugin = this
    }

    @PluginMethod
    fun show(call: PluginCall) {
        try {
            AudioOverlayService.startService(context)
            call.resolve(JSObject().apply { put("success", true) })
        } catch (e: Exception) {
            call.reject("Failed to start overlay: ${e.message}")
        }
    }

    @PluginMethod
    fun hide(call: PluginCall) {
        try {
            AudioOverlayService.stopService(context)
            call.resolve(JSObject().apply { put("success", true) })
        } catch (e: Exception) {
            call.reject("Failed to stop overlay: ${e.message}")
        }
    }

    @PluginMethod
    fun updateState(call: PluginCall) {
        try {
            val title = call.getString("title") ?: ""
            val reciter = call.getString("reciter") ?: ""
            val contentType = call.getString("contentType") ?: "quran"
            val artworkUrl = call.getString("artworkUrl") ?: ""
            val isPlaying = if (call.hasOption("isPlaying")) call.getBoolean("isPlaying") else null
            val currentPositionMs = if (call.hasOption("currentPositionMs")) call.getLong("currentPositionMs") else null
            val durationMs = if (call.hasOption("durationMs")) call.getLong("durationMs") else null

            AudioStateHolder.updateMediaInfo(title, reciter, contentType, artworkUrl)
            if (isPlaying != null) AudioStateHolder.updatePlaying(isPlaying)
            if (currentPositionMs != null && durationMs != null) AudioStateHolder.updatePosition(currentPositionMs, durationMs)

            call.resolve(JSObject().apply { put("success", true) })
        } catch (e: Exception) {
            call.reject("Failed to update state: ${e.message}")
        }
    }

    @PluginMethod
    fun requestOverlayPermission(call: PluginCall) {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                val intent = android.content.Intent(
                    android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    android.net.Uri.parse("package:${context.packageName}")
                )
                activity.startActivityForResult(intent, 9999)
            }
            call.resolve(JSObject().apply {
                put("granted", android.provider.Settings.canDrawOverlays(context))
            })
        } catch (e: Exception) {
            call.reject("Failed: ${e.message}")
        }
    }

    @PluginMethod
    fun checkOverlayPermission(call: PluginCall) {
        val granted = try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                android.provider.Settings.canDrawOverlays(context)
            } else true
        } catch (e: Exception) { false }
        call.resolve(JSObject().apply { put("granted", granted) })
    }

    fun notifyReact(eventName: String, data: Any?) {
        val jsData = JSObject()
        if (eventName == "seek" && data is Long) {
            jsData.put("positionMs", data)
        }
        notifyListeners(eventName, jsData)
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        DynamicIslandBridge.plugin = null
    }
}
