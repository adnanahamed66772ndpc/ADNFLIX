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

const PROXY_STREAM_PREFIX = '/videos/stream?url=';

/**
 * Fetches an HLS manifest from the proxy and rewrites segment URLs so they go through
 * the same proxy (fixes 404 when backend does not rewrite or deploy is stale).
 * Returns a blob URL; caller must revoke it when done (URL.revokeObjectURL).
 */
export async function fetchHlsManifestAndRewriteAsBlobUrl(proxyManifestUrl: string): Promise<{ blobUrl: string }> {
  const apiUrl = getApiUrl();
  const proxyBase = `${apiUrl}${apiUrl.endsWith('/') ? '' : '/'}videos/stream?url=`;

  const res = await fetch(proxyManifestUrl, {
    headers: { Accept: 'application/vnd.apple.mpegurl,*/*' },
  });
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
  const text = await res.text();

  let originalManifestUrl: string;
  try {
    const u = new URL(proxyManifestUrl);
    const urlParam = u.searchParams.get('url');
    originalManifestUrl = urlParam ? decodeURIComponent(urlParam) : proxyManifestUrl;
  } catch {
    originalManifestUrl = proxyManifestUrl;
  }

  const base = new URL(originalManifestUrl);
  const lines = text.split(/\r?\n/);
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('#')) {
      out.push(line);
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) {
      out.push(line);
      continue;
    }
    if (trimmed.startsWith('http') && trimmed.includes(PROXY_STREAM_PREFIX)) {
      out.push(line);
      continue;
    }
    try {
      const segmentUrl = new URL(trimmed, base.href).href;
      out.push(proxyBase + encodeURIComponent(segmentUrl));
    } catch {
      out.push(line);
    }
  }

  const rewritten = out.join('\n');
  const blob = new Blob([rewritten], { type: 'application/vnd.apple.mpegurl' });
  return { blobUrl: URL.createObjectURL(blob) };
}
