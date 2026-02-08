const fs = require('fs');
const path = require('path');
const { VIDEO_STORAGE_PATH } = require('../config/storage.js');

/**
 * Video Controller - No Encoding/Conversion Policy
 */

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
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize || start > end || start < 0) {
        res.writeHead(416, { 'Content-Range': `bytes */${fileSize}`, 'Accept-Ranges': 'bytes' });
        return res.end();
      }
      const actualEnd = Math.min(end, fileSize - 1);
      const file = fs.createReadStream(filePath, { start, end: actualEnd });
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
      fs.createReadStream(filePath).pipe(res);
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

module.exports = { uploadVideo, serveVideo, deleteVideo, listVideos, uploadAudio, serveAudio };
