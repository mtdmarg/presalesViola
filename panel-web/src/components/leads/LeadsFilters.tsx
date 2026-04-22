"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LeadsFiltersProps {
  etapas: string[]
  estados: string[]
  fuentes: string[]
}

export default function LeadsFilters({ etapas, estados, fuentes }: LeadsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const current = {
    q: searchParams.get("q") ?? "",
    tipoventa: searchParams.get("tipoventa") ?? "",
    etapa: searchParams.get("etapa_ciclo_vida") ?? "",
    estado: searchParams.get("estado") ?? "",
    fuente: searchParams.get("fuente") ?? "",
  }

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const hasFilters = current.q || current.tipoventa || current.etapa || current.estado || current.fuente

  function clearFilters() {
    startTransition(() => router.push(pathname))
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Búsqueda — ancho completo */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input
          className="pl-8 h-9 text-sm w-full"
          placeholder="Buscar por nombre, email o teléfono..."
          defaultValue={current.q}
          onChange={(e) => {
            const val = e.target.value
            const timer = setTimeout(() => updateParam("q", val), 350)
            return () => clearTimeout(timer)
          }}
        />
      </div>

      {/* Combos con label — grid 2 cols en mobile, fila en desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 items-end">

        {/* Tipo venta */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-medium text-zinc-500 px-0.5">Tipo venta</span>
          <Select
            value={current.tipoventa || "_all_"}
            onValueChange={(v) => updateParam("tipoventa", !v || v === "_all_" ? "" : v)}
          >
            <SelectTrigger className="h-8 text-sm w-full sm:w-36">
              <SelectValue>{current.tipoventa || "Todos"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">Todos</SelectItem>
              <SelectItem value="PLAN">PLAN</SelectItem>
              <SelectItem value="CONVENCIONAL">CONVENCIONAL</SelectItem>
              <SelectItem value="USADO">USADO</SelectItem>
              <SelectItem value="INDEFINIDO">INDEFINIDO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        {estados.length > 0 && (
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-medium text-zinc-500 px-0.5">Estado</span>
            <Select
              value={current.estado || "_all_"}
              onValueChange={(v) => updateParam("estado", !v || v === "_all_" ? "" : v)}
            >
              <SelectTrigger className="h-8 text-sm w-full sm:w-36">
                <SelectValue>{current.estado || "Todos"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Todos</SelectItem>
                {estados.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Etapa */}
        {etapas.length > 0 && (
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-medium text-zinc-500 px-0.5">Etapa</span>
            <Select
              value={current.etapa || "_all_"}
              onValueChange={(v) => updateParam("etapa_ciclo_vida", !v || v === "_all_" ? "" : v)}
            >
              <SelectTrigger className="h-8 text-sm w-full sm:w-40">
                <SelectValue>{current.etapa || "Todos"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Todos</SelectItem>
                {etapas.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Campaña / fuente */}
        {fuentes.length > 0 && (
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-medium text-zinc-500 px-0.5">Campaña</span>
            <Select
              value={current.fuente || "_all_"}
              onValueChange={(v) => updateParam("fuente", !v || v === "_all_" ? "" : v)}
            >
              <SelectTrigger className="h-8 text-sm w-full sm:w-44">
                <SelectValue>{current.fuente || "Todos"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Todos</SelectItem>
                {fuentes.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Limpiar filtros */}
        {hasFilters && (
          <div className="flex flex-col justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-zinc-400 gap-1 self-end"
            >
              <X size={12} />
              Limpiar
            </Button>
          </div>
        )}

        {isPending && (
          <span className="text-xs text-zinc-400 animate-pulse self-end pb-1.5">
            Buscando...
          </span>
        )}
      </div>
    </div>
  )
}
