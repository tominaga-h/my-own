import { describe, expect, it } from "vitest";

import {
  DEFAULT_VIEW_MODE,
  VIEW_MODE_STORAGE_KEY,
  parseViewMode,
  safeHostname,
} from "../../../lib/links/viewMode";

describe("parseViewMode", () => {
  it("returns 'card' for 'card'", () => {
    expect(parseViewMode("card")).toBe("card");
  });

  it("returns 'compact' for 'compact'", () => {
    expect(parseViewMode("compact")).toBe("compact");
  });

  it("returns default for null", () => {
    expect(parseViewMode(null)).toBe(DEFAULT_VIEW_MODE);
    expect(parseViewMode(null)).toBe("card");
  });

  it("returns default for undefined", () => {
    expect(parseViewMode(undefined)).toBe(DEFAULT_VIEW_MODE);
    expect(parseViewMode(undefined)).toBe("card");
  });

  it("returns default for empty string", () => {
    expect(parseViewMode("")).toBe("card");
  });

  it("returns default for garbage values", () => {
    expect(parseViewMode("garbage")).toBe("card");
  });
});

describe("safeHostname", () => {
  it("extracts hostname from standard https url", () => {
    expect(safeHostname("https://example.com/path?q=1")).toBe("example.com");
  });

  it("extracts hostname from subdomain http url", () => {
    expect(safeHostname("http://sub.example.co.jp")).toBe("sub.example.co.jp");
  });

  it("returns empty string for non-url string", () => {
    expect(safeHostname("not a url")).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(safeHostname("")).toBe("");
  });
});

describe("VIEW_MODE_STORAGE_KEY", () => {
  it("matches the expected storage key", () => {
    expect(VIEW_MODE_STORAGE_KEY).toBe("my-own.links.viewMode");
  });
});
