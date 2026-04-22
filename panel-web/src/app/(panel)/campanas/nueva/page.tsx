import PageHeader from "@/components/layout/PageHeader"
import CampanaForm from "@/components/campanas/CampanaForm"

export default function NuevaCampanaPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Nueva campaña"
        breadcrumbs={[{ label: "Campañas", href: "/campanas" }, { label: "Nueva" }]}
      />
      <CampanaForm mode="create" />
    </div>
  )
}
