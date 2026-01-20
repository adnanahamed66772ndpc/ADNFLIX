/**
 * Audio track utilities for detecting and managing audio tracks in HTML5 video elements
 */

import { getLanguageName } from './languageUtils';

export interface AudioTrack {
  id: number;
  name: string;
  lang: string;
  url?: string; // URL to separate audio file (for external audio tracks)
}

/**
 * Check if the browser supports the audioTracks API
 * Note: This checks for API existence, not whether tracks are available
 * Works with MP4, MKV, WebM, and other formats that the browser can play
 */
export function isAudioTracksAPISupported(video: HTMLVideoElement): boolean {
  // Check if the API exists (works across formats: MP4, MKV, WebM, etc.)
  const hasAPI = 'audioTracks' in video && video.audioTracks !== null && video.audioTracks !== undefined;
  return hasAPI;
}

/**
 * Check if the browser supports the audioTracks API and has tracks available
 */
export function isAudioTracksSupported(video: HTMLVideoElement): boolean {
  if (!isAudioTracksAPISupported(video)) {
    return false;
  }
  
  try {
    return video.audioTracks && video.audioTracks.length > 0;
  } catch (error) {
    console.warn('Error checking audio tracks:', error);
    return false;
  }
}

/**
 * Detect audio tracks from an HTML5 video element
 * Returns an array of AudioTrack objects with normalized language codes
 */
export function detectAudioTracks(video: HTMLVideoElement): AudioTrack[] {
  if (!isAudioTracksSupported(video)) {
    return [];
  }

  const tracks: AudioTrack[] = [];
  
  try {
    const audioTracks = video.audioTracks;
    
    for (let i = 0; i < audioTracks.length; i++) {
      const track = audioTracks[i];
      const lang = normalizeLanguageCode(track.language || track.label || `track-${i}`);
      const name = getLanguageName(lang);
      
      tracks.push({
        id: i,
        name: name,
        lang: lang,
      });
    }
  } catch (error) {
    console.warn('Error detecting audio tracks:', error);
    return [];
  }

  return tracks;
}

/**
 * Normalize language code to standard format
 * Handles various formats: 'hi', 'hin', 'hindi', 'Hindi', etc.
 */
export function normalizeLanguageCode(langCode: string): string {
  if (!langCode) return 'unknown';
  
  const normalized = langCode.toLowerCase().trim();
  
  // Map common variations to standard codes
  const languageMap: Record<string, string> = {
    // Hindi variations
    'hindi': 'hi',
    'hin': 'hi',
    'hi': 'hi',
    
    // English variations
    'english': 'en',
    'eng': 'en',
    'en': 'en',
    
    // Other common mappings
    'spanish': 'es',
    'spa': 'es',
    'french': 'fr',
    'fra': 'fr',
    'fre': 'fr',
    'german': 'de',
    'deu': 'de',
    'ger': 'de',
    'chinese': 'zh',
    'zho': 'zh',
    'chi': 'zh',
    'japanese': 'ja',
    'jpn': 'ja',
    'korean': 'ko',
    'kor': 'ko',
  };
  
  // Check direct mapping first
  if (languageMap[normalized]) {
    return languageMap[normalized];
  }
  
  // If it's already a 2-letter code, return as-is
  if (normalized.length === 2) {
    return normalized;
  }
  
  // If it's a 3-letter code, try to map it
  if (normalized.length === 3) {
    return languageMap[normalized] || normalized;
  }
  
  // For longer strings, try to extract a language code
  // This handles cases like "Hindi (India)" or "English (US)"
  const match = normalized.match(/\b([a-z]{2,3})\b/);
  if (match) {
    const extracted = match[1];
    return languageMap[extracted] || extracted;
  }
  
  return normalized;
}

/**
 * Switch to a specific audio track in an HTML5 video element
 * Returns true if successful, false otherwise
 */
export function switchAudioTrack(video: HTMLVideoElement, trackId: number): boolean {
  if (!isAudioTracksAPISupported(video)) {
    console.warn('Audio tracks API not supported');
    return false;
  }

  try {
    const audioTracks = video.audioTracks;
    
    if (!audioTracks || audioTracks.length === 0) {
      console.warn('No audio tracks available');
      return false;
    }
    
    if (trackId < 0 || trackId >= audioTracks.length) {
      console.warn(`Invalid track ID: ${trackId}, available tracks: ${audioTracks.length}`);
      return false;
    }
    
    // Disable all tracks first
    for (let i = 0; i < audioTracks.length; i++) {
      if (audioTracks[i].enabled) {
        audioTracks[i].enabled = false;
      }
    }
    
    // Enable the selected track
    audioTracks[trackId].enabled = true;
    
    // Verify the switch worked
    const currentTrack = getCurrentAudioTrack(video);
    if (currentTrack === trackId) {
      return true;
    } else {
      console.warn(`Audio track switch may have failed. Expected: ${trackId}, Got: ${currentTrack}`);
      return false;
    }
  } catch (error) {
    console.error('Error switching audio track:', error);
    return false;
  }
}

/**
 * Get the currently active audio track ID
 * Returns -1 if no track is active or API is not supported
 */
export function getCurrentAudioTrack(video: HTMLVideoElement): number {
  if (!isAudioTracksSupported(video)) {
    return -1;
  }

  try {
    const audioTracks = video.audioTracks;
    
    for (let i = 0; i < audioTracks.length; i++) {
      if (audioTracks[i].enabled) {
        return i;
      }
    }
    
    // If no track is explicitly enabled, return the first track (default)
    return audioTracks.length > 0 ? 0 : -1;
  } catch (error) {
    console.error('Error getting current audio track:', error);
    return -1;
  }
}

/**
 * Validate that audio tracks array contains valid structure
 */
export function validateAudioTracks(tracks: any[]): boolean {
  if (!Array.isArray(tracks)) {
    return false;
  }
  
  return tracks.every(track => 
    track && 
    typeof track === 'object' &&
    typeof track.lang === 'string' &&
    typeof track.name === 'string'
  );
}
