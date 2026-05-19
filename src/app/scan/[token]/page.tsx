import Link from "next/link"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { AxonSymbol } from "@/components/shared/AxonLogo"
import { CheckCircle2, ScanLine, XCircle } from "lucide-react"

interface PageProps {
  params: Promise<{ token: string }>
}

interface ScannerRecord {
  id: string
  name: string
  gate: string | null
  revoked_at: string | null
  event_id: string
  events: { title: string; starts_at: string; slug: string } | null
}

export default async function ScanByTokenPage({ params }: PageProps) {
  const { token } = await params
  const admin = createAdminClient()

  const unsafe = admin as unknown as {
    from: (n: string) => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string
        ) => {
          maybeSingle: () => Promise<{ data: ScannerRecord | null }>
        }
      }
    }
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>
  }

  const { data: scanner } = await unsafe
    .from("event_scanners")
    .select("id, name, gate, revoked_at, event_id, events:event_id(title, starts_at, slug)")
    .eq("token", token)
    .maybeSingle()

  if (!scanner) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
      >
        <XCircle size={48} style={{ color: "var(--danger)" }} />
        <h1 className="mt-4 text-xl font-bold">Link inválido</h1>
        <p className="mt-2 text-sm opacity-70">
          Esse link de portaria não existe. Peça um novo pro organizador.
        </p>
      </div>
    )
  }

  if (scanner.revoked_at) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
      >
        <XCircle size={48} style={{ color: "var(--danger)" }} />
        <h1 className="mt-4 text-xl font-bold">Link revogado</h1>
        <p className="mt-2 text-sm opacity-70">
          Esse link foi cancelado pelo organizador. Peça um novo.
        </p>
      </div>
    )
  }

  const scannerName = scanner.name
  const scannerGate = scanner.gate
  const scannerId = scanner.id
  const eventTitle = scanner.events?.title ?? "evento"
  const eventSlug = scanner.events?.slug ?? null

  // Marca last_used_at (best-effort, não bloqueia)
  void (async () => {
    try {
      const updUnsafe = admin as unknown as {
        from: (n: string) => {
          update: (row: Record<string, unknown>) => {
            eq: (col: string, val: string) => Promise<{ error: unknown }>
          }
        }
      }
      await updUnsafe
        .from("event_scanners")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", scannerId)
    } catch {
      /* ignore */
    }
  })()

  // Pra MVP: mostra tela amigavel + manda pro login com hint.
  // (Followup: scan completamente sem login do validador, usando o token.)
  void redirect
  void eventSlug

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
    >
      <AxonSymbol size={48} tone="pulse" />
      <h1 className="mt-6 text-2xl font-black">Oi, {scannerName}!</h1>
      <p className="mt-2 max-w-sm text-center text-sm opacity-80">
        Você foi cadastrada na portaria de <strong>{eventTitle}</strong>.
        {scannerGate ? ` Portão ${scannerGate}.` : ""}
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={`/entrar?redirectTo=${encodeURIComponent("/scan")}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold"
          style={{ backgroundColor: "var(--pulse)", color: "var(--pulse-ink)" }}
        >
          <ScanLine size={16} />
          Entrar e abrir scanner
        </Link>
      </div>
      <p className="mt-6 text-[11px] opacity-60">
        <CheckCircle2 size={11} className="inline-block" /> Link autorizado
      </p>
    </div>
  )
}
