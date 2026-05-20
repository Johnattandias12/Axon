"use client"

import { useEffect, useState } from "react"
import { Ticket } from "lucide-react"

const FAKE_SALES = [
  { name: "João Silva", time: "2 minutos atrás" },
  { name: "Maria Clara", time: "5 minutos atrás" },
  { name: "Carlos E.", time: "Agorinha mesmo" },
  { name: "Ana P.", time: "10 minutos atrás" },
  { name: "Felipe M.", time: "Agorinha mesmo" },
]

export function SalesPopup() {
  const [visible, setVisible] = useState(false)
  const [sale, setSale] = useState(FAKE_SALES[0])

  useEffect(() => {
    // Exibir primeiro pop-up após 5 segundos
    const initialTimeout = setTimeout(() => {
      setSale(FAKE_SALES[Math.floor(Math.random() * FAKE_SALES.length)])
      setVisible(true)
    }, 5000)

    // Esconder o popup após 4 segundos visível
    const hideInterval = setInterval(() => {
      setVisible(false)
    }, 12000) // a cada 12s, ele some/reaparece

    // Mostrar um novo popup a cada 15 segundos
    const showInterval = setInterval(() => {
      setSale(FAKE_SALES[Math.floor(Math.random() * FAKE_SALES.length)])
      setVisible(true)
    }, 15000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(hideInterval)
      clearInterval(showInterval)
    }
  }, [])

  if (!sale) return null

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 flex max-w-[300px] items-center gap-3 overflow-hidden rounded-xl border p-3 shadow-2xl backdrop-blur-md transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-10 opacity-0"
      }`}
      style={{
        backgroundColor: "rgba(18, 18, 20, 0.8)",
        borderColor: "var(--rule)",
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--pulse-soft)", color: "var(--pulse)" }}
      >
        <Ticket size={18} />
      </div>
      <div>
        <p className="text-sm font-bold text-white">
          <span style={{ color: "var(--pulse)" }}>{sale.name}</span> comprou um ingresso!
        </p>
        <p className="text-xs" style={{ color: "var(--mute)" }}>
          {sale.time}
        </p>
      </div>
    </div>
  )
}
