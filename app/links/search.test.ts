import { describe, expect, it } from "vitest";

import {
  buildHighlightSegments,
  filterLinksByQuery,
  type LinkSearchRecord,
} from "./search";

const records: LinkSearchRecord[] = [
  {
    id: 1,
    title: "React 19 released",
    url: "https://react.dev/blog/19",
    description: "Announcing the new React major release",
  },
  {
    id: 2,
    title: "Drizzle ORM guide",
    url: "https://orm.drizzle.team/docs",
    description: "TypeScript-first ORM for SQL databases",
  },
  {
    id: 3,
    title: "Next.js App Router",
    url: "https://nextjs.org/docs/app",
    description: "Server components and streaming",
  },
];

describe("filterLinksByQuery", () => {
  it("returns all records when the query is empty", () => {
    expect(filterLinksByQuery(records, "")).toEqual(records);
    expect(filterLinksByQuery(records, "   ")).toEqual(records);
  });

  it("matches against the title", () => {
    const result = filterLinksByQuery(records, "drizzle");
    expect(result.map((r) => r.id)).toEqual([2]);
  });

  it("matches against the URL", () => {
    const result = filterLinksByQuery(records, "nextjs.org");
    expect(result.map((r) => r.id)).toEqual([3]);
  });

  it("matches against the description", () => {
    const result = filterLinksByQuery(records, "server components");
    expect(result.map((r) => r.id)).toEqual([3]);
  });

  it("is case-insensitive", () => {
    const result = filterLinksByQuery(records, "REACT");
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it("trims whitespace from the query", () => {
    const result = filterLinksByQuery(records, "  orm  ");
    expect(result.map((r) => r.id).sort()).toEqual([2]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterLinksByQuery(records, "nonexistent-term-xyz")).toEqual([]);
  });

  it("matches across multiple records", () => {
    const result = filterLinksByQuery(records, "react");
    expect(result.map((r) => r.id).sort()).toEqual([1]);
  });
});

describe("buildHighlightSegments", () => {
  it("returns a single text segment when the query is empty", () => {
    expect(buildHighlightSegments("hello world", "")).toEqual([
      { type: "text", value: "hello world" },
    ]);
    expect(buildHighlightSegments("hello world", "   ")).toEqual([
      { type: "text", value: "hello world" },
    ]);
  });

  it("splits around a single case-insensitive match", () => {
    expect(buildHighlightSegments("Hello React world", "react")).toEqual([
      { type: "text", value: "Hello " },
      { type: "match", value: "React" },
      { type: "text", value: " world" },
    ]);
  });

  it("highlights every occurrence of the query", () => {
    expect(buildHighlightSegments("abc ABC abc", "abc")).toEqual([
      { type: "match", value: "abc" },
      { type: "text", value: " " },
      { type: "match", value: "ABC" },
      { type: "text", value: " " },
      { type: "match", value: "abc" },
    ]);
  });

  it("preserves original casing in the highlighted segments", () => {
    const segments = buildHighlightSegments("Drizzle ORM", "drizzle");
    expect(segments[0]).toEqual({ type: "match", value: "Drizzle" });
  });

  it("returns only text when the query is not present", () => {
    expect(buildHighlightSegments("hello", "xyz")).toEqual([
      { type: "text", value: "hello" },
    ]);
  });
});
