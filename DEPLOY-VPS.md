# Deploy ADNFLIX on a Fresh VPS

One path: Ubuntu/Debian VPS → Docker → Nginx. Run each step on the VPS in order.

---

## Step 1. Connect

```bash
ssh root@YOUR_VPS_IP
```

Replace `YOUR_VPS_IP` with your server IP or hostname.

---

## Step 2. Install Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Check: `docker --version` and `docker compose version`.

---

## Step 3. Clone repo

```bash
sudo mkdir -p /opt && sudo chown $USER:$USER /opt
cd /opt
git clone https://github.com/adnanahamed66772ndpc/ADNFLIX.git
cd ADNFLIX
```

Fix line endings and make the script executable:

```bash
sed -i 's/\r$//' deploy.sh
chmod +x deploy.sh
```

---

## Step 4. Generate secrets

Run twice and save each output for the next step:

```bash
openssl rand -base64 48
```

---

## Step 5. Configure deploy.sh

```bash
nano deploy.sh
```

At the top, set (use your domain and the two secrets from Step 4):

- `DOMAIN` — e.g. `yourdomain.com` or your VPS IP
- `JWT_SECRET` — first `openssl rand -base64 48` output
- `SESSION_SECRET` — second `openssl rand -base64 48` output
- `MYSQL_PASSWORD` — strong password
- `MYSQL_ROOT_PASSWORD` — strong password
- `CORS_ORIGINS` — e.g. `http://yourdomain.com,https://yourdomain.com`

Save: Ctrl+O, Enter, Ctrl+X.

---

## Step 6. Deploy app

```bash
cd /opt/ADNFLIX
./deploy.sh
```

Wait for the build to finish. Then check:

```bash
docker compose ps
```

You should see `adnflix-db`, `adnflix-backend`, and `adnflix-web` running.

---

## Step 7. Install Nginx and proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/adnflix
```

Paste this (change `yourdomain.com` to your domain or use `_` for IP-only):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
        proxy_set_header Host $host;
    }
}
```

Save and exit, then enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/adnflix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 8. Open the app

In your browser: **http://yourdomain.com** (or **http://YOUR_VPS_IP**).

**Admin login:** username `admin`, password `admin123`. Change it after first login (Account → Password).

---

## Quick reference

| Task            | Command |
|-----------------|--------|
| Update deploy   | `cd /opt/ADNFLIX && git pull origin main && ./deploy.sh` |
| Backend logs   | `docker compose logs -f backend` |
| Restart backend | `docker compose restart backend` |
| Stop all       | `docker compose down` |

---

## Troubleshooting

- **deploy.sh: `sh\r: No such file or directory`** — Run `sed -i 's/\r$//' deploy.sh` then `./deploy.sh` again.
- **MySQL not ready** — `docker compose logs db`. Clean start: `docker compose down -v` then `./deploy.sh`.
- **Backend crashes** — `docker compose logs backend`; check DB credentials in `.env`.
- **502 Bad Gateway** — Ensure Nginx has `proxy_pass http://127.0.0.1:3000` for `/api` and `/health`, and run `docker compose ps` to confirm `adnflix-backend` is up.
- **CORS errors** — Add your site URL (e.g. `https://yourdomain.com`) to `CORS_ORIGINS` in `deploy.sh`, then run `./deploy.sh` again.
