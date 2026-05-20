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
