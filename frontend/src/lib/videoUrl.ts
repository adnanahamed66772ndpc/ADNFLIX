import { getApiUrl } from '@/api/client';

/**
 * Returns a URL that will work in the browser for <video src>.
 * If the video is hosted on another origin (e.g. elijahcoleman.site), the browser
 * would hit CORS. We proxy through our API so the request is same-origin to our backend.
 */
export function getPlayableVideoUrl(videoUrl: string): string {
  const trimmed = (videoUrl || '').trim();
  if (!trimmed) return '';

  if (typeof window === 'undefined') return trimmed;

  try {
    const apiUrl = getApiUrl();
    const video = new URL(trimmed, window.location.origin);
    const api = new URL(apiUrl, window.location.origin);
    const sameOrigin = video.origin === api.origin;
    if (sameOrigin) return trimmed;
    return `${apiUrl}/videos/stream?url=${encodeURIComponent(trimmed)}`;
  } catch {
    return trimmed;
  }
}
