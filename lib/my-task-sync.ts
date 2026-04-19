export type TaskStatus = "open" | "done" | "closed";

export type TaskDto = {
  taskNumber: number;
  title: string;
  status: TaskStatus;
  source: string;
  projectName: string | null;
  due: string | null;
  doneAt: string | null;
  important: boolean;
  updatedAt: string;
  createdAt: string;
  reminds: string[];
};

export type TaskListResponse = {
  tasks: TaskDto[];
  serverTime: string;
};

export type TaskResponse = {
  task: TaskDto;
  serverTime: string;
};

export type ProjectDto = { id: number; name: string };

export type ProjectListResponse = {
  projects: ProjectDto[];
  serverTime: string;
};

export type TaskCreateBody = {
  title: string;
  status: TaskStatus;
  source: string;
  projectName?: string | null;
  due?: string | null;
  doneAt?: string | null;
  important?: boolean;
  updatedAt: string;
  createdAt: string;
  reminds?: string[];
};

export type TaskPatchBody = Partial<{
  title: string;
  status: TaskStatus;
  source: string;
  projectName: string | null;
  due: string | null;
  doneAt: string | null;
  important: boolean;
  updatedAt: string;
  createdAt: string;
  reminds: string[];
}>;

export type MtsError = {
  status: number;
  error: string;
};

export function isMtsError(value: unknown): value is MtsError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "error" in value &&
    typeof (value as { status: unknown }).status === "number" &&
    typeof (value as { error: unknown }).error === "string"
  );
}

let cachedConfig: { baseUrl: string; apiKey: string } | null = null;

function mtsConfig() {
  if (cachedConfig) return cachedConfig;
  const baseUrl = process.env.MY_TASK_SYNC_BASE_URL;
  const apiKey = process.env.MY_TASK_SYNC_API_KEY;
  if (!baseUrl) throw new Error("MY_TASK_SYNC_BASE_URL is required");
  if (!apiKey) throw new Error("MY_TASK_SYNC_API_KEY is required");
  cachedConfig = { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
  return cachedConfig;
}

/** Test-only: reset the module-level config cache when env vars change between tests. */
export function resetMtsConfigForTests(): void {
  cachedConfig = null;
}

async function mtsFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { baseUrl, apiKey } = mtsConfig();
  console.log("mtsFetch", baseUrl, apiKey);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Route Handler 経由でユーザー操作の都度 my-task-sync を叩くため、
  // Next の data cache に乗せず常に upstream を fetch する。
  const resp = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!resp.ok) {
    let errorMsg = `HTTP ${resp.status}`;
    try {
      const body = await resp.json();
      if (typeof body?.error === "string") errorMsg = body.error;
    } catch {
      /* JSON でないレスポンスは status 文字列のまま */
    }
    const err: MtsError = { status: resp.status, error: errorMsg };
    throw err;
  }
  return resp.json() as Promise<T>;
}

export function mtsListTasks(params?: {
  status?: TaskStatus;
  since?: string;
  project?: string;
  limit?: number;
}): Promise<TaskListResponse> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.since) q.set("since", params.since);
  if (params?.project) q.set("project", params.project);
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  const query = q.toString();
  return mtsFetch<TaskListResponse>(`/api/tasks${query ? `?${query}` : ""}`);
}

export function mtsGetTask(taskNumber: number): Promise<TaskResponse> {
  return mtsFetch<TaskResponse>(`/api/tasks/${taskNumber}`);
}

export function mtsCreateTask(body: TaskCreateBody): Promise<TaskResponse> {
  return mtsFetch<TaskResponse>(`/api/tasks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function mtsPatchTask(
  taskNumber: number,
  body: TaskPatchBody,
): Promise<TaskResponse> {
  return mtsFetch<TaskResponse>(`/api/tasks/${taskNumber}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function mtsListProjects(): Promise<ProjectListResponse> {
  return mtsFetch<ProjectListResponse>(`/api/projects`);
}

// ---- Validation helpers (for Route Handlers) ----

const STATUS_SET = new Set<string>(["open", "done", "closed"]);

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

// RFC 3339 datetime: YYYY-MM-DDTHH:MM:SS[.fff][Z|±HH:MM]
const RFC3339_DATETIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export function isRfc3339Datetime(value: string): boolean {
  if (!RFC3339_DATETIME.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

/** Project filter param: trim, then accept 1..200 chars. Returns null if invalid. */
export function normalizeProjectParam(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 200) return null;
  return trimmed;
}

export class MtsValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "MtsValidationError";
  }
}

const CREATE_KEYS = new Set([
  "title",
  "status",
  "source",
  "projectName",
  "due",
  "doneAt",
  "important",
  "updatedAt",
  "createdAt",
  "reminds",
]);

const PATCH_KEYS = CREATE_KEYS;

function ensureObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new MtsValidationError("body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

function rejectExtraneous(
  body: Record<string, unknown>,
  allowed: Set<string>,
): void {
  if ("taskNumber" in body) {
    throw new MtsValidationError("taskNumber must not be set in body");
  }
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) {
      throw new MtsValidationError(`unknown field: ${key}`);
    }
  }
}

