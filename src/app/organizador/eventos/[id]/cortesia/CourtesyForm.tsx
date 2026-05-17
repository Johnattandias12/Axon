"use client"

import { useActionState, useMemo, useState } from "react"
import { toast } from "sonner"
import { issueCourtesies, type IssueCourtesyState } from "./actions"
import { Loader2, Gift, Send } from "lucide-react"

interface Lot {
  id: string
  name: string
  typeName: string
  price_cents: number
  quantity_total: number
  quantity_sold: number
  quantity_reserved: number
  is_half_price: boolean
}

interface Props {
  eventId: string
  lots: Lot[]
}

interface ParsedItem {
  name: string
  cpf: string
  email: string
}

/**
 * Form de emissão de cortesias em lote.
 * Aceita textarea com formato livre: "Nome, CPF, Email" (1 por linha).
 * Aceita também ; e | como separadores.
 */
export function CourtesyForm({ eventId, lots }: Props) {
  const [lotId, setLotId] = useState(lots[0]?.id ?? "")
  const [text, setText] = useState("")
  const [state, formAction, pending] = useActionState<IssueCourtesyState, FormData>(
    async (prev, fd) => {
      const res = await issueCourtesies(prev, fd)
      if (res?.ok) {
        toast.success(`${res.issued} cortesia${res.issued > 1 ? "s emitidas" : " emitida"}`)
        setText("")
      } else if (res?.ok === false) {
        toast.error(res.error)
      }
      return res
    },
    null
  )

  const parsed = useMemo(() => parseLines(text), [text])
  const selectedLot = lots.find((l) => l.id === lotId)
  const available = selectedLot
    ? selectedLot.quantity_total - selectedLot.quantity_sold - selectedLot.quantity_reserved
    : 0
  const overLimit = parsed.length > available

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border p-5"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
    >
      <div className="flex items-center gap-2">
        <Gift size={15} style={{ color: "var(--pulse-deep)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Emitir lote de cortesias
        </h2>
      </div>

      <div>
        <label
          htmlFor="lot"
          className="mb-1.5 block text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--mute)" }}
        >
          Lote
        </label>
        <select
          id="lot"
          value={lotId}
          onChange={(e) => setLotId(e.target.value)}
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-pure)",
            color: "var(--ink)",
          }}
          required
        >
          {lots.map((l) => {
            const avail = l.quantity_total - l.quantity_sold - l.quantity_reserved
            return (
              <option key={l.id} value={l.id}>
                {l.typeName} · {l.name} — {avail} disponíveis
              </option>
            )
          })}
        </select>
      </div>

      <div>
        <label
          htmlFor="recipients"
          className="mb-1.5 block text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--mute)" }}
        >
          Convidados (1 por linha — Nome, CPF, Email)
        </label>
        <textarea
          id="recipients"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Maria da Silva, 12345678900, maria@exemplo.com\nJoão Souza, 09876543210, joao@exemplo.com`}
          rows={6}
          className="w-full rounded-xl border px-3 py-2.5 font-mono text-xs leading-relaxed"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper-soft)",
            color: "var(--ink)",
          }}
        />
        <div
          className="mt-2 flex items-center justify-between text-[11px]"
          style={{ color: "var(--mute)" }}
        >
          <span>
            <strong style={{ color: "var(--ink)" }}>{parsed.length}</strong> convidado
            {parsed.length === 1 ? "" : "s"} válido{parsed.length === 1 ? "" : "s"} de {available}{" "}
            disponíveis
          </span>
          {overLimit && <span style={{ color: "var(--danger)" }}>Excede o estoque do lote</span>}
        </div>
      </div>

      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({ eventId, lotId, items: parsed })}
      />

      <button
        type="submit"
        disabled={pending || parsed.length === 0 || overLimit || !lotId}
        className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
      >
        {pending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Emitindo…
          </>
        ) : (
          <>
            <Send size={14} />
            Emitir{" "}
            {parsed.length > 0
              ? `${parsed.length} cortesia${parsed.length > 1 ? "s" : ""}`
              : "cortesias"}
          </>
        )}
      </button>

      {state?.ok === false && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </form>
  )
}

function parseLines(text: string): ParsedItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,;|\t]/).map((p) => p.trim())
      const [name, cpf, email] = [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""]
      return { name, cpf, email }
    })
    .filter((p) => p.name.length >= 2 && p.cpf.length >= 3)
}
