import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export default function ResumenCard({ resumen }: { resumen: string | null }) {
  if (!resumen) return null

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
          <Sparkles size={14} />
          Resumen IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{resumen}</p>
      </CardContent>
    </Card>
  )
}
