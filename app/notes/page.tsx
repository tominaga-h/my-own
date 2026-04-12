"use client";

import useSWR, { useSWRConfig } from "swr";

import NotesView from "./NotesView";
import { apiFetchJson } from "../../lib/api-client";
import { useApiKey } from "../providers";

type NotesResponse = {
  notes: Array<{
    id: number;
    userId: string;
    body: string;
    source: string;
    slackTs: string | null;
    projectId: number | null;
    postedAt: string;
    createdAt: string;
    updatedAt: string;
  }>;
  lastSyncAt: string | null;
};

const NOTE_QUERY_KEYS = [
  "/api/notes?limit=200",
  "/api/data/stats",
  "/api/data/recent",
  "/api/data/projects",
] as const;

export default function NotesPage() {
  const apiKey = useApiKey();
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR<NotesResponse>("/api/notes?limit=200");

  const rows = data?.notes ?? [];
  const lastSyncAt = data?.lastSyncAt ?? null;

  async function handleCreateNote(body: string) {
    const result = await apiFetchJson<{ note: NotesResponse["notes"][number] }>(
      apiKey,
      "/api/notes",
      {
        method: "POST",
        body: JSON.stringify({ body }),
      },
    );

    await Promise.all(NOTE_QUERY_KEYS.map((key) => mutate(key)));
    return result.note ?? null;
  }

  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              My Notes
            </h1>
            {lastSyncAt && (
              <p className="mt-1 text-sm text-slate-400">
                最終同期:{" "}
                {new Date(lastSyncAt).toLocaleString("ja-JP", {
                  timeZone: "Asia/Tokyo",
                })}
              </p>
            )}
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
            {isLoading ? "..." : `${rows.length} notes`}
          </span>
        </div>

        <NotesView rows={rows} onCreateNote={handleCreateNote} />
      </div>
    </main>
  );
}
