import type { Database } from "@coreta/db";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { decideRoute, roleFromClaims, type SignedInRole } from "@/lib/auth/roles";
import { getPublicEnv } from "@/lib/env";

/**
 * Menyegarkan sesi Supabase (cookie) lalu menjalankan penjaga peran. Dipanggil dari proxy.ts.
 *
 * Tanpa konfigurasi Supabase yang valid, permintaan diperlakukan sebagai belum masuk: rute peran
 * tetap tertutup (gagal tertutup), halaman publik tetap terbuka.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let role: SignedInRole | null = null;

  let env: ReturnType<typeof getPublicEnv> | null = null;
  try {
    env = getPublicEnv();
  } catch {
    env = null;
  }

  if (env) {
    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            response = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
            for (const [key, value] of Object.entries(headers)) {
              response.headers.set(key, value);
            }
          },
        },
      },
    );

    // getClaims memverifikasi tanda tangan JWT (dan menyegarkan token yang kedaluwarsa). Jangan
    // memakai getSession di server: isinya dari cookie dan tidak diverifikasi.
    const { data } = await supabase.auth.getClaims();
    role = roleFromClaims(data?.claims);
  }

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
    // Rute API dan auth memeriksa sendiri siapa pemanggilnya; di sini sesi hanya disegarkan.
    return response;
  }

  const decision = decideRoute(pathname, role, search);
  if (decision.action === "allow") {
    return response;
  }

  const redirect = NextResponse.redirect(new URL(decision.to, request.url));
  // Cookie sesi yang baru disegarkan harus ikut, kalau tidak pengguna keluar dengan sendirinya.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  const cacheControl = response.headers.get("cache-control");
  if (cacheControl) redirect.headers.set("cache-control", cacheControl);
  return redirect;
}
