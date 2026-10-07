import { describe, expect, it } from "vitest";

import { allValid, copy, validBs, validIsian, validPg, validPgk, validWithMedia } from "./fixtures";
import { formatErrors, validateItem } from "./validate";

/** Validate a modified copy of `base` and return the error codes. */
function codesFor(base: object, change: (item: Record<string, unknown>) => void): string[] {
  const item = copy(base) as Record<string, unknown>;
  change(item);
  return validateItem(item).errors.map((error) => error.code);
}

describe("valid items", () => {
  it.each(allValid.map((item) => [item.code, item] as const))("accepts %s", (_code, item) => {
    const result = validateItem(item);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("fills in defaults on the accepted item", () => {
    const result = validateItem(validIsian);
    expect(result.ok && result.item.status).toBe("draft");
    expect(result.ok && result.item.version).toBe(1);
    expect(result.ok && result.item.options).toEqual([]);
    expect(result.ok && result.item.media).toEqual([]);
  });
});

describe("media without alt text is refused with a clear message", () => {
  it("rejects missing alt text, naming the media", () => {
    const result = validateItem({
      ...copy(validWithMedia),
      media: [{ id: "media-parabola-01", kind: "diagram" }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        path: "media[0].alt_text",
        code: "media_alt_text",
        message: 'Media "media-parabola-01" wajib punya teks alternatif (alt_text).',
      },
    ]);
  });

  it("rejects blank alt text the same way", () => {
    const codes = codesFor(validWithMedia, (item) => {
      item.media = [{ id: "m1", kind: "image", alt_text: "   " }];
    });
    expect(codes).toEqual(["media_alt_text"]);
  });

  it("checks every media item and says which one", () => {
    const result = validateItem({
      ...copy(validWithMedia),
      media: [
        { id: "ok", kind: "image", alt_text: "Gambar." },
        { id: "bad", kind: "table" },
      ],
    });
    expect(result.errors.map((e) => e.path)).toEqual(["media[1].alt_text"]);
  });

  it("requires a transcript for audio", () => {
    const codes = codesFor(validWithMedia, (item) => {
      item.media = [{ id: "a1", kind: "audio", alt_text: "Rekaman soal." }];
    });
    expect(codes).toEqual(["media_transcript"]);
    expect(
      codesFor(validWithMedia, (item) => {
        item.media = [{ id: "a1", kind: "audio", alt_text: "Rekaman.", transcript: "Halo." }];
      }),
    ).toEqual([]);
  });

  it("rejects the same media id used twice", () => {
    const codes = codesFor(validWithMedia, (item) => {
      item.media = [
        { id: "m", kind: "image", alt_text: "A" },
        { id: "m", kind: "image", alt_text: "B" },
      ];
    });
    expect(codes).toEqual(["media_duplicate"]);
  });
});

describe("a choice item without distractor hints is refused", () => {
  it("names every wrong option that has no hint", () => {
    const result = validateItem({ ...copy(validPg), distractor_hints: {} });
    expect(result.ok).toBe(false);
    expect(result.errors.map((e) => e.code)).toEqual([
      "hint_missing",
      "hint_missing",
      "hint_missing",
    ]);
    expect(result.errors.map((e) => e.message)).toEqual([
      "Pengecoh A belum punya petunjuk.",
      "Pengecoh C belum punya petunjuk.",
      "Pengecoh D belum punya petunjuk.",
    ]);
  });

  it("treats a blank hint as missing", () => {
    const codes = codesFor(validPg, (item) => {
      (item.distractor_hints as Record<string, string>).a = "  ";
    });
    expect(codes).toEqual(["hint_missing"]);
  });

  it("needs hints for complex choice too, but not for the key options", () => {
    expect(codesFor(validPgk, (item) => (item.distractor_hints = {}))).toEqual(["hint_missing"]);
  });

  it("does not need hints for true/false statements or short answers", () => {
    expect(codesFor(validBs, (item) => (item.distractor_hints = {}))).toEqual([]);
    expect(codesFor(validIsian, () => {})).toEqual([]);
  });

  it("rejects a hint for an option that does not exist", () => {
    const codes = codesFor(validPg, (item) => {
      (item.distractor_hints as Record<string, string>).zzz = "Petunjuk gantung.";
    });
    expect(codes).toEqual(["hint_unknown_option"]);
  });
});

describe("the answer key", () => {
  it("must exist", () => {
    expect(codesFor(validPg, (item) => (item.answer_key = []))).toContain("key_missing");
    expect(codesFor(validPg, (item) => (item.answer_key = ["", "  "]))).toContain("key_missing");
    expect(
      validateItem({ ...copy(validPg), answer_key: [] }).errors.find(
        (e) => e.code === "key_missing",
      )?.message,
    ).toBe("Kunci jawaban belum diisi.");
  });

  it("allows only one key for single choice", () => {
    expect(codesFor(validPg, (item) => (item.answer_key = ["a", "b"]))).toContain("key_count");
  });

  it("must point at options that exist", () => {
    expect(codesFor(validPg, (item) => (item.answer_key = ["ghost"]))).toContain(
      "key_unknown_option",
    );
    expect(codesFor(validBs, (item) => (item.answer_key = ["r1", "r9"]))).toContain(
      "key_unknown_option",
    );
  });

  it("must not make every option a key for complex choice", () => {
    expect(codesFor(validPgk, (item) => (item.answer_key = ["a", "b", "c", "d"]))).toContain(
      "key_all_options",
    );
  });

  it("must be a single number for a short answer", () => {
    expect(codesFor(validIsian, (item) => (item.answer_key = ["enam"]))).toContain(
      "isian_key_not_number",
    );
    expect(codesFor(validIsian, (item) => (item.answer_key = ["6", "7"]))).toContain("key_count");
    expect(codesFor(validIsian, (item) => (item.answer_key = ["Rp60.000"]))).toEqual([]);
    expect(codesFor(validIsian, (item) => (item.answer_key = ["3/4"]))).toEqual([]);
  });
});

describe("other content rules", () => {
  it("requires an explanation", () => {
    expect(codesFor(validPg, (item) => (item.explanation = { text: "  " }))).toEqual([
      "explanation_missing",
    ]);
    expect(codesFor(validPg, (item) => delete item.explanation)).toEqual(["explanation_missing"]);
  });

  it("requires a stem", () => {
    expect(codesFor(validPg, (item) => (item.stem = { text: " " }))).toEqual(["stem_empty"]);
  });

  it("needs two options for choice items and one statement for true/false", () => {
    expect(
      codesFor(validPg, (item) => {
        item.options = [{ id: "a", text: "Satu" }];
        item.answer_key = ["a"];
        item.distractor_hints = {};
      }),
    ).toEqual(["options_too_few"]);
    expect(
      codesFor(validBs, (item) => {
        item.options = [];
        item.answer_key = [];
        item.distractor_hints = {};
      }),
    ).toEqual(expect.arrayContaining(["options_too_few"]));
  });

  it("rejects repeated option ids", () => {
    const codes = codesFor(validPg, (item) => {
      (item.options as { id: string }[])[1]!.id = "a";
    });
    expect(codes).toContain("option_duplicate");
  });

  it("does not allow options on a short answer", () => {
    expect(codesFor(validIsian, (item) => (item.options = [{ id: "a", text: "Opsi" }]))).toContain(
      "isian_has_options",
    );
  });

  it("keeps tolerance and equivalents to short answers", () => {
    expect(codesFor(validPg, (item) => (item.tolerance = 0.1))).toEqual(["tolerance_not_isian"]);
    expect(codesFor(validPg, (item) => (item.equivalents = ["x"]))).toEqual([
      "equivalents_not_isian",
    ]);
    expect(codesFor(validPg, (item) => (item.equivalents = []))).toEqual([]);
  });
});

describe("layout_mode", () => {
  it("must fit the content: media needs at least media", () => {
    const result = validateItem({ ...copy(validWithMedia), layout_mode: "standar" });
    expect(result.errors).toEqual([
      {
        path: "layout_mode",
        code: "layout_too_small",
        message: 'layout_mode "standar" tidak muat; isi butir butuh "media".',
      },
    ]);
  });

  it("a stimulus needs bacaan, and a larger mode than needed is fine", () => {
    expect(codesFor(validPg, (item) => (item.stimulus_id = "stim-1"))).toEqual([
      "layout_too_small",
    ]);
    expect(
      codesFor(validPg, (item) => {
        item.stimulus_id = "stim-1";
        item.layout_mode = "bacaan";
      }),
    ).toEqual([]);
    expect(codesFor(validPg, (item) => (item.layout_mode = "bacaan"))).toEqual([]);
  });

  it("rejects a value that is not a layout mode", () => {
    const result = validateItem({ ...copy(validPg), layout_mode: "penuh" });
    expect(result.errors).toEqual([
      {
        path: "layout_mode",
        code: "invalid_value",
        message: 'Bidang "layout_mode" harus salah satu dari: standar, media, bacaan.',
      },
    ]);
  });
});

describe("structure errors", () => {
  it("says a missing field is required", () => {
    const item = copy(validPg) as Record<string, unknown>;
    delete item.tier;
    expect(validateItem(item).errors).toEqual([
      { path: "tier", code: "required", message: 'Bidang "tier" wajib diisi.' },
    ]);
  });

  it("says what type a field should be", () => {
    const result = validateItem({ ...copy(validPg), difficulty: "sulit" });
    expect(result.errors[0]).toMatchObject({
      path: "difficulty",
      code: "wrong_type",
      message: 'Bidang "difficulty" harus berupa angka.',
    });
    expect(validateItem({ ...copy(validPg), answer_key: "b" }).errors[0]?.message).toBe(
      'Bidang "answer_key" harus berupa daftar.',
    );
    expect(validateItem({ ...copy(validPg), explanation: "teks" }).errors[0]?.message).toBe(
      'Bidang "explanation" harus berupa objek.',
    );
    expect(
      validateItem({ ...copy(validPg), media: [{ id: "m", kind: "image", pasteable: "ya" }] })
        .errors[0]?.message,
    ).toBe('Bidang "media[0].pasteable" harus berupa benar/salah (true/false).');
  });

  it("lists the allowed values for an enum", () => {
    expect(validateItem({ ...copy(validPg), tier: "pemula" }).errors[0]?.message).toBe(
      'Bidang "tier" harus salah satu dari: dasar, mahir, ujian.',
    );
    expect(validateItem({ ...copy(validPg), answer_type: "esai" }).errors[0]?.message).toContain(
      "pg, pgk, bs, isian",
    );
  });

  it("flags unknown fields, which usually means a typo", () => {
    const result = validateItem({ ...copy(validPg), explaination: "salah ketik" });
    expect(result.errors).toEqual([
      {
        path: "",
        code: "unknown_field",
        message: "Butir memuat bidang yang tidak dikenal: explaination.",
      },
    ]);
    const nested = validateItem({ ...copy(validPg), stem: { text: "Soal", formul: "x" } });
    expect(nested.errors[0]?.message).toBe('Di "stem" memuat bidang yang tidak dikenal: formul.');
  });

  it("checks ranges and formats", () => {
    expect(validateItem({ ...copy(validPg), difficulty: 1.5 }).errors[0]?.message).toBe(
      "Kesulitan harus antara 0 dan 1.",
    );
    expect(validateItem({ ...copy(validPg), difficulty: -0.1 }).errors[0]?.message).toBe(
      "Kesulitan harus antara 0 dan 1.",
    );
    expect(validateItem({ ...copy(validIsian), tolerance: -1 }).errors[0]?.message).toBe(
      "Toleransi harus 0 atau lebih.",
    );
    expect(validateItem({ ...copy(validPg), version: 0 }).errors[0]?.message).toBe(
      "Versi harus 1 atau lebih.",
    );
    expect(validateItem({ ...copy(validPg), version: 1.5 }).errors[0]?.message).toBe(
      'Bidang "version" harus berupa bilangan bulat.',
    );
    expect(validateItem({ ...copy(validPg), code: "mat sma 1" }).errors[0]?.message).toContain(
      "Kode butir harus huruf besar",
    );
  });

  it("reports empty option fields", () => {
    const result = validateItem({
      ...copy(validPg),
      options: [
        { id: "", text: "" },
        { id: "b", text: "Dua" },
      ],
    });
    expect(result.errors.map((e) => e.path)).toEqual(["options[0].id", "options[0].text"]);
  });

  it("refuses something that is not an object, and reports all structure errors together", () => {
    expect(validateItem(null).errors[0]).toMatchObject({
      code: "wrong_type",
      message: "Butir harus berupa objek JSON.",
    });
    expect(validateItem("butir").ok).toBe(false);
    expect(validateItem({}).errors.length).toBeGreaterThan(3);
  });

  it("reports structure errors alone, without content-rule noise", () => {
    const result = validateItem({ ...copy(validPg), tier: "x", distractor_hints: {} });
    expect(result.errors.map((e) => e.code)).toEqual(["invalid_value"]);
  });
});

describe("all problems at once", () => {
  it("returns every content problem in one pass", () => {
    const result = validateItem({
      ...copy(validWithMedia),
      answer_key: [],
      distractor_hints: {},
      explanation: { text: "" },
      media: [{ id: "m1", kind: "diagram" }],
      layout_mode: "standar",
    });
    const codes = result.errors.map((e) => e.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "key_missing",
        "hint_missing",
        "explanation_missing",
        "media_alt_text",
        "layout_too_small",
      ]),
    );
  });

  it("formats errors as readable lines, with the item code if given", () => {
    const errors = validateItem({
      ...copy(validPg),
      explanation: { text: "" },
      answer_key: [],
    }).errors;
    expect(formatErrors(errors)).toBe(
      "- Kunci jawaban belum diisi.\n- Pengecoh B belum punya petunjuk.\n- Pembahasan belum ditulis.",
    );
    expect(formatErrors(errors.slice(0, 1), "MAT-SMA-ALJ-01")).toBe(
      "- MAT-SMA-ALJ-01: Kunci jawaban belum diisi.",
    );
    expect(formatErrors([])).toBe("");
  });
});
