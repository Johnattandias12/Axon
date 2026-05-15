import pg from "pg"
import "dotenv/config"

const { Client } = pg

const pwd = process.env.SUPABASE_DB_PASSWORD
const ref = process.env.SUPABASE_PROJECT_REF
if (!pwd || !ref) {
  console.error("Faltam SUPABASE_DB_PASSWORD ou SUPABASE_PROJECT_REF no .env.local")
  process.exit(1)
}

const candidates = [
  `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(pwd)}@db.${ref}.supabase.co:5432/postgres`,
]

let client
for (const url of candidates) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  try {
    await c.connect()
    console.log("✅ Conectado via:", url.replace(/:[^:@]+@/, ":****@"))
    client = c
    break
  } catch (e) {
    console.log("❌ Falhou:", url.split("@")[1], "-", e.message.split("\n")[0])
    await c.end().catch(() => {})
  }
}
if (!client) {
  console.error("Não consegui conectar em nenhum host")
  process.exit(1)
}

const tables = await client.query(
  `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
)
console.log("\nTABELAS public:", tables.rows.map((r) => r.tablename).join(", ") || "(nenhuma)")

const triggers = await client.query(
  `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name='on_auth_user_created'`
)
console.log("Trigger on_auth_user_created:", triggers.rows.length > 0 ? "✅" : "❌")

try {
  const u = await client.query(`SELECT count(*)::int AS n FROM auth.users`)
  console.log("auth.users:", u.rows[0].n)
} catch (e) {
  console.log("auth.users:", "ERR:", e.message)
}

try {
  const p = await client.query(`SELECT count(*)::int AS n FROM public.profiles`)
  console.log("public.profiles:", p.rows[0].n)
} catch (e) {
  console.log("public.profiles:", "ERR:", e.message)
}

try {
  const o = await client.query(`SELECT count(*)::int AS n FROM public.organizers`)
  console.log("public.organizers:", o.rows[0].n)
} catch (e) {
  console.log("public.organizers:", "ERR:", e.message)
}

try {
  const a = await client.query(`SHOW app.admin_emails`)
  console.log("app.admin_emails:", a.rows[0].admin_emails || "(vazio)")
} catch (e) {
  console.log("app.admin_emails: ❌ não configurado")
}

try {
  const q = await client.query(`SHOW app.qr_secret`)
  console.log("app.qr_secret:", q.rows[0].qr_secret ? "✅ configurado" : "(vazio)")
} catch (e) {
  console.log("app.qr_secret: ❌ não configurado")
}

// Lista users de auth para checar quem está confirmado
try {
  const list = await client.query(
    `SELECT email, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10`
  )
  console.log("\nÚltimos auth.users:")
  list.rows.forEach((r) =>
    console.log(`  - ${r.email} | confirmado: ${r.email_confirmed_at ? "✅" : "❌"}`)
  )
} catch (e) {
  console.log("Listagem auth.users falhou:", e.message)
}

await client.end()
