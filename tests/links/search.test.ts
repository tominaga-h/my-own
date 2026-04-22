import { describe, expect, it } from "vitest";

import {
  buildHighlightSegments,
  filterLinksByQuery,
  truncateAroundMatch,
  type LinkSearchRecord,
} from "../../lib/links/search";

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
    sourceLabel: "https://vercel.com/blog/next-app-router",
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

  it("matches against the sourceLabel (displayed URL)", () => {
    const result = filterLinksByQuery(records, "vercel.com");
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
    expect(result.map((r) => r.id)).toEqual([2]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterLinksByQuery(records, "nonexistent-term-xyz")).toEqual([]);
  });

  it("tolerates missing sourceLabel", () => {
    const result = filterLinksByQuery(records, "react.dev");
    expect(result.map((r) => r.id)).toEqual([1]);
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

  it("returns a text segment when the source text is empty", () => {
    expect(buildHighlightSegments("", "foo")).toEqual([
      { type: "text", value: "" },
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

  it("handles adjacent non-overlapping matches", () => {
    expect(buildHighlightSegments("aaaa", "aa")).toEqual([
      { type: "match", value: "aa" },
      { type: "match", value: "aa" },
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

describe("truncateAroundMatch", () => {
  it("returns text as-is when shorter than max", () => {
    expect(truncateAroundMatch("short", 180, "x")).toBe("short");
  });

  it("truncates from the head with ellipsis when no query is given", () => {
    const text = "a".repeat(300);
    const result = truncateAroundMatch(text, 20);
    expect(result).toHaveLength(20);
    expect(result.endsWith("…")).toBe(true);
  });

  it("truncates from the head with ellipsis when query does not match", () => {
    const text = "a".repeat(300);
    const result = truncateAroundMatch(text, 20, "zzz");
    expect(result).toHaveLength(20);
    expect(result.endsWith("…")).toBe(true);
  });

  it("head-truncates when the match is already inside the leading window", () => {
    const text = "match comes early " + "x".repeat(500);
    const result = truncateAroundMatch(text, 40, "match");
    expect(result.includes("match")).toBe(true);
    expect(result.endsWith("…")).toBe(true);
    expect(result.startsWith("…")).toBe(false);
  });

  it("truncates around a match positioned deep in the text", () => {
    const text = "x".repeat(400) + " MATCHED_TOKEN " + "y".repeat(400);
    const result = truncateAroundMatch(text, 60, "matched_token");
    expect(result.toLowerCase().includes("matched_token")).toBe(true);
    expect(result.startsWith("…")).toBe(true);
    expect(result.endsWith("…")).toBe(true);
  });

  it("matches the highlighting function on the truncated output", () => {
    const text = "x".repeat(400) + " MATCHED_TOKEN " + "y".repeat(400);
    const truncated = truncateAroundMatch(text, 60, "matched_token");
    const segments = buildHighlightSegments(truncated, "matched_token");
    const matchSegments = segments.filter((s) => s.type === "match");
    expect(matchSegments).toHaveLength(1);
    expect(matchSegments[0].value).toBe("MATCHED_TOKEN");
  });
});
