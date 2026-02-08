/**
 * VMAP (Video Multiple Ad Playlist) Parser
 * 
 * Parses VMAP XML to get ad break schedules for a video.
 * VMAP defines when ads should appear and references VAST tags for each break.
 */

import { fetchVASTAd, VASTAd } from './vastParser';

export interface VMAPAdBreak {
  timeOffset: string; // 'start', 'end', or time like '00:05:00' or percentage
  breakType: 'linear' | 'nonlinear' | 'display';
  breakId: string;
  repeatAfter?: string;
  adSource?: {
    vastUrl?: string;
    vastData?: string;
    allowMultipleAds?: boolean;
    followRedirects?: boolean;
  };
  trackingEvents: {
    breakStart: string[];
    breakEnd: string[];
    error: string[];
  };
}

export interface VMAPResponse {
  version: string;
  adBreaks: VMAPAdBreak[];
}

export interface ResolvedAdBreak {
  breakId: string;
  position: 'pre-roll' | 'mid-roll' | 'post-roll';
  timeOffsetSeconds?: number; // For mid-rolls
  ads: VASTAd[];
  trackingEvents: VMAPAdBreak['trackingEvents'];
}

/**
 * Parse time offset string to seconds
 */
function parseTimeOffsetToSeconds(offset: string, videoDuration?: number): number | null {
  if (offset === 'start') return 0;
  if (offset === 'end') return null; // Post-roll
  
  // Percentage format
  if (offset.endsWith('%')) {
    const percent = parseFloat(offset.replace('%', ''));
    if (videoDuration) {
      return (percent / 100) * videoDuration;
    }
    return null;
  }
  
  // HH:MM:SS format
  if (offset.includes(':')) {
    const parts = offset.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
  }
  
  // Plain seconds
  return parseFloat(offset);
}

/**
 * Determine ad position from time offset
 */
function getAdPosition(timeOffset: string): 'pre-roll' | 'mid-roll' | 'post-roll' {
  if (timeOffset === 'start') return 'pre-roll';
  if (timeOffset === 'end') return 'post-roll';
  return 'mid-roll';
}

/**
 * Extract text content from XML element
 */
function getElementText(element: Element | null): string {
  if (!element) return '';
  const text = element.textContent?.trim() || '';
  return text.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '').trim();
}

/**
 * Get all text values from multiple elements
 */
function getAllElementTexts(elements: NodeListOf<Element>): string[] {
  return Array.from(elements)
    .map(el => getElementText(el))
    .filter(text => text.length > 0);
}

/**
 * Parse VMAP XML string into structured data
 */
export function parseVMAP(xmlString: string): VMAPResponse {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse VMAP XML: ' + parseError.textContent);
  }
  
  const vmapElement = doc.querySelector('vmap\\:VMAP, VMAP');
  if (!vmapElement) {
    throw new Error('Invalid VMAP: No VMAP element found');
  }
  
  const version = vmapElement.getAttribute('version') || '1.0';
  const adBreaks: VMAPAdBreak[] = [];
  
  const breakElements = vmapElement.querySelectorAll('vmap\\:AdBreak, AdBreak');
  
  Array.from(breakElements).forEach(breakElement => {
    const timeOffset = breakElement.getAttribute('timeOffset') || 'start';
    const breakType = (breakElement.getAttribute('breakType') || 'linear') as VMAPAdBreak['breakType'];
    const breakId = breakElement.getAttribute('breakId') || crypto.randomUUID();
    const repeatAfter = breakElement.getAttribute('repeatAfter') || undefined;
    
    // Parse ad source
    const adSourceElement = breakElement.querySelector('vmap\\:AdSource, AdSource');
    let adSource: VMAPAdBreak['adSource'] | undefined;
    
    if (adSourceElement) {
      const vastAdData = adSourceElement.querySelector('vmap\\:VASTAdData, VASTAdData');
      const adTagUri = adSourceElement.querySelector('vmap\\:AdTagURI, AdTagURI');
      
      adSource = {
        vastData: vastAdData ? vastAdData.innerHTML : undefined,
        vastUrl: adTagUri ? getElementText(adTagUri) : undefined,
        allowMultipleAds: adSourceElement.getAttribute('allowMultipleAds') === 'true',
        followRedirects: adSourceElement.getAttribute('followRedirects') !== 'false',
      };
    }
    
    // Parse tracking events
    const trackingEvents = {
      breakStart: getAllElementTexts(
        breakElement.querySelectorAll('vmap\\:TrackingEvents vmap\\:Tracking[event="breakStart"], TrackingEvents Tracking[event="breakStart"]')
      ),
      breakEnd: getAllElementTexts(
        breakElement.querySelectorAll('vmap\\:TrackingEvents vmap\\:Tracking[event="breakEnd"], TrackingEvents Tracking[event="breakEnd"]')
      ),
      error: getAllElementTexts(
        breakElement.querySelectorAll('vmap\\:TrackingEvents vmap\\:Tracking[event="error"], TrackingEvents Tracking[event="error"]')
      ),
    };
    
    adBreaks.push({
      timeOffset,
      breakType,
      breakId,
      repeatAfter,
      adSource,
      trackingEvents,
    });
  });
  
  return { version, adBreaks };
}

