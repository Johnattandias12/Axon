import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const SETUP_TOKEN = "AXON-BEYONDER-2026"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      setupToken?: string
      email?: string
      password?: string
      name?: string
    }

    if (body.setupToken !== SETUP_TOKEN) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 })
    }

    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]
    const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Variáveis de ambiente não configuradas." },
        { status: 500 }
      )
    }

    const adminEmail = body.email ?? "admin@axon.com.br"
    const adminPassword = body.password ?? "Axon@Beyonder2026!"
    const adminName = body.name ?? "Johnattan Dias"

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: existing } = await supabase.auth.admin.listUsers()
    const alreadyExists = existing?.users?.find((u) => u.email === adminEmail)

    let userId: string

    if (alreadyExists) {
      userId = alreadyExists.id
      await supabase.auth.admin.updateUserById(userId, { password: adminPassword })
    } else {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: adminName },
      })
      if (createError || !created.user) {
        return NextResponse.json(
          { error: createError?.message ?? "Erro ao criar usuário." },
          { status: 500 }
        )
      }
      userId = created.user.id
    }

    await supabase.from("profiles").upsert({
      id: userId,
      full_name: adminName,
      role: "admin",
    })

    return NextResponse.json({
      ok: true,
      email: adminEmail,
      password: adminPassword,
      message: "Admin criado com sucesso. Guarde essas credenciais.",
    })
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
