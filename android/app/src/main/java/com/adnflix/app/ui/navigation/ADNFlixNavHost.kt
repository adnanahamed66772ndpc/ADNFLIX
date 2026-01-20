package com.adnflix.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.adnflix.app.ui.screens.auth.LoginScreen
import com.adnflix.app.ui.screens.auth.RegisterScreen
import com.adnflix.app.ui.screens.home.HomeScreen
import com.adnflix.app.ui.screens.browse.BrowseScreen
import com.adnflix.app.ui.screens.watchlist.WatchlistScreen
import com.adnflix.app.ui.screens.account.AccountScreen
import com.adnflix.app.ui.screens.title.TitleDetailsScreen
import com.adnflix.app.ui.screens.player.WatchScreen
import com.adnflix.app.ui.screens.subscription.SubscriptionScreen
import com.adnflix.app.ui.screens.help.HelpScreen
import com.adnflix.app.ui.screens.search.SearchScreen
import com.adnflix.app.ui.components.BottomNavBar
import com.adnflix.app.ui.viewmodel.AuthViewModel

@Composable
fun ADNFlixNavHost() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState(initial = false)
    
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    
    // Hide bottom bar on certain screens
    val hideBottomBar = currentRoute?.startsWith("watch/") == true ||
            currentRoute == NavRoutes.Login.route ||
            currentRoute == NavRoutes.Register.route
    
    Scaffold(
        bottomBar = {
            if (!hideBottomBar) {
                BottomNavBar(
                    navController = navController,
                    currentRoute = currentRoute
                )
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = NavRoutes.Home.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            // Main Tabs
            composable(NavRoutes.Home.route) {
                HomeScreen(
                    onTitleClick = { titleId ->
                        navController.navigate(NavRoutes.TitleDetails.createRoute(titleId))
                    },
                    onSearchClick = {
                        navController.navigate(NavRoutes.Search.route)
                    }
                )
            }
            
            composable(NavRoutes.Browse.route) {
                BrowseScreen(
                    onTitleClick = { titleId ->
                        navController.navigate(NavRoutes.TitleDetails.createRoute(titleId))
                    }
                )
            }
            
            composable(NavRoutes.Watchlist.route) {
                WatchlistScreen(
                    onTitleClick = { titleId ->
                        navController.navigate(NavRoutes.TitleDetails.createRoute(titleId))
                    },
                    onLoginClick = {
                        navController.navigate(NavRoutes.Login.route)
                    }
                )
            }
            
            composable(NavRoutes.Account.route) {
                AccountScreen(
                    onLoginClick = {
                        navController.navigate(NavRoutes.Login.route)
                    },
                    onSubscriptionClick = {
                        navController.navigate(NavRoutes.Subscription.route)
                    },
                    onHelpClick = {
                        navController.navigate(NavRoutes.Help.route)
                    },
                    onLogout = {
                        navController.navigate(NavRoutes.Home.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            
            // Auth
            composable(NavRoutes.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(NavRoutes.Home.route) {
                            popUpTo(NavRoutes.Login.route) { inclusive = true }
                        }
                    },
                    onRegisterClick = {
                        navController.navigate(NavRoutes.Register.route)
                    },
                    onBackClick = {
                        navController.popBackStack()
                    }
                )
            }
            
            composable(NavRoutes.Register.route) {
                RegisterScreen(
                    onRegisterSuccess = {
                        navController.navigate(NavRoutes.Home.route) {
                            popUpTo(NavRoutes.Register.route) { inclusive = true }
                        }
                    },
                    onLoginClick = {
                        navController.popBackStack()
                    },
                    onBackClick = {
                        navController.popBackStack()
                    }
                )
            }
            
            // Title Details
            composable(
                route = NavRoutes.TitleDetails.route,
                arguments = listOf(navArgument("titleId") { type = NavType.StringType })
            ) { backStackEntry ->
                val titleId = backStackEntry.arguments?.getString("titleId") ?: return@composable
                TitleDetailsScreen(
                    titleId = titleId,
                    onBackClick = { navController.popBackStack() },
                    onPlayClick = { episodeId ->
                        navController.navigate(NavRoutes.Watch.createRoute(titleId, episodeId))
                    }
                )
            }
            
            // Watch/Player
            composable(
                route = NavRoutes.Watch.route,
                arguments = listOf(
                    navArgument("titleId") { type = NavType.StringType },
                    navArgument("episodeId") { 
                        type = NavType.StringType
                        nullable = true
                        defaultValue = null
                    }
                )
            ) { backStackEntry ->
                val titleId = backStackEntry.arguments?.getString("titleId") ?: return@composable
                val episodeId = backStackEntry.arguments?.getString("episodeId")
                WatchScreen(
                    titleId = titleId,
                    episodeId = episodeId,
                    onBackClick = { navController.popBackStack() },
                    onNextEpisode = { nextEpisodeId ->
                        navController.navigate(NavRoutes.Watch.createRoute(titleId, nextEpisodeId)) {
                            popUpTo(NavRoutes.Watch.route) { inclusive = true }
                        }
                    }
                )
            }
            
            // Subscription
            composable(NavRoutes.Subscription.route) {
                SubscriptionScreen(
                    onBackClick = { navController.popBackStack() },
                    onPaymentSuccess = {
                        navController.navigate(NavRoutes.Account.route) {
                            popUpTo(NavRoutes.Subscription.route) { inclusive = true }
                        }
                    }
                )
            }
            
            // Help
            composable(NavRoutes.Help.route) {
                HelpScreen(
                    onBackClick = { navController.popBackStack() },
                    onTicketClick = { ticketId ->
                        navController.navigate(NavRoutes.TicketDetail.createRoute(ticketId))
                    }
                )
            }
            
            // Search
            composable(NavRoutes.Search.route) {
                SearchScreen(
                    onBackClick = { navController.popBackStack() },
                    onTitleClick = { titleId ->
                        navController.navigate(NavRoutes.TitleDetails.createRoute(titleId))
                    }
                )
            }
        }
    }
}
