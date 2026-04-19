import { describe, expect, it } from "vitest";

import {
  isRfc3339Datetime,
  isTaskStatus,
  MtsValidationError,
  pickTaskCreate,
  pickTaskPatch,
} from "../my-task-sync";

describe("isTaskStatus", () => {
  it.each(["open", "done", "closed"])("accepts %s", (s) => {
    expect(isTaskStatus(s)).toBe(true);
  });

  it.each([null, undefined, "OPEN", "in_progress", "", 1, {}])(
    "rejects %p",
    (v) => {
      expect(isTaskStatus(v)).toBe(false);
    },
  );
});

describe("isRfc3339Datetime", () => {
  it.each([
    "2026-04-19T12:00:00Z",
    "2026-04-19T12:00:00.123Z",
    "2026-04-19T12:00:00+09:00",
    "2026-04-19T12:00:00.456-05:00",
  ])("accepts %s", (s) => {
    expect(isRfc3339Datetime(s)).toBe(true);
  });

  it.each([
    "2026-04-19",
    "2026-04-19T12:00:00",
    "2026/04/19T12:00:00Z",
    "not a date",
    "",
    "2026-13-99T99:99:99Z",
  ])("rejects %s", (s) => {
    expect(isRfc3339Datetime(s)).toBe(false);
  });
});

describe("pickTaskCreate", () => {
  const valid = {
    title: "test",
    status: "open" as const,
    source: "web",
    updatedAt: "2026-04-19T12:00:00Z",
    createdAt: "2026-04-19T12:00:00Z",
  };

  it("accepts a minimal valid body", () => {
    expect(pickTaskCreate(valid)).toEqual(valid);
  });

  it("preserves optional fields", () => {
    const out = pickTaskCreate({
      ...valid,
      projectName: "p1",
      due: "2026-04-20",
      doneAt: null,
      important: true,
      reminds: ["2026-04-20"],
    });
    expect(out.projectName).toBe("p1");
    expect(out.due).toBe("2026-04-20");
    expect(out.doneAt).toBeNull();
    expect(out.important).toBe(true);
    expect(out.reminds).toEqual(["2026-04-20"]);
  });

  it("rejects taskNumber in body", () => {
    expect(() => pickTaskCreate({ ...valid, taskNumber: 1 })).toThrow(
      MtsValidationError,
    );
  });

  it("rejects unknown fields", () => {
    expect(() => pickTaskCreate({ ...valid, reminders: [] })).toThrow(
      /unknown field: reminders/,
    );
  });

  it("rejects reminds: null", () => {
    expect(() => pickTaskCreate({ ...valid, reminds: null })).toThrow(
      /reminds must not be null/,
    );
  });

  it("rejects bad status", () => {
    expect(() => pickTaskCreate({ ...valid, status: "OPEN" })).toThrow(
      /status/,
    );
  });

  it("rejects non-RFC3339 createdAt", () => {
    expect(() => pickTaskCreate({ ...valid, createdAt: "2026-04-19" })).toThrow(
      /createdAt/,
    );
  });

  it("rejects non-object body", () => {
    expect(() => pickTaskCreate(null)).toThrow(/JSON object/);
    expect(() => pickTaskCreate([])).toThrow(/JSON object/);
    expect(() => pickTaskCreate("str")).toThrow(/JSON object/);
  });

  it("rejects non-boolean important", () => {
    expect(() => pickTaskCreate({ ...valid, important: "yes" })).toThrow(
      /important/,
    );
  });
});

describe("pickTaskPatch", () => {
  it("accepts an empty body", () => {
    expect(pickTaskPatch({})).toEqual({});
  });

  it("rejects taskNumber", () => {
    expect(() => pickTaskPatch({ taskNumber: 5 })).toThrow(/taskNumber/);
  });

  it("rejects unknown fields", () => {
    expect(() => pickTaskPatch({ foo: "bar" })).toThrow(/unknown field: foo/);
  });

  it("rejects reminds: null", () => {
    expect(() => pickTaskPatch({ reminds: null })).toThrow(
      /reminds must not be null/,
    );
  });

  it("allows partial updates", () => {
    expect(pickTaskPatch({ status: "done", important: true })).toEqual({
      status: "done",
      important: true,
    });
  });

  it("validates updatedAt format if present", () => {
    expect(() => pickTaskPatch({ updatedAt: "2026-04-19" })).toThrow(
      /updatedAt/,
    );
  });

  it("preserves null for projectName/due/doneAt", () => {
    expect(
      pickTaskPatch({ projectName: null, due: null, doneAt: null }),
    ).toEqual({ projectName: null, due: null, doneAt: null });
  });
});
