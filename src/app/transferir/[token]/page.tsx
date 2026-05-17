import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { SiteHeader } from "@/components/shared/SiteHeader"
import { ClaimForm } from "./ClaimForm"
import { formatDate } from "@/lib/utils"
import { Calendar, MapPin, Ticket as TicketIcon, Clock } from "lucide-react"

export const metadata: Metadata = { title: "Transferência de ingresso · AXON" }

interface PageProps {
  params: Promise<{ token: string }>
}

type RelTicket = {
  id: string
  status: string
  transfer_expires_at: string | null
  holder_name: string
  is_half_price: boolean
  ticket_lots:
    | { name: string; ticket_types: { name: string } | { name: string }[] | null }
    | { name: string; ticket_types: { name: string } | { name: string }[] | null }[]
    | null
  events:
    | {
        title: string
        slug: string
        starts_at: string
        venue_name: string | null
        city: string | null
        state: string | null
        banner_url: string | null
      }
    | {
        title: string
        slug: string
        starts_at: string
        venue_name: string | null
        city: string | null
        state: string | null
        banner_url: string | null
      }[]
    | null
}

export default async function TransferirPage({ params }: PageProps) {
  const { token } = await params

  // Validação do token via admin (RLS permite leitura por token, mas usamos admin pra
  // pegar dados completos do evento)
  const admin = createAdminClient()
  const { data: rawTicket } = await admin
    .from("tickets")
    .select(
      `id, status, transfer_expires_at, holder_name, is_half_price,
       ticket_lots(name, ticket_types(name)),
       events(title, slug, starts_at, venue_name, city, state, banner_url)`
    )
    .eq("transfer_token", token)
    .maybeSingle()
  const ticket = rawTicket as unknown as RelTicket | null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/entrar?redirectTo=/transferir/${token}`)
  }

  const isInvalid =
    !ticket ||
    ticket.status !== "paused" ||
    !ticket.transfer_expires_at ||
    new Date(ticket.transfer_expires_at) < new Date()

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <SiteHeader />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {isInvalid ? (
          <div
            className="rounded-3xl border p-10 text-center"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}
            >
              <Clock size={22} />
            </div>
            <h1 className="mt-4 text-xl font-bold" style={{ color: "var(--ink)" }}>
              Esse link não rola mais
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--mute)" }}>
              Pode ter expirado, sido cancelado ou alguém pegou primeiro.
            </p>
            <Link
              href="/eventos"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              Ver eventos
            </Link>
          </div>
        ) : (
          <ValidClaim
            token={token}
            event={pickOne(ticket!.events)}
            lotName={pickOne(ticket!.ticket_lots)?.name ?? ""}
            typeName={pickOne(pickOne(ticket!.ticket_lots)?.ticket_types) ?? "Ingresso"}
            isHalfPrice={ticket!.is_half_price}
            originalHolderName={ticket!.holder_name}
            expiresAt={ticket!.transfer_expires_at as string}
          />
        )}
      </div>
    </div>
  )
}

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function ValidClaim({
  token,
  event,
  lotName,
  typeName,
  isHalfPrice,
  originalHolderName,
  expiresAt,
}: {
  token: string
  event: {
    title: string
    slug: string
    starts_at: string
    venue_name: string | null
    city: string | null
    state: string | null
    banner_url: string | null
  } | null
  lotName: string
  typeName: { name: string } | string
  isHalfPrice: boolean
  originalHolderName: string
  expiresAt: string
}) {
  const tName = typeof typeName === "string" ? typeName : (typeName?.name ?? "Ingresso")
  const expDate = formatDate(expiresAt, { dateStyle: "medium", timeStyle: "short" })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="mx-auto inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
          style={{
            borderColor: "var(--pulse)",
            backgroundColor: "var(--pulse-soft)",
            color: "var(--pulse-deep)",
          }}
        >
          <TicketIcon size={12} />
          <span className="text-[11px] font-bold tracking-wider uppercase">Ingresso pra você</span>
        </div>
        <h1
          className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Alguém te passou um ingresso
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--mute)" }}>
          Originalmente de {originalHolderName}. Confirma seus dados pra ficar no seu nome.
        </p>
      </div>

      {event && (
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          {event.banner_url && (
            <div
              className="h-32 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${event.banner_url})` }}
            />
          )}
          <div className="space-y-2 p-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
              {event.title}
            </h2>
            <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--mute)" }}>
              <Calendar size={11} />
              {formatDate(event.starts_at, { dateStyle: "full", timeStyle: "short" })}
            </p>
            {(event.venue_name ?? event.city) && (
              <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--mute)" }}>
                <MapPin size={11} />
                {[event.venue_name, event.city, event.state].filter(Boolean).join(" · ")}
              </p>
            )}
            <div
              className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3"
              style={{ borderColor: "var(--rule)" }}
            >
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                style={{ backgroundColor: "var(--ink)", color: "var(--pulse)" }}
              >
                {tName}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: "var(--mute)" }}>
                {lotName}
              </span>
              {isHalfPrice && (
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}
                >
                  MEIA
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <ClaimForm token={token} />

      <p className="text-center text-[11px]" style={{ color: "var(--mute)" }}>
        O link expira em {expDate}.
      </p>
    </div>
  )
}
