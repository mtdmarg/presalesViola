import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getUsuarioById } from "@/lib/queries/usuarios"
import PageHeader from "@/components/layout/PageHeader"
import UsuarioForm from "@/components/usuarios/UsuarioForm"

export const dynamic = "force-dynamic"

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const usuario = await getUsuarioById(id)
  if (!usuario) notFound()

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={`Editar: ${usuario.full_name ?? usuario.username}`}
        breadcrumbs={[{ label: "Usuarios", href: "/usuarios" }, { label: usuario.username }]}
      />
      <UsuarioForm
        usuario={usuario}
        mode="edit"
        currentUserId={session?.user?.id}
      />
    </div>
  )
}
