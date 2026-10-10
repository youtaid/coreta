import { describe, expect, it } from "vitest";

import { findTablesWithoutRls, listPublicTables, qualify, stripNonCode } from "./rls-check";

const one = (sql: string) => findTablesWithoutRls([{ name: "0001.sql", sql }]);

describe("qualify", () => {
  it.each([
    ["foo", "public.foo"],
    ["Foo", "public.foo"],
    ["public.Foo", "public.foo"],
    ['"Foo"', "public.Foo"],
    ['"Public"."My ""Table"""', 'Public.My "Table"'],
    ["storage . objects", "storage.objects"],
  ])("%s → %s", (name, expected) => {
    expect(qualify(name)).toBe(expected);
  });
});

describe("findTablesWithoutRls", () => {
  it("accepts a table that enables RLS", () => {
    expect(
      one(`create table public.a (id int);
           alter table public.a enable row level security;`),
    ).toEqual([]);
  });

  it("reports a table that never enables RLS", () => {
    expect(one("create table public.a (id int);")).toEqual([
      { table: "public.a", file: "0001.sql", reason: "never enabled" },
    ]);
  });

  it("treats tables without a schema as public and ignores case", () => {
    expect(one("CREATE TABLE IF NOT EXISTS Notes (id int);")).toEqual([
      { table: "public.notes", file: "0001.sql", reason: "never enabled" },
    ]);
    expect(
      one(`create table notes (id int);
           ALTER TABLE ONLY Public.NOTES ENABLE ROW LEVEL SECURITY;`),
    ).toEqual([]);
  });

  it("respects quoted identifiers", () => {
    expect(
      one(`create table public."Mixed" (id int);
           alter table public.mixed enable row level security;`),
    ).toEqual([{ table: "public.Mixed", file: "0001.sql", reason: "never enabled" }]);
  });

  it("ignores temporary tables and other schemas", () => {
    expect(
      one(`create temporary table scratch (id int);
           create temp table t2 (id int);
           create table storage.extra (id int);
           create table auth.thing (id int);`),
    ).toEqual([]);
  });

  it("still checks unlogged tables", () => {
    expect(one("create unlogged table public.cache (id int);")).toHaveLength(1);
  });

  it("accepts RLS enabled in a later migration", () => {
    expect(
      findTablesWithoutRls([
        { name: "0002.sql", sql: "alter table public.a enable row level security;" },
        { name: "0001.sql", sql: "create table public.a (id int);" },
      ]),
    ).toEqual([]);
  });

  it("reports RLS that a later migration disables", () => {
    expect(
      findTablesWithoutRls([
        {
          name: "0001.sql",
          sql: "create table public.a (id int); alter table public.a enable row level security;",
        },
        { name: "0002.sql", sql: "alter table if exists public.a disable row level security;" },
      ]),
    ).toEqual([{ table: "public.a", file: "0001.sql", reason: "disabled" }]);
  });

  it("forgets dropped tables, including lists", () => {
    expect(
      one(`create table public.a (id int);
           create table public.b (id int);
           drop table if exists public.a, b;`),
    ).toEqual([]);
  });

  it("follows renames", () => {
    expect(
      one(`create table public.a (id int);
           alter table public.a enable row level security;
           alter table public.a rename to b;`),
    ).toEqual([]);
    expect(
      one(`create table public.a (id int);
           alter table public.a rename to b;`),
    ).toEqual([{ table: "public.b", file: "0001.sql", reason: "never enabled" }]);
  });

  it("ignores DDL inside comments, strings, and function bodies", () => {
    expect(
      one(`-- create table public.c1 (id int);
           /* create table public.c2 (id int); */
           select 'create table public.c3 (id int)';
           create function f() returns void language sql as $$ create table public.c4 (id int) $$;
           create function g() returns void language plpgsql as $body$ begin end $body$;`),
    ).toEqual([]);
  });

  it("is not fooled by an enable statement that only appears in a comment", () => {
    expect(
      one(`create table public.a (id int);
           -- alter table public.a enable row level security;`),
    ).toHaveLength(1);
  });
});

describe("stripNonCode", () => {
  it("keeps code and blanks comments and literals", () => {
    expect(stripNonCode("select 'it''s' -- note\nfrom t /* x */;")).toBe("select '' \nfrom t  ;");
  });
});

describe("listPublicTables", () => {
  it("lists tables that survive all migrations", () => {
    expect(
      listPublicTables([
        { name: "0001.sql", sql: "create table a (id int); create table storage.s (id int);" },
        { name: "0002.sql", sql: "create table public.b (id int); drop table a;" },
      ]),
    ).toEqual(["public.b"]);
  });
});
