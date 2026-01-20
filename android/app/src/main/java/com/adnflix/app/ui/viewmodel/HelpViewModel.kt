package com.adnflix.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adnflix.app.data.model.Ticket
import com.adnflix.app.data.repository.TicketsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HelpViewModel @Inject constructor(
    private val ticketsRepository: TicketsRepository
) : ViewModel() {
    
    val tickets: StateFlow<List<Ticket>> = ticketsRepository.tickets
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    init {
        loadTickets()
    }
    
    private fun loadTickets() {
        viewModelScope.launch {
            _isLoading.value = true
            ticketsRepository.fetchTickets()
            _isLoading.value = false
        }
    }
    
    fun createTicket(subject: String, message: String, priority: String) {
        viewModelScope.launch {
            _isLoading.value = true
            ticketsRepository.createTicket(subject, message, priority)
            _isLoading.value = false
        }
    }
    
    fun refresh() {
        loadTickets()
    }
}
