// Validates packages/content/seed/*.json with validateItem and writes supabase/seed.sql.
//   pnpm --filter @coreta/content seed:sql          write supabase/seed.sql
//   pnpm --filter @coreta/content seed:sql --check  fail when seed.sql is out of date
import { readFileSync, writeFileSync } from "node:fs";

import { buildSeedSql } from "../src/seed-sql";

const seedDir = new URL("../seed/", import.meta.url);
const target = new URL("../../../supabase/seed.sql", import.meta.url);
const read = (name: string): unknown => JSON.parse(readFileSync(new URL(name, seedDir), "utf8"));

const build = buildSeedSql({
  curriculum: read("curriculum.json"),
  stimuli: read("stimuli.json"),
  items: read("items.json"),
  families: read("families.json"),
  learning: read("learning.json"),
});

if (!build.ok || build.sql === undefined) {
  console.error(`Seed ditolak:\n${build.report}`);
  process.exit(1);
}

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(target, "utf8");
  } catch {
    // Missing file counts as out of date.
  }
  if (current !== build.sql) {
    console.error(
      "supabase/seed.sql tidak sesuai dengan packages/content/seed/*.json. Jalankan: pnpm --filter @coreta/content seed:sql",
    );
    process.exit(1);
  }
  console.log(`supabase/seed.sql mutakhir.\n${build.report}`);
} else {
  writeFileSync(target, build.sql);
  console.log(`supabase/seed.sql ditulis.\n${build.report}`);
}
