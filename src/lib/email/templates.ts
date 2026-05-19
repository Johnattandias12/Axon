import { centsToBRL } from "@/lib/utils"

interface TicketConfirmationEmailProps {
  buyerName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  ticketCount: number
  totalCents: number
  orderUrl: string
  qrPayloads: string[]
}

/**
 * Tokens visuais compartilhados entre todos os templates AXON (Dark Mode)
 */
const TOKENS = {
  text: "#FFFFFF",        // Texto principal
  textMute: "#8C8C91",    // Texto secundário
  bgBase: "#08080A",      // Fundo fora do e-mail
  bgCard: "#121214",      // Fundo do card principal
  bgDarker: "#050506",    // Fundo de destaque (Header)
  pulse: "#C8FF00",       // Cor principal
  pulseSoft: "rgba(200, 255, 0, 0.08)", // Fundo sutil do Pulse
  rule: "#2A2A30",        // Bordas
  success: "#16A34A",
  danger: "#DC2626",
} as const

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Shell HTML compartilhado: header dark com logo em Pulse, pulse line, footer.
 * Retorna o HTML completo dado um conteúdo central (children).
 */
function emailShell({
  subject,
  eyebrow,
  children,
}: {
  subject: string
  eyebrow: string
  children: string
}): string {
  const t = TOKENS
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${t.bgBase};font-family:-apple-system,BlinkMacSystemFont,'Geist','Inter',sans-serif;color:${t.text};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.bgBase};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:${t.bgCard};border:1px solid ${t.rule};border-radius:24px;overflow:hidden;">
          <tr>
            <td style="background-color:${t.bgDarker};padding:20px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                            <path d="M50 6 L94 94 L6 94 Z" fill="none" stroke="${t.pulse}" stroke-width="12" />
                          </svg>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:18px;font-weight:900;letter-spacing:-0.045em;color:${t.text};">AXON</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.pulse};">
                      ${eyebrow}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,transparent 0%,${t.pulse} 50%,transparent 100%);line-height:3px;">&nbsp;</td>
          </tr>
          ${children}
          <tr>
            <td style="background-color:${t.bgBase};padding:24px 28px;border-top:1px solid ${t.rule};text-align:center;">
              <p style="margin:0;font-size:11px;color:${t.textMute};line-height:1.6;">
                AXON · Ingressos online<br>
                <a href="mailto:suporte@axon.com.br" style="color:${t.text};text-decoration:none;">suporte@axon.com.br</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Email de confirmação de compra com identidade AXON.
 */
export function ticketConfirmationEmail({
  buyerName,
  eventTitle,
  eventDate,
  eventLocation,
  ticketCount,
  totalCents,
  orderUrl,
  qrPayloads,
}: TicketConfirmationEmailProps): { subject: string; html: string; text: string } {
  const subject = `Seu ingresso para ${eventTitle} está garantido`
  const t = TOKENS

  const body = `
          <tr>
            <td style="padding:36px 28px 24px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.textMute};">
                Olá, ${escapeHtml(buyerName)}
              </p>
              <h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Você está dentro!
              </h1>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Seu pedido foi confirmado. Você garantiu ${ticketCount} ${
                  ticketCount === 1 ? "ingresso" : "ingressos"
                } para <strong style="color:${t.pulse};">${escapeHtml(eventTitle)}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.bgDarker};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">Evento</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${t.text};letter-spacing:-0.01em;">
                      ${escapeHtml(eventTitle)}
                    </p>
                    <p style="margin:6px 0 0;font-size:13px;color:${t.textMute};">
                      ${escapeHtml(eventDate)}
                    </p>
                    <p style="margin:2px 0 0;font-size:13px;color:${t.textMute};">
                      ${escapeHtml(eventLocation)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${orderUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                      Ver meu ingresso →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            qrPayloads.length > 0
              ? `
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">
                Códigos de Acesso (Offline)
              </p>
              ${qrPayloads
                .map(
                  (q, i) => `
              <div style="margin:6px 0;padding:10px 12px;background-color:${t.pulseSoft};border:1px solid rgba(200, 255, 0, 0.1);border-radius:8px;font-family:'Courier New',Courier,monospace;font-size:11px;color:${t.pulse};word-break:break-all;">
                <strong style="color:${t.textMute};margin-right:6px;">#${i + 1}</strong>
                ${escapeHtml(q)}
              </div>`
                )
                .join("")}
            </td>
          </tr>`
              : ""
          }

          <tr>
            <td style="padding:16px 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${t.rule};">
                <tr>
                  <td style="padding-top:14px;font-size:13px;color:${t.textMute};">Total pago via plataforma AXON</td>
                  <td align="right" style="padding-top:14px;font-size:15px;font-weight:700;color:${t.text};font-family:'Courier New',monospace;">
                    ${centsToBRL(totalCents)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`

  const text = `Olá, ${buyerName}!

Você está dentro! Seu pedido foi confirmado.

${ticketCount} ${ticketCount === 1 ? "ingresso" : "ingressos"} para ${eventTitle}
${eventDate}
${eventLocation}

Total pago: ${centsToBRL(totalCents)}

Veja seu ingresso: ${orderUrl}

—
AXON · suporte@axon.com.br`

  return { subject, html: emailShell({ subject, eyebrow: "Compra Confirmada", children: body }), text }
}

