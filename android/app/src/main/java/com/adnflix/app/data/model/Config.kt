package com.adnflix.app.data.model

import com.google.gson.annotations.SerializedName

data class AppConfig(
    val plans: List<SubscriptionPlanInfo>,
    @SerializedName("paymentMethods")
    val paymentMethods: List<PaymentMethod>,
    @SerializedName("appVersion")
    val appVersion: String,
    @SerializedName("minAppVersion")
    val minAppVersion: String,
    @SerializedName("maintenanceMode")
    val maintenanceMode: Boolean
)

data class SubscriptionPlanInfo(
    val id: String,
    val name: String,
    val price: Double,
    val currency: String = "BDT",
    val interval: String,
    @SerializedName("hasAds")
    val hasAds: Boolean,
    val popular: Boolean = false,
    val features: List<String>
)

data class PaymentMethod(
    val id: String,
    val name: String,
    val logo: String,
    val color: String,
    val number: String,
    val instructions: List<String>
)

data class PageContent(
    val key: String,
    val title: String,
    val content: String,
    @SerializedName("updated_at")
    val updatedAt: String
)
