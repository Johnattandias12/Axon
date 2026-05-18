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
 * Email de confirmação de compra com identidade AXON.
 * HTML inline-styled para máxima compatibilidade entre clientes.
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

  const ink = "#0a0a0b"
  const paper = "#fafaf7"
  const paperPure = "#ffffff"
  const pulse = "#c8ff00"
  const pulseSoft = "#ecffa8"
  const mute = "#6b6b70"
  const rule = "#e5e5e0"

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${paper};font-family:-apple-system,BlinkMacSystemFont,'Geist','Inter',sans-serif;color:${ink};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${paper};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:${paperPure};border:1px solid ${rule};border-radius:24px;overflow:hidden;">

          <!-- Top dark band with logo -->
          <tr>
            <td style="background-color:${ink};padding:20px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                            <path d="M50 6 L94 94 L6 94 Z" fill="none" stroke="${paper}" stroke-width="10" />
                          </svg>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:18px;font-weight:900;letter-spacing:-0.045em;color:${paper};">AXON</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${pulse};">
                      Compra confirmada
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pulse line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,transparent 0%,${pulse} 50%,transparent 100%);line-height:3px;">&nbsp;</td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:36px 28px 24px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${mute};">
                Olá, ${escapeHtml(buyerName)}
              </p>
              <h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;letter-spacing:-0.03em;font-weight:800;color:${ink};">
                Você está dentro!
              </h1>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:${mute};">
                Seu pedido foi confirmado. ${ticketCount} ${
                  ticketCount === 1 ? "ingresso" : "ingressos"
                } para
                <strong style="color:${ink};">${escapeHtml(eventTitle)}</strong>.
              </p>
            </td>
          </tr>

          <!-- Event card -->
          <tr>
            <td style="padding:0 28px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${paper};border-radius:16px;border:1px solid ${rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${mute};">Evento</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${ink};letter-spacing:-0.01em;">
                      ${escapeHtml(eventTitle)}
                    </p>
                    <p style="margin:6px 0 0;font-size:13px;color:${mute};">
                      ${escapeHtml(eventDate)}
                    </p>
                    <p style="margin:2px 0 0;font-size:13px;color:${mute};">
                      ${escapeHtml(eventLocation)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:16px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${orderUrl}" style="display:inline-block;padding:14px 32px;background-color:${pulse};color:${ink};text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                      Ver meu ingresso →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR codes (text fallback) -->
          ${
            qrPayloads.length > 0
              ? `
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${mute};">
                Códigos dos ingressos
              </p>
              ${qrPayloads
                .map(
                  (q, i) => `
              <div style="margin:6px 0;padding:10px 12px;background-color:${pulseSoft};border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:${ink};word-break:break-all;">
                <strong style="color:${mute};margin-right:6px;">#${i + 1}</strong>
                ${escapeHtml(q)}
              </div>`
                )
                .join("")}
              <p style="margin:8px 0 0;font-size:11px;color:${mute};line-height:1.5;">
                Os QR Codes completos estão disponíveis em "Ver meu ingresso".
              </p>
            </td>
          </tr>`
              : ""
          }

          <!-- Total -->
          <tr>
            <td style="padding:16px 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${rule};">
                <tr>
                  <td style="padding-top:14px;font-size:13px;color:${mute};">Total pago</td>
                  <td align="right" style="padding-top:14px;font-size:15px;font-weight:700;color:${ink};font-family:'JetBrains Mono',monospace;">
                    ${centsToBRL(totalCents)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${paper};padding:20px 28px;border-top:1px solid ${rule};">
              <p style="margin:0;font-size:11px;color:${mute};line-height:1.6;">
                AXON · Ingressos online ·
                <a href="mailto:suporte@axon.com.br" style="color:${ink};text-decoration:none;">suporte@axon.com.br</a>
              </p>
              <p style="margin:6px 0 0;font-size:10px;color:${mute};">
                Você recebeu este e-mail por ter realizado uma compra na AXON.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `Olá, ${buyerName}!

Você está dentro! Seu pedido foi confirmado.

${ticketCount} ${ticketCount === 1 ? "ingresso" : "ingressos"} para ${eventTitle}
${eventDate}
${eventLocation}

Total pago: ${centsToBRL(totalCents)}

Veja seu ingresso: ${orderUrl}

—
AXON · suporte@axon.com.br`

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Tokens visuais compartilhados entre todos os templates AXON.
 */
const TOKENS = {
  ink: "#0a0a0b",
  paper: "#fafaf7",
  paperPure: "#ffffff",
  pulse: "#c8ff00",
  pulseDeep: "#9ccf00",
  pulseSoft: "#ecffa8",
  mute: "#6b6b70",
  rule: "#e5e5e0",
  success: "#16a34a",
  warning: "#e89400",
  danger: "#dc2626",
} as const

/**
 * Shell HTML compartilhado: header dark com logo, pulse line, footer.
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
<body style="margin:0;padding:0;background-color:${t.paper};font-family:-apple-system,BlinkMacSystemFont,'Geist','Inter',sans-serif;color:${t.ink};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.paper};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:${t.paperPure};border:1px solid ${t.rule};border-radius:24px;overflow:hidden;">
          <tr>
            <td style="background-color:${t.ink};padding:20px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                            <path d="M50 6 L94 94 L6 94 Z" fill="none" stroke="${t.paper}" stroke-width="10" />
                          </svg>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:18px;font-weight:900;letter-spacing:-0.045em;color:${t.paper};">AXON</span>
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
            <td style="background-color:${t.paper};padding:20px 28px;border-top:1px solid ${t.rule};">
              <p style="margin:0;font-size:11px;color:${t.mute};line-height:1.6;">
                AXON · Ingressos online · <a href="mailto:suporte@axon.com.br" style="color:${t.ink};text-decoration:none;">suporte@axon.com.br</a>
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
 * Email pra quem recebe um ingresso transferido por outra pessoa.
 * Inclui link único de aceite (transfer token).
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
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.mute};">Ingresso a caminho</p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.ink};">
                ${escapeHtml(fromName)} te passou um ingresso.
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.mute};">
                É só aceitar a transferência para o ingresso virar seu de fato. Após aceitar, ele fica em Minha Conta · Ingressos no seu login.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.paper};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.mute};">Evento</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${t.ink};letter-spacing:-0.01em;">${escapeHtml(eventTitle)}</p>
                    <p style="margin:6px 0 0;font-size:13px;color:${t.mute};">${escapeHtml(eventDate)}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:${t.mute};">${escapeHtml(eventLocation)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;" align="center">
              <a href="${acceptUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:${t.ink};text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Aceitar ingresso
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:${t.mute};">
                Link válido por 48 horas. Se não foi você, ignore este e-mail.
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Transferência", children: body }),
    text: `${fromName} transferiu um ingresso pra você.

Evento: ${eventTitle}
${eventDate}
${eventLocation}

Aceitar: ${acceptUrl}

— AXON`,
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
  const subject = approved
    ? `Reembolso aprovado para ${eventTitle}`
    : `Reembolso recusado para ${eventTitle}`
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
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.ink};">
                ${headline}
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.mute};">
                Olá, ${escapeHtml(buyerName)}. ${explainer}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.paper};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.mute};">Evento</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${t.ink};letter-spacing:-0.01em;">${escapeHtml(eventTitle)}</p>
                    ${
                      reason
                        ? `<p style="margin:10px 0 0;font-size:12px;color:${t.mute};line-height:1.5;"><strong style="color:${t.ink};">Motivo:</strong> ${escapeHtml(reason)}</p>`
                        : ""
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0;font-size:12px;color:${t.mute};line-height:1.6;">
                Dúvidas? Responda este e-mail ou escreva para
                <a href="mailto:suporte@axon.com.br" style="color:${t.ink};text-decoration:none;">suporte@axon.com.br</a>.
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: approved ? "Reembolso" : "Reembolso", children: body }),
    text: `${headline}

Olá, ${buyerName}.
${explainer}

Evento: ${eventTitle}
${reason ? `Motivo: ${reason}` : ""}

— AXON`,
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
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.mute};">
                Segurança
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.ink};">
                Novo login detectado
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.mute};">
                Olá, ${escapeHtml(userName)}.<br><br>
                Registramos um novo acesso à sua conta na AXON. Se foi você, pode ignorar este e-mail.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.paper};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.mute};">Detalhes do Acesso</p>
                    <p style="margin:6px 0 0;font-size:13px;color:${t.mute};"><strong style="color:${t.ink};">Data:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
                    <p style="margin:6px 0 0;font-size:13px;color:${t.mute};"><strong style="color:${t.ink};">IP:</strong> ${escapeHtml(ip)}</p>
                    ${location ? `<p style="margin:6px 0 0;font-size:13px;color:${t.mute};"><strong style="color:${t.ink};">Local aproximado:</strong> ${escapeHtml(location)}</p>` : ""}
                    <p style="margin:6px 0 0;font-size:13px;color:${t.mute};"><strong style="color:${t.ink};">Dispositivo:</strong> ${escapeHtml(userAgent)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:12px;color:${t.mute};line-height:1.5;">
                Se não reconhece este acesso, recomendamos que <a href="https://axon.com.br/redefinir-senha" style="color:${t.danger};font-weight:bold;text-decoration:none;">redefina sua senha imediatamente</a>.
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Alerta de Login", children: body }),
    text: `Novo login detectado

Olá, ${userName}.

Registramos um novo acesso à sua conta na AXON.

Data: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
IP: ${ip}
${location ? `Local aproximado: ${location}` : ""}
Dispositivo: ${userAgent}

Se não foi você, redefina sua senha imediatamente.

— AXON`,
  }
}
