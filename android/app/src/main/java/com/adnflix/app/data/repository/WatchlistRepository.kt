package com.adnflix.app.data.repository

import com.adnflix.app.data.model.AddToWatchlistRequest
import com.adnflix.app.data.model.WatchlistItem
import com.adnflix.app.data.remote.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WatchlistRepository @Inject constructor(
    private val apiService: ApiService
) {
    private val _watchlist = MutableStateFlow<List<WatchlistItem>>(emptyList())
    val watchlist: StateFlow<List<WatchlistItem>> = _watchlist.asStateFlow()
    
    suspend fun fetchWatchlist(): Result<List<WatchlistItem>> {
        return try {
            val response = apiService.getWatchlist()
            if (response.isSuccessful && response.body() != null) {
                val items = response.body()!!
                _watchlist.value = items
                Result.success(items)
            } else {
                Result.failure(Exception("Failed to fetch watchlist"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun addToWatchlist(titleId: String): Result<Unit> {
        return try {
            val response = apiService.addToWatchlist(AddToWatchlistRequest(titleId))
            if (response.isSuccessful) {
                fetchWatchlist() // Refresh the list
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to add to watchlist"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun removeFromWatchlist(titleId: String): Result<Unit> {
        return try {
            val response = apiService.removeFromWatchlist(titleId)
            if (response.isSuccessful) {
                _watchlist.value = _watchlist.value.filter { it.titleId != titleId }
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to remove from watchlist"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun isInWatchlist(titleId: String): Boolean {
        return _watchlist.value.any { it.titleId == titleId }
    }
    
    fun clearWatchlist() {
        _watchlist.value = emptyList()
    }
}
