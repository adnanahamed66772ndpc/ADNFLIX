package com.adnflix.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adnflix.app.data.model.Title
import com.adnflix.app.data.repository.AuthRepository
import com.adnflix.app.data.repository.PlaybackRepository
import com.adnflix.app.data.repository.TitlesRepository
import com.adnflix.app.data.repository.WatchlistRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val titlesRepository: TitlesRepository,
    private val playbackRepository: PlaybackRepository,
    private val watchlistRepository: WatchlistRepository,
    private val authRepository: AuthRepository
) : ViewModel() {
    
    val titles: StateFlow<List<Title>> = titlesRepository.titles
    val isLoading: StateFlow<Boolean> = titlesRepository.isLoading
    
    private val _continueWatching = MutableStateFlow<List<Title>>(emptyList())
    val continueWatching: StateFlow<List<Title>> = _continueWatching.asStateFlow()
    
    private val _featuredTitle = MutableStateFlow<Title?>(null)
    val featuredTitle: StateFlow<Title?> = _featuredTitle.asStateFlow()
    
    init {
        loadData()
    }
    
    fun loadData() {
        viewModelScope.launch {
            // Fetch titles
            titlesRepository.fetchTitles()
            titlesRepository.fetchCategories()
            
            // Fetch user data if logged in
            if (authRepository.isLoggedIn.first()) {
                watchlistRepository.fetchWatchlist()
                playbackRepository.fetchProgress()
            }
            
            // Update continue watching
            updateContinueWatching()
            
            // Set featured title
            val trending = titlesRepository.getTrendingTitles()
            _featuredTitle.value = trending.randomOrNull() ?: titles.value.firstOrNull()
        }
    }
    
    private fun updateContinueWatching() {
        val progressList = playbackRepository.getContinueWatching()
        val continueList = progressList.mapNotNull { progress ->
            titles.value.find { it.id == progress.titleId }
        }
        _continueWatching.value = continueList
    }
    
    fun getTrendingTitles(): List<Title> = titlesRepository.getTrendingTitles()
    
    fun getNewReleases(): List<Title> = titlesRepository.getNewReleases()
    
    fun getMovies(): List<Title> = titlesRepository.getMovies()
    
    fun getSeries(): List<Title> = titlesRepository.getSeries()
    
    fun refresh() {
        loadData()
    }
}
