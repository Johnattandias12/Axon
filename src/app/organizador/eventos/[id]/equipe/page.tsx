import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { TeamManager } from "./TeamManager"

export const metadata: Metadata = { title: "Equipe" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EquipePage({ params }: Props) {
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
    .select("id, title")
    .eq("id", id)
    .eq("organizer_id", organizer.id)
    .single()
  if (!event) notFound()

  const { data: validators } = await supabase
    .from("event_validators")
    .select("user_id, gate, added_at, profiles ( full_name, role )")
    .eq("event_id", id)

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href={`/organizador/eventos/${id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm"
          style={{ color: "var(--mute)" }}
        >
          <ChevronLeft size={14} />
          {event.title}
        </Link>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Equipe
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          Convide validadores para escanear QR neste evento.
        </p>
      </div>

      <TeamManager eventId={id} initialValidators={validators ?? []} />
    </div>
  )
}
