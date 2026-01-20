package com.adnflix.app.ui.screens.browse

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.adnflix.app.data.model.TitleType
import com.adnflix.app.ui.components.TitleCard
import com.adnflix.app.ui.theme.Background
import com.adnflix.app.ui.theme.Primary
import com.adnflix.app.ui.theme.TextSecondary
import com.adnflix.app.ui.viewmodel.HomeViewModel

enum class BrowseFilter(val label: String) {
    ALL("All"),
    MOVIES("Movies"),
    SERIES("Series")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BrowseScreen(
    onTitleClick: (String) -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    var selectedFilter by remember { mutableStateOf(BrowseFilter.ALL) }
    
    val titles by viewModel.titles.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    
    val filteredTitles = when (selectedFilter) {
        BrowseFilter.ALL -> titles
        BrowseFilter.MOVIES -> titles.filter { it.type == TitleType.MOVIE }
        BrowseFilter.SERIES -> titles.filter { it.type == TitleType.SERIES }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Browse",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 24.sp
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Background
                )
            )
        },
        containerColor = Background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Filter Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                BrowseFilter.entries.forEach { filter ->
                    FilterChip(
                        selected = selectedFilter == filter,
                        onClick = { selectedFilter = filter },
                        label = { Text(filter.label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Primary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
            
            if (isLoading && titles.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Primary)
                }
            } else if (filteredTitles.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No titles found",
                        color = TextSecondary
                    )
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Adaptive(minSize = 140.dp),
                    contentPadding = PaddingValues(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(filteredTitles) { title ->
                        TitleCard(
                            title = title,
                            onClick = { onTitleClick(title.id) },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}
