"use client"

import { useActionState, useTransition } from "react"
import { Minus, Plus, Trash2, Loader2 } from "lucide-react"
import { centsToBRL } from "@/lib/utils"
import { updateCartQuantity, removeCartItem, type ActionResult } from "@/app/carrinho/actions"

interface Props {
  itemId: string
  typeName: string
  lotName: string
  pricePerUnit: number
  isHalfPrice: boolean
  quantity: number
}

export function CartItemRow({
  itemId,
  typeName,
  lotName,
  pricePerUnit,
  isHalfPrice,
  quantity,
}: Props) {
  const [updState, updAction] = useActionState<ActionResult | null, FormData>(
    updateCartQuantity,
    null
  )
  const [delState, delAction] = useActionState<ActionResult | null, FormData>(removeCartItem, null)
  const [pending, startTransition] = useTransition()

  function changeQty(newQty: number) {
    if (newQty < 1 || newQty > 10) return
    const fd = new FormData()
    fd.set("itemId", itemId)
    fd.set("quantity", String(newQty))
    startTransition(() => updAction(fd))
  }

  function remove() {
    const fd = new FormData()
    fd.set("itemId", itemId)
    startTransition(() => delAction(fd))
  }

  const subtotal = pricePerUnit * quantity
  const error =
    updState && !updState.ok ? updState.error : delState && !delState.ok ? delState.error : null

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--mute)" }}
          >
            {typeName}
          </span>
          {isHalfPrice && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{
                backgroundColor: "var(--warning-soft)",
                color: "var(--warning)",
              }}
            >
              MEIA
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {lotName}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--mute)" }}>
          {pricePerUnit === 0 ? "Grátis" : `${centsToBRL(pricePerUnit)} cada`}
        </p>
        {error && (
          <p className="mt-1.5 text-[11px]" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => changeQty(quantity - 1)}
          disabled={pending || quantity <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-black/5 disabled:opacity-40"
          style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
          aria-label="Diminuir"
        >
          <Minus size={12} />
        </button>
        <span
          className="min-w-[2rem] text-center font-mono text-sm font-bold"
          style={{ color: "var(--ink)" }}
        >
          {pending ? <Loader2 size={12} className="mx-auto animate-spin" /> : quantity}
        </span>
        <button
          type="button"
          onClick={() => changeQty(quantity + 1)}
          disabled={pending || quantity >= 10}
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-black/5 disabled:opacity-40"
          style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
          aria-label="Aumentar"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="hidden text-right sm:block">
        <p className="font-mono text-sm font-bold tabular-nums" style={{ color: "var(--ink)" }}>
          {centsToBRL(subtotal)}
        </p>
      </div>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--danger-soft)]"
        style={{ color: "var(--mute)" }}
        aria-label="Remover"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
