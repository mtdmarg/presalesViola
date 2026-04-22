import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelativeTime, formatDate } from "@/lib/utils"
import { MessageCircle, CheckCircle2, Clock } from "lucide-react"
import type { UltimoContacto } from "@/types/lead"

export default function UltimoContactoCard({ data }: { data: UltimoContacto | null }) {
  if (!data) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-zinc-400 text-center">Sin registros de contacto</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle size={14} className="text-zinc-400" />
          Último contacto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {data.mensaje && (
              <p className="text-sm text-zinc-700 truncate mb-1">"{data.mensaje}"</p>
            )}
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {formatRelativeTime(data.fecha)}
              </span>
              <span>·</span>
              <span>{formatDate(data.fecha)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs flex-shrink-0">
            {data.procesado ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={13} />
                Procesado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500">
                <Clock size={13} />
                Pendiente
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
