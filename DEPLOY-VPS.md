# Deploy ADNFLIX / STEMFLIX on a Fresh VPS (Docker)

Step-by-step guide to deploy the app with Docker on a **fresh VPS** (Ubuntu/Debian).

---

## 1. Connect to your VPS

```bash
ssh root@YOUR_VPS_IP
# or: ssh your_user@YOUR_VPS_IP
```

Replace `YOUR_VPS_IP` with your server IP or hostname.

---

## 2. Install Docker and Docker Compose (fresh VPS)

Run these on the VPS:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Optional: run Docker as your user (logout/login after)
sudo usermod -aG docker $USER
```

Verify:

```bash
docker --version
docker compose version
```

---

## 3. Clone the repository on the VPS

Use a directory like `/opt/ADNFLIX` (GitHub Actions deploy expects this path):

```bash
sudo mkdir -p /opt
sudo chown $USER:$USER /opt
cd /opt
git clone https://github.com/adnanahamed66772ndpc/ADNFLIX.git
cd ADNFLIX
```

If you use a different path, remember to change the path in the GitHub Actions workflow later.

---

## 4. Configure deployment

Edit the CONFIG section at the top of `deploy.sh` on the VPS:

```bash
nano deploy.sh
```

Set (or use env vars when running the script):

| Variable | Example | Description |
|----------|---------|-------------|
| `DOMAIN` | `yourdomain.com` | Your domain (or VPS IP for testing) |
| `JWT_SECRET` | long random string | Min 32 chars. Generate: `openssl rand -base64 48` |
| `SESSION_SECRET` | long random string | Min 32 chars. Generate: `openssl rand -base64 48` |
| `MYSQL_PASSWORD` | strong password | DB user password |
| `MYSQL_ROOT_PASSWORD` | strong password | MySQL root password |
| `CORS_ORIGINS` | `http://yourdomain.com,https://yourdomain.com` | Comma-separated frontend origins |

Example CONFIG in `deploy.sh`:

```sh
DOMAIN="${ADNFLIX_DOMAIN:-yourdomain.com}"
JWT_SECRET="${ADNFLIX_JWT_SECRET:-paste_output_of_openssl_rand_base64_48}"
SESSION_SECRET="${ADNFLIX_SESSION_SECRET:-paste_another_openssl_rand_base64_48}"
MYSQL_PASSWORD="${ADNFLIX_MYSQL_PASSWORD:-your_secure_db_password}"
MYSQL_ROOT_PASSWORD="${ADNFLIX_MYSQL_ROOT_PASSWORD:-your_secure_root_password}"
CORS_ORIGINS="${ADNFLIX_CORS_ORIGINS:-http://yourdomain.com,https://yourdomain.com,http://www.yourdomain.com}"
```

Generate secrets on the VPS:

```bash
openssl rand -base64 48
# Run twice: once for JWT_SECRET, once for SESSION_SECRET
```

---

## 5. Run the deploy script

On the VPS, from the project directory:

```bash
cd /opt/ADNFLIX
chmod +x deploy.sh
./deploy.sh
```

**If you see** `'/usr/bin/env: sh\r': No such file or directory` **:** the script has Windows line endings. Fix with:
```bash
sed -i 's/\r$//' deploy.sh
./deploy.sh
```

This will:

- Create a `.env` file (used by Docker Compose)
- Create `storage/videos` for uploaded videos
- Build and start: **db** (MySQL), **backend** (Node API), **web** (Nginx + frontend)

---

## 6. Check that containers are running

```bash
docker compose ps
```

You should see `adnflix-db`, `adnflix-backend`, and `adnflix-web` running.

View logs if needed:

```bash
docker compose logs -f backend
# Ctrl+C to exit
```

---

## 7. Access the app

By default:

- **Frontend:** only on the VPS (bound to 127.0.0.1:8080)
- **Backend:** only on the VPS (bound to 127.0.0.1:3000)

So you need a **reverse proxy on the host** (Nginx or Caddy) to serve the app on port 80/443 and your domain.

### Option A: Use Nginx on the host (recommended)

Install Nginx on the VPS:

```bash
sudo apt install -y nginx
```

Create a site config (replace `yourdomain.com` with your domain or use your VPS IP):

```bash
sudo nano /etc/nginx/sites-available/adnflix
```

Paste (adjust `server_name` and paths if needed):

