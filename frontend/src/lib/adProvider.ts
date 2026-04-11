/**
 * Ad Provider Abstraction Layer
 * 
 * This module provides an abstraction for ad delivery that can be swapped
 * between web-based video ads (custom/VAST/VMAP) and native mobile AdMob ads.
 * 
 * When building the mobile app with Capacitor:
 * 1. Install: npm install @capacitor-community/admob
 * 2. Configure AdMob app ID in capacitor.config.ts
 * 3. Create ad unit IDs in Google AdMob console
 * 4. Use AdMobProvider instead of WebAdProvider
 */

import type { AdVideo, AdSettings, AdSource } from '@/hooks/useAdSettings';

export interface AdProvider {
  initialize(): Promise<void>;
  isReady(): boolean;
  showPreRollAd(): Promise<AdResult>;
  showMidRollAd(): Promise<AdResult>;
  showPostRollAd(): Promise<AdResult>;
  destroy(): void;
  // VAST/VMAP configuration
  setAdSource(source: AdSource): void;
  setVASTTags(preRoll?: string | null, midRoll?: string | null, postRoll?: string | null): void;
  setVMAPUrl(vmapUrl: string | null): void;
}

export interface AdResult {
  shown: boolean;
  completed: boolean;
  skipped: boolean;
  clicked: boolean;
  error?: string;
}

/**
 * Web Ad Provider - Uses custom video ads, VAST tags, or VMAP playlists
 * This is the default provider for web applications.
 */
export class WebAdProvider implements AdProvider {
  private settings: AdSettings | null = null;
  private preRollAds: AdVideo[] = [];
  private midRollAds: AdVideo[] = [];
  private postRollAds: AdVideo[] = [];
  private initialized = false;
  
  // VAST/VMAP configuration
  private adSource: AdSource = 'custom';
  private vastPreRollTag: string | null = null;
  private vastMidRollTag: string | null = null;
  private vastPostRollTag: string | null = null;
  private vmapUrl: string | null = null;

  async initialize(): Promise<void> {
    // Ads are loaded via React hooks, this is just for interface compliance
    this.initialized = true;
  }

  isReady(): boolean {
    return this.initialized;
  }

  setAdSource(source: AdSource): void {
    this.adSource = source;
  }

  setVASTTags(preRoll?: string | null, midRoll?: string | null, postRoll?: string | null): void {
    this.vastPreRollTag = preRoll || null;
    this.vastMidRollTag = midRoll || null;
    this.vastPostRollTag = postRoll || null;
  }

  setVMAPUrl(vmapUrl: string | null): void {
    this.vmapUrl = vmapUrl;
  }

  setAds(settings: AdSettings, preRoll: AdVideo[], midRoll: AdVideo[], postRoll: AdVideo[]) {
    this.settings = settings;
    this.preRollAds = preRoll;
    this.midRollAds = midRoll;
    this.postRollAds = postRoll;
    
    // Apply settings
    this.adSource = settings.ad_source;
    this.vastPreRollTag = settings.vast_pre_roll_tag;
    this.vastMidRollTag = settings.vast_mid_roll_tag;
    this.vastPostRollTag = settings.vast_post_roll_tag;
    this.vmapUrl = settings.vmap_url;
  }

  async showPreRollAd(): Promise<AdResult> {
    if (!this.settings?.enabled || !this.settings?.pre_roll_enabled) {
      return { shown: false, completed: false, skipped: false, clicked: false };
    }

    // Check based on ad source
    if (this.adSource === 'vast' && this.vastPreRollTag) {
      return { shown: true, completed: true, skipped: false, clicked: false };
    }
    
    if (this.adSource === 'vmap' && this.vmapUrl) {
      return { shown: true, completed: true, skipped: false, clicked: false };
    }

    if (this.preRollAds.length === 0) {
      return { shown: false, completed: false, skipped: false, clicked: false };
    }

    // Ad display is handled by VideoPlayerWithAds component
    return { shown: true, completed: true, skipped: false, clicked: false };
  }

