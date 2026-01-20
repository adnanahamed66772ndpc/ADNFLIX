import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { VIDEO_STORAGE_PATH, MAX_VIDEO_SIZE } from '../config/storage.js';

/**
 * Video Upload Middleware - No Encoding/Conversion Policy
 * 
 * IMPORTANT: This system stores videos in their ORIGINAL quality and format.
 * - NO encoding, transcoding, or conversion is performed
 * - Videos are stored exactly as uploaded by the admin
 * - Original file format and quality are preserved
 * - Browser compatibility depends on the uploaded video format
 * 
 * Supported formats: MP4, WebM, MKV, AVI, MOV, FLV, 3GP, M4V
 * Note: Videos must be in browser-compatible format when uploaded.
 */

// Allowed video file extensions
const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv', '.3gp', '.m4v'];

// Configure storage - stores files directly without any processing
// Videos are saved in their original format and quality
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEO_STORAGE_PATH);
  },
  filename: (req, file, cb) => {
    // Preserve original file extension - no format conversion
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter - only checks file extension, no format validation or conversion
// Accepts files based on extension only, stores them as-is
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
};

// Configure multer - no encoding, transcoding, or quality changes
// Files are stored exactly as uploaded
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE
  }
});

// Single file upload middleware
// Uploads video files in their original quality without any processing
export const uploadVideo = upload.single('video');
