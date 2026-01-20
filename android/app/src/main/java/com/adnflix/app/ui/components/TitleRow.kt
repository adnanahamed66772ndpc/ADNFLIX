package com.adnflix.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.adnflix.app.data.model.Title
import com.adnflix.app.ui.theme.TextSecondary

@Composable
fun TitleRow(
    title: String,
    titles: List<Title>,
    onTitleClick: (String) -> Unit,
    modifier: Modifier = Modifier,
    showProgress: Boolean = false,
    progressMap: Map<String, Float> = emptyMap()
) {
    if (titles.isEmpty()) return
    
    Column(modifier = modifier) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = androidx.compose.ui.graphics.Color.White,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(titles) { titleItem ->
                TitleCard(
                    title = titleItem,
                    onClick = { onTitleClick(titleItem.id) },
                    showProgress = showProgress,
                    progress = progressMap[titleItem.id] ?: 0f
                )
            }
        }
    }
}
