package com.adnflix.app.data.repository

import com.adnflix.app.data.local.TokenManager
import com.adnflix.app.data.model.*
import com.adnflix.app.data.remote.ApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()
    
    val isLoggedIn: Flow<Boolean> = tokenManager.isLoggedIn
    
    suspend fun login(email: String, password: String): Result<User> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                tokenManager.saveToken(
                    token = authResponse.token,
                    userId = authResponse.user.id,
                    email = authResponse.user.email
                )
                _currentUser.value = authResponse.user
                Result.success(authResponse.user)
            } else {
                val errorBody = response.errorBody()?.string()
                Result.failure(Exception(errorBody ?: "Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun register(email: String, password: String, displayName: String): Result<User> {
        return try {
            val response = apiService.register(RegisterRequest(email, password, displayName))
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                tokenManager.saveToken(
                    token = authResponse.token,
                    userId = authResponse.user.id,
                    email = authResponse.user.email
                )
                _currentUser.value = authResponse.user
                Result.success(authResponse.user)
            } else {
                val errorBody = response.errorBody()?.string()
                Result.failure(Exception(errorBody ?: "Registration failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout() {
        try {
            apiService.logout()
        } catch (_: Exception) {
            // Ignore logout errors
        }
        tokenManager.clearToken()
        _currentUser.value = null
    }
    
    suspend fun getCurrentUser(): Result<User> {
        return try {
            val response = apiService.getCurrentUser()
            if (response.isSuccessful && response.body() != null) {
                val user = response.body()!!
                _currentUser.value = user
                Result.success(user)
            } else {
                Result.failure(Exception("Failed to get user"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateProfile(displayName: String?, avatarUrl: String?): Result<Unit> {
        return try {
            val response = apiService.updateProfile(UpdateProfileRequest(displayName, avatarUrl))
            if (response.isSuccessful) {
                // Refresh user data
                getCurrentUser()
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to update profile"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
