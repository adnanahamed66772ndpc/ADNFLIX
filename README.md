# ADNFLIX - Video Streaming Platform

A full-stack video streaming platform with React frontend and Node.js backend.

## Live URLs (set via environment / config)

Replace `YOUR_DOMAIN` with your actual domain (e.g. `coliningram.site`).

| Service | URL |
|---------|-----|
| Frontend | `https://YOUR_DOMAIN` |
| Backend API | `https://api.YOUR_DOMAIN` |
| API Health | `https://api.YOUR_DOMAIN/health` |

---

## Tech Stack

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Radix UI** - Component Library
- **Framer Motion** - Animations
- **React Router** - Navigation
- **HLS.js** - Video Streaming
- **Zustand** - State Management

### Backend
- **Node.js** - Runtime (CommonJS)
- **Express.js** - Web Framework
- **MySQL** - Database
- **JWT** - Authentication
- **Multer** - File Uploads
- **Helmet** - Security Headers
- **Express Rate Limit** - API Protection

---

## Project Structure

```
STEMFLIX/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── api/             # API Client
│   │   ├── components/      # Reusable Components
│   │   ├── hooks/           # Custom Hooks
│   │   ├── pages/           # Page Components
│   │   └── lib/             # Utilities
│   ├── public/              # Static Assets
│   └── dist/                # Build Output
│
├── backend/                  # Node.js Backend
│   ├── migrations/           # SQL schema (001, 002, 003, 004)
│   ├── src/
│   │   ├── config/          # Database & Storage Config
│   │   ├── controllers/     # Route Controllers
│   │   ├── middleware/      # Auth, Upload, etc.
│   │   ├── migrations/      # runMigrations.js runner
│   │   ├── routes/          # API Routes
│   │   └── server.js        # Entry Point
│   └── storage/             # Video Storage
│
├── .github/workflows/        # CI/CD (check on push, optional deploy)
├── android.zip               # Android app source (Kotlin) – unzip to build
├── docker-compose.yml       # Docker production stack
└── package.json             # Root Scripts
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Titles (Movies/Series)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/titles` | Get all titles |
| GET | `/api/titles/:id` | Get title by ID |
| GET | `/api/titles/featured` | Get featured titles |
| GET | `/api/titles/trending` | Get trending titles |
| GET | `/api/titles/search?q=` | Search titles |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id/titles` | Get titles by category |

### Watchlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/watchlist` | Get user's watchlist |
| POST | `/api/watchlist` | Add to watchlist |
| DELETE | `/api/watchlist/:titleId` | Remove from watchlist |

### Playback
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/playback/:titleId` | Get playback info |
| POST | `/api/playback/progress` | Update watch progress |
| GET | `/api/playback/continue` | Get continue watching |

### Videos (Streaming)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos/:filename` | Stream video file |

### Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/plans` | Get subscription plans |
| GET | `/api/config/payment-methods` | Get payment methods |

---

## Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=production
PORT=3000

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_database_password
DB_NAME=your_db_name

# Security (Generate secure random strings!)
# Run: node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
JWT_SECRET=your_64_char_jwt_secret
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_64_char_session_secret

# CORS (comma-separated; use your real frontend origin)
CORS_ORIGINS=https://YOUR_DOMAIN,https://www.YOUR_DOMAIN
# Optional: dev origins (defaults: localhost:8080,3000,5173)
# CORS_DEV_ORIGINS=http://localhost:8080,http://localhost:5173

# Storage
VIDEO_STORAGE_PATH=./storage/videos
MAX_VIDEO_SIZE=5368709120
```

### Frontend (.env.production)

```env
# API base URL (use your backend origin)
VITE_API_URL=https://api.YOUR_DOMAIN/api
```

---

## Local Development

### Prerequisites
- Node.js 18+
- MySQL (local or use Docker)

### Setup

```bash
# Clone repository
git clone https://github.com/adnanahamed66772ndpc/ADNFLIX.git
cd ADNFLIX

# Install all dependencies
npm run install:all

# Setup backend .env
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Run database migrations
cd backend && npm run migrate

