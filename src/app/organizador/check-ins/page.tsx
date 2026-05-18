import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PageHeader } from "@/components/shared/PageHeader"
import { CheckInsDashboard } from "@/components/check-ins/CheckInsDashboard"
import { listCheckIns, computeCheckInStats } from "@/lib/check-ins/queries"

export const metadata: Metadata = { title: "Check-ins · Organizador" }
export const dynamic = "force-dynamic"

export default async function OrganizadorCheckInsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/organizador/check-ins")

  const admin = createAdminClient()

  // Resolve eventos do organizador atual
  const { data: organizer } = await admin
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!organizer) redirect("/organizador/comecar")

  const { data: events } = await admin
    .from("events")
    .select("id, title")
    .eq("organizer_id", (organizer as { id: string }).id)

  const eventIds = (events ?? []).map((e) => e.id)
  const rows = eventIds.length > 0 ? await listCheckIns(admin, { eventIds, limit: 300 }) : []
  const stats = computeCheckInStats(rows)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Check-ins"
        title="Atividade na porta"
        description={
          eventIds.length === 0
            ? "Você ainda não criou eventos. Crie um pra começar a coletar check-ins."
            : `Logs de validação dos seus ${eventIds.length} ${eventIds.length === 1 ? "evento" : "eventos"}.`
        }
      />
      <CheckInsDashboard rows={rows} stats={stats} />
    </div>
  )
}
