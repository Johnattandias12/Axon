import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrganizerOnboarding } from "./OrganizerOnboarding"

export const metadata: Metadata = { title: "Configurar conta de organizador" }

export default async function ComecarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/organizador/comecar")

  // Já é organizador? Redireciona para o painel
  const { data: existing } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (existing) redirect("/organizador")

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--paper)" }}>
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <OrganizerOnboarding userId={user.id} />
      </div>
    </div>
  )
}
