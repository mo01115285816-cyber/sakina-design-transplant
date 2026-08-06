package com.sakeenah.app.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun EqualizerVisualizer(
    isPlaying: Boolean,
    modifier: Modifier = Modifier,
    barCount: Int = 4,
    barWidth: Dp = 2.5.dp,
    barGap: Dp = 2.dp,
    maxHeight: Dp = 15.dp,
    barColor: Color = Color(0xFFFFC107)
) {
    val transition = rememberInfiniteTransition(label = "equalizer_transition")
    
    val durations = listOf(320, 480, 260, 410)
    val initialValues = listOf(0.25f, 0.70f, 0.35f, 0.85f)
    val targetValues = listOf(0.95f, 0.20f, 0.90f, 0.30f)

    val heightFactors = List(barCount) { index ->
        if (isPlaying) {
            val dur = durations.getOrElse(index % durations.size) { 350 }
            val initVal = initialValues.getOrElse(index % initialValues.size) { 0.3f }
            val targVal = targetValues.getOrElse(index % targetValues.size) { 0.9f }

            val animateFactor by transition.animateFloat(
                initialValue = initVal,
                targetValue = targVal,
                animationSpec = infiniteRepeatable(
                    animation = tween(durationMillis = dur, easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "bar_$index"
            )
            animateFactor
        } else {
            0.25f
        }
    }

    Row(
        modifier = modifier
            .height(maxHeight)
            .testTag("equalizer_visualizer"),
        horizontalArrangement = Arrangement.spacedBy(barGap),
        verticalAlignment = Alignment.CenterVertically
    ) {
        heightFactors.forEach { factor ->
            Box(
                modifier = Modifier
                    .width(barWidth)
                    .fillMaxHeight(factor)
                    .background(barColor, shape = RoundedCornerShape(1.5.dp))
            )
        }
    }
}
