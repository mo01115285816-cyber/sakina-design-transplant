package com.sakeenah.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.core.app.NotificationCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeViewModelStoreOwner
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.sakeenah.app.R
import com.sakeenah.app.data.AudioStateHolder
import com.sakeenah.app.plugin.DynamicIslandBridge
import com.sakeenah.app.ui.overlay.DynamicIslandView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

class AudioOverlayService : Service(), LifecycleOwner, ViewModelStoreOwner, SavedStateRegistryOwner {

    private val lifecycleRegistry = LifecycleRegistry(this)
    private val viewModelStoreInstance = ViewModelStore()
    private val savedStateRegistryController = SavedStateRegistryController.create(this)

    override val lifecycle: Lifecycle get() = lifecycleRegistry
    override val viewModelStore: ViewModelStore get() = viewModelStoreInstance
    override val savedStateRegistry: SavedStateRegistry get() = savedStateRegistryController.savedStateRegistry

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.Main + serviceJob)

    companion object {
        const val CHANNEL_ID = "dynamic_island_channel"
        const val NOTIFICATION_ID = 2001
        const val ACTION_START = "com.sakeenah.app.action.START_OVERLAY"
        const val ACTION_STOP = "com.sakeenah.app.action.STOP_OVERLAY"

        fun startService(context: Context) {
            val intent = Intent(context, AudioOverlayService::class.java).apply { action = ACTION_START }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
            else context.startService(intent)
        }

        fun stopService(context: Context) {
            val intent = Intent(context, AudioOverlayService::class.java).apply { action = ACTION_STOP }
            context.stopService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        savedStateRegistryController.performRestore(null)
        super.onCreate()
        lifecycleRegistry.currentState = Lifecycle.State.CREATED
        lifecycleRegistry.currentState = Lifecycle.State.STARTED
        createMinimalChannel()
        AudioStateHolder.setServiceRunning(true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, buildMinimalNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIFICATION_ID, buildMinimalNotification())
        }

        observeState()
        DynamicIslandBridge.onPlayPause = { DynamicIslandBridge.sendEventToReact("playPause", null) }
        DynamicIslandBridge.onNext = { DynamicIslandBridge.sendEventToReact("next", null) }
        DynamicIslandBridge.onPrev = { DynamicIslandBridge.sendEventToReact("prev", null) }
        DynamicIslandBridge.onSeek = { pos -> DynamicIslandBridge.sendEventToReact("seek", pos) }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> { stopOverlayAndSelf(); return START_NOT_STICKY }
            ACTION_START -> checkAndApplyOverlayPermission()
        }
        return START_STICKY
    }

    private fun observeState() {
        serviceScope.launch {
            AudioStateHolder.state.collect { state ->
                checkAndApplyOverlayPermission()
                updateOverlayWindowFlags(state.isExpanded)
            }
        }
    }

    private var lastExpandedState: Boolean? = null

    private fun updateOverlayWindowFlags(isExpanded: Boolean) {
        if (lastExpandedState == isExpanded) return
        lastExpandedState = isExpanded
        val view = overlayView ?: return
        val wm = windowManager ?: return
        val lp = view.layoutParams as? WindowManager.LayoutParams ?: return
        lp.flags = WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        lp.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
        lp.x = 0
        if (isExpanded) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) view.windowInsetsController?.hide(android.view.WindowInsets.Type.statusBars())
            else @Suppress("DEPRECATION") view.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_FULLSCREEN
        } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) view.windowInsetsController?.show(android.view.WindowInsets.Type.statusBars())
            else @Suppress("DEPRECATION") view.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        }
        try { wm.updateViewLayout(view, lp) } catch (e: Exception) { e.printStackTrace() }
    }

    private fun checkAndApplyOverlayPermission() {
        val canDraw = try { if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Settings.canDrawOverlays(this) else true } catch (e: Exception) { false }
        AudioStateHolder.updatePermissions(overlayGranted = canDraw, notificationGranted = AudioStateHolder.state.value.isNotificationGranted)
        if (canDraw) showOverlayWindow() else removeOverlayWindow()
    }

    private fun showOverlayWindow() {
        if (overlayView != null) return
        try {
            windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val composeView = ComposeView(this).apply {
                setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
                setViewTreeLifecycleOwner(this@AudioOverlayService)
                setViewTreeViewModelStoreOwner(this@AudioOverlayService)
                setViewTreeSavedStateRegistryOwner(this@AudioOverlayService)
                setContent {
                    DynamicIslandView(
                        onPlayPauseClick = { DynamicIslandBridge.onPlayPause?.invoke() },
                        onNextClick = { DynamicIslandBridge.onNext?.invoke() },
                        onPrevClick = { DynamicIslandBridge.onPrev?.invoke() },
                        onSeek = { pos -> DynamicIslandBridge.onSeek?.invoke(pos) }
                    )
                }
            }
            @Suppress("DEPRECATION")
            val layoutType = 2017
            val layoutParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT, layoutType,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL; x = 0; y = 0
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
            try { windowManager?.addView(composeView, layoutParams) }
            catch (e: Exception) {
                val fallbackType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE
                layoutParams.type = fallbackType
                windowManager?.addView(composeView, layoutParams)
            }
            overlayView = composeView
        } catch (e: Exception) { e.printStackTrace() }
    }

    private fun removeOverlayWindow() {
        overlayView?.let {
            try { windowManager?.removeView(it) } catch (e: Exception) { e.printStackTrace() }
            overlayView = null
        }
    }

    private fun createMinimalChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "خدمة سكينة", NotificationManager.IMPORTANCE_MIN).apply {
                description = "واجهة النوتش العائمة"; setShowBadge(false); setSound(null, null); enableVibration(false); enableLights(false)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildMinimalNotification(): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true).setSilent(true)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET).build()

    private fun stopOverlayAndSelf() {
        removeOverlayWindow()
        AudioStateHolder.resetState()
        AudioStateHolder.setServiceRunning(false)
        stopSelf()
    }

    override fun onDestroy() {
        lifecycleRegistry.currentState = Lifecycle.State.DESTROYED
        removeOverlayWindow()
        serviceJob.cancel()
        viewModelStoreInstance.clear()
        AudioStateHolder.setServiceRunning(false)
        super.onDestroy()
    }
}
