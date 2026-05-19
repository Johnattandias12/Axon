import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ScannersClient } from "./ScannersClient"

interface PageProps {
  searchParams: Promise<{ eventId?: string }>
}

interface EventOption {
  id: string
  title: string
  starts_at: string
  status: string
}

interface ScannerRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  gate: string | null
  token: string
  revoked_at: string | null
  last_used_at: string | null
  created_at: string
}

export default async function ScannersPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/organizador/scanners")

  // Eventos do organizador (RLS filtra)
  const { data: eventsData } = await supabase
    .from("events")
    .select("id, title, starts_at, status")
    .order("starts_at", { ascending: false })
    .limit(50)
  const events = (eventsData ?? []) as EventOption[]

  const selectedEventId = sp.eventId || events[0]?.id || null

  let scanners: ScannerRow[] = []
  if (selectedEventId) {
    const sup = supabase as unknown as {
      from: (n: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string
          ) => {
            order: (
              col: string,
              opts: { ascending: boolean }
            ) => Promise<{ data: ScannerRow[] | null }>
          }
        }
      }
    }
    const { data: scannersData } = await sup
      .from("event_scanners")
      .select("id, name, phone, email, gate, token, revoked_at, last_used_at, created_at")
      .eq("event_id", selectedEventId)
      .order("created_at", { ascending: false })
    scanners = scannersData ?? []
  }

  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"

  return (
    <ScannersClient
      events={events}
      selectedEventId={selectedEventId}
      scanners={scanners}
      baseUrl={baseUrl}
    />
  )
}
