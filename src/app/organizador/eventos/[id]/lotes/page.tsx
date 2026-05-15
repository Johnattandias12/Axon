import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PageBackLink } from "@/components/shared/PageHeader"
import { LotsManager } from "./LotsManager"

export const metadata: Metadata = { title: "Ingressos" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function LotesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar")

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!organizer) redirect("/organizador/comecar")

  const { data: event } = await supabase
    .from("events")
    .select("id, title, status")
    .eq("id", id)
    .eq("organizer_id", organizer.id)
    .single()
  if (!event) notFound()

  const { data: types } = await supabase
    .from("ticket_types")
    .select(
      "id, name, position, ticket_lots ( id, name, price_cents, quantity_total, is_half_price, position, starts_at, ends_at )"
    )
    .eq("event_id", id)
    .order("position")

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="mb-4">
          <PageBackLink href={`/organizador/eventos/${id}`} label={event.title} />
        </div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Ingressos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          Crie tipos (VIP, Pista) e dentro de cada tipo adicione lotes com preço e quantidade.
        </p>
      </div>

      <LotsManager eventId={id} initialTypes={types ?? []} />
    </div>
  )
}
