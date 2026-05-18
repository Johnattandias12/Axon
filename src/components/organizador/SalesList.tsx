"use client"

import { useState } from "react"
import { centsToBRL, formatDate } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowDownRight,
  Copy,
  Check,
  User,
  Wallet,
  CreditCard,
  Ticket,
  Calendar,
  Layers,
  Activity,
  ClipboardList
} from "lucide-react"

interface TicketDetails {
  id: string
  holder_name: string
  holder_cpf: string
  is_half_price: boolean
  status: string
  used_at: string | null
  ticket_lots: { title: string } | null
}

interface BuyerDetails {
  id: string
  full_name: string | null
  phone: string | null
  cpf: string | null
}

interface OrderRow {
  id: string
  total_cents: number
  subtotal_cents: number
  service_fee_cents: number
  paid_at: string | null
  payment_method: string | null
  status: string
  events:
    | { id: string; title: string; slug: string }
    | { id: string; title: string; slug: string }[]
    | null
  buyer: BuyerDetails | null
  tickets: TicketDetails[] | null
}

interface SalesListProps {
  initialOrders: OrderRow[]
}

export function SalesList({ initialOrders }: SalesListProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-3">
      {/* Lista de Vendas Interativa */}
      <div className="space-y-2">
        {initialOrders.slice(0, 50).map((o) => {
          const evt = Array.isArray(o.events) ? o.events[0] : o.events
          return (
            <button
              key={o.id}
              onClick={() => setSelectedOrder(o)}
              className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:scale-[1.01] hover:border-white/20 active:scale-[0.99] focus:outline-none focus:ring-1 focus:ring-white/20"
              style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}
              >
                <ArrowDownRight size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                  {evt?.title ?? "Pedido"}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--mute)" }}>
                  {o.paid_at ? formatDate(o.paid_at) : "—"} ·{" "}
                  {(o.payment_method ?? "pix").toUpperCase()}
                </p>
              </div>
              <p
                className="shrink-0 font-mono text-sm font-bold"
                style={{ color: "var(--success)" }}
              >
                + {centsToBRL(o.total_cents)}
              </p>
            </button>
          )
        })}
      </div>

      {/* Modal Premium com Detalhes Completos da Compra */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-xl border-neutral-800 bg-neutral-950 p-6 text-white backdrop-blur-xl">
          {selectedOrder && (() => {
            const evt = Array.isArray(selectedOrder.events) ? selectedOrder.events[0] : selectedOrder.events
            const buyer = selectedOrder.buyer
            const tickets = selectedOrder.tickets ?? []

            return (
              <>
                <DialogHeader className="border-b border-neutral-900 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <DialogTitle className="font-mono text-sm font-bold text-neutral-400">
                      DETALHES DO PEDIDO
                    </DialogTitle>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase">
                      PAGO
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-300">
                    <span className="font-mono text-neutral-500">ID:</span>
                    <span className="font-mono text-white selection:bg-neutral-800">{selectedOrder.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("order-id", selectedOrder.id)}
                      className="ml-1 rounded-md p-1 text-neutral-500 hover:bg-neutral-900 hover:text-white transition-colors"
                      title="Copiar ID do Pedido"
                    >
                      {copiedId === "order-id" ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </DialogHeader>

                {/* Conteúdo com scroll seguro */}
                <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1 select-none">
                  {/* Grid: Comprador & Evento */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Dados do Comprador */}
                    <div className="rounded-xl border border-neutral-900 bg-neutral-950/50 p-4">
                      <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                        <User size={12} />
                        Dados do Comprador
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] text-neutral-500">Nome</p>
                          <p className="text-xs font-semibold text-white">
                            {buyer?.full_name ?? "Não informado"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-neutral-500">CPF</p>
                            <p className="font-mono text-xs font-semibold text-white">
                              {buyer?.cpf ?? "Não informado"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-500">Celular</p>
                            <p className="font-mono text-xs font-semibold text-white">
                              {buyer?.phone ?? "Não informado"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dados do Evento & Transação */}
                    <div className="rounded-xl border border-neutral-900 bg-neutral-950/50 p-4">
                      <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                        <Calendar size={12} />
                        Dados do Evento
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] text-neutral-500">Evento</p>
                          <p className="truncate text-xs font-semibold text-white">
                            {evt?.title ?? "—"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-neutral-500">Data Compra</p>
                            <p className="text-[11px] font-semibold text-white">
                              {selectedOrder.paid_at ? formatDate(selectedOrder.paid_at) : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-500">Pagamento</p>
                            <p className="flex items-center gap-1 text-[11px] font-semibold text-white">
                              {selectedOrder.payment_method === "pix" ? (
                                <>
                                  <Wallet size={11} className="text-emerald-400" />
                                  PIX
                                </>
                              ) : (
                                <>
                                  <CreditCard size={11} className="text-blue-400" />
                                  Cartão
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Financeiros */}
                  <div className="rounded-xl border border-neutral-900 bg-neutral-950/50 p-4">
                    <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                      <ClipboardList size={12} />
                      Resumo de Valores
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Subtotal de ingressos</span>
                        <span className="font-mono font-medium">{centsToBRL(selectedOrder.subtotal_cents)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Taxa de Serviço AXON (10%)</span>
                        <span className="font-mono text-neutral-300">{centsToBRL(selectedOrder.service_fee_cents)}</span>
                      </div>
                      <div className="my-1 border-t border-neutral-900" />
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-white">Total Pago</span>
                        <span className="font-mono text-emerald-400">{centsToBRL(selectedOrder.total_cents)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ingressos Emitidos */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                      <Ticket size={12} />
                      Ingressos Emitidos ({tickets.length})
                    </h4>
                    <div className="space-y-2">
                      {tickets.length === 0 ? (
                        <p className="text-center text-xs text-neutral-500 py-2">Nenhum ingresso emitido para este pedido.</p>
                      ) : (
                        tickets.map((t) => {
                          const isUsed = t.status === "used"
                          const isCancelled = t.status === "cancelled" || t.status === "refunded"
                          return (
                            <div
                              key={t.id}
                              className="relative flex flex-col gap-2 overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950/60 p-3"
                            >
                              {/* Decoração Estilo Cupom de Ingresso */}
                              <div className="absolute top-1/2 -left-2 h-4 w-4 -translate-y-1/2 rounded-full bg-neutral-950 border-r border-neutral-900" />
                              <div className="absolute top-1/2 -right-2 h-4 w-4 -translate-y-1/2 rounded-full bg-neutral-950 border-l border-neutral-900" />

                              <div className="flex items-start justify-between gap-2 px-2">
                                <div>
                                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    {t.ticket_lots?.title ?? "Lote Padrão"}
                                  </span>
                                  <h5 className="mt-1.5 text-xs font-bold text-white">
                                    {t.holder_name}
                                  </h5>
                                  <p className="font-mono text-[10px] text-neutral-500 mt-0.5">
                                    CPF: {t.holder_cpf}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {isUsed ? (
                                    <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-rose-400 uppercase">
                                      UTILIZADO
                                    </span>
                                  ) : isCancelled ? (
                                    <span className="rounded bg-neutral-800 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-neutral-500 uppercase">
                                      CANCELADO
                                    </span>
                                  ) : (
                                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-emerald-400 uppercase">
                                      VÁLIDO
                                    </span>
                                  )}
                                  {t.used_at && (
                                    <p className="mt-1 text-[9px] text-neutral-500">
                                      Lido em {formatDate(t.used_at)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
