"use client"

import { useActionState, useState, useTransition } from "react"
import { Check, Loader2, Plus, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { addToCart, type ActionResult } from "@/app/carrinho/actions"

interface Props {
  lotId: string
  maxQuantity: number
  isAuthenticated: boolean
  eventSlug: string
}

export function AddToCartButton({ lotId, maxQuantity, isAuthenticated, eventSlug }: Props) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addToCart, null)
  const [pending, startTransition] = useTransition()
  const [justAdded, setJustAdded] = useState(false)

  if (!isAuthenticated) {
    return (
      <Link
        href={`/entrar?redirectTo=/eventos/${eventSlug}`}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
      >
        Entrar para comprar
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
    const fd = new FormData()
    fd.set("lotId", lotId)
    fd.set("quantity", "1")
    startTransition(() => {
      action(fd)
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1800)
  }

  const error = state && !state.ok ? state.error : null

  return (
    <div className="space-y-1.5">
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
            Adicionando…
          </>
        ) : justAdded ? (
          <>
            <Check size={12} />
            Adicionado
          </>
        ) : (
          <>
            <Plus size={12} />
            Adicionar
          </>
        )}
      </button>
      {justAdded && (
        <Link
          href="/carrinho"
          className="flex w-full items-center justify-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: "var(--pulse-deep)" }}
        >
          <ShoppingBag size={10} />
          Ir para o carrinho
        </Link>
      )}
      {error && (
        <p className="text-[10px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  )
}
