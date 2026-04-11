"use client";

import { useState } from "react";

type StatusFilter = "all" | "open" | "done" | "closed";

type TaskRow = {
  id: number;
  userId: string;
  title: string;
  status: string;
  source: string;
  important: boolean;
  projectId: number | null;
  due: string | null;
  doneAt: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Props = {
  rows: TaskRow[];
  remindsMap: Record<number, string[]>;
  projectMap: Record<number, string>;
};

function formatDate(d: string | Date | null) {
  if (!d) return "---";
  return new Date(d).toLocaleDateString("ja-JP");
}

function isOverdue(due: string | null, status: string) {
  if (!due || status !== "open") return false;
  return new Date(due) < new Date(new Date().toDateString());
}

export default function TasksView({ rows, remindsMap, projectMap }: Props) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
    rows.find((r) => r.status === "open")?.id ?? rows[0]?.id ?? null,
  );

  const counts = {
    all: rows.length,
    open: rows.filter((r) => r.status === "open").length,
    done: rows.filter((r) => r.status === "done").length,
    closed: rows.filter((r) => r.status === "closed").length,
  };

  const filteredRows = rows.filter((row) => {
    if (activeFilter === "all") return true;
    return row.status === activeFilter;
  });

  const selectedRow =
    filteredRows.find((r) => r.id === selectedTaskId) ??
    filteredRows[0] ??
    null;

  const selectedReminds = selectedRow ? remindsMap[selectedRow.id] ?? [] : [];

  const filters: Array<{
    key: StatusFilter;
    label: string;
    hint: string;
    count: number;
  }> = [
    { key: "all", label: "All Tasks", hint: "Everything", count: counts.all },
    { key: "open", label: "Open", hint: "Active tasks", count: counts.open },
    { key: "done", label: "Done", hint: "Completed", count: counts.done },
    { key: "closed", label: "Closed", hint: "Archived", count: counts.closed },
  ];

  return (
    <section className="grid gap-3 lg:grid-cols-[220px_minmax(320px,460px)_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="rounded-xl border border-indigo-100 bg-white/80 p-4 shadow-[0_18px_50px_rgba(99,102,241,0.07)] backdrop-blur">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Filter
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Status</p>
        </div>

        <nav className="space-y-2">
          {filters.map((item) => {
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
            Summary
          </p>
          <div className="mt-2 space-y-1 text-xs text-slate-500">
            <p>
              <span className="font-medium text-slate-700">{counts.open}</span>{" "}
              open
            </p>
            <p>
              <span className="font-medium text-slate-700">{counts.done}</span>{" "}
              done
            </p>
            <p>
              <span className="font-medium text-slate-700">
                {rows.filter((r) => r.important).length}
              </span>{" "}
              important
            </p>
          </div>
        </div>
      </aside>

      {/* Task list */}
      <section className="overflow-hidden rounded-xl border border-indigo-100 bg-white/80 shadow-[0_18px_50px_rgba(99,102,241,0.07)] backdrop-blur">
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

        <ul className="max-h-[calc(100vh-200px)] divide-y divide-slate-100 overflow-auto">
          {filteredRows.map((row) => {
            const active = row.id === selectedRow?.id;
            const overdue = isOverdue(row.due, row.status);
            const project = row.projectId
              ? projectMap[row.projectId]
              : null;
            const hasReminds = (remindsMap[row.id]?.length ?? 0) > 0;

            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(row.id)}
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
                      <span
                        className={[
                          "text-[11px] font-medium uppercase tracking-[0.16em]",
                          row.status === "open"
                            ? "text-emerald-500"
                            : row.status === "done"
                              ? "text-blue-400"
                              : "text-slate-400",
                        ].join(" ")}
                      >
                        {row.status}
                      </span>
                      {row.due && (
                        <span
                          className={[
                            "text-xs",
                            overdue ? "font-medium text-red-500" : "text-slate-400",
                          ].join(" ")}
                        >
                          {formatDate(row.due)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {row.important && (
                            <span className="mr-1.5 text-amber-500">!</span>
                          )}
                          {row.title}
                        </p>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project && (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                            {project}
                          </span>
                        )}
                        {hasReminds && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-amber-600">
                            remind
                          </span>
                        )}
                        {overdue && (
                          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-red-500">
                            overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}

          {filteredRows.length === 0 && (
            <li className="px-4 py-10 text-sm text-slate-500">
              該当するタスクがありません。
            </li>
          )}
        </ul>
      </section>

      {/* Detail panel */}
      <aside className="overflow-hidden rounded-xl border border-indigo-100 bg-white/80 shadow-[0_18px_50px_rgba(99,102,241,0.07)] backdrop-blur">
        {selectedRow ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Detail
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                {selectedRow.important && (
                  <span className="mr-1.5 text-amber-500">!</span>
                )}
                {selectedRow.title}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full border border-indigo-200/60 bg-indigo-50/50 px-2.5 py-1">
                  #{selectedRow.id}
                </span>
                <span
                  className={[
                    "rounded-full border px-2.5 py-1",
                    selectedRow.status === "open"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : selectedRow.status === "done"
                        ? "border-blue-200 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-slate-50 text-slate-500",
                  ].join(" ")}
                >
                  {selectedRow.status}
                </span>
                <span className="rounded-full border border-indigo-200/60 bg-indigo-50/50 px-2.5 py-1">
                  {selectedRow.source}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4 px-5 py-5">
              {/* Dates */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Created
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {formatDate(selectedRow.createdAt)}
                  </p>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Due
                  </p>
                  <p
                    className={[
                      "mt-2 text-sm font-medium",
                      isOverdue(selectedRow.due, selectedRow.status)
                        ? "text-red-500"
                        : "text-slate-800",
                    ].join(" ")}
                  >
                    {selectedRow.due ? formatDate(selectedRow.due) : "---"}
                  </p>
                </div>
              </div>

              {selectedRow.doneAt && (
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Done at
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {formatDate(selectedRow.doneAt)}
                  </p>
                </div>
              )}

              {/* Project */}
              {selectedRow.projectId && projectMap[selectedRow.projectId] && (
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Project
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {projectMap[selectedRow.projectId]}
                  </p>
                </div>
              )}

              {/* Reminds */}
              {selectedReminds.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-amber-600">
                    Reminds
                  </p>
                  <div className="mt-2 space-y-1">
                    {selectedReminds.map((d) => (
                      <p key={d} className="text-sm font-medium text-slate-800">
                        {formatDate(d)}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Metadata
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                    source: {selectedRow.source}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                    important: {selectedRow.important ? "yes" : "no"}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                    updated: {formatDate(selectedRow.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-slate-500">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Detail
              </p>
              <p className="mt-3 text-sm">
                表示するタスクがありません。マイグレーションを先に実行してください。
              </p>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
