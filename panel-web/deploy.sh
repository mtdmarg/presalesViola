#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Toyota Viola Presales Panel
#
# Flujo completo:
#   1. rsync del código fuente al VPS  (/datos/violaPresales/src/)
#   2. Docker build en el VPS          (linux/amd64 nativo, sin emulación)
#   3. Extrae el standalone al VPS     (/datos/violaPresales/app/)
#   4. docker compose up -d
#
# La base de datos es EXTERNA — no se levanta ningún postgres local.
# El setup inicial de la tabla panel_users se hace con --setup-db (una sola vez).
#
# Uso:
#   ./deploy.sh                   deploy completo (rsync + build + up)
#   ./deploy.sh --skip-build      solo reinicia el contenedor (no rebuild)
#   ./deploy.sh --setup-db        además, corre panel_users.sql en la DB externa
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VPS_HOST="ubuntu@mtdmsites"
VPS_DIR="/datos/violaPresales"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BUILD_IMAGE="viola-presales-build-tmp"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${BLUE}▸${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${BOLD}── $1 ──${NC}"; }

# ── Flags ─────────────────────────────────────────────────────────────────────
SKIP_BUILD=false
SETUP_DB=false

for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --setup-db)   SETUP_DB=true ;;
    *) warn "Argumento desconocido: $arg" ;;
  esac
done

# ── Pre-checks ────────────────────────────────────────────────────────────────
step "Pre-checks"

[ -f "$ENV_FILE" ] || err "No existe $ENV_FILE. Copiá .env.prod.example → .env.prod y completá los valores."
ssh -q -o BatchMode=yes -o ConnectTimeout=5 "$VPS_HOST" exit 2>/dev/null \
  || err "No se pudo conectar a $VPS_HOST sin passphrase interactivo.\n  → Corré primero: ssh-add ~/.ssh/id_rsa"

ok "Pre-checks OK"

# Leer variables del .env.prod para uso local (health check y build args)
set -o allexport
# shellcheck disable=SC1090
source "$ENV_FILE"
set +o allexport

# ── Preparar directorios en VPS ───────────────────────────────────────────────
step "Preparando directorios en VPS"

ssh "$VPS_HOST" "
  sudo mkdir -p $VPS_DIR/src $VPS_DIR/app &&
  sudo chown -R \$(whoami):\$(whoami) $VPS_DIR &&
  echo OK
"
ok "Directorios listos en $VPS_DIR"

# ── Sincronizar código fuente al VPS ─────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  step "Sincronizando código fuente → VPS"

  rsync -az --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env.local' \
    --exclude='.env.prod' \
    --exclude='.env.prod.example' \
    --exclude='deploy.sh' \
    --exclude='DEPLOY.md' \
    . "$VPS_HOST:$VPS_DIR/src/"

  ok "Código sincronizado en $VPS_DIR/src/"
fi

# ── Sincronizar configuración (compose + .env) ────────────────────────────────
step "Sincronizando configuración"

rsync -az "$COMPOSE_FILE" "$VPS_HOST:$VPS_DIR/docker-compose.yml"
rsync -az "$ENV_FILE" "$VPS_HOST:$VPS_DIR/.env"

ok "Configuración sincronizada"

# ── Build en el VPS ───────────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  step "Build Docker en VPS (linux/amd64 nativo)"

  APP_NAME="${NEXT_PUBLIC_APP_NAME:-Toyota Viola · Presales}"

  log "Construyendo imagen (primera vez ~5 min, después usa cache)..."
  ssh "$VPS_HOST" "
    cd $VPS_DIR/src
    docker build -t $BUILD_IMAGE \
      --build-arg NEXT_PUBLIC_APP_NAME=\"$APP_NAME\" \
      .
  "
  ok "Imagen construida en VPS"

  log "Extrayendo standalone a $VPS_DIR/app/ ..."
  ssh "$VPS_HOST" "
    docker create --name viola-presales-extract $BUILD_IMAGE
    rm -rf $VPS_DIR/app && mkdir -p $VPS_DIR/app
    docker cp viola-presales-extract:/app/. $VPS_DIR/app/
    docker rm viola-presales-extract
    docker rmi $BUILD_IMAGE
    rm -rf $VPS_DIR/src
    echo OK
  "
  ok "Standalone extraído en $VPS_DIR/app/ (fuente eliminada)"
fi

# ── Setup DB (solo primer deploy o cuando hay cambios en panel_users.sql) ─────
if [ "$SETUP_DB" = true ]; then
  step "Setup de base de datos"

  log "Copiando panel_users.sql al VPS..."
  rsync -az panel_users.sql "$VPS_HOST:$VPS_DIR/"

  log "Ejecutando panel_users.sql en la DB externa..."
  DB_URL="${DATABASE_URL}"
  ssh "$VPS_HOST" "
    docker run --rm -i postgres:16-alpine \
      psql '$DB_URL' < $VPS_DIR/panel_users.sql
  "
  ok "Tabla panel_users verificada"
fi

# ── Levantar servicios ────────────────────────────────────────────────────────
step "Levantando servicios"

ssh "$VPS_HOST" "
  cd $VPS_DIR
  docker compose up -d --remove-orphans web
"
ok "Servicio levantado"

# ── Health check ──────────────────────────────────────────────────────────────
sleep 8
if [ -n "${DOMAIN:-}" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$DOMAIN" 2>/dev/null || echo "000")
  if [[ "$STATUS" =~ ^(200|301|302|307)$ ]]; then
    ok "App respondiendo en https://$DOMAIN (HTTP $STATUS)"
  else
    warn "HTTP $STATUS — revisá: ssh $VPS_HOST 'docker logs viola-presales-web --tail 50'"
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  Deploy completado${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  En el VPS:"
echo "    $VPS_DIR/app/    ← standalone Next.js (generado en VPS)"
echo "    $VPS_DIR/.env    ← variables de entorno de producción"
echo ""
echo "  Comandos útiles:"
echo "    Logs:      ssh $VPS_HOST 'docker logs viola-presales-web -f'"
echo "    Reiniciar: ssh $VPS_HOST 'docker restart viola-presales-web'"
echo "    Estado:    ssh $VPS_HOST 'cd $VPS_DIR && docker compose ps'"
echo ""
echo "  Próximos deploys (sin rebuild):"
echo "    ./deploy.sh --skip-build"
echo ""
