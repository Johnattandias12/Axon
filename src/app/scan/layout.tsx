import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Validação · AXON",
  description: "PWA do porteiro AXON. Validação de ingressos por QR Code.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AXON Scan",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0A0A0B",
}

export default function ScanLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
