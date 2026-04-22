import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return format(d, "dd/MM/yyyy HH:mm", { locale: es })
}

export function formatDateShort(date: string | Date | null): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return format(d, "dd/MM/yyyy", { locale: es })
}

export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

export function formatUnixTimestamp(timestamp: number): string {
  return format(new Date(timestamp * 1000), "dd/MM/yyyy HH:mm", { locale: es })
}

export function empty(value: string | null | undefined): boolean {
  return !value || value === "null" || value.trim() === ""
}

export function orDash(value: string | null | undefined): string {
  return empty(value) ? "-" : value!
}
