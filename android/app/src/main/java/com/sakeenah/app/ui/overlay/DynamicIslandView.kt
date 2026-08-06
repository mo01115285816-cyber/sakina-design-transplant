package com.sakeenah.app.ui.overlay

import androidx.compose.animation.Crossfade
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.FiniteAnimationSpec
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cast
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.sp
import com.sakeenah.app.R
import com.sakeenah.app.data.AudioStateHolder
import com.sakeenah.app.ui.components.EqualizerVisualizer

@Composable
fun DynamicIslandView(
    onPlayPauseClick: () -> Unit,
    onNextClick: () -> Unit,
    onPrevClick: () -> Unit,
    onSeek: (Long) -> Unit,
    modifier: Modifier = Modifier
) {
    val state by AudioStateHolder.state.collectAsState()
    val statusBarPadding = WindowInsets.statusBars.asPaddingValues()
    val statusBarHeightDp = statusBarPadding.calculateTopPadding()
    val hardwareStatusBarHeight = if (statusBarHeightDp > 0.dp) statusBarHeightDp.coerceIn(24.dp, 32.dp) else 28.dp

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        Box(
            modifier = modifier.fillMaxWidth().wrapContentHeight().padding(top = 10.dp),
            contentAlignment = Alignment.TopCenter
        ) {
            val springSpec: FiniteAnimationSpec<IntSize> = remember(state.isExpanded) {
                if (state.isExpanded) spring(stiffness = Spring.StiffnessMediumLow, dampingRatio = Spring.DampingRatioNoBouncy)
                else spring(stiffness = Spring.StiffnessHigh, dampingRatio = Spring.DampingRatioNoBouncy)
            }
            Box(
                modifier = Modifier.align(Alignment.TopCenter).animateContentSize(animationSpec = springSpec)
                    .then(if (state.isExpanded) Modifier.fillMaxWidth(0.88f).widthIn(max = 350.dp).wrapContentHeight()
                          else Modifier.width(130.dp).height(hardwareStatusBarHeight))
                    .clip(if (state.isExpanded) RoundedCornerShape(38.dp) else RoundedCornerShape(50))
                    .background(Color(0xFF000000))
                    .border(0.5.dp, Color(0xFF1D1D1F).copy(alpha = 0.40f),
                        if (state.isExpanded) RoundedCornerShape(38.dp) else RoundedCornerShape(50))
                    .pointerInput(state.isExpanded) {
                        awaitPointerEventScope {
                            while (true) {
                                val event = awaitPointerEvent()
                                if (event.type == PointerEventType.Press && !state.isExpanded) AudioStateHolder.toggleExpanded()
                            }
                        }
                    }
                    .testTag("dynamic_island_container")
            ) {
                Crossfade(targetState = state.isExpanded,
                    animationSpec = spring(stiffness = if (state.isExpanded) Spring.StiffnessMediumLow else Spring.StiffnessHigh,
                        dampingRatio = Spring.DampingRatioNoBouncy), label = "notch_transition") { expanded ->
                    if (!expanded) CompactDynamicIsland(isPlaying = state.isPlaying, statusBarHeight = hardwareStatusBarHeight)
                    else ExpandedDynamicIsland(isPlaying = state.isPlaying, surahTitle = state.surahTitle, reciterName = state.reciterName,
                        currentPosMs = state.currentPositionMs, durationMs = state.durationMs,
                        onPlayPauseClick = onPlayPauseClick, onNextClick = onNextClick, onPrevClick = onPrevClick, onSeek = onSeek)
                }
            }
        }
    }
}

@Composable
private fun CompactDynamicIsland(isPlaying: Boolean, statusBarHeight: androidx.compose.ui.unit.Dp, modifier: Modifier = Modifier) {
    Row(modifier = modifier.fillMaxWidth().height(statusBarHeight).padding(horizontal = 8.dp).testTag("compact_dynamic_island"),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
        Image(painter = painterResource(id = R.drawable.img_quran_album_art), contentDescription = "Quran Artwork",
            modifier = Modifier.size(18.dp).clip(RoundedCornerShape(4.dp)), contentScale = ContentScale.Crop)
        EqualizerVisualizer(isPlaying = isPlaying, barCount = 4, barWidth = 2.dp, barGap = 1.5.dp, maxHeight = 12.dp, barColor = Color(0xFFFFC107))
    }
}

