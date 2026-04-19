import { describe, expect, it } from "vitest";

import { parseTaskNumber } from "../parse-task-number";

describe("parseTaskNumber", () => {
  it.each([
    ["1", 1],
    ["42", 42],
    ["999999", 999999],
  ])("accepts %s", (input, expected) => {
    expect(parseTaskNumber(input)).toBe(expected);
  });

  it.each([
    "",
    "0",
    "-1",
    "1.5",
    "1e3",
    " 5 ",
    "5 ",
    " 5",
    "12abc",
    "abc",
    "0x10",
    "+1",
  ])("rejects %p", (input) => {
    expect(parseTaskNumber(input)).toBeNull();
  });
});
