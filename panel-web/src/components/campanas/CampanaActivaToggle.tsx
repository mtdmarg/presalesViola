"use client"

import { useState, useTransition } from "react"
import { Switch } from "@/components/ui/switch"

interface CampanaActivaToggleProps {
  id: number
  activa: boolean
}

export default function CampanaActivaToggle({ id, activa }: CampanaActivaToggleProps) {
  const [value, setValue] = useState(activa)
  const [isPending, startTransition] = useTransition()

  function handleToggle(checked: boolean) {
    setValue(checked)
    startTransition(async () => {
      try {
        await fetch(`/api/campanas/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activa: checked }),
        })
      } catch {
        setValue(!checked) // revert on error
      }
    })
  }

  return (
    <Switch
      checked={value}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label={value ? "Desactivar campaña" : "Activar campaña"}
    />
  )
}
