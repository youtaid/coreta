import { describe, expect, it } from "vitest";

import {
  getDevRoleLanding,
  isNavigationItemActive,
  navigationByRole,
  screenRouteSamples,
} from "./navigation";

describe("role navigation", () => {
  it("keeps the student and parent bottom navigation within four items", () => {
    expect(navigationByRole.siswa).toHaveLength(4);
    expect(navigationByRole.ortu).toHaveLength(4);
  });

  it("contains unique concrete paths for every screen in the TIP map", () => {
    expect(screenRouteSamples).toHaveLength(24);
    expect(new Set(screenRouteSamples).size).toBe(screenRouteSamples.length);
  });

  it("marks nested and related routes on their primary navigation item", () => {
    const worksheet = navigationByRole.siswa[1];
    const content = navigationByRole.admin[2];

    expect(isNavigationItemActive("/belajar/kerjakan/demo", worksheet)).toBe(true);
    expect(isNavigationItemActive("/belajar/hasil/demo", worksheet)).toBe(true);
    expect(isNavigationItemActive("/admin/konten/butir/demo", content)).toBe(true);
    expect(isNavigationItemActive("/belajar/progres", navigationByRole.siswa[0])).toBe(false);
  });

  it("resolves only known development roles", () => {
    expect(getDevRoleLanding("siswa")).toBe("/belajar");
    expect(getDevRoleLanding(["ortu", "admin"])).toBe("/ortu/laporan");
    expect(getDevRoleLanding("tidak-ada")).toBeUndefined();
  });
});
