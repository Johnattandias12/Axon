// Roda scripts/wipe-my-orders.sql via direct connection
import { readFile } from "node:fs/promises"
import pg from "pg"
import "dotenv/config"

const { Client } = pg
const pwd = process.env.SUPABASE_DB_PASSWORD
const ref = process.env.SUPABASE_PROJECT_REF
if (!pwd || !ref) {
  console.error("Faltam SUPABASE_DB_PASSWORD ou SUPABASE_PROJECT_REF")
  process.exit(1)
}

const url = `postgresql://postgres:${encodeURIComponent(pwd)}@db.${ref}.supabase.co:5432/postgres`
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
console.log("✓ Conectado")

const sql = await readFile("scripts/wipe-my-orders.sql", "utf8")
const { rows } = await client.query(`SELECT current_setting('client_min_messages', true) AS m`)
console.log("Rodando wipe-my-orders.sql...")
client.on("notice", (n) => console.log("  ", n.message))
await client.query(sql)
console.log("✓ Wipe executado.")

// Verifica resultado
const r = await client.query(
  `SELECT
    (SELECT count(*) FROM public.orders o JOIN auth.users u ON u.id=o.buyer_id WHERE u.email='johnattan.dias@gmail.com')::int AS orders,
    (SELECT count(*) FROM public.tickets t JOIN public.orders o ON o.id=t.order_id JOIN auth.users u ON u.id=o.buyer_id WHERE u.email='johnattan.dias@gmail.com')::int AS tickets,
    (SELECT count(*) FROM public.cart_items c JOIN auth.users u ON u.id=c.user_id WHERE u.email='johnattan.dias@gmail.com')::int AS cart`
)
console.log("\nRestante pro user johnattan.dias@gmail.com:", r.rows[0])
await client.end()
