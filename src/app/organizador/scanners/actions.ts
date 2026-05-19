"use server"

import { z } from "zod"
import crypto from "node:crypto"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendScannerInvite } from "@/lib/email/send"

export type ActionState =
  | { ok: true; message?: string; scanner?: { id: string; token: string; url: string } }
  | { ok: false; error: string }
  | null

const createSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1, "Nome obrigatório").max(80, "Nome muito longo"),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  gate: z.string().max(40).optional().or(z.literal("")),
})

function buildScanUrl(token: string): string {
  const base = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
  return `${base.replace(/\/$/, "")}/scan/${token}`
}

function generateToken(): string {
  return crypto.randomBytes(16).toString("base64url").slice(0, 22)
}

/**
 * Cria scanner cadastrado por nome — sem necessidade de conta auth.users.
 * Gera token tokenizado de 22 chars (base64url) — link é /scan/[token].
 */
export async function createScannerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createSchema.safeParse({
    eventId: formData.get("eventId"),
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    gate: String(formData.get("gate") ?? "").trim(),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Autenticação necessária." }

  const admin = createAdminClient()

  // Ownership check via RLS-aware client (não-admin) — server.client respeita policy
  const { data: event, error: evErr } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("id", parsed.data.eventId)
    .maybeSingle()
  if (evErr || !event) {
    return { ok: false, error: "Evento não encontrado ou sem permissão." }
  }

  const token = generateToken()
  const insertRow = {
    event_id: parsed.data.eventId,
    name: parsed.data.name,
    ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
    ...(parsed.data.email ? { email: parsed.data.email } : {}),
    ...(parsed.data.gate ? { gate: parsed.data.gate } : {}),
    token,
    created_by: user.id,
  }

  const adminUnsafe = admin as unknown as {
    from: (n: string) => {
      insert: (row: Record<string, unknown>) => {
        select: (cols: string) => {
          single: () => Promise<{
            data: { id: string; token: string } | null
            error: { message: string } | null
          }>
        }
      }
    }
  }
  const { data, error } = await adminUnsafe
    .from("event_scanners")
    .insert(insertRow)
    .select("id, token")
    .single()
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Erro ao criar scanner." }
  }

  // Envia email automaticamente se o user informou
  if (parsed.data.email) {
    const ev = event as { title: string; starts_at: string }
    void sendScannerInvite({
      to: parsed.data.email,
      scannerName: parsed.data.name,
      eventTitle: ev.title,
      eventDate: new Date(ev.starts_at).toLocaleString("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      scanUrl: buildScanUrl(data.token),
    })
  }

  revalidatePath("/organizador/scanners")
  return {
    ok: true,
    message: "Scanner criado",
    scanner: { id: data.id, token: data.token, url: buildScanUrl(data.token) },
  }
}

const revokeSchema = z.object({ scannerId: z.string().uuid() })

export async function revokeScannerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = revokeSchema.safeParse({ scannerId: formData.get("scannerId") })
  if (!parsed.success) return { ok: false, error: "Scanner inválido." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Autenticação necessária." }

  // server.client passa pela RLS de event_scanners → só o dono do evento revoga
  const sup = supabase as unknown as {
    from: (n: string) => {
      update: (row: Record<string, unknown>) => {
        eq: (
          col: string,
          val: string
        ) => {
          select: (cols: string) => {
            single: () => Promise<{
              data: { id: string } | null
              error: { message: string } | null
            }>
          }
        }
      }
    }
  }
  const updRes = await sup
    .from("event_scanners")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.scannerId)
    .select("id")
    .single()

  if (updRes.error) {
    return { ok: false, error: updRes.error.message ?? "Não foi possível revogar." }
  }

  revalidatePath("/organizador/scanners")
  return { ok: true, message: "Scanner revogado." }
}

const resendSchema = z.object({
  scannerId: z.string().uuid(),
  channel: z.enum(["email", "whatsapp"]),
})

/**
 * Re-envia o convite (email apenas — WhatsApp é o user que clica wa.me).
 * O channel "whatsapp" só retorna a URL pra ser aberta no client.
 */
export async function resendScannerInviteAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resendSchema.safeParse({
    scannerId: formData.get("scannerId"),
    channel: formData.get("channel"),
  })
  if (!parsed.success) return { ok: false, error: "Dados inválidos." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Autenticação necessária." }

  const sup2 = supabase as unknown as {
    from: (n: string) => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string
        ) => {
          maybeSingle: () => Promise<{
            data: {
              id: string
              name: string
              email: string | null
              token: string
              event_id: string
              events: { title: string; starts_at: string } | null
            } | null
          }>
        }
      }
    }
  }
  const { data: scanner } = await sup2
    .from("event_scanners")
    .select("id, name, email, token, event_id, events:event_id(title, starts_at)")
    .eq("id", parsed.data.scannerId)
    .maybeSingle()
  const s = scanner
  if (!s) return { ok: false, error: "Scanner não encontrado." }

  if (parsed.data.channel === "email") {
    if (!s.email) return { ok: false, error: "Esse scanner não tem email cadastrado." }
    const ev = s.events
    const res = await sendScannerInvite({
      to: s.email,
      scannerName: s.name,
      eventTitle: ev?.title ?? "Evento AXON",
      eventDate: ev?.starts_at
        ? new Date(ev.starts_at).toLocaleString("pt-BR", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "",
      scanUrl: buildScanUrl(s.token),
    })
    if (!res.sent) return { ok: false, error: res.error ?? "Falha ao enviar." }
    return { ok: true, message: "E-mail enviado." }
  }

  // whatsapp: retorna URL pro client abrir wa.me
  return {
    ok: true,
    scanner: { id: s.id, token: s.token, url: buildScanUrl(s.token) },
  }
}
