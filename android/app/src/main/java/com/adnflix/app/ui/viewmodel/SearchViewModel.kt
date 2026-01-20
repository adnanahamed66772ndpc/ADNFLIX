package com.adnflix.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adnflix.app.data.model.Title
import com.adnflix.app.data.repository.TitlesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val titlesRepository: TitlesRepository
) : ViewModel() {
    
    private val _searchResults = MutableStateFlow<List<Title>>(emptyList())
    val searchResults: StateFlow<List<Title>> = _searchResults.asStateFlow()
    
    private val _isSearching = MutableStateFlow(false)
    val isSearching: StateFlow<Boolean> = _isSearching.asStateFlow()
    
    private var searchJob: Job? = null
    
    fun search(query: String) {
        searchJob?.cancel()
        
        if (query.isBlank()) {
            _searchResults.value = emptyList()
            _isSearching.value = false
            return
        }
        
        searchJob = viewModelScope.launch {
            _isSearching.value = true
            
            // Debounce search
            delay(300)
            
            // Search locally first
            val localResults = titlesRepository.searchTitles(query)
            _searchResults.value = localResults
            
            // If no local results, try API search
            if (localResults.isEmpty()) {
                titlesRepository.fetchTitles(search = query).fold(
                    onSuccess = { results ->
                        _searchResults.value = results
                    },
                    onFailure = {
                        // Keep empty results
                    }
                )
            }
            
            _isSearching.value = false
        }
    }
    
    fun clearSearch() {
        searchJob?.cancel()
        _searchResults.value = emptyList()
        _isSearching.value = false
    }
}
