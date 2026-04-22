import { describe, expect, it } from "vitest";

import { mapMtsErrorResponse } from "../../lib/mts-error-response";
import { MtsValidationError, type MtsError } from "../../lib/my-task-sync";

async function readJson(resp: Response) {
  return (await resp.json()) as { error: string };
}

describe("mapMtsErrorResponse", () => {
  it("returns 400 for MtsValidationError with original message", async () => {
    const resp = mapMtsErrorResponse(new MtsValidationError("title required"));
    expect(resp.status).toBe(400);
    expect(await readJson(resp)).toEqual({ error: "title required" });
  });

  it("passes through 4xx upstream error string", async () => {
    const err: MtsError = { status: 404, error: "task not found" };
    const resp = mapMtsErrorResponse(err);
    expect(resp.status).toBe(404);
    expect(await readJson(resp)).toEqual({ error: "task not found" });
  });

  it("sanitizes 5xx upstream errors to a generic message", async () => {
    const err: MtsError = {
      status: 500,
      error: "panicked at /path/to/secret.rs:42",
    };
    const resp = mapMtsErrorResponse(err);
    expect(resp.status).toBe(502);
    expect(await readJson(resp)).toEqual({
      error: "my-task-sync upstream error",
    });
  });

  it("returns 502 unreachable for non-MtsError throwables", async () => {
    const resp = mapMtsErrorResponse(new TypeError("fetch failed"));
    expect(resp.status).toBe(502);
    expect(await readJson(resp)).toEqual({ error: "my-task-sync unreachable" });
  });

  it("returns 502 unreachable for unknown thrown values", async () => {
    const resp = mapMtsErrorResponse("just a string");
    expect(resp.status).toBe(502);
    expect(await readJson(resp)).toEqual({ error: "my-task-sync unreachable" });
  });
});
