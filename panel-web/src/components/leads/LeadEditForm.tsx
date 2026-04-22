"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lead } from "@/types/lead"

interface LeadEditFormProps {
  lead: Lead
}

export default function LeadEditForm({ lead }: LeadEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    nombre:                lead.nombre ?? "",
    telefono:              lead.telefono ?? "",
    email:                 lead.email ?? "",
    ciudad:                lead.ciudad ?? "",
    tipoventa:             lead.tipoventa ?? "",
    estado:                lead.estado ?? "",
    etapa_ciclo_vida:      lead.etapa_ciclo_vida ?? "",
    origen:                lead.origen ?? "",
    fuente:                lead.fuente ?? "",
    modelo_interes:        lead.modelo_interes ?? "",
    modelo_version:        lead.modelo_version ?? "",
    plan_interes:          lead.plan_interes ?? "",
    modelo_color:          lead.modelo_color ?? "",
    tiempo_espero_entrega: lead.tiempo_espero_entrega ?? "",
    financiacion:          lead.financiacion ?? "",
    marca_modelo_usado:    lead.marca_modelo_usado ?? "",
    motivo_no_califica:    lead.motivo_no_califica ?? "",
    resumencliente:        lead.resumencliente ?? "",
  })

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Convertir strings vacíos a null
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()])
    )

    startTransition(async () => {
      try {
        const res = await fetch(`/api/leads/${lead.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Error al guardar")
          return
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        router.refresh()
      } catch {
        setError("Error de conexión")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos de contacto */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Datos de contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input id="ciudad" value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Clasificación */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Clasificación</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tipo de venta</Label>
            <Select value={form.tipoventa} onValueChange={(v) => set("tipoventa", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PLAN">Plan de ahorro</SelectItem>
                <SelectItem value="CONVENCIONAL">Convencional</SelectItem>
                <SelectItem value="USADO">Usado</SelectItem>
                <SelectItem value="INDEFINIDO">Indefinido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={(v) => set("estado", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="calificando">Calificando</SelectItem>
                <SelectItem value="calificado">Calificado</SelectItem>
                <SelectItem value="conversando">Conversando</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="etapa_ciclo_vida">Etapa del ciclo</Label>
            <Input id="etapa_ciclo_vida" value={form.etapa_ciclo_vida} onChange={(e) => set("etapa_ciclo_vida", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="origen">Origen</Label>
            <Input id="origen" value={form.origen} onChange={(e) => set("origen", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fuente">Fuente</Label>
            <Input id="fuente" value={form.fuente} onChange={(e) => set("fuente", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Interés */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Interés</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="modelo_interes">Modelo de interés</Label>
            <Input id="modelo_interes" value={form.modelo_interes} onChange={(e) => set("modelo_interes", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modelo_version">Versión</Label>
            <Input id="modelo_version" value={form.modelo_version} onChange={(e) => set("modelo_version", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan_interes">Plan de interés</Label>
            <Input id="plan_interes" value={form.plan_interes} onChange={(e) => set("plan_interes", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modelo_color">Color preferido</Label>
            <Input id="modelo_color" value={form.modelo_color} onChange={(e) => set("modelo_color", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiempo_espero_entrega">Tiempo espera entrega</Label>
            <Input id="tiempo_espero_entrega" value={form.tiempo_espero_entrega} onChange={(e) => set("tiempo_espero_entrega", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="financiacion">Financiación</Label>
            <Input id="financiacion" value={form.financiacion} onChange={(e) => set("financiacion", e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="marca_modelo_usado">Vehículo usado</Label>
            <Input id="marca_modelo_usado" value={form.marca_modelo_usado} onChange={(e) => set("marca_modelo_usado", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="resumencliente">Resumen del cliente</Label>
            <Textarea id="resumencliente" rows={4} value={form.resumencliente} onChange={(e) => set("resumencliente", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motivo_no_califica">Motivo no califica</Label>
            <Textarea id="motivo_no_califica" rows={2} value={form.motivo_no_califica} onChange={(e) => set("motivo_no_califica", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Check size={15} />
            Guardado
          </span>
        )}
        <Button type="submit" disabled={isPending} className="text-white" style={{ backgroundColor: "#EB0A1E" }}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