/**
 * Fetch and parse a VMAP URL
 */
export async function fetchVMAP(vmapUrl: string): Promise<VMAPResponse> {
  try {
    const response = await fetch(vmapUrl, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`VMAP fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const xmlString = await response.text();
    return parseVMAP(xmlString);
  } catch (error) {
    console.error('VMAP fetch error:', error);
    return { version: '1.0', adBreaks: [] };
  }
}

/**
 * Resolve a single ad break to get its VAST ads
 */
export async function resolveAdBreak(
  adBreak: VMAPAdBreak,
  videoDuration?: number
): Promise<ResolvedAdBreak> {
  const position = getAdPosition(adBreak.timeOffset);
  const timeOffsetSeconds = parseTimeOffsetToSeconds(adBreak.timeOffset, videoDuration) ?? undefined;
  
  let ads: VASTAd[] = [];
  
  if (adBreak.adSource) {
    if (adBreak.adSource.vastUrl) {
      // Fetch VAST from URL
      const vastResponse = await fetchVASTAd(adBreak.adSource.vastUrl);
      ads = vastResponse.ads;
    } else if (adBreak.adSource.vastData) {
      // Parse inline VAST data
      const { parseVAST } = await import('./vastParser');
      const vastResponse = parseVAST(adBreak.adSource.vastData);
      ads = vastResponse.ads;
    }
  }
  
  return {
    breakId: adBreak.breakId,
    position,
    timeOffsetSeconds,
    ads,
    trackingEvents: adBreak.trackingEvents,
  };
}

/**
 * Resolve all ad breaks in a VMAP response
 */
export async function resolveAllAdBreaks(
  vmapResponse: VMAPResponse,
  videoDuration?: number
): Promise<ResolvedAdBreak[]> {
  const resolvedBreaks = await Promise.all(
    vmapResponse.adBreaks
      .filter(ab => ab.breakType === 'linear')
      .map(ab => resolveAdBreak(ab, videoDuration))
  );
  
  // Sort by time offset (pre-roll first, then mid-rolls by time, then post-roll)
  return resolvedBreaks.sort((a, b) => {
    if (a.position === 'pre-roll') return -1;
    if (b.position === 'pre-roll') return 1;
    if (a.position === 'post-roll') return 1;
    if (b.position === 'post-roll') return -1;
    return (a.timeOffsetSeconds || 0) - (b.timeOffsetSeconds || 0);
  });
}

/**
 * Get ad breaks by position
 */
export function categorizeAdBreaks(resolvedBreaks: ResolvedAdBreak[]): {
  preRoll: ResolvedAdBreak | null;
  midRolls: ResolvedAdBreak[];
  postRoll: ResolvedAdBreak | null;
} {
  const preRoll = resolvedBreaks.find(b => b.position === 'pre-roll') || null;
  const postRoll = resolvedBreaks.find(b => b.position === 'post-roll') || null;
  const midRolls = resolvedBreaks.filter(b => b.position === 'mid-roll');
  
  return { preRoll, midRolls, postRoll };
}
