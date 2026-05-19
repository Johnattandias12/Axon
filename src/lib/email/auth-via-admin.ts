/**
 * Geração de links de autenticação via Supabase Admin + envio via Resend.
 *
 * POR QUÊ: Supabase Auth tenta enviar emails (reset password, magic link, signup confirm)
 * pelo SMTP padrão do projeto. Em sandbox sem domínio verificado, o envio falha.
 *
 * Solução profissional: a gente gera o LINK via Admin API e envia o email
 * pela nossa stack (Resend + templates AXON). Dessa forma:
 *  - Funciona mesmo sem SMTP custom configurado no Supabase
 *  - Template é nosso (visualmente consistente)
 *  - Tudo passa pela auditoria de email_logs
 *  - Sem mock de sucesso — erro real volta pro usuário
 *
 * SE NO FUTURO o user configurar Custom SMTP do Supabase apontando pro Resend,
 * este módulo continua válido: ele NÃO compete com isso, apenas evita depender disso.
 */

import { createAdminClient } from "@/lib/supabase/admin"
import { sendPasswordReset, sendMagicLink } from "./send"

function getAppUrl(): string {
  const url = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"
  return url.replace(/\/$/, "")
}

interface DispatchResult {
  ok: boolean
  error?: string
}

/**
 * Gera link de recuperação de senha via Supabase Admin e envia via Resend.
 * Em caso de erro do Supabase (ex: email não cadastrado), retorna ok=false sem mock.
 */
export async function dispatchPasswordReset(email: string): Promise<DispatchResult> {
  const supabase = createAdminClient()

  // profiles.email foi syncado na 011 mas os types ainda usam o shape antigo.
  // Cast no padrão do projeto (ver affiliates-admin.ts) pra consultar pela coluna.
  const profilesClient = supabase as unknown as {
    from: (n: string) => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string
        ) => {
          maybeSingle: () => Promise<{
            data: { id: string; full_name: string | null } | null
          }>
        }
      }
    }
  }
  const { data: user } = await profilesClient
    .from("profiles")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle()

  const userId = user?.id ?? null
  const userName = (user?.full_name ?? email.split("@")[0] ?? "").toString()

  // generateLink: type=recovery → mesma URL que resetPasswordForEmail dispararia
  // mas RETORNADA pra nós em vez de enviada via SMTP do Supabase.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${getAppUrl()}/api/auth/callback?next=/redefinir-senha`,
    },
  })

  if (error || !data?.properties?.action_link) {
    const msg = error?.message ?? "unknown"
    // Se o usuário não existe, NÃO revelamos (timing safe). Trata como sucesso silencioso.
    if (/not found|user.*does not exist/i.test(msg)) {
      return { ok: true } // mesmo retorno do caso de sucesso — evita enumeration
    }
    return { ok: false, error: msg }
  }

  const resetUrl = data.properties.action_link
  const sent = await sendPasswordReset({
    to: email,
    userName,
    resetUrl,
    userId,
  })

  if (!sent.sent) {
    return { ok: false, error: sent.error ?? "send_failed" }
  }
  return { ok: true }
}

/**
 * Gera magic link via Supabase Admin e envia via Resend.
 * Cria usuário implicitamente se não existir (signup via OTP).
 */
export async function dispatchMagicLink(email: string): Promise<DispatchResult> {
  const supabase = createAdminClient()

  const profilesClient = supabase as unknown as {
    from: (n: string) => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string
        ) => {
          maybeSingle: () => Promise<{
            data: { id: string; full_name: string | null } | null
          }>
        }
      }
    }
  }
  const { data: user } = await profilesClient
    .from("profiles")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle()

  const userId = user?.id ?? null
  const userName = (user?.full_name ?? "").toString()

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${getAppUrl()}/api/auth/callback?next=/`,
    },
  })

  if (error || !data?.properties?.action_link) {
    const msg = error?.message ?? "unknown"
    return { ok: false, error: msg }
  }

  const magicUrl = data.properties.action_link
  const sent = await sendMagicLink({
    to: email,
    userName,
    magicUrl,
    userId,
  })

  if (!sent.sent) {
    return { ok: false, error: sent.error ?? "send_failed" }
  }
  return { ok: true }
}
