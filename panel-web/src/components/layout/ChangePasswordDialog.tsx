"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound } from "lucide-react"

export default function ChangePasswordDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setError(null)
      setSuccess(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const fd = new FormData(e.currentTarget)
    const currentPassword = fd.get("current_password") as string
    const newPassword = fd.get("new_password") as string
    const confirmPassword = fd.get("confirm_password") as string

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden")
      return
    }
    if (newPassword.length < 8) {
      setError("La contraseña nueva debe tener al menos 8 caracteres")
      return
    }
    if (newPassword === currentPassword) {
      setError("La nueva contraseña debe ser diferente a la actual")
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "Error al cambiar la contraseña")
          return
        }
        setSuccess(true)
        setTimeout(() => setOpen(false), 1500)
      } catch {
        setError("Error de conexión")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-default" />
        }
      >
        <KeyRound size={14} />
        Cambiar contraseña
      </DialogTrigger>

      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center">
            <p className="text-emerald-600 font-medium">¡Contraseña actualizada!</p>
            <p className="text-sm text-zinc-400 mt-1">Cerrando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current_password">Contraseña actual</Label>
              <Input
                id="current_password"
                name="current_password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_password">Nueva contraseña</Label>
              <Input
                id="new_password"
                name="new_password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirmar nueva contraseña</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repetir contraseña"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="text-white"
                style={{ backgroundColor: "#EB0A1E" }}
              >
                {isPending ? "Guardando..." : "Cambiar contraseña"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
