import type { Metadata } from "next"
import { Ticket as TicketIcon } from "lucide-react"
import { resetPasswordAction } from "./actions"

export const metadata: Metadata = {
  title: "Nova senha - AXON",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = resolvedParams.error as string | undefined

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="w-full max-w-md space-y-8 rounded-3xl border p-8 sm:p-12 shadow-2xl"
        style={{
          backgroundColor: "var(--paper-pure)",
          borderColor: "var(--rule)",
          backgroundImage:
            "linear-gradient(135deg, var(--paper-pure) 0%, color-mix(in srgb, var(--pulse) 3%, var(--paper-pure)) 100%)",
        }}
      >
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}>
            <TicketIcon size={28} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}>
            Criar nova senha
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--mute)" }}>
            Digite sua nova senha abaixo.
          </p>
        </div>

        <form className="mt-8 space-y-6" action={resetPasswordAction}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--ink)" }}>
                Nova senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                  "--tw-ring-color": "color-mix(in srgb, var(--pulse) 30%, transparent)",
                } as React.CSSProperties}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--ink)" }}>
                Confirmar nova senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="block w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                  "--tw-ring-color": "color-mix(in srgb, var(--pulse) 30%, transparent)",
                } as React.CSSProperties}
                placeholder="Repita a senha"
                minLength={6}
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
            Salvar nova senha
          </button>
        </form>
      </div>
    </div>
  )
}
