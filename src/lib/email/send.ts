import { ticketConfirmationEmail } from "./templates"

/**
 * Envia email via Resend se RESEND_API_KEY estiver configurado.
 * Em modo demo (sem key), apenas faz log no console — nunca lança.
 */
async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env["RESEND_API_KEY"]
  const from = process.env["RESEND_FROM_EMAIL"] ?? "AXON <noreply@axon.com.br>"

  if (!apiKey || apiKey.length === 0) {
    console.warn("[email] RESEND_API_KEY ausente — modo demo, email não enviado:", { to, subject })
    return { sent: false, error: "no_api_key" }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[email] Resend error:", err)
      return { sent: false, error: err }
    }
    return { sent: true }
  } catch (err) {
    console.error("[email] fetch error:", err)
    return { sent: false, error: String(err) }
  }
}

interface SendTicketConfirmationArgs {
  to: string
  buyerName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  ticketCount: number
  totalCents: number
  orderUrl: string
  qrPayloads: string[]
}

export async function sendTicketConfirmation(args: SendTicketConfirmationArgs) {
  const { subject, html, text } = ticketConfirmationEmail(args)
  return sendEmail({ to: args.to, subject, html, text })
}
