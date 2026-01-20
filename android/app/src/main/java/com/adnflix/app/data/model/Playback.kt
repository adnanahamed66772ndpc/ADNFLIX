package com.adnflix.app.data.model

import com.google.gson.annotations.SerializedName

data class PlaybackProgress(
    @SerializedName("titleId")
    val titleId: String,
    @SerializedName("episodeId")
    val episodeId: String?,
    @SerializedName("progressSeconds")
    val progressSeconds: Int,
    @SerializedName("durationSeconds")
    val durationSeconds: Int,
    @SerializedName("updatedAt")
    val updatedAt: String
) {
    val progressPercent: Float
        get() = if (durationSeconds > 0) {
            (progressSeconds.toFloat() / durationSeconds.toFloat()) * 100f
        } else 0f
    
    val isCompleted: Boolean
        get() = progressPercent >= 95f
    
    val shouldContinue: Boolean
        get() = progressPercent >= 5f && progressPercent < 95f
}

data class UpdatePlaybackRequest(
    val titleId: String,
    val episodeId: String? = null,
    val progressSeconds: Int,
    val durationSeconds: Int
)
