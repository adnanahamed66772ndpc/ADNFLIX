const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');
const https = require('https');
const http = require('http');
const { VIDEO_STORAGE_PATH } = require('../config/storage.js');

// Buffer size between remote upstream and client (smooths out slow/bursty remote streams)
const PROXY_STREAM_BUFFER_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Video Controller - No Encoding/Conversion Policy
 */

// Allowed hosts for external video proxy (avoid open redirect / abuse). Add your CDN or storage domains.
const ALLOWED_PROXY_HOSTS = (process.env.VIDEO_PROXY_ALLOWED_ORIGINS || 'elijahcoleman.site,coliningram.site')
  .split(',')
  .map(h => h.trim().toLowerCase())
  .filter(Boolean);

function isUrlAllowedForProxy(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (ALLOWED_PROXY_HOSTS.length === 0) return true;
    return ALLOWED_PROXY_HOSTS.some(allowed => host === allowed || host.endsWith('.' + allowed));
  } catch {
    return false;
  }
}

// Timeout for proxy request to upstream (manifest or segment). HLS client waits up to 60s.
const PROXY_UPSTREAM_TIMEOUT_MS = 55000;

// Build proxy base URL for rewriting HLS segment URLs (e.g. https://coliningram.site/api/videos/stream?url=)
// Use X-Forwarded-* when behind reverse proxy so segment URLs use the public origin.
function getStreamProxyBaseUrl(req) {
  const protocol = req.get('x-forwarded-proto') || (req.socket?.encrypted ? 'https' : 'http');
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost';
  return `${protocol}://${host}/api/videos/stream?url=`;
}

// Fetch full response body (for HLS manifest rewriting). Follows one redirect.
function fetchUrlAsBuffer(url, options = {}, redirectCount = 0) {
  const maxRedirects = 3;
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const client = u.protocol === 'https:' ? https : http;
    const req = client.request(url, { headers: options.headers || {} }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        const location = res.headers.location;
        if (redirectCount < maxRedirects && location && isUrlAllowedForProxy(new URL(location, url).href)) {
          res.destroy();
          return resolve(fetchUrlAsBuffer(new URL(location, url).href, options, redirectCount + 1));
        }
      }
      if (res.statusCode !== 200 && res.statusCode !== 206) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(PROXY_UPSTREAM_TIMEOUT_MS, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// Rewrite HLS manifest so segment URLs go through our proxy (fixes 404 on /api/videos/output0.ts)
function rewriteHlsManifest(manifestText, manifestUrl, proxyBaseUrl) {
  const base = new URL(manifestUrl);
  const lines = manifestText.split(/\r?\n/);
  const out = [];
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
    try {
      const segmentUrl = new URL(trimmed, base.href).href;
      if (!isUrlAllowedForProxy(segmentUrl)) {
        out.push(line);
        continue;
      }
      out.push(proxyBaseUrl + encodeURIComponent(segmentUrl));
    } catch {
      out.push(line);
    }
  }
  return out.join('\n');
}

// Proxy external video through our API to avoid CORS (browser requests our origin, we stream from external URL).
// For HLS .m3u8 manifests we rewrite segment URLs so they also go through the proxy.
async function streamProxy(req, res, next) {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid url query parameter' });
    }
    let decodedUrl = decodeURIComponent(rawUrl.trim());
    if (!isUrlAllowedForProxy(decodedUrl)) {
      return res.status(403).json({ error: 'Video URL is not allowed for proxy' });
    }

    const isHlsManifest = /\.m3u8($|\?)/i.test(decodedUrl);
    if (isHlsManifest) {
      try {
        const buf = await fetchUrlAsBuffer(decodedUrl, {
          headers: {
            'Accept': 'application/vnd.apple.mpegurl,*/*',
            'User-Agent': req.headers['user-agent'] || 'ADNFLIX-StreamProxy/1.0',
          },
        });
        const manifestText = buf.toString('utf8');
        const proxyBaseUrl = getStreamProxyBaseUrl(req);
        const rewritten = rewriteHlsManifest(manifestText, decodedUrl, proxyBaseUrl);
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'public, max-age=5');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(rewritten);
      } catch (err) {
        console.error('[video proxy] HLS manifest fetch failed:', err.message);
        return res.status(502).json({ error: 'Failed to fetch HLS manifest' });
      }
    }

    let range = req.headers.range;
    const firstChunkSize = PROXY_STREAM_BUFFER_SIZE;
    if (range && range.trim().toLowerCase() === 'bytes=0-') {
      range = `bytes=0-${firstChunkSize - 1}`;
    }
    const requestHeaders = {
      'Accept': req.headers.accept || 'video/*,*/*;q=0.9',
      'User-Agent': req.headers['user-agent'] || 'ADNFLIX-StreamProxy/1.0',
    };
    if (range) requestHeaders.range = range;

    let redirectCount = 0;
    const maxRedirects = 5;

    function doRequest(url) {
      const options = new URL(url);
      const client = options.protocol === 'https:' ? https : http;
      const proxyReq = client.request(url, { headers: requestHeaders }, (proxyRes) => {
        const status = proxyRes.statusCode;
        if (status === 301 || status === 302 || status === 307 || status === 308) {
          const location = proxyRes.headers.location;
          if (redirectCount >= maxRedirects || !location) {
            res.writeHead(status, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Too many redirects or missing Location' }));
          }
          redirectCount++;
          const nextUrl = new URL(location, url).href;
          if (!isUrlAllowedForProxy(nextUrl)) {
            return res.status(403).json({ error: 'Redirect target not allowed for proxy' });
          }
          return doRequest(nextUrl);
        }
        if (status !== 200 && status !== 206) {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Upstream video unavailable', status }));
        }
        const contentType = proxyRes.headers['content-type'] || 'video/mp4';
        const headers = {
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        };
        if (proxyRes.headers['content-length']) headers['Content-Length'] = proxyRes.headers['content-length'];
        if (proxyRes.headers['content-range']) headers['Content-Range'] = proxyRes.headers['content-range'];
        res.writeHead(status, headers);
        const bufferStream = new PassThrough({ highWaterMark: PROXY_STREAM_BUFFER_SIZE });
        proxyRes.pipe(bufferStream).pipe(res);
        req.on('abort', () => {
          bufferStream.destroy();
          proxyRes.destroy();
        });
      });

      proxyReq.on('error', (err) => {
        console.error('[video proxy]', err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Failed to fetch video' });
      });
      proxyReq.setTimeout(PROXY_UPSTREAM_TIMEOUT_MS, () => {
        proxyReq.destroy();
        if (!res.headersSent) res.status(504).json({ error: 'Upstream timeout' });
      });
      req.on('abort', () => proxyReq.destroy());
      proxyReq.end();
    }

    doRequest(decodedUrl);
  } catch (error) {
    next(error);
  }
}

