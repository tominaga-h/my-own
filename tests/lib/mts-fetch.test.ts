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
  mtsCreateProject,
  mtsCreateTask,
  mtsDeleteProject,
  mtsListTasks,
  mtsUpdateProject,
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

describe("mtsCreateProject", () => {
  it("POSTs /api/projects with JSON body and Bearer", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(201, {
        project: { id: 1, name: "p1" },
        serverTime: "2026-04-19T00:00:00Z",
      }),
    );

    const data = await mtsCreateProject({ name: "p1" });

    expect(data).toEqual({
      project: { id: 1, name: "p1" },
      serverTime: "2026-04-19T00:00:00Z",
    });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://upstream.test/api/projects");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(JSON.stringify({ name: "p1" }));
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Authorization")).toBe("Bearer test-key");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("throws MtsError on 409 conflict", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(409, { error: "project name already exists" }),
    );

    await expect(mtsCreateProject({ name: "p1" })).rejects.toMatchObject({
      status: 409,
      error: "project name already exists",
    });
  });
});

describe("mtsUpdateProject", () => {
  it("PATCHes /api/projects/:id with JSON body", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, {
        project: { id: 7, name: "renamed" },
        serverTime: "2026-04-19T00:00:00Z",
      }),
    );

    const data = await mtsUpdateProject(7, { name: "renamed" });

    expect(data.project.name).toBe("renamed");
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://upstream.test/api/projects/7");
    expect((init as RequestInit).method).toBe("PATCH");
    expect((init as RequestInit).body).toBe(JSON.stringify({ name: "renamed" }));
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Authorization")).toBe("Bearer test-key");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("throws MtsError on 409", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(409, { error: "project name already exists" }),
    );

    const err = await mtsUpdateProject(7, { name: "dup" }).catch((e) => e);
    expect(isMtsError(err)).toBe(true);
    expect(err).toMatchObject({ status: 409, error: "project name already exists" });
  });

  it("throws MtsError on 404", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(404, { error: "project not found" }),
    );

    await expect(mtsUpdateProject(999, { name: "x" })).rejects.toMatchObject({
      status: 404,
      error: "project not found",
    });
  });
});

describe("mtsDeleteProject", () => {
  it("DELETEs /api/projects/:id with no body and resolves on 204", async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(mtsDeleteProject(3)).resolves.toBeUndefined();

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://upstream.test/api/projects/3");
    expect((init as RequestInit).method).toBe("DELETE");
    expect((init as RequestInit).body).toBeUndefined();
    expect((init as RequestInit).cache).toBe("no-store");
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Authorization")).toBe("Bearer test-key");
  });

  it("throws MtsError on 409 with parsed upstream message", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(409, { error: "project has 3 tasks" }),
    );

    const err = await mtsDeleteProject(3).catch((e) => e);
    expect(isMtsError(err)).toBe(true);
    expect(err).toMatchObject({ status: 409, error: "project has 3 tasks" });
  });

  it("throws MtsError on 404", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(404, { error: "project not found" }),
    );

    await expect(mtsDeleteProject(999)).rejects.toMatchObject({
      status: 404,
      error: "project not found",
    });
  });
});
