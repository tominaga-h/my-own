import { apiFetchJson } from "./api-client";

export type SyncFailure = "Slack" | "Tasks";

async function syncSlack(apiKey: string): Promise<void> {
  const result = await apiFetchJson<{ ok?: boolean; error?: string }>(
    apiKey,
    "/api/dev/slack/sync",
    { method: "POST" },
  );
  // Slack sync route は通常 ok フィールドを返さないが、防御的に検査:
  // ハンドラ側で例外が握り潰されて 200 + { ok: false, error } が返るパスを失敗扱い。
  if (result?.ok === false) {
    throw new Error(result.error ?? "slack sync reported failure");
  }
}

async function refreshTasks(apiKey: string): Promise<void> {
  // 戻り値は捨てる: SWR の global mutate が同じ URL を再フェッチして cache を埋める。
  await apiFetchJson(apiKey, "/api/tasks");
}

/** Run all sync jobs in parallel. Returns the names of the jobs that failed. */
export async function runAllSync(apiKey: string): Promise<SyncFailure[]> {
  const results = await Promise.allSettled([
    syncSlack(apiKey),
    refreshTasks(apiKey),
  ]);
  const labels: SyncFailure[] = ["Slack", "Tasks"];
  return results
    .map((r, i) => (r.status === "rejected" ? labels[i] : null))
    .filter((v): v is SyncFailure => v !== null);
}