// Upload video
async function uploadVideo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    const fileUrl = `/api/videos/${req.file.filename}`;
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const fullUrl = `${protocol}://${req.get('host')}${fileUrl}`;
    res.json({
      success: true,
      url: fullUrl,
      filename: req.file.filename,
      size: req.file.size,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Larger chunks = fewer read syscalls and smoother streaming (reduces buffering)
const STREAM_HIGH_WATER_MARK = 512 * 1024; // 512KB

// Serve video with range support
async function serveVideo(req, res, next) {
  try {
    const filename = req.params.filename;
    const filePath = path.join(VIDEO_STORAGE_PATH, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo', '.mov': 'video/quicktime', '.flv': 'video/x-flv',
      '.3gp': 'video/3gpp', '.m4v': 'video/x-m4v'
    };
    const contentType = contentTypes[ext] || 'video/mp4';
    const streamOpts = { highWaterMark: STREAM_HIGH_WATER_MARK };
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize || start > end || start < 0) {
        res.writeHead(416, { 'Content-Range': `bytes */${fileSize}`, 'Accept-Ranges': 'bytes' });
        return res.end();
      }
      const actualEnd = Math.min(end, fileSize - 1);
      const file = fs.createReadStream(filePath, { start, end: actualEnd, ...streamOpts });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${actualEnd}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': (actualEnd - start) + 1,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(filePath, streamOpts).pipe(res);
    }
  } catch (error) {
    next(error);
  }
}

// Delete video
async function deleteVideo(req, res, next) {
  try {
    const filename = req.params.filename;
    const filePath = path.join(VIDEO_STORAGE_PATH, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video not found' });
    }
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// List videos
async function listVideos(req, res, next) {
  try {
    const files = fs.readdirSync(VIDEO_STORAGE_PATH);
    const videoFiles = files
      .filter(file => ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv', '.3gp', '.m4v'].includes(path.extname(file).toLowerCase()))
      .map(file => {
        const filePath = path.join(VIDEO_STORAGE_PATH, file);
        const stat = fs.statSync(filePath);
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        return { filename: file, size: stat.size, url: `${protocol}://${req.get('host')}/api/videos/${file}`, createdAt: stat.birthtime };
      });
    res.json({ videos: videoFiles });
  } catch (error) {
    next(error);
  }
}

// Upload audio
async function uploadAudio(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    res.json({
      success: true,
      url: `${protocol}://${req.get('host')}/api/audio/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      message: 'Audio file uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Serve audio
async function serveAudio(req, res, next) {
  try {
    const filename = req.params.filename;
    const audioPath = path.join(VIDEO_STORAGE_PATH, 'audio', filename);
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }
    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = { '.mp3': 'audio/mpeg', '.aac': 'audio/aac', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.flac': 'audio/flac' };
    const contentType = contentTypes[ext] || 'audio/mpeg';
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const file = fs.createReadStream(audioPath, { start, end });
      res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${fileSize}`, 'Accept-Ranges': 'bytes', 'Content-Length': (end - start) + 1, 'Content-Type': contentType });
      file.pipe(res);
    } else {
      res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': contentType, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadVideo, serveVideo, deleteVideo, listVideos, uploadAudio, serveAudio, streamProxy };
