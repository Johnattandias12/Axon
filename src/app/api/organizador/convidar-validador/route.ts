import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const bodySchema = z.object({
  eventId: z.string().uuid(),
  email: z.string().email(),
  gate: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const body: unknown = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  const { eventId, email, gate } = parsed.data

  // Verificar que o usuário é dono do evento
  const { data: event } = await supabase
    .from("events")
    .select("id, organizers ( user_id )")
    .eq("id", eventId)
    .single()

  const organizer = Array.isArray(event?.organizers) ? event.organizers[0] : event?.organizers
  if (!event || organizer?.user_id !== user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const admin = createAdminClient()

  // Buscar ou criar usuário pelo e-mail
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find((u) => u.email === email)

  let targetUserId: string
  let targetName: string | null = null

  if (existingUser) {
    targetUserId = existingUser.id
    // Buscar profile
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", existingUser.id)
      .single()
    targetName = profile?.full_name ?? email
  } else {
    // Criar usuário placeholder
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    })
    if (createErr || !newUser.user) {
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }
    targetUserId = newUser.user.id
    targetName = email
  }

  // Atualizar role para validator se ainda for buyer
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .single()
  if (profile?.role === "buyer") {
    await admin.from("profiles").update({ role: "validator" }).eq("id", targetUserId)
  }

  // Inserir em event_validators (upsert)
  const { error: valErr } = await admin
    .from("event_validators")
    .upsert(
      { event_id: eventId, user_id: targetUserId, gate: gate ?? null, added_by: user.id },
      { onConflict: "event_id,user_id" }
    )

  if (valErr) {
    return NextResponse.json({ error: "Erro ao adicionar validador" }, { status: 500 })
  }

  return NextResponse.json({ userId: targetUserId, name: targetName })
}
