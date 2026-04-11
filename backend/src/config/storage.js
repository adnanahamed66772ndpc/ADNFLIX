const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Get storage path from environment or use default
const storagePath = process.env.VIDEO_STORAGE_PATH || './storage/videos';

// Resolve to absolute path
const absoluteStoragePath = storagePath.startsWith('/') 
  ? storagePath 
  : path.resolve(__dirname, '../../', storagePath);

// Ensure storage directory exists
if (!fs.existsSync(absoluteStoragePath)) {
  fs.mkdirSync(absoluteStoragePath, { recursive: true });
  console.log(`Created video storage directory: ${absoluteStoragePath}`);
}

const VIDEO_STORAGE_PATH = absoluteStoragePath;
const MAX_VIDEO_SIZE = parseInt(process.env.MAX_VIDEO_SIZE || '5368709120'); // 5GB default

module.exports = { VIDEO_STORAGE_PATH, MAX_VIDEO_SIZE };
