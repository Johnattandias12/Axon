// Configura app.qr_secret no Postgres usando o QR_HMAC_SECRET do .env.local.
// Sem isso, generate_qr_hash() falha → confirm_order() falha no webhook → ingressos nunca são gerados.
// Uso: node scripts/set-qr-secret.mjs
import { config } from "dotenv"
config({ path: ".env.local" })

import pg from "pg"

const { Client } = pg
const pwd = process.env.SUPABASE_DB_PASSWORD
const ref = process.env.SUPABASE_PROJECT_REF
const secret = process.env.QR_HMAC_SECRET
if (!pwd || !ref || !secret) {
  console.error("Faltam SUPABASE_DB_PASSWORD / SUPABASE_PROJECT_REF / QR_HMAC_SECRET")
  process.exit(1)
}

const url = `postgresql://postgres:${encodeURIComponent(pwd)}@db.${ref}.supabase.co:5432/postgres`
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()
console.log("✓ Conectado")

// Setting é por database — precisa ser feito como superuser. supabase service_role permite.
const safeSecret = secret.replace(/'/g, "''")
await c.query(`ALTER DATABASE postgres SET app.qr_secret = '${safeSecret}';`)
console.log("✓ app.qr_secret aplicado no DATABASE postgres")

// Verifica imediatamente (precisa reabrir conexão pra pegar o novo SET — então faz teste de generate_qr_hash em uma session nova)
await c.end()
const c2 = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c2.connect()
try {
  const r = await c2.query(`SELECT public.generate_qr_hash(gen_random_uuid(), gen_random_uuid()) as h`)
  console.log("✓ generate_qr_hash retornou:", r.rows[0]?.h?.slice(0, 30) + "...")
} catch (e) {
  console.error("✗ generate_qr_hash falhou:", e.message)
  process.exitCode = 1
}
await c2.end()
