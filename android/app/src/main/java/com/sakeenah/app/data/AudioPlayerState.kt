package com.sakeenah.app.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class PlayerState(
    val isPlaying: Boolean = false,
    val surahTitle: String = "",
    val reciterName: String = "",
    val currentPositionMs: Long = 0L,
    val durationMs: Long = 0L,
    val isExpanded: Boolean = false,
    val isOverlayGranted: Boolean = false,
    val isNotificationGranted: Boolean = false,
    val isServiceRunning: Boolean = false,
    val contentType: String = "quran",
    val artworkUrl: String = ""
)

object AudioStateHolder {
    private val _state = MutableStateFlow(PlayerState())
    val state: StateFlow<PlayerState> = _state.asStateFlow()

    fun updatePlaying(isPlaying: Boolean) {
        _state.value = _state.value.copy(isPlaying = isPlaying)
    }

    fun updatePosition(posMs: Long, durationMs: Long) {
        _state.value = _state.value.copy(currentPositionMs = posMs, durationMs = durationMs)
    }

    fun updateMediaInfo(title: String, reciter: String, contentType: String, artworkUrl: String) {
        _state.value = _state.value.copy(
            surahTitle = title,
            reciterName = reciter,
            contentType = contentType,
            artworkUrl = artworkUrl
        )
    }

    fun toggleExpanded() {
        _state.value = _state.value.copy(isExpanded = !_state.value.isExpanded)
    }

    fun setExpanded(expanded: Boolean) {
        _state.value = _state.value.copy(isExpanded = expanded)
    }

    fun updatePermissions(overlayGranted: Boolean, notificationGranted: Boolean) {
        _state.value = _state.value.copy(
            isOverlayGranted = overlayGranted,
            isNotificationGranted = notificationGranted
        )
    }

    fun setServiceRunning(running: Boolean) {
        _state.value = _state.value.copy(isServiceRunning = running)
    }

    fun resetState() {
        _state.value = PlayerState(
            isOverlayGranted = _state.value.isOverlayGranted,
            isNotificationGranted = _state.value.isNotificationGranted,
            isServiceRunning = _state.value.isServiceRunning
        )
    }
}
