import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { findInviteByToken } from "@/lib/affiliates/invites"
import { AcceptInviteForm } from "./AcceptInviteForm"
import { AxonLogo } from "@/components/shared/AxonLogo"
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react"

export const metadata: Metadata = { title: "Convite de afiliado · AXON" }
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function AceitarConvitePage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/entrar?redirectTo=/afiliado/convite/${token}`)
  }

  let invite: Awaited<ReturnType<typeof findInviteByToken>> = null
  let error: string | null = null
  try {
    const admin = createAdminClient()
    invite = await findInviteByToken(admin, token)
  } catch {
    error = "Programa de afiliados ainda não foi ativado nesta instância (migration 009)."
  }

  if (!error && !invite) error = "Convite não encontrado."
  else if (!error && invite?.used_at) error = "Este convite já foi usado."
  else if (!error && invite && new Date(invite.expires_at) < new Date()) {
    error = "Convite expirado. Peça um novo à AXON."
  } else if (
    !error &&
    invite &&
    user.email &&
    invite.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    error = `Este convite é para ${invite.email}. Faça login com esse e-mail pra aceitar.`
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: "var(--paper)" }}
    >
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center">
          <AxonLogo size={28} tone="ink" />
        </Link>

        <div
          className="rounded-2xl border p-7"
          style={{
            backgroundColor: "var(--paper-pure)",
            borderColor: "var(--rule)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {error ? (
            <div className="space-y-4 text-center">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}
              >
                <AlertCircle size={24} />
              </div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
              >
                Convite indisponível
              </h1>
              <p className="text-sm" style={{ color: "var(--mute)" }}>
                {error}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
              >
                Voltar ao site
              </Link>
            </div>
          ) : invite ? (
            <div className="space-y-5">
              <div className="space-y-1 text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
                >
                  <Sparkles size={22} />
                </div>
                <h1
                  className="text-xl font-bold tracking-tight"
                  style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
                >
                  Convite pra afiliado AXON
                </h1>
                <p className="text-sm" style={{ color: "var(--mute)" }}>
                  Você foi convidado pra ganhar comissão indicando eventos.
                </p>
              </div>

              <div
                className="space-y-2 rounded-xl border p-4 text-sm"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--mute)" }}>E-mail do convite</span>
                  <span className="font-mono text-xs font-semibold" style={{ color: "var(--ink)" }}>
                    {invite.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--mute)" }}>Comissão por venda</span>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: "var(--pulse-deep)" }}
                  >
                    {invite.commission_pct}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--mute)" }}>Forma de pagamento</span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--ink-4)" }}>
                    crédito na plataforma
                  </span>
                </div>
                {invite.note && (
                  <p
                    className="border-t pt-2 text-xs italic"
                    style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
                  >
                    "{invite.note}"
                  </p>
                )}
              </div>

              <ul className="space-y-2 text-xs" style={{ color: "var(--ink-4)" }}>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={13}
                    style={{ color: "var(--success)" }}
                    className="mt-0.5 shrink-0"
                  />
                  Compartilhe seu link único com <code>?via=SEU_CODIGO</code>.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={13}
                    style={{ color: "var(--success)" }}
                    className="mt-0.5 shrink-0"
                  />
                  Cada compra fechada pelo seu link rende a comissão acima.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={13}
                    style={{ color: "var(--success)" }}
                    className="mt-0.5 shrink-0"
                  />
                  A AXON libera o pagamento manualmente como crédito na sua wallet.
                </li>
              </ul>

              <AcceptInviteForm token={token} />
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--mute-2)" }}>
          Logado como{" "}
          <span className="font-mono" style={{ color: "var(--mute)" }}>
            {user.email}
          </span>
        </p>
      </div>
    </div>
  )
}
