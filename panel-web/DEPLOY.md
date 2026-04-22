# Deploy — Toyota Viola Presales Panel

## Arquitectura

```
Tu Mac (desarrollo)
│
│  ./deploy.sh
│
├─ rsync código fuente ──────────────────→ VPS /datos/violaPresales/src/  (temporal)
│
│  [en el VPS]
├─ docker build  ──────────────────────→  imagen temporal (linux/amd64)
├─ docker cp /app/ ────────────────────→  VPS /datos/violaPresales/app/   (build output)
├─ docker rmi + rm src ────────────────→  limpieza
│
└─ docker compose up -d
        viola-presales-web  → node:20-alpine + volumen /datos/violaPresales/app/
```

**La base de datos es externa** (PostgreSQL compartido con n8n/Baserow). No se levanta ningún contenedor de postgres.

### Principios clave

- El contenedor web no tiene código adentro. Usa `node:20-alpine` y monta el build output desde el filesystem del VPS como volumen read-only.
- El build ocurre en el VPS (linux/amd64 nativo), garantizando que los binarios sean correctos para la plataforma.
- La imagen temporal se elimina después de extraer el standalone.

---

## Estructura en el VPS

```
/datos/violaPresales/
  app/              ← Next.js standalone (resultado del build)
    server.js       ← entry point
    node_modules/   ← dependencias mínimas (incluidas en standalone)
    public/
    .next/
  .env              ← variables de entorno de producción
  docker-compose.yml
  panel_users.sql   ← SQL de setup (solo primer deploy)
```

---

## Primer deploy

### 1. Crear `.env.prod`

```bash
cp .env.prod.example .env.prod
# Completar todos los valores reales
```

### 2. Apuntar el DNS

Apuntar el dominio configurado en `DOMAIN` a la IP del VPS.

### 3. Deploy completo con setup de DB

```bash
./deploy.sh --setup-db
```

Esto hace todo: rsync → build → up → y además crea la tabla `panel_users` en la DB externa.

### 4. Crear el primer usuario admin

Conectarse a la DB y correr:

```bash
# Generar el hash de la contraseña (reemplazar "TuContraseña123")
node -e "const b=require('bcryptjs'); console.log(b.hashSync('TuContraseña123',12))"
```

Luego en la DB:

```sql
INSERT INTO panel_users (username, password_hash, role, full_name)
VALUES ('admin', '<hash generado arriba>', 'admin', 'Administrador');
```

O desde el panel: una vez levantado, loguearse como admin y crear usuarios desde `/usuarios`.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL externo |
| `DOMAIN` | Dominio público (ej: `presales.mtdmcompany.com`) |
| `NEXTAUTH_URL` | URL completa con https (ej: `https://presales.mtdmcompany.com`) |
| `NEXTAUTH_SECRET` | Secret NextAuth — `openssl rand -base64 32` |
| `CHATWOOT_BASE_URL` | URL base de Chatwoot (sin trailing slash) |
| `CHATWOOT_API_TOKEN` | Token admin de Chatwoot (para leer conversaciones) |
| `ENCRYPTION_KEY` | Clave AES-256 para encriptar tokens — `openssl rand -hex 32` |

---

## Comandos de deploy

### Deploy completo (código nuevo)

```bash
./deploy.sh
```

### Deploy sin rebuild (solo reiniciar, ej: cambió el .env.prod)

```bash
./deploy.sh --skip-build
```

### Setup de DB (primera vez o si cambió panel_users.sql)

```bash
./deploy.sh --setup-db
# o combinado con deploy completo:
./deploy.sh --setup-db
```

---

## Comandos en el VPS

```bash
# Logs en tiempo real
ssh ubuntu@mtdmsites 'docker logs viola-presales-web -f'

# Últimas 100 líneas de log
ssh ubuntu@mtdmsites 'docker logs viola-presales-web --tail 100'

# Estado del contenedor
ssh ubuntu@mtdmsites 'cd /datos/violaPresales && docker compose ps'

# Reiniciar sin rebuild
ssh ubuntu@mtdmsites 'docker restart viola-presales-web'

# Detener
ssh ubuntu@mtdmsites 'cd /datos/violaPresales && docker compose down'
```

---

## Traefik

La app se expone a través de Traefik (que ya corre en el VPS en la red `edge`).

- **Dominio**: configurado en `DOMAIN` del `.env.prod`
- **HTTPS**: certificado automático via Let's Encrypt (`lehttp` certresolver)
- **Puerto interno**: 3000

El `docker-compose.yml` define los labels de Traefik — no se necesita ninguna configuración adicional de Traefik.
