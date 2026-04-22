import { getLeads, getLeadFilterOptions } from "@/lib/queries/leads"
import { Card, CardContent } from "@/components/ui/card"
import PageHeader from "@/components/layout/PageHeader"
import LeadsTable from "@/components/leads/LeadsTable"
import LeadsFilters from "@/components/leads/LeadsFilters"
import Pagination from "@/components/leads/Pagination"

export const dynamic = "force-dynamic"

interface SearchParams {
  q?: string
  tipoventa?: string
  etapa_ciclo_vida?: string
  estado?: string
  fuente?: string
  page?: string
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? "1", 10)
  const limit = 20

  const [{ rows, total }, filterOptions] = await Promise.all([
    getLeads({
      q: params.q,
      tipoventa: params.tipoventa,
      etapa_ciclo_vida: params.etapa_ciclo_vida,
      estado: params.estado,
      fuente: params.fuente,
      page,
      limit,
    }),
    getLeadFilterOptions(),
  ])

  return (
    <div>
      <PageHeader
        title="Leads"
        description={`${total.toLocaleString("es-AR")} leads en total`}
      />

      <Card>
        <CardContent className="p-4">
          <LeadsFilters
            etapas={filterOptions.etapas}
            estados={filterOptions.estados}
            fuentes={filterOptions.fuentes}
          />
          <LeadsTable leads={rows} />
          <Pagination total={total} page={page} limit={limit} />
        </CardContent>
      </Card>
    </div>
  )
}
