// CI gate (TIP Fase 33): every table the Supabase migrations create in schema public must enable
// row level security. Run alone with `pnpm --filter @coreta/db check:rls`.
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { findTablesWithoutRls, listPublicTables } from "./rls-check";

const dir = new URL("../../../supabase/migrations/", import.meta.url);
const files = readdirSync(dir)
  .filter((name) => name.endsWith(".sql"))
  .map((name) => ({ name, sql: readFileSync(new URL(name, dir), "utf8") }));

describe("supabase/migrations", () => {
  it("are found and parsed", () => {
    expect(files.length).toBeGreaterThanOrEqual(4);
    // Sanity check that the parser sees the real schema, so an empty report means something.
    expect(listPublicTables(files)).toEqual(
      expect.arrayContaining([
        "public.profiles",
        "public.items",
        "public.attempts",
        "public.mastery",
        "public.payment_events",
        "public.audit_log",
      ]),
    );
  });

  it("enable RLS on every table in schema public (rule 4)", () => {
    const missing = findTablesWithoutRls(files).map(
      ({ table, file, reason }) => `${table} (${file}: ${reason})`,
    );
    expect(missing, "Tambahkan `alter table … enable row level security` dan kebijakannya").toEqual(
      [],
    );
  });
});
