import { createAdminClient } from "@/lib/supabase/admin"

export async function getPaymentMode(): Promise<"real" | "test"> {
  // Se a chave da API do Pagar.me não estiver configurada no .env,
  // obrigatoriamente operamos em modo teste (fictício) para não dar crash.
  if (!process.env["PAGARME_API_KEY"]) {
    return "test"
  }

  try {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("system_settings")
      .select("value")
      .eq("key", "payment_mode")
      .maybeSingle()

    // Se o banco de dados falhar (ex: tabela system_settings não criada ainda),
    // o padrão é modo real (produção).
    if (error || !data) {
      return "real"
    }

    return (data.value === "test" ? "test" : "real") as "real" | "test"
  } catch (err) {
    console.warn(
      "[getPaymentMode] Falha ao consultar tabela system_settings, usando real como padrão:",
      err
    )
    return "real"
  }
}
