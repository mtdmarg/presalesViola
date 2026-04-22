"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { WeeklyStat } from "@/lib/queries/stats"

export default function LeadsOverTimeChart({ data }: { data: WeeklyStat[] }) {
  if (!data.length) return <p className="text-sm text-zinc-400 text-center py-8">Sin datos</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: 0, right: 8 }}>
        <defs>
          <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EB0A1E" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#EB0A1E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="count"
          name="Leads"
          stroke="#EB0A1E"
          strokeWidth={2}
          fill="url(#leadsGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
