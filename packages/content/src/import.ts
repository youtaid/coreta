import type { Item } from "./schema";
import { formatErrors, type ItemError, validateItem } from "./validate";

/** An item that was refused, with every reason. */
export interface ImportRejection {
  /** Position in the file, starting at 0; -1 when the whole file was refused. */
  index: number;
  /** The item's code when it could be read, to help find it in the file. */
  code?: string;
  errors: ItemError[];
}

export interface ImportResult {
  /** Items that passed every check, in file order. */
  items: Item[];
  rejected: ImportRejection[];
  /** True when nothing was rejected. */
  ok: boolean;
}

function fileError(code: string, message: string): ImportResult {
  return {
    items: [],
    rejected: [{ index: -1, errors: [{ path: "", code, message }] }],
    ok: false,
  };
}

function codeOf(entry: unknown): string | undefined {
  if (typeof entry !== "object" || entry === null) return undefined;
  const code = (entry as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Reads a batch of items from JSON: either a list of items, or an object with an `items` list.
 * Each item is validated on its own, so one bad item does not hide the others; accepted and
 * rejected items come back separately. A code that appears twice in the file is rejected the
 * second time. A file that is not JSON, or has the wrong shape, is rejected as a whole.
 *
 * `source` is the file's text, or JSON that has already been parsed.
 */
export function importItems(source: string | unknown): ImportResult {
  let data: unknown = source;
  if (typeof source === "string") {
    try {
      data = JSON.parse(source);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "tidak dapat dibaca";
      return fileError("invalid_json", `Berkas bukan JSON yang valid: ${reason}`);
    }
  }

  const list =
    Array.isArray(data) || typeof data !== "object" || data === null
      ? data
      : (data as { items?: unknown }).items;
  if (!Array.isArray(list)) {
    return fileError(
      "invalid_shape",
      'Isi berkas harus berupa daftar butir (array), atau objek dengan bidang "items" berisi daftar.',
    );
  }

  const items: Item[] = [];
  const rejected: ImportRejection[] = [];
  const seen = new Set<string>();

  list.forEach((entry, index) => {
    const result = validateItem(entry);
    const errors: ItemError[] = [...result.errors];
    const code = result.ok ? result.item.code : codeOf(entry);

    if (code !== undefined && seen.has(code)) {
      errors.push({
        path: "code",
        code: "duplicate_code",
        message: `Kode butir "${code}" sudah dipakai butir lain di berkas ini.`,
      });
    }
    if (code !== undefined) seen.add(code);

    if (result.ok && errors.length === 0) {
      items.push(result.item);
    } else {
      rejected.push({ index, code, errors });
    }
  });

  return { items, rejected, ok: rejected.length === 0 };
}

/** A readable summary of an import: how many were accepted and why each rejection happened. */
export function formatImportReport(result: ImportResult): string {
  const header = `${result.items.length} butir diterima, ${result.rejected.length} ditolak.`;
  if (result.rejected.length === 0) return header;
  const sections = result.rejected.map((rejection) => {
    const where =
      rejection.index < 0
        ? "Berkas"
        : `Butir ke-${rejection.index + 1}${rejection.code ? ` (${rejection.code})` : ""}`;
    return `${where}:\n${formatErrors(rejection.errors)}`;
  });
  return [header, ...sections].join("\n\n");
}
