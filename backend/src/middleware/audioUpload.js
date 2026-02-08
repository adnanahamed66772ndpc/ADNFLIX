const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { VIDEO_STORAGE_PATH } = require('../config/storage.js');

/**
 * Audio File Upload Middleware
 * 
 * Handles upload of separate audio files (MP3, AAC, M4A, etc.)
 * for dual audio track support
 */

// Allowed audio file extensions
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.aac', '.m4a', '.ogg', '.wav', '.flac', '.opus'];

// Create audio storage directory if it doesn't exist
const AUDIO_STORAGE_PATH = path.join(VIDEO_STORAGE_PATH, 'audio');
if (!fs.existsSync(AUDIO_STORAGE_PATH)) {
  fs.mkdirSync(AUDIO_STORAGE_PATH, { recursive: true });
}

// Configure storage for audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AUDIO_STORAGE_PATH);
  },
  filename: (req, file, cb) => {
    // Preserve original file extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter for audio files
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid audio file type. Allowed: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`), false);
  }
};

// Configure multer for audio files
const uploadAudio = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max for audio files
  }
});

// Single audio file upload middleware
const uploadSingleAudio = uploadAudio.single('audio');

module.exports = { uploadAudio, uploadSingleAudio };
