import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CONSENT_VERSION, isCurrentConsent } from "./consent";

describe("versi persetujuan", () => {
  it("hanya persetujuan versi yang berlaku yang dianggap sah", () => {
    expect(isCurrentConsent({ granted: true, version: CONSENT_VERSION })).toBe(true);
    expect(isCurrentConsent({ granted: false, version: CONSENT_VERSION })).toBe(false);
    expect(isCurrentConsent({ granted: true, version: "persetujuan-v0" })).toBe(false);
    expect(isCurrentConsent({ granted: true, version: "tidak-tercatat" })).toBe(false);
    expect(isCurrentConsent(null)).toBe(false);
  });

  it("versi akun contoh di seed sama dengan versi teks yang berlaku", () => {
    const families = JSON.parse(
      readFileSync(
        fileURLToPath(new URL("../../../packages/content/seed/families.json", import.meta.url)),
        "utf8",
      ),
    ) as { consent_version: string };
    expect(families.consent_version).toBe(CONSENT_VERSION);
  });
});
