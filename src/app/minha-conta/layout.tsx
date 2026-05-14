import type { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/shared/SiteHeader"

export default async function MinhContaLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/entrar?redirectTo=/minha-conta")

  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>
    </>
  )
}
