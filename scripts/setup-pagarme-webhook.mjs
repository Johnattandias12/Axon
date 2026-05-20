// Cria webhook Pagar.me v5 via API e salva o secret no .env.local.
// Uso: node scripts/setup-pagarme-webhook.mjs
import { readFileSync, writeFileSync } from "node:fs"
import { config } from "dotenv"
config({ path: ".env.local" })

const apiKey = process.env.PAGARME_API_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://axonia.vercel.app"
if (!apiKey) {
  console.error("PAGARME_API_KEY ausente")
  process.exit(1)
}

const WEBHOOK_URL = `${appUrl.replace(/\/$/, "")}/api/webhooks/pagarme`
const EVENTS = [
  "order.paid",
  "order.payment_failed",
  "order.canceled",
  "order.expired",
  "charge.paid",
  "charge.refunded",
  "charge.chargedback",
]

const BASE = "https://api.pagar.me/core/v5"

function authHeader() {
  return "Basic " + Buffer.from(`${apiKey}:`).toString("base64")
}

async function listWebhooks() {
  const res = await fetch(`${BASE}/hooks`, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`Listar webhooks falhou (${res.status}):`, text.slice(0, 300))
    process.exit(1)
  }
  return JSON.parse(text)
}

async function createWebhook() {
  const res = await fetch(`${BASE}/hooks`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: "AXON main webhook",
      url: WEBHOOK_URL,
      events: EVENTS,
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`Criar webhook falhou (${res.status}):`, text.slice(0, 500))
    return null
  }
  return JSON.parse(text)
}

console.log("→ Listando webhooks existentes...")
const list = await listWebhooks()
const items = list?.data ?? list?.items ?? list ?? []
const existing = Array.isArray(items)
  ? items.find((w) => w.url === WEBHOOK_URL)
  : null

let webhook
if (existing) {
  console.log(`✓ Já existe webhook pra ${WEBHOOK_URL} (id=${existing.id})`)
  webhook = existing
} else {
  console.log(`→ Criando webhook em ${WEBHOOK_URL}...`)
  webhook = await createWebhook()
  if (!webhook) process.exit(1)
  console.log(`✓ Webhook criado: id=${webhook.id}`)
}

console.log("\nDados do webhook:")
console.log("  id:", webhook.id)
console.log("  url:", webhook.url || WEBHOOK_URL)
console.log("  events:", webhook.events || EVENTS)
console.log("  secret_key:", webhook.secret_key ? "(presente)" : "(NÃO retornado pela API)")

if (webhook.secret_key) {
  const envPath = ".env.local"
  let env = readFileSync(envPath, "utf8")
  if (env.includes("PAGARME_WEBHOOK_SECRET=")) {
    env = env.replace(
      /PAGARME_WEBHOOK_SECRET=.*/,
      `PAGARME_WEBHOOK_SECRET="${webhook.secret_key}"`
    )
  } else {
    env += `\nPAGARME_WEBHOOK_SECRET="${webhook.secret_key}"\n`
  }
  writeFileSync(envPath, env)
  console.log("\n✓ PAGARME_WEBHOOK_SECRET salvo em .env.local")
} else {
  console.log(
    "\n⚠ A API não retornou secret_key. Você precisa entrar no painel,",
    "\nencontrar esse webhook e copiar manualmente o 'secret' / 'token'."
  )
}
