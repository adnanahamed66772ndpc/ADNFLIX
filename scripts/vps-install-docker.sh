#!/usr/bin/env bash
# One-time: install Docker Engine + Compose v2 plugin on Ubuntu/Debian.
# Run on the VPS: sudo bash scripts/vps-install-docker.sh
# Safe to re-run; exits early if docker and "docker compose" already work.

set -euo pipefail

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "Docker and Compose plugin are already installed."
  docker --version
  docker compose version
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Re-run with elevated privileges, e.g.: sudo bash $0"
  exit 1
fi

. /etc/os-release
case "${ID:-}" in
  ubuntu) REPO_URL="https://download.docker.com/linux/ubuntu" ;;
  debian) REPO_URL="https://download.docker.com/linux/debian" ;;
  *)
    echo "Unsupported OS ID=${ID:-unknown}. See https://docs.docker.com/engine/install/"
    exit 1
    ;;
esac

CODENAME="${VERSION_CODENAME:-}"
if [ -z "$CODENAME" ]; then
  echo "VERSION_CODENAME missing in /etc/os-release"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL "${REPO_URL}/gpg" -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] ${REPO_URL} ${CODENAME} stable" >/etc/apt/sources.list.d/docker.list
apt-get update -qq
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker 2>/dev/null || true

# When run as: sudo bash this-script, let the calling user use the socket after next login
if [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
  usermod -aG docker "$SUDO_USER" 2>/dev/null || true
fi

echo "Installed:"
docker --version
docker compose version
echo "If you deploy as a non-superuser, add them to the docker group and reconnect: usermod -aG docker <username>"
