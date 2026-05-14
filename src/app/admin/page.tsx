import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Users, Calendar, Building2, Ticket } from "lucide-react"

export const metadata: Metadata = { title: "Admin" }

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalEvents },
    { count: totalOrganizers },
    { count: publishedEvents },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("organizers").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("events")
      .select("id, title, status, city, starts_at, organizer_id")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  const statusLabel: Record<string, string> = {
    draft: "Rascunho",
    published: "Publicado",
    cancelled: "Cancelado",
    finished: "Encerrado",
  }
  const statusColor: Record<string, string> = {
    draft: "var(--mute)",
    published: "var(--success)",
    cancelled: "var(--danger)",
    finished: "var(--ink-3)",
  }

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Painel de controle
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          Visão geral da plataforma AXON.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={<Users size={18} />}
          label="Usuários"
          value={totalUsers ?? 0}
          href="/admin/usuarios"
        />
        <KpiCard
          icon={<Building2 size={18} />}
          label="Organizadores"
          value={totalOrganizers ?? 0}
          href="/admin/organizadores"
        />
        <KpiCard
          icon={<Calendar size={18} />}
          label="Eventos publicados"
          value={publishedEvents ?? 0}
          href="/admin/eventos"
        />
        <KpiCard
          icon={<Ticket size={18} />}
          label="Total de eventos"
          value={totalEvents ?? 0}
          href="/admin/eventos"
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
            Eventos recentes
          </h2>
          <Link href="/admin/eventos" className="text-sm" style={{ color: "var(--mute)" }}>
            Ver todos
          </Link>
        </div>

        <div className="space-y-2">
          {(recentEvents ?? []).map((event) => (
            <Link
              key={event.id}
              href={`/admin/eventos`}
              className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-black/2"
              style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                  {event.title}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
                  {event.city ?? "Sem cidade"}
                </p>
              </div>
              <span
                className="shrink-0 text-xs font-semibold"
                style={{ color: statusColor[event.status] ?? "var(--mute)" }}
              >
                {statusLabel[event.status] ?? event.status}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ActionCard
          href="/admin/usuarios"
          icon={<Users size={18} />}
          title="Gerenciar usuários"
          desc="Altere roles, veja emails e gerencie contas."
        />
        <ActionCard
          href="/admin/eventos"
          icon={<Calendar size={18} />}
          title="Gerenciar eventos"
          desc="Publique, cancele ou exclua eventos."
        />
        <ActionCard
          href="/admin/organizadores"
          icon={<Building2 size={18} />}
          title="Organizadores"
          desc="Aprove KYC e gerencie organizadores."
        />
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: number
  href: string
}) {
  return (
    <Link
      href={href}
      className="space-y-2 rounded-xl border p-4 transition-colors hover:bg-black/2"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div className="flex items-center gap-2" style={{ color: "var(--mute)" }}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p
        className="font-mono text-2xl font-bold"
        style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
      >
        {value.toLocaleString("pt-BR")}
      </p>
    </Link>
  )
}

function ActionCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-xl border p-5 transition-colors hover:bg-black/2"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div style={{ color: "var(--mute)" }}>{icon}</div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {title}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
          {desc}
        </p>
      </div>
    </Link>
  )
}
