import type { Metadata, Viewport } from "next"
import { Geist, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "AXON — Compre, valide e aproveite",
    template: "%s · AXON",
  },
  description:
    "Ingressos online sem complicação. Pix instantâneo, QR Code assinado e validação na porta. Tudo no seu celular.",
  metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] || "https://axonia.vercel.app"),
  applicationName: "AXON",
  keywords: ["ingressos", "eventos", "shows", "pix", "qr code", "axon", "axonia"],
  authors: [{ name: "AXON" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "AXON",
    title: "AXON — Compre, valide e aproveite",
    description:
      "Pix instantâneo, QR Code assinado e validação na porta. Os melhores eventos perto de você.",
    url: "https://axonia.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "AXON — Compre, valide e aproveite",
    description:
      "Pix instantâneo, QR Code assinado e validação na porta. Os melhores eventos perto de você.",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0B" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AXON" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('axon-theme');
                  if (theme === 'light' || theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', theme);
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-[var(--paper)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  )
}
