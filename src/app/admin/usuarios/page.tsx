import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { ChangeRoleButton } from "./ChangeRoleButton"

export const metadata: Metadata = { title: "Usuários" }

export default async function AdminUsuariosPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

  const roleLabel: Record<string, string> = {
    buyer: "Comprador",
    organizer: "Organizador",
    validator: "Validador",
    admin: "Admin",
  }
  const roleColor: Record<string, string> = {
    buyer: "var(--mute)",
    organizer: "var(--info)",
    validator: "var(--warning)",
    admin: "var(--danger)",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Usuários
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          {(users ?? []).length} usuários cadastrados.
        </p>
      </div>

      <div className="space-y-2">
        {(users ?? []).map((user) => (
          <div
            key={user.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border p-4"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                {user.full_name ?? "Sem nome"}
              </p>
              <p className="mt-0.5 font-mono text-xs" style={{ color: "var(--mute)" }}>
                {user.id.slice(0, 8)}... {user.phone ? `· ${user.phone}` : ""}
              </p>
            </div>
            <span
              className="shrink-0 text-xs font-semibold"
              style={{ color: roleColor[user.role] ?? "var(--mute)" }}
            >
              {roleLabel[user.role] ?? user.role}
            </span>
            <ChangeRoleButton userId={user.id} currentRole={user.role} />
          </div>
        ))}
      </div>
    </div>
  )
}
