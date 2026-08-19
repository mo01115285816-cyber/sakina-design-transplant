package com.sakeenah.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.IBinder
import android.os.Looper
import android.os.ResultReceiver
import android.provider.MediaStore
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import android.content.pm.ServiceInfo
import com.sakeenah.app.MainActivity
import java.io.File
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread
import kotlin.math.min

/**
 * Records the original radio stream bytes on Android without using the microphone.
 * The service owns only the capture connection; the existing HTML audio player keeps
 * its own connection so starting capture cannot pause or replace playback.
 */
class RadioCaptureService : Service() {

    private data class RecordingOutput(
        var uri: Uri?,
        var file: File?,
        val tempFile: File,
        val displayName: String,
        val mimeType: String,
        val output: OutputStream,
    )

    private val stopRequested = AtomicBoolean(false)
    @Volatile private var recordingInput: InputStream? = null
    @Volatile private var recordingOutput: RecordingOutput? = null
    @Volatile private var worker: Thread? = null
    @Volatile private var pendingStartReceiver: ResultReceiver? = null
    @Volatile private var pendingStopReceiver: ResultReceiver? = null
    @Volatile private var activeStationId: String? = null
    @Volatile private var activeStationName: String? = null
    @Volatile private var activeStartedAt: Long = 0L

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val startReceiver = getResultReceiver(intent)
                if (worker?.isAlive == true) {
                    sendResult(startReceiver, success = false, error = "يوجد تسجيل نشط بالفعل.")
                    return START_NOT_STICKY
                }
                val streamUrl = intent.getStringExtra(EXTRA_STREAM_URL).orEmpty()
                val stationId = intent.getStringExtra(EXTRA_STATION_ID).orEmpty()
                val stationName = intent.getStringExtra(EXTRA_STATION_NAME).orEmpty()
                pendingStartReceiver = startReceiver
                if (streamUrl.isBlank() || stationId.isBlank() || stationName.isBlank()) {
                    stopSelf()
                    return START_NOT_STICKY
                }
                startCapture(streamUrl, stationId, stationName)
            }
            ACTION_STOP -> {
                pendingStopReceiver = getResultReceiver(intent)
                requestStop()
            }
        }
        return START_NOT_STICKY
    }

    private fun startCapture(streamUrl: String, stationId: String, stationName: String) {
        activeStationId = stationId
        activeStationName = stationName
        activeStartedAt = System.currentTimeMillis()
        stopRequested.set(false)

        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildNotification(stationName),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC,
        )

        worker = thread(name = "SakinaRadioCapture") {
            captureStream(streamUrl, stationId, stationName)
        }
    }

    private fun captureStream(streamUrl: String, stationId: String, stationName: String) {
        var connection: HttpURLConnection? = null
        var output: RecordingOutput? = null
        var bytesWritten = 0L
        var success = false
        var errorMessage: String? = null

        try {
            connection = (URL(streamUrl).openConnection() as HttpURLConnection).apply {
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                instanceFollowRedirects = true
                useCaches = false
                setRequestProperty("Accept", "audio/mpeg,audio/aac,audio/*;q=0.9,*/*;q=0.1")
                setRequestProperty("Cache-Control", "no-cache")
                setRequestProperty("Icy-MetaData", "1")
                connect()
            }

            val responseCode = connection.responseCode
            if (responseCode !in 200..299) {
                throw IllegalStateException("تعذر الوصول إلى مصدر البث (HTTP $responseCode)")
            }

            val contentType = connection.contentType?.lowercase(Locale.US).orEmpty()
            val mimeType = when {
                contentType.contains("aac") -> "audio/aac"
                else -> "audio/mpeg"
            }
            val extension = if (mimeType == "audio/aac") "aac" else "mp3"
            val displayName = buildFileName(stationName, extension)
            output = openOutput(displayName, mimeType)
            recordingOutput = output
            sendResult(
                receiver = pendingStartReceiver,
                success = true,
                stationId = stationId,
                stationName = stationName,
                fileName = output.displayName,
                mimeType = output.mimeType,
            )
            pendingStartReceiver = null

            val metaInt = connection.headerFields.entries
                .firstOrNull { it.key?.equals("icy-metaint", ignoreCase = true) == true }
                ?.value?.firstOrNull()?.toIntOrNull()
                ?: connection.getHeaderField("icy-metaint")?.toIntOrNull()
                ?: 0

            val source = connection.inputStream
            recordingInput = source
            val audioInput: InputStream = if (metaInt > 0) IcyAudioInputStream(source, metaInt) else source
            val buffer = ByteArray(BUFFER_SIZE)

            while (!stopRequested.get()) {
                val count = audioInput.read(buffer)
                if (count < 0) break
                if (count == 0) continue
                output.output.write(buffer, 0, count)
                bytesWritten += count
                if (bytesWritten % FLUSH_INTERVAL_BYTES < count) output.output.flush()
            }
            output.output.flush()
            success = stopRequested.get() && bytesWritten >= MINIMUM_VALID_BYTES
            if (!success && !stopRequested.get()) {
                errorMessage = "انقطع مصدر البث قبل حفظ تسجيل صالح."
            }
        } catch (error: Exception) {
            if (stopRequested.get() && bytesWritten >= MINIMUM_VALID_BYTES) {
                success = true
            } else {
                errorMessage = error.message ?: "تعذر تسجيل البث."
            }
        } finally {
            recordingInput = null
            try { output?.output?.close() } catch (_: Exception) { }
            recordingOutput = null
            try { connection?.disconnect() } catch (_: Exception) { }

            if (!success && pendingStartReceiver != null) {
                sendResult(
                    receiver = pendingStartReceiver,
                    success = false,
                    stationId = stationId,
                    stationName = stationName,
                    error = errorMessage ?: "تعذر الاتصال بمصدر البث.",
                )
                pendingStartReceiver = null
            }

            if (success && output != null) {
                try {
                    finalizeOutput(output)
                    sendResult(
                        receiver = pendingStopReceiver,
                        success = true,
                        stationId = stationId,
                        stationName = stationName,
                        fileName = output.displayName,
                        mimeType = output.mimeType,
                        uri = output.uri,
                        file = output.file,
                        durationMs = System.currentTimeMillis() - activeStartedAt,
                        reason = "manual",
                        bytes = bytesWritten,
                    )
                } catch (error: Exception) {
                    discardOutput(output)
                    sendResult(
                        receiver = pendingStopReceiver,
                        success = false,
                        stationId = stationId,
                        stationName = stationName,
                        error = error.message ?: "تعذر تثبيت ملف التسجيل.",
                    )
                }
            } else {
                discardOutput(output)
                sendResult(
                    receiver = pendingStopReceiver,
                    success = false,
                    stationId = stationId,
                    stationName = stationName,
                    error = errorMessage ?: "لم يتم تسجيل مدة كافية للحفظ.",
                )
            }

            pendingStartReceiver = null
            pendingStopReceiver = null
            activeStationId = null
            activeStationName = null
            activeStartedAt = 0L
            stopSelf()
        }
    }

    private fun requestStop() {
        if (worker?.isAlive != true) {
            sendResult(pendingStopReceiver, false, error = "لا يوجد تسجيل نشط.")
            pendingStopReceiver = null
            stopSelf()
            return
        }
        stopRequested.set(true)
        try { recordingInput?.close() } catch (_: Exception) { }
        try { recordingOutput?.output?.flush() } catch (_: Exception) { }
        worker?.interrupt()
    }

    private fun openOutput(displayName: String, mimeType: String): RecordingOutput {
        val directory = File(filesDir, "radio-captures")
        if (!directory.exists() && !directory.mkdirs()) {
            throw IllegalStateException("تعذر إنشاء مساحة مؤقتة آمنة للتسجيل")
        }
        val tempFile = File.createTempFile("capture-", ".part", directory)
        val stream = BufferedOutputStream(
            FileOutputStream(tempFile),
            COPY_BUFFER_SIZE,
        )
        return RecordingOutput(
            uri = null,
            file = tempFile,
            tempFile = tempFile,
            displayName = displayName,
            mimeType = mimeType,
            output = stream,
        )
    }

    private fun finalizeOutput(output: RecordingOutput) {
        val tempFile = output.tempFile
        if (!tempFile.exists() || tempFile.length() < MINIMUM_VALID_BYTES) {
            throw IllegalStateException("ملف التسجيل المؤقت غير صالح أو فارغ")
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val values = ContentValues().apply {
                put(MediaStore.Audio.Media.DISPLAY_NAME, output.displayName)
                put(MediaStore.Audio.Media.MIME_TYPE, output.mimeType)
                put(MediaStore.Audio.Media.RELATIVE_PATH, Environment.DIRECTORY_MUSIC + "/Sakina")
                put(MediaStore.Audio.Media.IS_PENDING, 1)
            }
            val uri = contentResolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values)
                ?: throw IllegalStateException("تعذر إنشاء ملف التسجيل في Music/Sakina")
            try {
                copyFileToUri(tempFile, uri)
                contentResolver.update(
                    uri,
                    ContentValues().apply { put(MediaStore.Audio.Media.IS_PENDING, 0) },
                    null,
                    null,
                )
                output.uri = uri
                output.file = null
            } catch (error: Exception) {
                contentResolver.delete(uri, null, null)
                throw error
            } finally {
                tempFile.delete()
            }
        } else {
            val directory = File(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC),
                "Sakina",
            )
            if (!directory.exists() && !directory.mkdirs()) {
                throw IllegalStateException("تعذر إنشاء مجلد Music/Sakina")
            }
            val finalFile = File(directory, output.displayName)
            val destinationPart = File(directory, "${output.displayName}.part")
            try {
                copyFile(tempFile, destinationPart)
                if (!destinationPart.renameTo(finalFile)) {
                    throw IllegalStateException("تعذر تثبيت ملف التسجيل في Music/Sakina")
                }
                output.file = finalFile
                MediaScannerConnection.scanFile(this, arrayOf(finalFile.absolutePath), arrayOf(output.mimeType), null)
            } finally {
                destinationPart.delete()
                tempFile.delete()
            }
        }
    }

    private fun copyFileToUri(source: File, uri: Uri) {
        val descriptor = contentResolver.openFileDescriptor(uri, "w")
            ?: throw IllegalStateException("تعذر فتح ملف Music/Sakina للنسخ")
        try {
            BufferedInputStream(FileInputStream(source), COPY_BUFFER_SIZE).use { input ->
                FileOutputStream(descriptor.fileDescriptor).use { rawOutput ->
                    BufferedOutputStream(rawOutput, COPY_BUFFER_SIZE).use { output ->
                        input.copyTo(output, COPY_BUFFER_SIZE)
                        output.flush()
                    }
                    rawOutput.fd.sync()
                }
            }
        } finally {
            descriptor.close()
        }
    }

    private fun copyFile(source: File, target: File) {
        BufferedInputStream(FileInputStream(source), COPY_BUFFER_SIZE).use { input ->
            FileOutputStream(target).use { rawOutput ->
                BufferedOutputStream(rawOutput, COPY_BUFFER_SIZE).use { output ->
                    input.copyTo(output, COPY_BUFFER_SIZE)
                    output.flush()
                    rawOutput.fd.sync()
                }
            }
        }
    }

    private fun discardOutput(output: RecordingOutput?) {
        val uri = output?.uri
        if (uri != null) contentResolver.delete(uri, null, null)
        output?.file?.delete()
        output?.tempFile?.delete()
    }

    private fun sendResult(
        receiver: ResultReceiver?,
        success: Boolean,
        stationId: String? = null,
        stationName: String? = null,
        fileName: String? = null,
        mimeType: String? = null,
        uri: Uri? = null,
        file: File? = null,
        durationMs: Long? = null,
        reason: String? = null,
        bytes: Long? = null,
        error: String? = null,
    ) {
        val bundle = Bundle().apply {
            putBoolean("success", success)
            stationId?.let { putString("stationId", it) }
            stationName?.let { putString("stationName", it) }
            fileName?.let { putString("fileName", it) }
            mimeType?.let { putString("mimeType", it) }
            uri?.let { putString("uri", it.toString()) }
            file?.let { putString("localPath", it.absolutePath) }
            durationMs?.let { putLong("durationMs", it) }
            reason?.let { putString("reason", it) }
            bytes?.let { putLong("bytes", it) }
            error?.let { putString("message", it) }
        }
        receiver?.send(if (success) RESULT_OK else RESULT_ERROR, bundle)
    }

    private fun buildFileName(stationName: String, extension: String): String {
        val safeName = stationName
            .replace(Regex("[\\\\/:*?\"<>|]"), "-")
            .replace(Regex("\\s+"), " ")
            .trim()
        val timestamp = SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(Date())
        return "Sakina - $safeName - $timestamp.$extension"
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                "تسجيل البث في سكينة",
                NotificationManager.IMPORTANCE_LOW,
            ).apply { description = "يظهر أثناء حفظ تلاوة من البث المباشر" },
        )
    }

    private fun buildNotification(stationName: String): Notification {
        val openIntent = PendingIntent.getActivity(
            this,
            7101,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("تسجيل البث مستمر")
            .setContentText("يتم حفظ تلاوة $stationName في مجلد Music/Sakina")
            .setContentIntent(openIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .build()
    }

    @Suppress("DEPRECATION")
    private fun getResultReceiver(intent: Intent): ResultReceiver? {
        return if (Build.VERSION.SDK_INT >= 33) {
            intent.getParcelableExtra(EXTRA_RECEIVER, ResultReceiver::class.java)
        } else {
            intent.getParcelableExtra(EXTRA_RECEIVER)
        }
    }

    override fun onDestroy() {
        stopRequested.set(true)
        try { recordingInput?.close() } catch (_: Exception) { }
        worker?.interrupt()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private class IcyAudioInputStream(
        private val upstream: InputStream,
        private val metadataInterval: Int,
    ) : InputStream() {
        private var audioRemaining = metadataInterval

        override fun read(): Int {
            val buffer = ByteArray(1)
            val count = read(buffer, 0, 1)
            return if (count < 0) -1 else buffer[0].toInt() and 0xFF
        }

        override fun read(buffer: ByteArray, offset: Int, length: Int): Int {
            if (audioRemaining == 0) {
                val metadataLengthUnits = upstream.read()
                if (metadataLengthUnits < 0) return -1
                val metadataBytes = metadataLengthUnits * 16
                var remaining = metadataBytes
                while (remaining > 0) {
                    val skipped = upstream.skip(remaining.toLong()).toInt()
                    if (skipped <= 0) {
                        if (upstream.read() < 0) return -1
                        remaining--
                    } else {
                        remaining -= skipped
                    }
                }
                audioRemaining = metadataInterval
            }

            val requested = min(length, audioRemaining)
            val count = upstream.read(buffer, offset, requested)
            if (count > 0) audioRemaining -= count
            return count
        }

        override fun close() = upstream.close()
    }

    companion object {
        const val ACTION_START = "com.sakeenah.app.action.RADIO_CAPTURE_START"
        const val ACTION_STOP = "com.sakeenah.app.action.RADIO_CAPTURE_STOP"
        const val EXTRA_STREAM_URL = "streamUrl"
        const val EXTRA_STATION_ID = "stationId"
        const val EXTRA_STATION_NAME = "stationName"
        const val EXTRA_RECEIVER = "receiver"
        const val RESULT_OK = 1
        const val RESULT_ERROR = 0
        private const val TAG = "RadioCaptureService"
        private const val CHANNEL_ID = "radio_capture_channel"
        private const val NOTIFICATION_ID = 7101
        private const val CONNECT_TIMEOUT_MS = 15_000
        private const val READ_TIMEOUT_MS = 20_000
        private const val BUFFER_SIZE = 16 * 1024
        private const val FLUSH_INTERVAL_BYTES = 1024 * 1024
        private const val COPY_BUFFER_SIZE = 256 * 1024
        private const val MINIMUM_VALID_BYTES = 8 * 1024

        fun start(context: Context, streamUrl: String, stationId: String, stationName: String, receiver: ResultReceiver) {
            val intent = Intent(context, RadioCaptureService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_STREAM_URL, streamUrl)
                putExtra(EXTRA_STATION_ID, stationId)
                putExtra(EXTRA_STATION_NAME, stationName)
                putExtra(EXTRA_RECEIVER, receiver)
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context, receiver: ResultReceiver) {
            val intent = Intent(context, RadioCaptureService::class.java).apply {
                action = ACTION_STOP
                putExtra(EXTRA_RECEIVER, receiver)
            }
            context.startService(intent)
        }
    }
}
