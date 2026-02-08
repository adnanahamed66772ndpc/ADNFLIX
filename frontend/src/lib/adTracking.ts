/**
 * Ad Tracking Service
 * 
 * Handles firing tracking pixels for VAST/VMAP ad events
 * to properly report ad impressions and interactions to ad networks.
 */

import { VASTTrackingEvents } from './vastParser';

export type TrackingEventType = 
  | 'impression'
  | 'start'
  | 'firstQuartile'
  | 'midpoint'
  | 'thirdQuartile'
  | 'complete'
  | 'skip'
  | 'click'
  | 'error';

/**
 * Standard VAST macros that can be replaced in tracking URLs
 */
interface TrackingMacros {
  TIMESTAMP?: string;
  CACHEBUSTER?: string;
  ERRORCODE?: string;
  CONTENTPLAYHEAD?: string;
  ASSETURI?: string;
  PODSEQUENCE?: string;
  ADSERVINGID?: string;
  CLICKPOS?: string;
}

/**
 * Replace VAST macros in a tracking URL
 */
export function replaceMacros(url: string, macros: TrackingMacros = {}): string {
  const defaultMacros: TrackingMacros = {
    TIMESTAMP: new Date().toISOString(),
    CACHEBUSTER: Math.random().toString(36).substring(2),
    ...macros,
  };
  
  let processedUrl = url;
  
  Object.entries(defaultMacros).forEach(([key, value]) => {
    if (value) {
      // Handle both [MACRO] and ${MACRO} formats
      processedUrl = processedUrl
        .replace(new RegExp(`\\[${key}\\]`, 'g'), encodeURIComponent(value))
        .replace(new RegExp(`\\$\\{${key}\\}`, 'g'), encodeURIComponent(value))
        .replace(new RegExp(`%5B${key}%5D`, 'g'), encodeURIComponent(value));
    }
  });
  
  return processedUrl;
}

/**
 * Fire a single tracking pixel
 * Uses Image for simple GET requests (best compatibility)
 */
export function fireTrackingPixel(url: string, macros?: TrackingMacros): void {
  try {
    const processedUrl = replaceMacros(url, macros);
    
    // Use Image element for maximum compatibility
    const img = new Image();
    img.src = processedUrl;
    
    // Also try fetch for URLs that might require it
    fetch(processedUrl, {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'omit',
    }).catch(() => {
      // Ignore errors - tracking is best-effort
    });
  } catch (error) {
    console.warn('Failed to fire tracking pixel:', error);
  }
}

/**
 * Fire multiple tracking pixels in parallel
 */
export function fireTrackingPixels(urls: string[], macros?: TrackingMacros): void {
  urls.forEach(url => fireTrackingPixel(url, macros));
}

/**
 * Create a tracker instance for a specific ad
 * Tracks which events have been fired to prevent duplicates
 */
export function createAdTracker(trackingEvents: VASTTrackingEvents) {
  const firedEvents = new Set<string>();
  
  return {
    /**
     * Fire a specific tracking event (only fires once per event type)
     */
    fireEvent(eventType: TrackingEventType, macros?: TrackingMacros): void {
      const eventKey = `${eventType}`;
      
      // Prevent duplicate fires for one-time events
      const oneTimeEvents = ['impression', 'start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'skip'];
      if (oneTimeEvents.includes(eventType) && firedEvents.has(eventKey)) {
        return;
      }
      
      const urls = trackingEvents[eventType] || [];
      if (urls.length > 0) {
        fireTrackingPixels(urls, macros);
        firedEvents.add(eventKey);
      }
    },
    
    /**
     * Fire impression event
     */
    fireImpression(macros?: TrackingMacros): void {
      this.fireEvent('impression', macros);
    },
    
    /**
     * Fire start event
     */
    fireStart(macros?: TrackingMacros): void {
      this.fireEvent('start', macros);
    },
    
    /**
     * Fire quartile events based on progress percentage
     */
    fireQuartile(progressPercent: number, macros?: TrackingMacros): void {
      if (progressPercent >= 25 && !firedEvents.has('firstQuartile')) {
        this.fireEvent('firstQuartile', macros);
      }
      if (progressPercent >= 50 && !firedEvents.has('midpoint')) {
        this.fireEvent('midpoint', macros);
      }
      if (progressPercent >= 75 && !firedEvents.has('thirdQuartile')) {
        this.fireEvent('thirdQuartile', macros);
      }
    },
    
    /**
     * Fire complete event
     */
    fireComplete(macros?: TrackingMacros): void {
      this.fireEvent('complete', macros);
    },
    
    /**
     * Fire skip event
     */
    fireSkip(macros?: TrackingMacros): void {
      this.fireEvent('skip', macros);
    },
    
    /**
     * Fire click event
     */
    fireClick(macros?: TrackingMacros): void {
      this.fireEvent('click', macros);
    },
    
    /**
     * Fire error event
     */
    fireError(errorCode?: string): void {
      this.fireEvent('error', { ERRORCODE: errorCode });
    },
    
    /**
     * Check if an event has been fired
     */
    hasFired(eventType: TrackingEventType): boolean {
      return firedEvents.has(eventType);
    },
    
    /**
     * Reset all fired events (for ad replay scenarios)
     */
    reset(): void {
      firedEvents.clear();
    },
  };
}

/**
 * Format current playhead time as HH:MM:SS.mmm for CONTENTPLAYHEAD macro
 */
export function formatPlayhead(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
