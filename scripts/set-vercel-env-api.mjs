// Adiciona env vars via Vercel REST API.
import fs from "node:fs/promises"

const AUTH_PATH = `${process.env.APPDATA ?? `${process.env.HOME}/.local/share`}/com.vercel.cli/Data/auth.json`
const auth = JSON.parse(await fs.readFile(AUTH_PATH, "utf8"))
const TOKEN = auth.token

const project = JSON.parse(await fs.readFile(".vercel/project.json", "utf8"))
const PROJECT_ID = project.projectId
const TEAM_ID = project.orgId

const API = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&upsert=true`

const VARS = {
  NEXT_PUBLIC_SUPABASE_URL: "https://qirogiafdyyvsuxspepq.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcm9naWFmZHl5dnN1eHNwZXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MjY5NzYsImV4cCI6MjA5NDMwMjk3Nn0.S4wQJANJKGxULfkPAVzg9PESs-SijM_6y6iPnCsGJAE",
  SUPABASE_SERVICE_ROLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcm9naWFmZHl5dnN1eHNwZXBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcyNjk3NiwiZXhwIjoyMDk0MzAyOTc2fQ.cjMNl-MV8x39U3KlXZhLU9NIUaST7LOIKh8oJ7YDSOc",
  NEXT_PUBLIC_APP_URL: "https://axonia.vercel.app",
  QR_HMAC_SECRET: "2c6f3a8e9d1b4f5c7a8e9d0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
}

// Listar pra deletar primeiro
const listRes = await fetch(
  `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
  { headers }
)
const list = await listRes.json()
const existing = list.envs ?? []

for (const key of Object.keys(VARS)) {
  const toDelete = existing.filter((e) => e.key === key)
  for (const env of toDelete) {
    process.stdout.write(`  ✗ del ${env.key} [${env.target?.join(",") ?? "?"}]…`)
    const r = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${env.id}?teamId=${TEAM_ID}`,
      { method: "DELETE", headers }
    )
    process.stdout.write(r.ok ? " ✓\n" : ` ✗ (${r.status})\n`)
  }
}

for (const [key, value] of Object.entries(VARS)) {
  process.stdout.write(`  + add ${key}…`)
  const r = await fetch(API, {
    method: "POST",
    headers,
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: ["production", "preview", "development"],
    }),
  })
  const data = await r.json()
  if (r.ok) {
    process.stdout.write(" ✓\n")
  } else {
    process.stdout.write(` ✗ (${r.status}): ${JSON.stringify(data).slice(0, 200)}\n`)
  }
}

console.log("\n✓ env vars sincronizadas")
