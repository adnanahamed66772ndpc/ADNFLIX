import { getApiUrl } from '@/api/client';

/**
 * Returns a URL that will work in the browser for playback.
 * - Same-origin URLs: returned as-is.
 * - HLS (.m3u8): for external URLs we try direct URL first (no proxy) so manifest + segments
 *   load from source and avoid proxy timeout. If you need proxy (e.g. CORS blocks), use getPlayableVideoUrlProxied().
 * - Other external URLs: proxied through our API to avoid CORS.
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
    // HLS: use direct URL so browser/HLS.js loads manifest and segments from source (avoids proxy manifest timeout)
    if (trimmed.toLowerCase().includes('.m3u8')) return trimmed;
    return `${apiUrl}/videos/stream?url=${encodeURIComponent(trimmed)}`;
  } catch {
    return trimmed;
  }
}

/**
 * Always use proxy for external URLs (e.g. when direct load fails with CORS).
 * Use this as fallback after a failed direct HLS load.
 */
export function getPlayableVideoUrlProxied(videoUrl: string): string {
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
