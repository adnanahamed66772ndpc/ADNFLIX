# ADNFLIX - Video Streaming Platform

A full-stack video streaming platform with React frontend, Node.js backend, and optional Docker deployment.

---

## Live URLs

| Service      | URL |
|-------------|-----|
| Frontend    | http://coliningram.site/ |
| Backend API | http://api.coliningram.site/ |
| API Health  | http://api.coliningram.site/health |

---

## Tech Stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Framer Motion, React Router, HLS.js |
| Backend  | Node.js (CommonJS), Express.js, MySQL, JWT, Multer, Helmet, express-rate-limit |

---

## Project Structure

```
STEMFLIX/
├── .github/workflows/
│   └── ci-cd.yml              # CI (lint, build) + optional SSH deploy
├── backend/
│   ├── migrations/            # SQL schema (001–005)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_categories.sql
│   │   ├── 003_separate_progress_tables.sql
│   │   ├── 004_add_tickets_and_pages.sql
│   │   └── 005_add_username_and_seed_admin.sql
│   ├── src/
│   │   ├── config/            # database.js, storage.js
│   │   ├── controllers/       # auth, titles, videos, admin, ads, etc.
│   │   ├── middleware/        # auth.js, roles.js, upload.js
│   │   ├── migrations/        # runMigrations.js, seedAdmin.js
│   │   ├── routes/            # auth, titles, watchlist, playback, admin, etc.
│   │   ├── utils/             # jwt.js, password.js
│   │   └── server.js
│   ├── docker-entrypoint.sh   # migrations + seed admin + start server
│   ├── Dockerfile
│   ├── .env.example
│   └── .env.production.example
├── frontend/
│   ├── src/
│   │   ├── api/               # client.ts (API URL from env)
│   │   ├── components/        # Navbar, Footer, VideoPlayer, admin, ui
│   │   ├── contexts/          # AuthContext, TitlesContext
│   │   ├── hooks/             # useAuth, useTitles, useWatchlist, etc.
│   │   ├── lib/               # adProvider, sanitize, utils
│   │   └── pages/             # Index, Browse, Watch, Login, Admin, Account, etc.
│   ├── public/
│   ├── nginx.default.conf     # SPA + /api proxy (Docker)
│   ├── Dockerfile
│   ├── .env.example
│   └── .env.production
├── docker-compose.yml         # db, backend, web (full stack)
├── android.zip               # Android app source (Kotlin)
├── package.json              # Root scripts (install:all, dev, build)
└── README.md
```

---

## Default Admin

- **Username:** `admin`
- **Password:** `admin` (change after first login)
- **Change password:** Log in → Account → Password tab.

In Docker, the default admin is created automatically on first backend start (see `backend/src/migrations/seedAdmin.js`).

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login (email or username) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/profile` | Update profile |
| PATCH | `/api/auth/password` | Change password |

### Titles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/titles` | List titles |
| GET | `/api/titles/:id` | Title by ID |
| GET | `/api/titles/featured` | Featured |
| GET | `/api/titles/trending` | Trending |
| GET | `/api/titles/search?q=` | Search |

### Categories, Watchlist, Playback, Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:id/titles` | Titles by category |
| GET/POST/DELETE | `/api/watchlist` | Watchlist |
| GET | `/api/playback/:titleId` | Playback info |
| POST | `/api/playback/progress` | Update progress |
| GET | `/api/playback/continue` | Continue watching |
| GET | `/api/videos/:filename` | Stream video |
| GET | `/api/config/plans` | Subscription plans |
| GET | `/api/config/payment-methods` | Payment methods |

---

## Environment Variables

### Backend

Copy `backend/.env.example` to `backend/.env` (or use `backend/.env.production.example` for production). Required:

- **Server:** `NODE_ENV`, `PORT`
- **Database:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **Security:** `JWT_SECRET`, `SESSION_SECRET` (min 32 chars in production)
- **CORS:** `CORS_ORIGINS` (comma-separated frontend origins)
- **Storage:** `VIDEO_STORAGE_PATH`, `MAX_VIDEO_SIZE` (optional)

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### Frontend

- **Development:** `frontend/.env` or `.env.local` → `VITE_API_URL=http://localhost:3000/api`
- **Production:** `frontend/.env.production` → `VITE_API_URL=http://api.coliningram.site/api` (or your backend URL)

---

## Local Development

**Prerequisites:** Node.js 18+, MySQL

```bash
git clone https://github.com/adnanahamed66772ndpc/ADNFLIX.git
cd ADNFLIX

npm run install:all
cp backend/.env.example backend/.env
# Edit backend/.env (DB_*, JWT_SECRET, SESSION_SECRET, CORS_ORIGINS)

cd backend && npm run migrate && cd ..
npm run dev
```

- Frontend: http://localhost:8080  
- Backend: http://localhost:3000  
- API: http://localhost:3000/api  

---

## Docker (Production)

Full stack: **db** (MySQL 8.4), **backend** (Node + migrations + seed admin), **web** (Nginx + frontend).

```bash
docker compose up -d --build
```

- Frontend: http://YOUR_SERVER_IP/
- API: http://YOUR_SERVER_IP/api
- Health: http://YOUR_SERVER_IP/health

Migrations run on backend startup. Optional manual run:

```bash
docker compose exec backend node src/migrations/runMigrations.js
```

**Before production:** set `JWT_SECRET` and `SESSION_SECRET` in `docker-compose.yml` (min 32 chars). Video files: `./storage/videos` on host.

---

## Features

- **Users:** Register, login (email or username), profile, change password, watchlist, continue watching, subscription plans.
- **Admin:** Default user `admin`/`admin`; dashboard, titles/categories/users, video upload, ads, support tickets.
- **Player:** HLS, custom controls, progress, audio tracks, ads (pre/mid/post roll).

---

## Scripts

| Where   | Command | Description |
|---------|---------|-------------|
| Root    | `npm run install:all` | Install frontend + backend deps |
| Root    | `npm run dev`         | Run frontend + backend |
| Root    | `npm run build`       | Build frontend |
| Backend | `npm start`           | Production server |
| Backend | `npm run dev`         | Dev with watch |
| Backend | `npm run migrate`     | Run migrations |
| Frontend| `npm run dev`         | Vite dev server |
| Frontend| `npm run build`       | Production build |

---

## CI/CD (GitHub Actions)

On **push to `main`**:

1. **Check:** install deps, lint frontend, build frontend.
2. **Deploy (optional):** if secrets are set, SSH to server and run `git pull`, `docker compose up -d --build`, migrations.

**Secrets (optional):** `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`. If not set, only the check job runs.

---

## Android App

The repo includes **`android.zip`** (Kotlin/Compose). Unzip, open in Android Studio, set the API base URL, and build.

---

## Troubleshooting

- **CORS:** Add your frontend URL to `CORS_ORIGINS` in backend `.env`.
- **DB:** Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` and user privileges.
- **503 / ESM:** Backend is CommonJS; ensure no `"type": "module"` in `backend/package.json` if using cPanel/LiteSpeed.
- **Port in use:** Change `PORT` in backend or stop the process using the port.

---

## License

ISC

---

## Repository

https://github.com/adnanahamed66772ndpc/ADNFLIX
