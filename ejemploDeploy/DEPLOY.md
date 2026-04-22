# Deploy — IA ADS

## Arquitectura

```
Tu Mac (desarrollo)
│
│  ./deploy.sh
│
├─ rsync código fuente ──────────────────→ VPS /datos/iads/src/  (temporal)
│
│  [en el VPS]
├─ docker build  ──────────────────────→  imagen temporal (linux/amd64)
├─ docker cp /app/ ────────────────────→  VPS /datos/iads/app/   (build output)
├─ docker rmi + rm src ────────────────→  limpieza
│
└─ docker compose up -d
        iads-web  → node:20-alpine  + volumen /datos/iads/app/
        iads-db   → postgres:16     + volumen /datos/iads/db/
```

### Principios clave

- **El contenedor web no tiene código adentro.** Usa `node:20-alpine` (imagen genérica) y monta el build output desde el filesystem del VPS como volumen read-only.
- **El build ocurre en el VPS** (linux/amd64 nativo), lo que garantiza que los binarios nativos (Prisma query engine, etc.) sean correctos para la plataforma.
- **La imagen temporal se elimina** después de extraer el standalone. Solo persiste en el VPS el resultado del build (`/datos/iads/app/`).
- **Los datos de Postgres nunca están en una imagen** — siempre en `/datos/iads/db/`.

---

## Estructura en el VPS

```
/datos/iads/
  app/              ← Next.js standalone (resultado del build)
    node_modules/   ← dependencias mínimas (incluidas en standalone)
    apps/web/
      server.js     ← entry point
      public/
      .next/static/
  prisma/           ← schema.prisma + migrations/
  db/               ← datos de PostgreSQL (nunca tocar)
  .env              ← variables de entorno de producción
  docker-compose.yml
  Dockerfile.migrate
```

---

## Servicios Docker

| Contenedor   | Imagen            | Qué hace                        |
|--------------|-------------------|---------------------------------|
| `iads-web`   | `node:20-alpine`  | Sirve la app Next.js (puerto 3000, expuesto vía Traefik HTTPS) |
| `iads-db`    | `postgres:16-alpine` | Base de datos (puerto 65432 externo → 5432 interno) |
| `iads-migrator` | build local   | Corre `prisma migrate deploy` y termina (perfil `migrate`) |

Todos en la red Docker externa `edge`, que es la misma red de Traefik.

---

## Variables de entorno

El archivo `.env.prod` (local, nunca commitear) se sube al VPS como `.env`.

```bash
cp .env.prod.example .env.prod
# Completar todos los valores
```

Variables requeridas:

| Variable | Descripción |
|---|---|
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `DOMAIN` | Dominio de la app (ej: `iads.mtdmcompany.com`) |
| `NEXTAUTH_URL` | URL completa (ej: `https://iads.mtdmcompany.com`) |
| `NEXTAUTH_SECRET` | Secret para NextAuth (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `LLM_PROVIDER` | `claude` o `openai` |
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `HUBSPOT_API_KEY` | API key de HubSpot |
| `RESEND_API_KEY` | API key de Resend (emails) |
| `SHOW_EMAIL_CODE` | `true` para devolver el código de email en la respuesta de la API |
| `SHOW_SMS_CODE` | `true` para devolver el código SMS en la respuesta de la API |

---

## Comandos de deploy

### Deploy completo (código + migraciones)

```bash
./deploy.sh
```

Hace todo: rsync → build en VPS → extrae standalone → migraciones → `docker compose up -d`.

---

### Deploy sin migraciones (cambios de código solo)

```bash
./deploy.sh --skip-migrate
```

Usar cuando no hay cambios en el schema de la base de datos.

---

### Solo reiniciar servicios (sin rebuild)

```bash
./deploy.sh --skip-build --skip-migrate
```

Reinicia los contenedores con el build que ya está en `/datos/iads/app/`. Útil si solo cambiaron variables de entorno.

---

### Solo migraciones (sin tocar el código)

```bash
./deploy.sh --only-migrate
```

Corre `prisma migrate deploy` sin tocar el build ni reiniciar la app.

---

## Comandos en el VPS

Conectarse:
```bash
ssh ubuntu@mtdmvps
```

Ver logs de la app:
```bash
docker logs iads-web -f
docker logs iads-web --tail 100
```

Ver logs de la base de datos:
```bash
docker logs iads-db -f
```

Estado de los servicios:
```bash
cd /datos/iads && docker compose ps
```

Reiniciar la app (sin rebuild):
```bash
docker restart iads-web
```

Detener todo:
```bash
cd /datos/iads && docker compose down
```

---

## Base de datos

### Conexión externa

| Campo    | Valor           |
|----------|-----------------|
| Host     | IP del VPS      |
| Puerto   | `65432`         |
| Base     | `iaads`         |
| Usuario  | `iaads`         |
| Password | valor de `DB_PASSWORD` en `.env.prod` |

### Migraciones manuales

```bash
./deploy.sh --only-migrate
```

### Conectarse directamente al postgres del VPS

```bash
ssh ubuntu@mtdmvps 'docker exec -it iads-db psql -U iaads -d iaads'
```

### Backup de la base de datos

```bash
ssh ubuntu@mtdmvps 'docker exec iads-db pg_dump -U iaads iaads' > backup_$(date +%Y%m%d).sql
```

### Restaurar un backup

```bash
cat backup_20260101.sql | ssh ubuntu@mtdmvps 'docker exec -i iads-db psql -U iaads iaads'
```

---

## Traefik

La app se expone a través de Traefik (que ya corre en el VPS en la red `edge`).

- **Dominio**: configurado en `DOMAIN` del `.env.prod`
- **HTTPS**: certificado automático via Let's Encrypt (`lehttp` certresolver)
- **Puerto interno**: 3000 (Next.js)

El `docker-compose.yml` define los labels de Traefik en el servicio `web`. No hay ninguna configuración adicional de Traefik necesaria — se autoregistra al hacer `docker compose up -d`.

---

## Primer deploy (servidor nuevo)

1. Asegurarse que el VPS tiene Docker instalado y Traefik corriendo en la red `edge`.

2. Crear el `.env.prod` local:
```bash
cp .env.prod.example .env.prod
# Editar con los valores reales
```

3. Apuntar el DNS del dominio a la IP del VPS.

4. Correr el deploy completo:
```bash
./deploy.sh
```

---

## Actualizar la app (deploys posteriores)

```bash
# Con migraciones nuevas
./deploy.sh

# Sin migraciones
./deploy.sh --skip-migrate
```

El build usa Docker layer cache en el VPS — después del primer deploy, los rebuilds tardan ~1-2 minutos en lugar de ~5.

---

## Archivos relevantes

| Archivo | Descripción |
|---|---|
| `deploy.sh` | Script principal de deploy |
| `docker-compose.prod.yml` | Definición de servicios de producción |
| `Dockerfile.migrate` | Imagen mínima para correr migraciones Prisma |
| `apps/web/Dockerfile` | Multi-stage build de Next.js |
| `.env.prod.example` | Template de variables de entorno |
| `.env.prod` | Variables reales (NO commitear) |
