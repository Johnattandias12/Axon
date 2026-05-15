import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { EditEventForm } from "./EditEventForm"

export const metadata: Metadata = { title: "Editar evento" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarEventoPage({ params }: Props) {
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
    .select(
      "id, title, description, category, age_rating, venue_name, address, city, state, starts_at, ends_at, cover_policy, status, banner_url"
    )
    .eq("id", id)
    .eq("organizer_id", organizer.id)
    .single()

  if (!event) notFound()

  const refundDays =
    event.cover_policy &&
    typeof event.cover_policy === "object" &&
    !Array.isArray(event.cover_policy) &&
    "refund_days" in event.cover_policy
      ? Number(event.cover_policy.refund_days)
      : 7

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/organizador/eventos/${id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm"
          style={{ color: "var(--mute)" }}
        >
          <ChevronLeft size={14} />
          Voltar ao evento
        </Link>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Editar evento
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          {event.title}
        </p>
      </div>

      <EditEventForm
        eventId={id}
        organizerId={organizer.id}
        bannerUrl={event.banner_url}
        initial={{
          title: event.title,
          description: event.description ?? "",
          category: event.category as "show" | "esporte" | "religioso" | "curso" | "outro",
          age_rating: event.age_rating ?? "",
          venue_name: event.venue_name ?? "",
          address: event.address ?? "",
          city: event.city ?? "",
          state: event.state ?? "",
          starts_at: event.starts_at ? event.starts_at.slice(0, 16) : "",
          ends_at: event.ends_at ? event.ends_at.slice(0, 16) : "",
          refund_days: refundDays,
        }}
      />
    </div>
  )
}
