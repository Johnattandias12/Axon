// Aplica todas as migrations *.sql de supabase/migrations no banco remoto.
// Uso: node scripts/apply-migrations.mjs
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import pg from "pg"

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "qirogiafdyyvsuxspepq"
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD
if (!DB_PASSWORD) {
  console.error("ERRO: defina SUPABASE_DB_PASSWORD")
  process.exit(1)
}

// Pooler (porta 6543, modo transaction) é mais permissivo para conexões externas
// e suporta IPv4. Em alguns ambientes a conexão direta (db.<ref>.supabase.co) está
// inacessível por IPv6-only.
// Tenta encontrar a região correta do pooler
const REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "sa-east-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-central-2",
  "eu-north-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "ca-central-1",
]

async function findClient() {
  for (const region of REGIONS) {
    const host = `aws-0-${region}.pooler.supabase.com`
    const cs = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@${host}:5432/postgres`
    const c = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } })
    process.stdout.write(`  · ${region}…`)
    try {
      await c.connect()
      process.stdout.write(" ✓\n")
      return c
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      process.stdout.write(` ✗ (${msg.slice(0, 60)})\n`)
      try {
        await c.end()
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error("Não consegui conectar em nenhuma região do pooler.")
}

const client = await findClient()

const dir = path.resolve("supabase/migrations")
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()

console.log(`Procurando região do projeto ${PROJECT_REF}…`)
console.log("✓ conectado.\n")

for (const f of files) {
  const full = path.join(dir, f)
  const sql = await readFile(full, "utf8")
  process.stdout.write(`→ aplicando ${f}…`)
  try {
    await client.query(sql)
    process.stdout.write(" ✓\n")
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/already exists|duplicate object|duplicate key/i.test(msg)) {
      process.stdout.write(" (já aplicada, ignorando)\n")
    } else {
      process.stdout.write(" ✗\n")
      console.error("  →", msg)
      process.exitCode = 1
      break
    }
  }
}

await client.end()
console.log("\nFinalizado.")
