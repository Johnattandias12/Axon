import type { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/shared/SiteHeader"
import { MinhaContaSidebar } from "./MinhaContaSidebar"

export default async function MinhaContaLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta")

  let isAffiliate = false
  try {
    const { getAffiliateByUserId } = await import("@/lib/supabase/affiliates-admin")
    const admin = createAdminClient()
    const aff = await getAffiliateByUserId(admin, user.id)
    isAffiliate = !!aff
  } catch {
    /* migration ainda não aplicada */
  }

  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:py-10">
        <MinhaContaSidebar isAffiliate={isAffiliate} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  )
}
