#!/usr/bin/env bash
# Idempotent: Nginx reverse proxy to Docker (8080 / 3000), UFW 22/80/443, optional Let's Encrypt.
# Run with sudo. Domain: first arg or DEPLOY_DOMAIN.
# Optional: CERTBOT_EMAIL=you@mail.com for HTTPS (needs DNS A record pointing to this server).

set -euo pipefail

DOMAIN="${1:-${DEPLOY_DOMAIN:-}}"
if [ -z "$DOMAIN" ]; then
  echo "Usage: sudo DEPLOY_DOMAIN=example.com bash $0 [domain]"
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y nginx
fi

NGINX_SITE="/etc/nginx/sites-available/adnflix"
cat >"$NGINX_SITE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
    }
}
EOF

ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/adnflix
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl reload nginx || systemctl start nginx

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  if ufw status 2>/dev/null | grep -q "Status: inactive"; then
    ufw --force enable
  fi
fi

if [ -n "${CERTBOT_EMAIL:-}" ]; then
  apt-get update -qq
  apt-get install -y certbot python3-certbot-nginx
  # Try apex + www; if www DNS is missing, fall back to apex only
  if ! certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --redirect -m "$CERTBOT_EMAIL" 2>/dev/null; then
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect -m "$CERTBOT_EMAIL" || true
  fi
  systemctl reload nginx || true
fi

echo "Expose OK: http://${DOMAIN} (and https if Certbot ran)"
