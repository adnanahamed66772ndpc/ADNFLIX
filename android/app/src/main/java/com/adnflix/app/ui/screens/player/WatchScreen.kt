package com.adnflix.app.ui.screens.player

import android.app.Activity
import android.content.pm.ActivityInfo
import android.view.WindowManager
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.media3.ui.PlayerView
import com.adnflix.app.player.AdPlayerOverlay
import com.adnflix.app.player.VideoPlayerControls
import com.adnflix.app.player.rememberVideoPlayerState
import com.adnflix.app.ui.theme.Background
import com.adnflix.app.ui.viewmodel.PlayerViewModel

@Composable
fun WatchScreen(
    titleId: String,
    episodeId: String?,
    onBackClick: () -> Unit,
    onNextEpisode: (String) -> Unit,
    viewModel: PlayerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val activity = context as? Activity
    
    // Load title and episode data
    LaunchedEffect(titleId, episodeId) {
        viewModel.loadContent(titleId, episodeId)
    }
    
    val title by viewModel.title.collectAsState()
    val episode by viewModel.episode.collectAsState()
    val videoUrl by viewModel.videoUrl.collectAsState()
    val startPosition by viewModel.startPosition.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val showAds by viewModel.showAds.collectAsState()
    val currentAd by viewModel.currentAd.collectAsState()
    val hasNextEpisode by viewModel.hasNextEpisode.collectAsState()
    val nextEpisodeId by viewModel.nextEpisodeId.collectAsState()
    
    // Set landscape mode and hide system bars
    DisposableEffect(Unit) {
        activity?.let {
            it.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            
            val window = it.window
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            
            WindowCompat.setDecorFitsSystemWindows(window, false)
            val controller = WindowInsetsControllerCompat(window, window.decorView)
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        
        onDispose {
            activity?.let {
                it.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                
                val window = it.window
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                
                WindowCompat.setDecorFitsSystemWindows(window, true)
                val controller = WindowInsetsControllerCompat(window, window.decorView)
                controller.show(WindowInsetsCompat.Type.systemBars())
            }
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        when {
            isLoading -> {
                // Loading state
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Color.White
                )
            }
            
            showAds && currentAd != null -> {
                // Show ad
                AdPlayerOverlay(
                    ad = currentAd!!,
                    onAdComplete = { 
                        viewModel.onAdComplete()
                    },
                    onAdClick = {
                        viewModel.onAdClick(currentAd!!.id)
                    },
                    skipAfterSeconds = viewModel.skipAfterSeconds
                )
            }
            
            videoUrl != null -> {
                // Main video player
                val playerState = rememberVideoPlayerState(
                    videoUrl = videoUrl!!,
                    startPosition = startPosition
                )
                
                // Save progress periodically
                LaunchedEffect(playerState.currentPosition) {
                    if (playerState.currentPosition > 0 && playerState.duration > 0) {
                        viewModel.saveProgress(
                            progressSeconds = (playerState.currentPosition / 1000).toInt(),
                            durationSeconds = (playerState.duration / 1000).toInt()
                        )
                    }
                }
                
                // Check for mid-roll ads
                LaunchedEffect(playerState.currentPosition, playerState.duration) {
                    viewModel.checkForMidRollAd(
                        currentPosition = playerState.currentPosition,
                        duration = playerState.duration
                    )
                }
                
                // Video player view
                AndroidView(
                    factory = { ctx ->
                        PlayerView(ctx).apply {
                            player = playerState.player
                            useController = false
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
                
                // Custom controls overlay
                VideoPlayerControls(
                    playerState = playerState,
                    title = episode?.name ?: title?.name ?: "Now Playing",
                    onBackClick = {
                        // Save progress before exiting
                        if (playerState.currentPosition > 0 && playerState.duration > 0) {
                            viewModel.saveProgress(
                                progressSeconds = (playerState.currentPosition / 1000).toInt(),
                                durationSeconds = (playerState.duration / 1000).toInt(),
                                forceImmediate = true
                            )
                        }
                        onBackClick()
                    },
                    onNextEpisode = if (hasNextEpisode && nextEpisodeId != null) {
                        { 
                            viewModel.checkForPostRollAd()
                            if (!showAds) {
                                onNextEpisode(nextEpisodeId!!)
                            }
                        }
                    } else null,
                    hasNextEpisode = hasNextEpisode
                )
            }
            
            else -> {
                // Error state
                Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Unable to load video",
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = onBackClick) {
                        Text("Go Back")
                    }
                }
            }
        }
    }
}
