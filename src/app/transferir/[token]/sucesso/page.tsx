import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/shared/SiteHeader"
import { CheckCircle2, ArrowRight } from "lucide-react"

export const metadata: Metadata = { title: "Ingresso recebido · AXON" }

export default function TransferSucessoPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-20">
        <div
          className="rounded-3xl border p-10 text-center"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}
          >
            <CheckCircle2 size={28} />
          </div>
          <h1
            className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            Ingresso seu. Noite sua.
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--mute)" }}>
            Vai pros seus ingressos pra ver o QR e baixar o PDF.
          </p>
          <Link
            href="/minha-conta"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            Ver meus ingressos
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
