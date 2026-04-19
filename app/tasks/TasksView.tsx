"use client";

import { useEffect, useMemo, useState } from "react";

import type { TaskDto } from "../../lib/my-task-sync";

type StatusFilter = "all" | "open" | "done" | "closed";

type Props = {
  tasks: TaskDto[];
};

function fmtShort(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function fmtFull(d: string | null) {
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

type ProjectFilter =
  | { kind: "all" }
  | { kind: "none" }
  | { kind: "named"; name: string };

const PROJECT_FILTER_ALL: ProjectFilter = { kind: "all" };
const PROJECT_FILTER_NONE: ProjectFilter = { kind: "none" };
const PROJECT_FILTER_ALL_VALUE = "__all__";
const PROJECT_FILTER_NONE_VALUE = "__none__";

function projectFilterToValue(f: ProjectFilter): string {
  if (f.kind === "all") return PROJECT_FILTER_ALL_VALUE;
  if (f.kind === "none") return PROJECT_FILTER_NONE_VALUE;
  return `name:${f.name}`;
}

function valueToProjectFilter(value: string): ProjectFilter {
  if (value === PROJECT_FILTER_ALL_VALUE) return PROJECT_FILTER_ALL;
  if (value === PROJECT_FILTER_NONE_VALUE) return PROJECT_FILTER_NONE;
  if (value.startsWith("name:")) return { kind: "named", name: value.slice(5) };
  return PROJECT_FILTER_ALL;
}

export default function TasksView({ tasks }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>(
    PROJECT_FILTER_ALL,
  );
  const [selectedTaskNumber, setSelectedTaskNumber] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (tasks.length === 0) {
      setSelectedTaskNumber(null);
      return;
    }

    if (
      !selectedTaskNumber ||
      !tasks.some((t) => t.taskNumber === selectedTaskNumber)
    ) {
      setSelectedTaskNumber(
        tasks.find((t) => t.status === "open")?.taskNumber ??
          tasks[0].taskNumber,
      );
    }
  }, [tasks, selectedTaskNumber]);

  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    for (const t of tasks) {
      if (t.projectName) names.add(t.projectName);
    }
    return Array.from(names).sort();
  }, [tasks]);

  const { counts, overdueCount, importantCount } = useMemo(() => {
    let open = 0;
    let done = 0;
    let closed = 0;
    let overdue = 0;
    let important = 0;
    for (const t of tasks) {
      if (t.status === "open") open++;
      else if (t.status === "done") done++;
      else if (t.status === "closed") closed++;
      if (t.important) important++;
      if (isOverdue(t.due, t.status)) overdue++;
    }
    return {
      counts: { all: tasks.length, open, done, closed },
      overdueCount: overdue,
      importantCount: important,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter((task) => {
      if (filter !== "all" && task.status !== filter) return false;
      if (q && !task.title.toLowerCase().includes(q)) return false;
      if (projectFilter.kind === "none" && task.projectName) return false;
      if (
        projectFilter.kind === "named" &&
        task.projectName !== projectFilter.name
      )
        return false;
      return true;
    });
  }, [tasks, filter, search, projectFilter]);
  const selected =
    filtered.find((t) => t.taskNumber === selectedTaskNumber) ??
    filtered[0] ??
    null;
  const reminds = selected?.reminds ?? [];

  const tabs: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "open", label: "Open", count: counts.open },
    { key: "done", label: "Done", count: counts.done },
    { key: "closed", label: "Closed", count: counts.closed },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-400">{counts.all} tasks total</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] tracking-[0.06em] text-[#464555]/60">
          <span>{counts.open} open</span>
          {importantCount > 0 && (
            <span className="text-amber-500">{importantCount} important</span>
          )}
          {overdueCount > 0 && (
            <span className="text-red-400">{overdueCount} overdue</span>
          )}
        </div>
      </div>

      {/* ── Filter Box ── */}
      <div className="rounded-2xl border border-[#e6e8ea]/60 bg-[#ffffff]/70 px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-[20px]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-0.5">
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

          <div className="h-6 w-px bg-[#e6e8ea]/80" />

          <div className="flex min-w-[240px] flex-1 items-center gap-3 rounded-xl border border-[#e6e8ea]/60 bg-white/80 px-3 py-2">
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
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#191c1e] placeholder-[#464555]/30 outline-none"
            />
          </div>

          <select
            value={projectFilterToValue(projectFilter)}
            onChange={(e) =>
              setProjectFilter(valueToProjectFilter(e.target.value))
            }
            className="rounded-xl border border-[#e6e8ea]/60 bg-white/80 px-3 py-2 text-[13px] text-[#464555] outline-none"
          >
            <option value={PROJECT_FILTER_ALL_VALUE}>All Projects</option>
            <option value={PROJECT_FILTER_NONE_VALUE}>(no project)</option>
            {projectOptions.map((name) => (
              <option key={name} value={`name:${name}`}>
                {name}
              </option>
            ))}
          </select>
        </div>
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
            {filtered.map((task) => {
              const on = task.taskNumber === selected?.taskNumber;
              const overdue = isOverdue(task.due, task.status);
              const hasReminds = task.reminds.length > 0;

              return (
                <button
                  key={task.taskNumber}
                  type="button"
                  onClick={() => setSelectedTaskNumber(task.taskNumber)}
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
                        dotColor[task.status] ?? "bg-[#e6e8ea]",
                      ].join(" ")}
                    />
                  </span>

                  {/* Number */}
                  <span className="w-10 text-[12px] tabular-nums text-[#464555]/40">
                    {task.taskNumber}
                  </span>

                  {/* Title + inline badges */}
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    {task.important && (
                      <span className="shrink-0 text-[11px] font-bold text-amber-500">
                        !
                      </span>
                    )}
                    <span
                      className={[
                        "truncate text-[13px] leading-tight",
                        task.status === "done"
                          ? "text-[#464555]/35 line-through decoration-[#464555]/15"
                          : "text-[#191c1e]",
                      ].join(" ")}
                    >
                      {task.title}
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
                    {task.due ? fmtShort(task.due) : "—"}
                  </span>

                  {/* Project */}
                  <span className="w-20 truncate text-right text-[11px] text-[#464555]/35">
                    {task.projectName ?? "—"}
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
                    #{selected.taskNumber} · {selected.status}
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

                {selected.projectName && (
                  <div className="rounded-xl bg-[#f2f4f6]/60 px-3 py-2">
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#464555]/40">
                      Project
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium text-[#191c1e]">
                      {selected.projectName}
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
