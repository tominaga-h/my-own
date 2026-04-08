"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createNote } from "./actions";

type NoteFilter = "all" | "slack" | "manual" | "project";

type NoteRow = {
  id: number;
  userId: string;
  body: string;
  source: string;
  slackTs: string | null;
  projectId: number | null;
  postedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function truncate(text: string, max = 240) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function getNoteHeadline(body: string) {
  const firstLine = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ?? "Untitled note";
}

export default function NotesView({ rows }: { rows: NoteRow[] }) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<NoteFilter>("all");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(
    rows[0]?.id ?? null,
  );
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredRows = rows.filter((row) => {
    if (activeFilter === "slack") return row.source === "slack";
    if (activeFilter === "manual") return row.source === "manual";
    if (activeFilter === "project") return row.projectId !== null;
    return true;
  });

  const selectedRow =
    filteredRows.find((row) => row.id === selectedNoteId) ??
    filteredRows[0] ??
    null;

  const latest = rows[0] ?? null;
  const counts = {
    all: rows.length,
    slack: rows.filter((row) => row.source === "slack").length,
    manual: rows.filter((row) => row.source === "manual").length,
    project: rows.filter((row) => row.projectId !== null).length,
  };

  const notebooks: Array<{
    key: NoteFilter;
    label: string;
    hint: string;
    count: number;
  }> = [
    { key: "all", label: "All Notes", hint: "Everything", count: counts.all },
    { key: "slack", label: "Slack", hint: "Synced DMs", count: counts.slack },
    {
      key: "manual",
      label: "Manual",
      hint: "Typed entries",
      count: counts.manual,
    },
    {
      key: "project",
      label: "Projects",
      hint: "Grouped items",
      count: counts.project,
    },
  ];

  return (
    <section className="grid gap-3 lg:grid-cols-[220px_minmax(320px,460px)_minmax(0,1fr)]">
      <aside className="rounded-xl border border-indigo-100 bg-white/80 p-4 shadow-[0_18px_50px_rgba(99,102,241,0.07)] backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Library
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Notebooks
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
            {selectedRow ? `#${selectedRow.id}` : "Empty"}
          </span>
        </div>

        <nav className="space-y-2">
          {notebooks.map((item) => {
            const active = item.key === activeFilter;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveFilter(item.key)}
                className={[
                  "flex w-full items-center justify-between rounded-md border px-3 py-3 text-left transition",
                  active
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "border-slate-200 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-sm",
                ].join(" ")}
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>
                  <span
                    className={[
                      "block text-[11px] uppercase tracking-[0.18em]",
                      active ? "text-indigo-200" : "text-slate-400",
                    ].join(" ")}
                  >
                    {item.hint}
                  </span>
                </span>
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-50 text-slate-600",
                  ].join(" ")}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Latest
          </p>
          <p className="mt-1 font-medium text-slate-900">
            {latest ? `#${latest.id}` : "No data"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {latest
              ? new Date(latest.createdAt).toLocaleDateString("ja-JP")
              : "—"}
          </p>
        </div>
      </aside>

      <section className="overflow-hidden rounded-xl border border-indigo-100 bg-white/80 shadow-[0_18px_50px_rgba(99,102,241,0.07)] backdrop-blur">
        <form
          className="border-b border-slate-200 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            const body = draft.trim();
            if (!body || isPending) return;
            startTransition(async () => {
              const result = await createNote(body);
              if (result.note) {
                setDraft("");
                setSelectedNoteId(result.note.id);
                router.refresh();
              }
            });
          }}
        >
          <textarea
            className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            placeholder="新しいメモを書く..."
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Cmd+Enter で投稿
            </span>
            <button
              type="submit"
              disabled={!draft.trim() || isPending}
              className="rounded-full border border-indigo-500 bg-indigo-600 px-5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:opacity-80 disabled:opacity-40"
            >
              {isPending ? "保存中..." : "投稿"}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Sort by ID
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {filteredRows.length} items
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
            {activeFilter}
          </span>
        </div>

        <ul className="max-h-[calc(100vh-250px)] divide-y divide-slate-100 overflow-auto">
          {filteredRows.map((row) => {
            const body = row.body.trim();
            const headline = getNoteHeadline(body);
            const summary = truncate(body.replace(/\s+/g, " "), 140);
            const active = row.id === selectedRow?.id;

            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelectedNoteId(row.id)}
                  className={[
                    "block w-full px-4 py-4 text-left transition",
                    active ? "bg-indigo-50/70" : "hover:bg-slate-50/80",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex w-16 shrink-0 flex-col gap-1 pt-0.5">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        #{row.id}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.16em] text-indigo-400">
                        {row.source}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(row.postedAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {headline}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                            {summary}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          {row.projectId !== null
                            ? `P${row.projectId}`
                            : "Note"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                          user #{row.userId.slice(0, 8)}
                        </span>
                        {row.slackTs ? (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                            slack ts
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}

          {filteredRows.length === 0 ? (
            <li className="px-4 py-10 text-sm text-slate-500">
              まだノートがありません。Slack 同期か手入力を先に進めてください。
            </li>
          ) : null}
        </ul>
      </section>

      <aside className="overflow-hidden rounded-xl border border-indigo-100 bg-white/80 shadow-[0_18px_50px_rgba(99,102,241,0.07)] backdrop-blur">
        {selectedRow ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Preview
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                {getNoteHeadline(selectedRow.body)}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full border border-indigo-200/60 bg-indigo-50/50 px-2.5 py-1">
                  #{selectedRow.id}
                </span>
                <span className="rounded-full border border-indigo-200/60 bg-indigo-50/50 px-2.5 py-1">
                  {selectedRow.source}
                </span>
                {selectedRow.projectId !== null ? (
                  <span className="rounded-full border border-indigo-200/60 bg-indigo-50/50 px-2.5 py-1">
                    project #{selectedRow.projectId}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex-1 space-y-4 px-5 py-5">
              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Body
                </p>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                  {selectedRow.body}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Created
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {new Date(selectedRow.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Updated
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {new Date(selectedRow.updatedAt).toLocaleString("ja-JP")}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Metadata
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                    user #{selectedRow.userId.slice(0, 8)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                    source {selectedRow.source}
                  </span>
                  {selectedRow.slackTs ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                      slack ts {selectedRow.slackTs}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-slate-500">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Preview
              </p>
              <p className="mt-3 text-sm">
                表示するノートがありません。左の分類を変えるか、同期を進めてください。
              </p>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
