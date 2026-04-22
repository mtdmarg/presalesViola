import Link from "next/link"
import { auth } from "@/auth"
import { getCampanas } from "@/lib/queries/campanas"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import PageHeader from "@/components/layout/PageHeader"
import CampanaActivaToggle from "@/components/campanas/CampanaActivaToggle"
import { formatDateShort, orDash } from "@/lib/utils"
import { Plus, Pencil, Users } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CampanasPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "admin"
  const campanas = await getCampanas()

  return (
    <div>
      <PageHeader
        title="Campañas"
        description={`${campanas.length} campañas registradas`}
        action={
          isAdmin && (
            <Link href="/campanas/nueva">
              <Button className="gap-1.5 text-white" style={{ backgroundColor: "#EB0A1E" }}>
                <Plus size={15} />
                Nueva campaña
              </Button>
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase text-zinc-500">
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Source ID</TableHead>
                  <TableHead className="hidden md:table-cell">Modelo</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo venta</TableHead>
                  <TableHead className="text-center">Leads</TableHead>
                  <TableHead className="text-center">Activa</TableHead>
                  <TableHead className="hidden sm:table-cell">Creada</TableHead>
                  {isAdmin && <TableHead className="w-16"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-zinc-400 text-sm">
                      No hay campañas registradas
                    </TableCell>
                  </TableRow>
                )}
                {campanas.map((c) => (
                  <TableRow key={c.id} className="hover:bg-zinc-50">
                    <TableCell className="font-medium text-sm">
                      <Link href={`/campanas/${c.id}`} className="hover:underline">
                        {c.nombre_campana}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">{c.tipo}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-mono text-zinc-500">{c.source_id}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{orDash(c.modelo)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{orDash(c.tipo_venta)}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                        <Users size={12} />
                        {c.leads_count ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {isAdmin ? (
                        <CampanaActivaToggle id={c.id} activa={c.activa} />
                      ) : (
                        <Badge variant={c.activa ? "default" : "secondary"} className="text-xs">
                          {c.activa ? "Activa" : "Inactiva"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-zinc-400">{formatDateShort(c.fecha_creacion)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Link href={`/campanas/${c.id}/editar`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Pencil size={13} />
                          </Button>
                        </Link>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
