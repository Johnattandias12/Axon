"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { centsToBRL } from "@/lib/utils"
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react"

type TicketLot = {
  id: string
  name: string
  price_cents: number
  quantity_total: number
  is_half_price: boolean
  position: number
  starts_at: string
  ends_at: string | null
}

type TicketType = {
  id: string
  name: string
  position: number
  ticket_lots: TicketLot[] | null
}

interface Props {
  eventId: string
  initialTypes: TicketType[]
}

const typeSchema = z.object({ name: z.string().min(1, "Nome obrigatório") })
const lotSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  price: z.string().min(1, "Preço obrigatório"),
  quantity: z.coerce.number().min(1, "Quantidade mínima: 1"),
  is_half_price: z.boolean(),
  starts_at: z.string().min(1, "Data de início obrigatória"),
  ends_at: z.string().optional(),
})

type TypeForm = z.infer<typeof typeSchema>
type LotForm = z.infer<typeof lotSchema>

export function LotsManager({ eventId, initialTypes }: Props) {
  const router = useRouter()
  const [types, setTypes] = useState<TicketType[]>(initialTypes)
  const [addingType, setAddingType] = useState(false)
  const [addingLotForType, setAddingLotForType] = useState<string | null>(null)
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [editingLotId, setEditingLotId] = useState<string | null>(null)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(initialTypes.map((t) => t.id))
  )

  const typeForm = useForm<TypeForm>({ resolver: zodResolver(typeSchema) })
  const lotForm = useForm<LotForm>({
    resolver: zodResolver(lotSchema),
    defaultValues: { is_half_price: false },
  })

  const totalTickets = types
    .flatMap((t) => t.ticket_lots ?? [])
    .reduce((s, l) => s + l.quantity_total, 0)
  const halfTickets = types
    .flatMap((t) => t.ticket_lots ?? [])
    .filter((l) => l.is_half_price)
    .reduce((s, l) => s + l.quantity_total, 0)
  const halfPct = totalTickets > 0 ? Math.round((halfTickets / totalTickets) * 100) : 0
  const halfOk = halfPct >= 40

  const saveType = async (data: TypeForm) => {
    const supabase = createClient()

    if (editingTypeId) {
      await supabase.from("ticket_types").update({ name: data.name }).eq("id", editingTypeId)
      setTypes((prev) => prev.map((t) => (t.id === editingTypeId ? { ...t, name: data.name } : t)))
      setEditingTypeId(null)
      typeForm.reset()
      return
    }

    const { data: newType, error } = await supabase
      .from("ticket_types")
      .insert({ event_id: eventId, name: data.name, position: types.length })
      .select("id, name, position")
      .single()

    if (error || !newType) return
    const fullType: TicketType = { ...newType, ticket_lots: [] }
    setTypes((prev) => [...prev, fullType])
    setExpandedTypes((prev) => new Set([...prev, newType.id]))
    setAddingType(false)
    typeForm.reset()
  }

  const deleteType = async (typeId: string) => {
    const supabase = createClient()
    await supabase.from("ticket_types").delete().eq("id", typeId)
    setTypes((prev) => prev.filter((t) => t.id !== typeId))
  }

  const saveLot = async (typeId: string, data: LotForm) => {
    const supabase = createClient()
    const priceCents = Math.round(parseFloat(data.price.replace(",", ".")) * 100)

    const lotData = {
      name: data.name,
      price_cents: priceCents,
      quantity_total: data.quantity,
      is_half_price: data.is_half_price,
      starts_at: new Date(data.starts_at).toISOString(),
      ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
    }

    if (editingLotId) {
      await supabase.from("ticket_lots").update(lotData).eq("id", editingLotId)
      setTypes((prev) =>
        prev.map((t) =>
          t.id === typeId
            ? {
                ...t,
                ticket_lots:
                  t.ticket_lots?.map((l) => (l.id === editingLotId ? { ...l, ...lotData } : l)) ??
                  [],
              }
            : t
        )
      )
      setEditingLotId(null)
      lotForm.reset()
      router.refresh()
      return
    }

    const { data: newLot, error } = await supabase
      .from("ticket_lots")
      .insert({
        ticket_type_id: typeId,
        event_id: eventId,
        ...lotData,
        position: types.find((t) => t.id === typeId)?.ticket_lots?.length ?? 0,
      })
      .select("id, name, price_cents, quantity_total, is_half_price, position, starts_at, ends_at")
      .single()

    if (error || !newLot) return

    setTypes((prev) =>
      prev.map((t) =>
        t.id === typeId ? { ...t, ticket_lots: [...(t.ticket_lots ?? []), newLot] } : t
      )
    )
    setAddingLotForType(null)
    lotForm.reset()
    router.refresh()
  }

  const deleteLot = async (typeId: string, lotId: string) => {
    const supabase = createClient()
    await supabase.from("ticket_lots").delete().eq("id", lotId)
    setTypes((prev) =>
      prev.map((t) =>
        t.id === typeId
          ? { ...t, ticket_lots: (t.ticket_lots ?? []).filter((l) => l.id !== lotId) }
          : t
      )
    )
    router.refresh()
  }

  const toggleExpand = (id: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Resumo meia-entrada */}
      {totalTickets > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl border p-3"
          style={{
            borderColor: halfOk ? "var(--success)" : "var(--warning)",
            backgroundColor: halfOk ? "rgba(0,185,107,0.05)" : "rgba(232,148,0,0.05)",
          }}
        >
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              Meia-entrada: {halfPct}%{" "}
              <span style={{ color: halfOk ? "var(--success)" : "var(--warning)" }}>
                {halfOk ? "✓ OK" : "— mínimo 40%"}
              </span>
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
              {halfTickets} de {totalTickets} ingressos
            </p>
          </div>
        </div>
      )}

      {/* Tipos */}
      {types.map((type) => (
        <div
          key={type.id}
          className="rounded-xl border"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
        >
          <div
            className="flex cursor-pointer items-center gap-3 p-4"
            onClick={() => toggleExpand(type.id)}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                {type.name}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
                {(type.ticket_lots ?? []).length} lotes ·{" "}
                {(type.ticket_lots ?? []).reduce((s, l) => s + l.quantity_total, 0)} ingressos
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingTypeId(type.id)
                  typeForm.reset({ name: type.name })
                }}
                className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
                style={{ color: "var(--ink-3)" }}
                title="Editar tipo"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteType(type.id)
                }}
                className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
                style={{ color: "var(--danger)" }}
                title="Remover tipo"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {expandedTypes.has(type.id) ? (
              <ChevronUp size={15} style={{ color: "var(--mute)" }} />
            ) : (
              <ChevronDown size={15} style={{ color: "var(--mute)" }} />
            )}
          </div>

          {expandedTypes.has(type.id) && (
            <div
              className="space-y-3 border-t px-4 pt-3 pb-4"
              style={{ borderColor: "var(--rule)" }}
            >
              {(type.ticket_lots ?? [])
                .sort((a, b) => a.position - b.position)
                .map((lot) => (
                  <div
                    key={lot.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                    style={{ borderColor: "var(--rule)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                        {lot.name}
                        {lot.is_half_price && (
                          <span
                            className="ml-2 rounded px-1.5 py-0.5 text-xs"
                            style={{
                              backgroundColor: "var(--warning-soft)",
                              color: "var(--warning)",
                            }}
                          >
                            Meia
                          </span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: "var(--mute)" }}>
                        {lot.quantity_total} ingressos ·{" "}
                        {lot.price_cents === 0 ? "Grátis" : centsToBRL(lot.price_cents)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingLotId(lot.id)
                          lotForm.reset({
                            name: lot.name,
                            price: (lot.price_cents / 100).toFixed(2).replace(".", ","),
                            quantity: lot.quantity_total,
                            is_half_price: lot.is_half_price,
                            starts_at: lot.starts_at.slice(0, 16),
                            ends_at: lot.ends_at ? lot.ends_at.slice(0, 16) : undefined,
                          })
                        }}
                        className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
                        style={{ color: "var(--ink-3)" }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteLot(type.id, lot.id)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
                        style={{ color: "var(--danger)" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

              {addingLotForType === type.id || editingLotId ? (
                <form
                  onSubmit={lotForm.handleSubmit((data) => saveLot(type.id, data))}
                  className="space-y-3 rounded-xl border p-4"
                  style={{ borderColor: "var(--pulse)" }}
                >
                  <p
                    className="text-xs font-semibold tracking-wider uppercase"
                    style={{ color: "var(--mute)", letterSpacing: "0.1em" }}
                  >
                    {editingLotId ? "Editar lote" : "Novo lote"}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <LotField label="Nome" error={lotForm.formState.errors.name?.message}>
                      <Input {...lotForm.register("name")} placeholder='Ex: "1º lote"' autoFocus />
                    </LotField>
                    <LotField label="Preço (R$)" error={lotForm.formState.errors.price?.message}>
                      <Input {...lotForm.register("price")} placeholder="50,00" />
                    </LotField>
                  </div>

                  <LotField label="Quantidade" error={lotForm.formState.errors.quantity?.message}>
                    <Input
                      {...lotForm.register("quantity")}
                      type="number"
                      min={1}
                      placeholder="200"
                    />
                  </LotField>

                  <div className="grid grid-cols-2 gap-3">
                    <LotField
                      label="Início das vendas"
                      error={lotForm.formState.errors.starts_at?.message}
                    >
                      <Input {...lotForm.register("starts_at")} type="datetime-local" />
                    </LotField>
                    <LotField label="Fim das vendas (opcional)">
                      <Input {...lotForm.register("ends_at")} type="datetime-local" />
                    </LotField>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" {...lotForm.register("is_half_price")} />
                    <span className="text-sm" style={{ color: "var(--ink)" }}>
                      Meia-entrada (50% do preço inteiro)
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAddingLotForType(null)
                        setEditingLotId(null)
                        lotForm.reset()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      style={{
                        backgroundColor: "var(--pulse)",
                        color: "var(--pulse-ink)",
                        fontWeight: 600,
                      }}
                    >
                      {editingLotId ? "Salvar lote" : "Adicionar lote"}
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setAddingLotForType(type.id)
                    lotForm.reset()
                  }}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color: "var(--mute)" }}
                >
                  <Plus size={14} /> Adicionar lote
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Adicionar tipo */}
      {addingType || editingTypeId ? (
        <form
          onSubmit={typeForm.handleSubmit(saveType)}
          className="space-y-3 rounded-xl border p-4"
          style={{ borderColor: "var(--pulse)", backgroundColor: "var(--paper-pure)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {editingTypeId ? "Editar tipo" : "Novo tipo"}
          </p>
          <LotField label="Nome do tipo" error={typeForm.formState.errors.name?.message}>
            <Input
              {...typeForm.register("name")}
              placeholder='Ex: "VIP", "Pista", "Camarote"'
              autoFocus
            />
          </LotField>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAddingType(false)
                setEditingTypeId(null)
                typeForm.reset()
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              style={{
                backgroundColor: "var(--pulse)",
                color: "var(--pulse-ink)",
                fontWeight: 600,
              }}
            >
              {editingTypeId ? "Salvar" : "Criar tipo"}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          onClick={() => setAddingType(true)}
          className="gap-2"
          style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
        >
          <Plus size={15} /> Adicionar tipo de ingresso
        </Button>
      )}
    </div>
  )
}

function LotField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs" style={{ color: "var(--ink)" }}>
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  )
}
