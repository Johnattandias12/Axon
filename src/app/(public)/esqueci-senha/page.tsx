import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Ticket as TicketIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Recuperar senha - AXON",
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = resolvedParams.error as string | undefined
  const success = resolvedParams.success === "true"

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="w-full max-w-md space-y-8 rounded-3xl border p-8 shadow-2xl sm:p-12"
        style={{
          backgroundColor: "var(--paper-pure)",
          borderColor: "var(--rule)",
          backgroundImage:
            "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 3%, var(--paper-pure)) 100%)",
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            <TicketIcon size={28} />
          </div>
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            Recuperar senha
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--mute)" }}>
            Digite seu email e enviaremos um link de recuperação.
          </p>
        </div>

        {success ? (
          <div
            className="rounded-xl border p-4 text-center"
            style={{
              backgroundColor: "var(--success-soft)",
              borderColor: "color-mix(in srgb, var(--success) 30%, transparent)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
              Link de recuperação enviado!
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--success)" }}>
              Verifique sua caixa de entrada e pasta de spam.
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" action="/api/auth/reset-password" method="POST">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold"
                  style={{ color: "var(--ink)" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:outline-none"
                  style={
                    {
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--rule)",
                      color: "var(--ink)",
                      "--tw-ring-color": "color-mix(in srgb, var(--pulse) 30%, transparent)",
                    } as React.CSSProperties
                  }
                  placeholder="Seu email cadastrado"
                />
              </div>
            </div>

            {error && (
              <p className="text-center text-sm font-semibold" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex w-full justify-center rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              Enviar link de recuperação
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/entrar"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--mute)" }}
          >
            <ArrowLeft size={16} />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
