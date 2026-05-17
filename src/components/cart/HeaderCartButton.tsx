"use client"

import { ShoppingBag } from "lucide-react"
import { useCartUI } from "./CartUIProvider"

export function HeaderCartButton({ cartCount }: { cartCount: number }) {
  const { open } = useCartUI()
  return (
    <button
      type="button"
      onClick={open}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-black/5"
      style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
      aria-label="Abrir carrinho"
    >
      <ShoppingBag size={15} />
      {cartCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          {cartCount}
        </span>
      )}
    </button>
  )
}
