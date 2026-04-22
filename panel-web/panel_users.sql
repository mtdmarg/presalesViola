-- =============================================================
-- Setup de la tabla panel_users
-- Seguro para correr múltiples veces (IF NOT EXISTS / IF NOT EXISTS en ALTER)
-- Ejecutar en la misma base de datos PostgreSQL que usa n8n/Baserow
-- =============================================================

CREATE TABLE IF NOT EXISTS panel_users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'viewer'
                             CHECK (role IN ('admin', 'viewer')),
  full_name     VARCHAR(200),
  activa        BOOL         NOT NULL DEFAULT true,
  access_token  TEXT,        -- token de Chatwoot encriptado (AES-256-GCM)
  chatwoot_id   INT,         -- ID numérico del agente en Chatwoot
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Columnas agregadas en v2 (seguro correr si la tabla ya existe sin ellas)
ALTER TABLE panel_users ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE panel_users ADD COLUMN IF NOT EXISTS chatwoot_id  INT;

CREATE INDEX IF NOT EXISTS idx_panel_users_username ON panel_users(username);