@Composable
private fun ExpandedDynamicIsland(isPlaying: Boolean, surahTitle: String, reciterName: String, currentPosMs: Long, durationMs: Long,
    onPlayPauseClick: () -> Unit, onNextClick: () -> Unit, onPrevClick: () -> Unit, onSeek: (Long) -> Unit, modifier: Modifier = Modifier) {
    var isDragging by remember { mutableStateOf(false) }
    var dragRatio by remember { mutableFloatStateOf(0f) }
    val actualRatio = if (durationMs > 0) (currentPosMs.toFloat() / durationMs.toFloat()).coerceIn(0f, 1f) else 0f
    val displayRatio = if (isDragging) dragRatio else actualRatio
    val displayPosMs = (displayRatio * durationMs).toLong()

    Column(modifier = modifier.fillMaxWidth().wrapContentHeight().padding(horizontal = 20.dp, vertical = 14.dp).testTag("expanded_dynamic_island")) {
        Row(modifier = Modifier.fillMaxWidth().pointerInput(Unit) {
            awaitPointerEventScope { while (true) { val event = awaitPointerEvent(); if (event.type == PointerEventType.Press) AudioStateHolder.toggleExpanded() } }
        }, verticalAlignment = Alignment.CenterVertically) {
            Image(painter = painterResource(id = R.drawable.img_quran_album_art), contentDescription = "Artwork",
                modifier = Modifier.size(56.dp).clip(RoundedCornerShape(14.dp)), contentScale = ContentScale.Crop)
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = surahTitle, color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Spacer(modifier = Modifier.height(3.dp))
                Text(text = reciterName, color = Color(0xFF98989D), fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Spacer(modifier = Modifier.width(8.dp))
            EqualizerVisualizer(isPlaying = isPlaying, barCount = 4, barWidth = 2.5.dp, barGap = 2.dp, maxHeight = 20.dp, barColor = Color(0xFFFFC107))
        }
        Spacer(modifier = Modifier.height(10.dp))
        AppleContinuousProgressBar(progress = displayRatio,
            onSeekChange = { newRatio -> isDragging = true; dragRatio = newRatio },
            onSeekFinished = { finalRatio -> isDragging = false; onSeek((finalRatio * durationMs).toLong()) })
        Spacer(modifier = Modifier.height(4.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = formatTime(displayPosMs), color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Text(text = formatRemainingTime(displayPosMs, durationMs), color = Color(0xFF98989D), fontSize = 12.sp, fontWeight = FontWeight.Medium)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Spacer(modifier = Modifier.width(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(28.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onPrevClick, modifier = Modifier.size(40.dp).testTag("btn_previous")) {
                    Icon(imageVector = Icons.Filled.SkipPrevious, contentDescription = "Previous", tint = Color.White, modifier = Modifier.size(28.dp))
                }
                IconButton(onClick = onPlayPauseClick, modifier = Modifier.size(48.dp).testTag("btn_play_pause")) {
                    Icon(imageVector = if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        contentDescription = if (isPlaying) "Pause" else "Play", tint = Color.White, modifier = Modifier.size(36.dp))
                }
                IconButton(onClick = onNextClick, modifier = Modifier.size(40.dp).testTag("btn_next")) {
                    Icon(imageVector = Icons.Filled.SkipNext, contentDescription = "Next", tint = Color.White, modifier = Modifier.size(28.dp))
                }
            }
            IconButton(onClick = { }, modifier = Modifier.size(36.dp).testTag("btn_airplay")) {
                Icon(imageVector = Icons.Filled.Cast, contentDescription = "Audio Output", tint = Color(0xFFB0BEC5), modifier = Modifier.size(22.dp))
            }
        }
    }
}

@Composable
private fun AppleContinuousProgressBar(progress: Float, onSeekChange: (Float) -> Unit, onSeekFinished: (Float) -> Unit, modifier: Modifier = Modifier) {
    var isScrubbing by remember { mutableStateOf(false) }
    val sliderHeight by androidx.compose.animation.core.animateDpAsState(targetValue = if (isScrubbing) 8.dp else 4.dp,
        animationSpec = if (isScrubbing) androidx.compose.animation.core.spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessMedium)
        else androidx.compose.animation.core.snap(), label = "slider_thickness")
    Box(modifier = modifier.fillMaxWidth().height(24.dp)
        .pointerInput(Unit) {
            detectHorizontalDragGestures(onDragStart = { offset ->
                isScrubbing = true; onSeekChange((offset.x / size.width.toFloat()).coerceIn(0f, 1f))
            }, onHorizontalDrag = { change, _ ->
                isScrubbing = true; onSeekChange((change.position.x / size.width.toFloat()).coerceIn(0f, 1f))
            }, onDragEnd = { isScrubbing = false; onSeekFinished(progress) }, onDragCancel = { isScrubbing = false })
        }
        .pointerInput(Unit) {
            detectTapGestures(onPress = { offset ->
                isScrubbing = true; onSeekChange((offset.x / size.width.toFloat()).coerceIn(0f, 1f)); tryAwaitRelease(); isScrubbing = false; onSeekFinished((offset.x / size.width.toFloat()).coerceIn(0f, 1f))
            })
        }, contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxWidth().height(sliderHeight).clip(CircleShape)) {
            val trackWidth = size.width; val trackHeight = size.height; val cornerRadius = CornerRadius(trackHeight / 2f, trackHeight / 2f)
            drawRoundRect(color = Color(0xFF38383A), size = Size(trackWidth, trackHeight), cornerRadius = cornerRadius)
            val activeWidth = (trackWidth * progress).coerceAtLeast(0f)
            if (activeWidth > 0) drawRoundRect(color = Color.White, size = Size(activeWidth, trackHeight), cornerRadius = cornerRadius)
        }
    }
}

private fun formatTime(ms: Long): String { val totalSec = ms / 1000; val min = totalSec / 60; val sec = totalSec % 60; return String.format("%d:%02d", min, sec) }
private fun formatRemainingTime(currentMs: Long, totalMs: Long): String { val remMs = (totalMs - currentMs).coerceAtLeast(0); val totalSec = remMs / 1000; val min = totalSec / 60; val sec = totalSec % 60; return String.format("-%d:%02d", min, sec) }
