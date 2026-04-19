"use client";

import { useState } from "react";

import type {
  TaskDto,
  TaskPatchBody,
  TaskStatus,
} from "../../../lib/my-task-sync";
import { isOverdue } from "../lib/date";
import { fmtFull, fmtRelative } from "../lib/format";
import { MetaRow } from "./MetaRow";
import { QuickBtn } from "./QuickBtn";

export function DetailModal({
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
