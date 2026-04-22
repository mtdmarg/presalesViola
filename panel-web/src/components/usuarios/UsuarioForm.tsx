"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Usuario } from "@/types/usuario"

interface UsuarioFormProps {
  usuario?: Usuario
  mode: "create" | "edit"
  currentUserId?: string
}

export default function UsuarioForm({ usuario, mode, currentUserId }: UsuarioFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    username: usuario?.username ?? "",
    full_name: usuario?.full_name ?? "",
    role: usuario?.role ?? ("viewer" as "admin" | "viewer"),
    activa: usuario?.activa ?? true,
    access_token: usuario?.access_token ?? "",
    chatwoot_id: usuario?.chatwoot_id?.toString() ?? "",
    password: "",
    confirm_password: "",
  })

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === "create" && !form.password) {
      setError("La contraseña es requerida para crear un usuario")
      return
    }
    if (mode === "create" && !form.access_token.trim()) {
      setError("El Chatwoot Access Token es requerido")
      return
    }
    if (mode === "create" && !form.chatwoot_id.trim()) {
      setError("El Chatwoot Agent ID es requerido")
      return
    }
    if (form.password && form.password !== form.confirm_password) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (form.password && form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = {
          username: form.username,
          full_name: form.full_name,
          role: form.role,
          activa: form.activa,
          access_token: form.access_token.trim() || null,
          chatwoot_id: form.chatwoot_id.trim() ? parseInt(form.chatwoot_id, 10) : null,
        }
        if (form.password) payload.password = form.password

        const url = mode === "create" ? "/api/usuarios" : `/api/usuarios/${usuario!.id}`
        const method = mode === "create" ? "POST" : "PUT"

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Error al guardar")
          return
        }

        router.push("/usuarios")
        router.refresh()
      } catch {
        setError("Error de conexión")
      }
    })
  }

  const isSelf = mode === "edit" && usuario?.id === currentUserId

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Datos del usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Usuario *</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                required
                placeholder="ej: juan.perez"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => update("role", v ?? "viewer")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer — solo lectura</SelectItem>
                  <SelectItem value="admin">Admin — acceso total</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch
                id="activa"
                checked={form.activa}
                onCheckedChange={(v) => update("activa", v)}
                disabled={isSelf}
              />
              <Label htmlFor="activa" className="cursor-pointer">
                {form.activa ? "Usuario activo" : "Usuario inactivo"}
              </Label>
              {isSelf && <span className="text-xs text-zinc-400">(no podés desactivarte)</span>}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="access_token">Chatwoot Access Token *</Label>
              <Input
                id="access_token"
                value={form.access_token}
                onChange={(e) => update("access_token", e.target.value)}
                placeholder="Token del perfil de Chatwoot"
                autoComplete="off"
                required={mode === "create"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chatwoot_id">Chatwoot Agent ID *</Label>
              <Input
                id="chatwoot_id"
                type="number"
                value={form.chatwoot_id}
                onChange={(e) => update("chatwoot_id", e.target.value)}
                placeholder="ID numérico del agente"
                required={mode === "create"}
              />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-zinc-700 mb-3">
              {mode === "create" ? "Contraseña *" : "Cambiar contraseña (opcional)"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  {mode === "create" ? "Contraseña" : "Nueva contraseña"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required={mode === "create"}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => update("confirm_password", e.target.value)}
                  required={mode === "create" || !!form.password}
                  placeholder="Repetir contraseña"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="text-white"
              style={{ backgroundColor: "#EB0A1E" }}
            >
              {isPending ? "Guardando..." : mode === "create" ? "Crear usuario" : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/usuarios")}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
