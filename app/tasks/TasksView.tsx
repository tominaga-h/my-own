"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { apiFetchJson } from "../../lib/api-client";
import type {
  ProjectListResponse,
  TaskDto,
  TaskPatchBody,
  TaskResponse,
  TaskStatus,
} from "../../lib/my-task-sync";
import { useApiKey } from "../providers";

type StatusFilter = "open" | "done" | "closed" | "all";

type ProjectFilter =
  | { kind: "all" }
  | { kind: "none" }
  | { kind: "named"; name: string };

const PROJECT_FILTER_ALL: ProjectFilter = { kind: "all" };
const PROJECT_FILTER_NONE: ProjectFilter = { kind: "none" };
const PROJECT_VALUE_ALL = "__all__";
const PROJECT_VALUE_NONE = "__none__";

function fmtShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtFull(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "今";
  if (diff < 60) return `${Math.round(diff)}分前`;
  if (diff < 60 * 24) return `${Math.round(diff / 60)}時間前`;
  return `${Math.round(diff / 60 / 24)}日前`;
}

function isOverdue(due: string | null, status: TaskStatus): boolean {
  if (!due || status !== "open") return false;
  return new Date(due) < new Date(new Date().toDateString());
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const CHEVRON_DATA_URL = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(70,69,85,0.5)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`;

export default function TasksView({ tasks }: { tasks: TaskDto[] }) {
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] =
    useState<ProjectFilter>(PROJECT_FILTER_ALL);
  const [openTaskNumber, setOpenTaskNumber] = useState<number | null>(null);
  const [mode, setMode] = useState<"detail" | "edit">("detail");

  const apiKey = useApiKey();
  const { data: projectsData } = useSWR<ProjectListResponse>("/api/projects");
  const projects = projectsData?.projects ?? [];

  const counts = useMemo(() => {
    let open = 0,
      done = 0,
      closed = 0,
      overdue = 0,
      important = 0;
    for (const t of tasks) {
      if (t.status === "open") open++;
      else if (t.status === "done") done++;
      else if (t.status === "closed") closed++;
      if (t.important) important++;
      if (isOverdue(t.due, t.status)) overdue++;
    }
    return { all: tasks.length, open, done, closed, overdue, important };
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks
      .filter((t) => {
        if (filter !== "all" && t.status !== filter) return false;
        if (projectFilter.kind === "none" && t.projectName) return false;
        if (
          projectFilter.kind === "named" &&
          t.projectName !== projectFilter.name
        )
          return false;
        if (q && !t.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.taskNumber - a.taskNumber);
  }, [tasks, filter, search, projectFilter]);

  const groups = useMemo(() => groupTasks(filtered, filter), [filtered, filter]);
  const openTask = tasks.find((t) => t.taskNumber === openTaskNumber) ?? null;

  const closeModal = () => {
    setOpenTaskNumber(null);
    setMode("detail");
  };

  useEffect(() => {
    if (openTaskNumber === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTaskNumber]);

  const { mutate } = useSWRConfig();

  async function patchTask(taskNumber: number, patch: TaskPatchBody) {
    await apiFetchJson<TaskResponse>(apiKey, `/api/tasks/${taskNumber}`, {
      method: "PATCH",
      body: JSON.stringify({ ...patch, updatedAt: new Date().toISOString() }),
    });
    await mutate("/api/tasks");
  }

  const tabs: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: "open", label: "Open", count: counts.open },
    { key: "done", label: "Done", count: counts.done },
    { key: "closed", label: "Closed", count: counts.closed },
    { key: "all", label: "All", count: counts.all },
  ];

  const projectFilterValue =
    projectFilter.kind === "all"
      ? PROJECT_VALUE_ALL
      : projectFilter.kind === "none"
        ? PROJECT_VALUE_NONE
        : `name:${projectFilter.name}`;

  const onProjectFilterChange = (v: string) => {
    if (v === PROJECT_VALUE_ALL) setProjectFilter(PROJECT_FILTER_ALL);
    else if (v === PROJECT_VALUE_NONE) setProjectFilter(PROJECT_FILTER_NONE);
    else if (v.startsWith("name:"))
      setProjectFilter({ kind: "named", name: v.slice(5) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Page header */}
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "4px 4px 0",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(70,69,85,.45)",
            }}
          >
            Workspace
          </p>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#191c1e",
            }}
          >
            Tasks
          </h1>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
          <Stat label="Open" value={counts.open} tone="#4f46e5" />
          {counts.important > 0 && (
            <Stat label="Important" value={counts.important} tone="#f59e0b" />
          )}
          {counts.overdue > 0 && (
            <Stat label="Overdue" value={counts.overdue} tone="#ef4444" />
          )}
        </div>
      </header>

      {/* Controls */}
      <div
        style={{
          borderRadius: 16,
          background: "rgba(255,255,255,.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "16px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map((t) => {
              const on = t.key === filter;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "inherit",
                    background: on
                      ? "linear-gradient(90deg,#3525cd,#4f46e5)"
                      : "transparent",
                    color: on ? "#fff" : "#464555",
                    boxShadow: on ? "0 2px 8px rgba(53,37,205,.18)" : "none",
                  }}
                >
                  {t.label}
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      opacity: 0.6,
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            style={{ height: 24, width: 1, background: "rgba(230,232,234,.8)" }}
          />
          <div
            style={{
              flex: 1,
              minWidth: 240,
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 12,
              background: "rgba(255,255,255,.8)",
              padding: "6px 12px",
              boxShadow: "inset 0 0 0 1px rgba(230,232,234,.6)",
            }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "rgba(70,69,85,.35)", flexShrink: 0 }}
            >
              <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="タイトル・本文で検索…"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13,
                color: "#191c1e",
                fontFamily: "inherit",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "rgba(70,69,85,.45)",
                  fontSize: 11,
                  fontFamily: "inherit",
                }}
              >
                クリア
              </button>
            )}
          </div>
          <div
            style={{ height: 24, width: 1, background: "rgba(230,232,234,.8)" }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 12,
              background:
                projectFilter.kind === "all"
                  ? "rgba(255,255,255,.8)"
                  : "linear-gradient(90deg, rgba(99,102,241,.08), rgba(79,70,229,.05))",
              padding: "6px 10px 6px 12px",
              boxShadow:
                projectFilter.kind === "all"
                  ? "inset 0 0 0 1px rgba(230,232,234,.6)"
                  : "inset 0 0 0 1px rgba(99,102,241,.25)",
            }}
          >
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                color:
                  projectFilter.kind === "all"
                    ? "rgba(70,69,85,.35)"
                    : "#4f46e5",
                flexShrink: 0,
              }}
            >
              <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <select
              value={projectFilterValue}
              onChange={(e) => onProjectFilterChange(e.target.value)}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13,
                fontWeight: 500,
                color:
                  projectFilter.kind === "all" ? "#464555" : "#3525cd",
                fontFamily: "inherit",
                cursor: "pointer",
                paddingRight: 18,
                backgroundImage: CHEVRON_DATA_URL,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 2px center",
              }}
            >
              <option value={PROJECT_VALUE_ALL}>All projects</option>
              <option value={PROJECT_VALUE_NONE}>未設定のみ</option>
              <option disabled>──────────</option>
              {projects.map((p) => (
                <option key={p.id} value={`name:${p.name}`}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <section
        style={{
          borderRadius: 12,
          background: "rgba(255,255,255,.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(25,28,30,.04)",
          minHeight: 400,
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: "80px 24px", textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "rgba(70,69,85,.4)",
              }}
            >
              該当するタスクがありません
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: "rgba(70,69,85,.3)",
              }}
            >
              フィルタを変更するか検索語を調整してください
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.key}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px 6px",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: g.tone,
                }}
              >
                <span>{g.label}</span>
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background:
                      "linear-gradient(90deg, rgba(226,232,240,.7), transparent)",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "rgba(70,69,85,.35)",
                    letterSpacing: 0,
                  }}
                >
                  {g.rows.length}
                </span>
              </div>
              {g.rows.map((r) => (
                <TaskRow
                  key={r.taskNumber}
                  row={r}
                  onSelect={() => {
                    setOpenTaskNumber(r.taskNumber);
                    setMode("detail");
                  }}
                  onToggleDone={async () => {
                    const next: TaskPatchBody =
                      r.status === "done"
                        ? { status: "open", doneAt: null }
                        : {
                            status: "done",
                            doneAt: new Date().toISOString(),
                          };
                    await patchTask(r.taskNumber, next);
                  }}
                  onToggleImportant={async () => {
                    await patchTask(r.taskNumber, { important: !r.important });
                  }}
                />
              ))}
            </div>
          ))
        )}
      </section>

      {openTask && (
        <ModalShell onClose={closeModal}>
          {mode === "detail" ? (
            <DetailModal
              sel={openTask}
              onEdit={() => setMode("edit")}
              onClose={closeModal}
              onQuickAction={async (patch) => {
                await patchTask(openTask.taskNumber, patch);
              }}
            />
          ) : (
            <EditModal
              sel={openTask}
              projects={projects.map((p) => p.name)}
              onCancel={() => setMode("detail")}
              onSave={async (patch) => {
                await patchTask(openTask.taskNumber, patch);
                closeModal();
              }}
            />
          )}
        </ModalShell>
      )}
    </div>
  );
}

// ——— Stat pill ———
function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: tone,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(70,69,85,.45)",
          marginTop: 4,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ——— List row ———
function TaskRow({
  row,
  onSelect,
  onToggleDone,
  onToggleImportant,
}: {
  row: TaskDto;
  onSelect: () => void;
  onToggleDone: () => void;
  onToggleImportant: () => void;
}) {
  const od = isOverdue(row.due, row.status);
  const done = row.status === "done";
  const closed = row.status === "closed";
  const remindCount = row.reminds.length;
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: "pointer",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        padding: "14px 24px",
        transition: "background .15s",
        background: hover ? "rgba(242,244,246,.7)" : "transparent",
      }}
    >
      <button
        type="button"
        title={done ? "未完了に戻す" : "完了にする"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleDone();
        }}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          border: "none",
          cursor: "pointer",
          borderRadius: "50%",
          padding: 0,
          marginTop: 1,
          background: done
            ? "linear-gradient(135deg,#10b981,#059669)"
            : closed
              ? "rgba(226,232,240,.6)"
              : "rgba(255,255,255,.7)",
          boxShadow: done
            ? "0 2px 8px rgba(16,185,129,.3)"
            : "inset 0 0 0 1.5px rgba(148,163,184,.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {done && (
          <svg
            width={11}
            height={11}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
        {closed && (
          <svg
            width={10}
            height={10}
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(70,69,85,0.5)"
            strokeWidth={3}
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
      </button>

      <span
        style={{
          flexShrink: 0,
          width: 42,
          fontFamily:
            "SF Mono, ui-monospace, Menlo, Consolas, monospace",
          fontSize: 11,
          color: "rgba(70,69,85,.35)",
          alignSelf: "flex-start",
          marginTop: 3,
        }}
      >
        #{row.taskNumber}
      </span>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: done
              ? "rgba(70,69,85,.4)"
              : closed
                ? "rgba(70,69,85,.5)"
                : "#191c1e",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {row.title}
        </span>

        {(row.projectName || row.due || remindCount > 0) && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              opacity: done ? 0.55 : 1,
            }}
          >
            {row.projectName && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  color: "rgba(70,69,85,.6)",
                }}
              >
                <svg
                  width={11}
                  height={11}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
                {row.projectName}
              </span>
            )}
            {row.due && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: od ? 600 : 500,
                  color: od ? "#ef4444" : "rgba(70,69,85,.6)",
                }}
              >
                <svg
                  width={11}
                  height={11}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
                  <line x1={16} y1={2} x2={16} y2={6} />
                  <line x1={8} y1={2} x2={8} y2={6} />
                  <line x1={3} y1={10} x2={21} y2={10} />
                </svg>
                <span style={{ fontFamily: "SF Mono, monospace" }}>
                  {od && "● "}
                  {fmtShort(row.due)}
                </span>
              </span>
            )}
            {remindCount > 0 && (
              <span
                title="リマインド中"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#d97706",
                }}
              >
                <svg
                  width={11}
                  height={11}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                Remind ×{remindCount}
              </span>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        title={row.important ? "優先度を外す" : "優先度を上げる"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleImportant();
        }}
        style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          border: "none",
          cursor: "pointer",
          borderRadius: 6,
          padding: 0,
          background: "transparent",
          color: row.important ? "#f59e0b" : "rgba(70,69,85,.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill={row.important ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    </div>
  );
}

// ——— Modal shell ———
function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(15,23,42,.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 22,
          boxShadow:
            "0 24px 80px rgba(15,23,42,.25), 0 1px 0 rgba(226,232,240,.8)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ——— Detail modal ———
function DetailModal({
  sel,
  onEdit,
  onClose,
  onQuickAction,
}: {
  sel: TaskDto;
  onEdit: () => void;
  onClose: () => void;
  onQuickAction: (patch: TaskPatchBody) => Promise<void>;
}) {
  const [busy, setBusy] = useState<"done" | "closed" | "reopen" | null>(null);
  const dotColor: Record<TaskStatus, string> = {
    open: "#10b981",
    done: "#60a5fa",
    closed: "#cbd5e1",
  };
  const statusColor: Record<TaskStatus, string> = {
    open: "#059669",
    done: "#3b82f6",
    closed: "rgba(70,69,85,.5)",
  };
  const od = isOverdue(sel.due, sel.status);

  const quick = async (kind: "done" | "closed" | "reopen") => {
    setBusy(kind);
    const patch: TaskPatchBody =
      kind === "done"
        ? { status: "done", doneAt: new Date().toISOString() }
        : kind === "closed"
          ? { status: "closed" }
          : { status: "open", doneAt: null };
    try {
      await onQuickAction(patch);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          padding: "20px 28px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          borderBottom: "1px solid rgba(226,232,240,.7)",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            marginTop: 6,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: dotColor[sel.status],
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(70,69,85,.5)",
                fontFamily: "SF Mono, monospace",
              }}
            >
              #{sel.taskNumber}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(70,69,85,.5)",
                background: "rgba(242,244,246,.8)",
                padding: "2px 8px",
                borderRadius: 5,
              }}
            >
              {sel.source}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: statusColor[sel.status],
              }}
            >
              {sel.status}
            </span>
            {sel.important && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#d97706",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Important
              </span>
            )}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 600,
              color: "#191c1e",
              letterSpacing: "-0.01em",
              lineHeight: 1.35,
              textDecoration: sel.status === "done" ? "line-through" : "none",
              textDecorationColor: "rgba(70,69,85,.4)",
              textDecorationThickness: "1.5px",
            }}
          >
            {sel.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          style={{
            flexShrink: 0,
            border: "none",
            cursor: "pointer",
            width: 32,
            height: 32,
            borderRadius: 9999,
            background: "rgba(242,244,246,.8)",
            color: "#464555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          padding: "20px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            background: "rgba(242,244,246,.55)",
            borderRadius: 14,
            padding: "4px 2px",
            overflow: "hidden",
          }}
        >
          <MetaRow
            label="Due"
            value={sel.due ? fmtFull(sel.due) : "未設定"}
            tone={od ? "#ef4444" : undefined}
            accent={od ? "● 期限超過" : undefined}
            icon={
              <>
                <rect x={3} y={4} width={18} height={18} rx={2} />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </>
            }
          />
          <MetaRow
            label="Project"
            value={sel.projectName ?? "未設定"}
            accentDot={sel.projectName ? "#6366f1" : undefined}
            icon={
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            }
          />
          <MetaRow
            label="Reminders"
            value={
              sel.reminds.length > 0
                ? `${sel.reminds.length} 回リマインド済み`
                : "リマインドなし"
            }
            tone={sel.reminds.length > 0 ? "#d97706" : undefined}
            icon={
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            }
          />
          <MetaRow
            label="Source"
            value={sel.source === "slack" ? "Slack 同期" : "手動で追加"}
            icon={
              sel.source === "slack" ? (
                <>
                  <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5a1.5 1.5 0 013 0v5c0 .83-.67 1.5-1.5 1.5z" />
                  <path d="M20.5 10H19V8.5a1.5 1.5 0 013 0 1.5 1.5 0 01-1.5 1.5z" />
                  <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5a1.5 1.5 0 01-3 0v-5c0-.83.67-1.5 1.5-1.5z" />
                  <path d="M3.5 14H5v1.5a1.5 1.5 0 01-3 0A1.5 1.5 0 013.5 14z" />
                  <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5a1.5 1.5 0 010 3h-5c-.83 0-1.5-.67-1.5-1.5z" />
                  <path d="M15.5 19H14v1.5a1.5 1.5 0 003 0 1.5 1.5 0 00-1.5-1.5z" />
                  <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5a1.5 1.5 0 000 3h5c.83 0 1.5-.67 1.5-1.5z" />
                  <path d="M8.5 5H10V3.5a1.5 1.5 0 00-3 0A1.5 1.5 0 008.5 5z" />
                </>
              ) : (
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
              )
            }
          />
          <MetaRow
            label="Created"
            value={fmtFull(sel.createdAt)}
            sub={fmtRelative(sel.createdAt)}
            icon={
              <>
                <circle cx={12} cy={12} r={10} />
                <path d="M12 6v6l4 2" />
              </>
            }
          />
          <MetaRow
            label="Updated"
            value={fmtRelative(sel.updatedAt)}
            sub={fmtFull(sel.updatedAt)}
            icon={
              <>
                <path d="M3 12a9 9 0 0115-6.7L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 01-15 6.7L3 16" />
                <path d="M3 21v-5h5" />
              </>
            }
            last={!(sel.status === "done" && sel.doneAt)}
          />
          {sel.status === "done" && sel.doneAt && (
            <MetaRow
              label="Completed"
              value={fmtFull(sel.doneAt)}
              sub={fmtRelative(sel.doneAt)}
              tone="#059669"
              icon={
                <>
                  <circle cx={12} cy={12} r={10} />
                  <path d="M9 12l2 2 4-4" />
                </>
              }
              last
            />
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {sel.status === "open" && (
            <>
              <QuickBtn
                kind="done"
                label="完了にする"
                busy={busy === "done"}
                disabled={busy !== null}
                onClick={() => quick("done")}
              />
              <QuickBtn
                kind="closed"
                label="クローズ"
                busy={busy === "closed"}
                disabled={busy !== null}
                onClick={() => quick("closed")}
              />
            </>
          )}
          {sel.status === "done" && (
            <>
              <QuickBtn
                kind="reopen"
                label="未完了に戻す"
                busy={busy === "reopen"}
                disabled={busy !== null}
                onClick={() => quick("reopen")}
              />
              <QuickBtn
                kind="closed"
                label="クローズ"
                busy={busy === "closed"}
                disabled={busy !== null}
                onClick={() => quick("closed")}
              />
            </>
          )}
          {sel.status === "closed" && (
            <QuickBtn
              kind="reopen"
              label="再オープン"
              busy={busy === "reopen"}
              disabled={busy !== null}
              onClick={() => quick("reopen")}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 28px 20px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          borderTop: "1px solid rgba(226,232,240,.7)",
          background: "rgba(248,250,252,.6)",
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(70,69,85,.4)",
          }}
        >
          <span style={{ fontFamily: "SF Mono, monospace" }}>Esc</span> で閉じる
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            cursor: "pointer",
            padding: "9px 16px",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "inherit",
            background: "rgba(242,244,246,.8)",
            color: "#464555",
            boxShadow: "inset 0 0 0 1px rgba(226,232,240,.7)",
          }}
        >
          閉じる
        </button>
        <button
          type="button"
          onClick={onEdit}
          style={{
            border: "none",
            cursor: "pointer",
            padding: "9px 18px",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(90deg,#3525cd,#4f46e5)",
            color: "#fff",
            boxShadow: "0 2px 12px rgba(53,37,205,.22)",
          }}
        >
          <svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
          編集
        </button>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  sub,
  tone,
  accent,
  accentDot,
  icon,
  last,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
  accent?: string;
  accentDot?: string;
  icon: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        boxShadow: last ? "none" : "inset 0 -1px 0 rgba(226,232,240,.55)",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          borderRadius: 8,
          background: "rgba(255,255,255,.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(70,69,85,.55)",
          boxShadow: "inset 0 0 0 1px rgba(226,232,240,.7)",
        }}
      >
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </div>
      <span
        style={{
          flexShrink: 0,
          width: 88,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(70,69,85,.5)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        {accentDot && (
          <span
            style={{
              flexShrink: 0,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: accentDot,
            }}
          />
        )}
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: tone ?? "#191c1e",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
        {sub && (
          <span style={{ fontSize: 11, color: "rgba(70,69,85,.45)" }}>
            {sub}
          </span>
        )}
      </div>
      {accent && (
        <span
          style={{
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: tone ?? "#ef4444",
          }}
        >
          {accent}
        </span>
      )}
    </div>
  );
}

function QuickBtn({
  kind,
  label,
  busy,
  disabled,
  onClick,
}: {
  kind: "done" | "closed" | "reopen";
  label: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const tones: Record<
    typeof kind,
    { bg: string; fg: string; shadow: string; icon: React.ReactNode }
  > = {
    done: {
      bg: "linear-gradient(90deg,#10b981,#059669)",
      fg: "#fff",
      shadow: "0 2px 10px rgba(16,185,129,.22)",
      icon: <path d="M20 6L9 17l-5-5" />,
    },
    closed: {
      bg: "rgba(242,244,246,.9)",
      fg: "#464555",
      shadow: "inset 0 0 0 1px rgba(226,232,240,.8)",
      icon: <path d="M18 6L6 18M6 6l12 12" />,
    },
    reopen: {
      bg: "rgba(238,242,255,.9)",
      fg: "#4f46e5",
      shadow: "inset 0 0 0 1px rgba(99,102,241,.3)",
      icon: (
        <>
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </>
      ),
    },
  };
  const t = tones[kind];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        minWidth: 140,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        padding: "9px 14px",
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: t.bg,
        color: t.fg,
        boxShadow: t.shadow,
        opacity: disabled && !busy ? 0.5 : 1,
      }}
    >
      {busy ? (
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "tasks-spin 1s linear infinite" }}
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      ) : (
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {t.icon}
        </svg>
      )}
      {label}
      <style>{`@keyframes tasks-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

// ——— Edit modal ———
function EditModal({
  sel,
  projects,
  onCancel,
  onSave,
}: {
  sel: TaskDto;
  projects: string[];
  onCancel: () => void;
  onSave: (patch: TaskPatchBody) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    title: sel.title,
    status: sel.status,
    important: sel.important,
    due: toDateInputValue(sel.due),
    projectName: sel.projectName ?? "",
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const statuses: Array<{ k: TaskStatus; l: string; dot: string }> = [
    { k: "open", l: "Open", dot: "#10b981" },
    { k: "done", l: "Done", dot: "#60a5fa" },
    { k: "closed", l: "Closed", dot: "#cbd5e1" },
  ];

  const dirty =
    sel.title !== draft.title ||
    sel.status !== draft.status ||
    sel.important !== draft.important ||
    toDateInputValue(sel.due) !== draft.due ||
    (sel.projectName ?? "") !== draft.projectName;

  const save = async () => {
    setSaveState("saving");
    const patch: TaskPatchBody = {};
    if (sel.title !== draft.title) {
      patch.title = draft.title.trim() || sel.title;
    }
    if (sel.status !== draft.status) {
      patch.status = draft.status;
    }
    if (sel.important !== draft.important) {
      patch.important = draft.important;
    }
    if (toDateInputValue(sel.due) !== draft.due) {
      patch.due = draft.due
        ? new Date(draft.due + "T00:00:00").toISOString()
        : null;
    }
    if ((sel.projectName ?? "") !== draft.projectName) {
      patch.projectName = draft.projectName === "" ? null : draft.projectName;
    }
    if (patch.status === "done" && sel.status !== "done") {
      patch.doneAt = new Date().toISOString();
    } else if (patch.status === "open" && sel.status === "done") {
      patch.doneAt = null;
    }
    try {
      await onSave(patch);
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (dirty && saveState !== "saving") void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saveState, draft]);

  const saving = saveState === "saving";
  const saved = saveState === "saved";

  const labelStyle: React.CSSProperties = {
    margin: "0 0 6px",
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(70,69,85,.5)",
  };
  const inputStyle: React.CSSProperties = {
    border: "none",
    outline: "none",
    background: "rgba(242,244,246,.6)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13.5,
    color: "#191c1e",
    fontFamily: "inherit",
    boxShadow: "inset 0 0 0 1px rgba(226,232,240,.6)",
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          padding: "20px 28px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid rgba(226,232,240,.7)",
        }}
      >
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4f46e5"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#191c1e" }}>
          タスクを編集
        </h2>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(70,69,85,.4)",
            fontFamily: "SF Mono, monospace",
          }}
        >
          #{sel.taskNumber}
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onCancel}
          aria-label="閉じる"
          style={{
            border: "none",
            cursor: "pointer",
            width: 28,
            height: 28,
            borderRadius: 9999,
            background: "rgba(242,244,246,.8)",
            color: "#464555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div
        style={{
          padding: "20px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={labelStyle}>Title</p>
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="タスクのタイトル"
            style={{ ...inputStyle, fontSize: 16, fontWeight: 500 }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={labelStyle}>Status</p>
          <div style={{ display: "flex", gap: 6 }}>
            {statuses.map((s) => {
              const on = s.k === draft.status;
              const onBg =
                s.k === "done"
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : s.k === "closed"
                    ? "rgba(226,232,240,.9)"
                    : "linear-gradient(135deg,#3525cd,#4f46e5)";
              return (
                <button
                  key={s.k}
                  type="button"
                  onClick={() => setDraft({ ...draft, status: s.k })}
                  style={{
                    flex: 1,
                    border: "none",
                    cursor: "pointer",
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: on ? onBg : "rgba(242,244,246,.6)",
                    color: on
                      ? s.k === "closed"
                        ? "#464555"
                        : "#fff"
                      : "rgba(70,69,85,.65)",
                    boxShadow: on
                      ? "0 2px 10px rgba(25,28,30,.08)"
                      : "inset 0 0 0 1px rgba(226,232,240,.6)",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: on
                        ? s.k === "closed"
                          ? "rgba(70,69,85,.5)"
                          : "rgba(255,255,255,.9)"
                        : s.dot,
                    }}
                  />
                  {s.l}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={labelStyle}>Due</p>
            <input
              type="date"
              value={draft.due}
              onChange={(e) => setDraft({ ...draft, due: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={labelStyle}>Project</p>
            <select
              value={draft.projectName}
              onChange={(e) =>
                setDraft({ ...draft, projectName: e.target.value })
              }
              style={{
                ...inputStyle,
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                paddingRight: 30,
                backgroundImage: CHEVRON_DATA_URL,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
              }}
            >
              <option value="">— 未設定 —</option>
              {projects.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(242,244,246,.5)",
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill={draft.important ? "#f59e0b" : "none"}
            stroke={draft.important ? "#f59e0b" : "rgba(70,69,85,0.4)"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#191c1e" }}>
              Important
            </span>
            <span style={{ fontSize: 11, color: "rgba(70,69,85,.55)" }}>
              {draft.important ? "優先度を高く表示します" : "通常の優先度"}
            </span>
          </div>
          <button
            type="button"
            aria-pressed={draft.important}
            onClick={() => setDraft({ ...draft, important: !draft.important })}
            style={{
              position: "relative",
              width: 42,
              height: 24,
              border: "none",
              cursor: "pointer",
              borderRadius: 9999,
              padding: 0,
              background: draft.important
                ? "linear-gradient(90deg,#f59e0b,#f97316)"
                : "rgba(226,232,240,.9)",
              boxShadow: draft.important
                ? "0 2px 8px rgba(245,158,11,.25)"
                : "inset 0 0 0 1px rgba(226,232,240,.8)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: draft.important ? 20 : 2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,.18)",
                transition: "left .2s",
              }}
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 28px 20px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          borderTop: "1px solid rgba(226,232,240,.7)",
          background: "rgba(248,250,252,.6)",
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(70,69,85,.4)",
          }}
        >
          <span style={{ fontFamily: "SF Mono, monospace" }}>⌘↵</span> で保存 ·{" "}
          <span style={{ fontFamily: "SF Mono, monospace" }}>Esc</span> で閉じる
        </span>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            border: "none",
            cursor: saving ? "default" : "pointer",
            padding: "9px 16px",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "inherit",
            background: "rgba(242,244,246,.8)",
            color: "#464555",
            boxShadow: "inset 0 0 0 1px rgba(226,232,240,.7)",
            opacity: saving ? 0.5 : 1,
          }}
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          style={{
            border: "none",
            cursor: dirty && !saving ? "pointer" : "default",
            padding: "9px 20px",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: saved
              ? "linear-gradient(90deg,#10b981,#059669)"
              : "linear-gradient(90deg,#3525cd,#4f46e5)",
            color: "#fff",
            boxShadow: dirty ? "0 2px 12px rgba(53,37,205,.22)" : "none",
            opacity: (!dirty || saving) && !saved ? 0.55 : 1,
          }}
        >
          {saving && (
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: "tasks-spin 1s linear infinite" }}
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          )}
          {saved && (
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
          {saving ? "保存中…" : saved ? "保存しました" : "保存"}
        </button>
        <style>{`@keyframes tasks-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ——— Grouping ———
type Bucket = {
  key: string;
  label: string;
  tone: string;
  rows: TaskDto[];
};

function groupTasks(rows: TaskDto[], filter: StatusFilter): Bucket[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const within1Day = (iso: string | null) => {
    if (!iso) return false;
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    const diff = (d.getTime() - today.getTime()) / 86400000;
    return diff < 1 && diff >= 0;
  };
  const buckets: Record<string, Bucket> = {
    overdue: { key: "overdue", label: "Overdue", tone: "#ef4444", rows: [] },
    today: { key: "today", label: "Today", tone: "#3525cd", rows: [] },
    upcoming: { key: "upcoming", label: "Upcoming", tone: "#6366f1", rows: [] },
    nodue: {
      key: "nodue",
      label: "No due",
      tone: "rgba(70,69,85,.5)",
      rows: [],
    },
    done: { key: "done", label: "Done", tone: "#60a5fa", rows: [] },
    closed: {
      key: "closed",
      label: "Closed",
      tone: "rgba(70,69,85,.4)",
      rows: [],
    },
  };

  if (filter === "open") {
    for (const r of rows) {
      if (r.status !== "open") {
        buckets[r.status === "done" ? "done" : "closed"].rows.push(r);
        continue;
      }
      if (isOverdue(r.due, r.status)) buckets.overdue.rows.push(r);
      else if (within1Day(r.due)) buckets.today.rows.push(r);
      else if (r.due) buckets.upcoming.rows.push(r);
      else buckets.nodue.rows.push(r);
    }
    return [
      buckets.overdue,
      buckets.today,
      buckets.upcoming,
      buckets.nodue,
    ].filter((b) => b.rows.length > 0);
  }

  if (filter === "all") {
    for (const r of rows) {
      if (r.status === "closed") buckets.closed.rows.push(r);
      else if (r.status === "done") buckets.done.rows.push(r);
      else if (isOverdue(r.due, r.status)) buckets.overdue.rows.push(r);
      else if (within1Day(r.due)) buckets.today.rows.push(r);
      else if (r.due) buckets.upcoming.rows.push(r);
      else buckets.nodue.rows.push(r);
    }
    return [
      buckets.overdue,
      buckets.today,
      buckets.upcoming,
      buckets.nodue,
      buckets.done,
      buckets.closed,
    ].filter((b) => b.rows.length > 0);
  }

  return [
    {
      key: filter,
      label: filter === "done" ? "Done" : "Closed",
      tone: filter === "done" ? "#60a5fa" : "rgba(70,69,85,.4)",
      rows,
    },
  ];
}
