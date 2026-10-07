import { normalizeAnswer } from "@coreta/scoring";
import type { z } from "zod";

import { type Item, ItemSchema, LAYOUT_MODES, type LayoutMode } from "./schema";

/** One problem found in an item, written so a content editor can fix it without reading code. */
export interface ItemError {
  /** Where, such as "options[2].text" or "media[0].alt_text"; empty for the item as a whole. */
  path: string;
  /** Short machine-readable reason, for tests and tooling. */
  code: string;
  /** What is wrong and how to fix it, in Indonesian. */
  message: string;
}

export type ValidationResult =
  { ok: true; item: Item; errors: [] } | { ok: false; item?: undefined; errors: ItemError[] };

// --- Schema errors, in plain words -------------------------------------------------------------

const EXPECTED_TYPES: Record<string, string> = {
  string: "teks",
  number: "angka",
  boolean: "benar/salah (true/false)",
  int: "bilangan bulat",
  array: "daftar",
  object: "objek",
};

function pathToString(path: readonly PropertyKey[]): string {
  return path.reduce<string>((text, part) => {
    if (typeof part === "number") return `${text}[${part}]`;
    return text === "" ? String(part) : `${text}.${String(part)}`;
  }, "");
}

/** The value at `path` inside the input, or undefined when some step along the way is missing. */
function valueAt(input: unknown, path: readonly PropertyKey[]): unknown {
  let current = input;
  for (const part of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<PropertyKey, unknown>)[part];
  }
  return current;
}

function fromSchemaIssue(issue: z.core.$ZodIssue, input: unknown): ItemError {
  const path = pathToString(issue.path);
  const where = path === "" ? "Butir" : `Bidang "${path}"`;

  switch (issue.code) {
    case "invalid_type": {
      const expected = EXPECTED_TYPES[issue.expected] ?? issue.expected;
      // Zod reports a missing field and a wrong type with the same code; the input tells them apart.
      const missing = valueAt(input, issue.path) === undefined;
      return {
        path,
        code: missing ? "required" : "wrong_type",
        message: missing
          ? `${where} wajib diisi.`
          : path === ""
            ? "Butir harus berupa objek JSON."
            : `${where} harus berupa ${expected}.`,
      };
    }
    case "invalid_value":
      // A missing enum field is reported as an invalid value too; say "required" for it.
      if (valueAt(input, issue.path) === undefined) {
        return { path, code: "required", message: `${where} wajib diisi.` };
      }
      return {
        path,
        code: "invalid_value",
        message: `${where} harus salah satu dari: ${issue.values.map(String).join(", ")}.`,
      };
    case "unrecognized_keys":
      return {
        path,
        code: "unknown_field",
        message: `${path === "" ? "Butir" : `Di "${path}"`} memuat bidang yang tidak dikenal: ${issue.keys.join(", ")}.`,
      };
    default:
      // Constraints carry their own message from the schema.
      return { path, code: "invalid", message: issue.message };
  }
}

// --- Content rules -----------------------------------------------------------------------------

// Declared layout must be able to hold the content. This mirrors resolveLayout in the web app,
// which a package cannot import; both order the modes standar < media < bacaan.
function requiredLayout(item: Item): LayoutMode {
  if (item.stimulus_id) return "bacaan";
  if (item.media.length > 0) return "media";
  return "standar";
}

const isChoice = (item: Item) => item.answer_type === "pg" || item.answer_type === "pgk";

