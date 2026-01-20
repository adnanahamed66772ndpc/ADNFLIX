package com.adnflix.app.ui.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import com.adnflix.app.ui.components.TitleCardLarge
import com.adnflix.app.ui.components.TitleRow
import com.adnflix.app.ui.theme.Background
import com.adnflix.app.ui.theme.Primary
import com.adnflix.app.ui.viewmodel.HomeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onTitleClick: (String) -> Unit,
    onSearchClick: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    
    LaunchedEffect(Unit) {
        (context as? ComponentActivity)?.enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Background.toArgb()),
            navigationBarStyle = SystemBarStyle.dark(Background.toArgb())
        )
    }
    
    val titles by viewModel.titles.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val featuredTitle by viewModel.featuredTitle.collectAsState()
    val continueWatching by viewModel.continueWatching.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "ADNFLIX",
                        color = Primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 24.sp,
                        letterSpacing = 3.sp
                    )
                },
                actions = {
                    IconButton(onClick = onSearchClick) {
                        Icon(
                            imageVector = Icons.Filled.Search,
                            contentDescription = "Search",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Background
                )
            )
        },
        containerColor = Background
    ) { paddingValues ->
        if (isLoading && titles.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Primary)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Featured Title
                item {
                    featuredTitle?.let { title ->
                        TitleCardLarge(
                            title = title,
                            onClick = { onTitleClick(title.id) },
                            onPlayClick = { onTitleClick(title.id) },
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
                
                // Continue Watching
                if (continueWatching.isNotEmpty()) {
                    item {
                        TitleRow(
                            title = "Continue Watching",
                            titles = continueWatching,
                            onTitleClick = onTitleClick,
                            showProgress = true
                        )
                    }
                }
                
                // Trending Now
                item {
                    TitleRow(
                        title = "Trending Now",
                        titles = viewModel.getTrendingTitles(),
                        onTitleClick = onTitleClick
                    )
                }
                
                // New Releases
                item {
                    TitleRow(
                        title = "New Releases",
                        titles = viewModel.getNewReleases(),
                        onTitleClick = onTitleClick
                    )
                }
                
                // Movies
                item {
                    TitleRow(
                        title = "Movies",
                        titles = viewModel.getMovies(),
                        onTitleClick = onTitleClick
                    )
                }
                
                // Series
                item {
                    TitleRow(
                        title = "TV Series",
                        titles = viewModel.getSeries(),
                        onTitleClick = onTitleClick
                    )
                }
                
                // Bottom spacing
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}
