import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/PageHeader"
import { SecurityForm } from "./SecurityForm"
import { ShieldCheck, Mail, Key } from "lucide-react"

export const metadata: Metadata = { title: "Segurança · AXON" }
export const dynamic = "force-dynamic"

export default async function SegurancaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta/seguranca")

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("pt-BR", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "—"

  return (
    <div className="space-y-8">
      <PageHeader
        back={{ href: "/minha-conta", label: "Minha conta" }}
        eyebrow="Segurança"
        title="Conta protegida"
        description="Atualize sua senha e veja a atividade da sua sessão."
      />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail size={14} style={{ color: "var(--mute)" }} />
          <h2
            className="text-sm font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Identidade
          </h2>
        </div>
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <p
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            E-mail
          </p>
          <p className="mt-1 font-mono text-sm" style={{ color: "var(--ink)" }}>
            {user.email}
          </p>
          <p
            className="mt-3 text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Último acesso
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--ink)" }}>
            {lastSignIn}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Key size={14} style={{ color: "var(--pulse-deep)" }} />
          <h2
            className="text-sm font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Trocar senha
          </h2>
        </div>
        <SecurityForm email={user.email ?? ""} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: "var(--success)" }} />
          <h2
            className="text-sm font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            Boas práticas
          </h2>
        </div>
        <ul className="space-y-2 text-sm" style={{ color: "var(--ink-4)" }}>
          <li>· Use uma senha única, com pelo menos 12 caracteres, números e símbolos.</li>
          <li>· Nunca compartilhe seu link de ingresso ou QR antes de chegar no evento.</li>
          <li>
            · Se receber e-mail suspeito pedindo senha, ignore: a AXON nunca pede senha por e-mail.
          </li>
        </ul>
      </section>
    </div>
  )
}
