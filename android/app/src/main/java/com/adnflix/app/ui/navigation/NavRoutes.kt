package com.adnflix.app.ui.navigation

sealed class NavRoutes(val route: String) {
    // Main tabs
    object Home : NavRoutes("home")
    object Browse : NavRoutes("browse")
    object Watchlist : NavRoutes("watchlist")
    object Account : NavRoutes("account")
    
    // Auth
    object Login : NavRoutes("login")
    object Register : NavRoutes("register")
    
    // Content
    object TitleDetails : NavRoutes("title/{titleId}") {
        fun createRoute(titleId: String) = "title/$titleId"
    }
    object Watch : NavRoutes("watch/{titleId}?episodeId={episodeId}") {
        fun createRoute(titleId: String, episodeId: String? = null): String {
            return if (episodeId != null) {
                "watch/$titleId?episodeId=$episodeId"
            } else {
                "watch/$titleId"
            }
        }
    }
    
    // Subscription
    object Subscription : NavRoutes("subscription")
    object PaymentConfirm : NavRoutes("payment/{planId}/{methodId}") {
        fun createRoute(planId: String, methodId: String) = "payment/$planId/$methodId"
    }
    
    // Support
    object Help : NavRoutes("help")
    object TicketDetail : NavRoutes("ticket/{ticketId}") {
        fun createRoute(ticketId: String) = "ticket/$ticketId"
    }
    
    // Static Pages
    object Terms : NavRoutes("terms")
    object Privacy : NavRoutes("privacy")
    
    // Search
    object Search : NavRoutes("search")
}
