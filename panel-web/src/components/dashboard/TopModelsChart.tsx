"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ModeloStat } from "@/lib/queries/stats"

export default function TopModelsChart({ data }: { data: ModeloStat[] }) {
  if (!data.length) return <p className="text-sm text-zinc-400 text-center py-8">Sin datos</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="modelo_interes"
          tick={{ fontSize: 11 }}
          width={90}
        />
        <Tooltip />
        <Bar dataKey="count" name="Leads" fill="#EB0A1E" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
