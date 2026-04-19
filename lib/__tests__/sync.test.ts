import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

import { runAllSync } from "../sync";

let fetchSpy: MockInstance;

beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, "fetch");
});

afterEach(() => {
  fetchSpy.mockRestore();
});

function ok(body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function err(status: number, body: unknown = { error: "boom" }) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function routeOf(call: unknown[]): string {
  return String(call[0]);
}

describe("runAllSync", () => {
  it("returns empty failures on success", async () => {
    fetchSpy.mockImplementation(async (url: string) => {
      if (url === "/api/dev/slack/sync") return ok({ notesInserted: 1 });
      if (url === "/api/tasks") return ok({ tasks: [] });
      throw new Error(`unexpected ${url}`);
    });

    const failures = await runAllSync("k");
    expect(failures).toEqual([]);
  });

  it("forwards Bearer token to both endpoints", async () => {
    fetchSpy.mockImplementation(async () => ok({}));

    await runAllSync("my-key");

    for (const call of fetchSpy.mock.calls) {
      const init = call[1] as RequestInit | undefined;
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer my-key");
    }
  });

  it("reports Slack failure when /api/dev/slack/sync returns 500", async () => {
    fetchSpy.mockImplementation(async (url: string) => {
      if (url === "/api/dev/slack/sync") return err(500);
      return ok({ tasks: [] });
    });

    const failures = await runAllSync("k");
    expect(failures).toEqual(["Slack"]);
  });

  it("reports Tasks failure when /api/tasks returns 502", async () => {
    fetchSpy.mockImplementation(async (url: string) => {
      if (url === "/api/dev/slack/sync") return ok({});
      return err(502, { error: "upstream" });
    });

    const failures = await runAllSync("k");
    expect(failures).toEqual(["Tasks"]);
  });

  it("reports both failures when both fail", async () => {
    fetchSpy.mockImplementation(async () => err(500));
    const failures = await runAllSync("k");
    expect(failures).toEqual(["Slack", "Tasks"]);
  });

  it("treats 200 with body.ok=false as Slack failure", async () => {
    fetchSpy.mockImplementation(async (url: string) => {
      if (url === "/api/dev/slack/sync") return ok({ ok: false, error: "x" });
      return ok({ tasks: [] });
    });

    const failures = await runAllSync("k");
    expect(failures).toEqual(["Slack"]);
  });

  it("posts to slack endpoint with method POST", async () => {
    fetchSpy.mockImplementation(async () => ok({}));
    await runAllSync("k");
    const slackCall = fetchSpy.mock.calls.find(
      (c) => routeOf(c) === "/api/dev/slack/sync",
    );
    expect(slackCall).toBeDefined();
    expect((slackCall![1] as RequestInit).method).toBe("POST");
  });
});
