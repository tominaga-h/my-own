import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

import { GET, POST } from "../route";
import { GET as GET_ONE, PATCH as PATCH_ONE } from "../[taskNumber]/route";
import { resetMtsConfigForTests } from "../../../../lib/my-task-sync";

const API_KEY = "route-test-key";
const APP_USER = "00000000-0000-0000-0000-000000000000";

let fetchSpy: MockInstance;

beforeEach(() => {
  process.env.API_KEY = API_KEY;
  process.env.APP_USER_ID = APP_USER;
  process.env.MY_TASK_SYNC_BASE_URL = "http://upstream.test";
  process.env.MY_TASK_SYNC_API_KEY = "mts-test";
  resetMtsConfigForTests();
  fetchSpy = vi.spyOn(globalThis, "fetch");
});

afterEach(() => {
  fetchSpy.mockRestore();
  delete process.env.API_KEY;
  delete process.env.APP_USER_ID;
  delete process.env.MY_TASK_SYNC_BASE_URL;
  delete process.env.MY_TASK_SYNC_API_KEY;
  resetMtsConfigForTests();
});

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function authedRequest(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${API_KEY}`);
  return new Request(url, { ...init, headers });
}

describe("GET /api/tasks", () => {
  it("rejects unauthenticated request with 401", async () => {
    const res = await GET(new Request("http://app.test/api/tasks"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid since", async () => {
    const res = await GET(
      authedRequest("http://app.test/api/tasks?since=2026-04-19"),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: /RFC 3339/ });
  });

  it("returns 400 for invalid status", async () => {
    const res = await GET(
      authedRequest("http://app.test/api/tasks?status=OPEN"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty project after trim", async () => {
    const res = await GET(
      authedRequest("http://app.test/api/tasks?project=%20%20"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for project > 200 chars", async () => {
    const long = "x".repeat(201);
    const res = await GET(
      authedRequest(`http://app.test/api/tasks?project=${long}`),
    );
    expect(res.status).toBe(400);
  });

  it("forwards valid params to upstream", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, { tasks: [], serverTime: "2026-04-19T00:00:00Z" }),
    );

    const res = await GET(
      authedRequest(
        "http://app.test/api/tasks?since=2026-04-19T00:00:00Z&status=open&project=p1",
      ),
    );

    expect(res.status).toBe(200);
    const [url] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("status=open");
    expect(String(url)).toContain("project=p1");
  });

  it("returns 502 when upstream is unreachable", async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError("fetch failed"));
    const res = await GET(authedRequest("http://app.test/api/tasks"));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: /unreachable/ });
  });

  it("sanitizes 5xx upstream error", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(500, { error: "panic at line 42" }),
    );
    const res = await GET(authedRequest("http://app.test/api/tasks"));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "my-task-sync upstream error" });
  });
});

describe("POST /api/tasks", () => {
  it("rejects body with taskNumber", async () => {
    const res = await POST(
      authedRequest("http://app.test/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          taskNumber: 1,
          title: "x",
          status: "open",
          source: "web",
          updatedAt: "2026-04-19T00:00:00Z",
          createdAt: "2026-04-19T00:00:00Z",
        }),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: /taskNumber/ });
  });

  it("rejects unknown field", async () => {
    const res = await POST(
      authedRequest("http://app.test/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "x",
          status: "open",
          source: "web",
          updatedAt: "2026-04-19T00:00:00Z",
          createdAt: "2026-04-19T00:00:00Z",
          reminders: [],
        }),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: /reminders/ });
  });

  it("forwards a valid body to upstream and returns 201", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(201, {
        task: {
          taskNumber: 1,
          title: "x",
          status: "open",
          source: "web",
          projectName: null,
          due: null,
          doneAt: null,
          important: false,
          updatedAt: "2026-04-19T00:00:00Z",
          createdAt: "2026-04-19T00:00:00Z",
          reminds: [],
        },
        serverTime: "2026-04-19T00:00:00Z",
      }),
    );

    const res = await POST(
      authedRequest("http://app.test/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "x",
          status: "open",
          source: "web",
          updatedAt: "2026-04-19T00:00:00Z",
          createdAt: "2026-04-19T00:00:00Z",
        }),
      }),
    );
    expect(res.status).toBe(201);
  });
});

describe("GET /api/tasks/[taskNumber]", () => {
  const params = (n: string) => Promise.resolve({ taskNumber: n });

  it("rejects invalid taskNumber", async () => {
    const res = await GET_ONE(authedRequest("http://app.test/api/tasks/abc"), {
      params: params("abc"),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 passthrough from upstream", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(404, { error: "task not found" }),
    );
    const res = await GET_ONE(authedRequest("http://app.test/api/tasks/99"), {
      params: params("99"),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "task not found" });
  });

  it("rejects unauthenticated", async () => {
    const res = await GET_ONE(new Request("http://app.test/api/tasks/1"), {
      params: params("1"),
    });
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/tasks/[taskNumber]", () => {
  const params = (n: string) => Promise.resolve({ taskNumber: n });

  it("rejects body with taskNumber", async () => {
    const res = await PATCH_ONE(
      authedRequest("http://app.test/api/tasks/1", {
        method: "PATCH",
        body: JSON.stringify({ taskNumber: 2, status: "done" }),
      }),
      { params: params("1") },
    );
    expect(res.status).toBe(400);
  });

  it("rejects reminds: null", async () => {
    const res = await PATCH_ONE(
      authedRequest("http://app.test/api/tasks/1", {
        method: "PATCH",
        body: JSON.stringify({ reminds: null }),
      }),
      { params: params("1") },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: /reminds/ });
  });

  it("forwards valid patch", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, {
        task: {
          taskNumber: 1,
          title: "x",
          status: "done",
          source: "web",
          projectName: null,
          due: null,
          doneAt: "2026-04-19",
          important: false,
          updatedAt: "2026-04-19T00:00:00Z",
          createdAt: "2026-04-19T00:00:00Z",
          reminds: [],
        },
        serverTime: "2026-04-19T00:00:00Z",
      }),
    );

    const res = await PATCH_ONE(
      authedRequest("http://app.test/api/tasks/1", {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      }),
      { params: params("1") },
    );
    expect(res.status).toBe(200);
  });
});
