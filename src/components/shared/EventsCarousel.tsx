"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Paleta AXON: variações de gradiente em torno de ink + pulse.
// Cada card escolhe um "tom" diferente mas todos pertencem à mesma família visual.
const GRADIENTS = {
  vivid: "linear-gradient(135deg, #1a2200 0%, #0d1500 50%, #050b00 100%)", // pulse-forte
  deep: "linear-gradient(135deg, #0a0a0b 0%, #14140d 50%, #1f1e08 100%)", // pulse-sutil
  glow: "linear-gradient(160deg, #0a0a0b 0%, #1c2400 60%, #0a0a0b 100%)", // pulse intenso
  noir: "linear-gradient(135deg, #16161a 0%, #0a0a0b 50%, #050507 100%)", // monocromático
} as const

const events = [
  {
    id: "carnaxelita-2026",
    title: "Carnaxelita 2026",
    category: "Micareta",
    date: "12 a 15 Out 2026",
    location: "Currais Novos, RN",
    price: "A partir de R$ 120",
    urgent: true,
    gradient: GRADIENTS.vivid,
  },
  {
    id: "festa-santana-caico-2026",
    title: "Festa de Santana",
    category: "Tradicional",
    date: "25 a 30 Jul 2026",
    location: "Caicó, RN",
    price: "Gratuito a R$ 180",
    urgent: false,
    gradient: GRADIENTS.deep,
  },
  {
    id: "carnatal-2026",
    title: "Carnatal 2026",
    category: "Carnaval",
    date: "Dez 2026",
    location: "Natal, RN",
    price: "A partir de R$ 200",
    urgent: false,
    gradient: GRADIENTS.glow,
  },
  {
    id: "vaquejada-currais-novos-2026",
    title: "Vaquejada de Currais Novos",
    category: "Vaquejada",
    date: "04 a 07 Ago 2026",
    location: "Currais Novos, RN",
    price: "R$ 80 a R$ 300",
    urgent: false,
    gradient: GRADIENTS.vivid,
  },
  {
    id: "gospel-rn-2026",
    title: "Festival Gospel RN",
    category: "Gospel",
    date: "28 e 29 Jun 2026",
    location: "Natal, RN",
    price: "Gratuito e VIP R$ 80",
    urgent: false,
    gradient: GRADIENTS.noir,
  },
  {
    id: "vaquejada-mossoro-2026",
    title: "Vaquejada de Mossoró",
    category: "Vaquejada",
    date: "Set 2026",
    location: "Mossoró, RN",
    price: "R$ 90 a R$ 250",
    urgent: false,
    gradient: GRADIENTS.deep,
  },
]

const PULSE = "#c8ff00"

export function EventsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const amount = 340
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className="absolute top-1/2 left-0 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-all disabled:pointer-events-none disabled:opacity-0"
        style={{
          backgroundColor: "var(--paper-pure)",
          borderColor: "var(--rule)",
          color: "var(--ink)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
        }}
        aria-label="Anterior"
      >
        <ChevronLeft size={17} />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className="absolute top-1/2 right-0 z-10 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-all disabled:pointer-events-none disabled:opacity-0"
        style={{
          backgroundColor: "var(--paper-pure)",
          borderColor: "var(--rule)",
          color: "var(--ink)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
        }}
        aria-label="Próximo"
      >
        <ChevronRight size={17} />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-5 overflow-x-auto pb-4"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/eventos/${event.id}`}
            className="group relative shrink-0 overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(200,255,0,0.25)]"
            style={{
              width: "300px",
              scrollSnapAlign: "start",
              background: event.gradient,
              border: "1px solid rgba(200,255,0,0.08)",
            }}
          >
            {/* Pulse line top */}
            <div
              className="pointer-events-none absolute top-0 right-0 left-0 h-[2px] opacity-60 transition-opacity group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, var(--pulse) 50%, transparent 100%)",
              }}
              aria-hidden="true"
            />

            {/* Card image area */}
            <div className="relative p-5 pb-0" style={{ height: "180px" }}>
              {/* Accent glow (pulse) */}
              <div
                className="pointer-events-none absolute inset-0 opacity-40 transition-opacity group-hover:opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 20% 30%, rgba(200,255,0,0.35) 0%, transparent 55%)",
                }}
              />

              {/* Category badge */}
              <span
                className="relative z-10 inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase"
                style={{
                  borderColor: "rgba(200,255,0,0.3)",
                  backgroundColor: "rgba(200,255,0,0.1)",
                  color: PULSE,
                }}
              >
                {event.category}
              </span>

              {event.urgent && (
                <span
                  className="absolute top-5 right-5 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    backgroundColor: "rgba(200,255,0,0.12)",
                    color: PULSE,
                    border: "1px solid rgba(200,255,0,0.3)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full"
                    style={{ backgroundColor: PULSE, boxShadow: `0 0 8px ${PULSE}` }}
                  />
                  LIMITADO
                </span>
              )}
            </div>

            {/* Card content */}
            <div className="relative p-5">
              <h3 className="mb-1.5 text-[17px] leading-tight font-bold tracking-[-0.02em] text-white">
                {event.title}
              </h3>
              <p className="mb-4 text-[13px] text-white/50">
                {event.date} · {event.location}
              </p>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] tracking-wider text-white/40 uppercase">A partir de</p>
                  <p className="text-[15px] font-bold text-white">{event.price}</p>
                </div>
                <span
                  className="rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all group-hover:scale-105"
                  style={{
                    backgroundColor: PULSE,
                    color: "#0A0A0B",
                    boxShadow: "0 4px 16px -4px rgba(200,255,0,0.4)",
                  }}
                >
                  Ver ingresso
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}
