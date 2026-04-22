import { getDashboardStats } from "@/lib/queries/stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import KpiCard from "@/components/dashboard/KpiCard"
import TipoVentaChart from "@/components/dashboard/TipoVentaChart"
import TopModelsChart from "@/components/dashboard/TopModelsChart"
import LeadsOverTimeChart from "@/components/dashboard/LeadsOverTimeChart"
import EtapaCicloVidaChart from "@/components/dashboard/EtapaCicloVidaChart"
import PageHeader from "@/components/layout/PageHeader"
import { Users, TrendingUp, Clock, Target } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { kpis, tipoVenta, topModelos, semanal, etapas } = await getDashboardStats()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen de actividad de leads"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Total leads"
          value={kpis.total.toLocaleString("es-AR")}
          icon={<Users size={18} />}
          highlight
        />
        <KpiCard
          title="Calificados hoy"
          value={kpis.calificados_hoy}
          description="estado = calificado"
          icon={<Target size={18} />}
        />
        <KpiCard
          title="Pendientes"
          value={kpis.pendientes.toLocaleString("es-AR")}
          description="Sin calificar"
          icon={<Clock size={18} />}
        />
        <KpiCard
          title="Tasa calificación"
          value={`${kpis.tasa_calificacion}%`}
          description="Sobre el total"
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads por tipo de venta</CardTitle>
          </CardHeader>
          <CardContent>
            <TipoVentaChart data={tipoVenta} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top modelos de interés</CardTitle>
          </CardHeader>
          <CardContent>
            <TopModelsChart data={topModelos} />
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads por semana (últimas 12)</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsOverTimeChart data={semanal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribución por etapa del ciclo de vida</CardTitle>
          </CardHeader>
          <CardContent>
            <EtapaCicloVidaChart data={etapas} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
