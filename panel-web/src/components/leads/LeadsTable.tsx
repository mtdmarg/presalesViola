import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TipoVentaBadge, EstadoBadge, EtapaBadge } from "./LeadStatusBadge"
import { formatDateShort, orDash } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import type { LeadSummary } from "@/types/lead"

export default function LeadsTable({ leads }: { leads: LeadSummary[] }) {
  if (!leads.length) {
    return (
      <div className="text-center py-12 text-zinc-400 text-sm">
        No se encontraron leads con los filtros aplicados
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-xs uppercase text-zinc-500">
            <TableHead className="hidden sm:table-cell">#</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="hidden md:table-cell">Ciudad</TableHead>
            <TableHead className="hidden md:table-cell">Tipo venta</TableHead>
            <TableHead className="hidden lg:table-cell">Modelo</TableHead>
            <TableHead className="hidden lg:table-cell">Etapa</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden md:table-cell">Fecha</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-zinc-50 cursor-pointer group">
              <TableCell className="hidden sm:table-cell text-xs text-zinc-400 font-mono">
                {lead.id}
              </TableCell>
              <TableCell className="font-medium text-sm">
                <Link href={`/leads/${lead.id}`} className="hover:underline">
                  {orDash(lead.nombre)}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-zinc-600 font-mono whitespace-nowrap">
                {orDash(lead.telefono)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-zinc-600">
                {orDash(lead.ciudad)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <TipoVentaBadge value={lead.tipoventa} />
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-zinc-600">
                {orDash(lead.modelo_interes)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <EtapaBadge value={lead.etapa_ciclo_vida} />
              </TableCell>
              <TableCell>
                <EstadoBadge value={lead.estado} />
              </TableCell>
              <TableCell className="hidden md:table-cell text-xs text-zinc-400 whitespace-nowrap">
                {formatDateShort(lead.fecha_creacion)}
              </TableCell>
              <TableCell>
                <Link
                  href={`/leads/${lead.id}`}
                  className="text-zinc-300 group-hover:text-zinc-500 transition-colors"
                >
                  <ChevronRight size={16} />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
