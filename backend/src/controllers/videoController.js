import fs from 'fs';
import path from 'path';
import { VIDEO_STORAGE_PATH } from '../config/storage.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Video Controller - No Encoding/Conversion Policy
 * 
 * IMPORTANT: All video operations preserve original quality and format.
 * - NO encoding, transcoding, or conversion is performed
 * - Videos are stored and served exactly as uploaded
 * - Original file format and quality are maintained
 */

// Upload video - stores file as-is without any processing or encoding
export async function uploadVideo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // File is already stored by multer middleware - no encoding/transcoding performed
    // Return URL to the original file as uploaded
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

// Serve video with range support for streaming
// Serves files directly without any processing, encoding, or conversion
// Original quality and format are preserved
export async function serveVideo(req, res, next) {
  try {
    const filename = req.params.filename;
    const filePath = path.join(VIDEO_STORAGE_PATH, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Serve file as-is - no processing or encoding
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.flv': 'video/x-flv',
      '.3gp': 'video/3gpp',
      '.m4v': 'video/x-m4v'
    };
    const contentType = contentTypes[ext] || 'video/mp4';

    if (range) {
      // Parse range header for chunked streaming support
      // Streams file in chunks directly without any processing or encoding
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      // Validate range
      if (start >= fileSize || end >= fileSize || start > end || start < 0) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
        });
        return res.end();
      }
      
      // Ensure end doesn't exceed file size
      const actualEnd = Math.min(end, fileSize - 1);
      const actualChunkSize = (actualEnd - start) + 1;
      
      const file = fs.createReadStream(filePath, { start, end: actualEnd });

      const head = {
        'Content-Range': `bytes ${start}-${actualEnd}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': actualChunkSize,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Enable CORS for chunked requests
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Send entire file as-is - no encoding or conversion
      // Note: Browser will typically request chunks via range headers
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Accept-Ranges': 'bytes', // Important: Enable range requests for chunked streaming
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
      };

      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
}

// Delete video
export async function deleteVideo(req, res, next) {
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

// List videos (admin only)
export async function listVideos(req, res, next) {
  try {
    const files = fs.readdirSync(VIDEO_STORAGE_PATH);
    const videoFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv', '.3gp', '.m4v'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(VIDEO_STORAGE_PATH, file);
        const stat = fs.statSync(filePath);
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        return {
          filename: file,
          size: stat.size,
          url: `${protocol}://${req.get('host')}/api/videos/${file}`,
          createdAt: stat.birthtime
        };
      });

    res.json({ videos: videoFiles });
  } catch (error) {
    next(error);
  }
}

// Upload audio file (admin only)
export async function uploadAudio(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // File is already stored by multer middleware
    const fileUrl = `/api/audio/${req.file.filename}`;
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const fullUrl = `${protocol}://${req.get('host')}${fileUrl}`;

    res.json({
      success: true,
      url: fullUrl,
      filename: req.file.filename,
      size: req.file.size,
      message: 'Audio file uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Serve audio file with range support for streaming
export async function serveAudio(req, res, next) {
  try {
    const filename = req.params.filename;
    const audioPath = path.join(VIDEO_STORAGE_PATH, 'audio', filename);

    // Check if file exists
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Serve file with proper headers
    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.mp3': 'audio/mpeg',
      '.aac': 'audio/aac',
      '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.opus': 'audio/opus'
    };
    const contentType = contentTypes[ext] || 'audio/mpeg';

    if (range) {
      // Parse range header for streaming support
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(audioPath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      };

      res.writeHead(200, head);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
}