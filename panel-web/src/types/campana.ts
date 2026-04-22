export interface Campana {
  id: number
  tipo: string
  source_id: string
  nombre_campana: string
  modelo: string | null
  tipo_venta: string | null
  plan_interes: string | null
  activa: boolean
  notas: string | null
  fecha_creacion: string
  fecha_actualizacion: string
  leads_count?: number
}

export interface CampanaFormData {
  tipo: string
  source_id: string
  nombre_campana: string
  modelo: string
  tipo_venta: string
  plan_interes: string
  activa: boolean
  notas: string
}
