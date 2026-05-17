"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, Plus } from "lucide-react"
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
  const [pending, startTransition] = useTransition()
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { open, bumpRefresh } = useCartUI()

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
    fd.set("quantity", "1")
    startTransition(async () => {
      const result = await addToCart(null, fd)
      if (result.ok) {
        setJustAdded(true)
        bumpRefresh()
        setTimeout(() => {
          open()
          setJustAdded(false)
        }, 350)
      } else {
        setError(result.error)
      }
    })
  }

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
            Adicionando
          </>
        ) : justAdded ? (
          <>
            <Check size={12} />
            No carrinho
          </>
        ) : (
          <>
            <Plus size={12} />
            Quero ir
          </>
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
