import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PageHeader } from "@/components/shared/PageHeader"
import { CourtesyForm } from "./CourtesyForm"
import { CheckCircle2, X, Gift } from "lucide-react"

export const metadata: Metadata = { title: "Cortesias · AXON" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CortesiaPage({ params }: Props) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar")

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!organizer) redirect("/organizador/comecar")

  const admin = createAdminClient()
  const { data: event } = await admin
    .from("events")
    .select(
      "id, title, organizer_id, ticket_types(id, name, ticket_lots(id, name, price_cents, quantity_total, quantity_sold, quantity_reserved, is_half_price))"
    )
    .eq("id", eventId)
    .single()

  if (!event || event.organizer_id !== organizer.id) notFound()

  const lots = (event.ticket_types ?? []).flatMap((t) =>
    (t.ticket_lots ?? []).map((l) => ({ ...l, typeName: t.name }))
  )

  // Cortesias já emitidas (filtra por metadata.courtesy = true)
  const { data: courtesies } = await admin
    .from("orders")
    .select(
      `id, paid_at, metadata,
       tickets(id, holder_name, holder_cpf, status,
         ticket_lots(name, ticket_types(name)))`
    )
    .eq("event_id", eventId)
    .filter("metadata->>courtesy", "eq", "true")
    .order("paid_at", { ascending: false })

  const courtesyRows = (courtesies ?? []).flatMap((o) => {
    const meta = (o.metadata ?? {}) as { recipient_email?: string | null }
    return (o.tickets ?? []).map((t) => {
      const lot = Array.isArray(t.ticket_lots) ? t.ticket_lots[0] : t.ticket_lots
      const tt = lot && Array.isArray(lot.ticket_types) ? lot.ticket_types[0] : lot?.ticket_types
      return {
        orderId: o.id,
        ticketId: t.id,
        holderName: t.holder_name,
        holderCpf: t.holder_cpf,
        email: meta.recipient_email ?? null,
        status: t.status,
        lotName: lot?.name ?? "",
        typeName: tt?.name ?? "",
        paidAt: o.paid_at,
      }
    })
  })

  const validCount = courtesyRows.filter((r) => r.status === "valid").length
  const usedCount = courtesyRows.filter((r) => r.status === "used").length
  const cancelledCount = courtesyRows.filter(
    (r) => r.status === "cancelled" || r.status === "refunded"
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/organizador/eventos/${eventId}`, label: "Voltar ao evento" }}
        eyebrow="Cortesias · Lista VIP"
        title={event.title}
        description="Emita cortesias em lote para imprensa, parceiros e convidados especiais."
        actions={
          <Link
            href={`/api/organizador/eventos/${eventId}/export?type=courtesy`}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-black/5"
            style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
            prefetch={false}
          >
            Exportar CSV
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Emitidas válidas" value={validCount} accent="var(--success)" />
        <Stat label="Já utilizadas" value={usedCount} />
        <Stat label="Canceladas" value={cancelledCount} accent="var(--danger)" />
      </div>

      <CourtesyForm eventId={eventId} lots={lots} />

      <section className="space-y-3">
        <h2
          className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase"
          style={{ color: "var(--mute)" }}
        >
          <Gift size={13} style={{ color: "var(--pulse-deep)" }} />
          Cortesias emitidas ({courtesyRows.length})
        </h2>

        {courtesyRows.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed p-10 text-center"
            style={{ borderColor: "var(--rule-strong)" }}
          >
            <p className="text-sm" style={{ color: "var(--mute)" }}>
              Nenhuma cortesia emitida ainda. Use o formulário acima para liberar a primeira lista.
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <div
              className="hidden grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.6fr] gap-3 border-b px-4 py-2 text-[10px] font-semibold tracking-wider uppercase sm:grid"
              style={{ borderColor: "var(--rule)", color: "var(--mute)" }}
            >
              <span>Convidado</span>
              <span>Email</span>
              <span>Setor / Lote</span>
              <span>Emitida</span>
              <span className="text-right">Status</span>
            </div>
            {courtesyRows.map((r) => {
              const statusNode =
                r.status === "used" ? (
                  <span className="flex items-center gap-1" style={{ color: "var(--success)" }}>
                    <CheckCircle2 size={12} />
                    Compareceu
                  </span>
                ) : r.status === "cancelled" || r.status === "refunded" ? (
                  <span className="flex items-center gap-1" style={{ color: "var(--danger)" }}>
                    <X size={12} />
                    Cancelada
                  </span>
                ) : (
                  <span style={{ color: "var(--mute)" }}>Pendente</span>
                )
              return (
                <div
                  key={r.ticketId}
                  className="border-b px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.6fr] sm:gap-3 sm:text-xs"
                  style={{ borderColor: "var(--rule)" }}
                >
                  {/* Mobile card */}
                  <div className="space-y-2 sm:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-semibold"
                          style={{ color: "var(--ink)" }}
                        >
                          {r.holderName}
                        </p>
                        <p
                          className="truncate font-mono text-[10px]"
                          style={{ color: "var(--mute)" }}
                        >
                          {r.holderCpf}
                        </p>
                      </div>
                      <div className="shrink-0 text-[10px] font-bold tracking-wider uppercase">
                        {statusNode}
                      </div>
                    </div>
                    <div
                      className="flex flex-wrap items-center justify-between gap-x-3 text-[11px]"
                      style={{ color: "var(--mute)" }}
                    >
                      <span>
                        {r.typeName}
                        {r.lotName ? ` · ${r.lotName}` : ""}
                      </span>
                      <span>{r.paidAt ? new Date(r.paidAt).toLocaleDateString("pt-BR") : "—"}</span>
                    </div>
                    {r.email && (
                      <p className="truncate text-[11px]" style={{ color: "var(--ink-4)" }}>
                        {r.email}
                      </p>
                    )}
                  </div>

                  {/* Desktop linha */}
                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate font-medium" style={{ color: "var(--ink)" }}>
                      {r.holderName}
                    </p>
                    <p className="truncate font-mono text-[10px]" style={{ color: "var(--mute)" }}>
                      {r.holderCpf}
                    </p>
                  </div>
                  <span className="hidden truncate sm:inline" style={{ color: "var(--ink-4)" }}>
                    {r.email ?? "—"}
                  </span>
                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate" style={{ color: "var(--ink-4)" }}>
                      {r.typeName}
                    </p>
                    <p className="truncate text-[10px]" style={{ color: "var(--mute)" }}>
                      {r.lotName}
                    </p>
                  </div>
                  <span className="hidden sm:inline" style={{ color: "var(--mute)" }}>
                    {r.paidAt ? new Date(r.paidAt).toLocaleDateString("pt-BR") : "—"}
                  </span>
                  <span className="hidden items-center justify-end gap-1 sm:flex">
                    {statusNode}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <p
        className="font-mono text-2xl font-bold tabular-nums"
        style={{ color: accent ?? "var(--ink)", letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
      <p
        className="mt-1 text-[10px] font-semibold tracking-wider uppercase"
        style={{ color: "var(--mute)" }}
      >
        {label}
      </p>
    </div>
  )
}
