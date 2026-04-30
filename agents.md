# Mica Agent — Arquitectura y Aprendizajes Clave

## Archivos del proyecto

| Archivo | Descripción |
|---|---|
| `prompt_mica_toyota_viola` | Prompt principal del AI Agent (systemMessage) |
| `prompt_mica_toyota_viola_v2` | Versión optimizada del prompt principal: menos duplicación, tono más natural, cierre conversacional y charla abierta para opcionales |
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

**PRIMER MENSAJE**: el prompt calcula `PRIMER TURNO REAL`. Solo si renderiza `"PRIMER TURNO REAL: SÍ"` → el agente DEBE usar exactamente el texto del bloque PRIMER MENSAJE. Si renderiza `"PRIMER TURNO REAL: NO"`, debe responder el último mensaje del cliente y continuar el flujo, aunque todavía no haya nombre/canal/horario.

---

## Lógica actual de calificación

El flujo principal ahora califica con menos datos obligatorios. El objetivo es derivar rápido al asesor con una intención clara y una forma concreta de contacto, sin convertir la conversación en formulario.

### Datos mínimos obligatorios para cerrar

| Campo | CONVENCIONAL | PLAN |
|---|---|---|
| Nombre | ✅ | ✅ |
| Modelo de interés | ✅ | ✅ |
| Tipo de venta / vertical | ✅ | ✅ |
| Canal preferido de contacto | ✅ | ✅ |
| Horario de contacto | ✅ | ✅ |

**Email y ciudad ya no son obligatorios** para cerrar el lead. Se guardan si el cliente los menciona espontáneamente. El email solo se pide si el cliente elige email como canal preferido.

### Datos opcionales

| Campo | CONVENCIONAL | PLAN |
|---|---|---|
| Email | Opcional | Opcional |
| Ciudad | Opcional | Opcional |
| Versión | Solo si la menciona o pregunta | Base del plan + posible cambio al adjudicarse |
| Auto usado | Solo si lo menciona | Solo si lo menciona |
| Financiación | Solo si lo menciona | Modalidad del plan si corresponde |
| Color | Solo si lo menciona | Solo si lo menciona |
| Tiempo de entrega | Solo si lo menciona | En planes no hay fecha fija; depende de sorteo/licitación |

**PLAN — comportamientos especiales:**
- Versión: explicar que el plan es sobre la versión base, pero puede pedir cambio de versión al adjudicarse.
- Financiación: usar tool `InformacionPlanes` para ver modalidades del modelo. Si hay varias, preguntar cuál prefiere. Si hay una sola, informarla directamente.
- Tiempo de entrega: no prometer fecha fija; depende de sorteo o licitación. Si el cliente lo menciona, guardar el dato como contexto para el asesor.

### Correcciones y modelos no válidos

- Si el cliente menciona un modelo no actual/no comercializado (ej: Etios), Mica debe explicarlo brevemente, ofrecer alternativas actuales y **no guardar ese modelo** como `modeloInteres`.
- Si en un turno posterior el cliente corrige el modelo (ej: "perdón Yaris"), el JSON del agente debe devolver `modeloInteres: "Yaris"` para reemplazar el valor anterior en la base.
- Las correcciones explícitas del cliente siempre pisan el dato previo: modelo, vertical, canal, horario o nombre.
- Si venía como PLAN pero el cliente dice "prefiero pago contado", "con financiación" o similar, el agente debe devolver `tipoVenta: "CONVENCIONAL"`.
- Si venía como CONVENCIONAL pero el cliente pide Toyota Plan/plan de ahorro, el agente debe devolver `tipoVenta: "PLAN"`.

### Tono conversacional

