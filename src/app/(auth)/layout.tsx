import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--paper)" }}>
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Image src="/brand/symbol-axon.svg" alt="AXON" width={28} height={28} />
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            AXON
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>

      <footer className="px-6 py-5 text-center">
        <p className="text-xs" style={{ color: "var(--mute)" }}>
          Ao entrar, você concorda com os{" "}
          <Link href="/termos" className="underline underline-offset-2">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </p>
      </footer>
    </div>
  )
}
