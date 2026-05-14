import type { ReactNode } from "react"
import { SiteHeader } from "@/components/shared/SiteHeader"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  )
}
