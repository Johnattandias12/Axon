// Empurra as vars do .env.local pra Vercel (production+preview) via API REST.
// Requer: vercel CLI autenticada localmente (~/.local/share/com.vercel.cli/auth.json)
// Uso: node scripts/push-vercel-env.mjs
import { readFileSync, existsSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import { config } from "dotenv"
config({ path: ".env.local" })

const PROJECT = "axon"
const TEAM_SLUG = "johnattandias12s-projects"

// Vars a empurrar (chave do .env.local)
const KEYS = [
  // Supabase
  "SUPABASE_PROJECT_REF",
  // App
  "NEXT_PUBLIC_APP_NAME",
  // Admin
  "ADMIN_EMAILS",
  // Pagar.me
  "PAGARME_API_KEY",
  "NEXT_PUBLIC_PAGARME_PUBLIC_KEY",
  "PAGARME_RECIPIENT_AXON",
  "NEXT_PUBLIC_PAGARME_ENV",
  "PAGARME_WEBHOOK_SECRET",
  // Resend
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_REPLY_TO",
]

// Pega token do auth.json do CLI
function readVercelToken() {
  const candidates = [
    path.join(homedir(), "AppData/Roaming/com.vercel.cli/Data/auth.json"),
    path.join(homedir(), ".local/share/com.vercel.cli/auth.json"),
    path.join(homedir(), "AppData/Roaming/com.vercel.cli/auth.json"),
    path.join(homedir(), "AppData/Local/com.vercel.cli/auth.json"),
    path.join(homedir(), ".vercel/auth.json"),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const j = JSON.parse(readFileSync(p, "utf8"))
        if (j.token) return j.token
      } catch {}
    }
  }
  return null
}

const token = readVercelToken()
if (!token) {
  console.error("✗ Não achei token do Vercel CLI. Rode 'vercel login' antes.")
  process.exit(1)
}

async function api(method, path, body) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch {}
  return { status: res.status, ok: res.ok, body: json, raw: text }
}

// Acha o team id pelo slug
const teams = await api("GET", `/v2/teams?limit=20`)
const team = (teams.body?.teams ?? []).find((t) => t.slug === TEAM_SLUG)
if (!team) {
  console.error(`✗ Time '${TEAM_SLUG}' não encontrado. Times:`, teams.body?.teams?.map((t) => t.slug))
  process.exit(1)
}
const teamId = team.id

// Lista envs existentes pra decidir entre create/update
const listRes = await api("GET", `/v9/projects/${PROJECT}/env?teamId=${teamId}`)
if (!listRes.ok) {
  console.error("✗ Listar envs falhou:", listRes.status, listRes.raw.slice(0, 200))
  process.exit(1)
}
const existing = listRes.body?.envs ?? []

for (const k of KEYS) {
  const val = process.env[k]
  if (!val) {
    console.log(`  ↩ ${k}: ausente no .env.local, pulando`)
    continue
  }

  const found = existing.find((e) => e.key === k)
  if (found) {
    // upsert: deleta + cria (mais simples que PATCH)
    process.stdout.write(`  ⟳ ${k}: atualizando...`)
    await api("DELETE", `/v9/projects/${PROJECT}/env/${found.id}?teamId=${teamId}`)
  } else {
    process.stdout.write(`  + ${k}: criando...`)
  }

  const r = await api("POST", `/v10/projects/${PROJECT}/env?teamId=${teamId}&upsert=true`, {
    key: k,
    value: val,
    type: k.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted",
    target: ["production", "preview"],
  })
  if (r.ok) {
    process.stdout.write(" ✓\n")
  } else {
    process.stdout.write(` ✗ (${r.status}) ${r.raw.slice(0, 200)}\n`)
  }
}

console.log("\n✓ Envs sincronizadas. Disparando redeploy...")

// Pega último deploy production e re-deploya
const deploys = await api(
  "GET",
  `/v6/deployments?projectId=${PROJECT}&teamId=${teamId}&limit=5&target=production`
)
const lastProd = deploys.body?.deployments?.[0]
if (!lastProd) {
  console.log("⚠ Nenhum deploy production encontrado. Faça um push pro main pra disparar build.")
  process.exit(0)
}

const redeploy = await api("POST", `/v13/deployments?teamId=${teamId}`, {
  name: PROJECT,
  deploymentId: lastProd.uid,
  target: "production",
  meta: { redeployed_by: "axon-script", redeployed_from: lastProd.uid },
})
if (redeploy.ok) {
  const newId = redeploy.body?.id || redeploy.body?.uid
  const url = redeploy.body?.url
  console.log(`✓ Redeploy disparado: id=${newId} url=https://${url}`)
} else {
  console.log("✗ Redeploy falhou:", redeploy.status, redeploy.raw.slice(0, 300))
}
