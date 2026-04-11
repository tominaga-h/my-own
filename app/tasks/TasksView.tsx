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

function fmtShort(d: string | Date | null) {
  if (!d) return "—";
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function fmtFull(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ja-JP");
}

function isOverdue(due: string | null, status: string) {
  if (!due || status !== "open") return false;
  return new Date(due) < new Date(new Date().toDateString());
}

const dotColor: Record<string, string> = {
  open: "bg-emerald-400",
  done: "bg-blue-400",
  closed: "bg-[#e6e8ea]",
};

export default function TasksView({ rows, remindsMap, projectMap }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<number | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(
    rows.find((r) => r.status === "open")?.id ?? rows[0]?.id ?? null,
  );

  const projectOptions = Object.entries(projectMap).map(([id, name]) => ({
    id: Number(id),
    name,
  }));

  const counts = {
    all: rows.length,
    open: rows.filter((r) => r.status === "open").length,
    done: rows.filter((r) => r.status === "done").length,
    closed: rows.filter((r) => r.status === "closed").length,
  };

  const overdueCount = rows.filter((r) => isOverdue(r.due, r.status)).length;
  const importantCount = rows.filter((r) => r.important).length;

  const filtered = rows.filter((row) => {
    if (filter !== "all" && row.status !== filter) return false;
    if (search && !row.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (projectFilter !== "all" && row.projectId !== projectFilter) return false;
    return true;
  });
  const selected =
    filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;
  const reminds = selected ? (remindsMap[selected.id] ?? []) : [];

  const tabs: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "open", label: "Open", count: counts.open },
    { key: "done", label: "Done", count: counts.done },
    { key: "closed", label: "Closed", count: counts.closed },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between rounded-2xl border border-[#e6e8ea]/60 bg-[#ffffff]/70 px-5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-[20px]">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold tracking-tight text-[#191c1e]">
            Tasks
          </h1>
          <div className="flex items-center gap-0.5">
            {tabs.map((t) => {
              const on = t.key === filter;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all",
                    on
                      ? "bg-gradient-to-r from-[#3525cd] to-[#4f46e5] text-white shadow-[0_2px_8px_rgba(53,37,205,0.18)]"
                      : "text-[#464555] hover:bg-[#e6e8ea]/60",
                  ].join(" ")}
                >
                  {t.label}
                  <span
                    className={[
                      "ml-1.5 text-[11px] tabular-nums",
                      on ? "text-white/60" : "text-[#464555]/50",
                    ].join(" ")}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] tracking-[0.06em] text-[#464555]/60">
          <span>{counts.open} open</span>
          {importantCount > 0 && (
            <span className="text-amber-500">{importantCount} important</span>
          )}
          {overdueCount > 0 && (
            <span className="text-red-400">{overdueCount} overdue</span>
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#e6e8ea]/60 bg-[#ffffff]/70 px-5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-[20px]">
        <svg
          className="h-4 w-4 shrink-0 text-[#464555]/35"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          placeholder="タイトルで検索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-[13px] text-[#191c1e] placeholder-[#464555]/30 outline-none"
        />
        <select
          value={projectFilter === "all" ? "all" : String(projectFilter)}
          onChange={(e) =>
            setProjectFilter(
              e.target.value === "all" ? "all" : Number(e.target.value),
            )
          }
          className="rounded-lg bg-[#f2f4f6]/60 px-3 py-1.5 text-[13px] text-[#464555] outline-none"
        >
          <option value="all">All Projects</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Body: List + Detail ── */}
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        {/* Dense list */}
        <div className="overflow-hidden rounded-2xl border border-[#e6e8ea]/60 bg-[#ffffff]/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-[20px]">
          {/* Column headers */}
          <div className="flex items-center gap-3 bg-[#f2f4f6]/60 px-5 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#464555]/50">
            <span className="w-5" />
            <span className="w-10">#</span>
            <span className="flex-1">Title</span>
            <span className="w-16 text-right">Due</span>
            <span className="w-20 text-right">Project</span>
          </div>

          <div className="max-h-[calc(100vh-180px)] overflow-auto">
            {filtered.map((row) => {
              const on = row.id === selected?.id;
              const overdue = isOverdue(row.due, row.status);
              const project = row.projectId
                ? projectMap[row.projectId]
                : null;
              const hasReminds = (remindsMap[row.id]?.length ?? 0) > 0;

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={[
                    "flex w-full items-center gap-3 px-5 py-[7px] text-left transition-colors",
                    on
                      ? "bg-[#dbe2fa]/35 shadow-[inset_3px_0_0_#4f46e5]"
                      : "hover:bg-[#f2f4f6]/80",
                  ].join(" ")}
                >
                  {/* Status dot */}
                  <span className="flex w-5 justify-center">
                    <span
                      className={[
                        "inline-block h-[7px] w-[7px] rounded-full",
                        dotColor[row.status] ?? "bg-[#e6e8ea]",
                      ].join(" ")}
                    />
                  </span>

                  {/* ID */}
                  <span className="w-10 text-[12px] tabular-nums text-[#464555]/40">
                    {row.id}
                  </span>

                  {/* Title + inline badges */}
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    {row.important && (
                      <span className="shrink-0 text-[11px] font-bold text-amber-500">
                        !
                      </span>
                    )}
                    <span
                      className={[
                        "truncate text-[13px] leading-tight",
                        row.status === "done"
                          ? "text-[#464555]/35 line-through decoration-[#464555]/15"
                          : "text-[#191c1e]",
                      ].join(" ")}
                    >
                      {row.title}
                    </span>
                    {hasReminds && (
                      <span className="shrink-0 rounded-[4px] bg-amber-50 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-amber-500">
                        R
                      </span>
                    )}
                    {overdue && (
                      <span className="shrink-0 rounded-[4px] bg-red-50 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-red-400">
                        OD
                      </span>
                    )}
                  </span>

                  {/* Due */}
                  <span
                    className={[
                      "w-16 text-right text-[12px] tabular-nums",
                      overdue
                        ? "font-medium text-red-500"
                        : "text-[#464555]/35",
                    ].join(" ")}
                  >
                    {row.due ? fmtShort(row.due) : "—"}
                  </span>

                  {/* Project */}
                  <span className="w-20 truncate text-right text-[11px] text-[#464555]/35">
                    {project ?? "—"}
                  </span>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-[13px] text-[#464555]/40">
                該当するタスクがありません
              </div>
            )}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <aside className="overflow-hidden rounded-2xl border border-[#e6e8ea]/60 bg-[#ffffff]/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-[20px]">
          {selected ? (
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="bg-[#f2f4f6]/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "inline-block h-2 w-2 rounded-full",
                      dotColor[selected.status] ?? "bg-[#e6e8ea]",
                    ].join(" ")}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#464555]/45">
                    #{selected.id} · {selected.status}
                  </span>
                  <span className="ml-auto rounded-[5px] bg-[#e6e8ea]/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#464555]/45">
                    {selected.source}
                  </span>
                </div>
                <h2 className="mt-1.5 text-[14px] font-semibold leading-snug text-[#191c1e]">
                  {selected.important && (
                    <span className="mr-1 text-amber-500">!</span>
                  )}
                  {selected.title}
                </h2>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-1 px-3 py-3">
                <div className="grid grid-cols-2 gap-1">
                  <div className="rounded-xl bg-[#f2f4f6]/60 px-3 py-2">
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#464555]/40">
                      Due
                    </p>
                    <p
                      className={[
                        "mt-0.5 text-[13px] font-medium tabular-nums",
                        isOverdue(selected.due, selected.status)
                          ? "text-red-500"
                          : "text-[#191c1e]",
                      ].join(" ")}
                    >
                      {selected.due ? fmtFull(selected.due) : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f2f4f6]/60 px-3 py-2">
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#464555]/40">
                      Created
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium tabular-nums text-[#191c1e]">
                      {fmtFull(selected.createdAt)}
                    </p>
                  </div>
                </div>

                {selected.doneAt && (
                  <div className="rounded-xl bg-blue-50/40 px-3 py-2">
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-blue-400/60">
                      Completed
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium tabular-nums text-[#191c1e]">
                      {fmtFull(selected.doneAt)}
                    </p>
                  </div>
                )}

                {selected.projectId && projectMap[selected.projectId] && (
                  <div className="rounded-xl bg-[#f2f4f6]/60 px-3 py-2">
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#464555]/40">
                      Project
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium text-[#191c1e]">
                      {projectMap[selected.projectId]}
                    </p>
                  </div>
                )}

                {reminds.length > 0 && (
                  <div className="rounded-xl bg-amber-50/40 px-3 py-2">
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-amber-500/60">
                      Reminds
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-2">
                      {reminds.map((d) => (
                        <span
                          key={d}
                          className="text-[13px] font-medium tabular-nums text-[#191c1e]"
                        >
                          {fmtFull(d)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="rounded-[5px] bg-[#f2f4f6]/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#464555]/40">
                    {selected.important ? "important" : "normal"}
                  </span>
                  <span className="rounded-[5px] bg-[#f2f4f6]/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#464555]/40">
                    upd {fmtFull(selected.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center text-[13px] text-[#464555]/40">
              タスクを選択してください
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
