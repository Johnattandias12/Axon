"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import {
  ShoppingBag,
  Calendar,
  MapPin,
  Loader2,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  X,
  Sparkles,
  Shield,
} from "lucide-react"
import { useCartUI } from "./CartUIProvider"
import { centsToBRL, formatDate } from "@/lib/utils"
import { updateCartQuantity, removeCartItem } from "@/app/carrinho/actions"

type EventInfo = {
  id: string
  slug: string
  title: string
  startsAt: string
  venueName: string | null
  city: string | null
  bannerUrl: string | null
} | null

type Item = {
  itemId: string
  quantity: number
  lot: { id: string; name: string; priceCents: number; isHalfPrice: boolean }
  typeName: string
  event: EventInfo
  lineTotalCents: number
}

type CartResponse = {
  authenticated: boolean
  items: Item[]
  subtotal: number
  fee: number
  total: number
  totalItems: number
  paymentMode?: string
}

export function CartDrawer() {
  const { isOpen, close, refreshTick, bumpRefresh } = useCartUI()
  const [data, setData] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    fetch("/api/cart", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: CartResponse) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, refreshTick])

  return (
    <Drawer open={isOpen} onOpenChange={(o) => (o ? null : close())}>
      <DrawerContent
        className="max-h-[92vh]"
        style={{
          backgroundColor: "var(--paper-pure)",
          color: "var(--ink)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="pointer-events-none absolute top-0 right-0 left-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--pulse) 50%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        <DrawerHeader className="border-b text-left" style={{ borderColor: "var(--rule)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} style={{ color: "var(--pulse-deep)" }} />
              <DrawerTitle className="text-base font-bold" style={{ color: "var(--ink)" }}>
                Seu carrinho
              </DrawerTitle>
              {data && data.totalItems > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                  style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
                >
                  {data.totalItems}
                </span>
              )}
            </div>
            <DrawerClose
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              style={{ color: "var(--mute)" }}
              aria-label="Fechar"
            >
              <X size={16} />
            </DrawerClose>
          </div>
          <DrawerDescription className="sr-only">
            Itens que você adicionou para esta noite.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
          {loading && !data ? (
            <LoadingState />
          ) : !data || !data.authenticated ? (
            <NotLoggedState onContinue={close} />
          ) : data.items.length === 0 ? (
            <EmptyState onContinue={close} />
          ) : (
            <ItemsList items={data.items} bumpRefresh={bumpRefresh} />
          )}
        </div>

        {data && data.authenticated && data.items.length > 0 && (
          <DrawerFooter
            className="gap-2 border-t pt-3"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
          >
            <div className="space-y-1.5 text-sm">
              <Row
                label={`Subtotal · ${data.totalItems} ingressos`}
                value={centsToBRL(data.subtotal)}
                muted
              />
              <Row label="Taxa AXON (8,99%)" value={centsToBRL(data.fee)} muted />
              <div className="my-1 border-t" style={{ borderColor: "var(--rule)" }} />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                  Total
                </span>
                <span
                  className="font-mono text-xl font-bold"
                  style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
                >
                  {centsToBRL(data.total)}
                </span>
              </div>
            </div>

            <Link
              href="/carrinho"
              onClick={close}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:scale-[1.01]"
              style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
            >
              Ir para o carrinho
              <ArrowRight size={14} />
            </Link>

            <button
              type="button"
              onClick={close}
              className="text-center text-[11px] font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--mute)" }}
            >
              Continuar olhando
            </button>

            <div
              className="flex items-center justify-center gap-1.5 pt-1 text-[10px]"
              style={{ color: data?.paymentMode === "real" ? "#c8ff00" : "var(--mute)" }}
            >
              {data?.paymentMode === "real" ? (
                <>
                  <Shield size={10} className="text-[#c8ff00]" />
                  🔒 Pagamento 100% Seguro
                </>
              ) : (
                <>
                  <Sparkles size={10} />
                  Modo demonstração. Sem cobrança real.
                </>
              )}
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: muted ? "var(--mute)" : "var(--ink)" }}>{label}</span>
      <span
        className={muted ? "" : "font-mono"}
        style={{ color: muted ? "var(--mute)" : "var(--ink)" }}
      >
        {value}
      </span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12" style={{ color: "var(--mute)" }}>
      <Loader2 size={20} className="animate-spin" />
    </div>
  )
}

