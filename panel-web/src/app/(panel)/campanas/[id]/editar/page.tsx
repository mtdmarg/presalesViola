import { notFound } from "next/navigation"
import { getCampanaById } from "@/lib/queries/campanas"
import PageHeader from "@/components/layout/PageHeader"
import CampanaForm from "@/components/campanas/CampanaForm"

export const dynamic = "force-dynamic"

export default async function EditarCampanaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const campanaId = parseInt(id, 10)
  if (isNaN(campanaId)) notFound()

  const campana = await getCampanaById(campanaId)
  if (!campana) notFound()

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={`Editar: ${campana.nombre_campana}`}
        breadcrumbs={[
          { label: "Campañas", href: "/campanas" },
          { label: campana.nombre_campana, href: `/campanas/${campana.id}` },
          { label: "Editar" },
        ]}
      />
      <CampanaForm campana={campana} mode="edit" />
    </div>
  )
}
