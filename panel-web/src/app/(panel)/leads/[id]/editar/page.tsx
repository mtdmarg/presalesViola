import { notFound } from "next/navigation"
import { getLeadById } from "@/lib/queries/leads"
import PageHeader from "@/components/layout/PageHeader"
import LeadEditForm from "@/components/leads/LeadEditForm"

export const dynamic = "force-dynamic"

export default async function LeadEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const leadId = parseInt(id, 10)
  if (isNaN(leadId)) notFound()

  const lead = await getLeadById(leadId)
  if (!lead) notFound()

  return (
    <div>
      <PageHeader
        title={`Editar lead`}
        description={lead.nombre ?? `Lead #${lead.id}`}
        breadcrumbs={[
          { label: "Leads", href: "/leads" },
          { label: lead.nombre ?? `#${lead.id}`, href: `/leads/${lead.id}` },
          { label: "Editar" },
        ]}
      />
      <div className="max-w-3xl">
        <LeadEditForm lead={lead} />
      </div>
    </div>
  )
}
