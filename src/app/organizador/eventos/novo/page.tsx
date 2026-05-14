import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EventWizard } from "./EventWizard"

export const metadata: Metadata = { title: "Criar evento" }

export default async function NovoEventoPage() {
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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Criar evento
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          Você adiciona os ingressos depois.
        </p>
      </div>
      <EventWizard organizerId={organizer.id} />
    </div>
  )
}
