# Setup: n8n + Chatwoot + WhatsApp - Calificación de Leads

## Estado del proyecto
Proyecto de automatización para calificación de leads usando WhatsApp, Chatwoot y n8n.

---

## Credenciales y Endpoints

### n8n API REST
- **URL base:** `https://n8n.mtdmcompany.com/api/v1`
- **Docs API:** `https://n8n.mtdmcompany.com/api/v1/docs`
- **Header de autenticación:** `X-N8N-API-KEY: <ver n8n-config.json>`

Ejemplo rápido:
```bash
curl -X GET "https://n8n.mtdmcompany.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: <API_KEY>"
```

### n8n MCP Server (nativo)
- **URL:** `https://n8n.mtdmcompany.com/mcp-server/http`
- **Tipo:** Streamable HTTP (via supergateway)
- **Configurado en:** `.mcp.json` como `n8n-native-mcp`

### n8n-mcp (builder de workflows con IA)
- **Repo:** https://github.com/czlonkowski/n8n-mcp
- **Acceso a:** 1396 nodos, 2709 templates, schemas completos
- **Configurado en:** `.mcp.json` como `n8n-mcp`

---

## Archivos del proyecto

```
Presales_chatwoot_n8n/
├── .mcp.json                  # Configuración MCP para Claude (n8n-mcp + n8n nativo)
├── n8n-config.json            # Credenciales y endpoints centralizados
├── SETUP.md                   # Este archivo
└── .claude/
    └── skills/                # Skills de n8n para Claude
        ├── n8n-mcp-tools-expert/      ← Cómo usar las herramientas MCP (prioritario)
        ├── n8n-workflow-patterns/     ← 5 patrones arquitecturales de workflows
        ├── n8n-expression-syntax/     ← Sintaxis de expresiones n8n
        ├── n8n-validation-expert/     ← Validación y troubleshooting
        ├── n8n-node-configuration/    ← Configuración de nodos
        ├── n8n-code-javascript/       ← JavaScript en nodos Code
        └── n8n-code-python/           ← Python en nodos Code
```

---

## Cómo usar los MCPs con Claude

El archivo `.mcp.json` configura **dos servidores MCP**:

### 1. `n8n-mcp` - Para DISEÑAR y CONSTRUIR workflows
Conecta Claude con una base de datos de 1396 nodos n8n. Permite a Claude:
- Buscar nodos disponibles y sus propiedades
- Obtener templates de workflows
- Validar configuraciones antes de crear

### 2. `n8n-native-mcp` - Para EJECUTAR y GESTIONAR tu n8n
Conecta Claude directamente con tu instancia n8n. Permite:
- Listar y activar/desactivar workflows
- Ejecutar workflows manualmente
- Ver ejecuciones y logs

---

## Comandos útiles API REST

```bash
# Variables
API="https://n8n.mtdmcompany.com/api/v1"
KEY="<tu API key>"

# Listar workflows
curl "$API/workflows" -H "X-N8N-API-KEY: $KEY"

# Crear workflow
curl -X POST "$API/workflows" \
  -H "X-N8N-API-KEY: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mi workflow", "nodes": [], "connections": {}, "settings": {}}'

# Activar workflow
curl -X POST "$API/workflows/{id}/activate" \
  -H "X-N8N-API-KEY: $KEY"

# Ver ejecuciones
curl "$API/executions?limit=10" -H "X-N8N-API-KEY: $KEY"

# Ejecutar workflow via webhook
curl -X POST "https://n8n.mtdmcompany.com/webhook/{webhook-id}" \
  -H "Content-Type: application/json" \
  -d '{"data": "valor"}'
```

---

## Arquitectura del proyecto

```
WhatsApp  →  Chatwoot  →  n8n  →  Calificación de lead
                           ↓
                    CRM / Notificaciones
```

El flujo planificado:
1. Mensaje entra por WhatsApp a Chatwoot
2. Webhook de Chatwoot dispara workflow en n8n
3. n8n analiza el mensaje y califica el lead
4. Según score: asigna agente, envía respuesta automática, o notifica al equipo

---

## Instalación de n8n-mcp en Claude Desktop (fuera de Cowork)

Si quieres usar n8n-mcp en Claude Desktop directamente:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "https://n8n.mtdmcompany.com",
        "N8N_API_KEY": "<ver n8n-config.json>"
      }
    }
  }
}
```
