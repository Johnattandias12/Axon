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
  text: "#FFFFFF", // Texto principal
  textMute: "#8C8C91", // Texto secundário
  bgBase: "#08080A", // Fundo fora do e-mail
  bgCard: "#121214", // Fundo do card principal
  bgDarker: "#050506", // Fundo de destaque (Header)
  pulse: "#C8FF00", // Cor principal
  pulseSoft: "rgba(200, 255, 0, 0.08)", // Fundo sutil do Pulse
  rule: "#2A2A30", // Bordas
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

  return {
    subject,
    html: emailShell({ subject, eyebrow: "Compra Confirmada", children: body }),
    text,
  }
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

/**
 * Email de redefinição de senha. Link gerado server-side via Supabase Admin.generateLink.
 */
export function passwordResetEmail({
  userName,
  resetUrl,
}: {
  userName: string
  resetUrl: string
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = "Redefina sua senha AXON"
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.textMute};">
                Segurança
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Redefina sua senha.
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Olá, ${escapeHtml(userName)}. Você pediu pra redefinir a senha da sua conta AXON. Clique no botão pra criar uma nova.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 8px;" align="center">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Redefinir senha
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:${t.textMute};">
                Link válido por 1 hora. Se não foi você, ignore.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              <p style="margin:0;font-size:11px;color:${t.textMute};line-height:1.5;word-break:break-all;">
                Ou copie e cole no navegador: <a href="${resetUrl}" style="color:${t.pulse};text-decoration:none;">${escapeHtml(resetUrl)}</a>
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Redefinir senha", children: body }),
    text: `Olá, ${userName}.\n\nVocê pediu pra redefinir sua senha AXON.\n\nLink (válido por 1 hora): ${resetUrl}\n\nSe não foi você, ignore.\n\n— AXON`,
  }
}

/**
 * Email com link mágico (passwordless). Link gerado via Supabase Admin.generateLink type=magiclink.
 */
export function magicLinkEmail({ userName, magicUrl }: { userName: string; magicUrl: string }): {
  subject: string
  html: string
  text: string
} {
  const t = TOKENS
  const subject = "Seu link de acesso AXON"
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.textMute};">
                Entrar
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Entra. Aproveita.
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Olá${userName ? `, ${escapeHtml(userName)}` : ""}. Clique no botão pra entrar na sua conta sem digitar senha.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 8px;" align="center">
              <a href="${magicUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Entrar agora
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:${t.textMute};">
                Link válido por 1 hora. Uso único.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              <p style="margin:0;font-size:11px;color:${t.textMute};line-height:1.5;word-break:break-all;">
                Ou copie e cole: <a href="${magicUrl}" style="color:${t.pulse};text-decoration:none;">${escapeHtml(magicUrl)}</a>
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Link de acesso", children: body }),
    text: `Olá${userName ? `, ${userName}` : ""}.\n\nLink de acesso AXON (válido por 1 hora): ${magicUrl}\n\n— AXON`,
  }
}

/**
 * Email de convite pra scanner (porteira/operador). Usa link tokenizado de /scan/[token].
 */
export function scannerInviteEmail({
  scannerName,
  eventTitle,
  eventDate,
  scanUrl,
}: {
  scannerName: string
  eventTitle: string
  eventDate: string
  scanUrl: string
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = `${scannerName}, seu link de portaria — ${eventTitle}`
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.pulse};">
                Portaria
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Olá, ${escapeHtml(scannerName)}.
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Aqui está seu link pra validar ingressos do evento <strong style="color:${t.text};">${escapeHtml(eventTitle)}</strong> (${escapeHtml(eventDate)}).
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 8px;" align="center">
              <a href="${scanUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Abrir scanner →
              </a>
              <p style="margin:14px 0 0;font-size:12px;color:${t.textMute};">
                Abra no celular. A câmera vai pedir permissão.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              <p style="margin:0;font-size:11px;color:${t.textMute};line-height:1.5;word-break:break-all;">
                Ou copie no navegador: <a href="${scanUrl}" style="color:${t.pulse};text-decoration:none;">${escapeHtml(scanUrl)}</a>
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Convite Scanner", children: body }),
    text: `Olá, ${scannerName}.\n\nSeu link de portaria para ${eventTitle} (${eventDate}):\n\n${scanUrl}\n\nAbra no celular.\n\n— AXON`,
  }
}

