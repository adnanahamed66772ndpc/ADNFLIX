package com.adnflix.app.data.repository

import com.adnflix.app.data.model.AppConfig
import com.adnflix.app.data.model.PageContent
import com.adnflix.app.data.model.PaymentMethod
import com.adnflix.app.data.model.SubscriptionPlanInfo
import com.adnflix.app.data.remote.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ConfigRepository @Inject constructor(
    private val apiService: ApiService
) {
    private val _config = MutableStateFlow<AppConfig?>(null)
    val config: StateFlow<AppConfig?> = _config.asStateFlow()
    
    private val _plans = MutableStateFlow<List<SubscriptionPlanInfo>>(emptyList())
    val plans: StateFlow<List<SubscriptionPlanInfo>> = _plans.asStateFlow()
    
    private val _paymentMethods = MutableStateFlow<List<PaymentMethod>>(emptyList())
    val paymentMethods: StateFlow<List<PaymentMethod>> = _paymentMethods.asStateFlow()
    
    suspend fun fetchConfig(): Result<AppConfig> {
        return try {
            val response = apiService.getConfig()
            if (response.isSuccessful && response.body() != null) {
                val config = response.body()!!
                _config.value = config
                _plans.value = config.plans
                _paymentMethods.value = config.paymentMethods
                Result.success(config)
            } else {
                Result.failure(Exception("Failed to fetch config"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getPageContent(key: String): Result<PageContent> {
        return try {
            val response = apiService.getPageContent(key)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Page not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun isMaintenanceMode(): Boolean = _config.value?.maintenanceMode == true
    
    fun getPlanById(id: String): SubscriptionPlanInfo? = _plans.value.find { it.id == id }
    
    fun getPaymentMethodById(id: String): PaymentMethod? = _paymentMethods.value.find { it.id == id }
}
