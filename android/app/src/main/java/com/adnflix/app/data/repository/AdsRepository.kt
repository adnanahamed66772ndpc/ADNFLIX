package com.adnflix.app.data.repository

import com.adnflix.app.data.model.AdSettings
import com.adnflix.app.data.model.AdVideo
import com.adnflix.app.data.model.TrackImpressionRequest
import com.adnflix.app.data.remote.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdsRepository @Inject constructor(
    private val apiService: ApiService
) {
    private val _settings = MutableStateFlow<AdSettings?>(null)
    val settings: StateFlow<AdSettings?> = _settings.asStateFlow()
    
    private val _activeAds = MutableStateFlow<List<AdVideo>>(emptyList())
    val activeAds: StateFlow<List<AdVideo>> = _activeAds.asStateFlow()
    
    suspend fun fetchAdSettings(): Result<AdSettings> {
        return try {
            val response = apiService.getAdSettings()
            if (response.isSuccessful && response.body() != null) {
                val settings = response.body()!!
                _settings.value = settings
                Result.success(settings)
            } else {
                Result.failure(Exception("Failed to fetch ad settings"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun fetchActiveAds(): Result<List<AdVideo>> {
        return try {
            val response = apiService.getActiveAds()
            if (response.isSuccessful && response.body() != null) {
                val ads = response.body()!!
                _activeAds.value = ads
                Result.success(ads)
            } else {
                Result.failure(Exception("Failed to fetch ads"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun trackImpression(adId: String, type: String, userId: String?) {
        try {
            apiService.trackImpression(TrackImpressionRequest(adId, type, userId))
        } catch (_: Exception) {
            // Silent fail for tracking
        }
    }
    
    fun getPreRollAds(): List<AdVideo> = _activeAds.value.filter { it.type == "pre-roll" }
    
    fun getMidRollAds(): List<AdVideo> = _activeAds.value.filter { it.type == "mid-roll" }
    
    fun getPostRollAds(): List<AdVideo> = _activeAds.value.filter { it.type == "post-roll" }
}
