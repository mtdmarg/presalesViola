import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { getCampanaById } from "@/lib/queries/campanas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import PageHeader from "@/components/layout/PageHeader"
import LeadsTable from "@/components/leads/LeadsTable"
import DeleteCampanaButton from "@/components/campanas/DeleteCampanaButton"
import { formatDate, orDash } from "@/lib/utils"
import { Pencil, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CampanaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const campanaId = parseInt(id, 10)
  if (isNaN(campanaId)) notFound()

  const session = await auth()
  const isAdmin = session?.user?.role === "admin"

  const campana = await getCampanaById(campanaId)
  if (!campana) notFound()

  return (
    <div>
      <PageHeader
        title={campana.nombre_campana}
        description={`${campana.tipo} · ${campana.source_id}`}
        breadcrumbs={[{ label: "Campañas", href: "/campanas" }, { label: campana.nombre_campana }]}
        action={
          <div className="flex gap-2">
            <Link href="/campanas">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft size={14} />
                Volver
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link href={`/campanas/${campana.id}/editar`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil size={13} />
                    Editar
                  </Button>
                </Link>
                <DeleteCampanaButton id={campana.id} nombre={campana.nombre_campana} />
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Info card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Detalle de la campaña</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                ["Estado", campana.activa ? <Badge className="text-xs">Activa</Badge> : <Badge variant="secondary" className="text-xs">Inactiva</Badge>],
                ["Tipo", campana.tipo],
                ["Source ID", <span key="sid" className="font-mono text-xs">{campana.source_id}</span>],
                ["Modelo", orDash(campana.modelo)],
                ["Tipo de venta", orDash(campana.tipo_venta)],
                ["Plan de interés", orDash(campana.plan_interes)],
                ["Leads asociados", campana.leads_count ?? 0],
                ["Creada", formatDate(campana.fecha_creacion)],
                ["Actualizada", formatDate(campana.fecha_actualizacion)],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wide">{label}</dt>
                  <dd className="text-sm text-zinc-800 mt-0.5">{value as React.ReactNode}</dd>
                </div>
              ))}
              {campana.notas && (
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wide">Notas</dt>
                  <dd className="text-sm text-zinc-800 mt-0.5 whitespace-pre-wrap">{campana.notas}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Leads asociados ({campana.leads_count ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <LeadsTable leads={campana.leads ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
