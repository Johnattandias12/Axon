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
