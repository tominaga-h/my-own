import { and, desc, eq } from "drizzle-orm";

import { db } from "../../lib/db";
import { getAuthUser } from "../../lib/auth";
import { notes, syncStates } from "../../db/schema";
import NotesView from "./NotesView";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const databaseUserId = await getAuthUser();
  const [rows, syncRow] = await Promise.all([
    db
      .select()
      .from(notes)
      .where(eq(notes.userId, databaseUserId))
      .orderBy(desc(notes.postedAt))
      .limit(200),
    db
      .select({ updatedAt: syncStates.updatedAt })
      .from(syncStates)
      .where(and(eq(syncStates.userId, databaseUserId), eq(syncStates.key, "slack_last_ts")))
      .then((r) => r[0] ?? null),
  ]);
  const lastSyncedAt = syncRow?.updatedAt ?? null;

  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              My Notes
            </h1>
            {lastSyncedAt && (
              <p className="mt-1 text-sm text-slate-400">
                最終同期: {new Date(lastSyncedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
              </p>
            )}
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
            {rows.length} notes
          </span>
        </div>

        <NotesView rows={rows} />
      </div>
    </main>
  );
}
