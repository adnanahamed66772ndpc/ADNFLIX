package com.adnflix.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.adnflix.app.ui.navigation.ADNFlixNavHost
import com.adnflix.app.ui.theme.ADNFlixTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        setContent {
            ADNFlixTheme {
                Surface(
                    modifier = Modifier.fillMaxSize()
                ) {
                    ADNFlixNavHost()
                }
            }
        }
    }
}
