import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { destinationAfterSignIn } from "@/lib/auth/session-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const emailOtpTypes: readonly EmailOtpType[] = [
  "signup",
  "email",
  "magiclink",
  "recovery",
  "invite",
];

/**
 * Tujuan kembali dari Google (OAuth, kode PKCE) dan dari tautan konfirmasi email. Menukar kode
 * atau token menjadi sesi (cookie), lalu mengarahkan ke halaman yang sesuai peran.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const failed = NextResponse.redirect(new URL("/masuk?galat=tautan", request.url));
  const supabase = await createClient();

  let user: { id: string; app_metadata?: unknown } | null = null;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) user = data.user;
  } else if (tokenHash && otpType && emailOtpTypes.includes(otpType)) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
    if (!error) user = data.user;
  }

  if (!user) return failed;

  const { to } = await destinationAfterSignIn(user, next);
  return NextResponse.redirect(new URL(to, request.url));
}
