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
├── backend/
│   ├── migrations/            # SQL schema 001–005 (ordered, no duplicates; 005 idempotent)
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
- **Email:** `admin@admin.com`
- **Password:** `admin123` (change after first login)
- **Change password:** Log in → Account → Password tab.

In Docker, the default admin is created automatically on first backend start (see `backend/src/migrations/seedAdmin.js`).

---

## API Endpoints

Base URL: `/api` (e.g. `https://api.coliningram.site/api`). Auth required: send `Authorization: Bearer <token>` or use session. **Admin** = admin role required.

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no `/api` prefix) |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login (email or username) |
| POST | `/api/auth/logout` | Logout (auth) |
| GET | `/api/auth/me` | Current user (auth) |
| PUT | `/api/auth/profile` | Update profile (auth) |
| PATCH | `/api/auth/password` | Change password (auth) |

### Titles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/titles` | List all titles (public) |
| GET | `/api/titles/:id` | Title by ID (public) |
| POST | `/api/titles` | Create title (admin) |
| PUT | `/api/titles/:id` | Update title (admin) |
| DELETE | `/api/titles/:id` | Delete title (admin) |
| POST | `/api/titles/:titleId/seasons` | Add season (admin) |
| DELETE | `/api/titles/seasons/:seasonId` | Delete season (admin) |
| POST | `/api/titles/seasons/:seasonId/episodes` | Add episode (admin) |
| DELETE | `/api/titles/episodes/:episodeId` | Delete episode (admin) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories (public) |
| GET | `/api/categories/:id` | Category by ID (public) |
| POST | `/api/categories` | Create category (admin) |
| PUT | `/api/categories/:id` | Update category (admin) |
| DELETE | `/api/categories/:id` | Delete category (admin) |

### Watchlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/watchlist` | Get watchlist (auth) |
| POST | `/api/watchlist` | Add to watchlist (auth) |
| DELETE | `/api/watchlist/:titleId` | Remove from watchlist (auth) |

### Playback
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/playback` | All playback progress / continue watching (auth) |
| POST | `/api/playback` | Update playback progress (auth) |
| GET | `/api/playback/:titleId` | Progress for a title (auth) |
| GET | `/api/playback/movie/:titleId` | Movie progress (auth) |
| DELETE | `/api/playback/movie/:titleId` | Delete movie progress (auth) |
| GET | `/api/playback/series/:titleId` | Series progress (auth) |
| DELETE | `/api/playback/series/:titleId` | Delete series progress (auth) |

### Videos & audio
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos/:filename` | Stream video (public) |
| GET | `/api/videos` | List videos (admin) |
| POST | `/api/videos/upload` | Upload video (admin) |
| DELETE | `/api/videos/:filename` | Delete video (admin) |
| GET | `/api/videos/audio/:filename` | Stream audio (public) |
| POST | `/api/videos/audio/upload` | Upload audio (admin) |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions (auth) |
| POST | `/api/transactions` | Create transaction (auth) |
| POST | `/api/transactions/:transactionId/approve` | Approve (admin) |
| POST | `/api/transactions/:transactionId/reject` | Reject (admin) |

### Admin (users)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List users (admin) |
| PUT | `/api/admin/users/:userId/role` | Update user role (admin) |
| PUT | `/api/admin/users/:userId/subscription` | Update subscription (admin) |
| DELETE | `/api/admin/users/:userId` | Delete user (admin) |

### Ads
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ads/settings` | Ad settings (public) |
| GET | `/api/ads/videos/active` | Active ad videos (public) |
| POST | `/api/ads/impressions` | Track impression (optional auth) |
| PUT | `/api/ads/settings` | Update ad settings (admin) |
| GET | `/api/ads/videos` | List ad videos (admin) |
| POST | `/api/ads/videos` | Add ad video (admin) |
| PUT | `/api/ads/videos/:id` | Update ad video (admin) |
| DELETE | `/api/ads/videos/:id` | Delete ad video (admin) |

### Tickets (support)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List my tickets (auth) |
| GET | `/api/tickets/:id` | Ticket by ID (auth) |
| POST | `/api/tickets` | Create ticket (auth) |
| PUT | `/api/tickets/:id` | Update ticket (admin) |
| POST | `/api/tickets/:id/replies` | Add reply (auth) |

### Pages (CMS)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pages/:key` | Page content by key (public) |
| GET | `/api/pages` | List all pages (admin) |
| PUT | `/api/pages/:key` | Update page content (admin) |

### Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | All config (plans, payment methods, app version) (public) |
| GET | `/api/config/plans` | Subscription plans (public) |
| GET | `/api/config/payment-methods` | Payment methods (public) |

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

Deploy the full app (database, backend, frontend) with Docker Compose v2. No host MySQL or Node required.

### What runs

| Service   | Image / Build        | Role |
|-----------|----------------------|------|
| **db**    | `mysql:8.4`          | MySQL 8.4. No ports exposed on host; only backend can connect. |
| **backend** | Built from `./backend` | Node.js API. Runs migrations then `seedAdmin.js` (creates `admin`/`admin` if missing), then starts server. Exposed only on **127.0.0.1:3000** (localhost). |
| **web**   | Built from `./frontend` | Nginx: serves the built React app and proxies `/api` and `/health` to the backend. Exposed on **127.0.0.1:8080** so host Nginx can use port 80. |

### Prerequisites

- Docker and Docker Compose v2 installed on the server.
- Port **80** for host Nginx (proxies to frontend at 127.0.0.1:8080 and API at 127.0.0.1:3000). Port **8080** = frontend container.

### One-command deploy (`deploy.sh`)

Put your production settings in one place and run:

1. **Edit the CONFIG at the top of `deploy.sh`** (or set env vars and run it):

   - `DOMAIN` – e.g. `coliningram.site` (used for CORS and printed URLs).
   - `JWT_SECRET`, `SESSION_SECRET` – min 32 chars; generate with `openssl rand -base64 48`.
   - `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` – optional; change from defaults if you want.
   - `CORS_ORIGINS` – optional; defaults to `http://localhost`, `http://DOMAIN`, `http://www.DOMAIN`.

2. **Run the script** (creates `.env`, then runs `docker compose up -d --build`):

   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   The script creates a root `.env` (ignored by git) so Compose gets your values. Frontend, backend, and health URLs are printed at the end.

### Step-by-step (manual)

1. **Clone the repo on the server**

   ```bash
   git clone https://github.com/adnanahamed66772ndpc/ADNFLIX.git
   cd ADNFLIX
   ```

2. **Optional – production secrets**

   Edit `docker-compose.yml` and set:

   - `JWT_SECRET` and `SESSION_SECRET` to long random strings (min 32 characters).
   - Optionally change `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, and `DB_PASSWORD` (keep them in sync; use quoted values if they contain special characters).

   Generate secrets:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```

3. **Validate Compose file (optional)**

   ```bash
   docker compose config
   ```

4. **Build and start the stack**

   ```bash
   docker compose up -d --build
   ```

   This builds the backend and frontend images, starts the DB, waits for MySQL to be healthy, then starts backend and web.

5. **Verify**

   - **Frontend:** http://YOUR_SERVER_IP/
   - **API (via Nginx):** http://YOUR_SERVER_IP/api
   - **Health (via Nginx):** http://YOUR_SERVER_IP/health
   - **Backend direct (only on server):** http://127.0.0.1:3000/health

   Default admin: **username** `admin`, **password** `admin` (change after first login).

### Useful commands

| Command | Description |
|---------|-------------|
| `docker compose up -d --build` | Build and start all services in background |
| `docker compose up -d --build db backend` | Start only DB and backend (no web) |
| `docker compose ps` | List running containers and status |
| `docker compose logs -f backend` | Follow backend logs |
| `docker compose logs -f db` | Follow MySQL logs |
| `docker compose restart backend` | Restart backend only |
| `docker compose down` | Stop and remove containers (volumes kept) |
| `docker compose down -v` | Stop and remove containers and named volumes |
| `docker compose exec backend node src/migrations/runMigrations.js` | Run migrations manually |
| `docker compose exec backend sh` | Shell into backend container |