function NotLoggedState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="py-8 text-center">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
      >
        <ShoppingBag size={20} />
      </div>
      <p className="mt-3 text-sm font-bold" style={{ color: "var(--ink)" }}>
        Acesse sua conta para continuar.
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
        Enviamos um link de login rápido direto para a sua caixa de entrada.
      </p>
      <Link
        href="/entrar"
        onClick={onContinue}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold"
        style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
      >
        Entrar agora
        <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function EmptyState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="py-8 text-center">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse-deep)" }}
      >
        <ShoppingBag size={20} />
      </div>
      <p className="mt-3 text-sm font-bold" style={{ color: "var(--ink)" }}>
        Seu carrinho está vazio...
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--mute)" }}>
        Encontre os melhores shows, festas e espetáculos por aqui.
      </p>
      <Link
        href="/eventos"
        onClick={onContinue}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
      >
        Explorar eventos
        <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function ItemsList({ items, bumpRefresh }: { items: Item[]; bumpRefresh: () => void }) {
  // Agrupa por evento (mesmo padrão da página /carrinho)
  const byEvent = new Map<string, { event: NonNullable<EventInfo>; items: Item[] }>()
  for (const item of items) {
    if (!item.event) continue
    const cur = byEvent.get(item.event.id)
    if (cur) cur.items.push(item)
    else byEvent.set(item.event.id, { event: item.event, items: [item] })
  }

  return (
    <div className="space-y-4">
      {Array.from(byEvent.values()).map(({ event, items: evItems }) => (
        <section
          key={event.id}
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div
            className="flex items-center gap-3 border-b p-3"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
          >
            <div
              className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md"
              style={{ backgroundColor: "var(--ink)" }}
            >
              {event.bannerUrl ? (
                <Image
                  src={event.bannerUrl}
                  alt={event.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--ink), var(--ink-3))" }}
                >
                  <Calendar size={12} style={{ color: "var(--pulse)" }} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold" style={{ color: "var(--ink)" }}>
                {event.title}
              </p>
              <p
                className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px]"
                style={{ color: "var(--mute)" }}
              >
                <span className="flex items-center gap-1">
                  <Calendar size={9} />
                  {formatDate(event.startsAt, { dateStyle: "medium", timeStyle: "short" })}
                </span>
                {(event.venueName ?? event.city) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={9} />
                    {[event.venueName, event.city].filter(Boolean).join(" · ")}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--rule)" }}>
            {evItems.map((it) => (
              <MiniRow key={it.itemId} item={it} bumpRefresh={bumpRefresh} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function MiniRow({ item, bumpRefresh }: { item: Item; bumpRefresh: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function changeQty(newQty: number) {
    if (newQty < 1 || newQty > 10) return
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set("itemId", item.itemId)
      fd.set("quantity", String(newQty))
      const res = await updateCartQuantity(null, fd)
      if (!res.ok) setError(res.error)
      bumpRefresh()
    })
  }

  function remove() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set("itemId", item.itemId)
      const res = await removeCartItem(null, fd)
      if (!res.ok) setError(res.error)
      bumpRefresh()
    })
  }

  return (
    <div className="p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: "var(--mute)" }}
            >
              {item.typeName}
            </span>
            {item.lot.isHalfPrice && (
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                style={{ backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}
              >
                MEIA
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {item.lot.name}
          </p>
          <p className="mt-0.5 font-mono text-[11px]" style={{ color: "var(--mute)" }}>
            {centsToBRL(item.lot.priceCents)} cada
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-sm font-bold tabular-nums" style={{ color: "var(--ink)" }}>
            {centsToBRL(item.lineTotalCents)}
          </p>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="mt-1 inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-semibold transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
            style={{ color: "var(--mute)" }}
            aria-label="Remover"
          >
            <Trash2 size={11} />
            Remover
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div
          className="inline-flex items-center rounded-xl border"
          style={{ borderColor: "var(--rule)" }}
        >
          <button
            type="button"
            onClick={() => changeQty(item.quantity - 1)}
            disabled={pending || item.quantity <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-l-xl transition-colors hover:bg-black/5 disabled:opacity-40"
            style={{ color: "var(--ink-4)" }}
            aria-label="Diminuir"
          >
            <Minus size={14} />
          </button>
          <span
            className="flex h-10 min-w-[2.25rem] items-center justify-center font-mono text-sm font-bold"
            style={{ color: "var(--ink)" }}
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : item.quantity}
          </span>
          <button
            type="button"
            onClick={() => changeQty(item.quantity + 1)}
            disabled={pending || item.quantity >= 10}
            className="flex h-10 w-10 items-center justify-center rounded-r-xl transition-colors hover:bg-black/5 disabled:opacity-40"
            style={{ color: "var(--ink-4)" }}
            aria-label="Aumentar"
          >
            <Plus size={14} />
          </button>
        </div>
        {error && (
          <p className="text-[10px]" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
