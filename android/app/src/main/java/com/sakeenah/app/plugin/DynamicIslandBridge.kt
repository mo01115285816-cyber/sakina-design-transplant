package com.sakeenah.app.plugin

object DynamicIslandBridge {
    var onPlayPause: (() -> Unit)? = null
    var onNext: (() -> Unit)? = null
    var onPrev: (() -> Unit)? = null
    var onSeek: ((Long) -> Unit)? = null
    var plugin: DynamicIslandPlugin? = null

    fun sendEventToReact(eventName: String, data: Any?) {
        plugin?.notifyReact(eventName, data)
    }
}
