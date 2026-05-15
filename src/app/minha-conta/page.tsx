import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "./ProfileForm"
import Image from "next/image"
import { centsToBRL, formatDate } from "@/lib/utils"
import { Ticket as TicketIcon, ArrowUpRight, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = { title: "Minha conta" }

export default async function MinhaContaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta")

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, cpf, role").eq("id", user.id).single(),
    supabase
      .from("orders")
      .select(
        `id, status, total_cents, paid_at, created_at,
         events(title, slug, starts_at, venue_name, city, banner_url),
         tickets(id)`
      )
      .eq("buyer_id", user.id)
      .in("status", ["paid", "pending"])
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  return (
    <div className="space-y-8">
      <div>
        <p
          className="text-xs font-semibold tracking-wider uppercase"
          style={{ color: "var(--mute)" }}
        >
          Minha conta
        </p>
        <h1
          className="mt-1 text-3xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          {profile?.full_name ? `Olá, ${profile.full_name.split(" ")[0]}` : "Bem-vindo"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          {user.email}
        </p>
      </div>

      <Tabs defaultValue="pedidos">
        <TabsList
          className="h-auto w-full justify-start gap-0 rounded-none border-b p-0"
          style={{ backgroundColor: "transparent", borderColor: "var(--rule)" }}
        >
          {["pedidos", "dados", "privacidade"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm capitalize data-[state=active]:border-current"
              style={{ color: "var(--mute)" }}
            >
              {tab === "pedidos"
                ? "Meus ingressos"
                : tab === "dados"
                  ? "Dados pessoais"
                  : "Privacidade"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pedidos" className="pt-6">
          {!orders || orders.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed p-12 text-center"
              style={{ borderColor: "var(--rule)" }}
            >
              <TicketIcon size={28} className="mx-auto" style={{ color: "var(--mute-2)" }} />
              <p className="mt-3 text-sm font-medium" style={{ color: "var(--ink)" }}>
                Nenhum ingresso ainda
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
                Seus ingressos aparecem aqui após a compra
              </p>
              <Link
                href="/eventos"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
                style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
              >
                Explorar eventos
                <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {orders.map((order) => {
                const event = Array.isArray(order.events) ? order.events[0] : order.events
                const ticketCount = (order.tickets ?? []).length
                if (!event) return null
                return (
                  <Link
                    key={order.id}
                    href={`/minha-conta/ingressos/${order.id}`}
                    className="group relative overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                    style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
                  >
                    <div className="flex gap-4 p-4">
                      <div
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl"
                        style={{ backgroundColor: "var(--paper-soft)" }}
                      >
                        {event.banner_url ? (
                          <Image
                            src={event.banner_url}
                            alt={event.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{
                              background:
                                "linear-gradient(135deg, var(--ink) 0%, var(--ink-3) 100%)",
                            }}
                          >
                            <TicketIcon size={24} style={{ color: "var(--pulse)" }} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {order.status === "paid" && (
                            <CheckCircle2 size={12} style={{ color: "var(--success)" }} />
                          )}
                          <p
                            className="text-[10px] font-semibold tracking-wider uppercase"
                            style={{
                              color: order.status === "paid" ? "var(--success)" : "var(--mute)",
                            }}
                          >
                            {order.status === "paid" ? "Confirmado" : "Pendente"}
                          </p>
                        </div>
                        <p
                          className="mt-0.5 line-clamp-2 text-sm font-semibold"
                          style={{ color: "var(--ink)" }}
                        >
                          {event.title}
                        </p>
                        <p className="mt-1 text-[11px]" style={{ color: "var(--mute)" }}>
                          {formatDate(event.starts_at, { dateStyle: "medium" })}
                          {event.city ? ` · ${event.city}` : ""}
                        </p>
                        <div
                          className="mt-2 flex items-center justify-between border-t pt-2"
                          style={{ borderColor: "var(--rule)" }}
                        >
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: "var(--mute)" }}
                          >
                            {ticketCount} {ticketCount === 1 ? "ingresso" : "ingressos"}
                          </span>
                          <span
                            className="font-mono text-xs font-bold"
                            style={{ color: "var(--ink)" }}
                          >
                            {centsToBRL(order.total_cents)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dados" className="pt-6">
          <ProfileForm
            userId={user.id}
            initialData={{
              full_name: profile?.full_name ?? "",
              phone: profile?.phone ?? "",
              cpf: profile?.cpf ?? "",
            }}
          />
        </TabsContent>

        <TabsContent value="privacidade" className="space-y-4 pt-6">
          <div
            className="space-y-3 rounded-2xl border p-5"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              Seus dados (LGPD)
            </h2>
            <p className="text-xs" style={{ color: "var(--mute)" }}>
              Você tem direito de acessar, portabilizar e solicitar a exclusão dos seus dados.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-black/5"
                style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
                disabled
                title="Disponível em breve"
              >
                Exportar dados
              </button>
              <button
                className="rounded-lg border px-3 py-1.5 text-xs transition-colors"
                style={{ borderColor: "var(--danger-soft)", color: "var(--danger)" }}
                disabled
                title="Disponível em breve"
              >
                Solicitar exclusão
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--mute-2)" }}>
              Implementação completa na Sprint 5. DPO: dpo@axon.com.br
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
