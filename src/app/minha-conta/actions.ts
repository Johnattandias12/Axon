"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const
const MAX = 2 * 1024 * 1024

export type AvatarResult = { ok: true; url: string } | { ok: false; error: string }

/**
 * Upload de avatar do usuário via server action.
 * Usa admin client p/ contornar RLS de storage — autorização pelo user.id.
 */
export async function uploadAvatar(
  _prev: AvatarResult | null,
  formData: FormData
): Promise<AvatarResult> {
  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false, error: "Arquivo inválido" }
  if (file.size === 0) return { ok: false, error: "Arquivo vazio" }
  if (file.size > MAX) return { ok: false, error: "Imagem muito grande (máx 2 MB)" }
  if (!ALLOWED.includes(file.type as (typeof ALLOWED)[number])) {
    return { ok: false, error: "Use PNG, JPG, WEBP ou GIF" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Faça login" }

  const admin = createAdminClient()
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase()
  const path = `${user.id}/avatar-${Date.now()}.${ext}`

  const bytes = await file.arrayBuffer()
  const { error: upErr } = await admin.storage.from("avatars").upload(path, bytes, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: true,
  })
  if (upErr) return { ok: false, error: upErr.message }

  const {
    data: { publicUrl },
  } = admin.storage.from("avatars").getPublicUrl(path)

  const { error: updErr } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)

  if (updErr) return { ok: false, error: updErr.message }

  revalidatePath("/minha-conta")
  revalidatePath("/", "layout")
  return { ok: true, url: publicUrl }
}

export async function removeAvatar(): Promise<AvatarResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Faça login" }

  const admin = createAdminClient()
  const { error } = await admin.from("profiles").update({ avatar_url: null }).eq("id", user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/minha-conta")
  revalidatePath("/", "layout")
  return { ok: true, url: "" }
}
