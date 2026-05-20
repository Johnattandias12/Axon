// Aplica migration 019_auto_refund_tickets.sql.
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

const url = `postgresql://postgres:${encodeURIComponent(pwd)}@db.${ref}.supabase.co:5432/postgres`
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()
console.log("✓ Conectado")

const sql = await readFile(
  path.resolve("supabase/migrations/019_auto_refund_tickets.sql"),
  "utf8"
)
try {
  await c.query(sql)
  console.log("✓ 019 aplicada")
} catch (e) {
  console.error("✗ Erro:", e.message)
  process.exitCode = 1
}

const r = await c.query(
  `SELECT tgname FROM pg_trigger WHERE tgname IN ('trg_propagate_order_status','trg_guard_order_terminal')`
)
console.log("  triggers presentes:", r.rows.map((x) => x.tgname).join(", ") || "(nenhum)")
await c.end()
