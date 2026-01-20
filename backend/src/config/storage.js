import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get storage path from environment or use default
const storagePath = process.env.VIDEO_STORAGE_PATH || './storage/videos';

// Resolve to absolute path
const absoluteStoragePath = storagePath.startsWith('/') 
  ? storagePath 
  : resolve(__dirname, '../../', storagePath);

// Ensure storage directory exists
if (!fs.existsSync(absoluteStoragePath)) {
  fs.mkdirSync(absoluteStoragePath, { recursive: true });
  console.log(`Created video storage directory: ${absoluteStoragePath}`);
}

export const VIDEO_STORAGE_PATH = absoluteStoragePath;
export const MAX_VIDEO_SIZE = parseInt(process.env.MAX_VIDEO_SIZE || '5368709120'); // 5GB default
