package com.adnflix.app.data.repository

import com.adnflix.app.data.model.Category
import com.adnflix.app.data.model.Title
import com.adnflix.app.data.model.TitleType
import com.adnflix.app.data.remote.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TitlesRepository @Inject constructor(
    private val apiService: ApiService
) {
    private val _titles = MutableStateFlow<List<Title>>(emptyList())
    val titles: StateFlow<List<Title>> = _titles.asStateFlow()
    
    private val _categories = MutableStateFlow<List<Category>>(emptyList())
    val categories: StateFlow<List<Category>> = _categories.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    suspend fun fetchTitles(type: String? = null, search: String? = null): Result<List<Title>> {
        _isLoading.value = true
        return try {
            val response = apiService.getTitles(type, search)
            if (response.isSuccessful && response.body() != null) {
                val titles = response.body()!!
                _titles.value = titles
                Result.success(titles)
            } else {
                Result.failure(Exception("Failed to fetch titles"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        } finally {
            _isLoading.value = false
        }
    }
    
    suspend fun getTitleById(id: String): Result<Title> {
        return try {
            val response = apiService.getTitleById(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Title not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun fetchCategories(): Result<List<Category>> {
        return try {
            val response = apiService.getCategories()
            if (response.isSuccessful && response.body() != null) {
                val categories = response.body()!!
                _categories.value = categories
                Result.success(categories)
            } else {
                Result.failure(Exception("Failed to fetch categories"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun getTrendingTitles(): List<Title> = _titles.value.filter { it.trending }
    
    fun getNewReleases(): List<Title> = _titles.value.filter { it.newRelease }
    
    fun getMovies(): List<Title> = _titles.value.filter { it.type == TitleType.MOVIE }
    
    fun getSeries(): List<Title> = _titles.value.filter { it.type == TitleType.SERIES }
    
    fun getFreeTitles(): List<Title> = _titles.value.filter { !it.premium }
    
    fun getPremiumTitles(): List<Title> = _titles.value.filter { it.premium }
    
    fun searchTitles(query: String): List<Title> {
        val lowerQuery = query.lowercase()
        return _titles.value.filter { title ->
            title.name.lowercase().contains(lowerQuery) ||
            title.synopsis?.lowercase()?.contains(lowerQuery) == true ||
            title.genres.any { it.lowercase().contains(lowerQuery) } ||
            title.cast.any { it.lowercase().contains(lowerQuery) }
        }
    }
}
