#!/usr/bin/env bash
set -e

# ─── WireGuard Orchestrator — Install Script ───────────────────────────────
# Installs Docker (if missing), configures UFW (if available), then downloads
# and starts WireGuard Orchestrator.
#
# Usage:
#   wget https://raw.githubusercontent.com/mypbs/wireguard-orchestrator/main/install.sh
#   sudo bash install.sh
# ──────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()      { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()    { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

INSTALL_DIR="${INSTALL_DIR:-wireguard-orchestrator}"
APP_PORT="${APP_PORT:-8899}"
REPO_ZIP="https://github.com/mypbs/wireguard-orchestrator/archive/refs/heads/main.zip"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   WireGuard Orchestrator — Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Must run as root (or via sudo) ─────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  fail "This script must be run with sudo: sudo bash install.sh"
fi

# ── 2. Detect OS ──────────────────────────────────────────────────────────
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_ID="$ID"
  OS_FAMILY="${ID_LIKE:-$ID}"
else
  fail "Cannot detect OS. This script supports Ubuntu/Debian-based systems."
fi

case "$OS_FAMILY $OS_ID" in
  *debian*|*ubuntu*) PKG_MGR="apt-get" ;;
  *) warn "Unsupported OS family '$OS_FAMILY'. Continuing anyway — some steps may fail." ;;
esac

# ── 3. Check / install Docker ─────────────────────────────────────────────
info "Checking for Docker..."
if command -v docker &>/dev/null; then
  DOCKER_VER=$(docker --version 2>/dev/null | head -1)
  ok "Docker already installed: $DOCKER_VER"
else
  warn "Docker not found — installing via get.docker.com..."
  if ! command -v curl &>/dev/null; then
    apt-get update -qq && apt-get install -y -qq curl
  fi
  curl -fsSL https://get.docker.com | sh
  ok "Docker installed."
fi

# ── 4. Check / install Docker Compose plugin ──────────────────────────────
info "Checking for Docker Compose..."
if docker compose version &>/dev/null 2>&1; then
  ok "Docker Compose plugin available."
elif command -v docker-compose &>/dev/null; then
  ok "Standalone docker-compose available."
else
  warn "Docker Compose plugin not found — installing..."
  apt-get update -qq && apt-get install -y -qq docker-compose-plugin
  ok "Docker Compose plugin installed."
fi

# ── 5. Check / configure UFW ──────────────────────────────────────────────
info "Checking UFW firewall..."
if command -v ufw &>/dev/null; then
  ok "UFW found."
else
  warn "UFW not installed — installing..."
  apt-get update -qq && apt-get install -y -qq ufw
  ok "UFW installed."
fi

# Allow SSH first (safety: never lock yourself out)
info "Ensuring SSH access is allowed in UFW..."
ufw allow ssh >/dev/null 2>&1
ok "SSH allowed."

# Allow the dashboard port
info "Opening port $APP_PORT/tcp in UFW..."
ufw allow "$APP_PORT/tcp" >/dev/null 2>&1
ok "Port $APP_PORT open."

# Enable UFW (non-interactively, --force skips the confirmation prompt)
UFW_STATUS=$(ufw status | head -1)
if echo "$UFW_STATUS" | grep -q "inactive"; then
  info "Enabling UFW..."
  ufw --force enable >/dev/null 2>&1
  ok "UFW enabled."
else
  ok "UFW already active."
fi

ufw status numbered

# ── 6. Download WireGuard Orchestrator ────────────────────────────────────
echo ""
info "Downloading WireGuard Orchestrator..."

if ! command -v wget &>/dev/null; then
  apt-get update -qq && apt-get install -y -qq wget
fi
if ! command -v unzip &>/dev/null; then
  apt-get update -qq && apt-get install -y -qq unzip
fi

# If an existing install is present, preserve .env
if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/.env" ]; then
  info "Existing installation found — preserving .env..."
  cp "$INSTALL_DIR/.env" /tmp/wg-orchestrator-env.bak
  PRESERVED_ENV=1
fi

wget -q --show-progress "$REPO_ZIP" -O /tmp/wg-orchestrator.zip
unzip -q -o /tmp/wg-orchestrator.zip -d /tmp/wg-extract
rm -f /tmp/wg-orchestrator.zip

# Remove old install dir and replace with fresh extract
rm -rf "$INSTALL_DIR"
mv /tmp/wg-extract/wireguard-orchestrator-main "$INSTALL_DIR"
rm -rf /tmp/wg-extract

ok "Downloaded and extracted to ./$INSTALL_DIR"

# ── 7. Write / restore .env ───────────────────────────────────────────────
if [ "${PRESERVED_ENV:-0}" = "1" ]; then
  cp /tmp/wg-orchestrator-env.bak "$INSTALL_DIR/.env"
  rm -f /tmp/wg-orchestrator-env.bak
  ok ".env restored from previous installation."
elif [ ! -f "$INSTALL_DIR/.env" ]; then
  SESSION_SECRET=$(openssl rand -hex 32)
  echo "SESSION_SECRET=$SESSION_SECRET" > "$INSTALL_DIR/.env"
  ok ".env created with new SESSION_SECRET."
fi

# ── 8. Start the app ──────────────────────────────────────────────────────
echo ""
info "Starting WireGuard Orchestrator..."
cd "$INSTALL_DIR"
docker compose up -d --build

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}  Installation complete!${NC}"
echo ""
echo "  Dashboard: http://$(hostname -I | awk '{print $1}'):$APP_PORT"
echo ""
echo "  First visit: create your admin account."
echo "  The first build takes 3–5 minutes — grab a coffee."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
