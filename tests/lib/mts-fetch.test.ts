import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

import {
  isMtsError,
  mtsCreateTask,
  mtsListTasks,
  resetMtsConfigForTests,
  type TaskCreateBody,
} from "../../lib/my-task-sync";

let fetchSpy: MockInstance;

beforeEach(() => {
  process.env.MY_TASK_SYNC_BASE_URL = "http://upstream.test/";
  process.env.MY_TASK_SYNC_API_KEY = "test-key";
  resetMtsConfigForTests();
  fetchSpy = vi.spyOn(globalThis, "fetch");
});

afterEach(() => {
  fetchSpy.mockRestore();
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

describe("mtsFetch via mtsListTasks", () => {
  it("trims trailing slash from baseUrl, sets Bearer header, no-store cache", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, { tasks: [], serverTime: "2026-04-19T00:00:00Z" }),
    );

    await mtsListTasks();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://upstream.test/api/tasks");
    expect((init as RequestInit).cache).toBe("no-store");
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Authorization")).toBe("Bearer test-key");
  });

  it("appends query params in spec order", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, { tasks: [], serverTime: "2026-04-19T00:00:00Z" }),
    );

    await mtsListTasks({
      status: "open",
      since: "2026-04-19T00:00:00Z",
      project: "p1",
      limit: 50,
    });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain("status=open");
    expect(url).toContain("since=2026-04-19T00%3A00%3A00Z");
    expect(url).toContain("project=p1");
    expect(url).toContain("limit=50");
  });

  it("throws MtsError with parsed error body on 4xx", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(400, { error: "title required" }),
    );

    await expect(mtsListTasks()).rejects.toMatchObject({
      status: 400,
      error: "title required",
    });
  });

  it("throws MtsError with HTTP fallback when 5xx body is non-JSON", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("internal error text", { status: 500 }),
    );

    await expect(mtsListTasks()).rejects.toMatchObject({
      status: 500,
      error: "HTTP 500",
    });
  });

  it("propagates network errors as TypeError (not MtsError)", async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError("fetch failed"));

    const err = await mtsListTasks().catch((e) => e);
    expect(err).toBeInstanceOf(TypeError);
    expect(isMtsError(err)).toBe(false);
  });

  it("throws when env vars are missing", async () => {
    delete process.env.MY_TASK_SYNC_BASE_URL;
    resetMtsConfigForTests();

    await expect(mtsListTasks()).rejects.toThrow(
      /MY_TASK_SYNC_BASE_URL is required/,
    );
  });
});

describe("mtsCreateTask", () => {
  it("POSTs JSON with correct headers", async () => {
    const body: TaskCreateBody = {
      title: "t",
      status: "open",
      source: "web",
      updatedAt: "2026-04-19T00:00:00Z",
      createdAt: "2026-04-19T00:00:00Z",
    };
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(201, {
        task: { taskNumber: 1, ...body, projectName: null, due: null, doneAt: null, important: false, reminds: [] },
        serverTime: "2026-04-19T00:00:00Z",
      }),
    );

    await mtsCreateTask(body);

    const [, init] = fetchSpy.mock.calls[0];
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(JSON.stringify(body));
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Content-Type")).toBe("application/json");
  });
});
