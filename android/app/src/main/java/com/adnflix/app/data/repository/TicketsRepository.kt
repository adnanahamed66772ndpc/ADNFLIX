package com.adnflix.app.data.repository

import com.adnflix.app.data.model.AddReplyRequest
import com.adnflix.app.data.model.CreateTicketRequest
import com.adnflix.app.data.model.Ticket
import com.adnflix.app.data.remote.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TicketsRepository @Inject constructor(
    private val apiService: ApiService
) {
    private val _tickets = MutableStateFlow<List<Ticket>>(emptyList())
    val tickets: StateFlow<List<Ticket>> = _tickets.asStateFlow()
    
    suspend fun fetchTickets(): Result<List<Ticket>> {
        return try {
            val response = apiService.getTickets()
            if (response.isSuccessful && response.body() != null) {
                val tickets = response.body()!!
                _tickets.value = tickets
                Result.success(tickets)
            } else {
                Result.failure(Exception("Failed to fetch tickets"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getTicketById(id: String): Result<Ticket> {
        return try {
            val response = apiService.getTicketById(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Ticket not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createTicket(subject: String, message: String, priority: String): Result<Unit> {
        return try {
            val response = apiService.createTicket(CreateTicketRequest(subject, message, priority))
            if (response.isSuccessful) {
                fetchTickets() // Refresh list
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to create ticket"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun addReply(ticketId: String, message: String): Result<Unit> {
        return try {
            val response = apiService.addReply(ticketId, AddReplyRequest(message))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to add reply"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun clearTickets() {
        _tickets.value = emptyList()
    }
}
