"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ALLOWED = ["image/png", "image/jpeg", "image/webp"] as const
const MAX = 5 * 1024 * 1024

export type UploadResult = { ok: true; url: string } | { ok: false; error: string }

/**
 * Upload de banner do evento via server action.
 * Usa admin client (service_role) pra contornar RLS de storage —
 * a autorização é feita aqui: confirma que o usuário é dono do
 * organizer que é dono do evento.
 */
export async function uploadEventBanner(
  _prev: UploadResult | null,
  formData: FormData
): Promise<UploadResult> {
  const eventId = String(formData.get("eventId") ?? "")
  const file = formData.get("file")

  if (!eventId) return { ok: false, error: "Evento inválido" }
  if (!(file instanceof File)) return { ok: false, error: "Arquivo inválido" }
  if (file.size === 0) return { ok: false, error: "Arquivo vazio" }
  if (file.size > MAX) return { ok: false, error: "Imagem muito grande (máx 5 MB)" }
  if (!ALLOWED.includes(file.type as (typeof ALLOWED)[number])) {
    return { ok: false, error: "Use PNG, JPG ou WEBP" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Faça login" }

  // Autorização: usuário é o organizer dono do evento?
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isPrivileged = profile?.role === "admin" || profile?.role === "organizer"
  if (!isPrivileged) return { ok: false, error: "Sem permissão" }

  const admin = createAdminClient()
  const { data: event } = await admin
    .from("events")
    .select("id, organizer_id, organizers(user_id)")
    .eq("id", eventId)
    .single()

  if (!event) return { ok: false, error: "Evento não encontrado" }

  const organizer = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers
  if (profile?.role !== "admin" && organizer?.user_id !== user.id) {
    return { ok: false, error: "Você não é dono deste evento" }
  }

  const ext = (file.name.split(".").pop() ?? "png").toLowerCase()
  const path = `${event.organizer_id}/${event.id}-${Date.now()}.${ext}`

  const bytes = await file.arrayBuffer()
  const { error: upErr } = await admin.storage.from("event-banners").upload(path, bytes, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: true,
  })

  if (upErr) return { ok: false, error: upErr.message }

  const {
    data: { publicUrl },
  } = admin.storage.from("event-banners").getPublicUrl(path)

  const { error: updErr } = await admin
    .from("events")
    .update({ banner_url: publicUrl })
    .eq("id", eventId)

  if (updErr) return { ok: false, error: updErr.message }

  revalidatePath(`/organizador/eventos/${eventId}/editar`)
  revalidatePath(`/organizador/eventos/${eventId}`)
  revalidatePath(`/eventos`)
  return { ok: true, url: publicUrl }
}

export async function removeEventBanner(eventId: string): Promise<UploadResult> {
  if (!eventId) return { ok: false, error: "Evento inválido" }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Faça login" }

  const admin = createAdminClient()
  const { error } = await admin.from("events").update({ banner_url: null }).eq("id", eventId)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/organizador/eventos/${eventId}/editar`)
  return { ok: true, url: "" }
}
