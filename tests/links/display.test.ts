import { describe, expect, it } from "vitest";

import { deriveDisplayFields, type LinkRow } from "../../lib/links/display";

function makeRow(overrides: Partial<LinkRow> = {}): LinkRow {
  return {
    id: 1,
    url: "https://example.com/raw",
    title: null,
    description: null,
    slackAttachments: null,
    createdAt: "2026-04-22T00:00:00.000Z",
    postedAt: "2026-04-22T00:00:00.000Z",
    readAt: null,
    ...overrides,
  };
}

describe("deriveDisplayFields", () => {
  it("falls back to the row URL when no attachment title exists", () => {
    const d = deriveDisplayFields(makeRow());
    expect(d.title).toBe("https://example.com/raw");
    expect(d.description).toBe("");
    expect(d.imageUrl).toBeNull();
    expect(d.serviceName).toBe("Link");
    expect(d.targetUrl).toBe("https://example.com/raw");
    expect(d.sourceLabel).toBe("https://example.com/raw");
    expect(d.rawUrl).toBe("https://example.com/raw");
  });

  it("prefers row fields over attachment fields", () => {
    const d = deriveDisplayFields(
      makeRow({
        title: "Row Title",
        description: "Row description",
        slackAttachments: [
          {
            title: "Attachment Title",
            text: "Attachment text",
          },
        ],
      }),
    );
    expect(d.title).toBe("Row Title");
    expect(d.description).toBe("Row description");
  });

  it("falls back through attachment fields when row fields are null", () => {
    const d = deriveDisplayFields(
      makeRow({
        slackAttachments: [
          {
            title: "Attachment Title",
            text: "Attachment text",
            image_url: "https://img.example/a.png",
            service_name: "GitHub",
            title_link: "https://github.com/foo",
            original_url: "https://github.com/foo/bar",
          },
        ],
      }),
    );
    expect(d.title).toBe("Attachment Title");
    expect(d.description).toBe("Attachment text");
    expect(d.imageUrl).toBe("https://img.example/a.png");
    expect(d.serviceName).toBe("GitHub");
    expect(d.targetUrl).toBe("https://github.com/foo");
    expect(d.sourceLabel).toBe("https://github.com/foo/bar");
  });

  it("falls back to fallback text when attachment text is missing", () => {
    const d = deriveDisplayFields(
      makeRow({
        slackAttachments: [{ fallback: "fallback text" }],
      }),
    );
    expect(d.description).toBe("fallback text");
  });

  it("falls back to thumb_url when image_url is missing", () => {
    const d = deriveDisplayFields(
      makeRow({
        slackAttachments: [{ thumb_url: "https://img.example/t.png" }],
      }),
    );
    expect(d.imageUrl).toBe("https://img.example/t.png");
  });

  it("treats non-array slackAttachments as empty", () => {
    const d = deriveDisplayFields(
      makeRow({ slackAttachments: "not-an-array" as unknown as null }),
    );
    expect(d.imageUrl).toBeNull();
    expect(d.serviceName).toBe("Link");
  });

  it("marks unread when readAt is null", () => {
    const d = deriveDisplayFields(makeRow({ readAt: null }));
    expect(d.isRead).toBe(false);
    expect(d.readAt).toBeNull();
  });

  it("marks read when readAt has an ISO timestamp", () => {
    const readAt = "2026-04-23T12:00:00.000Z";
    const d = deriveDisplayFields(makeRow({ readAt }));
    expect(d.isRead).toBe(true);
    expect(d.readAt).toBe(readAt);
  });
});
