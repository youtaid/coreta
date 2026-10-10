import "server-only";

import type { Database } from "@coreta/db";
import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";

// Bypasses RLS. Only for server code that has already authorized the caller.
export function createAdminClient() {
  const env = getServerEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
