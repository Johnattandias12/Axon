"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const roles = [
  { value: "buyer", label: "Comprador" },
  { value: "organizer", label: "Organizador" },
  { value: "validator", label: "Validador" },
  { value: "admin", label: "Admin" },
]

export function ChangeRoleButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function changeRole(newRole: string) {
    if (newRole === currentRole) {
      setOpen(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from("profiles")
      .update({ role: newRole as "buyer" | "organizer" | "validator" | "admin" })
      .eq("id", userId)
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
        {loading ? "Salvando..." : "Alterar role"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full right-0 z-20 mt-1 w-36 rounded-xl border py-1 shadow-lg"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => changeRole(r.value)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-black/5"
                style={{ color: r.value === currentRole ? "var(--pulse)" : "var(--ink)" }}
              >
                {r.value === currentRole && <span className="text-[8px]">●</span>}
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
