import { describe, expect, it } from "vitest";

import { partitionByRead } from "../../lib/links/partition";

type Row = { id: number; isRead: boolean };

describe("partitionByRead", () => {
  it("returns empty buckets for empty input", () => {
    const { unread, archived } = partitionByRead<Row>([]);
    expect(unread).toEqual([]);
    expect(archived).toEqual([]);
  });

  it("places all unread rows into the unread bucket", () => {
    const rows: Row[] = [
      { id: 1, isRead: false },
      { id: 2, isRead: false },
      { id: 3, isRead: false },
    ];
    const { unread, archived } = partitionByRead(rows);
    expect(unread.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(archived).toEqual([]);
  });

  it("places all read rows into the archived bucket", () => {
    const rows: Row[] = [
      { id: 1, isRead: true },
      { id: 2, isRead: true },
    ];
    const { unread, archived } = partitionByRead(rows);
    expect(unread).toEqual([]);
    expect(archived.map((r) => r.id)).toEqual([1, 2]);
  });

  it("splits a mixed list while preserving order in each bucket", () => {
    const rows: Row[] = [
      { id: 1, isRead: false },
      { id: 2, isRead: true },
      { id: 3, isRead: false },
      { id: 4, isRead: true },
      { id: 5, isRead: false },
    ];
    const { unread, archived } = partitionByRead(rows);
    expect(unread.map((r) => r.id)).toEqual([1, 3, 5]);
    expect(archived.map((r) => r.id)).toEqual([2, 4]);
  });
});
