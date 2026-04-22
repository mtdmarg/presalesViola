import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TipoVentaBadge, EstadoBadge, EtapaBadge } from "@/components/leads/LeadStatusBadge"
import { formatDate, orDash } from "@/lib/utils"
import type { Lead } from "@/types/lead"

interface FieldProps {
  label: string
  value: React.ReactNode
}

function Field({ label, value }: FieldProps) {
  return (
    <div>
      <dt className="text-xs text-zinc-400 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-zinc-800 mt-0.5">{value}</dd>
    </div>
  )
}

export default function LeadInfoCard({ lead }: { lead: Lead }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Datos del lead</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label="Nombre" value={orDash(lead.nombre)} />
          <Field label="Teléfono" value={<span className="font-mono">{orDash(lead.telefono)}</span>} />
          <Field label="Email" value={orDash(lead.email)} />
          <Field label="Ciudad" value={orDash(lead.ciudad)} />

          <Field
            label="Tipo de venta"
            value={<TipoVentaBadge value={lead.tipoventa} />}
          />
          <Field
            label="Estado"
            value={<EstadoBadge value={lead.estado} />}
          />
          <Field
            label="Etapa del ciclo"
            value={<EtapaBadge value={lead.etapa_ciclo_vida} />}
          />
          <Field label="Origen" value={orDash(lead.origen)} />
          <Field label="Fuente" value={orDash(lead.fuente)} />
          <Field label="Modelo de interés" value={orDash(lead.modelo_interes)} />
          <Field label="Versión" value={orDash(lead.modelo_version)} />
          <Field label="Plan de interés" value={orDash(lead.plan_interes)} />
          <Field label="Color preferido" value={orDash(lead.modelo_color)} />
          <Field label="Tiempo espera entrega" value={orDash(lead.tiempo_espero_entrega)} />
          <Field label="Financiación" value={orDash(lead.financiacion)} />
          <Field label="Vehículo usado" value={orDash(lead.marca_modelo_usado)} />

          {lead.motivo_no_califica && (
            <div className="col-span-2">
              <Field label="Motivo no califica" value={lead.motivo_no_califica} />
            </div>
          )}
          {lead.detalle && (
            <div className="col-span-2">
              <Field label="Detalle" value={lead.detalle} />
            </div>
          )}

          <Field label="Creado" value={formatDate(lead.fecha_creacion)} />
          <Field label="Actualizado" value={formatDate(lead.fecha_actualizacion)} />
          {lead.fecha_envio_correo_recontac && (
            <div className="col-span-2">
              <Field
                label="Email recontacto enviado"
                value={formatDate(lead.fecha_envio_correo_recontac)}
              />
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
