import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// TODO: Renomear para proxy.ts quando possível (Next.js 16 deprecou middleware.ts)
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
