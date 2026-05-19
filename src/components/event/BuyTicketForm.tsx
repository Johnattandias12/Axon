"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { Loader2, ShieldCheck, Ticket, Minus, Plus, X } from "lucide-react"
import { buyDemo, type BuyDemoState } from "@/app/checkout/actions"
import { centsToBRL } from "@/lib/utils"
import Link from "next/link"

interface Props {
  lotId: string
  lotName: string
  typeName: string
  pricePerUnit: number
  maxQuantity: number
  isAuthenticated: boolean
  eventSlug: string
}

export function BuyTicketForm({
  lotId,
  lotName,
  typeName,
  pricePerUnit,
  maxQuantity,
  isAuthenticated,
  eventSlug,
}: Props) {
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [holderName, setHolderName] = useState("")
  const [holderCpf, setHolderCpf] = useState("")
  const [state, formAction] = useActionState<BuyDemoState, FormData>(buyDemo, null)
  const [pending, startTransition] = useTransition()
  const [affiliateCode, setAffiliateCode] = useState("")

  // Captura ?via= do URL no mount (persiste em sessionStorage) e registra clique
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const via = sp.get("via")
    if (via && /^[A-Z0-9]{4,12}$/.test(via)) {
      sessionStorage.setItem("axon_ref", via)
      setAffiliateCode(via)

      // Rastrear clique silenciosamente
      fetch("/api/affiliate/track", {
        method: "POST",
        body: JSON.stringify({ code: via, eventId: eventSlug }), // passamos slug provisório ou id se tivermos
      }).catch(() => {})

      return
    }
    const stored = sessionStorage.getItem("axon_ref")
    if (stored && /^[A-Z0-9]{4,12}$/.test(stored)) setAffiliateCode(stored)
  }, [eventSlug])

  // Pré-preenche titular com último uso (poupa digitação). Stored cru.
  useEffect(() => {
    const n = localStorage.getItem("axon_holder_name")
    if (n) setHolderName(n)
    const c = localStorage.getItem("axon_holder_cpf")
    if (c) setHolderCpf(c)
  }, [])

  // Persiste enquanto digita pra próxima compra já vir preenchido.
  useEffect(() => {
    if (holderName) localStorage.setItem("axon_holder_name", holderName)
  }, [holderName])
  useEffect(() => {
    if (holderCpf) localStorage.setItem("axon_holder_cpf", holderCpf)
  }, [holderCpf])

  const subtotal = pricePerUnit * qty
  const fee = Math.round(subtotal * 0.1)
  const total = subtotal + fee

  const cap = Math.min(maxQuantity, 6)

  function submit(formData: FormData) {
    startTransition(() => formAction(formData))
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={`/entrar?redirectTo=/eventos/${eventSlug}`}
        className="block w-full rounded-xl px-4 py-3 text-center text-sm font-bold transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
      >
        Entrar para comprar
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:scale-[1.02] focus-visible:outline-none"
        style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        disabled={maxQuantity <= 0}
      >
        {maxQuantity <= 0 ? "Esgotado" : "Quero ir"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="axon-fade-up relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 rounded-full p-1.5 transition-colors hover:bg-black/5"
              style={{ color: "var(--mute)" }}
            >
              <X size={16} />
            </button>

            <div className="border-b p-5" style={{ borderColor: "var(--rule)" }}>
              <div className="flex items-center gap-2" style={{ color: "var(--mute)" }}>
                <Ticket size={14} />
                <span className="text-xs font-medium tracking-wider uppercase">Vai. Viva.</span>
              </div>
              <p
                className="mt-1.5 text-lg font-bold tracking-tight"
                style={{ color: "var(--ink)" }}
              >
                {typeName} · {lotName}
              </p>
              <p
                className="font-mono text-2xl font-bold"
                style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
              >
                {pricePerUnit === 0 ? "Grátis" : centsToBRL(pricePerUnit)}
              </p>
            </div>

            <form action={submit} className="space-y-4 p-5">
              <input type="hidden" name="lotId" value={lotId} />
              <input type="hidden" name="quantity" value={qty} />
              {affiliateCode && <input type="hidden" name="affiliateCode" value={affiliateCode} />}

              {/* Quantity */}
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "var(--mute)" }}
                >
                  Quantidade
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-black/5"
                    style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
                  >
                    <Minus size={14} />
                  </button>
                  <span
                    className="min-w-[2rem] text-center font-mono text-lg font-bold"
                    style={{ color: "var(--ink)" }}
                  >
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(cap, qty + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-black/5"
                    style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs" style={{ color: "var(--mute)" }}>
                    Máx {cap}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="holderName"
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "var(--mute)" }}
                >
                  Nome do titular
                </label>
                <input
                  id="holderName"
                  name="holderName"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Nome completo"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none focus:border-[var(--pulse)]"
                  style={{
                    borderColor: "var(--rule)",
                    backgroundColor: "var(--paper-soft)",
                    color: "var(--ink)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="holderCpf"
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "var(--mute)" }}
                >
                  CPF
                </label>
                <input
                  id="holderCpf"
                  name="holderCpf"
                  value={holderCpf}
                  onChange={(e) => setHolderCpf(e.target.value)}
                  required
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none focus:border-[var(--pulse)]"
                  style={{
                    borderColor: "var(--rule)",
                    backgroundColor: "var(--paper-soft)",
                    color: "var(--ink)",
                  }}
                />
              </div>

              {/* Summary */}
              <div
                className="space-y-1.5 rounded-lg border p-3 text-xs"
                style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
              >
                <div className="flex justify-between" style={{ color: "var(--mute)" }}>
                  <span>Subtotal ({qty}×)</span>
                  <span>{centsToBRL(subtotal)}</span>
                </div>
                <div className="flex justify-between" style={{ color: "var(--mute)" }}>
                  <span>Taxa AXON (10%)</span>
                  <span>{centsToBRL(fee)}</span>
                </div>
                <div
                  className="flex justify-between border-t pt-1.5 text-sm font-bold"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                >
                  <span>Total</span>
                  <span className="font-mono">{centsToBRL(total)}</span>
                </div>
              </div>

              {state?.ok === false && (
                <p
                  className="rounded-lg border px-3 py-2 text-xs"
                  style={{
                    borderColor: "var(--danger)",
                    backgroundColor: "var(--danger-soft)",
                    color: "var(--danger)",
                  }}
                >
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:scale-[1.01] disabled:opacity-60"
                style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
              >
                {pending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Reservando teu lugar…
                  </>
                ) : (
                  <>Confirma. Te vejo lá.</>
                )}
              </button>

              <p
                className="flex items-center justify-center gap-1.5 text-[10px]"
                style={{ color: "var(--mute)" }}
              >
                <ShieldCheck size={11} />
                Modo demonstração · sem cobrança real
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
