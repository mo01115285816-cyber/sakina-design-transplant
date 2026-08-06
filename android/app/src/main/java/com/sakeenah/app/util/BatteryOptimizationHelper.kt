package com.sakeenah.app.util

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log

/**
 * BatteryOptimizationHelper — manages battery optimization bypass requests.
 *
 * Android companies (Samsung, Xiaomi, OPPO, Vivo) have aggressive battery savers
 * that kill background apps after a few days of not being opened.
 *
 * This helper:
 * 1. Checks if our app is in the "Doze Mode / Battery Optimization" restricted list
 * 2. Requests the user to whitelist our app via ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
 * 3. Once whitelisted, our app is treated like the system clock/alarm app — never killed
 *
 * This is CRITICAL for long-term reliability (> 1 week without opening the app).
 *
 * Flow:
 * 1. Check isBatteryOptimizationEnabled() — returns true if we're restricted
 * 2. Call requestIgnoreBatteryOptimization() — opens system settings for user approval
 * 3. User approves → app is whitelisted permanently
 * 4. Call isIgnoringBatteryOptimizations() — returns true once whitelisted
 */
class BatteryOptimizationHelper(private val context: Context) {

    companion object {
        private const val TAG = "BatteryOptHelper"
    }

    /**
     * Check if our app is subject to battery optimization.
     * Returns true if the app WILL be killed by the system when in background.
     * Returns false if the app is ALREADY whitelisted (safe).
     */
    fun isBatteryOptimizationEnabled(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false

        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return false
        return !powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }

    /**
     * Check if our app is whitelisted from battery optimization.
     * Returns true if the app is ALREADY safe (whitelisted).
     * Returns false if the app is still subject to Doze Mode / App Standby.
     */
    fun isIgnoringBatteryOptimizations(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true

        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return true
        return powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }

    /**
     * Request the user to whitelist our app from battery optimization.
     * This opens the Android system settings dialog where the user must approve.
     *
     * Returns true if the intent was launched successfully.
     * Returns false if the permission is not available (shouldn't happen on Android 6+).
     */
    @SuppressLint("BatteryLife")
    fun requestIgnoreBatteryOptimization(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true

        return try {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${context.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            Log.d(TAG, "Launched battery optimization bypass request")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch battery optimization request", e)

            // Fallback: open general battery settings
            try {
                val fallbackIntent = Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(fallbackIntent)
                true
            } catch (e2: Exception) {
                Log.e(TAG, "Failed to open battery settings fallback", e2)
                false
            }
        }
    }

    /**
     * Open the app's battery optimization settings page directly.
     * Useful as a fallback if the direct request is denied.
     */
    fun openBatterySettings(): Boolean {
        return try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${context.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open battery settings", e)
            false
        }
    }

    /**
     * Open the manufacturer-specific auto-start settings.
     * This is REQUIRED for Xiaomi (MIUI), OPPO (ColorOS), Vivo (FuntouchOS).
     * These manufacturers kill apps that aren't in the "Auto-start" list.
     */
    fun openAutoStartSettings(): Boolean {
        val manufacturer = Build.MANUFACTURER.lowercase()

        val intent = when {
            manufacturer.contains("xiaomi") -> {
                // MIUI Auto-start
                Intent("miui.intent.action.APP_PERM_EDITOR").apply {
                    putExtra("extra_pkgname", context.packageName)
                }
            }
            manufacturer.contains("oppo") -> {
                // OPPO Auto-start
                Intent("com.coloros.safecenter.startupapp.StartupAppListActivity")
            }
            manufacturer.contains("vivo") -> {
                // Vivo Auto-start
                Intent("com.vivo.permissionmanager.activity.BgStartUpManagerActivity")
            }
            manufacturer.contains("samsung") -> {
                // Samsung Device Care
                Intent("android.settings.APPLICATION_DETAILS_SETTINGS").apply {
                    data = Uri.parse("package:${context.packageName}")
                }
            }
            else -> {
                Log.d(TAG, "No specific auto-start settings for manufacturer: $manufacturer")
                null
            }
        }

        return if (intent != null) {
            try {
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                Log.d(TAG, "Opened auto-start settings for $manufacturer")
                true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to open auto-start settings for $manufacturer", e)
                // Fallback to general battery settings
                openBatterySettings()
            }
        } else {
            false
        }
    }

    /**
     * Check if we're running on a manufacturer known for aggressive battery killing.
     */
    fun isAggressiveManufacturer(): Boolean {
        val manufacturer = Build.MANUFACTURER.lowercase()
        return manufacturer.contains("xiaomi") ||
               manufacturer.contains("oppo") ||
               manufacturer.contains("vivo") ||
               manufacturer.contains("samsung") ||
               manufacturer.contains("huawei")
    }
}
