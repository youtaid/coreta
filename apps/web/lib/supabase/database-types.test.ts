// Type-level guards on the generated database types (TIP Fase 34). `pnpm typecheck` fails when
// these stop holding; the vitest run only confirms the module loads.
import type { Database, Tables, TablesInsert } from "@coreta/db";
import { describe, expectTypeOf, it } from "vitest";

type PublicItem = Tables<"items_public">;
type Item = Tables<"items">;

describe("generated database types", () => {
  it("keep answer keys out of items_public (rule 1)", () => {
    expectTypeOf<PublicItem>().not.toHaveProperty("answer_key");
    expectTypeOf<PublicItem>().not.toHaveProperty("explanation");
    expectTypeOf<PublicItem>().not.toHaveProperty("distractor_hints");
    expectTypeOf<Item>().toHaveProperty("answer_key");
  });

  it("describe rows, inserts, and RPC helpers", () => {
    expectTypeOf<Tables<"plans">["price"]>().toEqualTypeOf<number>();
    expectTypeOf<Tables<"plans">["strike_price"]>().toEqualTypeOf<number | null>();
    // attempts.id comes from the client, so inserts must supply it.
    expectTypeOf<TablesInsert<"attempts">["id"]>().toEqualTypeOf<string>();
    // audit_log.id is an identity column, so inserts may leave it out.
    expectTypeOf<TablesInsert<"audit_log">>().toHaveProperty("action");
    expectTypeOf<Database["public"]["Functions"]["is_guardian_of"]["Args"]>().toEqualTypeOf<{
      target_student: string;
    }>();
  });
});
