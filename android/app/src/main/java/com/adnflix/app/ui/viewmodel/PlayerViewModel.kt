package com.adnflix.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adnflix.app.data.model.AdVideo
import com.adnflix.app.data.model.Episode
import com.adnflix.app.data.model.SubscriptionPlan
import com.adnflix.app.data.model.Title
import com.adnflix.app.data.model.TitleType
import com.adnflix.app.data.repository.AdsRepository
import com.adnflix.app.data.repository.AuthRepository
import com.adnflix.app.data.repository.PlaybackRepository
import com.adnflix.app.data.repository.TitlesRepository
import com.adnflix.app.player.AdType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val titlesRepository: TitlesRepository,
    private val playbackRepository: PlaybackRepository,
    private val adsRepository: AdsRepository,
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _title = MutableStateFlow<Title?>(null)
    val title: StateFlow<Title?> = _title.asStateFlow()
    
    private val _episode = MutableStateFlow<Episode?>(null)
    val episode: StateFlow<Episode?> = _episode.asStateFlow()
    
    private val _videoUrl = MutableStateFlow<String?>(null)
    val videoUrl: StateFlow<String?> = _videoUrl.asStateFlow()
    
    private val _startPosition = MutableStateFlow(0L)
    val startPosition: StateFlow<Long> = _startPosition.asStateFlow()
    
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _showAds = MutableStateFlow(false)
    val showAds: StateFlow<Boolean> = _showAds.asStateFlow()
    
    private val _currentAd = MutableStateFlow<AdVideo?>(null)
    val currentAd: StateFlow<AdVideo?> = _currentAd.asStateFlow()
    
    private val _adType = MutableStateFlow<AdType?>(null)
    val adType: StateFlow<AdType?> = _adType.asStateFlow()
    
    private val _hasNextEpisode = MutableStateFlow(false)
    val hasNextEpisode: StateFlow<Boolean> = _hasNextEpisode.asStateFlow()
    
    private val _nextEpisodeId = MutableStateFlow<String?>(null)
    val nextEpisodeId: StateFlow<String?> = _nextEpisodeId.asStateFlow()
    
    var skipAfterSeconds = 5
        private set
    
    private var currentTitleId: String? = null
    private var currentEpisodeId: String? = null
    private var shouldShowAds = false
    private var lastMidRollTime = 0L
    private var midRollInterval = 300_000L // 5 minutes in ms
    private var hasShownPreRoll = false
    private var pendingNextEpisode: (() -> Unit)? = null
    
    fun loadContent(titleId: String, episodeId: String?) {
        if (currentTitleId == titleId && currentEpisodeId == episodeId && _title.value != null) {
            return // Already loaded
        }
        
        currentTitleId = titleId
        currentEpisodeId = episodeId
        
        viewModelScope.launch {
            _isLoading.value = true
            
            // Check if user should see ads
            val user = authRepository.currentUser.value
            shouldShowAds = user?.subscriptionPlan != SubscriptionPlan.PREMIUM
            
            // Fetch ad settings if needed
            if (shouldShowAds) {
                adsRepository.fetchAdSettings()
                adsRepository.fetchActiveAds()
                
                val settings = adsRepository.settings.value
                skipAfterSeconds = settings?.skipAfter ?: 5
                midRollInterval = (settings?.midRollInterval ?: 300) * 1000L
            }
            
            // Load title
            titlesRepository.getTitleById(titleId).fold(
                onSuccess = { loadedTitle ->
                    _title.value = loadedTitle
                    
                    if (loadedTitle.type == TitleType.SERIES && episodeId != null) {
                        // Find the episode
                        var foundEpisode: Episode? = null
                        var foundSeasonIndex = -1
                        var foundEpisodeIndex = -1
                        
                        loadedTitle.seasons.forEachIndexed { sIndex, season ->
                            season.episodes.forEachIndexed { eIndex, ep ->
                                if (ep.id == episodeId) {
                                    foundEpisode = ep
                                    foundSeasonIndex = sIndex
                                    foundEpisodeIndex = eIndex
                                }
                            }
                        }
                        
                        _episode.value = foundEpisode
                        _videoUrl.value = foundEpisode?.videoUrl
                        
                        // Check for next episode
                        checkNextEpisode(loadedTitle, foundSeasonIndex, foundEpisodeIndex)
                        
                        // Load progress
                        val progress = playbackRepository.getProgress(titleId, episodeId)
                        if (progress != null && !progress.isCompleted) {
                            _startPosition.value = progress.progressSeconds * 1000L
                        }
                    } else {
                        // Movie
                        _videoUrl.value = loadedTitle.videoUrl
                        
                        // Load progress
                        val progress = playbackRepository.getProgress(titleId)
                        if (progress != null && !progress.isCompleted) {
                            _startPosition.value = progress.progressSeconds * 1000L
                        }
                    }
                    
                    // Show pre-roll ad
                    if (shouldShowAds && !hasShownPreRoll) {
                        showPreRollAd()
                    } else {
                        _isLoading.value = false
                    }
                },
                onFailure = {
                    _isLoading.value = false
                }
            )
        }
    }
    
    private fun checkNextEpisode(title: Title, currentSeasonIndex: Int, currentEpisodeIndex: Int) {
        if (currentSeasonIndex < 0 || currentEpisodeIndex < 0) {
            _hasNextEpisode.value = false
            return
        }
        
        val currentSeason = title.seasons.getOrNull(currentSeasonIndex)
        
        // Check if there's a next episode in current season
        val nextEpisodeInSeason = currentSeason?.episodes?.getOrNull(currentEpisodeIndex + 1)
        if (nextEpisodeInSeason != null) {
            _hasNextEpisode.value = true
            _nextEpisodeId.value = nextEpisodeInSeason.id
            return
        }
        
        // Check if there's a next season with episodes
        val nextSeason = title.seasons.getOrNull(currentSeasonIndex + 1)
        val firstEpisodeOfNextSeason = nextSeason?.episodes?.firstOrNull()
        if (firstEpisodeOfNextSeason != null) {
            _hasNextEpisode.value = true
            _nextEpisodeId.value = firstEpisodeOfNextSeason.id
            return
        }
        
        _hasNextEpisode.value = false
        _nextEpisodeId.value = null
    }
    
    private fun showPreRollAd() {
        val settings = adsRepository.settings.value
        if (settings?.preRoll != true) {
            hasShownPreRoll = true
            _isLoading.value = false
            return
        }
        
        val preRollAds = adsRepository.getPreRollAds()
        if (preRollAds.isNotEmpty()) {
            _currentAd.value = preRollAds.random()
            _adType.value = AdType.PRE_ROLL
            _showAds.value = true
            hasShownPreRoll = true
            
            // Track impression
            viewModelScope.launch {
                adsRepository.trackImpression(
                    adId = _currentAd.value!!.id,
                    type = "impression",
                    userId = authRepository.currentUser.value?.id
                )
            }
        }
        
        _isLoading.value = false
    }
    
    fun checkForMidRollAd(currentPosition: Long, duration: Long) {
        if (!shouldShowAds || _showAds.value) return
        
        val settings = adsRepository.settings.value
        if (settings?.midRoll != true) return
        
        // Check if enough time has passed since last mid-roll
        if (currentPosition - lastMidRollTime < midRollInterval) return
        
        // Don't show mid-roll near the end
        if (duration - currentPosition < 60_000) return
        
        val midRollAds = adsRepository.getMidRollAds()
        if (midRollAds.isNotEmpty()) {
            _currentAd.value = midRollAds.random()
            _adType.value = AdType.MID_ROLL
            _showAds.value = true
            lastMidRollTime = currentPosition
            
            viewModelScope.launch {
                adsRepository.trackImpression(
                    adId = _currentAd.value!!.id,
                    type = "impression",
                    userId = authRepository.currentUser.value?.id
                )
            }
        }
    }
    
    fun checkForPostRollAd() {
        if (!shouldShowAds) return
        
        // Post-roll is typically not implemented for streaming services
        // as it interrupts binge-watching. Keeping this as a placeholder.
    }
    
    fun onAdComplete() {
        _showAds.value = false
        _currentAd.value = null
        _adType.value = null
        
        pendingNextEpisode?.invoke()
        pendingNextEpisode = null
    }
    
    fun onAdClick(adId: String) {
        viewModelScope.launch {
            adsRepository.trackImpression(
                adId = adId,
                type = "click",
                userId = authRepository.currentUser.value?.id
            )
        }
        // Open ad URL in browser - would need to implement
    }
    
    fun saveProgress(progressSeconds: Int, durationSeconds: Int, forceImmediate: Boolean = false) {
        val titleId = currentTitleId ?: return
        
        viewModelScope.launch {
            playbackRepository.updateProgress(
                titleId = titleId,
                episodeId = currentEpisodeId,
                progressSeconds = progressSeconds,
                durationSeconds = durationSeconds,
                forceImmediate = forceImmediate
            )
        }
    }
}
