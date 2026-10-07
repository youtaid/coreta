import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { adminItems, adminUsers, adminWorksheets, getAdminItem } from "../../lib/mock/content";
import { ContentTable } from "./content-table";
import { ItemEditor } from "./item-editor";
import { ItemPreview } from "./item-preview";
import { ReleaseList } from "./release-list";
import { filterUsers, UserDirectory } from "./user-directory";

describe("ContentTable", () => {
  const html = renderToStaticMarkup(createElement(ContentTable, { items: adminItems }));

  it("lists every item with an edit link to its editor", () => {
    for (const item of adminItems) {
      expect(html).toContain(`href="/admin/konten/butir/${item.id}"`);
    }
    expect(html).toContain(`Menampilkan ${adminItems.length} dari ${adminItems.length} butir`);
  });

  it("marks unhealthy items", () => {
    expect(html).toContain("Terlalu mudah");
    expect(html).toContain("Terlalu sulit");
    expect(html).toContain("Sering dilaporkan");
  });
});

describe("ItemEditor", () => {
  const render = (id: string) =>
    renderToStaticMarkup(createElement(ItemEditor, { item: getAdminItem(id)! }));

  it("shows every field of the items model", () => {
    const html = render("item-math-01");
    for (const field of [
      "code",
      "competency",
      "tier",
      "answer_type",
      "layout_mode",
      "difficulty",
      "stimulus_id",
      "stem",
      "explanation",
    ]) {
      expect(html).toContain(field);
    }
    expect(html).toContain("versi 3");
  });

  it("offers short-answer fields only for isian items", () => {
    expect(render("item-isian-01")).toContain("equivalents");
    expect(render("item-isian-01")).toContain("tolerance");
    expect(render("item-math-01")).not.toContain("equivalents");
  });

  it("enables publishing for a valid item and disables it for one with problems", () => {
    expect(render("item-math-01")).toContain("Semua pemeriksaan lolos");
    const invalid = render("item-long-01");
    expect(invalid).toContain("Pengecoh D, E belum punya petunjuk.");
    expect(invalid).toMatch(/<button[^>]*disabled[^>]*>\s*Terbitkan/);
  });
});

describe("ItemPreview", () => {
  const html = renderToStaticMarkup(
    createElement(ItemPreview, { previewSrc: "/admin/pratinjau/x" }),
  );

  it("offers the three screen sizes, starting with landscape tablet", () => {
    expect(html).toContain("Tablet mendatar");
    expect(html).toContain("Tablet tegak");
    expect(html).toContain("Ponsel");
    expect(html).toContain('width="1180"');
    expect(html).toContain('src="/admin/pratinjau/x"');
  });
});

describe("ReleaseList", () => {
  const html = renderToStaticMarkup(createElement(ReleaseList, { worksheets: adminWorksheets }));

  it("explains what blocks an unreleased worksheet", () => {
    expect(html).toContain("2 butir belum terbit.");
    expect(html).toContain("Slot ulang berisi 1 soal, seharusnya 2.");
  });

  it("offers release only for drafts", () => {
    const drafts = adminWorksheets.filter((w) => w.status === "draft").length;
    expect(html.match(/>Terbitkan</g)).toHaveLength(drafts);
  });
});

describe("UserDirectory", () => {
  it("finds users by name or email and returns all for an empty query", () => {
    expect(filterUsers(adminUsers, "")).toHaveLength(adminUsers.length);
    expect(filterUsers(adminUsers, "  DEWI ").map((u) => u.id)).toEqual(["usr-101"]);
    expect(filterUsers(adminUsers, "siswa.coreta").map((u) => u.id)).toEqual(["usr-102"]);
    expect(filterUsers(adminUsers, "zzz")).toEqual([]);
  });

  it("offers extending access to parents only", () => {
    const html = renderToStaticMarkup(createElement(UserDirectory, { users: adminUsers }));
    const parents = adminUsers.filter((u) => u.role === "parent").length;
    expect(html.match(/Perpanjang akses</g)).toHaveLength(parents);
  });
});
