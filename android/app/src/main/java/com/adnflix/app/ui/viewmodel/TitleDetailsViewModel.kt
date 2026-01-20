package com.adnflix.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adnflix.app.data.model.Title
import com.adnflix.app.data.repository.AuthRepository
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
class TitleDetailsViewModel @Inject constructor(
    private val titlesRepository: TitlesRepository,
    private val watchlistRepository: WatchlistRepository,
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _title = MutableStateFlow<Title?>(null)
    val title: StateFlow<Title?> = _title.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _isInWatchlist = MutableStateFlow(false)
    val isInWatchlist: StateFlow<Boolean> = _isInWatchlist.asStateFlow()
    
    private var currentTitleId: String? = null
    
    fun loadTitle(titleId: String) {
        if (currentTitleId == titleId && _title.value != null) {
            return // Already loaded
        }
        currentTitleId = titleId
        
        viewModelScope.launch {
            _isLoading.value = true
            
            titlesRepository.getTitleById(titleId).fold(
                onSuccess = { loadedTitle ->
                    _title.value = loadedTitle
                    checkWatchlistStatus(titleId)
                },
                onFailure = {
                    // Could show error state
                }
            )
            
            _isLoading.value = false
        }
    }
    
    private suspend fun checkWatchlistStatus(titleId: String) {
        if (authRepository.isLoggedIn.first()) {
            _isInWatchlist.value = watchlistRepository.isInWatchlist(titleId)
        }
    }
    
    fun toggleWatchlist() {
        val titleId = currentTitleId ?: return
        
        viewModelScope.launch {
            if (!authRepository.isLoggedIn.first()) {
                // User needs to login
                return@launch
            }
            
            if (_isInWatchlist.value) {
                watchlistRepository.removeFromWatchlist(titleId)
                _isInWatchlist.value = false
            } else {
                watchlistRepository.addToWatchlist(titleId)
                _isInWatchlist.value = true
            }
        }
    }
}
