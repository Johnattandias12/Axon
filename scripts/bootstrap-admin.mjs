#!/usr/bin/env node
/**
 * Bootstrap admin@axon.com.br no Supabase.
 *
 * Idempotente: cria se não existe, atualiza senha + role=admin se já existe.
 * Confirma email automaticamente (não dispara confirmation email do Supabase).
 *
 * Lê .env.local pra pegar SUPABASE_URL + SERVICE_ROLE_KEY. Roda só local —
 * não precisa de servidor Next up.
 *
 * Uso:
 *   node scripts/bootstrap-admin.mjs
 *   node scripts/bootstrap-admin.mjs --email outro@dominio.com --password "Nova@Senha2026!"
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const envPath = resolve(repoRoot, ".env.local")

if (!existsSync(envPath)) {
  console.error(`[bootstrap-admin] .env.local não encontrado em ${envPath}`)
  process.exit(1)
}

// Mini parser .env (sem trazer dotenv) — suporta aspas duplas opcionais
for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const line = rawLine.trim()
  if (!line || line.startsWith("#")) continue
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i)
  if (!m) continue
  const key = m[1]
  let value = m[2]
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1)
  }
  if (!process.env[key]) process.env[key] = value
}

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce((acc, cur, i, arr) => {
      if (cur.startsWith("--")) acc.push([cur.replace(/^--/, ""), arr[i + 1]])
      return acc
    }, [])
)

const email = args.email ?? "admin@axon.com.br"
const password = args.password ?? "Axon@Beyonder2026!"
const fullName = args.name ?? "AXON Admin"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error("[bootstrap-admin] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log(`[bootstrap-admin] Procurando ${email}...`)

  // listUsers retorna paginated; pra base pequena (admin), perPage=200 cobre
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (listErr) {
    console.error("[bootstrap-admin] Falha ao listar users:", listErr.message)
    process.exit(1)
  }

  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  let userId
  if (existing) {
    console.log(`[bootstrap-admin] Já existe (id=${existing.id}). Atualizando senha + email_confirmed_at...`)
    const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (updErr) {
      console.error("[bootstrap-admin] Falha ao atualizar:", updErr.message)
      process.exit(1)
    }
    userId = existing.id
  } else {
    console.log("[bootstrap-admin] Não existe. Criando...")
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (createErr || !created.user) {
      console.error("[bootstrap-admin] Falha ao criar:", createErr?.message)
      process.exit(1)
    }
    userId = created.user.id
  }

  // Upsert profile com role=admin
  const { error: profErr } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    role: "admin",
  })
  if (profErr) {
    console.error("[bootstrap-admin] Falha no upsert profiles:", profErr.message)
    process.exit(1)
  }

  console.log("[bootstrap-admin] OK.")
  console.log(`  email:    ${email}`)
  console.log(`  password: ${password}`)
  console.log(`  user_id:  ${userId}`)
  console.log(`  role:     admin`)

  const forward = process.env.ADMIN_NOTIFICATIONS_EMAIL
  if (forward) {
    console.log(`  forward:  notificações dessa conta vão pra ${forward}`)
  } else {
    console.log("  forward:  (ADMIN_NOTIFICATIONS_EMAIL não setado — sem forward)")
  }
}

main().catch((err) => {
  console.error("[bootstrap-admin] erro:", err)
  process.exit(1)
})
