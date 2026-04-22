"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { TipoVentaStat } from "@/lib/queries/stats"

const COLORS: Record<string, string> = {
  PLAN: "#EB0A1E",
  CONVENCIONAL: "#2563eb",
  USADO: "#16a34a",
  INDEFINIDO: "#9ca3af",
}

function getColor(tipoventa: string, idx: number): string {
  return COLORS[tipoventa] ?? ["#f59e0b", "#8b5cf6", "#06b6d4"][idx % 3]
}

export default function TipoVentaChart({ data }: { data: TipoVentaStat[] }) {
  if (!data.length) return <p className="text-sm text-zinc-400 text-center py-8">Sin datos</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="tipoventa"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={(props) => {
            const p = props as unknown as { tipoventa: string; percent?: number }
            return `${p.tipoventa} ${((p.percent ?? 0) * 100).toFixed(0)}%`
          }}
          labelLine={false}
        >
          {data.map((entry, idx) => (
            <Cell key={entry.tipoventa} fill={getColor(entry.tipoventa, idx)} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value as number, "Leads"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
