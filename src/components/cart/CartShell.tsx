"use client"

import { CartUIProvider } from "./CartUIProvider"
import { CartDrawer } from "./CartDrawer"

export function CartShell({ children }: { children: React.ReactNode }) {
  return (
    <CartUIProvider>
      {children}
      <CartDrawer />
    </CartUIProvider>
  )
}
