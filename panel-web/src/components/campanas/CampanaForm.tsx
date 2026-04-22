"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { Campana, CampanaFormData } from "@/types/campana"

interface CampanaFormProps {
  campana?: Campana
  mode: "create" | "edit"
}

const TIPOS = ["WhatsApp", "Facebook Ads", "Google Ads", "Instagram", "Orgánico", "Email", "Otro"]
const TIPO_VENTA = ["PLAN", "CONVENCIONAL", "USADO"]

export default function CampanaForm({ campana, mode }: CampanaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<CampanaFormData>({
    tipo: campana?.tipo ?? "",
    source_id: campana?.source_id ?? "",
    nombre_campana: campana?.nombre_campana ?? "",
    modelo: campana?.modelo ?? "",
    tipo_venta: campana?.tipo_venta ?? "",
    plan_interes: campana?.plan_interes ?? "",
    activa: campana?.activa ?? true,
    notas: campana?.notas ?? "",
  })

  function update(field: keyof CampanaFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const url = mode === "create" ? "/api/campanas" : `/api/campanas/${campana!.id}`
        const method = mode === "create" ? "POST" : "PUT"

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Error al guardar")
          return
        }

        router.push("/campanas")
        router.refresh()
      } catch {
        setError("Error de conexión")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre_campana">Nombre de campaña *</Label>
              <Input
                id="nombre_campana"
                value={form.nombre_campana}
                onChange={(e) => update("nombre_campana", e.target.value)}
                required
                placeholder="Ej: WhatsApp Corolla Agosto 2025"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source_id">Source ID *</Label>
              <Input
                id="source_id"
                value={form.source_id}
                onChange={(e) => update("source_id", e.target.value)}
                required
                placeholder="Ej: wpp_corolla_ago25"
              />
              <p className="text-xs text-zinc-400">Debe coincidir con leads.fuente</p>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de canal *</Label>
              <Select value={form.tipo} onValueChange={(v) => update("tipo", v ?? "")} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar canal" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de venta</Label>
              <Select
                value={form.tipo_venta || "none"}
                onValueChange={(v) => update("tipo_venta", !v || v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin especificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {TIPO_VENTA.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                value={form.modelo}
                onChange={(e) => update("modelo", e.target.value)}
                placeholder="Ej: Corolla Cross"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan_interes">Plan de interés</Label>
              <Input
                id="plan_interes"
                value={form.plan_interes}
                onChange={(e) => update("plan_interes", e.target.value)}
                placeholder="Ej: Plan 84 cuotas"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={form.notas}
              onChange={(e) => update("notas", e.target.value)}
              placeholder="Observaciones sobre la campaña..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="activa"
              checked={form.activa}
              onCheckedChange={(v) => update("activa", v)}
            />
            <Label htmlFor="activa" className="cursor-pointer">
              Campaña activa
            </Label>
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
              {isPending ? "Guardando..." : mode === "create" ? "Crear campaña" : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/campanas")}
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
