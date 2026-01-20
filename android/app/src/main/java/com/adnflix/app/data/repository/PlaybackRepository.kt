package com.adnflix.app.data.repository

import com.adnflix.app.data.model.PlaybackProgress
import com.adnflix.app.data.model.UpdatePlaybackRequest
import com.adnflix.app.data.remote.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PlaybackRepository @Inject constructor(
    private val apiService: ApiService
) {
    private val _progress = MutableStateFlow<List<PlaybackProgress>>(emptyList())
    val progress: StateFlow<List<PlaybackProgress>> = _progress.asStateFlow()
    
    private var lastUpdateTime = 0L
    private val updateThrottleMs = 5000L // 5 seconds throttle
    
    suspend fun fetchProgress(): Result<List<PlaybackProgress>> {
        return try {
            val response = apiService.getPlaybackProgress()
            if (response.isSuccessful && response.body() != null) {
                val progressList = response.body()!!
                _progress.value = progressList
                Result.success(progressList)
            } else {
                Result.failure(Exception("Failed to fetch progress"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateProgress(
        titleId: String,
        episodeId: String?,
        progressSeconds: Int,
        durationSeconds: Int,
        forceImmediate: Boolean = false
    ): Result<Unit> {
        val now = System.currentTimeMillis()
        
        // Throttle updates unless forced
        if (!forceImmediate && now - lastUpdateTime < updateThrottleMs) {
            return Result.success(Unit)
        }
        lastUpdateTime = now
        
        // Update local state immediately
        val existingIndex = _progress.value.indexOfFirst { 
            it.titleId == titleId && it.episodeId == episodeId 
        }
        
        val newProgress = PlaybackProgress(
            titleId = titleId,
            episodeId = episodeId,
            progressSeconds = progressSeconds,
            durationSeconds = durationSeconds,
            updatedAt = System.currentTimeMillis().toString()
        )
        
        _progress.value = if (existingIndex >= 0) {
            _progress.value.toMutableList().apply { set(existingIndex, newProgress) }
        } else {
            _progress.value + newProgress
        }
        
        // Send to server (fire and forget for better UX)
        return try {
            val response = apiService.updatePlaybackProgress(
                UpdatePlaybackRequest(titleId, episodeId, progressSeconds, durationSeconds)
            )
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to update progress"))
            }
        } catch (e: Exception) {
            // Silent fail - local state is already updated
            Result.success(Unit)
        }
    }
    
    fun getProgress(titleId: String, episodeId: String? = null): PlaybackProgress? {
        return _progress.value.find { 
            it.titleId == titleId && 
            (episodeId == null || it.episodeId == episodeId)
        }
    }
    
    fun getProgressPercent(titleId: String, episodeId: String? = null): Float {
        return getProgress(titleId, episodeId)?.progressPercent ?: 0f
    }
    
    fun getContinueWatching(): List<PlaybackProgress> {
        return _progress.value.filter { it.shouldContinue }
            .sortedByDescending { it.updatedAt }
            .take(10)
    }
    
    suspend fun deleteMovieProgress(titleId: String): Result<Unit> {
        return try {
            val response = apiService.deleteMovieProgress(titleId)
            if (response.isSuccessful) {
                _progress.value = _progress.value.filter { it.titleId != titleId }
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete progress"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun clearProgress() {
        _progress.value = emptyList()
    }
}
