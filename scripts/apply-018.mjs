// Aplica migration 018_balance_and_quota_hardening.sql.
import { readFile } from "node:fs/promises"
import path from "node:path"
import { config } from "dotenv"
import pg from "pg"

config({ path: ".env.local" })

const { Client } = pg
const pwd = process.env.SUPABASE_DB_PASSWORD
const ref = process.env.SUPABASE_PROJECT_REF
if (!pwd || !ref) {
  console.error("Faltam SUPABASE_DB_PASSWORD / SUPABASE_PROJECT_REF")
  process.exit(1)
}

async function tryConnect() {
  try {
    const url = `postgresql://postgres:${encodeURIComponent(pwd)}@db.${ref}.supabase.co:5432/postgres`
    const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
    await c.connect()
    console.log("✓ Conectado (direct db)")
    return c
  } catch (e) {
    console.log("✗ Direct DB falhou:", e.message?.slice(0, 80))
  }
  const regions = ["sa-east-1", "us-east-1", "us-east-2", "us-west-1", "eu-central-1"]
  for (const r of regions) {
    try {
      const host = `aws-0-${r}.pooler.supabase.com`
      const cs = `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@${host}:6543/postgres`
      const c = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } })
      await c.connect()
      console.log(`✓ Conectado (pooler ${r})`)
      return c
    } catch (e) {
      console.log(`✗ pooler ${r}: ${(e.message || "").slice(0, 60)}`)
    }
  }
  throw new Error("Sem conexão ao Postgres.")
}

const c = await tryConnect()
const sql = await readFile(
  path.resolve("supabase/migrations/018_balance_and_quota_hardening.sql"),
  "utf8"
)
try {
  await c.query(sql)
  console.log("✓ 018 aplicada")
} catch (e) {
  if (/already exists|duplicate object|duplicate key/i.test(e.message)) {
    console.log("(já aplicada)")
  } else {
    console.error("✗ Erro:", e.message)
    process.exitCode = 1
  }
}

const checks = [
  ["organizer_balance view", `SELECT 1 FROM pg_views WHERE viewname='organizer_balance'`],
  [
    "trigger trg_validate_half_price_lots",
    `SELECT 1 FROM pg_trigger WHERE tgname='trg_validate_half_price_lots'`,
  ],
  [
    "idx_orders_event_status_paid_at",
    `SELECT 1 FROM pg_indexes WHERE indexname='idx_orders_event_status_paid_at'`,
  ],
]
for (const [name, q] of checks) {
  const r = await c.query(q)
  console.log(`  ${name}: ${r.rowCount > 0 ? "✓" : "✗"}`)
}
await c.end()
