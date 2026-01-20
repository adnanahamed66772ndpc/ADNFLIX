package com.adnflix.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adnflix.app.data.model.Title
import com.adnflix.app.data.repository.AuthRepository
import com.adnflix.app.data.repository.TitlesRepository
import com.adnflix.app.data.repository.WatchlistRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WatchlistViewModel @Inject constructor(
    private val watchlistRepository: WatchlistRepository,
    private val titlesRepository: TitlesRepository,
    private val authRepository: AuthRepository
) : ViewModel() {
    
    val isLoggedIn: Flow<Boolean> = authRepository.isLoggedIn
    
    private val _watchlistTitles = MutableStateFlow<List<Title>>(emptyList())
    val watchlistTitles: StateFlow<List<Title>> = _watchlistTitles.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    init {
        loadWatchlist()
    }
    
    private fun loadWatchlist() {
        viewModelScope.launch {
            if (authRepository.isLoggedIn.first()) {
                _isLoading.value = true
                watchlistRepository.fetchWatchlist()
                updateWatchlistTitles()
                _isLoading.value = false
            }
        }
    }
    
    private fun updateWatchlistTitles() {
        val watchlist = watchlistRepository.watchlist.value
        val allTitles = titlesRepository.titles.value
        _watchlistTitles.value = watchlist.mapNotNull { item ->
            allTitles.find { it.id == item.titleId }
        }
    }
    
    fun addToWatchlist(titleId: String) {
        viewModelScope.launch {
            watchlistRepository.addToWatchlist(titleId)
            updateWatchlistTitles()
        }
    }
    
    fun removeFromWatchlist(titleId: String) {
        viewModelScope.launch {
            watchlistRepository.removeFromWatchlist(titleId)
            updateWatchlistTitles()
        }
    }
    
    fun isInWatchlist(titleId: String): Boolean {
        return watchlistRepository.isInWatchlist(titleId)
    }
    
    fun refresh() {
        loadWatchlist()
    }
}