/**
 * Email pra quem recebe um ingresso transferido por outra pessoa.
 */
export function ticketTransferredEmail({
  fromName,
  eventTitle,
  eventDate,
  eventLocation,
  acceptUrl,
}: {
  fromName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  acceptUrl: string
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = `${fromName} te transferiu um ingresso para ${eventTitle}`
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.textMute};">Ingresso a caminho</p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                ${escapeHtml(fromName)} te passou um ingresso.
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                É só aceitar a transferência para o ingresso virar seu de fato. Após aceitar, ele fica salvo na sua conta AXON.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.bgDarker};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">Evento</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${t.text};letter-spacing:-0.01em;">${escapeHtml(eventTitle)}</p>
                    <p style="margin:6px 0 0;font-size:13px;color:${t.textMute};">${escapeHtml(eventDate)}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:${t.textMute};">${escapeHtml(eventLocation)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;" align="center">
              <a href="${acceptUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Aceitar Ingresso Agora
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:${t.textMute};">
                Link válido por 48 horas. Se não foi você, ignore este e-mail.
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Transferência", children: body }),
    text: `${fromName} transferiu um ingresso pra você.\n\nEvento: ${eventTitle}\n${eventDate}\n${eventLocation}\n\nAceitar: ${acceptUrl}\n\n— AXON`,
  }
}

/**
 * Email de status de reembolso (aprovado ou recusado).
 */
export function refundProcessedEmail({
  buyerName,
  eventTitle,
  decision,
  amountCents,
  reason,
}: {
  buyerName: string
  eventTitle: string
  decision: "approved" | "rejected"
  amountCents: number
  reason?: string | null
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const approved = decision === "approved"
  const subject = approved ? `Reembolso aprovado para ${eventTitle}` : `Reembolso recusado para ${eventTitle}`
  const accent = approved ? t.success : t.danger
  const headline = approved ? "Reembolso aprovado." : "Reembolso recusado."
  const explainer = approved
    ? `O valor de ${centsToBRL(amountCents)} será creditado em até 5 dias úteis no mesmo meio de pagamento usado na compra.`
    : "Seu pedido de reembolso não foi aprovado. Entre em contato com o organizador se quiser mais detalhes."

  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${accent};">
                ${approved ? "Aprovado" : "Recusado"}
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                ${headline}
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Olá, ${escapeHtml(buyerName)}. ${explainer}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.bgDarker};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">Evento</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${t.text};letter-spacing:-0.01em;">${escapeHtml(eventTitle)}</p>
                    ${
                      reason
                        ? `<p style="margin:10px 0 0;font-size:12px;color:${t.textMute};line-height:1.5;"><strong style="color:${t.text};">Motivo:</strong> ${escapeHtml(reason)}</p>`
                        : ""
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Reembolso", children: body }),
    text: `${headline}\n\nOlá, ${buyerName}.\n${explainer}\n\nEvento: ${eventTitle}\n${reason ? `Motivo: ${reason}` : ""}\n\n— AXON`,
  }
}

/**
 * Email de notificação de login
 */
export function loginNotificationEmail({
  userName,
  ip,
  userAgent,
  location,
}: {
  userName: string
  ip: string
  userAgent: string
  location?: string
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = "Novo login na sua conta AXON"
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.textMute};">
                Segurança
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Novo login detectado
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Olá, ${escapeHtml(userName)}.<br><br>
                Registramos um novo acesso à sua conta na AXON. Se foi você, pode ignorar este e-mail.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.bgDarker};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">Detalhes do Acesso</p>
                    <p style="margin:6px 0 0;font-size:13px;color:${t.textMute};"><strong style="color:${t.text};">Data:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
                    <p style="margin:6px 0 0;font-size:13px;color:${t.textMute};"><strong style="color:${t.text};">IP:</strong> ${escapeHtml(ip)}</p>
                    ${location ? `<p style="margin:6px 0 0;font-size:13px;color:${t.textMute};"><strong style="color:${t.text};">Local:</strong> ${escapeHtml(location)}</p>` : ""}
                    <p style="margin:6px 0 0;font-size:13px;color:${t.textMute};"><strong style="color:${t.text};">Aparelho:</strong> ${escapeHtml(userAgent)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:12px;color:${t.textMute};line-height:1.5;">
                Se não reconhece este acesso, recomendamos que <a href="https://axon.com.br/redefinir-senha" style="color:${t.danger};font-weight:bold;text-decoration:none;">redefina sua senha imediatamente</a>.
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Alerta de Login", children: body }),
    text: `Novo login detectado\n\nOlá, ${userName}.\n\nData: ${new Date().toLocaleString("pt-BR")}\nIP: ${ip}\nAparelho: ${userAgent}\n\nSe não foi você, redefina sua senha.\n\n— AXON`,
  }
}
