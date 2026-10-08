import { describe, expect, it } from "vitest";

import { NAV_ITEMS, ROLE_HOME, findActiveItem, parseDevRole } from "./navigation";

describe("findActiveItem", () => {
  const student = NAV_ITEMS.student;

  it.each([
    ["/belajar", "path"],
    ["/belajar/worksheet", "worksheet"],
    ["/belajar/kerjakan/ws-mock-301", "worksheet"],
    ["/belajar/hasil/ws-mock-201", "worksheet"],
    ["/belajar/progres", "progress"],
    ["/bantuan", "help"],
  ])("%s → %s", (pathname, key) => {
    expect(findActiveItem(student, pathname)?.key).toBe(key);
  });

  it("does not treat a sibling path with the same prefix as active", () => {
    expect(findActiveItem(student, "/belajarku")).toBeNull();
    expect(findActiveItem(student, "/bantuan-lain")).toBeNull();
  });

  it("maps invoices to the subscription item for parents", () => {
    expect(findActiveItem(NAV_ITEMS.parent, "/ortu/faktur")?.key).toBe("subscription");
  });

  it("returns null outside the role's area", () => {
    expect(findActiveItem(NAV_ITEMS.admin, "/belajar")).toBeNull();
  });
});

describe("role homes", () => {
  it("are reachable from each role's navigation", () => {
    for (const role of ["student", "parent", "admin"] as const) {
      expect(findActiveItem(NAV_ITEMS[role], ROLE_HOME[role])?.href).toBe(ROLE_HOME[role]);
    }
  });
});

describe("parseDevRole", () => {
  it.each([
    ["siswa", "student"],
    ["ORTU", "parent"],
    ["admin", "admin"],
  ])("%s → %s", (value, role) => {
    expect(parseDevRole(value)).toBe(role);
  });

  it("rejects unknown, missing, or repeated values", () => {
    expect(parseDevRole("guru")).toBeNull();
    expect(parseDevRole(undefined)).toBeNull();
    expect(parseDevRole(["siswa", "admin"])).toBeNull();
  });
});
