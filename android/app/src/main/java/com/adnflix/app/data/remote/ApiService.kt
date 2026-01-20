package com.adnflix.app.data.remote

import com.adnflix.app.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ==================== AUTH ====================
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @POST("auth/logout")
    suspend fun logout(): Response<Unit>
    
    @GET("auth/me")
    suspend fun getCurrentUser(): Response<User>
    
    @PUT("auth/profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): Response<Unit>

    // ==================== TITLES ====================
    
    @GET("titles")
    suspend fun getTitles(
        @Query("type") type: String? = null,
        @Query("search") search: String? = null
    ): Response<List<Title>>
    
    @GET("titles/{id}")
    suspend fun getTitleById(@Path("id") id: String): Response<Title>

    // ==================== CATEGORIES ====================
    
    @GET("categories")
    suspend fun getCategories(): Response<List<Category>>
    
    @GET("categories/{id}")
    suspend fun getCategoryById(@Path("id") id: String): Response<Category>

    // ==================== WATCHLIST ====================
    
    @GET("watchlist")
    suspend fun getWatchlist(): Response<List<WatchlistItem>>
    
    @POST("watchlist")
    suspend fun addToWatchlist(@Body request: AddToWatchlistRequest): Response<Unit>
    
    @DELETE("watchlist/{titleId}")
    suspend fun removeFromWatchlist(@Path("titleId") titleId: String): Response<Unit>

    // ==================== PLAYBACK ====================
    
    @GET("playback")
    suspend fun getPlaybackProgress(): Response<List<PlaybackProgress>>
    
    @POST("playback")
    suspend fun updatePlaybackProgress(@Body request: UpdatePlaybackRequest): Response<Unit>
    
    @GET("playback/{titleId}")
    suspend fun getProgressForTitle(@Path("titleId") titleId: String): Response<PlaybackProgress>
    
    @GET("playback/movie/{titleId}")
    suspend fun getMovieProgress(@Path("titleId") titleId: String): Response<PlaybackProgress>
    
    @DELETE("playback/movie/{titleId}")
    suspend fun deleteMovieProgress(@Path("titleId") titleId: String): Response<Unit>
    
    @GET("playback/series/{titleId}")
    suspend fun getSeriesProgress(@Path("titleId") titleId: String): Response<List<PlaybackProgress>>
    
    @DELETE("playback/series/{titleId}")
    suspend fun deleteSeriesProgress(@Path("titleId") titleId: String): Response<Unit>

    // ==================== TRANSACTIONS ====================
    
    @GET("transactions")
    suspend fun getTransactions(): Response<List<Transaction>>
    
    @POST("transactions")
    suspend fun createTransaction(@Body request: CreateTransactionRequest): Response<Unit>

    // ==================== ADS ====================
    
    @GET("ads/settings")
    suspend fun getAdSettings(): Response<AdSettings>
    
    @GET("ads/videos/active")
    suspend fun getActiveAds(): Response<List<AdVideo>>
    
    @POST("ads/impressions")
    suspend fun trackImpression(@Body request: TrackImpressionRequest): Response<Unit>

    // ==================== TICKETS ====================
    
    @GET("tickets")
    suspend fun getTickets(): Response<List<Ticket>>
    
    @GET("tickets/{id}")
    suspend fun getTicketById(@Path("id") id: String): Response<Ticket>
    
    @POST("tickets")
    suspend fun createTicket(@Body request: CreateTicketRequest): Response<Unit>
    
    @POST("tickets/{id}/replies")
    suspend fun addReply(
        @Path("id") id: String,
        @Body request: AddReplyRequest
    ): Response<Unit>

    // ==================== PAGES ====================
    
    @GET("pages/{key}")
    suspend fun getPageContent(@Path("key") key: String): Response<PageContent>

    // ==================== CONFIG ====================
    
    @GET("config")
    suspend fun getConfig(): Response<AppConfig>
    
    @GET("config/plans")
    suspend fun getPlans(): Response<List<SubscriptionPlanInfo>>
    
    @GET("config/payment-methods")
    suspend fun getPaymentMethods(): Response<List<PaymentMethod>>
}
