import { describe, expect, it } from "vitest";

import { allValid, copy, validIsian, validPg } from "./fixtures";
import { formatImportReport, importItems } from "./import";

describe("importItems", () => {
  it("accepts a list of valid items, from text or from parsed JSON", () => {
    const fromText = importItems(JSON.stringify(allValid));
    expect(fromText.ok).toBe(true);
    expect(fromText.items.map((item) => item.code)).toEqual(allValid.map((item) => item.code));
    expect(fromText.rejected).toEqual([]);

    expect(importItems(allValid).items).toHaveLength(allValid.length);
  });

  it("accepts an object with an items list", () => {
    const result = importItems(JSON.stringify({ items: [validPg] }));
    expect(result.ok).toBe(true);
    expect(result.items).toHaveLength(1);
  });

  it("returns accepted items with defaults filled in", () => {
    const [item] = importItems([validIsian]).items;
    expect(item?.status).toBe("draft");
    expect(item?.version).toBe(1);
  });

  it("keeps good items and reports bad ones, so one mistake does not hide the rest", () => {
    const bad = { ...copy(validIsian), code: "MAT-SMA-ALJ-08", explanation: { text: "" } };
    const result = importItems([validPg, bad, validIsian]);
    expect(result.ok).toBe(false);
    expect(result.items.map((i) => i.code)).toEqual(["MAT-SMA-ALJ-01", "MAT-SMA-ALJ-07"]);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]).toMatchObject({ index: 1, code: "MAT-SMA-ALJ-08" });
    expect(result.rejected[0]?.errors[0]?.code).toBe("explanation_missing");
  });

  it("rejects text that is not JSON, with the parser's reason", () => {
    const result = importItems("{ ini bukan json");
    expect(result.ok).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.rejected[0]).toMatchObject({ index: -1 });
    expect(result.rejected[0]?.errors[0]?.code).toBe("invalid_json");
    expect(result.rejected[0]?.errors[0]?.message).toMatch(/^Berkas bukan JSON yang valid: /);
  });

  it.each([
    ["a number", 42],
    ["null", null],
    ["an object without items", { butir: [] }],
    ["items that is not a list", { items: "x" }],
    ["a string of JSON that is not a list", '"teks"'],
  ])("rejects %s as the wrong shape", (_label, source) => {
    const result = importItems(source);
    expect(result.rejected[0]?.errors[0]?.code).toBe("invalid_shape");
    expect(result.items).toEqual([]);
  });

  it("accepts an empty list", () => {
    expect(importItems([])).toEqual({ items: [], rejected: [], ok: true });
  });

  it("rejects a code that appears twice, the second time", () => {
    const result = importItems([validPg, copy(validPg)]);
    expect(result.items).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]).toMatchObject({ index: 1, code: "MAT-SMA-ALJ-01" });
    expect(result.rejected[0]?.errors[0]).toMatchObject({
      code: "duplicate_code",
      message: 'Kode butir "MAT-SMA-ALJ-01" sudah dipakai butir lain di berkas ini.',
    });
  });

  it("counts a rejected item's code, so a later copy is still seen as a duplicate", () => {
    const broken = { ...copy(validPg), explanation: { text: "" } };
    const result = importItems([broken, validPg]);
    expect(result.items).toEqual([]);
    expect(result.rejected[1]?.errors.map((e) => e.code)).toContain("duplicate_code");
  });

  it("reports an entry that is not an object, without a code", () => {
    const result = importItems([validPg, 7, null]);
    expect(result.items).toHaveLength(1);
    expect(result.rejected.map((r) => [r.index, r.code])).toEqual([
      [1, undefined],
      [2, undefined],
    ]);
  });

  it("reports the code of an item whose structure is broken, when it can be read", () => {
    const result = importItems([{ ...copy(validPg), tier: "x" }, { code: 5 }]);
    expect(result.rejected[0]?.code).toBe("MAT-SMA-ALJ-01");
    expect(result.rejected[1]?.code).toBeUndefined();
  });
});

describe("formatImportReport", () => {
  it("summarises a clean import in one line", () => {
    expect(formatImportReport(importItems(allValid))).toBe(
      `${allValid.length} butir diterima, 0 ditolak.`,
    );
  });

  it("lists each rejection with its item and reasons", () => {
    const bad = { ...copy(validIsian), code: "MAT-SMA-ALJ-08", answer_key: ["enam"] };
    const report = formatImportReport(importItems([validPg, bad]));
    expect(report).toContain("1 butir diterima, 1 ditolak.");
    expect(report).toContain("Butir ke-2 (MAT-SMA-ALJ-08):");
    expect(report).toContain('- Kunci isian "enam" bukan angka; isian dinilai sebagai angka.');
  });

  it("names the file when the whole file is refused, and omits a missing code", () => {
    expect(formatImportReport(importItems("bukan json"))).toContain("Berkas:\n- Berkas bukan JSON");
    expect(formatImportReport(importItems([5]))).toContain("Butir ke-1:\n");
  });
});
