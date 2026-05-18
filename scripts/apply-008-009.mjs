// Aplica migrations 008 e 009 + configura app.qr_secret/admin_emails
// Conecta direto via db.<ref>.supabase.co (como o check-db.mjs faz).
import { readFile } from "node:fs/promises"
import path from "node:path"
import pg from "pg"
import "dotenv/config"

const { Client } = pg

const pwd = process.env.SUPABASE_DB_PASSWORD
const ref = process.env.SUPABASE_PROJECT_REF
const qrSecret = process.env.QR_HMAC_SECRET
const adminEmails = process.env.ADMIN_EMAILS

if (!pwd || !ref) {
  console.error("Faltam SUPABASE_DB_PASSWORD ou SUPABASE_PROJECT_REF")
  process.exit(1)
}

const candidates = [
  `postgresql://postgres:${encodeURIComponent(pwd)}@db.${ref}.supabase.co:5432/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
]

let client
for (const url of candidates) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  try {
    await c.connect()
    console.log("✓ Conectado via:", url.replace(/:[^:@]+@/, ":****@"))
    client = c
    break
  } catch (e) {
    console.log("✗", url.split("@")[1], "-", e.message.split("\n")[0])
    await c.end().catch(() => {})
  }
}
if (!client) {
  console.error("Não consegui conectar.")
  process.exit(1)
}

async function runFile(file) {
  const full = path.resolve("supabase/migrations", file)
  const sql = await readFile(full, "utf8")
  process.stdout.write(`→ ${file}...`)
  try {
    await client.query(sql)
    process.stdout.write(" ✓\n")
    return true
  } catch (e) {
    const msg = e.message ?? String(e)
    if (/already exists|duplicate object|duplicate key/i.test(msg)) {
      process.stdout.write(" (parcial — já existia parte)\n")
      return true
    }
    process.stdout.write(" ✗\n")
    console.error("  ", msg.slice(0, 200))
    return false
  }
}

console.log("\nAplicando migrations:")
await runFile("008_affiliates.sql")
await runFile("009_affiliates_invite_credit.sql")

// Configura GUCs do Postgres
console.log("\nConfigurando settings:")
if (qrSecret) {
  try {
    await client.query(`ALTER DATABASE postgres SET app.qr_secret = '${qrSecret.replace(/'/g, "''")}'`)
    console.log("  ✓ app.qr_secret configurado")
  } catch (e) {
    console.log("  ✗ app.qr_secret:", e.message.slice(0, 100))
  }
}
if (adminEmails) {
  try {
    await client.query(`ALTER DATABASE postgres SET app.admin_emails = '${adminEmails.replace(/'/g, "''")}'`)
    console.log("  ✓ app.admin_emails configurado")
  } catch (e) {
    console.log("  ✗ app.admin_emails:", e.message.slice(0, 100))
  }
}

// Verifica resultado
console.log("\nVerificando:")
const tables = await client.query(
  `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('affiliates','affiliate_referrals','affiliate_invites') ORDER BY tablename`
)
console.log("  Tabelas afiliados:", tables.rows.map((r) => r.tablename).join(", ") || "(nenhuma)")

const cols = await client.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='profiles' AND column_name LIKE 'wallet%'
   ORDER BY column_name`
)
console.log("  Colunas wallet em profiles:", cols.rows.map((r) => r.column_name).join(", ") || "(nenhuma)")

const affStatus = await client.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='affiliates' AND column_name IN ('status','approved_by','approved_at')
   ORDER BY column_name`
)
console.log("  Status em affiliates:", affStatus.rows.map((r) => r.column_name).join(", ") || "(nenhuma)")

await client.end()
console.log("\nDone.")