### Volumes and data

- **`mysql_data`** (named volume): MySQL data. Persists across `docker compose down`. Removed only with `docker compose down -v`.
- **`./storage/videos`** (bind mount): Video files uploaded via the app. Create the folder on the host if needed; the backend can create it at runtime. Back up this path for your media.

### Migrations and default admin

- **Migrations:** Run automatically when the backend container starts (see `backend/docker-entrypoint.sh`: first migrations, then seed, then server).
- **Default admin:** Created by `seedAdmin.js` if a user with username `admin` or email `admin@localhost` does not exist. Safe to run multiple times.

### Reverse proxy (optional)

If you put Nginx or Caddy on the host in front of Docker:

- The **web** container is bound to **127.0.0.1:8080** so host Nginx can use port 80. In Nginx: `proxy_pass http://127.0.0.1:8080;` for the frontend.
- For the API subdomain, proxy to the backend: `proxy_pass http://127.0.0.1:3000;` (server_name e.g. `api.yourdomain.com`).
- The **web** container already proxies `/api` and `/health` to the backend, so if you only proxy to the web container, the browser only talks to one origin.

### CI/CD (GitHub Actions)

On every **push to `main`**, a workflow SSHs into your VPS, pulls the latest code, and runs `docker compose up -d --build` so frontend and backend are updated automatically.

**One-time setup**

1. On the VPS: clone the repo to `/opt/ADNFLIX`, run `./deploy.sh` once to create `.env` (and start containers).
2. In GitHub: repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add:
   - **`VPS_HOST`** – your VPS IP or hostname (e.g. `vps1.example.com`).
   - **`VPS_USER`** – SSH user (e.g. `root`).
   - **`SSH_PRIVATE_KEY`** – full contents of the private key used to SSH to the VPS (e.g. paste from `~/.ssh/id_rsa` or your deploy key).
3. If SSH is not on port 22: add secret **`VPS_PORT`** and in `.github/workflows/deploy.yml` add under the step: `port: ${{ secrets.VPS_PORT }}`.

After that, each push to `main` triggers a deploy. You can also run the workflow manually: **Actions** → **Deploy to Production** → **Run workflow**.

### Troubleshooting Docker

- **MySQL not healthy:** Check `docker compose logs db`. Ensure no other MySQL is using the same data dir. For a clean start: `docker compose down -v` then `docker compose up -d --build` (this deletes DB data).
- **Backend exits:** Check `docker compose logs backend`. Verify DB credentials in `docker-compose.yml` match the **db** service (e.g. `DB_HOST=db`, same passwords).
- **502 / connection refused on /api:** Ensure **web** and **backend** are on the same Compose network (default). Restart: `docker compose restart backend web`.
- **Port 80 in use:** The web container uses `127.0.0.1:8080:80` by default so host Nginx can bind to 80. If you need the app on port 80 without host Nginx, change to `"80:80"` and stop Nginx or use a different host port.

### Security (scan findings)

- **HTTP security headers:** The frontend Nginx config adds `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, and `Permissions-Policy`. Rebuild the web image to apply.
- **Host Nginx:** Add the same headers (and optionally `Strict-Transport-Security`) in your host Nginx server block for HTTPS. Keep Nginx and the OS updated to avoid "Nginx EOL" / version findings.
- **SSH (port 22):** Findings like "SSH auth methods", "SHA-1 HMAC" are about the VPS, not this repo. Harden SSH on the server (e.g. disable password auth, use keys only; tighten `sshd_config` if you want to disable SHA-1 HMAC).
- **WAF / TLS / DNS / RDAP:** Informational or handled by your host/domain (e.g. Certbot for TLS, DNS at your registrar).

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
