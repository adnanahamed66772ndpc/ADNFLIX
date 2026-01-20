# ADNFLIX Android App

A complete Android streaming application built with Kotlin, Jetpack Compose, and ExoPlayer. This app provides the same features as the ADNFLIX web application.

## Features

- **User Authentication**: Login, registration, and profile management
- **Content Browsing**: Browse movies and TV series with categories, search, and filters
- **Video Playback**: Custom video player with HLS streaming support
- **Multi-Audio Support**: Switch between different audio tracks (Bengali, English, Hindi, etc.)
- **Playback Progress**: Resume watching from where you left off
- **My List**: Save titles to your watchlist
- **Subscription Management**: View and upgrade subscription plans
- **Ad Support**: Pre-roll and mid-roll ads for non-premium users
- **Help & Support**: Create and manage support tickets

## Tech Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose (Material 3)
- **Video Player**: ExoPlayer (Media3)
- **Networking**: Retrofit + OkHttp
- **Dependency Injection**: Hilt
- **Local Storage**: DataStore Preferences
- **Image Loading**: Coil
- **Navigation**: Navigation Compose

## Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/adnflix/app/
│   │   │   ├── data/
│   │   │   │   ├── local/          # Local storage (TokenManager)
│   │   │   │   ├── model/          # Data models
│   │   │   │   ├── remote/         # API service and interceptors
│   │   │   │   └── repository/     # Repositories
│   │   │   ├── di/                 # Hilt modules
│   │   │   ├── player/             # Video player components
│   │   │   │   ├── AdPlayer.kt     # Ad playback overlay
│   │   │   │   ├── PlaybackService.kt
│   │   │   │   ├── VideoPlayerControls.kt
│   │   │   │   └── VideoPlayerState.kt
│   │   │   ├── ui/
│   │   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── navigation/     # Navigation setup
│   │   │   │   ├── screens/        # Screen composables
│   │   │   │   ├── theme/          # Material theme
│   │   │   │   └── viewmodel/      # ViewModels
│   │   │   ├── ADNFlixApplication.kt
│   │   │   └── MainActivity.kt
│   │   ├── res/                    # Resources
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## Setup Instructions

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17
- Android SDK 34
- Gradle 8.4+

### Configuration

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd STEMFLIX/android
   ```

2. **Configure API Base URL**
   
   Open `app/build.gradle.kts` and update the API URL:
   
   ```kotlin
   defaultConfig {
       // For production
       buildConfigField("String", "API_BASE_URL", "\"https://your-domain.com/api\"")
   }
   
   buildTypes {
       debug {
           // For local development (10.0.2.2 is Android emulator's localhost)
           buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api\"")
       }
   }
   ```

3. **Sync Gradle**
   
   Open the project in Android Studio and sync Gradle files.

4. **Run the app**
   
   - Connect an Android device or start an emulator
   - Click "Run" or use `./gradlew installDebug`

### Building for Release

1. **Generate a signing key**
   ```bash
   keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias adnflix
   ```

2. **Configure signing in build.gradle.kts**
   ```kotlin
   signingConfigs {
       create("release") {
           storeFile = file("release-key.jks")
           storePassword = "your-password"
           keyAlias = "adnflix"
           keyPassword = "your-password"
       }
   }
   
   buildTypes {
       release {
           signingConfig = signingConfigs.getByName("release")
       }
   }
   ```

3. **Build APK or AAB**
   ```bash
   # APK
   ./gradlew assembleRelease
   
   # Android App Bundle (for Play Store)
   ./gradlew bundleRelease
   ```

## Video Player Features

The custom video player includes:

- **Playback Controls**: Play/pause, seek, 10s skip forward/backward
- **Progress Bar**: Drag to seek with buffering indicator
- **Audio Track Selection**: Switch between available audio languages
- **Auto-hide Controls**: Controls fade after 3 seconds during playback
- **Double-tap to Seek**: Tap left/right side to seek backward/forward
- **Fullscreen**: Landscape-only player with immersive mode
- **Resume Playback**: Automatically resumes from last position
- **Next Episode**: Button to play next episode (for series)
- **Error Handling**: Displays errors with retry option

### Ad Integration

For non-premium users:

- **Pre-roll Ads**: Plays before main content
- **Mid-roll Ads**: Plays at intervals during content (configurable)
- **Skip Button**: Skip ad after countdown (configurable seconds)
- **Impression Tracking**: Tracks ad views and clicks

## API Integration

The app connects to the ADNFLIX backend API. Key endpoints:

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | User login |
| `POST /auth/register` | User registration |
| `GET /auth/me` | Get current user |
| `GET /titles` | List all titles |
| `GET /titles/:id` | Get title details |
| `GET /watchlist` | Get user's watchlist |
| `POST /watchlist` | Add to watchlist |
| `POST /playback` | Save playback progress |
| `GET /config` | Get app configuration |
| `GET /ads/settings` | Get ad settings |

See the web app's `/api-docs` for complete API documentation.

## Customization

### Theme Colors

Edit `app/src/main/java/com/adnflix/app/ui/theme/Color.kt`:

```kotlin
val Primary = Color(0xFFE50914)  // Red accent
val Background = Color(0xFF141414)  // Dark background
```

### App Name and Logo

1. Update `app/src/main/res/values/strings.xml`
2. Replace launcher icons in `app/src/main/res/mipmap-*/`

## Troubleshooting

### Common Issues

1. **"Unable to resolve dependency"**
   - Sync Gradle files
   - Check internet connection
   - Clear Gradle cache: `./gradlew clean`

2. **"API connection failed"**
   - Verify API_BASE_URL is correct
   - For emulator, use `10.0.2.2` instead of `localhost`
   - Check if backend server is running

3. **"Video not playing"**
   - Verify video URL is accessible
   - Check if HLS stream is properly formatted
   - Enable cleartext traffic for HTTP URLs in debug

4. **"Build failed with Hilt error"**
   - Ensure `@HiltAndroidApp` is on Application class
   - Rebuild project: `./gradlew clean build`

## License

This project is proprietary software. All rights reserved.

## Support

For issues and feature requests, create a support ticket in the app or contact the development team.