/**
 * Email de convite pra entrar numa crew/equipe de um evento.
 */
export function crewInviteEmail({
  inviterName,
  crewName,
  eventTitle,
  eventDate,
  joinUrl,
}: {
  inviterName: string
  crewName: string
  eventTitle: string
  eventDate: string
  joinUrl: string
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = `${inviterName} te convidou pra crew "${crewName}"`
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.pulse};">
                Crew
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Bora junto.
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                <strong style="color:${t.text};">${escapeHtml(inviterName)}</strong> montou a crew <strong style="color:${t.pulse};">${escapeHtml(crewName)}</strong> pro evento <strong style="color:${t.text};">${escapeHtml(eventTitle)}</strong> (${escapeHtml(eventDate)}).
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;" align="center">
              <a href="${joinUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Entrar na crew
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:${t.textMute};">
                Você decide se aparece com nome e Instagram. Link válido até o evento.
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Convite Crew", children: body }),
    text: `${inviterName} te convidou pra crew "${crewName}" no ${eventTitle} (${eventDate}).\n\nEntrar: ${joinUrl}\n\n— AXON`,
  }
}

/**
 * Email de comissão de afiliado creditada.
 */
export function affiliateCommissionEmail({
  affiliateName,
  eventTitle,
  amountCents,
  commissionRatePct,
  balanceCents,
}: {
  affiliateName: string
  eventTitle: string
  amountCents: number
  commissionRatePct: number
  balanceCents: number
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = `+${centsToBRL(amountCents)} em créditos AXON`
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.pulse};">
                Comissão
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Caiu na carteira.
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Olá, ${escapeHtml(affiliateName)}. Sua venda em <strong style="color:${t.text};">${escapeHtml(eventTitle)}</strong> gerou ${commissionRatePct}% em créditos AXON.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.bgDarker};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">Crédito recebido</p>
                    <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:${t.pulse};font-family:'Courier New',monospace;">${centsToBRL(amountCents)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px 20px;border-top:1px solid ${t.rule};">
                    <p style="margin:14px 0 0;font-size:13px;color:${t.textMute};">
                      <strong style="color:${t.text};">Saldo total:</strong> <span style="font-family:'Courier New',monospace;">${centsToBRL(balanceCents)}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;" align="center">
              <p style="margin:0 0 14px;font-size:12px;color:${t.textMute};">Use seus créditos no checkout do próximo ingresso.</p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Crédito creditado", children: body }),
    text: `Olá, ${affiliateName}.\n\nSua venda em ${eventTitle} gerou ${commissionRatePct}% em créditos AXON.\n\nCrédito recebido: ${centsToBRL(amountCents)}\nSaldo total: ${centsToBRL(balanceCents)}\n\n— AXON`,
  }
}

/**
 * Email de evento criado com sucesso (para o organizador)
 */
export function eventCreatedEmail({
  organizerName,
  eventTitle,
  eventDate,
  eventLocation,
  eventUrl,
}: {
  organizerName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = `Seu evento "${eventTitle}" foi criado com sucesso!`
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.pulse};">
                Organização
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Evento criado!
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Olá, ${escapeHtml(organizerName)}. Seu evento <strong style="color:${t.text};">${escapeHtml(eventTitle)}</strong> foi cadastrado e já está ativo na AXON.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.bgDarker};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">Data</p>
                    <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:${t.text};">${escapeHtml(eventDate)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px 20px;">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">Local</p>
                    <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:${t.text};">${escapeHtml(eventLocation)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;" align="center">
              <a href="${eventUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Visualizar evento →
              </a>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Evento Criado", children: body }),
    text: `Olá, ${organizerName}.\n\nSeu evento "${eventTitle}" foi criado com sucesso!\n\nData: ${eventDate}\nLocal: ${eventLocation}\n\nLink: ${eventUrl}\n\n— AXON`,
  }
}

