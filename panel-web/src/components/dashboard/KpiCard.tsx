import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  highlight?: boolean
}

export default function KpiCard({ title, value, description, icon, highlight }: KpiCardProps) {
  return (
    <Card className={cn("", highlight && "border-l-4")} style={highlight ? { borderLeftColor: "#EB0A1E" } : undefined}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">{value}</p>
            {description && <p className="text-xs text-zinc-400 mt-1">{description}</p>}
          </div>
          {icon && (
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
