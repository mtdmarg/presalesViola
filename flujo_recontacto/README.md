# Flujo de Recontacto — Toyota Viola

**Workflow n8n:** `Toyota-Viola-PreSales - Recontacto`  
**ID:** `caFQPGn9VJSMyYkM`  
**Estado:** inactivo (listo para activar)

---

## Qué hace

Corre automáticamente cada 30 minutos en horario de 9 a 17 (Buenos Aires). Busca leads que estaban siendo calificados por Mica pero dejaron de responder, y actúa según el tiempo transcurrido:

**Antes de las 24h** → Mica les escribe por WhatsApp (máximo 2 intentos, separados por al menos 2 horas entre sí).

**Después de las 24h** con nombre + email → Envía el lead a Salesforce como oportunidad y lo marca como enviado.

---

## Flujo de nodos

```
Schedule Trigger (cada 30 min)
  ↓
BuscarLeadsPendientes
  Postgres SELECT con filtros de horario, intentos y tiempo
  ↓
EnviarASalesforce?  (IF)
  │
  ├── TRUE (> 24h, tiene nombre + email)
  │     ↓
  │   InvocarSalesforce
  │     POST https://api.toyota.com.ar:9201/dcx/api/leads
  │     ↓
  │   MarcarSalesforceEnviado
  │     UPDATE leads SET sfdc_enviado = true
  │
  └── FALSE (< 24h, intentos < 2, sin actividad en 2h)
        ↓
      PrepararContextoReengagement
        Arma el contexto del lead para el LLM
        (qué datos tiene, qué falta, intento 1 o 2)
        ↓
      GenerarMensajeReengagement  ←── OpenAI gpt-4.1-mini
        Genera mensaje de WhatsApp natural en español rioplatense
        ↓
      EnviarMensajeChatwoot
        POST /api/v1/accounts/{id_cuenta}/conversations/{id_conversacion}/messages
        ↓
      ActualizarIntentos
        UPDATE leads SET intentos_recontacto = intentos_recontacto + 1
```

---

## Condiciones del SELECT

| Condición | Detalle |
|---|---|
| `sfdc_enviado = false` | No enviado a Salesforce todavía |
| `id_conversacion IS NOT NULL` | Tiene conversación Chatwoot activa |
| `estado = 'calificando'` | Todavía en proceso |
| Horario 9–17 BsAs | No molestar fuera de horario |
| **Rama recontacto** | `intentos < 2` + sin actividad hace 2h + creado hace < 24h |
| **Rama Salesforce** | Creado hace > 24h + tiene nombre y email |

---

## Columnas nuevas en tabla `leads`

| Columna | Tipo | Descripción |
|---|---|---|
| `intentos_recontacto` | integer (default 0) | Cuántos mensajes proactivos se enviaron |
| `sfdc_enviado` | boolean (default false) | Si ya fue enviado a Salesforce |

**Reset automático:** cuando el cliente responde, el flujo principal (`Toyota-Viola-PreSales`) resetea `intentos_recontacto = 0` en el nodo `ActualizarLead`.

---

## Archivos en esta carpeta

| Archivo | Descripción |
|---|---|
| `prompt_mica_recontacto_reengagement_toyota_viola` | System message del modelo OpenAI que genera los mensajes de recontacto |

---

## Credenciales usadas

| Servicio | Credential n8n |
|---|---|
| Postgres | `MtdmViola` |
| Chatwoot | `ChatWootToyotaViola` |
| OpenAI | `OpenAi account` |
| Salesforce (Toyota) | Sin credencial n8n — headers directos en el nodo |
