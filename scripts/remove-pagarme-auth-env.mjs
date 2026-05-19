// Remove PAGARME_WEBHOOK_USER / PAGARME_WEBHOOK_PASSWORD do Vercel
// (Pagar.me v5 não envia Basic Auth — atrapalha mais que ajuda).
import { readFileSync, existsSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"

const PROJECT = "axon"
const TEAM_SLUG = "johnattandias12s-projects"
const KEYS_TO_REMOVE = ["PAGARME_WEBHOOK_USER", "PAGARME_WEBHOOK_PASSWORD"]

function readToken() {
  const cands = [
    path.join(homedir(), "AppData/Roaming/com.vercel.cli/Data/auth.json"),
    path.join(homedir(), ".local/share/com.vercel.cli/auth.json"),
  ]
  for (const p of cands) {
    if (existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, "utf8")).token
      } catch {}
    }
  }
  return null
}

const token = readToken()
if (!token) {
  console.error("Sem token Vercel.")
  process.exit(1)
}

async function api(method, p, body) {
  const r = await fetch(`https://api.vercel.com${p}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text()
  let j = null
  try { j = t ? JSON.parse(t) : null } catch {}
  return { ok: r.ok, status: r.status, body: j, raw: t }
}

const teams = await api("GET", `/v2/teams?limit=20`)
const team = (teams.body?.teams ?? []).find((t) => t.slug === TEAM_SLUG)
const teamId = team?.id
if (!teamId) {
  console.error("Time não encontrado")
  process.exit(1)
}

const envs = await api("GET", `/v9/projects/${PROJECT}/env?teamId=${teamId}`)
for (const k of KEYS_TO_REMOVE) {
  const found = (envs.body?.envs ?? []).find((e) => e.key === k)
  if (!found) {
    console.log(`  ↩ ${k}: não existia`)
    continue
  }
  process.stdout.write(`  − ${k}: removendo...`)
  const r = await api("DELETE", `/v9/projects/${PROJECT}/env/${found.id}?teamId=${teamId}`)
  process.stdout.write(r.ok ? " ✓\n" : ` ✗ ${r.status}\n`)
}

console.log("\n✓ Disparando redeploy...")
const deploys = await api(
  "GET",
  `/v6/deployments?projectId=${PROJECT}&teamId=${teamId}&limit=1&target=production`
)
const last = deploys.body?.deployments?.[0]
if (last) {
  const rd = await api("POST", `/v13/deployments?teamId=${teamId}`, {
    name: PROJECT,
    deploymentId: last.uid,
    target: "production",
    meta: { redeployed_by: "remove-auth-script" },
  })
  if (rd.ok) console.log(`✓ Redeploy: ${rd.body?.url ? "https://" + rd.body.url : rd.body?.id}`)
  else console.log("✗ Redeploy falhou:", rd.status, rd.raw.slice(0, 200))
}
