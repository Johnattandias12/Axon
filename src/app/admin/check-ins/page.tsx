import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { PageHeader } from "@/components/shared/PageHeader"
import { CheckInsDashboard } from "@/components/check-ins/CheckInsDashboard"
import { listCheckIns, computeCheckInStats } from "@/lib/check-ins/queries"

export const metadata: Metadata = { title: "Check-ins · Admin" }
export const dynamic = "force-dynamic"

export default async function AdminCheckInsPage() {
  const admin = createAdminClient()
  const rows = await listCheckIns(admin, { limit: 300 })
  const stats = computeCheckInStats(rows)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Check-ins · Admin"
        title="Atividade na porta"
        description="Logs de validação consolidados — todos os eventos da plataforma."
      />
      <CheckInsDashboard rows={rows} stats={stats} />
    </div>
  )
}
