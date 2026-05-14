import type { Metadata } from "next"
import { MagicLinkForm } from "@/components/shared/MagicLinkForm"

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta AXON com um link enviado ao seu e-mail.",
}

export default function EntrarPage() {
  return (
    <div
      className="w-full max-w-sm space-y-8 rounded-2xl border px-6 py-8"
      style={{
        backgroundColor: "var(--paper-pure)",
        borderColor: "var(--rule)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div className="space-y-1">
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Acesse sua conta
        </h1>
        <p className="text-sm" style={{ color: "var(--mute)" }}>
          Sem senha. Um link direto no seu e-mail.
        </p>
      </div>

      <MagicLinkForm />
    </div>
  )
}