```nginx
# Frontend + API on same host (Nginx proxies /api and /health to backend)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    # Or use default_server and server_name _; for IP-only access

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/adnflix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Then open: **http://yourdomain.com** (or **http://YOUR_VPS_IP**).

### Option B: Expose ports directly (testing only)

For a quick test **without** Nginx, you can bind to all interfaces. **Not recommended for production.**

Edit `docker-compose.yml` on the VPS:

- Change `"127.0.0.1:8080:80"` to `"8080:80"` for the **web** service.
- Change `"127.0.0.1:3000:3000"` to `"3000:3000"` for the **backend** service.

Then:

```bash
docker compose up -d --build
```

Access: **http://YOUR_VPS_IP:8080** (frontend), **http://YOUR_VPS_IP:3000** (API).  
Update `CORS_ORIGINS` in `deploy.sh` to include `http://YOUR_VPS_IP:8080` and re-run `./deploy.sh` or set in `.env`.

---

## 8. Default admin login

- **Username:** `admin`
- **Password:** `admin123` (change after first login in Account → Password)

---

## 9. (Optional) HTTPS with Let's Encrypt

On the VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will adjust Nginx for HTTPS. Then set in `deploy.sh` / `.env`:

- `CORS_ORIGINS` including `https://yourdomain.com` and `https://www.yourdomain.com`

Re-run `./deploy.sh` so the backend gets the new CORS settings (or edit `.env` and `docker compose up -d`).

---

## 10. (Optional) Auto-deploy on push (GitHub Actions)

To deploy automatically when you push to `main`:

1. **On the VPS (one-time):**  
   Ensure the app is at `/opt/ADNFLIX`, and you have run `./deploy.sh` at least once (so `.env` exists).

2. **On GitHub:**  
   Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add:
   - **`VPS_HOST`** – VPS IP or hostname (e.g. `coliningram.site` or `1.2.3.4`)
   - **`VPS_USER`** – SSH user (e.g. `root` or `ubuntu`)
   - **`SSH_PRIVATE_KEY`** – The **private** key (not the `.pub` file). On your PC: `cat ~/.ssh/id_rsa` (or `id_ed25519`) and paste the **entire** output, including the lines `-----BEGIN ... KEY-----` and `-----END ... KEY-----`. No extra spaces at the top or bottom.

3. **Optional:** If SSH is not on port 22, add secret **`VPS_PORT`** and in `.github/workflows/deploy.yml` add the `port` option to the SSH step (see comments in that file).

After that, every push to `main` will SSH into the VPS, pull the latest code, and run `docker compose --env-file .env up -d --build`.

---

## Quick reference

| Task | Command |
|------|--------|
| Deploy / update | `cd /opt/ADNFLIX && ./deploy.sh` |
| View logs | `docker compose logs -f backend` |
| Restart backend | `docker compose restart backend` |
| Stop all | `docker compose down` |
| Stop and remove DB data | `docker compose down -v` |

---

## Troubleshooting

- **MySQL not healthy:** `docker compose logs db`. For a clean start: `docker compose down -v` then `./deploy.sh`.
- **Backend exits:** `docker compose logs backend`. Check that DB credentials in `.env` match the `db` service.
- **502 on /api:** Ensure Nginx proxies to `http://127.0.0.1:3000` and that `adnflix-backend` is running: `docker compose ps`.
- **CORS errors in browser:** Add your frontend URL (e.g. `https://yourdomain.com`) to `CORS_ORIGINS` in `deploy.sh`, then re-run `./deploy.sh`.
- **GitHub Actions: "ssh: no key found" or "handshake failed":** The `SSH_PRIVATE_KEY` secret must be the **private key you use on your PC/laptop to SSH into the VPS** (not a key from the VPS). On your **PC** run `cat ~/.ssh/id_rsa` (or `id_ed25519`) and paste the full output into the secret. The VPS has the matching public key in `authorized_keys`; it does not have this private key.
- **VPS: "git@github.com: Permission denied (publickey)" when running git:** The VPS is trying to pull from GitHub over SSH but has no key (or the wrong one). Easiest fix: use HTTPS instead of SSH for the repo on the VPS so no key is needed:
  ```bash
  cd /opt/ADNFLIX
  git remote set-url origin https://github.com/adnanahamed66772ndpc/ADNFLIX.git
  git fetch origin main && git reset --hard origin/main
  ```
  If you prefer SSH from the VPS, add the VPS public key (e.g. `cat /root/.ssh/github_deploy.pub`) as a **Deploy key** in the repo (Settings → Deploy keys), then run: `git config core.sshCommand "ssh -i /root/.ssh/github_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"`.
