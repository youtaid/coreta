import { describe, expect, it } from "vitest";

import { decideRoute, landingAfterSignIn, requiredRoleFor, roleFromClaims } from "./roles";

describe("roleFromClaims", () => {
  it("membaca peran dari app_metadata", () => {
    expect(roleFromClaims({ app_metadata: { role: "student" } })).toBe("siswa");
    expect(roleFromClaims({ app_metadata: { role: "parent" } })).toBe("ortu");
    expect(roleFromClaims({ app_metadata: { role: "admin" } })).toBe("admin");
  });

  it("tanpa peran yang dikenal menjadi orang tua, sama dengan trigger handle_new_user", () => {
    expect(roleFromClaims({ app_metadata: {} })).toBe("ortu");
    expect(roleFromClaims({ app_metadata: { role: "superuser" } })).toBe("ortu");
    expect(roleFromClaims({})).toBe("ortu");
  });

  it("NEGATIF: peran di user_metadata diabaikan", () => {
    expect(
      roleFromClaims({
        app_metadata: {},
        user_metadata: { role: "admin" },
      } as { app_metadata: unknown }),
    ).toBe("ortu");
  });

  it("tanpa klaim berarti belum masuk", () => {
    expect(roleFromClaims(null)).toBeNull();
    expect(roleFromClaims(undefined)).toBeNull();
  });
});

describe("requiredRoleFor", () => {
  it("memetakan setiap rute peran", () => {
    expect(requiredRoleFor("/belajar")).toBe("siswa");
    expect(requiredRoleFor("/belajar/kerjakan/abc")).toBe("siswa");
    expect(requiredRoleFor("/bantuan")).toBe("siswa");
    expect(requiredRoleFor("/ortu/laporan/2026-W40")).toBe("ortu");
    expect(requiredRoleFor("/admin/antrean")).toBe("admin");
  });

  it("tidak menganggap awalan yang mirip sebagai rute peran", () => {
    expect(requiredRoleFor("/belajarlah")).toBeNull();
    expect(requiredRoleFor("/ortuku")).toBeNull();
    expect(requiredRoleFor("/administrasi")).toBeNull();
  });

  it("rute publik tidak butuh peran", () => {
    for (const path of ["/", "/harga", "/masuk", "/daftar", "/persetujuan/abc", "/api/health"]) {
      expect(requiredRoleFor(path)).toBeNull();
    }
  });
});

describe("decideRoute", () => {
  it("pengguna yang belum masuk dialihkan ke /masuk dengan tujuan semula", () => {
    expect(decideRoute("/admin/antrean", null)).toEqual({
      action: "redirect",
      to: "/masuk?next=%2Fadmin%2Fantrean",
      reason: "login-required",
    });
    expect(decideRoute("/ortu/laporan", null, "?minggu=2026-W40")).toMatchObject({
      to: "/masuk?next=%2Fortu%2Flaporan%3Fminggu%3D2026-W40",
    });
  });

  it("peran yang sesuai boleh lewat", () => {
    expect(decideRoute("/belajar/worksheet", "siswa")).toEqual({ action: "allow" });
    expect(decideRoute("/ortu/anak", "ortu")).toEqual({ action: "allow" });
    expect(decideRoute("/admin/konten", "admin")).toEqual({ action: "allow" });
  });

  it("NEGATIF: setiap peran ditolak dari rute peran lain dan dikirim ke halaman awalnya", () => {
    const cases = [
      ["siswa", "/ortu/laporan", "/belajar"],
      ["siswa", "/admin/antrean", "/belajar"],
      ["ortu", "/belajar", "/ortu/laporan"],
      ["ortu", "/bantuan", "/ortu/laporan"],
      ["ortu", "/admin/pengguna", "/ortu/laporan"],
      ["admin", "/belajar/kerjakan/x", "/admin/antrean"],
      ["admin", "/ortu/anak", "/admin/antrean"],
    ] as const;
    for (const [role, path, landing] of cases) {
      expect(decideRoute(path, role)).toEqual({
        action: "redirect",
        to: landing,
        reason: "wrong-role",
      });
    }
  });

  it("pengguna yang sudah masuk tidak melihat /masuk dan /daftar lagi", () => {
    expect(decideRoute("/masuk", "siswa")).toMatchObject({ to: "/belajar", reason: "signed-in" });
    expect(decideRoute("/daftar", "ortu")).toMatchObject({ to: "/ortu/laporan" });
    expect(decideRoute("/masuk", null)).toEqual({ action: "allow" });
  });

  it("halaman publik selalu boleh", () => {
    expect(decideRoute("/", null)).toEqual({ action: "allow" });
    expect(decideRoute("/harga", "admin")).toEqual({ action: "allow" });
    expect(decideRoute("/persetujuan/abc", null)).toEqual({ action: "allow" });
  });
});

describe("landingAfterSignIn", () => {
  it("kembali ke tujuan semula bila peran boleh membukanya", () => {
    expect(landingAfterSignIn("ortu", "/ortu/laporan/2026-W40")).toBe("/ortu/laporan/2026-W40");
    expect(landingAfterSignIn("siswa", "/belajar/worksheet?minggu=1")).toBe(
      "/belajar/worksheet?minggu=1",
    );
    expect(landingAfterSignIn("ortu", "/harga")).toBe("/harga");
  });

  it("tanpa tujuan ke halaman awal peran", () => {
    expect(landingAfterSignIn("siswa", null)).toBe("/belajar");
    expect(landingAfterSignIn("admin", "")).toBe("/admin/antrean");
  });

  it("NEGATIF: tujuan di luar situs ditolak (open redirect)", () => {
    for (const next of [
      "https://evil.example/curi",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "evil.example",
    ]) {
      expect(landingAfterSignIn("ortu", next)).toBe("/ortu/laporan");
    }
  });

  it("NEGATIF: tujuan milik peran lain diganti halaman awal", () => {
    expect(landingAfterSignIn("siswa", "/admin/antrean")).toBe("/belajar");
    expect(landingAfterSignIn("ortu", "/masuk")).toBe("/ortu/laporan");
  });
});
