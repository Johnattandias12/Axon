import { readFile } from "node:fs/promises"
import pg from "pg"
import "dotenv/config"

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

const sql = await readFile("supabase/migrations/010_payment_methods.sql", "utf8")
try {
  await c.query(sql)
  console.log("✓ 010_payment_methods aplicada")
} catch (e) {
  console.log("Erro:", e.message)
}

const r = await c.query(
  `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='payment_methods'`
)
console.log("  events.payment_methods:", r.rows.length > 0 ? "✓" : "✗")

const f = await c.query(`SELECT proname FROM pg_proc WHERE proname='get_payment_fees'`)
console.log("  function get_payment_fees:", f.rows.length > 0 ? "✓" : "✗")

await c.end()
