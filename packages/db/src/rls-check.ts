// Static check for TIP rule 4 ("every table uses RLS"): replays the SQL migrations in order and
// reports tables in schema public that end up without ROW LEVEL SECURITY enabled. CI runs it on
// supabase/migrations so a new table without RLS fails the build before any database exists.
// pgTAP (supabase/tests/0004) checks the same rule against a real database.

export interface MigrationFile {
  name: string;
  sql: string;
}

export interface TableWithoutRls {
  /** Fully qualified, e.g. "public.attempts". */
  table: string;
  /** Migration that created (or last renamed) the table. */
  file: string;
  reason: "never enabled" | "disabled";
}

const IDENT = String.raw`(?:"(?:[^"]|"")+"|[A-Za-z_][A-Za-z0-9_$]*)`;
const QUALIFIED = String.raw`${IDENT}(?:\s*\.\s*${IDENT})?`;

const PATTERNS = {
  create: new RegExp(
    String.raw`\bcreate\s+(?:or\s+replace\s+)?(?:(?:global|local)\s+)?(?:(temporary|temp)\s+|unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?(${QUALIFIED})`,
    "gi",
  ),
  rls: new RegExp(
    String.raw`\balter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(${QUALIFIED})\s+(enable|disable)\s+row\s+level\s+security\b`,
    "gi",
  ),
  rename: new RegExp(
    String.raw`\balter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(${QUALIFIED})\s+rename\s+to\s+(${IDENT})`,
    "gi",
  ),
  drop: new RegExp(
    String.raw`\bdrop\s+table\s+(?:if\s+exists\s+)?(${QUALIFIED}(?:\s*,\s*${QUALIFIED})*)`,
    "gi",
  ),
};

/** Removes comments, string literals, and dollar-quoted bodies so only real DDL is matched. */
export function stripNonCode(sql: string): string {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const rest = sql.slice(i);
    if (rest.startsWith("--")) {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end;
      continue;
    }
    if (rest.startsWith("/*")) {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      out += " ";
      continue;
    }
    const dollar = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(rest);
    if (dollar) {
      const tag = dollar[0];
      const end = sql.indexOf(tag, i + tag.length);
      i = end === -1 ? sql.length : end + tag.length;
      out += " ";
      continue;
    }
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") j += 2;
        else if (sql[j] === "'") break;
        else j += 1;
      }
      i = j + 1;
      out += "''";
      continue;
    }
    out += sql[i];
    i += 1;
  }
  return out;
}

function unquote(part: string): string {
  return part.startsWith('"') ? part.slice(1, -1).replace(/""/g, '"') : part.toLowerCase();
}

/** `Foo`, `public.foo`, `"Public"."Foo"` → "public.foo" / "Public.Foo"; no schema means public. */
export function qualify(name: string): string {
  const parts = name.match(new RegExp(IDENT, "g")) ?? [];
  const [schema, table] = parts.length === 2 ? parts : ["public", parts[0] ?? ""];
  return `${unquote(schema ?? "public")}.${unquote(table ?? "")}`;
}

type Event =
  | { at: number; kind: "create"; table: string }
  | { at: number; kind: "rls"; table: string; enabled: boolean }
  | { at: number; kind: "rename"; table: string; to: string }
  | { at: number; kind: "drop"; tables: string[] };

function eventsOf(sql: string): Event[] {
  const code = stripNonCode(sql);
  const events: Event[] = [];
  for (const m of code.matchAll(PATTERNS.create)) {
    if (m[1]) continue; // temporary tables never live in public
    events.push({ at: m.index, kind: "create", table: qualify(m[2] ?? "") });
  }
  for (const m of code.matchAll(PATTERNS.rls)) {
    events.push({
      at: m.index,
      kind: "rls",
      table: qualify(m[1] ?? ""),
      enabled: (m[2] ?? "").toLowerCase() === "enable",
    });
  }
  for (const m of code.matchAll(PATTERNS.rename)) {
    const from = qualify(m[1] ?? "");
    const schema = from.slice(0, from.indexOf("."));
    events.push({
      at: m.index,
      kind: "rename",
      table: from,
      to: `${schema}.${unquote(m[2] ?? "")}`,
    });
  }
  for (const m of code.matchAll(PATTERNS.drop)) {
    const tables = (m[1] ?? "").split(",").map((part) => qualify(part.trim()));
    events.push({ at: m.index, kind: "drop", tables });
  }
  return events.sort((a, b) => a.at - b.at);
}

interface TableState {
  file: string;
  enabled: boolean;
  everEnabled: boolean;
}

/** Applies every migration in file-name order (as Supabase does) and returns the final tables. */
function replay(files: readonly MigrationFile[]): Map<string, TableState> {
  const state = new Map<string, TableState>();
  const ordered = [...files].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  for (const file of ordered) {
    for (const event of eventsOf(file.sql)) {
      if (event.kind === "create") {
        state.set(event.table, { file: file.name, enabled: false, everEnabled: false });
      } else if (event.kind === "rls") {
        const entry = state.get(event.table);
        if (entry) {
          entry.enabled = event.enabled;
          entry.everEnabled ||= event.enabled;
        }
      } else if (event.kind === "rename") {
        const entry = state.get(event.table);
        if (entry) {
          state.delete(event.table);
          state.set(event.to, { ...entry, file: file.name });
        }
      } else {
        for (const table of event.tables) state.delete(table);
      }
    }
  }
  return state;
}

/** Tables in schema public that end up without RLS after all migrations. */
export function findTablesWithoutRls(files: readonly MigrationFile[]): TableWithoutRls[] {
  return [...replay(files).entries()]
    .filter(([table, entry]) => table.startsWith("public.") && !entry.enabled)
    .map(([table, entry]) => ({
      table,
      file: entry.file,
      reason: entry.everEnabled ? ("disabled" as const) : ("never enabled" as const),
    }))
    .sort((a, b) => a.table.localeCompare(b.table));
}

/** Every table in schema public that the migrations create and keep. */
export function listPublicTables(files: readonly MigrationFile[]): string[] {
  return [...replay(files).keys()].filter((table) => table.startsWith("public.")).sort();
}
