// Setup de domínio no Resend para envio em produção.
//
// Por que: a chave grátis do Resend, sem domínio verificado, SÓ envia emails
// pra conta dona da API key. Isso quebra qualquer operação real (confirmação
// de ingresso, magic link, etc) porque o destinatário não chega.
//
// O que faz:
//   1. Lê RESEND_API_KEY e RESEND_DOMAIN do .env.local
//   2. Lista domínios existentes; se RESEND_DOMAIN não estiver lá, cria
//   3. Imprime os DNS records (SPF, DKIM, DMARC) que precisam ser adicionados
//      ao seu provedor DNS (Cloudflare, Registro.br, etc)
//   4. Dispara verify (Resend tenta resolver DNS e marca o domínio como verified)
//   5. Sugere atualizar RESEND_FROM_EMAIL pro novo domínio
//
// Uso:
//   1. Gere chave válida em https://resend.com/api-keys (cole em .env.local)
//   2. Defina RESEND_DOMAIN no .env.local (ex: "axon.com.br" ou "mail.axon.com.br")
//   3. node scripts/setup-resend-domain.mjs
//   4. Adicione os DNS records mostrados no seu provedor DNS
//   5. Espere 5-30min e rode novamente — vai marcar como "verified"
//   6. Atualize RESEND_FROM_EMAIL no .env.local e Vercel pro novo domínio
//
// Docs: https://resend.com/docs/dashboard/domains/introduction

import { config } from "dotenv"
config({ path: ".env.local" })

const apiKey = process.env.RESEND_API_KEY
const domain = process.env.RESEND_DOMAIN

if (!apiKey || !apiKey.startsWith("re_")) {
  console.error("✗ RESEND_API_KEY ausente ou inválida em .env.local")
  console.error("  Gere uma chave em https://resend.com/api-keys")
  process.exit(1)
}

if (!domain) {
  console.error("✗ RESEND_DOMAIN não definido em .env.local")
  console.error('  Adicione uma linha como:  RESEND_DOMAIN="axon.com.br"')
  process.exit(1)
}

const BASE = "https://api.resend.com"

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {}
  return { status: res.status, ok: res.ok, body: json, raw: text }
}

console.log(`→ Setup do domínio "${domain}" no Resend`)

// 1. Lista domínios
const list = await api("GET", "/domains")
if (!list.ok) {
  console.error("✗ Não foi possível listar domínios:", list.status, list.raw.slice(0, 200))
  process.exit(1)
}

const items = list.body?.data ?? []
let existing = items.find((d) => d.name === domain)

// 2. Cria se não existir
if (!existing) {
  console.log(`→ Criando "${domain}"...`)
  const create = await api("POST", "/domains", { name: domain })
  if (!create.ok) {
    console.error("✗ Falha ao criar:", create.status, create.raw.slice(0, 300))
    process.exit(1)
  }
  existing = create.body
  console.log(`✓ Criado. ID: ${existing.id}`)
} else {
  console.log(`✓ Domínio já existe. ID: ${existing.id} | status: ${existing.status}`)
}

// 3. Pega os records detalhados
const detail = await api("GET", `/domains/${existing.id}`)
if (!detail.ok) {
  console.error("✗ Falha ao detalhar:", detail.status, detail.raw.slice(0, 200))
  process.exit(1)
}

const records = detail.body?.records ?? []
console.log("\n=== DNS RECORDS A ADICIONAR ===\n")
console.log("Tipo    Host                         Valor")
console.log("─".repeat(80))
for (const r of records) {
  const host = (r.name || "@").padEnd(28).slice(0, 28)
  const value = (r.value || r.content || "").slice(0, 80)
  console.log(`${(r.type || "").padEnd(7)} ${host} ${value}`)
}
console.log()
console.log("Status de cada record:")
for (const r of records) {
  console.log(`  ${r.type} ${r.name || "@"}: ${r.status || "(sem status)"}`)
}

// 4. Dispara verify
console.log("\n→ Disparando verificação no Resend...")
const verify = await api("POST", `/domains/${existing.id}/verify`)
if (verify.ok) {
  console.log(`✓ Verify disparado. Status atual: ${verify.body?.status || "?"}`)
  if (verify.body?.status !== "verified") {
    console.log("  Resend está olhando o DNS — pode levar 5-30min depois que você")
    console.log("  adicionar os records acima. Rode esse script de novo pra rechecar.")
  }
} else {
  console.log("⚠ Verify retornou:", verify.status, verify.raw.slice(0, 200))
}

// 5. Sugestão de FROM
const fromSuggest = `AXON <noreply@${domain}>`
console.log(`\n💡 Quando o domínio estiver "verified", atualize:`)
console.log(`   .env.local:  RESEND_FROM_EMAIL="${fromSuggest}"`)
console.log(`   Vercel:      vercel env add RESEND_FROM_EMAIL (cole o mesmo valor)`)
console.log(`   Depois:      redeploy pra produção.`)
