package com.adnflix.app.data.model

import com.google.gson.annotations.SerializedName

data class WatchlistItem(
    val id: String,
    @SerializedName("titleId")
    val titleId: String,
    @SerializedName("addedAt")
    val addedAt: String
)

data class AddToWatchlistRequest(
    val titleId: String
)
