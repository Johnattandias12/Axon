"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

const categories: { label: string; href: string; icon: React.ReactNode; tagline: string }[] = [
  {
    label: "Shows e Música",
    href: "/eventos?categoria=show",
    tagline: "Do indie ao mainstream",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    label: "Festas e Micareta",
    href: "/eventos?categoria=outro",
    tagline: "Carnaval o ano inteiro",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5.8 11.3 2 22l10.7-3.79" />
        <path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01" />
        <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
        <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" />
        <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" />
        <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
      </svg>
    ),
  },
  {
    label: "Vaquejada",
    href: "/eventos?categoria=outro&busca=vaquejada",
    tagline: "Tradição do sertão",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 18h18M6 18V8l3-4h6l3 4v10M10 22v-4h4v4" />
        <circle cx="9" cy="13" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Esportes",
    href: "/eventos?categoria=esporte",
    tagline: "Da arena ao estádio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20" />
      </svg>
    ),
  },
  {
    label: "Corrida de Rua",
    href: "/eventos?categoria=esporte&busca=corrida",
    tagline: "5k, 10k, meia e maratona",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="14" cy="4.5" r="1.5" />
        <path d="M9 21l3-6 3 2.5 1.5 3.5" />
        <path d="M12 15l-2-4 3.5-2 2.5 2.5 3 1" />
        <path d="M7 10l3-1" />
      </svg>
    ),
  },
  {
    label: "Futebol",
    href: "/eventos?categoria=esporte&busca=futebol",
    tagline: "Da várzea ao profissional",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7l4 3-1.5 4.5h-5L8 10z" />
        <path d="M12 7V3M16 10l3.5-1.8M14.5 14.5l2.7 2.9M9.5 14.5l-2.7 2.9M8 10L4.5 8.2" />
      </svg>
    ),
  },
  {
    label: "Futsal",
    href: "/eventos?categoria=esporte&busca=futsal",
    tagline: "Quadra, raça e gol",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
        <line x1="12" y1="6" x2="12" y2="18" />
        <circle cx="12" cy="12" r="2.2" />
        <path d="M2.5 9.5h2.5v5H2.5M21.5 9.5H19v5h2.5" />
      </svg>
    ),
  },
  {
    label: "Lutas e MMA",
    href: "/eventos?categoria=esporte&busca=luta",
    tagline: "Boxe, jiu-jitsu, octógono",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 9c0-1.7 1-3 3-3h5l3.5 3v5l-2 3h-7c-1.5 0-2.5-1-2.5-2.5z" />
        <path d="M11 14h3.5" />
        <path d="M7 10.5H5c-.8 0-1.5.7-1.5 1.5v2c0 .8.7 1.5 1.5 1.5h2" />
      </svg>
    ),
  },
  {
    label: "Gospel e Religioso",
    href: "/eventos?categoria=religioso",
    tagline: "Para celebrar a fé",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3v18M6 9h12" />
      </svg>
    ),
  },
  {
    label: "Stand-up e Comédia",
    href: "/eventos?categoria=show&q=comedia",
    tagline: "Rir é o melhor remédio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    label: "Cursos e Workshops",
    href: "/eventos?categoria=curso",
    tagline: "Aprender ao vivo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5a4 4 0 0 0 12 0v-5" />
      </svg>
    ),
  },
  {
    label: "Festivais",
    href: "/eventos?categoria=outro&q=festival",
    tagline: "Dias inteiros de experiência",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 22h20L12 2z" />
        <path d="M12 8v9M8 17h8" />
      </svg>
    ),
  },
  {
    label: "Forró e Sertanejo",
    href: "/eventos?categoria=show&q=forro",
    tagline: "Pisada que é nossa cara",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 12l3-9 3 9 3-6 3 12 3-9 3 9" />
      </svg>
    ),
  },
  {
    label: "Eletrônica",
    href: "/eventos?categoria=show&q=eletronica",
    tagline: "Pista até o sol nascer",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
]

export function CategoriesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  return (
    <div className="relative -mx-5 md:-mx-8">
      {/* Edge fades */}
      <div
        className="pointer-events-none absolute top-0 bottom-4 left-0 z-10 w-12 transition-opacity"
        style={{
          background: "linear-gradient(to right, var(--paper), transparent)",
          opacity: canScrollLeft ? 1 : 0,
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-0 right-0 bottom-4 z-10 w-12 transition-opacity"
        style={{
          background: "linear-gradient(to left, var(--paper), transparent)",
          opacity: canScrollRight ? 1 : 0,
        }}
        aria-hidden="true"
      />

      {/* Setas transparentes */}
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        aria-label="Anterior"
        className="absolute top-1/2 left-2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-110 disabled:pointer-events-none disabled:opacity-0"
        style={{
          backgroundColor: "color-mix(in srgb, var(--paper-pure) 70%, transparent)",
          borderColor: "var(--rule)",
          color: "var(--ink)",
        }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        aria-label="Próximo"
        className="absolute top-1/2 right-2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-110 disabled:pointer-events-none disabled:opacity-0"
        style={{
          backgroundColor: "color-mix(in srgb, var(--paper-pure) 70%, transparent)",
          borderColor: "var(--rule)",
          color: "var(--ink)",
        }}
      >
        <ChevronRight size={18} />
      </button>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-3 overflow-x-auto px-5 pb-4 md:px-8"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="group relative flex w-[180px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(200,255,0,0.3)]"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper-pure)",
              scrollSnapAlign: "start",
              aspectRatio: "1 / 1.15",
            }}
          >
            {/* Glow */}
            <div
              className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150"
              style={{
                background: "radial-gradient(circle, var(--pulse) 0%, transparent 70%)",
                opacity: 0.12,
              }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(135deg, transparent 0%, color-mix(in srgb, var(--pulse) 8%, transparent) 100%)",
              }}
              aria-hidden="true"
            />

            <div
              className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
              style={{
                backgroundColor: "color-mix(in srgb, var(--pulse) 12%, transparent)",
                color: "var(--pulse-deep)",
              }}
            >
              <span className="h-5 w-5">{cat.icon}</span>
            </div>

            <div className="relative z-10">
              <p className="text-[15px] leading-tight font-bold" style={{ color: "var(--ink)" }}>
                {cat.label}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: "var(--mute)" }}>
                {cat.tagline}
              </p>
              <div
                className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold opacity-60 transition-opacity group-hover:opacity-100"
                style={{ color: "var(--pulse-deep)" }}
              >
                Explorar
                <svg
                  className="h-3 w-3 transition-transform group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}
