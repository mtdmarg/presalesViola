"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

export default function DeleteCampanaButton({
  id,
  nombre,
}: {
  id: number
  nombre: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/campanas/${id}`, { method: "DELETE" })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "No se pudo eliminar")
          return
        }
        setOpen(false)
        router.push("/campanas")
        router.refresh()
      } catch {
        setError("Error de conexión")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" />
        }
      >
        <Trash2 size={14} className="mr-1.5" />
        Eliminar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar campaña</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que querés eliminar <strong>{nombre}</strong>?
            Esta acción no se puede deshacer. Si la campaña tiene leads asociados, no podrá eliminarse.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
