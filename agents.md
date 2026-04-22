# Mica Agent — Arquitectura y Aprendizajes Clave

## Archivos del proyecto

| Archivo | Descripción |
|---|---|
| `prompt_mica_toyota_viola` | Prompt principal del AI Agent (systemMessage) |
| `prompt_mica_recontacto_temprano_toyota_viola` | Prompt para cuando el cliente vuelve a escribir antes de que lo contacte el asesor |
| `brevo_template_lead_toyota_viola.html` | Email HTML para nuevo lead calificado (Brevo) |
| `brevo_template_recontacto_toyota_viola.html` | Email HTML para recontacto urgente (Brevo) |

---

## Arquitectura del workflow n8n

```
Chatwoot webhook
  → ObtenerLead (Postgres SELECT)
  → AI Agent (GPT-4.1-mini) [usa systemMessage con IIFE de n8n]
  → ParseAgentOutput (Code node)
  → DatosSalientes (Set node)
  → Postgres UPDATE (guarda campos del JSON)
  → EnviarMensajeChatwoot (reply al cliente)
  → [si requiereMasDatos = false] → email Brevo + notificaciones
```

**Nodos de email Brevo:**
- `"Send a transactional email2"` → email de nuevo lead calificado (dispara desde `prepararDatosSalesForce`)
- `"Send a transactional email"` y `"Send a transactional email1"` → emails de recontacto urgente

**Nodo de datos:**
- `$('ObtenerLead').item.json.fieldname` → acceso a datos del lead desde Postgres
- `$('DatosIniciales').item.json.chatwootUrl` → URL de la conversación en Chatwoot

---

## Prompt: estructura y expresiones n8n

El systemMessage usa bloques IIFE de n8n para inyectar el estado del lead dinámicamente:

```
{{ (() => {
  const l = $json.lead || {};
  const norm = v => (v && v !== 'null') ? String(v).trim() : null;
  ...
  return bloques.join('\n\n');
})() }}
```

**`norm()`**: helper crítico para manejar valores null que Postgres devuelve como string `'null'`.

**Bloque SITUACIÓN ACTUAL**: genera instrucciones dinámicas según qué datos ya están en la DB. Lo que renderiza este bloque gobierna qué pregunta el agente en cada turno.

**PRIMER MENSAJE**: si `"Ya obtenidos: ninguno aún"` → el agente DEBE usar exactamente el texto del bloque PRIMER MENSAJE (no improvisar saludo ni pedir nombre). Hay 3 ubicaciones que refuerzan esta regla en el prompt.

---

## Lógica de calificación por tipo de operación

| Campo | CONVENCIONAL | PLAN | USADO |
|---|---|---|---|
| Nombre | ✅ | ✅ | ✅ |
| Email | ✅ | ✅ | ✅ |
| Ciudad | ✅ | ✅ | ✅ |
| Modelo | ✅ | ✅ | ✅ |
| Versión | ✅ (elegir) | ✅ (base + cambio de versión) | ❌ |
| Auto usado | ✅ | ✅ | ❌ |
| Financiación | ✅ (cuotas) | ✅ (modalidad del plan: 70/30, 100%) | ❌ |
| Color | ✅ | ✅ | ❌ |
| Tiempo de entrega | ✅ (fecha) | ✅ (en qué cuota) | ❌ |

**USADO**: solo los 4 básicos, cierra inmediatamente.

**PLAN — comportamientos especiales:**
- Versión: explicar que el plan es sobre la versión base, pero puede pedir cambio de versión al adjudicarse.
- Financiación: usar tool `InformacionPlanes` para ver modalidades del modelo. Si hay varias, preguntar cuál prefiere. Si hay una sola, informarla directamente.
- Tiempo de entrega: preguntar en qué cuota le gustaría recibir el auto (no fecha fija, depende de sorteo/licitación).

---

## ParseAgentOutput — Code node crítico

El AI Agent puede devolver **múltiples JSONs concatenados** en un solo output (ej: pensamiento intermedio + respuesta final). `JSON.parse` falla en ese caso.

**Solución: `extractJsonObjects()`** — recorre el string con un contador de llaves `{}` para extraer cada JSON completo, luego prueba de último a primero buscando uno con `mensajeAlUsuario`.

```javascript
function extractJsonObjects(str) {
  const objects = [];
  let depth = 0, start = -1;
  for (let pos = 0; pos < str.length; pos++) {
    const ch = str[pos];
    if (ch === '{') { if (depth === 0) start = pos; depth++; }
    else if (ch === '}') { depth--; if (depth === 0 && start !== -1) { objects.push(str.slice(start, pos + 1)); start = -1; } }
  }
  return objects;
}
```

**⚠️ Fallback NUNCA debe usar `lastOutput` como `mensajeAlUsuario`**: si el output crudo es un JSON roto, se envía ese JSON como mensaje al cliente. El fallback debe usar un string genérico: `'Un momento, ya te atiendo.'`

---

## Bugs conocidos y fixes aplicados

### 1. JSON crudo enviado al cliente
**Causa:** `mensajeAlUsuario` contenía el JSON completo del agente (el LLM lo embebía adentro).
**Fix prompt:** bloque `⛔ ERROR CRÍTICO` con ejemplo ❌/✅ explícito justo antes de la estructura del JSON. Los LLMs responden mejor a ejemplos negativos concretos que a reglas abstractas.

### 2. Múltiples JSONs concatenados rompen `JSON.parse`
**Causa:** El agente genera un "pensamiento" como JSON y luego la "respuesta final" como otro JSON, ambos en el mismo string `output`.
**Fix Code node:** `extractJsonObjects()` + intentar de último a primero.

### 3. PRIMER MENSAJE ignorado
**Causa:** El LLM ignoraba la regla de primer turno y preguntaba el nombre directamente.
**Fix:** Regla reforzada en 3 lugares del prompt usando `"Ya obtenidos: ninguno aún"` como trigger condición unívoco.

---

## Brevo HTML templates — convenciones

- **Variables n8n en HTML:** `{{ $('ObtenerLead').item.json.nombre }}` (expresiones n8n, no sintaxis Brevo)
- **Logo Toyota Viola blanco:** `filter:brightness(0) invert(1)` sobre el SVG original (que es oscuro)
- **Logo MTDM en footer:** `<img src="https://mtdmcompany.com/wp-content/uploads/2025/11/MTDM-pitch2.jpg" width="100" style="opacity:0.85;">` con "Powered by" encima
- **Colores:** Toyota red `#EB0A1E`, fondo oscuro `#1A1A1A`, fondo claro `#F2F2F2`

---

## Ficha Técnica PDF

Los tools de información de vehículos (InformacionCorolla, InformacionCorollaCross, etc.) devuelven HTML. Ese HTML contiene una etiqueta `<a>` con texto "Ficha Técnica" cuyo `href` es el link al PDF. El agente debe extraerlo e incluirlo en el mensaje cuando habla de versiones.

---

## Herramientas disponibles en el agente

`InformacionPlanes`, `InformacionHilux`, `InformacionCorolla`, `InformacionCorollaCross`, `InformacionYaris`, `InformacionHiace`, `InformacionYarisCross`