/**
 * Email de lembrete de carrinho abandonado (para pedidos pendentes)
 */
export function abandonedCartEmail({
  buyerName,
  eventTitle,
  eventDate,
  checkoutUrl,
}: {
  buyerName: string
  eventTitle: string
  eventDate: string
  checkoutUrl: string
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = `Não perca sua vaga para ${eventTitle}`
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.pulse};">
                Reserva pendente
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Seu ingresso te espera.
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Olá, ${escapeHtml(buyerName)}. Notamos que você iniciou o processo de compra para o evento <strong style="color:${t.text};">${escapeHtml(eventTitle)}</strong> (${escapeHtml(eventDate)}), mas não concluiu o pagamento.
              </p>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Seus ingressos ficam reservados por pouco tempo. Finalize sua compra agora para garantir seu lugar.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;" align="center">
              <a href="${checkoutUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Concluir pagamento →
              </a>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Carrinho Pendente", children: body }),
    text: `Olá, ${buyerName}.\n\nFinalize a compra dos seus ingressos para ${eventTitle} (${eventDate}) antes que expirem!\n\nLink: ${checkoutUrl}\n\n— AXON`,
  }
}

/**
 * Email de lembrete 24h antes do evento
 */
export function eventReminderEmail({
  buyerName,
  eventTitle,
  eventDate,
  eventLocation,
  ticketsUrl,
}: {
  buyerName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  ticketsUrl: string
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = `Lembrete: Seu evento "${eventTitle}" é amanhã!`
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.pulse};">
                Lembrete
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                Está chegando.
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Olá, ${escapeHtml(buyerName)}. Amanhã acontece o evento <strong style="color:${t.pulse};">${escapeHtml(eventTitle)}</strong>. Prepare seu ingresso!
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.bgDarker};border-radius:16px;border:1px solid ${t.rule};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">Data e Hora</p>
                    <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:${t.text};">${escapeHtml(eventDate)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px 20px;">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${t.textMute};">Local</p>
                    <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:${t.text};">${escapeHtml(eventLocation)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;" align="center">
              <a href="${ticketsUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Ver meus ingressos →
              </a>
              <p style="margin:14px 0 0;font-size:12px;color:${t.textMute};">
                Apresente o QR Code na tela do celular na entrada do evento.
              </p>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Lembrete Evento", children: body }),
    text: `Olá, ${buyerName}.\n\nSeu evento "${eventTitle}" é amanhã!\n\nData: ${eventDate}\nLocal: ${eventLocation}\n\nAcesse seus ingressos: ${ticketsUrl}\n\n— AXON`,
  }
}

/**
 * Email de feedback pós-evento
 */
export function eventFeedbackEmail({
  buyerName,
  eventTitle,
  feedbackUrl,
}: {
  buyerName: string
  eventTitle: string
  feedbackUrl: string
}): { subject: string; html: string; text: string } {
  const t = TOKENS
  const subject = `Como foi sua experiência no ${eventTitle}?`
  const body = `
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${t.pulse};">
                Feedback
              </p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:${t.text};">
                O que você achou?
              </h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Olá, ${escapeHtml(buyerName)}. O evento <strong style="color:${t.text};">${escapeHtml(eventTitle)}</strong> chegou ao fim e gostaríamos muito de saber como foi sua experiência.
              </p>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:${t.textMute};">
                Sua opinião ajuda o organizador a criar eventos ainda melhores. Leva menos de 2 minutos.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;" align="center">
              <a href="${feedbackUrl}" style="display:inline-block;padding:14px 32px;background-color:${t.pulse};color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;">
                Avaliar evento →
              </a>
            </td>
          </tr>`
  return {
    subject,
    html: emailShell({ subject, eyebrow: "Agradecimento", children: body }),
    text: `Olá, ${buyerName}.\n\nO que você achou do evento ${eventTitle}?\n\nDeixe seu feedback: ${feedbackUrl}\n\n— AXON`,
  }
}
