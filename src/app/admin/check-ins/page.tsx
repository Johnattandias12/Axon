import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/PageHeader"
import { ScanLine } from "lucide-react"

export const metadata: Metadata = { title: "Check-ins · Admin" }

export default function AdminCheckInsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Check-ins · Admin"
        title="Atividade na porta"
        description="Logs de validação por evento, portão, validador e hora — em breve com dashboard completo."
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
          Logs e dashboard de check-ins chegam na próxima entrega.
        </p>
      </div>
    </div>
  )
}
