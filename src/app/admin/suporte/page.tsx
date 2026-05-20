/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SupportConsoleClient } from "./SupportConsoleClient"

export const metadata: Metadata = { title: "Suporte & Infraestrutura · AXON Admin" }

export default async function AdminSuportePage() {
  const supabase = await createClient()

  // 1. Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/entrar?redirectTo=/admin/suporte")
  }

  // 2. Verificar permissão de Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/minha-conta")
  }

  // 3. Buscar dados iniciais no banco com Promise.all para máxima performance
  const [profilesRes, ticketsRes, ordersRes, emailLogsRes, paymentModeRes] = await Promise.all([
    (supabase as any)
      .from("profiles")
      .select("id, full_name, phone, role, created_at, cpf, email")
      .order("created_at", { ascending: false }),
    supabase
      .from("tickets")
      .select(
        `
        id, order_id, status, holder_name, holder_cpf, refund_requested_at, refund_reason, created_at,
        events(id, title, starts_at, venue_name, city, state)
      `
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(
        "id, buyer_id, status, subtotal_cents, service_fee_cents, total_cents, gateway_order_id, created_at"
      )
      .order("created_at", { ascending: false }),
    (supabase as any)
      .from("email_logs")
      .select("id, user_id, to_email, email_type, subject, status, error, created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    (supabase as any)
      .from("system_settings")
      .select("value")
      .eq("key", "payment_mode")
      .maybeSingle(),
  ])

  const profiles = (profilesRes.data as any) ?? []
  const tickets = (ticketsRes.data ?? []) as any[]
  const orders = ordersRes.data ?? []
  const emailLogs = (emailLogsRes.data as any) ?? []
  const paymentMode = (paymentModeRes.data as any)?.value ?? "real"

  return (
    <SupportConsoleClient
      initialProfiles={profiles}
      initialTickets={tickets}
      initialOrders={orders}
      initialEmailLogs={emailLogs}
      paymentMode={paymentMode}
    />
  )
}
