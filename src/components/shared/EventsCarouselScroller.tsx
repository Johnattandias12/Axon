"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CarouselItem {
  id: string
  slug: string
  title: string
  categoryLabel: string
  bannerUrl: string | null
  gradient: string
  dateLabel: string
  location: string
  price: string
  isUrgent: boolean
}

const PULSE = "#c8ff00"

export function EventsCarouselScroller({ items }: { items: CarouselItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(items.length > 1)

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
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className="absolute top-1/2 left-0 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-all disabled:pointer-events-none disabled:opacity-0 md:flex"
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

      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className="absolute top-1/2 right-0 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-all disabled:pointer-events-none disabled:opacity-0 md:flex"
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

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-4 overflow-x-auto pb-4 sm:gap-5"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map((event) => (
          <Link
            key={event.id}
            href={`/eventos/${event.slug}`}
            className="group relative shrink-0 overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(200,255,0,0.25)]"
            style={{
              width: "min(85vw, 300px)",
              scrollSnapAlign: "start",
              background: event.gradient,
              border: "1px solid rgba(200,255,0,0.08)",
            }}
          >
            <div
              className="pointer-events-none absolute top-0 right-0 left-0 h-[2px] opacity-60 transition-opacity group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, var(--pulse) 50%, transparent 100%)",
              }}
              aria-hidden="true"
            />

            <div className="relative" style={{ height: "180px" }}>
              {event.bannerUrl ? (
                <Image
                  src={event.bannerUrl}
                  alt={event.title}
                  fill
                  sizes="(max-width: 640px) 85vw, 300px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div
                  className="pointer-events-none absolute inset-0 opacity-40 transition-opacity group-hover:opacity-60"
                  style={{
                    background:
                      "radial-gradient(circle at 20% 30%, rgba(200,255,0,0.35) 0%, transparent 55%)",
                  }}
                />
              )}

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
                style={{
                  background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%)",
                }}
                aria-hidden="true"
              />

              <span
                className="absolute top-4 left-4 z-10 inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-sm"
                style={{
                  borderColor: "rgba(200,255,0,0.3)",
                  backgroundColor: "rgba(10,10,11,0.55)",
                  color: PULSE,
                }}
              >
                {event.categoryLabel}
              </span>

              {event.isUrgent && (
                <span
                  className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm"
                  style={{
                    backgroundColor: "rgba(10,10,11,0.55)",
                    color: PULSE,
                    border: "1px solid rgba(200,255,0,0.3)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full"
                    style={{ backgroundColor: PULSE, boxShadow: `0 0 8px ${PULSE}` }}
                  />
                  ÚLTIMOS
                </span>
              )}
            </div>

            <div className="relative p-5">
              <h3 className="mb-1.5 line-clamp-2 text-[17px] leading-tight font-bold tracking-[-0.02em] text-white">
                {event.title}
              </h3>
              <p className="mb-4 truncate text-[13px] text-white/50">
                {event.dateLabel}
                {event.location ? ` · ${event.location}` : ""}
              </p>

              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] tracking-wider text-white/40 uppercase">Ingresso</p>
                  <p className="truncate text-[15px] font-bold text-white">{event.price}</p>
                </div>
                <span
                  className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all group-hover:scale-105"
                  style={{
                    backgroundColor: PULSE,
                    color: "#0A0A0B",
                    boxShadow: "0 4px 16px -4px rgba(200,255,0,0.4)",
                  }}
                >
                  Ver
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
