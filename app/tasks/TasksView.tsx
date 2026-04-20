"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { apiFetchJson } from "../../lib/api-client";
import type {
  ProjectListResponse,
  TaskCreateBody,
  TaskDto,
  TaskPatchBody,
  TaskResponse,
} from "../../lib/my-task-sync";
import { useApiKey } from "../providers";
import {
  ControlsBar,
  PROJECT_FILTER_ALL,
  type ProjectFilter,
} from "./components/ControlsBar";
import { DetailModal } from "./components/DetailModal";
import { EditModal } from "./components/EditModal";
import { ModalShell } from "./components/ModalShell";
import { NewTaskModal } from "./components/NewTaskModal";
import { TaskRow } from "./components/TaskRow";
import { formatApiError } from "./lib/api-error";
import { isOverdue, todayDateInputValue } from "./lib/date";
import { groupTasks, type StatusFilter } from "./lib/group-tasks";

export default function TasksView({ tasks }: { tasks: TaskDto[] }) {
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [importantOnly, setImportantOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] =
    useState<ProjectFilter>(PROJECT_FILTER_ALL);
  const [openTaskNumber, setOpenTaskNumber] = useState<number | null>(null);
  const [mode, setMode] = useState<"detail" | "edit">("detail");
  const [actionError, setActionError] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

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
        if (importantOnly && !t.important) return false;
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
  }, [tasks, filter, importantOnly, search, projectFilter]);

  const importantInScope = useMemo(() => {
    return tasks.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      return t.important;
    }).length;
  }, [tasks, filter]);

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

  useEffect(() => {
    // 編集/詳細モーダルが開いている間はそちらの Esc ハンドラに任せ、二重発火を避ける。
    if (!showNewTaskModal || openTaskNumber !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNewTaskModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showNewTaskModal, openTaskNumber]);

  const { mutate } = useSWRConfig();

  async function patchTask(taskNumber: number, patch: TaskPatchBody) {
    await apiFetchJson<TaskResponse>(apiKey, `/api/tasks/${taskNumber}`, {
      method: "PATCH",
      body: JSON.stringify({ ...patch, updatedAt: new Date().toISOString() }),
    });
    await mutate("/api/tasks");
  }

  async function createTask(body: TaskCreateBody) {
    await apiFetchJson<TaskResponse>(apiKey, "/api/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    });
    await mutate("/api/tasks");
  }

  // I2: toggle / quick action の失敗をユーザーに通知（EditModal は専用 UI があるので別経路）
  async function safePatch(taskNumber: number, patch: TaskPatchBody) {
    try {
      await patchTask(taskNumber, patch);
      setActionError(null);
    } catch (e) {
      setActionError(formatApiError(e));
    }
  }

  const tabs: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: "open", label: "Open", count: counts.open },
    { key: "done", label: "Done", count: counts.done },
    { key: "closed", label: "Closed", count: counts.closed },
    { key: "all", label: "All", count: counts.all },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {actionError && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(254,242,242,.9)",
            boxShadow: "inset 0 0 0 1px rgba(254,202,202,.8)",
            color: "#991b1b",
            fontSize: 13,
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx={12} cy={12} r={10} />
            <line x1={12} y1={8} x2={12} y2={12} />
            <line x1={12} y1={16} x2={12.01} y2={16} />
          </svg>
          <span style={{ flex: 1 }}>{actionError}</span>
          <button
            type="button"
            aria-label="閉じる"
            onClick={() => setActionError(null)}
            style={{
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: "#991b1b",
              fontSize: 16,
              lineHeight: 1,
              padding: "2px 6px",
            }}
          >
            ×
          </button>
        </div>
      )}
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
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowNewTaskModal(true)}
            style={{
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "inherit",
              background: "linear-gradient(90deg,#3525cd,#4f46e5)",
              color: "#fff",
              boxShadow: "0 2px 10px rgba(53,37,205,.22)",
            }}
          >
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
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Task
          </button>
        </div>
      </header>

      {/* Controls */}
      <ControlsBar
        tabs={tabs}
        filter={filter}
        onFilterChange={setFilter}
        importantOnly={importantOnly}
        onImportantOnlyChange={setImportantOnly}
        importantCount={importantInScope}
        search={search}
        onSearchChange={setSearch}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        projects={projects}
      />

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
                            doneAt: todayDateInputValue(),
                          };
                    await safePatch(r.taskNumber, next);
                  }}
                  onToggleImportant={async () => {
                    await safePatch(r.taskNumber, { important: !r.important });
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
                await safePatch(openTask.taskNumber, patch);
              }}
            />
          ) : (
            <EditModal
              sel={openTask}
              projects={projects.map((p) => p.name)}
              onCancel={() => setMode("detail")}
              onSave={async (patch) => {
                await patchTask(openTask.taskNumber, patch);
              }}
              onSaved={closeModal}
            />
          )}
        </ModalShell>
      )}

      {showNewTaskModal && (
        <ModalShell onClose={() => setShowNewTaskModal(false)}>
          <NewTaskModal
            projects={projects.map((p) => p.name)}
            onCancel={() => setShowNewTaskModal(false)}
            onCreate={createTask}
            onCreated={() => setShowNewTaskModal(false)}
          />
        </ModalShell>
      )}
    </div>
  );
}