- Evitar patrones que hacen sonar al agente robótico: empezar todo con "Dale", usar "Dale —", repetir "por Toyota Plan" en cada pregunta, listar catálogos completos cuando el cliente no los pidió.
- No usar micro-reacciones como arranque por defecto. Evitar repetir "Buenísimo", "Va", "Dale", "Ok", "Bien" al inicio de cada respuesta. La conversación debe poder avanzar directo con la pregunta.
- En v2, el saludo inicial se simplifica a "Soy Mica de Toyota Viola" y una pregunta más natural, evitando "asistente" y el tono de formulario.
- V2 debe evitar el modo interrogatorio: cuando el cliente elige vertical o modelo, Mica suma una frase breve con criterio comercial antes de la siguiente pregunta.
- V2 usa castellano argentino: "comprar al contado", "financiar", "llamada o mail", "te queda cómodo", "qué modelo te gusta".
- V2 devuelve `quiereHablarMas`: `true` solo cuando el cliente ya fue avisado de que lo contacta un vendedor y luego sigue hablando con una consulta o dato útil. Es `false` mientras se recolectan mínimos, en el primer cierre y ante cierres sociales tipo "gracias"/"ok".
- Si el cliente elige un modelo válido, no listar versiones por defecto. Avanzar con el siguiente dato faltante.
- Para modelos discontinuados, ofrecer pocas alternativas relevantes en vez de toda la gama.
- El cierre debe ser concreto y humano; evitar frases marketineras como "nuestro objetivo es que muy pronto estés disfrutando tu próximo 0km".
- En `prompt_mica_toyota_viola_v2`, cuando `requiereMasDatos=false`, Mica avisa que lo va a contactar un vendedor/asesor y ofrece seguir conversando por opcionales como versión, color, entrega, usado, financiación o dudas del modelo.

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
**Fix:** Regla reforzada en 3 lugares del prompt usando `PRIMER TURNO REAL: SÍ` como trigger explícito. No se usa `"Ya obtenidos: ninguno aún"` porque puede aparecer en conversaciones ya iniciadas cuando todavía faltan nombre/canal/horario.

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

`InformacionPlanes`, `InformacionHilux`, `InformacionCorolla`, `InformacionCorollaCross`, `InformacionYaris`, `InformacionHiace`, `InformacionYarisCross`, `ModelosDisponibles`, `InformacionUsados`, `InformacionSW4`, `InformacionRAV4`

---

## Workflow de Re-engagement (Toyota-Viola-ReEngagement)

**ID n8n:** `QKEzYxuP0xKPDwNW`

**Propósito:** Contactar proactivamente leads que dejaron de responder durante la calificación. Máximo 2 intentos dentro de las primeras 24h. Tras 24h con nombre+email, enviar a Salesforce.

### Flujo

```
Schedule Trigger (cada 30 min)
  → BuscarLeadsPendientes (Postgres SELECT)
  → EnviarASalesforce? (IF)
      ├── [true: > 24h con nombre+email] → InvocarSalesforce → MarcarSalesforceEnviado
      └── [false: < 24h, intentos < 2] → PrepararContextoReengagement
                                           → GenerarMensajeReengagement (LLM Chain + GPT-4.1-mini)
                                           → EnviarMensajeChatwoot (HTTP Request)
                                           → ActualizarIntentos (Postgres SQL)
```

### SQL de selección (BuscarLeadsPendientes)

```sql
SELECT telefono, nombre, email, ciudad, tipoventa, modelo_interes, modelo_version,
       financiacion, id_conversacion, id_cuenta,
       COALESCE(intentos_recontacto, 0) as intentos_recontacto,
       resumencliente, fecha_creacion, fecha_actualizacion
FROM leads
WHERE COALESCE(sfdc_enviado, false) = false
  AND id_conversacion IS NOT NULL
  AND (estado = 'calificando' OR estado IS NULL)
  AND EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Buenos_Aires') BETWEEN 9 AND 17
  AND (
    (COALESCE(intentos_recontacto, 0) < 2
     AND fecha_actualizacion < NOW() - INTERVAL '2 hours'
     AND fecha_creacion > NOW() - INTERVAL '24 hours')
    OR
    (fecha_creacion < NOW() - INTERVAL '24 hours'
     AND nombre IS NOT NULL AND email IS NOT NULL)
  )
```

### Columnas nuevas en tabla `leads`

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `intentos_recontacto` | integer | 0 | Cuántos mensajes proactivos se enviaron |
| `sfdc_enviado` | boolean | false | Si el lead fue enviado a Salesforce |

**Reset en flujo principal:** `ActualizarLead` en `Toyota-Viola-PreSales` resetea `intentos_recontacto = 0` cuando el cliente responde.

### Archivos de prompt

| Archivo | Uso |
|---|---|
| `prompt_mica_recontacto_reengagement_toyota_viola` | System message del LLM en el workflow de re-engagement |
