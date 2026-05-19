// Smoke test das APIs externas — valida que as chaves funcionam.
import "dotenv/config"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const PAGARME_API_KEY = process.env.PAGARME_API_KEY
const PAGARME_RECIPIENT_AXON = process.env.PAGARME_RECIPIENT_AXON

console.log("🔍 Smoke test das integrações\n")

// ─── Resend ───────────────────────────────────────────
console.log("1. Resend API")
try {
  const r = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  })
  const data = await r.json()
  if (r.ok) {
    const domains = data.data ?? []
    console.log(`   ✓ Auth OK · ${domains.length} domínio(s) cadastrado(s)`)
    for (const d of domains) {
      console.log(`     · ${d.name} (${d.status}, region=${d.region})`)
    }
    if (domains.length === 0) {
      console.log("     ⚠ Nenhum domínio verificado. Use 'onboarding@resend.dev' como From.")
    }
  } else {
    console.log(`   ✗ Falhou: ${r.status} ${JSON.stringify(data).slice(0, 200)}`)
  }
} catch (e) {
  console.log("   ✗ erro de rede:", e.message)
}

// ─── Pagar.me ─────────────────────────────────────────
console.log("\n2. Pagar.me API")
try {
  const auth = "Basic " + Buffer.from(`${PAGARME_API_KEY}:`).toString("base64")
  const r = await fetch("https://api.pagar.me/core/v5/recipients/me", {
    headers: { Authorization: auth, Accept: "application/json" },
  })
  if (r.ok) {
    const data = await r.json()
    console.log(`   ✓ Auth OK · recipient_id=${data.id}`)
    console.log(`     name=${data.name}  status=${data.status}  document=${data.document}`)
  } else {
    const text = await r.text()
    console.log(`   ✗ /recipients/me falhou: ${r.status}`)
    console.log(`     ${text.slice(0, 200)}`)
    // Tenta listar orders pra confirmar que a key funciona
    const r2 = await fetch("https://api.pagar.me/core/v5/orders?size=1", {
      headers: { Authorization: auth, Accept: "application/json" },
    })
    if (r2.ok) {
      console.log("   ✓ /orders OK (key autenticada mesmo assim)")
    } else {
      console.log(`   ✗ /orders também falhou: ${r2.status}`)
    }
  }
} catch (e) {
  console.log("   ✗ erro de rede:", e.message)
}

// ─── Cloudflare API token ─────────────────────────────
console.log("\n3. Cloudflare API token (verify)")
try {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/tokens/verify`,
    { headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` } }
  )
  const data = await r.json()
  if (data.success) {
    console.log(`   ✓ Token válido · id=${data.result?.id}`)
  } else {
    console.log(`   ✗ Token inválido:`, data.errors?.map((e) => e.message).join(", "))
  }
} catch (e) {
  console.log("   ✗ erro de rede:", e.message)
}

console.log("\n📋 Lembre: configure no painel Pagar.me:")
console.log("   Webhook URL: https://axonia.vercel.app/api/webhooks/pagarme")
console.log("   Eventos: order.paid, order.payment_failed, order.canceled, order.expired,")
console.log("            charge.refunded, charge.chargedback")
console.log("   HMAC secret: gere lá e cole em PAGARME_WEBHOOK_SECRET (.env.local + Vercel)")
