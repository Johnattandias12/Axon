"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

const events = [
  {
    id: "carnaxelita-2026",
    title: "Carnaxelita 2026",
    category: "Micareta",
    date: "12 a 15 Out 2026",
    location: "Currais Novos, RN",
    price: "A partir de R$ 120",
    badge: "Lote 2 restrito",
    urgent: true,
    gradient: "linear-gradient(135deg, #0d1a00 0%, #081000 50%, #050B00 100%)",
    accent: "#c8ff00",
  },
  {
    id: "festa-santana-caico-2026",
    title: "Festa de Santana",
    category: "Tradicional",
    date: "25 a 30 Jul 2026",
    location: "Caicó, RN",
    price: "Gratuito a R$ 180",
    badge: "Inscrições abertas",
    urgent: false,
    gradient: "linear-gradient(135deg, #1c0a3d 0%, #0e0520 50%, #0A0A0B 100%)",
    accent: "#7C3AED",
  },
  {
    id: "carnatal-2026",
    title: "Carnatal 2026",
    category: "Carnaval",
    date: "Dez 2026",
    location: "Natal, RN",
    price: "A partir de R$ 200",
    badge: "Em breve",
    urgent: false,
    gradient: "linear-gradient(135deg, #021a3d 0%, #000e20 50%, #0A0A0B 100%)",
    accent: "#2D7AF6",
  },
  {
    id: "vaquejada-currais-novos-2026",
    title: "Vaquejada de Currais Novos",
    category: "Vaquejada",
    date: "04 a 07 Ago 2026",
    location: "Currais Novos, RN",
    price: "R$ 80 a R$ 300",
    badge: "Lote 1 disponível",
    urgent: false,
    gradient: "linear-gradient(135deg, #0d1a00 0%, #081000 50%, #050B00 100%)",
    accent: "#c8ff00",
  },
  {
    id: "gospel-rn-2026",
    title: "Festival Gospel RN",
    category: "Gospel",
    date: "28 e 29 Jun 2026",
    location: "Natal, RN",
    price: "Gratuito e VIP R$ 80",
    badge: "Abertas",
    urgent: false,
    gradient: "linear-gradient(135deg, #002a1a 0%, #00150d 50%, #0A0A0B 100%)",
    accent: "#10B981",
  },
  {
    id: "vaquejada-mossoro-2026",
    title: "Vaquejada de Mossoró",
    category: "Vaquejada",
    date: "Set 2026",
    location: "Mossoró, RN",
    price: "R$ 90 a R$ 250",
    badge: "Em breve",
    urgent: false,
    gradient: "linear-gradient(135deg, #001a2a 0%, #000d15 50%, #0A0A0B 100%)",
    accent: "#2D7AF6",
  },
]

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
            className="group shrink-0 overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
            style={{
              width: "300px",
              scrollSnapAlign: "start",
              background: event.gradient,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Card image area */}
            <div className="relative p-5 pb-0" style={{ height: "180px" }}>
              {/* Accent glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  background: `radial-gradient(circle at 20% 30%, ${event.accent}60 0%, transparent 60%)`,
                }}
              />

              {/* Category badge */}
              <span
                className="relative z-10 inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase"
                style={{
                  borderColor: `${event.accent}40`,
                  backgroundColor: `${event.accent}18`,
                  color: event.accent,
                }}
              >
                {event.category}
              </span>

              {event.urgent && (
                <span
                  className="absolute top-5 right-5 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    backgroundColor: `${event.accent}20`,
                    color: event.accent,
                    border: `1px solid ${event.accent}30`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full"
                    style={{ backgroundColor: event.accent }}
                  />
                  LIMITADO
                </span>
              )}
            </div>

            {/* Card content */}
            <div className="p-5">
              <h3 className="mb-1.5 text-[17px] leading-tight font-bold tracking-[-0.02em] text-white">
                {event.title}
              </h3>
              <p className="mb-4 text-[13px] text-white/40">
                {event.date} · {event.location}
              </p>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] tracking-wider text-white/30 uppercase">A partir de</p>
                  <p className="text-[15px] font-bold text-white">{event.price}</p>
                </div>
                <span
                  className="rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all group-hover:opacity-90"
                  style={{
                    backgroundColor: event.accent,
                    color: event.accent === "#c8ff00" ? "#0A0A0B" : "#0A0A0B",
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
