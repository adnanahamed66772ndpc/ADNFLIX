package com.adnflix.app.ui.screens.title

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.adnflix.app.data.model.Episode
import com.adnflix.app.data.model.Title
import com.adnflix.app.data.model.TitleType
import com.adnflix.app.ui.theme.*
import com.adnflix.app.ui.viewmodel.TitleDetailsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TitleDetailsScreen(
    titleId: String,
    onBackClick: () -> Unit,
    onPlayClick: (episodeId: String?) -> Unit,
    viewModel: TitleDetailsViewModel = hiltViewModel()
) {
    LaunchedEffect(titleId) {
        viewModel.loadTitle(titleId)
    }
    
    val title by viewModel.title.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isInWatchlist by viewModel.isInWatchlist.collectAsState()
    var selectedSeasonIndex by remember { mutableIntStateOf(0) }
    
    Scaffold(
        containerColor = Background
    ) { paddingValues ->
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Primary)
            }
        } else if (title != null) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Hero Image with Gradient
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(300.dp)
                    ) {
                        AsyncImage(
                            model = title!!.backdropUrl ?: title!!.posterUrl,
                            contentDescription = title!!.name,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                        
                        // Gradient overlay
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(
                                            Color.Transparent,
                                            Background
                                        ),
                                        startY = 100f
                                    )
                                )
                        )
                        
                        // Back button
                        IconButton(
                            onClick = onBackClick,
                            modifier = Modifier
                                .padding(16.dp)
                                .align(Alignment.TopStart)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = Color.White
                            )
                        }
                    }
                }
                
                // Title Info
                item {
                    Column(
                        modifier = Modifier.padding(horizontal = 16.dp)
                    ) {
                        Text(
                            text = title!!.name,
                            style = MaterialTheme.typography.headlineMedium,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Meta info
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "${title!!.year}",
                                color = TextSecondary,
                                fontSize = 14.sp
                            )
                            Text(
                                text = title!!.maturity,
                                modifier = Modifier
                                    .background(TextMuted.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp),
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                            if (title!!.duration != null) {
                                Text(
                                    text = "${title!!.duration} min",
                                    color = TextSecondary,
                                    fontSize = 14.sp
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Filled.Star,
                                    contentDescription = null,
                                    tint = Warning,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = String.format("%.1f", title!!.rating),
                                    color = TextSecondary,
                                    fontSize = 14.sp
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Play Button
                        Button(
                            onClick = {
                                if (title!!.type == TitleType.SERIES) {
                                    val firstEpisode = title!!.seasons.firstOrNull()?.episodes?.firstOrNull()
                                    onPlayClick(firstEpisode?.id)
                                } else {
                                    onPlayClick(null)
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.PlayArrow,
                                contentDescription = null,
                                tint = Color.Black
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Play",
                                color = Color.Black,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Watchlist Button
                        OutlinedButton(
                            onClick = { viewModel.toggleWatchlist() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            border = ButtonDefaults.outlinedButtonBorder
                        ) {
                            Icon(
                                imageVector = if (isInWatchlist) Icons.Filled.Check else Icons.Filled.Add,
                                contentDescription = null,
                                tint = Color.White
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isInWatchlist) "In My List" else "Add to My List",
                                color = Color.White
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Synopsis
                        if (!title!!.synopsis.isNullOrBlank()) {
                            Text(
                                text = title!!.synopsis!!,
                                color = TextSecondary,
                                fontSize = 14.sp,
                                lineHeight = 20.sp
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                        
                        // Genres
                        if (title!!.genres.isNotEmpty()) {
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(title!!.genres) { genre ->
                                    SuggestionChip(
                                        onClick = {},
                                        label = { Text(genre) },
                                        colors = SuggestionChipDefaults.suggestionChipColors(
                                            containerColor = Card
                                        )
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                        
                        // Cast
                        if (title!!.cast.isNotEmpty()) {
                            Text(
                                text = "Cast: ${title!!.cast.take(5).joinToString(", ")}",
                                color = TextMuted,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
                
                // Episodes (for series)
                if (title!!.type == TitleType.SERIES && title!!.seasons.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        // Season Selector
                        if (title!!.seasons.size > 1) {
                            LazyRow(
                                modifier = Modifier.padding(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(title!!.seasons.size) { index ->
                                    val season = title!!.seasons[index]
                                    FilterChip(
                                        selected = selectedSeasonIndex == index,
                                        onClick = { selectedSeasonIndex = index },
                                        label = { 
                                            Text(season.name ?: "Season ${season.seasonNumber}") 
                                        },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = Primary
                                        )
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                    
                    // Episodes List
                    val episodes = title!!.seasons.getOrNull(selectedSeasonIndex)?.episodes ?: emptyList()
                    items(episodes) { episode ->
                        EpisodeCard(
                            episode = episode,
                            onClick = { onPlayClick(episode.id) }
                        )
                    }
                }
                
                // Bottom spacing
                item {
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
    }
}

@Composable
private fun EpisodeCard(
    episode: Episode,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = Card),
        shape = RoundedCornerShape(8.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Thumbnail
            Box(
                modifier = Modifier
                    .width(120.dp)
                    .height(68.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Surface)
            ) {
                if (episode.thumbnailUrl != null) {
                    AsyncImage(
                        model = episode.thumbnailUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                
                // Play icon overlay
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.3f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.PlayCircle,
                        contentDescription = "Play",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${episode.episodeNumber}. ${episode.name}",
                    color = Color.White,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (!episode.synopsis.isNullOrBlank()) {
                    Text(
                        text = episode.synopsis,
                        color = TextMuted,
                        fontSize = 12.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Text(
                    text = "${episode.duration} min",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }
        }
    }
}