function assertRemindsShape(value: unknown, allowOmit: boolean): void {
  if (value === undefined) {
    if (!allowOmit) throw new MtsValidationError("reminds is required");
    return;
  }
  if (value === null) {
    throw new MtsValidationError("reminds must not be null");
  }
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new MtsValidationError("reminds must be an array of strings");
  }
}

export function pickTaskCreate(input: unknown): TaskCreateBody {
  const body = ensureObject(input);
  rejectExtraneous(body, CREATE_KEYS);

  if (typeof body.title !== "string")
    throw new MtsValidationError("title must be a string");
  if (!isTaskStatus(body.status))
    throw new MtsValidationError("status must be open|done|closed");
  if (typeof body.source !== "string")
    throw new MtsValidationError("source must be a string");
  if (typeof body.updatedAt !== "string" || !isRfc3339Datetime(body.updatedAt))
    throw new MtsValidationError("updatedAt must be RFC 3339 datetime");
  if (typeof body.createdAt !== "string" || !isRfc3339Datetime(body.createdAt))
    throw new MtsValidationError("createdAt must be RFC 3339 datetime");

  if ("reminds" in body) assertRemindsShape(body.reminds, true);

  const out: TaskCreateBody = {
    title: body.title,
    status: body.status,
    source: body.source,
    updatedAt: body.updatedAt,
    createdAt: body.createdAt,
  };
  if ("projectName" in body) out.projectName = body.projectName as string | null;
  if ("due" in body) out.due = body.due as string | null;
  if ("doneAt" in body) out.doneAt = body.doneAt as string | null;
  if ("important" in body) {
    if (typeof body.important !== "boolean")
      throw new MtsValidationError("important must be boolean");
    out.important = body.important;
  }
  if ("reminds" in body) out.reminds = body.reminds as string[];
  return out;
}

export function pickTaskPatch(input: unknown): TaskPatchBody {
  const body = ensureObject(input);
  rejectExtraneous(body, PATCH_KEYS);

  const out: TaskPatchBody = {};
  if ("title" in body) {
    if (typeof body.title !== "string")
      throw new MtsValidationError("title must be a string");
    out.title = body.title;
  }
  if ("status" in body) {
    if (!isTaskStatus(body.status))
      throw new MtsValidationError("status must be open|done|closed");
    out.status = body.status;
  }
  if ("source" in body) {
    if (typeof body.source !== "string")
      throw new MtsValidationError("source must be a string");
    out.source = body.source;
  }
  if ("projectName" in body) out.projectName = body.projectName as string | null;
  if ("due" in body) out.due = body.due as string | null;
  if ("doneAt" in body) out.doneAt = body.doneAt as string | null;
  if ("important" in body) {
    if (typeof body.important !== "boolean")
      throw new MtsValidationError("important must be boolean");
    out.important = body.important;
  }
  if ("updatedAt" in body) {
    if (
      typeof body.updatedAt !== "string" ||
      !isRfc3339Datetime(body.updatedAt)
    )
      throw new MtsValidationError("updatedAt must be RFC 3339 datetime");
    out.updatedAt = body.updatedAt;
  }
  if ("createdAt" in body) {
    if (
      typeof body.createdAt !== "string" ||
      !isRfc3339Datetime(body.createdAt)
    )
      throw new MtsValidationError("createdAt must be RFC 3339 datetime");
    out.createdAt = body.createdAt;
  }
  if ("reminds" in body) {
    assertRemindsShape(body.reminds, false);
    out.reminds = body.reminds as string[];
  }
  return out;
}
