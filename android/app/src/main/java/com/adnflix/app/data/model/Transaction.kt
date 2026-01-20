package com.adnflix.app.data.model

import com.google.gson.annotations.SerializedName

data class Transaction(
    val id: String,
    @SerializedName("orderId")
    val orderId: String,
    @SerializedName("userId")
    val userId: String,
    @SerializedName("planId")
    val planId: String,
    @SerializedName("paymentMethod")
    val paymentMethod: String,
    @SerializedName("transactionId")
    val transactionId: String,
    @SerializedName("senderNumber")
    val senderNumber: String?,
    val amount: Double,
    val status: TransactionStatus,
    @SerializedName("rejectionReason")
    val rejectionReason: String?,
    @SerializedName("processedAt")
    val processedAt: String?,
    @SerializedName("createdAt")
    val createdAt: String
)

enum class TransactionStatus {
    @SerializedName("pending")
    PENDING,
    @SerializedName("approved")
    APPROVED,
    @SerializedName("rejected")
    REJECTED
}

data class CreateTransactionRequest(
    val planId: String,
    val paymentMethod: String,
    val transactionId: String,
    val amount: Double,
    val senderNumber: String?
)