function checkRules(item: Item): ItemError[] {
  const errors: ItemError[] = [];
  const add = (path: string, code: string, message: string) => errors.push({ path, code, message });
  const optionIds = item.options.map((option) => option.id);
  const key = item.answer_key.filter((entry) => entry.trim() !== "");

  if (item.stem.text.trim() === "") {
    add("stem.text", "stem_empty", "Teks soal masih kosong.");
  }

  // Options: ids are unique, and each answer type has the right number of them.
  const repeated = optionIds.filter((id, index) => optionIds.indexOf(id) !== index);
  if (repeated.length > 0) {
    add("options", "option_duplicate", `Id opsi kembar: ${[...new Set(repeated)].join(", ")}.`);
  }
  if (item.answer_type === "isian") {
    if (item.options.length > 0) {
      add("options", "isian_has_options", "Isian singkat tidak boleh punya opsi.");
    }
  } else if (item.options.length < 2 && item.answer_type !== "bs") {
    add("options", "options_too_few", "Butir pilihan butuh minimal dua opsi.");
  } else if (item.options.length < 1) {
    add("options", "options_too_few", "Butir benar-salah butuh minimal satu pernyataan.");
  }

  // The answer key.
  if (key.length === 0) {
    add("answer_key", "key_missing", "Kunci jawaban belum diisi.");
  } else if (item.answer_type === "isian") {
    if (key.length > 1) {
      add("answer_key", "key_count", "Isian singkat hanya boleh punya satu kunci jawaban.");
    } else if (normalizeAnswer(key[0]) === null) {
      add(
        "answer_key",
        "isian_key_not_number",
        `Kunci isian "${key[0]}" bukan angka; isian dinilai sebagai angka.`,
      );
    }
  } else {
    const unknown = key.filter((id) => !optionIds.includes(id));
    if (unknown.length > 0) {
      add(
        "answer_key",
        "key_unknown_option",
        `Kunci menunjuk opsi yang tidak ada: ${unknown.join(", ")}.`,
      );
    } else if (item.answer_type === "pg" && key.length > 1) {
      add("answer_key", "key_count", "Pilihan ganda hanya boleh punya satu kunci.");
    } else if (item.answer_type === "pgk" && key.length >= item.options.length) {
      add(
        "answer_key",
        "key_all_options",
        "Semua opsi tidak boleh menjadi kunci; mencentang semua pilihan selalu dihitung salah.",
      );
    }
  }

  // Fields that only make sense for short answers.
  if (item.answer_type !== "isian") {
    if (item.tolerance !== undefined) {
      add("tolerance", "tolerance_not_isian", "Toleransi hanya berlaku untuk isian singkat.");
    }
    if (item.equivalents !== undefined && item.equivalents.length > 0) {
      add(
        "equivalents",
        "equivalents_not_isian",
        "Jawaban setara hanya berlaku untuk isian singkat.",
      );
    }
  }

  // Every wrong option of a choice item needs a hint, and hints must point at real options.
  if (isChoice(item)) {
    const missing = item.options.filter(
      (option) =>
        !key.includes(option.id) && (item.distractor_hints[option.id] ?? "").trim() === "",
    );
    for (const option of missing) {
      add(
        `distractor_hints.${option.id}`,
        "hint_missing",
        `Pengecoh ${option.label ?? option.id} belum punya petunjuk.`,
      );
    }
  }
  if (item.answer_type !== "isian") {
    for (const id of Object.keys(item.distractor_hints)) {
      if (!optionIds.includes(id)) {
        add(
          `distractor_hints.${id}`,
          "hint_unknown_option",
          `Ada petunjuk untuk opsi "${id}", tetapi opsi itu tidak ada.`,
        );
      }
    }
  }

  if (item.explanation.text.trim() === "") {
    add("explanation.text", "explanation_missing", "Pembahasan belum ditulis.");
  }

  // Media: unique ids, alt text on all, a transcript for audio.
  item.media.forEach((media, index) => {
    const name = media.id;
    if (item.media.findIndex((other) => other.id === media.id) !== index) {
      add(`media[${index}].id`, "media_duplicate", `Id media "${name}" dipakai lebih dari sekali.`);
    }
    if (media.alt_text.trim() === "") {
      add(
        `media[${index}].alt_text`,
        "media_alt_text",
        `Media "${name}" wajib punya teks alternatif (alt_text).`,
      );
    }
    if (media.kind === "audio" && (media.transcript ?? "").trim() === "") {
      add(
        `media[${index}].transcript`,
        "media_transcript",
        `Audio "${name}" wajib punya transkrip.`,
      );
    }
  });

  // The layout must be able to hold the content: never lower than what media or a stimulus needs.
  const needed = requiredLayout(item);
  if (LAYOUT_MODES.indexOf(item.layout_mode) < LAYOUT_MODES.indexOf(needed)) {
    add(
      "layout_mode",
      "layout_too_small",
      `layout_mode "${item.layout_mode}" tidak muat; isi butir butuh "${needed}".`,
    );
  }

  return errors;
}

/**
 * Checks one item, given as parsed JSON. Structure is checked first; if that fails, those errors
 * are returned alone, since the content rules need a well-formed item. Otherwise every content
 * rule is checked and all the problems found are returned together, so an editor can fix them in
 * one pass: a key, a hint for each wrong option, an explanation, alt text for all media, and a
 * `layout_mode` that fits.
 */
export function validateItem(input: unknown): ValidationResult {
  const parsed = ItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => fromSchemaIssue(issue, input)) };
  }
  const errors = checkRules(parsed.data);
  return errors.length === 0 ? { ok: true, item: parsed.data, errors: [] } : { ok: false, errors };
}

/** The errors as readable lines, optionally prefixed with the item code. */
export function formatErrors(errors: readonly ItemError[], code?: string): string {
  const prefix = code ? `${code}: ` : "";
  return errors.map((error) => `- ${prefix}${error.message}`).join("\n");
}
