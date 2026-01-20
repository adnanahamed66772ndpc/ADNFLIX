package com.adnflix.app.data.model

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val email: String,
    @SerializedName("displayName")
    val displayName: String?,
    @SerializedName("avatarUrl")
    val avatarUrl: String?,
    @SerializedName("subscriptionPlan")
    val subscriptionPlan: SubscriptionPlan = SubscriptionPlan.FREE,
    @SerializedName("subscriptionExpiresAt")
    val subscriptionExpiresAt: String?,
    val roles: List<String> = emptyList(),
    @SerializedName("createdAt")
    val createdAt: String?
) {
    val isAdmin: Boolean
        get() = roles.contains("admin")
    
    val isPremium: Boolean
        get() = subscriptionPlan == SubscriptionPlan.PREMIUM
    
    val hasAds: Boolean
        get() = subscriptionPlan != SubscriptionPlan.PREMIUM
}

enum class SubscriptionPlan {
    @SerializedName("free")
    FREE,
    @SerializedName("with-ads")
    WITH_ADS,
    @SerializedName("premium")
    PREMIUM
}

data class AuthResponse(
    val success: Boolean,
    val token: String,
    val user: User
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val displayName: String
)

data class UpdateProfileRequest(
    val displayName: String? = null,
    val avatarUrl: String? = null
)
