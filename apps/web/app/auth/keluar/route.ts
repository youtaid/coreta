import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Keluar: hapus sesi (cookie) lalu kembali ke /masuk. Hanya POST agar tautan biasa tidak bisa. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  // 303 agar peramban membuka /masuk dengan GET.
  return NextResponse.redirect(new URL("/masuk?keluar=1", request.url), { status: 303 });
}
