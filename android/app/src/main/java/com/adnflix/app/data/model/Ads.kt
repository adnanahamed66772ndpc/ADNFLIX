package com.adnflix.app.data.model

import com.google.gson.annotations.SerializedName

data class AdSettings(
    val enabled: Boolean,
    @SerializedName("pre_roll")
    val preRoll: Boolean,
    @SerializedName("mid_roll")
    val midRoll: Boolean,
    @SerializedName("mid_roll_interval")
    val midRollInterval: Int, // in seconds
    @SerializedName("skip_after")
    val skipAfter: Int // seconds before skip button appears
)

data class AdVideo(
    val id: String,
    val title: String,
    @SerializedName("video_url")
    val videoUrl: String,
    @SerializedName("click_url")
    val clickUrl: String?,
    val duration: Int, // in seconds
    val type: String // pre-roll, mid-roll, post-roll
)

data class TrackImpressionRequest(
    @SerializedName("ad_id")
    val adId: String,
    val type: String, // impression or click
    @SerializedName("user_id")
    val userId: String? = null
)
