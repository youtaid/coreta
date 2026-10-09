import { describe, expect, it } from "vitest";
import {
  composeWorksheet,
  getItemId,
  WORKSHEET_SIZE,
  type CompetencyCandidatePool,
} from "./compose";
import type { MasteryState } from "./mastery";

describe("composeWorksheet (Fase 24)", () => {
  it("komposisi normal 4/2/2 menghasilkan 8 butir dengan rincian kategori yang tepat", () => {
    const baru = ["baru-1", "baru-2", "baru-3", "baru-4", "baru-5", "baru-6"];
    const adaptif = ["adaptif-1", "adaptif-2", "adaptif-3"];
    const review = ["review-1", "review-2", "review-3"];

    const result = composeWorksheet({ baru, adaptif, review });

    expect(result).toHaveLength(WORKSHEET_SIZE);
    expect(result.items).toHaveLength(WORKSHEET_SIZE);
    expect(result.counts).toEqual({
      baru: 4,
      adaptif: 2,
      review: 2,
    });

    // 4 baru
    expect(result.slots.filter((s) => s.category === "baru")).toHaveLength(4);
    // 2 adaptif
    expect(result.slots.filter((s) => s.category === "adaptif")).toHaveLength(2);
    // 2 review
    expect(result.slots.filter((s) => s.category === "review")).toHaveLength(2);

    // Hasil selalu 8 soal berbeda (unik)
    const uniqueIds = new Set(result.items.map(getItemId));
    expect(uniqueIds.size).toBe(8);

    // Nomor urut slot 1 s.d. 8
    expect(result.slots[0]?.slotNumber).toBe(1);
    expect(result.slots[7]?.slotNumber).toBe(8);
  });

  it("tanpa soal ulang jatuh tempo menghasilkan 6 soal baru + 2 adaptif", () => {
    const baru = ["b1", "b2", "b3", "b4", "b5", "b6", "b7"];
    const adaptif = ["a1", "a2", "a3"];
    const review: string[] = [];

    const result = composeWorksheet({ baru, adaptif, review });

    expect(result).toHaveLength(8);
    expect(result.counts).toEqual({
      baru: 6,
      adaptif: 2,
      review: 0,
    });

    const uniqueIds = new Set(result.map(getItemId));
    expect(uniqueIds.size).toBe(8);
  });

  it("tanpa soal adaptif menghasilkan 6 soal baru + 2 ulang berjarak", () => {
    const baru = ["b1", "b2", "b3", "b4", "b5", "b6", "b7"];
    const adaptif: string[] = [];
    const review = ["r1", "r2", "r3"];

    const result = composeWorksheet({ baru, adaptif, review });

    expect(result).toHaveLength(8);
    expect(result.counts).toEqual({
      baru: 6,
      adaptif: 0,
      review: 2,
    });
  });

  it("tanpa soal adaptif dan tanpa ulang berjarak menghasilkan 8 soal baru", () => {
    const baru = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9"];

    const result = composeWorksheet({ baru });

    expect(result).toHaveLength(8);
    expect(result.counts).toEqual({
      baru: 8,
      adaptif: 0,
      review: 0,
    });
    expect(new Set(result).size).toBe(8);
  });

  it("kategori parsial (hanya 1 review) mengalokasikan slot kosong ke soal baru (5 baru + 2 adaptif + 1 review)", () => {
    const baru = ["b1", "b2", "b3", "b4", "b5", "b6"];
    const adaptif = ["a1", "a2"];
    const review = ["r1"]; // hanya 1

    const result = composeWorksheet({ baru, adaptif, review });

    expect(result).toHaveLength(8);
    expect(result.counts).toEqual({
      baru: 5,
      adaptif: 2,
      review: 1,
    });
  });

  it("kategori parsial (hanya 1 adaptif) mengalokasikan slot kosong ke soal baru (5 baru + 1 adaptif + 2 review)", () => {
    const baru = ["b1", "b2", "b3", "b4", "b5", "b6"];
    const adaptif = ["a1"]; // hanya 1
    const review = ["r1", "r2"];

    const result = composeWorksheet({ baru, adaptif, review });

    expect(result).toHaveLength(8);
    expect(result.counts).toEqual({
      baru: 5,
      adaptif: 1,
      review: 2,
    });
  });

  it("mencegah duplikasi saat butir yang sama muncul di beberapa pool kandidat", () => {
    // butir-overlap ada di baru, adaptif, dan review
    const baru = ["shared-1", "b2", "b3", "b4", "b5", "b6", "b7"];
    const adaptif = ["shared-1", "a2"];
    const review = ["shared-1", "r2"];

    const result = composeWorksheet({ baru, adaptif, review });

    // Harus selalu 8 butir unik
    expect(result).toHaveLength(8);
    const uniqueIds = new Set(result);
    expect(uniqueIds.size).toBe(8);

    // shared-1 hanya terpilih satu kali (dalam hal ini diprioritaskan di review lebih awal)
    const sharedOccurrences = result.filter((item) => item === "shared-1");
    expect(sharedOccurrences).toHaveLength(1);
  });

  it("memilih soal adaptif dari kompetensi dengan skor terendah terlebih dahulu", () => {
    const baru = ["b1", "b2", "b3", "b4", "b5"];
    const pools: CompetencyCandidatePool[] = [
      {
        competencyId: "aljabar-mahir",
        score: 0.85,
        items: ["aljabar-1", "aljabar-2"],
      },
      {
        competencyId: "pecahan-dasar",
        score: 0.35, // paling rendah (terlemah)
        items: ["pecahan-1", "pecahan-2"],
      },
      {
        competencyId: "geometri-bangun",
        score: 0.65,
        items: ["geometri-1", "geometri-2"],
      },
    ];
    const review = ["r1", "r2"];

    const result = composeWorksheet({
      baru,
      adaptif: pools,
      review,
    });

    expect(result.counts.adaptif).toBe(2);
    const adaptifSlots = result.slots.filter((s) => s.category === "adaptif");

    // Harus memilih dari kompetensi skor terendah ("pecahan-dasar")
    expect(adaptifSlots[0]?.item).toBe("pecahan-1");
    expect(adaptifSlots[0]?.competencyId).toBe("pecahan-dasar");
    expect(adaptifSlots[1]?.item).toBe("pecahan-2");
    expect(adaptifSlots[1]?.competencyId).toBe("pecahan-dasar");
  });

  it("hanya menyertakan review jika review jatuh tempo pada timestamp `now`", () => {
    const now = 100_000_000;
    const dayMs = 86_400_000;

    const reviewDueState: MasteryState = {
      unlocked: ["dasar", "mahir", "ujian"],
      masteredAt: now - 5 * dayMs,
      revokedAt: null,
      reviewStep: 0,
      nextReviewAt: now - 1 * dayMs, // jatuh tempo kemarin
    };

    const reviewNotDueState: MasteryState = {
      unlocked: ["dasar", "mahir", "ujian"],
      masteredAt: now - 1 * dayMs,
      revokedAt: null,
      reviewStep: 0,
      nextReviewAt: now + 2 * dayMs, // belum jatuh tempo (2 hari lagi)
    };

    const reviewPools: CompetencyCandidatePool[] = [
      {
        competencyId: "comp-not-due",
        mastery: reviewNotDueState,
        items: ["not-due-1", "not-due-2"],
      },
      {
        competencyId: "comp-due",
        mastery: reviewDueState,
        items: ["due-1", "due-2"],
      },
    ];

    const result = composeWorksheet({
      baru: ["b1", "b2", "b3", "b4", "b5"],
      adaptif: ["a1", "a2"],
      review: reviewPools,
      now,
    });

    expect(result.counts.review).toBe(2);
    const reviewSlots = result.slots.filter((s) => s.category === "review");
    expect(reviewSlots.map((s) => s.item)).toEqual(["due-1", "due-2"]);
  });

  it("bekerja dengan objek butir kustom ({ id: string, title: string })", () => {
    interface CustomItem {
      id: string;
      title: string;
    }

    const baru: CustomItem[] = [
      { id: "b1", title: "Soal Baru 1" },
      { id: "b2", title: "Soal Baru 2" },
      { id: "b3", title: "Soal Baru 3" },
      { id: "b4", title: "Soal Baru 4" },
    ];
    const adaptif: CustomItem[] = [
      { id: "a1", title: "Soal Adaptif 1" },
      { id: "a2", title: "Soal Adaptif 2" },
    ];
    const review: CustomItem[] = [
      { id: "r1", title: "Soal Ulang 1" },
      { id: "r2", title: "Soal Ulang 2" },
    ];

    const result = composeWorksheet<CustomItem>({ baru, adaptif, review });

    expect(result).toHaveLength(8);
    expect(result[0]?.title).toBe("Soal Baru 1");
    expect(result.slots[0]?.itemId).toBe("b1");
    expect(result.counts).toEqual({ baru: 4, adaptif: 2, review: 2 });
  });

  it("dapat dipanggil dengan argumen posisional composeWorksheet(baru, adaptif, review)", () => {
    const baru = ["b1", "b2", "b3", "b4"];
    const adaptif = ["a1", "a2"];
    const review = ["r1", "r2"];

    const result = composeWorksheet(baru, adaptif, review);

    expect(result).toHaveLength(8);
    expect(result.counts).toEqual({ baru: 4, adaptif: 2, review: 2 });
  });

  it("melempar galat yang jelas jika total kandidat unik kurang dari total ukuran worksheet", () => {
    const baru = ["b1", "b2"];
    const adaptif = ["a1"];
    const review = ["r1"];

    expect(() => composeWorksheet({ baru, adaptif, review })).toThrow(
      /Tidak cukup butir unik untuk menyusun worksheet/,
    );
  });
});
