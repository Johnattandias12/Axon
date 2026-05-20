#!/usr/bin/env node
/**
 * Test do forward de email do admin.
 *
 * Reproduz exatamente a lógica de src/lib/email/send.ts pra confirmar que
 * uma notificação destinada a admin@axon.com.br vai parar no inbox real
 * configurado em ADMIN_NOTIFICATIONS_EMAIL.
 *
 * Uso: node scripts/test-admin-email-forward.mjs
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "..", ".env.local")

if (!existsSync(envPath)) {
  console.error(`[test-admin-email] .env.local não encontrado em ${envPath}`)
  process.exit(1)
}

for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const line = rawLine.trim()
  if (!line || line.startsWith("#")) continue
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i)
  if (!m) continue
  let value = m[2]
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
  if (!process.env[m[1]]) process.env[m[1]] = value
}

function resolveRecipient(to) {
  const adminList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const forward = process.env.ADMIN_NOTIFICATIONS_EMAIL
  if (!forward) return to
  return adminList.includes(to.trim().toLowerCase()) ? forward : to
}

const apiKey = process.env.RESEND_API_KEY
const from = process.env.RESEND_FROM_EMAIL ?? "AXON <onboarding@resend.dev>"

if (!apiKey) {
  console.error("[test-admin-email] RESEND_API_KEY ausente em .env.local")
  process.exit(1)
}

const intendedTo = "admin@axon.com.br"
const finalTo = resolveRecipient(intendedTo)

console.log(`[test-admin-email] intended=${intendedTo}`)
console.log(`[test-admin-email] resolved=${finalTo}`)
if (intendedTo === finalTo) {
  console.warn("[test-admin-email] AVISO: destinatário não foi reescrito. Confira ADMIN_EMAILS e ADMIN_NOTIFICATIONS_EMAIL no .env.local.")
}

const subject = "[AXON · teste] forward de notificação admin"
const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 24px auto; padding: 32px; background: #fff; border: 1px solid #eee; border-radius: 12px;">
    <h1 style="margin:0 0 16px; font-size: 20px; color: #111;">Teste de forward · AXON</h1>
    <p style="margin: 0 0 12px; color: #444; line-height: 1.5;">
      Esse email foi disparado por <code>scripts/test-admin-email-forward.mjs</code>.
    </p>
    <p style="margin: 0 0 12px; color: #444; line-height: 1.5;">
      O destinatário <strong>original</strong> era <code>${intendedTo}</code> (conta admin do sistema).
      Como ADMIN_NOTIFICATIONS_EMAIL está setada, ele foi reescrito pra <code>${finalTo}</code>.
    </p>
    <p style="margin: 16px 0 0; color: #888; font-size: 12px;">
      Se você está lendo isso no endereço acima, o forward está funcionando.
    </p>
  </div>
`
const text = `Teste de forward AXON.\n\nDestinatário original: ${intendedTo}\nReescrito pra: ${finalTo}\n\nSe você recebeu, o forward está funcionando.`

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({ from, to: finalTo, subject, html, text }),
})

if (!res.ok) {
  const errBody = await res.text()
  console.error(`[test-admin-email] Resend respondeu ${res.status}:`, errBody)
  process.exit(1)
}

const body = await res.json()
console.log("[test-admin-email] OK. message_id:", body.id)
console.log(`[test-admin-email] Verifica caixa de entrada de ${finalTo}.`)
