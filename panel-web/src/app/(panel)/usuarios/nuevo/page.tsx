import PageHeader from "@/components/layout/PageHeader"
import UsuarioForm from "@/components/usuarios/UsuarioForm"

export default function NuevoUsuarioPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Nuevo usuario"
        breadcrumbs={[{ label: "Usuarios", href: "/usuarios" }, { label: "Nuevo" }]}
      />
      <UsuarioForm mode="create" />
    </div>
  )
}
