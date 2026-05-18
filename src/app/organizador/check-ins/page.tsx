import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/PageHeader"
import { ScanLine } from "lucide-react"

export const metadata: Metadata = { title: "Check-ins · Organizador" }

export default function OrganizadorCheckInsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Check-ins"
        title="Atividade na porta"
        description="Veja em tempo real quem entrou, por qual portão e quando. Dashboard completo chegando."
      />
      <div
        className="rounded-2xl border border-dashed p-10 text-center"
        style={{ borderColor: "var(--rule-strong)" }}
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--paper-soft)", color: "var(--mute)" }}
        >
          <ScanLine size={22} />
        </div>
        <p className="mt-4 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Em construção
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs" style={{ color: "var(--mute)" }}>
          Em breve: lista de check-ins, taxa de entrada por hora, top portões e validadores.
        </p>
      </div>
    </div>
  )
}
