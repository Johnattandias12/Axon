import {
  ticketConfirmationEmail,
  ticketTransferredEmail,
  refundProcessedEmail,
  loginNotificationEmail,
  passwordResetEmail,
  magicLinkEmail,
  scannerInviteEmail,
  crewInviteEmail,
  affiliateCommissionEmail,
} from "./templates"
import { createAdminClient } from "@/lib/supabase/admin"

type EmailType =
  | "ticket_confirmation"
  | "ticket_transfer"
  | "refund_processed"
  | "login_notification"
  | "password_reset"
  | "magic_link"
  | "signup_confirmation"
  | "scanner_invite"
  | "crew_invite"
  | "affiliate_commission"

interface SendEmailArgs {
  to: string
  subject: string
  html: string
  text: string
  type: EmailType
  userId?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Grava o envio na tabela email_logs via service_role.
 * Não lança — falha de log nunca derruba envio.
 */
async function logEmail(args: {
  to: string
  subject: string
  type: EmailType
  status: "sent" | "failed" | "disabled"
  error?: string | null
  providerId?: string | null
  userId?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    // email_logs vive na migration 013 — types ainda não regenerados.
    // Mesmo padrão de cast usado em src/lib/supabase/affiliates-admin.ts.
    const client = supabase as unknown as {
      from: (n: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
      }
    }
    await client.from("email_logs").insert({
      to_email: args.to,
      subject: args.subject,
      email_type: args.type,
      status: args.status,
      error: args.error ?? null,
      provider_id: args.providerId ?? null,
      user_id: args.userId ?? null,
      metadata: args.metadata ?? {},
    })
  } catch (e) {
    console.error("[email_logs] insert failed:", e)
  }
}

/**
 * Envia email via Resend. Sem RESEND_API_KEY → modo demo (apenas log + audit "disabled").
 * Nunca lança — sempre retorna { sent, error? }.
 */
async function sendEmail(args: SendEmailArgs): Promise<{ sent: boolean; error?: string }> {
  const { to, subject, html, text, type, userId, metadata } = args
  const apiKey = process.env["RESEND_API_KEY"]
  const from = process.env["RESEND_FROM_EMAIL"] ?? "AXON <onboarding@resend.dev>"
  const replyTo = process.env["RESEND_REPLY_TO"]

  if (!apiKey || apiKey.length === 0) {
    console.warn("[email] RESEND_API_KEY ausente — modo demo, email não enviado:", { to, subject })
    await logEmail({
      to,
      subject,
      type,
      status: "disabled",
      error: "RESEND_API_KEY_MISSING",
      userId: userId ?? null,
      metadata,
    })
    return { sent: false, error: "no_api_key" }
  }

  try {
    const payload: Record<string, unknown> = { from, to, subject, html, text }
    if (replyTo) payload["reply_to"] = replyTo

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[email] Resend error:", errText)
      await logEmail({
        to,
        subject,
        type,
        status: "failed",
        error: errText.slice(0, 1000),
        userId: userId ?? null,
        metadata,
      })
      return { sent: false, error: errText }
    }

    const result = (await res.json().catch(() => null)) as { id?: string } | null
    await logEmail({
      to,
      subject,
      type,
      status: "sent",
      providerId: result?.id ?? null,
      userId: userId ?? null,
      metadata,
    })
    return { sent: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[email] fetch error:", msg)
    await logEmail({
      to,
      subject,
      type,
      status: "failed",
      error: msg.slice(0, 1000),
      userId: userId ?? null,
      metadata,
    })
    return { sent: false, error: msg }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API pública — um sender por template, todos com type tipado e logging.
// ─────────────────────────────────────────────────────────────────────────────

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
  userId?: string | null
  orderId?: string
}

export async function sendTicketConfirmation(args: SendTicketConfirmationArgs) {
  const { subject, html, text } = ticketConfirmationEmail(args)
  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    type: "ticket_confirmation",
    userId: args.userId ?? null,
    metadata: { orderId: args.orderId, eventTitle: args.eventTitle },
  })
}

interface SendTicketTransferredArgs {
  to: string
  fromName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  acceptUrl: string
  userId?: string | null
}

export async function sendTicketTransferred(args: SendTicketTransferredArgs) {
  const { subject, html, text } = ticketTransferredEmail(args)
  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    type: "ticket_transfer",
    userId: args.userId ?? null,
    metadata: { eventTitle: args.eventTitle },
  })
}

interface SendRefundProcessedArgs {
  to: string
  buyerName: string
  eventTitle: string
  decision: "approved" | "rejected"
  amountCents: number
  reason?: string | null
  userId?: string | null
}

export async function sendRefundProcessed(args: SendRefundProcessedArgs) {
  const { subject, html, text } = refundProcessedEmail(args)
  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    type: "refund_processed",
    userId: args.userId ?? null,
    metadata: { eventTitle: args.eventTitle, decision: args.decision },
  })
}

interface SendLoginNotificationArgs {
  to: string
  userName: string
  ip: string
  userAgent: string
  location?: string
  userId?: string | null
}

export async function sendLoginNotification(args: SendLoginNotificationArgs) {
  const { subject, html, text } = loginNotificationEmail(args)
  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    type: "login_notification",
    userId: args.userId ?? null,
    metadata: { ip: args.ip },
  })
}

interface SendPasswordResetArgs {
  to: string
  userName: string
  resetUrl: string
  userId?: string | null
}

export async function sendPasswordReset(args: SendPasswordResetArgs) {
  const { subject, html, text } = passwordResetEmail(args)
  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    type: "password_reset",
    userId: args.userId ?? null,
  })
}

interface SendMagicLinkArgs {
  to: string
  userName: string
  magicUrl: string
  userId?: string | null
}

export async function sendMagicLink(args: SendMagicLinkArgs) {
  const { subject, html, text } = magicLinkEmail(args)
  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    type: "magic_link",
    userId: args.userId ?? null,
  })
}

interface SendScannerInviteArgs {
  to: string
  scannerName: string
  eventTitle: string
  eventDate: string
  scanUrl: string
  userId?: string | null
}

export async function sendScannerInvite(args: SendScannerInviteArgs) {
  const { subject, html, text } = scannerInviteEmail(args)
  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    type: "scanner_invite",
    userId: args.userId ?? null,
    metadata: { eventTitle: args.eventTitle, scannerName: args.scannerName },
  })
}

interface SendCrewInviteArgs {
  to: string
  inviterName: string
  crewName: string
  eventTitle: string
  eventDate: string
  joinUrl: string
  userId?: string | null
}

export async function sendCrewInvite(args: SendCrewInviteArgs) {
  const { subject, html, text } = crewInviteEmail(args)
  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    type: "crew_invite",
    userId: args.userId ?? null,
    metadata: { eventTitle: args.eventTitle, crewName: args.crewName },
  })
}

interface SendAffiliateCommissionArgs {
  to: string
  affiliateName: string
  eventTitle: string
  amountCents: number
  commissionRatePct: number
  balanceCents: number
  userId?: string | null
}

export async function sendAffiliateCommission(args: SendAffiliateCommissionArgs) {
  const { subject, html, text } = affiliateCommissionEmail(args)
  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    type: "affiliate_commission",
    userId: args.userId ?? null,
    metadata: {
      eventTitle: args.eventTitle,
      amountCents: args.amountCents,
      ratePct: args.commissionRatePct,
    },
  })
}
