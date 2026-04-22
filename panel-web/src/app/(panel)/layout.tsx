import { auth } from "@/auth"
import { redirect } from "next/navigation"
import PanelShell from "@/components/layout/PanelShell"

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <PanelShell user={session.user}>
      {children}
    </PanelShell>
  )
}
