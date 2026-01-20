package com.adnflix.app.player

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.adnflix.app.data.model.AdVideo
import kotlinx.coroutines.delay

enum class AdType {
    PRE_ROLL,
    MID_ROLL,
    POST_ROLL
}

@Composable
fun AdPlayerOverlay(
    ad: AdVideo,
    onAdComplete: () -> Unit,
    onAdClick: () -> Unit,
    skipAfterSeconds: Int = 5,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    
    var canSkip by remember { mutableStateOf(false) }
    var skipCountdown by remember { mutableIntStateOf(skipAfterSeconds) }
    var adProgress by remember { mutableFloatStateOf(0f) }
    
    val player = remember {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(ad.videoUrl))
            prepare()
            playWhenReady = true
            
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    if (state == Player.STATE_ENDED) {
                        onAdComplete()
                    }
                }
            })
        }
    }
    
    // Skip countdown timer
    LaunchedEffect(Unit) {
        repeat(skipAfterSeconds) { second ->
            delay(1000)
            skipCountdown = skipAfterSeconds - second - 1
        }
        canSkip = true
    }
    
    // Progress update
    LaunchedEffect(player) {
        while (true) {
            if (player.duration > 0) {
                adProgress = player.currentPosition.toFloat() / player.duration.toFloat()
            }
            delay(100)
        }
    }
    
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_PAUSE -> player.pause()
                Lifecycle.Event.ON_RESUME -> player.play()
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            player.release()
        }
    }
    
    Box(modifier = modifier.fillMaxSize()) {
        // Ad Video Player
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    this.player = player
                    useController = false
                }
            },
            modifier = Modifier
                .fillMaxSize()
                .clickable(onClick = onAdClick)
        )
        
        // Ad badge
        Box(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp)
                .background(
                    color = Color(0xFFF5C518),
                    shape = RoundedCornerShape(4.dp)
                )
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Text(
                text = "AD",
                color = Color.Black,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp
            )
        }
        
        // Skip button
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp)
        ) {
            if (canSkip) {
                Button(
                    onClick = onAdComplete,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White.copy(alpha = 0.9f)
                    )
                ) {
                    Text("Skip Ad", color = Color.Black)
                }
            } else {
                Box(
                    modifier = Modifier
                        .background(
                            color = Color.Black.copy(alpha = 0.7f),
                            shape = RoundedCornerShape(4.dp)
                        )
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "Skip in $skipCountdown",
                        color = Color.White,
                        fontSize = 14.sp
                    )
                }
            }
        }
        
        // Progress bar at bottom
        LinearProgressIndicator(
            progress = { adProgress },
            modifier = Modifier
                .fillMaxWidth()
                .height(3.dp)
                .align(Alignment.BottomCenter),
            color = Color(0xFFF5C518),
            trackColor = Color.Gray.copy(alpha = 0.3f)
        )
    }
}
