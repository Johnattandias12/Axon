import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { KycButton } from "./KycButton"

export const metadata: Metadata = { title: "Organizadores (Admin)" }

export default async function AdminOrganizadoresPage() {
  const supabase = await createClient()

  const { data: organizers } = await supabase
    .from("organizers")
    .select("id, trade_name, legal_name, kyc_status, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

  const kycLabel: Record<string, string> = {
    pending: "KYC Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
  }
  const kycColor: Record<string, string> = {
    pending: "var(--warning)",
    approved: "var(--success)",
    rejected: "var(--danger)",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          Organizadores
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          {(organizers ?? []).length} organizadores cadastrados.
        </p>
      </div>

      <div className="space-y-2">
        {(organizers ?? []).map((org) => (
          <div
            key={org.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border p-4"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                {org.trade_name ?? org.legal_name ?? "Sem nome"}
              </p>
              <p className="mt-0.5 font-mono text-xs" style={{ color: "var(--mute)" }}>
                {org.legal_name ?? org.id.slice(0, 8)}
              </p>
            </div>
            <span
              className="shrink-0 text-xs font-semibold"
              style={{ color: kycColor[org.kyc_status] ?? "var(--mute)" }}
            >
              {kycLabel[org.kyc_status] ?? org.kyc_status}
            </span>
            <KycButton organizerId={org.id} currentStatus={org.kyc_status} />
          </div>
        ))}

        {(organizers ?? []).length === 0 && (
          <div
            className="rounded-xl border border-dashed p-10 text-center"
            style={{ borderColor: "var(--rule)" }}
          >
            <p className="text-sm" style={{ color: "var(--mute)" }}>
              Nenhum organizador cadastrado ainda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
