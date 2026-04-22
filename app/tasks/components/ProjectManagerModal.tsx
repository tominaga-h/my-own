"use client";

import { useState } from "react";

import type { ProjectDto } from "../../../lib/my-task-sync";
import { ApiError } from "../../../lib/api-client";

/**
 * upstream が返す「project has N tasks」を日本語に整形する。
 * パースに失敗したら元メッセージをそのまま返す。
 */
function formatDeleteError(e: unknown): string {
  if (e instanceof ApiError) {
    const msg = e.message;
    const m = msg.match(/project has (\d+) tasks/);
    if (m) return `${m[1]}件のタスクが紐づいているため削除できません`;
    if (e.status === 409) return msg;
    if (e.status === 404) return "プロジェクトが見つかりません";
    if (e.status === 401 || e.status === 403) return "認証エラー";
    return msg || `削除に失敗しました (HTTP ${e.status})`;
  }
  return "削除に失敗しました";
}

function formatMutateError(e: unknown, verb: string): string {
  if (e instanceof ApiError) {
    if (e.status === 409) return e.message || "同名のプロジェクトが既に存在します";
    if (e.status === 400) return e.message || "入力内容を確認してください";
    if (e.status === 404) return "プロジェクトが見つかりません";
    if (e.status === 401 || e.status === 403) return "認証エラー";
    return e.message || `${verb}に失敗しました (HTTP ${e.status})`;
  }
  return `${verb}に失敗しました`;
}

export function ProjectManagerModal({
  projects,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: {
  projects: ProjectDto[];
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [rowError, setRowError] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const setErrorFor = (id: number, msg: string | null) => {
    setRowError((prev) => {
      const next = { ...prev };
      if (msg === null) delete next[id];
      else next[id] = msg;
      return next;
    });
  };

  const canCreate = newName.trim().length > 0 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setCreateError(null);
    try {
      await onCreate(newName.trim());
      setNewName("");
    } catch (e) {
      setCreateError(formatMutateError(e, "追加"));
    } finally {
      setCreating(false);
    }
  };

  const beginEdit = (p: ProjectDto) => {
    setEditingId(p.id);
    setEditingName(p.name);
    setErrorFor(p.id, null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (id: number) => {
    const trimmed = editingName.trim();
    if (trimmed.length === 0) {
      setErrorFor(id, "名前を入力してください");
      return;
    }
    setBusyId(id);
    setErrorFor(id, null);
    try {
      await onUpdate(id, trimmed);
      setEditingId(null);
      setEditingName("");
    } catch (e) {
      setErrorFor(id, formatMutateError(e, "更新"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (p: ProjectDto) => {
    if (!window.confirm(`\`${p.name}\` を削除しますか？`)) return;
    setBusyId(p.id);
    setErrorFor(p.id, null);
    try {
      await onDelete(p.id);
    } catch (e) {
      setErrorFor(p.id, formatDeleteError(e));
    } finally {
      setBusyId(null);
    }
  };

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

  const pillButton = (
    variant: "primary" | "ghost" | "danger",
    disabled?: boolean,
  ): React.CSSProperties => {
    const base: React.CSSProperties = {
      border: "none",
      cursor: disabled ? "default" : "pointer",
      padding: "7px 14px",
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 500,
      fontFamily: "inherit",
      opacity: disabled ? 0.5 : 1,
    };
    if (variant === "primary") {
      return {
        ...base,
        background: "linear-gradient(90deg,#3525cd,#4f46e5)",
        color: "#fff",
        boxShadow: "0 2px 10px rgba(53,37,205,.22)",
      };
    }
    if (variant === "danger") {
      return {
        ...base,
        background: "rgba(254,242,242,.9)",
        color: "#b91c1c",
        boxShadow: "inset 0 0 0 1px rgba(254,202,202,.8)",
      };
    }
    return {
      ...base,
      background: "rgba(242,244,246,.8)",
      color: "#464555",
      boxShadow: "inset 0 0 0 1px rgba(226,232,240,.7)",
    };
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
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v10l9 4 9-4V7" />
        </svg>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: "#191c1e",
          }}
        >
          プロジェクト管理
        </h2>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onClose}
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

      {/* Body */}
      <div
        style={{
          padding: "20px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        {/* 追加フォーム */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={labelStyle}>新規プロジェクト</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (createError) setCreateError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreate();
                }
              }}
              placeholder="プロジェクト名"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!canCreate}
              style={pillButton("primary", !canCreate)}
            >
              {creating ? "追加中…" : "追加"}
            </button>
          </div>
          {createError && (
            <p
              role="alert"
              style={{
                margin: "6px 2px 0",
                fontSize: 12,
                color: "#b91c1c",
              }}
            >
              {createError}
            </p>
          )}
        </div>

        {/* 一覧 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={labelStyle}>一覧 ({projects.length})</p>
          {projects.length === 0 ? (
            <p
              style={{
                margin: "6px 2px",
                fontSize: 13,
                color: "rgba(70,69,85,.5)",
              }}
            >
              プロジェクトがまだありません
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {projects.map((p) => {
                const editing = editingId === p.id;
                const busy = busyId === p.id;
                const err = rowError[p.id];
                return (
                  <li
                    key={p.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "rgba(242,244,246,.5)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {editing ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void saveEdit(p.id);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEdit();
                            }
                          }}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                      ) : (
                        <span
                          style={{
                            flex: 1,
                            fontSize: 13.5,
                            color: "#191c1e",
                            fontWeight: 500,
                          }}
                        >
                          {p.name}
                        </span>
                      )}
                      {editing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void saveEdit(p.id)}
                            disabled={busy}
                            style={pillButton("primary", busy)}
                          >
                            {busy ? "保存中…" : "保存"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={busy}
                            style={pillButton("ghost", busy)}
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => beginEdit(p)}
                            disabled={busy}
                            style={pillButton("ghost", busy)}
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(p)}
                            disabled={busy}
                            style={pillButton("danger", busy)}
                          >
                            削除
                          </button>
                        </>
                      )}
                    </div>
                    {err && (
                      <p
                        role="alert"
                        style={{
                          margin: "2px 2px 0",
                          fontSize: 12,
                          color: "#b91c1c",
                        }}
                      >
                        {err}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
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
          justifyContent: "flex-end",
          borderTop: "1px solid rgba(226,232,240,.7)",
          background: "rgba(248,250,252,.6)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={pillButton("ghost")}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
