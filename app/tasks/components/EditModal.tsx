"use client";

import { useEffect, useRef, useState } from "react";

import type {
  TaskDto,
  TaskPatchBody,
  TaskStatus,
} from "../../../lib/my-task-sync";
import { formatApiError } from "../lib/api-error";
import { CHEVRON_DATA_URL } from "../lib/chevron";
import { toDateInputValue, todayDateInputValue } from "../lib/date";

type SaveState = "idle" | "saving" | "saved" | "error";

export function EditModal({
  sel,
  projects,
  onCancel,
  onSave,
  onSaved,
}: {
  sel: TaskDto;
  projects: string[];
  onCancel: () => void;
  onSave: (patch: TaskPatchBody) => Promise<void>;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState({
    title: sel.title,
    status: sel.status,
    important: sel.important,
    due: toDateInputValue(sel.due),
    projectName: sel.projectName ?? "",
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

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

  // I3: ユーザーがフォームを編集したらエラー表示をクリア（"saved" 中は保持）
  const updateDraft = (patch: Partial<typeof draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    if (saveState === "error") {
      setSaveState("idle");
      setSaveError(null);
    }
  };

  const save = async () => {
    // I1: "saved"（400ms 窓）中の再実行を防止
    if (!dirty || saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    setSaveError(null);
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
      patch.due = draft.due ? draft.due : null;
    }
    if ((sel.projectName ?? "") !== draft.projectName) {
      patch.projectName = draft.projectName === "" ? null : draft.projectName;
    }
    if (patch.status === "done" && sel.status !== "done") {
      patch.doneAt = todayDateInputValue();
    } else if (patch.status === "open" && sel.status === "done") {
      patch.doneAt = null;
    }
    try {
      await onSave(patch);
      setSaveState("saved");
      closeTimerRef.current = setTimeout(() => {
        onSaved();
      }, 400);
    } catch (e) {
      setSaveState("error");
      setSaveError(formatApiError(e, "保存"));
    }
  };

  // I4: keydown listener を毎キーストロークで rebind しないよう save を ref 経由で参照
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const saving = saveState === "saving";
  const saved = saveState === "saved";
  const errored = saveState === "error";

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
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: "#191c1e",
          }}
        >
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
            onChange={(e) => updateDraft({ title: e.target.value })}
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
                  onClick={() => updateDraft({ status: s.k })}
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
              onChange={(e) => updateDraft({ due: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={labelStyle}>Project</p>
            <select
              value={draft.projectName}
              onChange={(e) =>
                updateDraft({ projectName: e.target.value })
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
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
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
            onClick={() => updateDraft({ important: !draft.important })}
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
            color: errored ? "#dc2626" : "rgba(70,69,85,.4)",
          }}
        >
          {errored && saveError ? (
            <>
              <svg
                width={11}
                height={11}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ verticalAlign: "-1px", marginRight: 4 }}
              >
                <circle cx={12} cy={12} r={10} />
                <line x1={12} y1={8} x2={12} y2={12} />
                <line x1={12} y1={16} x2={12.01} y2={16} />
              </svg>
              {saveError}
            </>
          ) : (
            <>
              <span style={{ fontFamily: "SF Mono, monospace" }}>⌘↵</span> で保存
              ·{" "}
              <span style={{ fontFamily: "SF Mono, monospace" }}>Esc</span>{" "}
              で閉じる
            </>
          )}
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
