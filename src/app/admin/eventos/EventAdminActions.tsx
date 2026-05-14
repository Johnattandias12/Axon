"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const statuses = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "finished", label: "Encerrado" },
]

export function EventAdminActions({
  eventId,
  currentStatus,
}: {
  eventId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function changeStatus(newStatus: string) {
    if (newStatus === currentStatus) {
      setOpen(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from("events")
      .update({ status: newStatus as "draft" | "published" | "cancelled" | "finished" })
      .eq("id", eventId)
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function deleteEvent() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setLoading(true)
    const supabase = createClient()
    await supabase.from("events").delete().eq("id", eventId)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={deleteEvent}
        disabled={loading}
        className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-50"
        style={{
          borderColor: confirmDelete ? "var(--danger)" : "var(--rule)",
          color: confirmDelete ? "var(--danger)" : "var(--mute)",
        }}
        title={confirmDelete ? "Clique novamente para confirmar" : "Excluir evento"}
      >
        {confirmDelete ? "Confirmar exclusão" : "Excluir"}
      </button>

      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5"
        style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
      >
        {loading ? "Salvando..." : "Status"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full right-0 z-20 mt-1 w-36 rounded-xl border py-1 shadow-lg"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => changeStatus(s.value)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-black/5"
                style={{ color: s.value === currentStatus ? "var(--pulse)" : "var(--ink)" }}
              >
                {s.value === currentStatus && <span className="text-[8px]">●</span>}
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
