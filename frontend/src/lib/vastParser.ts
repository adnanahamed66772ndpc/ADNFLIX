/**
 * VAST (Video Ad Serving Template) Parser
 * 
 * Parses VAST XML responses from ad networks into structured data
 * for use in the video player ad system.
 */

export interface VASTMediaFile {
  url: string;
  mimeType: string;
  width: number;
  height: number;
  bitrate?: number;
}

export interface VASTTrackingEvents {
  impression: string[];
  start: string[];
  firstQuartile: string[];
  midpoint: string[];
  thirdQuartile: string[];
  complete: string[];
  skip: string[];
  click: string[];
  error: string[];
}

export interface VASTAd {
  id: string;
  title: string;
  description?: string;
  mediaFiles: VASTMediaFile[];
  clickThrough?: string;
  clickTracking: string[];
  trackingEvents: VASTTrackingEvents;
  skipOffset?: number; // seconds before skip allowed
  duration: number;
}

export interface VASTResponse {
  version: string;
  ads: VASTAd[];
  errorUrls: string[];
}

/**
 * Parse time offset string to seconds
 * Supports formats: "00:00:05", "00:00:05.000", "5", "5%"
 */
function parseTimeOffset(offset: string | null, duration?: number): number | undefined {
  if (!offset) return undefined;
  
  // Percentage format
  if (offset.endsWith('%')) {
    const percent = parseFloat(offset.replace('%', ''));
    if (duration) {
      return (percent / 100) * duration;
    }
    return undefined;
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
 * Parse duration string to seconds
 * Supports formats: "00:00:30", "00:00:30.000"
 */
function parseDuration(duration: string | null): number {
  if (!duration) return 0;
  
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseFloat(duration) || 0;
}

/**
 * Extract text content from XML element
 */
function getElementText(element: Element | null): string {
  if (!element) return '';
  // Handle CDATA sections
  const text = element.textContent?.trim() || '';
  return text.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '').trim();
}

/**
 * Get all text values from multiple elements
 */
function getAllElementTexts(elements: NodeListOf<Element> | Element[]): string[] {
  return Array.from(elements)
    .map(el => getElementText(el))
    .filter(text => text.length > 0);
}

/**
 * Parse tracking events from VAST XML
 */
function parseTrackingEvents(trackingElements: NodeListOf<Element>): VASTTrackingEvents {
  const events: VASTTrackingEvents = {
    impression: [],
    start: [],
    firstQuartile: [],
    midpoint: [],
    thirdQuartile: [],
    complete: [],
    skip: [],
    click: [],
    error: [],
  };
  
  Array.from(trackingElements).forEach(tracking => {
    const event = tracking.getAttribute('event')?.toLowerCase();
    const url = getElementText(tracking);
    
    if (url && event) {
      switch (event) {
        case 'start':
          events.start.push(url);
          break;
        case 'firstquartile':
          events.firstQuartile.push(url);
          break;
        case 'midpoint':
          events.midpoint.push(url);
          break;
        case 'thirdquartile':
          events.thirdQuartile.push(url);
          break;
        case 'complete':
          events.complete.push(url);
          break;
        case 'skip':
          events.skip.push(url);
          break;
        case 'click':
        case 'clicktracking':
          events.click.push(url);
          break;
      }
    }
  });
  
  return events;
}

/**
 * Parse media files from VAST XML
 */
function parseMediaFiles(mediaFileElements: NodeListOf<Element>): VASTMediaFile[] {
  return Array.from(mediaFileElements)
    .map(mf => ({
      url: getElementText(mf),
      mimeType: mf.getAttribute('type') || 'video/mp4',
      width: parseInt(mf.getAttribute('width') || '0', 10),
      height: parseInt(mf.getAttribute('height') || '0', 10),
      bitrate: mf.getAttribute('bitrate') ? parseInt(mf.getAttribute('bitrate')!, 10) : undefined,
    }))
    .filter(mf => mf.url.length > 0);
}

/**
 * Parse a single InLine ad from VAST XML
 */
function parseInLineAd(adElement: Element): VASTAd | null {
  const inLine = adElement.querySelector('InLine');
  if (!inLine) return null;
  
  const creative = inLine.querySelector('Creatives Creative Linear');
  if (!creative) return null;
  
  const durationStr = getElementText(creative.querySelector('Duration'));
  const duration = parseDuration(durationStr);
  
  const skipOffsetStr = creative.getAttribute('skipoffset');
  const skipOffset = parseTimeOffset(skipOffsetStr, duration);
  
  const mediaFiles = parseMediaFiles(creative.querySelectorAll('MediaFiles MediaFile'));
  if (mediaFiles.length === 0) return null;
  
  const trackingEvents = parseTrackingEvents(creative.querySelectorAll('TrackingEvents Tracking'));
  
  // Add impression URLs to tracking
  const impressionElements = inLine.querySelectorAll('Impression');
  trackingEvents.impression = getAllElementTexts(impressionElements);
  
  // Click tracking
  const clickThrough = getElementText(creative.querySelector('VideoClicks ClickThrough'));
  const clickTrackingElements = creative.querySelectorAll('VideoClicks ClickTracking');
  const clickTracking = getAllElementTexts(clickTrackingElements);
  
  return {
    id: adElement.getAttribute('id') || crypto.randomUUID(),
    title: getElementText(inLine.querySelector('AdTitle')) || 'Advertisement',
    description: getElementText(inLine.querySelector('Description')) || undefined,
    mediaFiles,
    clickThrough: clickThrough || undefined,
    clickTracking,
    trackingEvents,
    skipOffset,
    duration,
  };
}

/**
 * Parse a Wrapper ad (follows redirect to another VAST)
 */
async function parseWrapperAd(adElement: Element, maxRedirects: number): Promise<VASTAd | null> {
  if (maxRedirects <= 0) {
    console.warn('VAST: Maximum wrapper depth reached');
    return null;
  }
  
  const wrapper = adElement.querySelector('Wrapper');
  if (!wrapper) return null;
  
  const vastAdTagUri = getElementText(wrapper.querySelector('VASTAdTagURI'));
  if (!vastAdTagUri) return null;
  
  try {
    const response = await fetchVASTAd(vastAdTagUri, maxRedirects - 1);
    if (response.ads.length > 0) {
      const ad = response.ads[0];
      
      // Merge wrapper tracking events with inner ad
      const wrapperImpressions = getAllElementTexts(wrapper.querySelectorAll('Impression'));
      ad.trackingEvents.impression = [...wrapperImpressions, ...ad.trackingEvents.impression];
      
      const wrapperTrackings = wrapper.querySelectorAll('Creatives Creative Linear TrackingEvents Tracking');
      const wrapperEvents = parseTrackingEvents(wrapperTrackings);
      
      Object.keys(wrapperEvents).forEach(key => {
        const eventKey = key as keyof VASTTrackingEvents;
        ad.trackingEvents[eventKey] = [...wrapperEvents[eventKey], ...ad.trackingEvents[eventKey]];
      });
      
      return ad;
    }
  } catch (error) {
    console.error('VAST: Failed to fetch wrapper ad:', error);
  }
  
  return null;
}

/**
 * Parse VAST XML string into structured data
 */
export function parseVAST(xmlString: string): VASTResponse {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse VAST XML: ' + parseError.textContent);
  }
  
  const vastElement = doc.querySelector('VAST');
  if (!vastElement) {
    throw new Error('Invalid VAST: No VAST element found');
  }
  
  const version = vastElement.getAttribute('version') || '2.0';
  const errorUrls = getAllElementTexts(vastElement.querySelectorAll(':scope > Error'));
  
  const ads: VASTAd[] = [];
  const adElements = vastElement.querySelectorAll(':scope > Ad');
  
  Array.from(adElements).forEach(adElement => {
    const inLineAd = parseInLineAd(adElement);
    if (inLineAd) {
      ads.push(inLineAd);
    }
  });
  
  return { version, ads, errorUrls };
}

