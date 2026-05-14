import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "./ProfileForm"

export const metadata: Metadata = { title: "Minha conta" }

export default async function MinhaContaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, cpf, role")
    .eq("id", user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
        >
          {profile?.full_name ? `Olá, ${profile.full_name.split(" ")[0]}.` : "Minha conta"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mute)" }}>
          {user.email}
        </p>
      </div>

      <Tabs defaultValue="pedidos">
        <TabsList
          className="h-auto w-full justify-start gap-0 rounded-none border-b p-0"
          style={{ backgroundColor: "transparent", borderColor: "var(--rule)" }}
        >
          {["pedidos", "dados", "privacidade"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm capitalize data-[state=active]:border-current"
              style={{ color: "var(--mute)" }}
            >
              {tab === "pedidos"
                ? "Meus pedidos"
                : tab === "dados"
                  ? "Dados pessoais"
                  : "Privacidade"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pedidos" className="pt-6">
          <div
            className="rounded-xl border border-dashed p-10 text-center"
            style={{ borderColor: "var(--rule)" }}
          >
            <p className="text-sm" style={{ color: "var(--mute)" }}>
              Nenhum pedido ainda.
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--mute-2)" }}>
              Seus ingressos aparecem aqui após a compra.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="dados" className="pt-6">
          <ProfileForm
            userId={user.id}
            initialData={{
              full_name: profile?.full_name ?? "",
              phone: profile?.phone ?? "",
              cpf: profile?.cpf ?? "",
            }}
          />
        </TabsContent>

        <TabsContent value="privacidade" className="space-y-4 pt-6">
          <div
            className="space-y-3 rounded-xl border p-5"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              Seus dados (LGPD)
            </h2>
            <p className="text-xs" style={{ color: "var(--mute)" }}>
              Você tem direito de acessar, portabilizar e solicitar a exclusão dos seus dados.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-black/5"
                style={{ borderColor: "var(--rule)", color: "var(--ink-4)" }}
                disabled
                title="Disponível em breve"
              >
                Exportar dados
              </button>
              <button
                className="rounded-lg border px-3 py-1.5 text-xs transition-colors"
                style={{ borderColor: "var(--danger-soft)", color: "var(--danger)" }}
                disabled
                title="Disponível em breve"
              >
                Solicitar exclusão
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--mute-2)" }}>
              Implementação completa na Sprint 5. DPO: dpo@axon.com.br
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