  async showMidRollAd(): Promise<AdResult> {
    if (!this.settings?.enabled || !this.settings?.mid_roll_enabled) {
      return { shown: false, completed: false, skipped: false, clicked: false };
    }

    if (this.adSource === 'vast' && this.vastMidRollTag) {
      return { shown: true, completed: true, skipped: false, clicked: false };
    }
    
    if (this.adSource === 'vmap' && this.vmapUrl) {
      return { shown: true, completed: true, skipped: false, clicked: false };
    }

    if (this.midRollAds.length === 0) {
      return { shown: false, completed: false, skipped: false, clicked: false };
    }

    return { shown: true, completed: true, skipped: false, clicked: false };
  }

  async showPostRollAd(): Promise<AdResult> {
    if (!this.settings?.enabled || !this.settings?.post_roll_enabled) {
      return { shown: false, completed: false, skipped: false, clicked: false };
    }

    if (this.adSource === 'vast' && this.vastPostRollTag) {
      return { shown: true, completed: true, skipped: false, clicked: false };
    }
    
    if (this.adSource === 'vmap' && this.vmapUrl) {
      return { shown: true, completed: true, skipped: false, clicked: false };
    }

    if (this.postRollAds.length === 0) {
      return { shown: false, completed: false, skipped: false, clicked: false };
    }

    return { shown: true, completed: true, skipped: false, clicked: false };
  }

  destroy(): void {
    this.initialized = false;
    this.preRollAds = [];
    this.midRollAds = [];
    this.postRollAds = [];
    this.vastPreRollTag = null;
    this.vastMidRollTag = null;
    this.vastPostRollTag = null;
    this.vmapUrl = null;
  }
}

/**
 * AdMob Provider - For native mobile apps using Capacitor
 * 
 * USAGE (when building mobile app):
 * 
 * ```typescript
 * import { AdMob, AdMobInterstitialOptions } from '@capacitor-community/admob';
 * 
 * export class AdMobProvider implements AdProvider {
 *   private adUnitIds = {
 *     preRoll: 'ca-app-pub-xxxxx/yyyyy',  // Your pre-roll ad unit ID
 *     midRoll: 'ca-app-pub-xxxxx/zzzzz',  // Your mid-roll ad unit ID
 *     postRoll: 'ca-app-pub-xxxxx/wwwww', // Your post-roll ad unit ID
 *   };
 * 
 *   async initialize(): Promise<void> {
 *     await AdMob.initialize({
 *       requestTrackingAuthorization: true,
 *       testingDevices: ['YOUR_TEST_DEVICE_ID'],
 *       initializeForTesting: false, // Set to true for development
 *     });
 *   }
 * 
 *   async showPreRollAd(): Promise<AdResult> {
 *     try {
 *       const options: AdMobInterstitialOptions = {
 *         adId: this.adUnitIds.preRoll,
 *         isTesting: false,
 *       };
 *       await AdMob.prepareInterstitial(options);
 *       await AdMob.showInterstitial();
 *       return { shown: true, completed: true, skipped: false, clicked: false };
 *     } catch (error) {
 *       return { shown: false, completed: false, skipped: false, clicked: false, error: error.message };
 *     }
 *   }
 *   
 *   // Similar implementations for mid-roll and post-roll...
 * }
 * ```
 * 
 * Remember to add your AdMob configuration to capacitor.config.ts:
 * 
 * ```typescript
 * const config: CapacitorConfig = {
 *   appId: 'com.yourapp.id',
 *   appName: 'Your App',
 *   plugins: {
 *     AdMob: {
 *       appIdAndroid: 'ca-app-pub-xxxxx~yyyyy',
 *       appIdIOS: 'ca-app-pub-xxxxx~zzzzz',
 *     },
 *   },
 * };
 * ```
 */

// Factory function to get the appropriate ad provider
export function getAdProvider(): AdProvider {
  // In the future, check if running in Capacitor native app
  // if (Capacitor.isNativePlatform()) {
  //   return new AdMobProvider();
  // }
  
  return new WebAdProvider();
}

// Export singleton instance
export const adProvider = getAdProvider();
