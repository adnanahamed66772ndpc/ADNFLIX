# ADNFLIX – Production Deployment (Docker)

This document describes how to run ADNFLIX in **production** using Docker.

---

## Prerequisites

- Docker Engine and Docker Compose v2
- (Optional) Reverse proxy (e.g. Nginx, Caddy) in front of the stack for HTTPS

---

## Quick Start (Production)

1. **Clone and switch to production branch**
   ```bash
   git clone https://github.com/adnanahamed66772ndpc/ADNFLIX.git
   cd ADNFLIX
   git checkout production
   ```

2. **Configure secrets**
   - Edit `docker-compose.yml` and set:
     - `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` (and matching `DB_PASSWORD`)
     - `JWT_SECRET` and `SESSION_SECRET` (min 32 characters each)
     - `CORS_ORIGINS` to your frontend domain(s), e.g. `https://yourdomain.com,https://www.yourdomain.com`

3. **Start the full stack**
   ```bash
   docker compose up -d --build
   ```

4. **Verify**
   - Frontend: `http://YOUR_SERVER_IP/` (port 80)
   - Backend health: `http://127.0.0.1:3000/health` (or via reverse proxy)
   - Default admin: username `admin`, password `admin` — change after first login.

---

## Production Configuration Summary

| Item | Where | Notes |
|------|--------|--------|
| Database | `docker-compose.yml` → `db` | MySQL 8.4, no host ports. Data in volume `mysql_data`. |
| Backend | `docker-compose.yml` → `backend` | Port 127.0.0.1:3000 only. Set JWT_SECRET, SESSION_SECRET, CORS_ORIGINS. |
| Frontend | `docker-compose.yml` → `web` | Nginx, port 80. Proxies `/api` and `/health` to backend. |
| Videos | `./storage/videos` | Bind-mounted; ensure path exists and is writable. |
| Migrations | Automatic | Run on backend startup via `docker-entrypoint.sh`. |
| Admin user | Seeded on first run | `admin` / `admin` — change password in Account → Password. |

---

## Environment Variables (Production)

Backend reads from `docker-compose.yml` environment section. For reference, see:

- `backend/.env.production.example`

Required in production:

- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `SESSION_SECRET` (strong, unique)
- `CORS_ORIGINS` (your frontend origin(s))

---

## Branches

- **main** – development / default branch.
- **production** – production-ready code and Docker configuration; use this branch for deploying with Docker.

---

## HTTPS (Recommended)

Run a reverse proxy (Nginx, Caddy, or Traefik) on the host that:

1. Terminates SSL for your domain.
2. Proxies `https://yourdomain.com` → `http://localhost:80` (web).
3. Proxies `https://api.yourdomain.com` → `http://127.0.0.1:3000` (backend).

Then set `CORS_ORIGINS` to your HTTPS frontend URL(s).
