"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const statuses = [
  { value: "pending", label: "KYC Pendente" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
]

export function KycButton({
  organizerId,
  currentStatus,
}: {
  organizerId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function changeStatus(newStatus: string) {
    if (newStatus === currentStatus) {
      setOpen(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from("organizers")
      .update({ kyc_status: newStatus as "pending" | "approved" | "rejected" })
      .eq("id", organizerId)
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5"
        style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
      >
        {loading ? "Salvando..." : "Alterar KYC"}
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
