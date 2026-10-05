import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };
const TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Supabase did not respond within ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    // Round-trips through the API gateway, Auth, and Postgres without needing app tables.
    const { error } = await withTimeout(
      supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
      TIMEOUT_MS,
    );
    if (error) throw error;

    return Response.json({ ok: true, supabase: "up" }, { headers });
  } catch (error) {
    console.error("[health] Supabase check failed", error);
    return Response.json({ ok: false, supabase: "down" }, { status: 503, headers });
  }
}
