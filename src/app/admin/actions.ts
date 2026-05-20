"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function setPaymentMode(mode: "real" | "test") {
  const supabase = await createClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "Não autorizado." }
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { ok: false, error: "Acesso restrito para administradores." }
  }

  // Update setting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("system_settings")
    .upsert({ key: "payment_mode", value: mode })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/admin")
  return { ok: true }
}

export async function resolveRefund(ticketId: string, action: "approve" | "reject") {
  const supabase = await createClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "Não autorizado." }
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { ok: false, error: "Acesso restrito para administradores." }
  }

  if (action === "approve") {
    const { error } = await supabase
      .from("tickets")
      .update({ status: "refunded" })
      .eq("id", ticketId)

    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from("tickets")
      .update({
        status: "valid",
        refund_requested_at: null,
        refund_reason: null,
      })
      .eq("id", ticketId)

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath("/admin/suporte")
  return { ok: true }
}

export async function updateSystemSetting(key: string, value: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "Não autorizado." }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { ok: false, error: "Acesso restrito para administradores." }
  }

  const { error } = await (supabase as any)
    .from("system_settings")
    .upsert({ key, value })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/afiliados")
  revalidatePath("/minha-conta/afiliados")
  revalidatePath("/organizador/financeiro")
  return { ok: true }
}
