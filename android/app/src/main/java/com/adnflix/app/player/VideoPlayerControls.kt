package com.adnflix.app.player

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.util.concurrent.TimeUnit

@Composable
fun VideoPlayerControls(
    playerState: VideoPlayerState,
    title: String,
    onBackClick: () -> Unit,
    onNextEpisode: (() -> Unit)? = null,
    hasNextEpisode: Boolean = false,
    modifier: Modifier = Modifier
) {
    var showControls by remember { mutableStateOf(true) }
    var showAudioTrackSelector by remember { mutableStateOf(false) }
    
    // Auto-hide controls after 3 seconds
    LaunchedEffect(showControls, playerState.isPlaying) {
        if (showControls && playerState.isPlaying) {
            delay(3000)
            showControls = false
        }
    }
    
    // Update position periodically
    LaunchedEffect(Unit) {
        while (true) {
            playerState.updatePosition()
            delay(500)
        }
    }
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTapGestures(
                    onTap = { showControls = !showControls },
                    onDoubleTap = { offset ->
                        val width = size.width
                        if (offset.x < width / 3) {
                            // Double tap left - rewind 10s
                            playerState.seekBackward()
                        } else if (offset.x > width * 2 / 3) {
                            // Double tap right - forward 10s
                            playerState.seekForward()
                        }
                    }
                )
            }
    ) {
        // Buffering indicator
        if (playerState.isBuffering) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color = Color.White
            )
        }
        
        // Controls overlay
        AnimatedVisibility(
            visible = showControls || !playerState.isPlaying,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f))
            ) {
                // Top bar with gradient
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp)
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Black.copy(alpha = 0.7f),
                                    Color.Transparent
                                )
                            )
                        )
                        .align(Alignment.TopCenter)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .statusBarsPadding(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onBackClick) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = Color.White
                            )
                        }
                        
                        Spacer(modifier = Modifier.width(8.dp))
                        
                        Text(
                            text = title,
                            color = Color.White,
                            fontWeight = FontWeight.Medium,
                            fontSize = 16.sp,
                            modifier = Modifier.weight(1f)
                        )
                        
                        // Audio track selector button
                        if (playerState.audioTracks.size > 1) {
                            IconButton(onClick = { showAudioTrackSelector = true }) {
                                Icon(
                                    imageVector = Icons.Filled.Audiotrack,
                                    contentDescription = "Audio Tracks",
                                    tint = Color.White
                                )
                            }
                        }
                    }
                }
                
                // Center controls
                Row(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalArrangement = Arrangement.spacedBy(48.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Rewind 10s
                    IconButton(
                        onClick = { playerState.seekBackward() },
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Replay10,
                            contentDescription = "Rewind 10 seconds",
                            tint = Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                    
                    // Play/Pause
                    IconButton(
                        onClick = { playerState.togglePlayPause() },
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.3f))
                    ) {
                        Icon(
                            imageVector = if (playerState.isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                            contentDescription = if (playerState.isPlaying) "Pause" else "Play",
                            tint = Color.White,
                            modifier = Modifier.size(48.dp)
                        )
                    }
                    
                    // Forward 10s
                    IconButton(
                        onClick = { playerState.seekForward() },
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Forward10,
                            contentDescription = "Forward 10 seconds",
                            tint = Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }
                
                // Bottom bar with gradient
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Transparent,
                                    Color.Black.copy(alpha = 0.7f)
                                )
                            )
                        )
                        .padding(16.dp)
                        .navigationBarsPadding()
                ) {
                    Column {
                        // Seek bar
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Current time
                            Text(
                                text = formatDuration(playerState.currentPosition),
                                color = Color.White,
                                fontSize = 12.sp
                            )
                            
                            // Slider
                            Slider(
                                value = if (playerState.duration > 0) {
                                    playerState.currentPosition.toFloat() / playerState.duration.toFloat()
                                } else 0f,
                                onValueChange = { progress ->
                                    playerState.seekTo((progress * playerState.duration).toLong())
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(horizontal = 8.dp),
                                colors = SliderDefaults.colors(
                                    thumbColor = Color.White,
                                    activeTrackColor = Color(0xFFE50914),
                                    inactiveTrackColor = Color.Gray.copy(alpha = 0.5f)
                                )
                            )
                            
                            // Duration
                            Text(
                                text = formatDuration(playerState.duration),
                                color = Color.White,
                                fontSize = 12.sp
                            )
                        }
                        
                        // Next episode button
                        if (hasNextEpisode && onNextEpisode != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                Button(
                                    onClick = onNextEpisode,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color.White.copy(alpha = 0.2f)
                                    )
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.SkipNext,
                                        contentDescription = null,
                                        tint = Color.White
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Next Episode", color = Color.White)
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Audio Track Selector Dialog
        if (showAudioTrackSelector) {
            AudioTrackSelectorDialog(
                tracks = playerState.audioTracks,
                selectedIndex = playerState.selectedAudioTrackIndex,
                onTrackSelected = { index ->
                    playerState.selectAudioTrack(index)
                    showAudioTrackSelector = false
                },
                onDismiss = { showAudioTrackSelector = false }
            )
        }
        
        // Error dialog
        if (playerState.hasError) {
            AlertDialog(
                onDismissRequest = { playerState.clearError() },
                title = { Text("Playback Error") },
                text = { Text(playerState.errorMessage ?: "An error occurred during playback") },
                confirmButton = {
                    TextButton(onClick = { 
                        playerState.clearError()
                        onBackClick()
                    }) {
                        Text("OK")
                    }
                }
            )
        }
    }
}

@Composable
private fun AudioTrackSelectorDialog(
    tracks: List<AudioTrackInfo>,
    selectedIndex: Int,
    onTrackSelected: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Audio") },
        text = {
            Column {
                tracks.forEachIndexed { index, track ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onTrackSelected(index) }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = index == selectedIndex,
                            onClick = { onTrackSelected(index) }
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(text = track.label)
                            Text(
                                text = track.language,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

private fun formatDuration(durationMs: Long): String {
    val hours = TimeUnit.MILLISECONDS.toHours(durationMs)
    val minutes = TimeUnit.MILLISECONDS.toMinutes(durationMs) % 60
    val seconds = TimeUnit.MILLISECONDS.toSeconds(durationMs) % 60
    
    return if (hours > 0) {
        String.format("%d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format("%02d:%02d", minutes, seconds)
    }
}
