// Smoke test do sistema de email: dispara um sample de cada template
// e verifica se o email_logs foi populado.
// Uso: node scripts/test-emails.mjs <to-email>
import { config } from "dotenv"
config({ path: ".env.local" })

const to = process.argv[2] || "johnattan.dias@gmail.com"
console.log(`→ Disparando emails de teste para: ${to}\n`)

const { createClient } = await import("@supabase/supabase-js")
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const srk = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, srk, { auth: { persistSession: false } })

// 1) Dispara via Resend HTTP direto pra validar API key
const apiKey = process.env.RESEND_API_KEY
const from = process.env.RESEND_FROM_EMAIL || "AXON <onboarding@resend.dev>"
const replyTo = process.env.RESEND_REPLY_TO

const tests = [
  { type: "password_reset", subject: "Teste: redefina sua senha AXON" },
  { type: "magic_link", subject: "Teste: seu link de acesso AXON" },
  { type: "ticket_confirmation", subject: "Teste: ingresso confirmado" },
]

for (const t of tests) {
  process.stdout.write(`→ ${t.type}…`)
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: t.subject,
        text: `Smoke test do tipo ${t.type}.`,
        html: `<p>Smoke test do tipo <code>${t.type}</code>.</p>`,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.log(` ✗ ${errText.slice(0, 200)}`)
      await supabase.from("email_logs").insert({
        to_email: to,
        subject: t.subject,
        email_type: t.type,
        status: "failed",
        error: errText.slice(0, 1000),
      })
      continue
    }
    const json = await res.json()
    console.log(` ✓ id=${json.id}`)
    await supabase.from("email_logs").insert({
      to_email: to,
      subject: t.subject,
      email_type: t.type,
      status: "sent",
      provider_id: json.id,
    })
  } catch (e) {
    console.log(` ✗ ${e.message}`)
  }
}

// Verifica os últimos logs
const { data: recent } = await supabase
  .from("email_logs")
  .select("to_email, email_type, status, provider_id, error, created_at")
  .order("created_at", { ascending: false })
  .limit(5)
console.log("\n📋 Últimos 5 logs em email_logs:")
console.table(recent)
