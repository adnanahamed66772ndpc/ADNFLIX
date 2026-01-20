package com.adnflix.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adnflix.app.data.model.PaymentMethod
import com.adnflix.app.data.model.SubscriptionPlanInfo
import com.adnflix.app.data.repository.ConfigRepository
import com.adnflix.app.data.repository.TransactionsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SubscriptionViewModel @Inject constructor(
    private val configRepository: ConfigRepository,
    private val transactionsRepository: TransactionsRepository
) : ViewModel() {
    
    val plans: StateFlow<List<SubscriptionPlanInfo>> = configRepository.plans
    val paymentMethods: StateFlow<List<PaymentMethod>> = configRepository.paymentMethods
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _selectedPlan = MutableStateFlow<SubscriptionPlanInfo?>(null)
    val selectedPlan: StateFlow<SubscriptionPlanInfo?> = _selectedPlan.asStateFlow()
    
    private val _selectedPaymentMethod = MutableStateFlow<PaymentMethod?>(null)
    val selectedPaymentMethod: StateFlow<PaymentMethod?> = _selectedPaymentMethod.asStateFlow()
    
    private val _showPaymentDialog = MutableStateFlow(false)
    val showPaymentDialog: StateFlow<Boolean> = _showPaymentDialog.asStateFlow()
    
    init {
        loadConfig()
    }
    
    private fun loadConfig() {
        viewModelScope.launch {
            _isLoading.value = true
            configRepository.fetchConfig()
            _isLoading.value = false
        }
    }
    
    fun selectPlan(plan: SubscriptionPlanInfo) {
        _selectedPlan.value = plan
        // Reset payment method when plan changes
        if (plan.price == 0.0) {
            _selectedPaymentMethod.value = null
        }
    }
    
    fun selectPaymentMethod(method: PaymentMethod) {
        _selectedPaymentMethod.value = method
    }
    
    fun showPaymentConfirmation() {
        _showPaymentDialog.value = true
    }
    
    fun hidePaymentConfirmation() {
        _showPaymentDialog.value = false
    }
    
    fun submitPayment(transactionId: String, senderNumber: String, onSuccess: () -> Unit) {
        val plan = _selectedPlan.value ?: return
        val method = _selectedPaymentMethod.value ?: return
        
        viewModelScope.launch {
            _isLoading.value = true
            
            transactionsRepository.createTransaction(
                planId = plan.id,
                paymentMethod = method.id,
                transactionId = transactionId,
                amount = plan.price,
                senderNumber = senderNumber
            ).fold(
                onSuccess = {
                    _showPaymentDialog.value = false
                    onSuccess()
                },
                onFailure = {
                    // Handle error
                }
            )
            
            _isLoading.value = false
        }
    }
}
