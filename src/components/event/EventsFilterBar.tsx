"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, MapPin, ArrowUpDown, Loader2 } from "lucide-react"

interface Props {
  categories: { value: string; label: string }[]
  cidades: string[]
  initial: {
    busca: string
    categoria: string
    cidade: string
    ordem: string
  }
}

const ORDER_OPTIONS = [
  { value: "data", label: "Mais próximos" },
  { value: "preco", label: "Menor preço" },
  { value: "mais-vendidos", label: "Mais vendidos" },
]

export function EventsFilterBar({ categories, cidades, initial }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [busca, setBusca] = useState(initial.busca)

  function apply(updates: Record<string, string>) {
    const next = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    const qs = next.toString()
    startTransition(() => {
      router.push(`/eventos${qs ? `?${qs}` : ""}`)
    })
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    apply({ busca })
  }

  return (
    <div className="space-y-3">
      {/* Linha 1: busca + cidade + ordenação */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_220px_200px]">
        <form
          onSubmit={submitSearch}
          className="flex items-center gap-2 rounded-xl border px-3 transition-colors focus-within:border-[var(--pulse)]"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--mute)" }} />
          ) : (
            <Search size={14} style={{ color: "var(--mute)" }} />
          )}
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do evento…"
            className="flex-1 bg-transparent py-2.5 text-sm outline-none"
            style={{ color: "var(--ink)" }}
          />
          {busca && (
            <button
              type="button"
              onClick={() => {
                setBusca("")
                apply({ busca: "" })
              }}
              className="text-xs"
              style={{ color: "var(--mute)" }}
            >
              limpar
            </button>
          )}
        </form>

        <div
          className="flex items-center gap-2 rounded-xl border px-3"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <MapPin size={14} style={{ color: "var(--mute)" }} />
          <select
            value={initial.cidade}
            onChange={(e) => apply({ cidade: e.target.value })}
            className="flex-1 cursor-pointer appearance-none bg-transparent py-2.5 text-sm outline-none"
            style={{ color: "var(--ink)" }}
          >
            <option value="">Todas as cidades</option>
            {cidades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div
          className="flex items-center gap-2 rounded-xl border px-3"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <ArrowUpDown size={14} style={{ color: "var(--mute)" }} />
          <select
            value={initial.ordem}
            onChange={(e) => apply({ ordem: e.target.value })}
            className="flex-1 cursor-pointer appearance-none bg-transparent py-2.5 text-sm outline-none"
            style={{ color: "var(--ink)" }}
          >
            {ORDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Linha 2: chips de categoria */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = initial.categoria === cat.value || (!initial.categoria && !cat.value)
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => apply({ categoria: cat.value })}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.03]"
              style={{
                borderColor: active ? "var(--ink)" : "var(--rule)",
                backgroundColor: active ? "var(--ink)" : "var(--paper-pure)",
                color: active ? "var(--pulse)" : "var(--ink-4)",
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
