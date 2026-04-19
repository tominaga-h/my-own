"use client";

import { useState } from "react";

import type { TaskDto } from "../../../lib/my-task-sync";
import { isOverdue } from "../lib/date";
import { fmtShort } from "../lib/format";

export function TaskRow({
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
          fontFamily: "SF Mono, ui-monospace, Menlo, Consolas, monospace",
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
