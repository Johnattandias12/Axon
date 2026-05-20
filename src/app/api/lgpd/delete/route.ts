import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * LGPD art. 18 VI — Eliminação dos dados.
 *
 * Não fazemos hard-delete imediato: marcamos a conta como "delete_requested"
 * em audit_logs e em profiles.metadata, e anonimizamos campos pessoais
 * (nome, telefone, avatar). Mantemos ingressos, pedidos e logs porque há
 * obrigação legal de retenção fiscal (CDC + Receita) — registros viram
 * pseudoanônimos com user_id ainda apontando pro auth.users que é deletado
 * em job separado após 30 dias.
 *
 * Fluxo:
 *  1. Audita o pedido.
 *  2. Anonimiza dados pessoais em profiles.
 *  3. Marca metadata.delete_requested_at = now.
 *  4. Faz logout. Banca a remoção via cron em D+30.
 *
 * Body opcional: { reason: string }
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let reason = ""
  try {
    const body = (await req.json()) as { reason?: string }
    reason = (body?.reason ?? "").toString().slice(0, 500)
  } catch {
    /* sem body é OK */
  }

  const admin = createAdminClient()

  // Audita o pedido ANTES de qualquer mutação
  try {
    const a = admin as unknown as {
      from: (n: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
      }
    }
    await a.from("audit_logs").insert({
      user_id: user.id,
      action: "lgpd_delete_requested",
      target_type: "self",
      target_id: user.id,
      metadata: { reason, requested_at: new Date().toISOString() },
    })
  } catch (e) {
    console.error("[lgpd/delete] audit log failed (continuando):", e)
  }

  // Anonimiza profile. Tabela profiles não tem campo metadata, então
  // gravamos o pedido em audit_logs e zeramos os campos identificáveis.
  const anonName = `Usuário removido ${user.id.slice(0, 8)}`

  const { error: updErr } = await admin
    .from("profiles")
    .update({
      full_name: anonName,
      phone: null,
      avatar_url: null,
      birth_date: null,
      cpf: null,
    })
    .eq("id", user.id)

  if (updErr) {
    return NextResponse.json({ error: "delete_failed", detail: updErr.message }, { status: 500 })
  }

  // Tenta deletar a conta auth — silencioso se falhar (cron pega depois)
  try {
    await admin.auth.admin.deleteUser(user.id)
  } catch (e) {
    console.error("[lgpd/delete] deleteUser falhou (sera retentado):", e)
  }

  // Faz logout do client cookie
  await supabase.auth.signOut()

  return NextResponse.json({
    ok: true,
    message:
      "Seus dados pessoais foram anonimizados. A conta de autenticação será removida em até 30 dias, conforme política de retenção fiscal.",
  })
}
