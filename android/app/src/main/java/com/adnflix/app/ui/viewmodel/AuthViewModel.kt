package com.adnflix.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adnflix.app.data.model.User
import com.adnflix.app.data.repository.AuthRepository
import com.adnflix.app.data.repository.PlaybackRepository
import com.adnflix.app.data.repository.WatchlistRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val watchlistRepository: WatchlistRepository,
    private val playbackRepository: PlaybackRepository
) : ViewModel() {
    
    val currentUser: StateFlow<User?> = authRepository.currentUser
    val isLoggedIn: Flow<Boolean> = authRepository.isLoggedIn
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    init {
        // Try to restore session on startup
        viewModelScope.launch {
            authRepository.getCurrentUser()
        }
    }
    
    fun login(email: String, password: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            authRepository.login(email, password).fold(
                onSuccess = { user ->
                    // Fetch user data after login
                    watchlistRepository.fetchWatchlist()
                    playbackRepository.fetchProgress()
                    onSuccess()
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Login failed"
                }
            )
            
            _isLoading.value = false
        }
    }
    
    fun register(email: String, password: String, displayName: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            authRepository.register(email, password, displayName).fold(
                onSuccess = { user ->
                    onSuccess()
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Registration failed"
                }
            )
            
            _isLoading.value = false
        }
    }
    
    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            watchlistRepository.clearWatchlist()
            playbackRepository.clearProgress()
            onComplete()
        }
    }
    
    fun clearError() {
        _error.value = null
    }
}
