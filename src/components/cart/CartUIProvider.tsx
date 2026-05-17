"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

type CartUI = {
  isOpen: boolean
  open: () => void
  close: () => void
  refreshTick: number
  bumpRefresh: () => void
}

const CartUIContext = createContext<CartUI | null>(null)

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const bumpRefresh = useCallback(() => setRefreshTick((t) => t + 1), [])

  const value = useMemo(
    () => ({ isOpen, open, close, refreshTick, bumpRefresh }),
    [isOpen, open, close, refreshTick, bumpRefresh]
  )

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>
}

export function useCartUI() {
  const ctx = useContext(CartUIContext)
  if (!ctx) throw new Error("useCartUI precisa estar dentro de CartUIProvider")
  return ctx
}
