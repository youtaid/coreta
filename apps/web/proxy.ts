import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 mengganti nama middleware.ts menjadi proxy.ts (berjalan di runtime Node.js).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Semua rute kecuali berkas statis Next.js, gambar, dan aset publik.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)",
  ],
};
