"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, Plus, Minus } from "lucide-react"
import Link from "next/link"
import { addToCart } from "@/app/carrinho/actions"
import { useCartUI } from "@/components/cart/CartUIProvider"

interface Props {
  lotId: string
  maxQuantity: number
  isAuthenticated: boolean
  eventSlug: string
}

export function AddToCartButton({ lotId, maxQuantity, isAuthenticated, eventSlug }: Props) {
  const [qty, setQty] = useState(1)
  const [pending, startTransition] = useTransition()
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { bumpRefresh } = useCartUI()
  const cap = Math.min(maxQuantity, 6)

  if (!isAuthenticated) {
    return (
      <Link
        href={`/entrar?redirectTo=/eventos/${eventSlug}`}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
      >
        Entrar pra ir
      </Link>
    )
  }

  if (maxQuantity <= 0) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-lg px-3 py-2 text-xs font-bold opacity-50"
        style={{ backgroundColor: "var(--paper-soft)", color: "var(--mute)" }}
      >
        Esgotado
      </button>
    )
  }

  function add() {
    setError(null)
    const fd = new FormData()
    fd.set("lotId", lotId)
    fd.set("quantity", String(qty))
    startTransition(async () => {
      const result = await addToCart(null, fd)
      if (result.ok) {
        setJustAdded(true)
        bumpRefresh()
        setTimeout(() => {
          window.location.href = "/carrinho"
        }, 300)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      {/* Seletor de quantidade minimalista à direita */}
      <div
        className="flex items-center justify-between rounded-lg border p-1.5 px-2"
        style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-soft)" }}
      >
        <span
          className="text-[10px] font-bold tracking-wider uppercase"
          style={{ color: "var(--mute)" }}
        >
          Quantidade
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-black/5"
            style={{ border: "1px solid var(--rule)", color: "var(--ink)" }}
          >
            <Minus size={9} />
          </button>
          <span
            className="min-w-[1.2rem] text-center font-mono text-xs font-bold"
            style={{ color: "var(--ink)" }}
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty(Math.min(cap, qty + 1))}
            className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-black/5"
            style={{ border: "1px solid var(--rule)", color: "var(--ink)" }}
          >
            <Plus size={9} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={add}
        disabled={pending}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
        style={{
          backgroundColor: justAdded ? "var(--success)" : "var(--pulse)",
          color: justAdded ? "var(--paper)" : "var(--pulse-ink)",
        }}
      >
        {pending ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Adicionando
          </>
        ) : justAdded ? (
          <>
            <Check size={12} />
            No carrinho
          </>
        ) : (
          <>Quero ir</>
        )}
      </button>
      {error && (
        <p className="text-[10px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  )
}
