package com.sakeenah.app.util

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import androidx.core.content.FileProvider
import com.getcapacitor.plugin.Filesystem
import java.io.File

/**
 * MuezzinHelper — manages muezzin audio file paths and selection.
 *
 * This helper:
 * 1. Stores the selected muezzin ID in SharedPreferences
 * 2. Constructs file URIs for downloaded muezzin audio
 * 3. Checks if a muezzin file exists locally
 * 4. Provides the correct URI for playback
 *
 * File structure:
 * - Downloads: {context.dataDir}/muezzins/{fileName}
 * - Cache: Same location (no separate cache)
 */
object MuezzinHelper {

    private const val PREFS_NAME = "muezzin_prefs"
    private const val KEY_SELECTED_MUEZZIN_ID = "selected_muezzin_id"
    private const val KEY_MUEZZIN_FILE_NAME = "muezzin_file_name"
    private const val MUEZZINS_DIR = "muezzins"

    /**
     * Save the selected muezzin ID and file name.
     * Called from React when user selects a muezzin.
     */
    fun saveSelectedMuezzin(context: Context, muezzinId: String, fileName: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_SELECTED_MUEZZIN_ID, muezzinId)
            .putString(KEY_MUEZZIN_FILE_NAME, fileName)
            .apply()
    }

    /**
     * Get the selected muezzin ID.
     * Returns null if no muezzin is selected.
     */
    fun getSelectedMuezzinId(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SELECTED_MUEZZIN_ID, null)
    }

    /**
     * Get the selected muezzin file name.
     * Returns null if no muezzin is selected.
     */
    fun getSelectedMuezzinFileName(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_MUEZZIN_FILE_NAME, null)
    }

    /**
     * Get the URI for the selected muezzin audio file.
     * Returns null if no muezzin is selected or file doesn't exist.
     */
    fun getSelectedMuezzinUri(context: Context): Uri? {
        val fileName = getSelectedMuezzinFileName(context) ?: return null
        val file = getMuezzinFile(context, fileName)
        return if (file.exists()) {
            FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        } else {
            null
        }
    }

    /**
     * Check if a muezzin file exists locally.
     */
    fun isMuezzinDownloaded(context: Context, fileName: String): Boolean {
        val file = getMuezzinFile(context, fileName)
        return file.exists()
    }

    /**
     * Get the File object for a muezzin audio file.
     */
    fun getMuezzinFile(context: Context, fileName: String): File {
        val muezzinsDir = File(context.dataDir, MUEZZINS_DIR)
        if (!muezzinsDir.exists()) {
            muezzinsDir.mkdirs()
        }
        return File(muezzinsDir, fileName)
    }

    /**
     * Delete a muezzin audio file.
     */
    fun deleteMuezzinFile(context: Context, fileName: String): Boolean {
        val file = getMuezzinFile(context, fileName)
        return if (file.exists()) {
            file.delete()
        } else {
            false
        }
    }

    /**
     * Clear the selected muezzin (reset to default).
     */
    fun clearSelectedMuezzin(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .remove(KEY_SELECTED_MUEZZIN_ID)
            .remove(KEY_MUEZZIN_FILE_NAME)
            .apply()
    }
}
