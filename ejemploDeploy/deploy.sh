#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Sincroniza código al VPS y construye ahí
#
# Flujo completo:
#   1. rsync del código fuente al VPS  (/datos/iads/src/)
#   2. Docker build en el VPS          (linux/amd64 nativo, sin emulación)
#   3. Extrae el standalone al VPS     (/datos/iads/app/)
#   4. Corre migraciones Prisma
#   5. docker compose up -d            (node:20-alpine + volumen montado)
#
# El contenedor web NO tiene código adentro — monta /datos/iads/app/ como volumen.
# El rebuild usa Docker layer cache → rápido en deploys sucesivos.
#
# Uso:
#   ./deploy.sh                   deploy completo
#   ./deploy.sh --skip-build      saltea build y extracción (solo reinicia)
#   ./deploy.sh --skip-migrate    no corre migraciones
#   ./deploy.sh --only-migrate    solo corre migraciones
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VPS_HOST="ubuntu@mtdmsites"
VPS_DIR="/datos/violaPresales"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BUILD_IMAGE="violaPresales-build-tmp"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${BLUE}▸${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${BOLD}── $1 ──${NC}"; }

# ── Flags ─────────────────────────────────────────────────────────────────────
SKIP_BUILD=false
SKIP_MIGRATE=false
ONLY_MIGRATE=false

for arg in "$@"; do
  case $arg in
    --skip-build)   SKIP_BUILD=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    --only-migrate) ONLY_MIGRATE=true; SKIP_BUILD=true ;;
    *) warn "Argumento desconocido: $arg" ;;
  esac
done

# ── Pre-checks ────────────────────────────────────────────────────────────────
step "Pre-checks"

[ -f "$ENV_FILE" ] || err "No existe $ENV_FILE. Copiá .env.prod.example → .env.prod y completá los valores."
ssh -q -o BatchMode=yes -o ConnectTimeout=5 "$VPS_HOST" exit 2>/dev/null \
  || err "No se pudo conectar a $VPS_HOST."

ok "Pre-checks OK"

# ── Preparar directorios en VPS ───────────────────────────────────────────────
step "Preparando directorios en VPS"

ssh "$VPS_HOST" "
  sudo mkdir -p $VPS_DIR/src $VPS_DIR/app $VPS_DIR/prisma $VPS_DIR/db &&
  sudo chown -R \$(whoami):\$(whoami) $VPS_DIR &&
  echo OK
"
ok "Directorios listos en $VPS_DIR"

# ── Sincronizar código fuente al VPS ─────────────────────────────────────────
if [ "$ONLY_MIGRATE" = false ]; then
  step "Sincronizando código fuente → VPS"

  log "rsyncing src (sin node_modules ni .next)..."
  rsync -az --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='**/node_modules' \
    --exclude='apps/web/.next' \
    --exclude='apps/web/.env.local' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='.env.*.local' \
    --exclude='.env.prod' \
    --exclude='deploy.sh' \
    . "$VPS_HOST:$VPS_DIR/src/"

  ok "Código sincronizado en $VPS_DIR/src/"
fi

# ── Sincronizar config (compose, Dockerfile.migrate, .env) ───────────────────
step "Sincronizando configuración"

rsync -az "$COMPOSE_FILE" "$VPS_HOST:$VPS_DIR/docker-compose.yml"
rsync -az "Dockerfile.migrate" "$VPS_HOST:$VPS_DIR/"
rsync -az "$ENV_FILE" "$VPS_HOST:$VPS_DIR/.env"
rsync -az "packages/database/prisma/" "$VPS_HOST:$VPS_DIR/prisma/"

ok "Configuración sincronizada"

# ── Build en el VPS + extracción del standalone ───────────────────────────────
if [ "$SKIP_BUILD" = false ] && [ "$ONLY_MIGRATE" = false ]; then
  step "Build Docker en VPS (linux/amd64 nativo)"

  log "Construyendo imagen (primera vez ~5 min, después usa cache)..."
  ssh "$VPS_HOST" "
    cd $VPS_DIR/src
    docker build -t $BUILD_IMAGE -f apps/web/Dockerfile .
  "
  ok "Imagen construida en VPS"

  log "Extrayendo standalone a $VPS_DIR/app/ ..."
  ssh "$VPS_HOST" "
    docker create --name iads-extract $BUILD_IMAGE
    rm -rf $VPS_DIR/app && mkdir -p $VPS_DIR/app
    docker cp iads-extract:/app/. $VPS_DIR/app/
    docker rm iads-extract
    docker rmi $BUILD_IMAGE
    rm -rf $VPS_DIR/src
    echo OK
  "
  ok "Standalone extraído en $VPS_DIR/app/ (fuente eliminada)"
fi

# ── Migraciones ───────────────────────────────────────────────────────────────
if [ "$SKIP_MIGRATE" = false ]; then
  step "Migraciones de base de datos"

  ssh "$VPS_HOST" "
    cd $VPS_DIR
    docker compose up -d postgres
    echo 'Esperando postgres...'
    for i in \$(seq 1 12); do
      docker compose ps postgres | grep -q 'healthy' && break
      echo \"  intento \$i/12...\"; sleep 5
    done
    docker compose build migrator
    docker compose --profile migrate run --rm migrator
  "
  ok "Migraciones aplicadas"
else
  warn "Migraciones omitidas"
fi

# ── Levantar servicios ────────────────────────────────────────────────────────
if [ "$ONLY_MIGRATE" = false ]; then
  step "Levantando servicios"

  ssh "$VPS_HOST" "
    cd $VPS_DIR
    docker compose up -d --remove-orphans postgres web
  "
  ok "Servicios levantados"
fi

# ── Health check ──────────────────────────────────────────────────────────────
if [ "$ONLY_MIGRATE" = false ]; then
  sleep 8
  DOMAIN=$(grep '^DOMAIN=' "$ENV_FILE" | cut -d= -f2 | tr -d '"')
  if [ -n "$DOMAIN" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$DOMAIN" 2>/dev/null || echo "000")
    if [[ "$STATUS" =~ ^(200|301|302|307)$ ]]; then
      ok "App respondiendo en https://$DOMAIN (HTTP $STATUS)"
    else
      warn "HTTP $STATUS — revisá: ssh $VPS_HOST 'docker logs iads-web --tail 50'"
    fi
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  Deploy completado 🚀${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  En el VPS:"
echo "    $VPS_DIR/src/    ← código fuente"
echo "    $VPS_DIR/app/    ← standalone Next.js (generado en VPS)"
echo "    $VPS_DIR/prisma/ ← schema Prisma"
echo "    $VPS_DIR/db/     ← datos PostgreSQL"
echo ""
echo "  Comandos útiles:"
echo "    Logs:      ssh $VPS_HOST 'docker logs iads-web -f'"
echo "    Reiniciar: ssh $VPS_HOST 'docker restart iads-web'"
echo "    Estado:    ssh $VPS_HOST 'cd $VPS_DIR && docker compose -f $COMPOSE_FILE ps'"
echo ""
echo "  Próximos deploys (solo código, sin migraciones):"
echo "    ./deploy.sh --skip-migrate"
echo ""