# Start development servers
cd .. && npm run dev
```

### Development URLs
- Frontend: http://localhost:8080
- Backend: http://localhost:3000
- API: http://localhost:3000/api

---

## Deployment

### Docker (Production)

See [Docker (Production)](#docker-production) below.

---

## Features

### User Features
- User registration & login
- Browse movies & TV series
- Search titles
- Watchlist management
- Continue watching
- Video playback with custom player
- Multi-language audio support
- Subscription plans

### Admin Features
- Dashboard with analytics
- Manage titles (CRUD)
- Manage categories
- Manage users
- Upload videos
- Configure ads
- Support tickets

### Video Player
- HLS streaming support
- Custom controls
- Skip intro/outro
- Quality selection
- Audio track selection
- Fullscreen mode
- Progress tracking
- Ad integration (pre-roll, mid-roll)

---

## Security

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention
- XSS protection

---

## Scripts

### Root
```bash
npm run dev          # Run frontend & backend
npm run build        # Build frontend
npm start            # Start backend (production)
npm run install:all  # Install all dependencies
```

### Backend
```bash
npm start           # Production server
npm run dev         # Development with hot reload
npm run migrate     # Run database migrations
```

### Frontend
```bash
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
```

---

## Troubleshooting

### CORS Errors
- Check `CORS_ORIGINS` in backend `.env`
- Ensure frontend URL is whitelisted

### Database Connection Failed
- Verify MySQL credentials in `.env`: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- Ensure user has privileges on the database

### 404 on Page Refresh (Frontend)
- Add `.htaccess` rewrite rules
- Or configure server for SPA routing

### Video Not Playing
- Check video URL is accessible
- Verify video format (MP4, HLS)
- Check browser console for errors

### Port Already in Use
```bash
# Windows
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Linux/Mac
kill $(lsof -t -i:3000)
```

---

## Android app

The repo includes **`android.zip`** – the Android (Kotlin) app source. To build:

1. Unzip: `unzip android.zip`
2. Open the `android` folder in Android Studio
3. Set your API base URL in the app config and build

---

## License

ISC License

---

## Docker (Production)

This repo includes a ready-to-run Docker production setup:

- **web**: Nginx serves the frontend and proxies `/api` → backend
- **backend**: Node.js API
- **db**: MySQL (optional; you can point backend to external MySQL instead)

### Start (Docker)

From the project root:

```bash
docker compose up -d --build
```

Then run migrations once:

```bash
docker compose exec backend npm run migrate
```

### URLs

- Frontend: `http://YOUR_SERVER_IP/`
- API health: `http://YOUR_SERVER_IP/health`
- API: `http://YOUR_SERVER_IP/api`

### Notes

- **Secrets**: change `JWT_SECRET` and `SESSION_SECRET` in `docker-compose.yml` (min 32 chars).
- **Videos storage**: persisted to `./storage/videos` on the host.

---

## CI/CD (GitHub Actions)

On every **push to `main`**:

1. **Check**: install deps, lint frontend, build frontend. If any step fails, the workflow stops.
2. **Deploy** (optional): if checks pass and deploy secrets are set, the workflow SSHs to your server and runs `git pull`, `docker compose pull`, `docker compose up -d --build`, then migrations.

### Enable automatic deploy

1. In your **production server**: clone the repo and run `docker compose up -d` once. Note the path (e.g. `~/STEMFLIX` or `/var/www/STEMFLIX`).
2. In **GitHub**: repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add:
   - **`DEPLOY_HOST`**: server IP or hostname (e.g. `123.45.67.89`).
   - **`DEPLOY_USER`**: SSH user (e.g. `root` or `deploy`).
   - **`SSH_PRIVATE_KEY`**: full contents of the private key that can SSH into the server (no passphrase, or use an agent).
   - **`DEPLOY_PATH`** (optional): path to the app on the server (e.g. `/var/www/STEMFLIX`). Default is `~/STEMFLIX`.

3. Push to `main`. The **Check** job runs every time; **Deploy** runs only when all checks pass and these secrets exist.

### CI only (no deploy)

If you do **not** add the deploy secrets, only the check job runs (lint + build). Deploy is skipped.

---

## Author

ADNFLIX Team

## Repository

https://github.com/adnanahamed66772ndpc/ADNFLIX
