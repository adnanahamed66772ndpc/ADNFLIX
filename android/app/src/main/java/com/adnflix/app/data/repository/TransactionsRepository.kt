package com.adnflix.app.data.repository

import com.adnflix.app.data.model.CreateTransactionRequest
import com.adnflix.app.data.model.Transaction
import com.adnflix.app.data.model.TransactionStatus
import com.adnflix.app.data.remote.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TransactionsRepository @Inject constructor(
    private val apiService: ApiService
) {
    private val _transactions = MutableStateFlow<List<Transaction>>(emptyList())
    val transactions: StateFlow<List<Transaction>> = _transactions.asStateFlow()
    
    suspend fun fetchTransactions(): Result<List<Transaction>> {
        return try {
            val response = apiService.getTransactions()
            if (response.isSuccessful && response.body() != null) {
                val transactions = response.body()!!
                _transactions.value = transactions
                Result.success(transactions)
            } else {
                Result.failure(Exception("Failed to fetch transactions"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createTransaction(
        planId: String,
        paymentMethod: String,
        transactionId: String,
        amount: Double,
        senderNumber: String?
    ): Result<Unit> {
        return try {
            val response = apiService.createTransaction(
                CreateTransactionRequest(planId, paymentMethod, transactionId, amount, senderNumber)
            )
            if (response.isSuccessful) {
                fetchTransactions() // Refresh list
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to create transaction"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun getPendingTransactions(): List<Transaction> {
        return _transactions.value.filter { it.status == TransactionStatus.PENDING }
    }
    
    fun getApprovedTransactions(): List<Transaction> {
        return _transactions.value.filter { it.status == TransactionStatus.APPROVED }
    }
    
    fun clearTransactions() {
        _transactions.value = emptyList()
    }
}
