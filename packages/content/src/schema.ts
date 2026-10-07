import { z } from "zod";

// The shape of an item in the content pipeline, mirroring the `items` table (TIP section 4).
// The schema checks structure only: types, allowed values, ranges, and unknown fields. Rules about
// whether an item is complete enough to publish (a key, hints, an explanation) live in validate.ts,
// so a missing key reads "Kunci jawaban belum diisi" instead of a generic type error. Fields those
// rules cover therefore default to empty here.

export const TIERS = ["dasar", "mahir", "ujian"] as const;
export const ANSWER_TYPES = ["pg", "pgk", "bs", "isian"] as const;
export const LAYOUT_MODES = ["standar", "media", "bacaan"] as const;
export const ITEM_STATUSES = ["draft", "review", "published", "retired"] as const;
export const MEDIA_KINDS = ["diagram", "image", "table", "audio", "video"] as const;

export type Tier = (typeof TIERS)[number];
export type AnswerType = (typeof ANSWER_TYPES)[number];
export type LayoutMode = (typeof LAYOUT_MODES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type MediaKind = (typeof MEDIA_KINDS)[number];

const text = z.string();

export const OptionSchema = z.strictObject({
  /** Stable id that the answer key and the hints refer to. */
  id: z.string().min(1, "Id opsi tidak boleh kosong."),
  /** What the student sees, such as "A"; defaults to the id. */
  label: text.optional(),
  text: z.string().min(1, "Teks opsi tidak boleh kosong."),
});

export const MediaSchema = z.strictObject({
  id: z.string().min(1, "Id media tidak boleh kosong."),
  kind: z.enum(MEDIA_KINDS),
  /** Required for every media item; checked in validateItem so the message can name the media. */
  alt_text: text.default(""),
  caption: text.optional(),
  /** Required for audio. */
  transcript: text.optional(),
  /** Whether the student may paste it onto the scratch area. */
  pasteable: z.boolean().optional(),
});

export const ItemSchema = z.strictObject({
  code: z
    .string()
    .regex(
      /^[A-Z0-9]+(-[A-Z0-9]+)*$/,
      "Kode butir harus huruf besar, angka, dan tanda hubung, misalnya MAT-SMA-ALJ-01.",
    ),
  /** The competency by its code; the importer turns it into competency_id. */
  competency_code: z.string().min(1, "Kode kompetensi tidak boleh kosong."),
  tier: z.enum(TIERS),
  answer_type: z.enum(ANSWER_TYPES),
  stem: z.strictObject({
    text,
    /** Optional LaTeX shown under the text. */
    formula: text.optional(),
  }),
  /** Options (pg, pgk) or statements (bs); empty for short answers. */
  options: z.array(OptionSchema).default([]),
  /** Ids of the correct options; for short answers, the one accepted answer. */
  answer_key: z.array(text).default([]),
  /** Other accepted spellings for short answers. */
  equivalents: z.array(text).optional(),
  tolerance: z.number().min(0, "Toleransi harus 0 atau lebih.").optional(),
  /** Hint per wrong option, keyed by option id. */
  distractor_hints: z.record(z.string(), text).default({}),
  explanation: z.strictObject({ text: text.default("") }).default({ text: "" }),
  layout_mode: z.enum(LAYOUT_MODES),
  stimulus_id: z.string().min(1, "Id stimulus tidak boleh kosong.").optional(),
  media: z.array(MediaSchema).default([]),
  difficulty: z
    .number()
    .min(0, "Kesulitan harus antara 0 dan 1.")
    .max(1, "Kesulitan harus antara 0 dan 1."),
  status: z.enum(ITEM_STATUSES).default("draft"),
  version: z
    .number()
    .int("Versi harus bilangan bulat.")
    .min(1, "Versi harus 1 atau lebih.")
    .default(1),
});

/** An item with defaults applied: what the rest of the system works with. */
export type Item = z.output<typeof ItemSchema>;
/** An item as written in a file, before defaults. */
export type ItemInput = z.input<typeof ItemSchema>;
export type ItemOption = z.output<typeof OptionSchema>;
export type ItemMedia = z.output<typeof MediaSchema>;
