import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "../../lib/db";
import { notes } from "../../db/schema";
import NotesView from "./NotesView";

function getDatabaseUserId() {
  const userId = process.env.APP_USER_ID;
  if (!userId) {
    throw new Error("APP_USER_ID is required");
  }

  return userId;
}

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const databaseUserId = getDatabaseUserId();
  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, databaseUserId))
    .orderBy(desc(notes.id))
    .limit(200);

  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <header className="overflow-hidden rounded-xl border border-indigo-100 bg-white/80 shadow-[0_18px_50px_rgba(99,102,241,0.07)] backdrop-blur">
          <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                my-own inbox
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                My Notes
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                Quiver みたいに、左で分類・中央で一覧・右で本文プレビューを見る構成。
                雑誌型よりも、メモを高速に拾うことを優先しています。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-full border border-indigo-200/60 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_4px_12px_rgba(99,102,241,0.1)]"
              >
                Home
              </Link>
              <Link
                href="/links"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-[0_4px_12px_rgba(99,102,241,0.1)]"
              >
                Links
              </Link>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500">
                {rows.length} notes
              </span>
            </div>
          </div>
        </header>

        <NotesView rows={rows} />
      </div>
    </main>
  );
}
