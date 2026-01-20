package com.adnflix.app.data.model

import com.google.gson.annotations.SerializedName

data class Title(
    val id: String,
    val type: TitleType,
    val name: String,
    val synopsis: String?,
    val year: Int,
    val language: String,
    val maturity: String,
    val premium: Boolean,
    @SerializedName("posterUrl")
    val posterUrl: String?,
    @SerializedName("backdropUrl")
    val backdropUrl: String?,
    @SerializedName("trailerUrl")
    val trailerUrl: String?,
    @SerializedName("videoUrl")
    val videoUrl: String?,
    val duration: Int?, // in minutes
    val rating: Float,
    val genres: List<String>,
    val cast: List<String>,
    @SerializedName("audioTracks")
    val audioTracks: List<AudioTrack>,
    val trending: Boolean,
    @SerializedName("newRelease")
    val newRelease: Boolean,
    @SerializedName("createdAt")
    val createdAt: String,
    val seasons: List<Season> = emptyList()
)

enum class TitleType {
    @SerializedName("movie")
    MOVIE,
    @SerializedName("series")
    SERIES
}

data class Season(
    val id: String,
    @SerializedName("seasonNumber")
    val seasonNumber: Int,
    val name: String?,
    val episodes: List<Episode>
)

data class Episode(
    val id: String,
    @SerializedName("episodeNumber")
    val episodeNumber: Int,
    val name: String,
    val synopsis: String?,
    val duration: Int, // in minutes
    @SerializedName("thumbnailUrl")
    val thumbnailUrl: String?,
    @SerializedName("videoUrl")
    val videoUrl: String?,
    @SerializedName("audioTracks")
    val audioTracks: List<AudioTrack> = emptyList()
)

data class AudioTrack(
    val id: Int,
    val lang: String,
    val name: String,
    val url: String? = null
)

data class Category(
    val id: String,
    val name: String,
    val description: String?,
    @SerializedName("created_at")
    val createdAt: String
)
