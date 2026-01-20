package com.adnflix.app.data.model

import com.google.gson.annotations.SerializedName

data class Ticket(
    val id: String,
    val subject: String,
    val message: String,
    val status: TicketStatus,
    val priority: TicketPriority,
    @SerializedName("created_at")
    val createdAt: String,
    @SerializedName("reply_count")
    val replyCount: Int = 0,
    val replies: List<TicketReply> = emptyList()
)

data class TicketReply(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    val message: String,
    @SerializedName("is_admin")
    val isAdmin: Boolean,
    @SerializedName("created_at")
    val createdAt: String
)

enum class TicketStatus {
    @SerializedName("open")
    OPEN,
    @SerializedName("in_progress")
    IN_PROGRESS,
    @SerializedName("resolved")
    RESOLVED,
    @SerializedName("closed")
    CLOSED
}

enum class TicketPriority {
    @SerializedName("low")
    LOW,
    @SerializedName("medium")
    MEDIUM,
    @SerializedName("high")
    HIGH,
    @SerializedName("urgent")
    URGENT
}

data class CreateTicketRequest(
    val subject: String,
    val message: String,
    val priority: String = "medium"
)

data class AddReplyRequest(
    val message: String
)
