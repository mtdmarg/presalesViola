import Link from "next/link"
import { auth } from "@/auth"
import { getUsuarios } from "@/lib/queries/usuarios"
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
import DeleteUsuarioButton from "@/components/usuarios/DeleteUsuarioButton"
import { formatDateShort } from "@/lib/utils"
import { Plus, Pencil, CheckCircle2, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function UsuariosPage() {
  const session = await auth()
  const currentUserId = session?.user?.id ?? ""
  const usuarios = await getUsuarios()

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description={`${usuarios.length} usuarios registrados`}
        action={
          <Link href="/usuarios/nuevo">
            <Button className="gap-1.5 text-white" style={{ backgroundColor: "#EB0A1E" }}>
              <Plus size={15} />
              Nuevo usuario
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase text-zinc-500">
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead className="hidden sm:table-cell">Creado</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-400 text-sm">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                )}
                {usuarios.map((u) => {
                  const isSelf = u.id === currentUserId
                  return (
                    <TableRow key={u.id} className="hover:bg-zinc-50">
                      <TableCell className="font-medium text-sm">
                        {u.full_name ?? "-"}
                        {isSelf && (
                          <span className="ml-2 text-xs text-zinc-400">(vos)</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm font-mono text-zinc-600">{u.username}</TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === "admin" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {u.role === "admin" ? "Admin" : "Viewer"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {u.activa ? (
                          <CheckCircle2 size={15} className="text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle size={15} className="text-zinc-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-zinc-400">{formatDateShort(u.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/usuarios/${u.id}/editar`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Pencil size={13} />
                            </Button>
                          </Link>
                          <DeleteUsuarioButton
                            id={u.id}
                            username={u.username}
                            isSelf={isSelf}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
