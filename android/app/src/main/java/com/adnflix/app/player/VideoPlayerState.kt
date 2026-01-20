package com.adnflix.app.player

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.LifecycleEventObserver
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.Tracks
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.datasource.DefaultHttpDataSource

class VideoPlayerState(
    val player: ExoPlayer
) {
    var isPlaying by mutableStateOf(false)
        private set
    
    var isBuffering by mutableStateOf(false)
        private set
    
    var currentPosition by mutableLongStateOf(0L)
        private set
    
    var duration by mutableLongStateOf(0L)
        private set
    
    var bufferedPercentage by mutableFloatStateOf(0f)
        private set
    
    var playbackState by mutableStateOf(Player.STATE_IDLE)
        private set
    
    var audioTracks by mutableStateOf<List<AudioTrackInfo>>(emptyList())
        private set
    
    var selectedAudioTrackIndex by mutableStateOf(0)
        private set
    
    var hasError by mutableStateOf(false)
        private set
    
    var errorMessage by mutableStateOf<String?>(null)
        private set
    
    private val playerListener = object : Player.Listener {
        override fun onPlaybackStateChanged(state: Int) {
            playbackState = state
            isBuffering = state == Player.STATE_BUFFERING
        }
        
        override fun onIsPlayingChanged(playing: Boolean) {
            isPlaying = playing
        }
        
        override fun onTracksChanged(tracks: Tracks) {
            updateAudioTracks(tracks)
        }
        
        override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
            hasError = true
            errorMessage = error.message
        }
    }
    
    init {
        player.addListener(playerListener)
    }
    
    fun updatePosition() {
        currentPosition = player.currentPosition
        duration = player.duration.coerceAtLeast(0)
        bufferedPercentage = player.bufferedPercentage.toFloat()
    }
    
    private fun updateAudioTracks(tracks: Tracks) {
        val audioTracksList = mutableListOf<AudioTrackInfo>()
        tracks.groups.forEachIndexed { groupIndex, group ->
            if (group.type == androidx.media3.common.C.TRACK_TYPE_AUDIO) {
                for (trackIndex in 0 until group.length) {
                    val format = group.getTrackFormat(trackIndex)
                    audioTracksList.add(
                        AudioTrackInfo(
                            groupIndex = groupIndex,
                            trackIndex = trackIndex,
                            language = format.language ?: "Unknown",
                            label = format.label ?: format.language ?: "Audio ${trackIndex + 1}",
                            isSelected = group.isTrackSelected(trackIndex)
                        )
                    )
                }
            }
        }
        audioTracks = audioTracksList
        selectedAudioTrackIndex = audioTracksList.indexOfFirst { it.isSelected }.coerceAtLeast(0)
    }
    
    fun play() {
        player.play()
    }
    
    fun pause() {
        player.pause()
    }
    
    fun togglePlayPause() {
        if (isPlaying) pause() else play()
    }
    
    fun seekTo(position: Long) {
        player.seekTo(position)
        currentPosition = position
    }
    
    fun seekForward(ms: Long = 10_000L) {
        val newPosition = (currentPosition + ms).coerceAtMost(duration)
        seekTo(newPosition)
    }
    
    fun seekBackward(ms: Long = 10_000L) {
        val newPosition = (currentPosition - ms).coerceAtLeast(0)
        seekTo(newPosition)
    }
    
    fun selectAudioTrack(index: Int) {
        val track = audioTracks.getOrNull(index) ?: return
        
        val tracks = player.currentTracks
        val audioGroup = tracks.groups.getOrNull(track.groupIndex) ?: return
        
        val override = TrackSelectionOverride(
            audioGroup.mediaTrackGroup,
            track.trackIndex
        )
        
        player.trackSelectionParameters = player.trackSelectionParameters
            .buildUpon()
            .setOverrideForType(override)
            .build()
        
        selectedAudioTrackIndex = index
    }
    
    fun clearError() {
        hasError = false
        errorMessage = null
    }
    
    fun release() {
        player.removeListener(playerListener)
    }
}

data class AudioTrackInfo(
    val groupIndex: Int,
    val trackIndex: Int,
    val language: String,
    val label: String,
    val isSelected: Boolean
)

@Composable
fun rememberVideoPlayerState(
    videoUrl: String,
    startPosition: Long = 0L
): VideoPlayerState {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    
    val playerState = remember {
        val player = ExoPlayer.Builder(context)
            .build()
            .apply {
                val isHls = videoUrl.contains(".m3u8")
                
                if (isHls) {
                    val dataSourceFactory = DefaultHttpDataSource.Factory()
                    val hlsMediaSource = HlsMediaSource.Factory(dataSourceFactory)
                        .createMediaSource(MediaItem.fromUri(videoUrl))
                    setMediaSource(hlsMediaSource)
                } else {
                    setMediaItem(MediaItem.fromUri(videoUrl))
                }
                
                prepare()
                playWhenReady = true
                
                if (startPosition > 0) {
                    seekTo(startPosition)
                }
            }
        
        VideoPlayerState(player)
    }
    
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_PAUSE -> playerState.pause()
                Lifecycle.Event.ON_RESUME -> {} // Don't auto-play on resume
                else -> {}
            }
        }
        
        lifecycleOwner.lifecycle.addObserver(observer)
        
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            playerState.release()
            playerState.player.release()
        }
    }
    
    return playerState
}
