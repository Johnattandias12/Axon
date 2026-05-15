import type { Metadata } from "next"
import Link from "next/link"
import { AxonLogo } from "@/components/shared/AxonLogo"
import { LoginForm } from "@/components/shared/LoginForm"

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta AXON.",
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; erro?: string }>
}) {
  const params = await searchParams
  const redirectTo = params.redirectTo ?? "/eventos"

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--paper)" }}
    >
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center">
          <AxonLogo size={28} tone="ink" />
        </Link>

        <div
          className="space-y-6 rounded-2xl border p-7"
          style={{
            backgroundColor: "var(--paper-pure)",
            borderColor: "var(--rule)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {params.erro === "link_invalido" && (
            <div
              className="rounded-xl border p-3 text-sm"
              style={{
                borderColor: "var(--warning)",
                color: "var(--warning)",
                backgroundColor: "var(--warning-soft)",
              }}
            >
              Link expirado ou inválido. Tente novamente.
            </div>
          )}

          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--mute-2)" }}>
          Desenvolvido pela <span style={{ color: "var(--mute)" }}>Beyonder</span> © 2026
        </p>
      </div>
    </div>
  )
}
