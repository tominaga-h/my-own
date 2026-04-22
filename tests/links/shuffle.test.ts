import { describe, expect, it } from "vitest";

import { shuffle } from "../../lib/links/shuffle";

describe("shuffle", () => {
  it("preserves the multiset of elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    shuffle(input);
    expect(input).toEqual(snapshot);
  });

  it("returns an empty array for an empty input", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("returns a single-element array unchanged", () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it("is deterministic when a fixed random source is injected", () => {
    // Fisher-Yates trace with random() === 0:
    //   i=3: j = floor(0 * 4) = 0 → swap(3, 0) → [4,2,3,1]
    //   i=2: j = floor(0 * 3) = 0 → swap(2, 0) → [3,2,4,1]
    //   i=1: j = floor(0 * 2) = 0 → swap(1, 0) → [2,3,4,1]
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });

  it("can reorder the input (differs from identity for a non-trivial case)", () => {
    expect(shuffle([1, 2, 3, 4, 5], () => 0)).not.toEqual([1, 2, 3, 4, 5]);
  });
});
