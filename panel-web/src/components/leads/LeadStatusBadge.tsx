import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TIPOVENTA_COLORS: Record<string, string> = {
  PLAN: "bg-red-100 text-red-700 border-red-200",
  CONVENCIONAL: "bg-blue-100 text-blue-700 border-blue-200",
  USADO: "bg-green-100 text-green-700 border-green-200",
  INDEFINIDO: "bg-zinc-100 text-zinc-600 border-zinc-200",
}

const ESTADO_COLORS: Record<string, string> = {
  calificado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pendiente: "bg-yellow-100 text-yellow-700 border-yellow-200",
  no_califica: "bg-red-100 text-red-700 border-red-200",
  recontacto: "bg-purple-100 text-purple-700 border-purple-200",
}

export function TipoVentaBadge({ value }: { value: string | null }) {
  const v = value ?? "INDEFINIDO"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
        TIPOVENTA_COLORS[v] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"
      )}
    >
      {v}
    </span>
  )
}

export function EstadoBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-zinc-400 text-xs">-</span>
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
        ESTADO_COLORS[value.toLowerCase()] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"
      )}
    >
      {value}
    </span>
  )
}

export function EtapaBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-zinc-400 text-xs">-</span>
  return (
    <Badge variant="outline" className="text-xs font-normal">
      {value}
    </Badge>
  )
}
