import { describe, expect, it } from "vitest";
import {
  applyReview,
  computeMastery,
  isReviewDue,
  type MasteryState,
  type TierAttempt,
} from "./mastery";

describe("mastery model v1 (Fase 23)", () => {
  const DAY_MS = 86_400_000;
  const now = 1_000_000_000;

  it("hanya menghitung percobaan pertama pada setiap butir (percobaan ulang tidak menaikkan skor)", () => {
    const attempts: TierAttempt[] = [
      // Percobaan pertama pada item-1: skor 0
      { itemId: "item-1", tier: "dasar", score: 0, submittedAt: 100 },
      // Percobaan kedua pada item-1: skor 1 (harus diabaikan)
      { itemId: "item-1", tier: "dasar", score: 1, submittedAt: 200 },
      // Percobaan pertama pada item-2: skor 1
      { itemId: "item-2", tier: "dasar", score: 1, submittedAt: 300 },
    ];

    const result = computeMastery(attempts, now);
    // Hanya item-1 (skor 0) dan item-2 (skor 1) yang dihitung -> mean = 0.5
    expect(result.tiers.dasar.attempts).toBe(2);
    expect(result.tiers.dasar.score).toBe(0.5);
    expect(result.tiers.mahir.unlocked).toBe(false);
  });

  it("membuka tingkat berikutnya tepat saat skor >= 70% dengan minimal 5 percobaan pertama", () => {
    // 4 percobaan sempurna belum cukup membuka mahir (< UNLOCK_MIN_ATTEMPTS = 5)
    const fourAttempts: TierAttempt[] = Array.from({ length: 4 }, (_, i) => ({
      itemId: `item-${i + 1}`,
      tier: "dasar",
      score: 1.0,
      submittedAt: 100 + i * 10,
    }));

    const result4 = computeMastery(fourAttempts, now);
    expect(result4.tiers.dasar.attempts).toBe(4);
    expect(result4.tiers.dasar.unlocked).toBe(true);
    expect(result4.tiers.mahir.unlocked).toBe(false);

    // Tambah percobaan ke-5 dengan skor 0.7 (total mean = (4 * 1.0 + 0.7) / 5 = 0.94 >= 0.7)
    const fiveAttempts: TierAttempt[] = [
      ...fourAttempts,
      { itemId: "item-5", tier: "dasar", score: 0.7, submittedAt: 150 },
    ];

    const result5 = computeMastery(fiveAttempts, now);
    expect(result5.tiers.dasar.attempts).toBe(5);
    expect(result5.tiers.mahir.unlocked).toBe(true);
    expect(result5.tiers.ujian.unlocked).toBe(false);
  });

  it("mencapai status tuntas saat skor ujian >= 80% dengan minimal 8 percobaan pertama", () => {
    const dasarAttempts: TierAttempt[] = Array.from({ length: 5 }, (_, i) => ({
      itemId: `dasar-${i + 1}`,
      tier: "dasar",
      score: 1.0,
      submittedAt: 100 + i,
    }));
    const mahirAttempts: TierAttempt[] = Array.from({ length: 5 }, (_, i) => ({
      itemId: `mahir-${i + 1}`,
      tier: "mahir",
      score: 1.0,
      submittedAt: 200 + i,
    }));
    const ujianAttempts7: TierAttempt[] = Array.from({ length: 7 }, (_, i) => ({
      itemId: `ujian-${i + 1}`,
      tier: "ujian",
      score: 0.8,
      submittedAt: 300 + i,
    }));

    const all7 = [...dasarAttempts, ...mahirAttempts, ...ujianAttempts7];
    const result7 = computeMastery(all7, now);
    expect(result7.mastered).toBe(false);
    expect(result7.newlyMastered).toBe(false);

    // Tambah percobaan ke-8 pada ujian dengan skor 0.8
    const all8: TierAttempt[] = [
      ...all7,
      { itemId: "ujian-8", tier: "ujian", score: 0.8, submittedAt: 350 },
    ];
    const result8 = computeMastery(all8, now);
    expect(result8.mastered).toBe(true);
    expect(result8.newlyMastered).toBe(true);
    expect(result8.state.masteredAt).toBe(now);
    expect(result8.state.reviewStep).toBe(0);
    // Jadwal review pertama adalah 3 hari (REVIEW_INTERVAL_DAYS[0])
    expect(result8.state.nextReviewAt).toBe(now + 3 * DAY_MS);
  });

  it("jadwal ulang berjarak: maju jika skor >= 80% dan kembali ke 3 hari jika skor < 80%", () => {
    const masteredState: MasteryState = {
      unlocked: ["dasar", "mahir", "ujian"],
      masteredAt: now,
      revokedAt: null,
      reviewStep: 0,
      nextReviewAt: now + 3 * DAY_MS,
    };

    // Review 1: benar (skor >= 80%), maju ke step 1 (7 hari)
    const review1 = applyReview(masteredState, [1.0, 0.8], now + 3 * DAY_MS);
    expect(review1.masteredAt).toBe(now);
    expect(review1.reviewStep).toBe(1);
    expect(review1.nextReviewAt).toBe(now + 3 * DAY_MS + 7 * DAY_MS);

    // Review 2: benar (skor >= 80%), maju ke step 2 (14 hari)
    const review2 = applyReview(review1, [0.9], review1.nextReviewAt!);
    expect(review2.reviewStep).toBe(2);
    expect(review2.nextReviewAt).toBe(review1.nextReviewAt! + 14 * DAY_MS);

    // Review 3: benar (skor >= 80%), maju ke step 3 (30 hari - batas maksimum)
    const review3 = applyReview(review2, [1.0], review2.nextReviewAt!);
    expect(review3.reviewStep).toBe(3);
    expect(review3.nextReviewAt).toBe(review2.nextReviewAt! + 30 * DAY_MS);

    // Review 4: benar lagi, tetap pada batas 30 hari
    const review4 = applyReview(review3, [0.85], review3.nextReviewAt!);
    expect(review4.reviewStep).toBe(3);

    // Review 5: skor 0.70 (antara 60% dan 80%), kembali ke step 0 (3 hari) tapi belum dicabut
    const review5 = applyReview(review4, [0.7], review4.nextReviewAt!);
    expect(review5.masteredAt).toBe(now);
    expect(review5.reviewStep).toBe(0);
    expect(review5.nextReviewAt).toBe(review4.nextReviewAt! + 3 * DAY_MS);
  });

  it("mencabut status tuntas jika ulangan mendapat skor rata-rata < 60%", () => {
    const masteredState: MasteryState = {
      unlocked: ["dasar", "mahir", "ujian"],
      masteredAt: now,
      revokedAt: null,
      reviewStep: 2,
      nextReviewAt: now + 14 * DAY_MS,
    };

    // Skor 0.5 (< 60%) mencabut mastery
    const reviewRevoked = applyReview(masteredState, [0.5, 0.4], now + 14 * DAY_MS);
    expect(reviewRevoked.masteredAt).toBeNull();
    expect(reviewRevoked.revokedAt).toBe(now + 14 * DAY_MS);
    expect(reviewRevoked.reviewStep).toBe(0);
    expect(reviewRevoked.nextReviewAt).toBeNull();
  });

  it("isReviewDue memvalidasi jatuh tempo secara akurat berdasarkan now", () => {
    const dueTime = now + 3 * DAY_MS;
    const state: MasteryState = {
      unlocked: ["dasar", "mahir", "ujian"],
      masteredAt: now,
      revokedAt: null,
      reviewStep: 0,
      nextReviewAt: dueTime,
    };

    expect(isReviewDue(state, dueTime - 1)).toBe(false);
    expect(isReviewDue(state, dueTime)).toBe(true);
    expect(isReviewDue(state, dueTime + 1000)).toBe(true);

    // Jika belum mastered (masteredAt === null), tidak pernah due
    expect(isReviewDue({ ...state, masteredAt: null }, dueTime + 1000)).toBe(false);
  });
});
