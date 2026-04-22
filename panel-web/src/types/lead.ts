export interface Lead {
  id: number
  telefono: string | null
  nombre: string | null
  email: string | null
  etapa_ciclo_vida: string | null
  ciudad: string | null
  plan_interes: string | null
  modelo_interes: string | null
  tipoventa: "PLAN" | "CONVENCIONAL" | "USADO" | "INDEFINIDO" | null
  resumencliente: string | null
  fecha_creacion: string | null
  fecha_actualizacion: string | null
  origen: string | null
  fuente: string | null
  motivo_no_califica: string | null
  estado: string | null
  detalle: string | null
  fecha_envio_correo_recontac: string | null
  modelo_version: string | null
  marca_modelo_usado: string | null
  financiacion: string | null
  modelo_color: string | null
  tiempo_espero_entrega: string | null
  id_conversacion: number | null
  id_cuenta: number | null
  conversacion_tomada: boolean | null
}

export interface LeadSummary {
  id: number
  nombre: string | null
  telefono: string | null
  email: string | null
  ciudad: string | null
  tipoventa: string | null
  modelo_interes: string | null
  etapa_ciclo_vida: string | null
  estado: string | null
  fuente: string | null
  fecha_creacion: string | null
}

export interface LeadFilters {
  q?: string
  tipoventa?: string
  etapa_ciclo_vida?: string
  estado?: string
  fuente?: string
  page?: number
  limit?: number
}

export interface UltimoContacto {
  telefono: string
  idmensaje: string
  fecha: string
  procesado: boolean
  mensaje: string | null
}
