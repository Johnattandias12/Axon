"use client"

import { useState } from "react"
import Link from "next/link"

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative z-[60] flex h-9 w-9 items-center justify-center rounded-full md:hidden"
        style={{ color: "var(--ink)" }}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
      >
        <div className="flex w-[18px] flex-col gap-[5px]">
          <span
            className="block h-[2px] rounded-full transition-all duration-300"
            style={{
              backgroundColor: "var(--ink)",
              transform: open ? "translateY(7px) rotate(45deg)" : "none",
              width: open ? "18px" : "18px",
            }}
          />
          <span
            className="block h-[2px] rounded-full transition-all duration-300"
            style={{
              backgroundColor: "var(--ink)",
              opacity: open ? 0 : 1,
              width: "12px",
            }}
          />
          <span
            className="block h-[2px] rounded-full transition-all duration-300"
            style={{
              backgroundColor: "var(--ink)",
              transform: open ? "translateY(-7px) rotate(-45deg)" : "none",
              width: open ? "18px" : "15px",
            }}
          />
        </div>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-50 flex h-full w-[280px] flex-col overflow-y-auto transition-transform duration-300 ease-out md:hidden"
        style={{
          backgroundColor: "var(--paper)",
          borderLeft: "1px solid var(--rule)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="flex h-[58px] items-center justify-end px-5">
          <button
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: "var(--ink)" }}
            aria-label="Fechar menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-5 pt-4">
          {[
            { label: "Eventos", href: "/eventos" },
            { label: "Organizadores", href: "#organizadores" },
            { label: "Minha Conta", href: "/minha-conta" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-semibold transition-colors"
              style={{ color: "var(--ink)" }}
            >
              {label}
            </Link>
          ))}

          <div className="my-3 h-px" style={{ backgroundColor: "var(--rule)" }} />

          <a
            href={`https://wa.me/5584981235396?text=${encodeURIComponent("Olá! Preciso de ajuda com a AXON.")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-semibold transition-colors"
            style={{ color: "var(--mute)" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: "#25D366" }}
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Suporte
          </a>
        </nav>

        <div className="border-t p-5" style={{ borderColor: "var(--rule)" }}>
          <Link
            href="/entrar"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-[15px] font-bold transition-colors"
            style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
          >
            Entrar / Criar conta
          </Link>
        </div>
      </div>
    </>
  )
}