/**
 * Fetch and parse a VAST tag URL
 */
export async function fetchVASTAd(vastUrl: string, maxRedirects = 5): Promise<VASTResponse> {
  try {
    const response = await fetch(vastUrl, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`VAST fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const xmlString = await response.text();
    const vastResponse = parseVAST(xmlString);
    
    // Handle wrapper ads
    const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
    const wrapperAds = doc.querySelectorAll('VAST > Ad Wrapper');
    
    for (const wrapper of Array.from(wrapperAds)) {
      const adElement = wrapper.parentElement;
      if (adElement) {
        const wrappedAd = await parseWrapperAd(adElement, maxRedirects);
        if (wrappedAd) {
          vastResponse.ads.push(wrappedAd);
        }
      }
    }
    
    return vastResponse;
  } catch (error) {
    console.error('VAST fetch error:', error);
    return { version: '2.0', ads: [], errorUrls: [] };
  }
}

/**
 * Get the best media file for the current device/browser
 */
export function selectBestMediaFile(mediaFiles: VASTMediaFile[]): VASTMediaFile | null {
  if (mediaFiles.length === 0) return null;
  
  // Prefer MP4 files
  const mp4Files = mediaFiles.filter(mf => 
    mf.mimeType.includes('mp4') || mf.url.endsWith('.mp4')
  );
  
  const candidates = mp4Files.length > 0 ? mp4Files : mediaFiles;
  
  // Sort by resolution (prefer higher, but not over 1080p for bandwidth)
  const sorted = [...candidates].sort((a, b) => {
    const aScore = Math.min(a.height, 1080);
    const bScore = Math.min(b.height, 1080);
    return bScore - aScore;
  });
  
  return sorted[0];
}
