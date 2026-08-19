package com.sakeenah.app.plugin

import android.Manifest
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.ResultReceiver
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.getcapacitor.PermissionState
import com.sakeenah.app.service.RadioCaptureService

@CapacitorPlugin(
    name = "RadioCapture",
    permissions = [
        Permission(
            alias = "storage",
            strings = [Manifest.permission.WRITE_EXTERNAL_STORAGE],
        ),
    ],
)
class RadioCapturePlugin : Plugin() {

    @PluginMethod
    fun start(call: PluginCall) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P && getPermissionState("storage") != PermissionState.GRANTED) {
            saveCall(call)
            requestPermissionForAlias("storage", call, "storagePermissionCallback")
            return
        }

        val streamUrl = call.getString("streamUrl").orEmpty()
        val stationId = call.getString("stationId").orEmpty()
        val stationName = call.getString("stationName").orEmpty()
        if (streamUrl.isBlank() || stationId.isBlank() || stationName.isBlank()) {
            call.reject("بيانات محطة البث غير مكتملة.")
            return
        }

        val receiver = object : ResultReceiver(Handler(Looper.getMainLooper())) {
            override fun onReceiveResult(resultCode: Int, resultData: android.os.Bundle?) {
                val data = resultData ?: android.os.Bundle()
                if (resultCode == RadioCaptureService.RESULT_OK && data.getBoolean("success", false)) {
                    call.resolve(JSObject().apply {
                        put("success", true)
                        data.getString("fileName")?.let { put("fileName", it) }
                        data.getString("mimeType")?.let { put("mimeType", it) }
                    })
                } else {
                    call.reject(data.getString("message") ?: "تعذر الاتصال بمصدر البث.")
                }
            }
        }

        try {
            RadioCaptureService.start(context, streamUrl, stationId, stationName, receiver)
        } catch (error: Exception) {
            call.reject(error.message ?: "تعذر بدء تسجيل البث.")
        }
    }

    @PermissionCallback
    private fun storagePermissionCallback(call: PluginCall) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P && getPermissionState("storage") != PermissionState.GRANTED) {
            call.reject("يلزم السماح بالتخزين لحفظ التسجيل على هذا الإصدار من Android.")
            return
        }
        start(call)
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        val receiver = object : ResultReceiver(Handler(Looper.getMainLooper())) {
            override fun onReceiveResult(resultCode: Int, resultData: android.os.Bundle?) {
                val data = resultData ?: android.os.Bundle()
                if (resultCode == RadioCaptureService.RESULT_OK && data.getBoolean("success", false)) {
                    call.resolve(JSObject().apply {
                        put("success", true)
                        put("fileName", data.getString("fileName"))
                        put("mimeType", data.getString("mimeType"))
                        put("stationId", data.getString("stationId"))
                        put("stationName", data.getString("stationName"))
                        put("durationMs", data.getLong("durationMs", 0L))
                        put("bytes", data.getLong("bytes", 0L))
                        data.getString("uri")?.let { put("uri", it) }
                        data.getString("localPath")?.let { put("localPath", it) }
                        data.getString("reason")?.let { put("reason", it) }
                    })
                } else {
                    call.reject(data.getString("message") ?: "تعذر حفظ تسجيل البث.")
                }
            }
        }

        try {
            RadioCaptureService.stop(context, receiver)
        } catch (error: Exception) {
            call.reject(error.message ?: "تعذر إيقاف تسجيل البث.")
        }
    }
}
